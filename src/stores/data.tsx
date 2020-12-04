import React from 'react'
import {observable, action, decorate, computed} from 'mobx'
import mongoose from 'mongoose'
import {wsDomain, serverDomain} from '../common/config'
import db from '../common/db'
import axios from '../common/request'
import {Icon} from 'antd'
import {DataType, ITask, IList, WsMsgDataProps, IStep, ILinkedEntitie} from './types'

class data implements DataType {
  ws: any = null
  checkTimer: NodeJS.Timeout | null = null
  myday_showCompleted = true
  important_showCompleted = true
  planned_showCompleted = true
  assign_showCompleted = true
  inbox_showCompleted = true
  user = null
  users = []
  tasks: ITask[] = []
  lists: IList[] = []
  mydaySortType = 0
  mydaySortASC = true
  inboxSortType = 0
  inboxSortASC = true

  birthYear = null
  birthMonth = null
  birthDay = null
  country = null
  sex = null
  postalCode = null
  timezoom = null

  get myday(): IList {
    return {
      _id: 'myday',
      title: '我的一天',
      // @ts-ignore
      icon: <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3838" width="1em"
                 height="1em">
        <path
          d="M480 96v160h64V96zM240 195.008L195.008 240l112.992 114.016 46.016-46.016z m544 0l-114.016 112.992 46.016 46.016L828.992 240zM512 288c-123.36 0-224 100.64-224 224s100.64 224 224 224 224-100.64 224-224-100.64-224-224-224z m0 64c88.736 0 160 71.264 160 160s-71.264 160-160 160-160-71.264-160-160 71.264-160 160-160zM96 480v64h160v-64z m672 0v64h160v-64zM308 670.016L195.008 784 240 828.992l114.016-112.992z m408 0l-46.016 45.984 114.016 112.992 44.992-44.992zM480 768v160h64v-160z"
          p-id="3839" fill="#767678"></path>
      </svg>,
      defaultList: true,
      sort_type: this.mydaySortType,
      sort_asc: this.mydaySortASC,
      show_completed: this.myday_showCompleted,
      tasks: this.tasks.filter(task => task.myDay)
    }
  }

  get important(): IList {
    return {
      _id: 'important',
      title: '重要',
      // @ts-ignore
      icon: <Icon type="star"/>,
      defaultList: true,
      sharing_status: 'NotShare',
      sort_type: -1,
      show_completed: this.important_showCompleted,
      theme: 'blue',
      tasks: this.tasks.filter(task => task.importance)
    }
  }

  get planned(): IList {
    return {
      _id: 'planned',
      title: '已计划日程',
      // @ts-ignore
      icon: <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8197" width="1em"
                 height="1em">
        <path
          d="M288 128v32H160v704h704V160h-128V128h-64v32H352V128zM224 224h64v32h64V224h320v32h64V224h64v64H224z m0 128h576v448H224z m192 64v64h64v-64z m128 0v64h64v-64z m128 0v64h64v-64zM288 544v64h64v-64z m128 0v64h64v-64z m128 0v64h64v-64z m128 0v64h64v-64zM288 672v64h64v-64z m128 0v64h64v-64z m128 0v64h64v-64z"
          p-id="8198" fill="#767678"></path>
      </svg>,
      defaultList: true,
      sharing_status: 'NotShare',
      sort_type: -1,
      show_completed: this.planned_showCompleted,
      theme: 'red',
      tasks: this.tasks.filter(task => task.reminder || task.recurrence || task.due_date)
    }
  }

  get assigned_to_me(): IList {
    return {
      _id: 'assigned_to_me',
      title: '已分配给你',
      // @ts-ignore
      icon: <Icon type="user"/>,
      defaultList: true,
      sharing_status: 'Open',
      sort_type: -1,
      show_completed: this.assign_showCompleted,
      theme: 'green',
      tasks: this.tasks.filter(task => task.assignment && localStorage.user && task.assignment.assignee === JSON.parse(localStorage.user).user_id)
    }
  }

  get inbox(): IList {
    return {
      _id: 'inbox',
      title: '任务',
      // @ts-ignore
      icon: <Icon type="home"/>,
      defaultList: true,
      sharing_status: 'NotShare',
      sort_type: this.inboxSortType,
      sort_asc: this.inboxSortASC,
      show_completed: this.inbox_showCompleted,
      theme: 'skyblue',
      tasks: this.tasks.filter(task => task.list_id === '000000000000000000000000')
    }
  }

  getAction = {
    getLists: async () => {
      let lists = await db.get('lists')
      lists.map((list: IList) => list.tasks = this.tasks.filter(task => task.list_id === list._id))
      this.lists = lists
    },

    /**
     * @brief 读取 IndexedDB 内的任务
     */
    getTasks: async () => {
      this.tasks = await db.get('tasks')
    },

    /**
     * @brief 获取用户列表
     */
    getUsers: async () => {
      if (!localStorage.user) localStorage.href = '/user/login'
      const {user_id} = JSON.parse(localStorage.user)
      const res = await axios.get(`/user/list?user_id=${user_id}`)
      const {code, data} = res.data
      if (code === 1) this.users = data
    }
  }

  setAction = {
    setUser: async () => this.user = JSON.parse(localStorage.user),

    setChange: async (change_type: string, target_type: string, target: string) => {
      const now = Date.now()
      const data = {
        change_type,
        target_type,
        target,
        time: now,
        ws_id: this.ws !== null ? this.ws.id : now
      }
      await db.insert('changes', data)
      if (this.ws !== null && this.ws.readyState === this.ws.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'update',
          data: [data]
        }))
      }
    }
  }

  wsAction = {
    initWs: async () => {
      if (this.ws !== null) return
      if (!localStorage.user) return
      const user_id = JSON.parse(localStorage.user).user_id
      this.ws = new WebSocket(wsDomain)
      this.ws.onopen = async () => {
        this.ws.id = Date.now()
        this.ws.send(JSON.stringify({
          type: 'identity',
          data: {
            id: this.ws.id,
            user_id: user_id
          }
        }))
        const changes = await db.get('changes')
        if (changes.length > 0) {
          this.ws.send(JSON.stringify({
            type: 'update',
            data: changes
          }))
        }
        this.ws.send(JSON.stringify({
          type: 'fetch',
          data: user_id
        }))
        if (this.checkTimer !== null) {
          clearInterval(this.checkTimer)
        }
        this.checkTimer = setInterval(this.wsAction.checkConnecting, 15000)
      }
      this.ws.onmessage = (msg: MessageEvent) => this.wsAction.onReceiveMessage(msg)
      this.ws.onerror = () => {
        if (this.checkTimer !== null) {
          clearInterval(this.checkTimer)
        }
        this.wsAction.checkConnecting()
      }
      this.ws.onclose = () => {
        if (this.checkTimer !== null) {
          clearInterval(this.checkTimer)
        }
        this.ws = null
      }
    },

    onReceiveMessage: async (raw: MessageEvent) => {
      let json: WsMsgDataProps | any = {};
      try {
        json = JSON.parse(raw.data);
      } catch (e) {
        console.log(e)
      }
      switch (json.type) {
        case 'pong':
          console.log(`[${new Date().toTimeString()}] [connectivity] Connection is OK`)
          break
        case 'fetchSuccess':
          await db.initDB()
          const oldTasks: ITask[] = await db.get('tasks')
          const oldLists: IList[] = await db.get('lists')
          oldTasks.map(async task => {
            if (!json.data.tasks.includes(task)) {
              await db.delete('tasks', task.local_id)
            }
          })
          oldLists.map(async list => {
            if (!json.data.lists.includes(list)) {
              await db.delete('lists', list.local_id)
            }
          })
          json.data.lists.map(async (list: IList) => {
            list.local_id = mongoose.Types.ObjectId(list._id).toHexString()
            await db.update('lists', list)
          })
          json.data.tasks.map(async (task: ITask) => {
            task.local_id = mongoose.Types.ObjectId(task._id).toHexString()
            await db.update('tasks', task)
          })
          await this.getAction.getTasks()
          await this.getAction.getLists()
          break
        case 'updateSuccess':
          await db.delete('changes', json.data)
          break
        case 'update':
          const tableName = json.data.target_type === 'list' ? 'lists' : 'tasks'
          switch (json.data.change_type) {
            case 'add':
              await db.insert(tableName, json.data.target)
              break
            case 'update':
              await db.update(tableName, json.data.target)
              break
            case 'delete':
              await db.delete(tableName, json.data.target)
          }
          await this.getAction.getTasks()
          await this.getAction.getLists()
          break
      }
    },

    checkConnecting: () => {
      console.log(`[${new Date().toTimeString()}] [connectivity] Checking connection`)
      if (this.ws.readyState !== this.ws.CONNECTING) {
        this.ws.send(JSON.stringify({type: 'ping'}))
      }
      if (this.ws.readyState !== this.ws.OPEN) {
        console.log(`[${new Date().toTimeString()}] [connectivity] connection terminated, try to reconnecting...`)
        setTimeout(this.wsAction.initWs, 3000)
      }
    }
  }

  listAction = {
    addList: async (title: string) => {
      // 按 position 大小重置所有清单
      this.lists.slice().sort((a, b) => a.position - b.position).map(async (list, index) => {
        await db.update('lists', {
          ...JSON.parse(JSON.stringify(list)),
          position: (index + 1) * 4096000
        })
        await this.setAction.setChange('update', 'list', JSON.stringify({
          ...list,
          position: (index + 1) * 4096000
        }))
      })
      const newId = mongoose.Types.ObjectId()
      let newList = {
        local_id: newId.toHexString(),
        _id: newId.toHexString(),
        title,
        owner_id: JSON.parse(localStorage.user).user_id,
        created_at: new Date().toISOString(),
        show_completed: true,
        sharing_status: "NotShare",
        invitation_token: null,
        members: [],
        sort_type: 0,
        sort_asc: true,
        theme: 'blue',
        position: 0
      }
      await db.insert('lists', newList)
      await this.setAction.setChange('add', 'list', JSON.stringify(newList))
      await this.getAction.getLists()
    },

    deleteList: async (list_id: string) => {
      let tasks: ITask[] = []
      do {
        tasks = await db.get('tasks', list_id, 'list_id')
        if (tasks[0]) {
          await db.delete('tasks', tasks[0].local_id)
          await this.setAction.setChange('delete', 'task', tasks[0]._id)
        }
      } while (tasks[0])
      await db.delete('lists', list_id)
      await this.setAction.setChange('delete', 'list', list_id)
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    cloneInbox: async () => {
      this.lists.slice().sort((a, b) => a.position - b.position).map(async (list, index) => {
        await db.update('lists', {
          ...JSON.parse(JSON.stringify(list)),
          position: (index + 1) * 4096000
        })
        await this.setAction.setChange('update', 'list', JSON.stringify({
          ...list,
          position: (index + 1) * 4096000
        }))
      })
      const newListId = mongoose.Types.ObjectId()
      const newList = {
        local_id: newListId.toHexString(),
        _id: newListId.toHexString(),
        title: '任务',
        owner_id: JSON.parse(localStorage.user).user_id,
        created_at: new Date().toISOString(),
        show_completed: true,
        sharing_status: 'NotShare',
        invitation_token: null,
        members: [],
        sort_type: 0,
        sort_asc: true,
        theme: 'blue',
        position: 0
      }
      await db.insert('lists', newList)
      await this.setAction.setChange('add', 'list', JSON.stringify(newList))

      this.inbox.tasks?.slice().sort((a, b) => a.position - b.position).map(async (task, index, arr) => {
        const newId = mongoose.Types.ObjectId()
        let newTask = {
          ...JSON.parse(JSON.stringify(task)),
          local_id: newId.toHexString(),
          _id: newId.toHexString(),
          list_id: newListId.toHexString(),
          created_by: JSON.parse(localStorage.user).user_id,
          created_at: new Date().toISOString(),
          position: index * 4096000
        }
        await db.insert('tasks', newTask)
        await this.setAction.setChange('add', 'task', JSON.stringify(newTask))
      })
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    cloneList: async (list: IList) => {
      this.lists.slice().sort((a, b) => a.position - b.position).map(async (l, index) => {
        await db.update('lists', {
          ...JSON.parse(JSON.stringify(l)),
          position: (index + 1) * 4096000
        })
        await this.setAction.setChange('update', 'list', JSON.stringify({
          ...l,
          position: (index + 1) * 4096000
        }))
      })
      const newListId = mongoose.Types.ObjectId()
      const newList = {
        ...list,
        local_id: newListId.toHexString(),
        _id: newListId.toHexString(),
        owner_id: JSON.parse(localStorage.user).user_id,
        created_at: new Date().toISOString(),
        sharing_status: 'NotShare',
        invitation_token: null,
        members: [],
        sort_type: 0,
        sort_asc: true,
        position: 0
      }
      delete newList.tasks
      await db.insert('lists', newList)
      await this.setAction.setChange('add', 'list', JSON.stringify(newList))

      list.tasks?.slice().sort((a, b) => a.position - b.position).map(async (task, index, arr) => {
        const newId = mongoose.Types.ObjectId()
        let newTask = {
          ...JSON.parse(JSON.stringify(task)),
          local_id: newId.toHexString(),
          _id: newId.toHexString(),
          list_id: newListId.toHexString(),
          created_by: JSON.parse(localStorage.user).user_id,
          created_at: new Date().toISOString(),
          position: index * 4096000
        }
        await db.insert('tasks', newTask)
        await this.setAction.setChange('add', 'task', JSON.stringify(newTask))
      })
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    changeListShowCompleted: async (list: IList) => {
      if (list.defaultList) {
        switch (list._id) {
          case 'myday':
            this.myday_showCompleted = !this.myday_showCompleted
            break
          case 'important':
            this.important_showCompleted = !this.important_showCompleted
            break
          case 'planned':
            this.planned_showCompleted = !this.planned_showCompleted
            break
          case 'assigned_to_me':
            this.assign_showCompleted = !this.assign_showCompleted
            break
          case 'inbox':
            this.inbox_showCompleted = !this.inbox_showCompleted
        }
      } else {
        list.show_completed = !list.show_completed
        await db.update('lists', JSON.parse(JSON.stringify(list)))
        await this.setAction.setChange('update', 'list', JSON.stringify(list))
      }
      await this.getAction.getLists()
    },

    changeListTheme: async (list: IList, theme: string) => {
      list.theme = theme
      await db.update('lists', JSON.parse(JSON.stringify(list)))
      await this.setAction.setChange('update', 'list', JSON.stringify(list))
      await this.getAction.getLists()
    },

    changeListSortType: async (list: IList, sort_type: number) => {
      if (list._id === 'myday') {
        this.mydaySortType = sort_type
        this.mydaySortASC = true
      } else if (list._id === 'inbox') {
        this.inboxSortType = sort_type
        this.inboxSortASC = true
      } else {
        list.sort_type = sort_type
        list.sort_asc = true
        await db.update('lists', JSON.parse(JSON.stringify(list)))
        await this.setAction.setChange('update', 'list', JSON.stringify(list))
        await this.getAction.getLists()
      }
    },

    changeListSortAsc: async (list: IList) => {
      if (list._id === 'myday') {
        this.mydaySortASC = !this.mydaySortASC
      } else if (list._id === 'inbox') {
        this.inboxSortASC = !this.inboxSortASC
      } else {
        list.sort_asc = !list.sort_asc
        await db.update('lists', JSON.parse(JSON.stringify(list)))
        await this.setAction.setChange('update', 'list', JSON.stringify(list))
        await this.getAction.getLists()
      }
    },

    renameList: async (list: IList, title: string) => {
      list.title = title

      await db.update('lists', JSON.parse(JSON.stringify(list)))
      await this.setAction.setChange('update', 'list', JSON.stringify(list))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    openShare: async (list: IList) => {
      if (!localStorage.user) window.location.href = '/user/login?msgType=-1'
      const user_id = JSON.parse(localStorage.user).user_id
      const res = await axios.post(`${serverDomain}list/share/open`, {
        user_id,
        list_id: list._id
      })

      if (res.data.code === 1) {
        list.sharing_status = 'Open'
        list.invitation_token = res.data.data.invitation_token
      }
      await db.update('lists', JSON.parse(JSON.stringify(list)))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    limitShare: async (list: IList) => {
      if (list.sharing_status === 'Limit') return this.listAction.openShare(list)
      list.sharing_status = 'Limit'
      list.invitation_token = null
      let l = JSON.parse(JSON.stringify(list))
      delete l.tasks
      await db.update('lists', JSON.parse(JSON.stringify(l)))
      await this.setAction.setChange('update', 'list', JSON.stringify(l))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    closeShare: async (list: IList) => {
      let l = JSON.parse(JSON.stringify(list))
      l.sharing_status = 'NotShare'
      l.invitation_token = null
      l.members = []
      delete l.tasks
      await db.update('lists', JSON.parse(JSON.stringify(l)))
      await this.setAction.setChange('closeShare', 'list', JSON.stringify(l))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    removeMember: async (member_id: string, list: IList) => {
      list.members = list.members.filter(member => member !== member_id)
      await db.update('lists', JSON.parse(JSON.stringify(list)))
      await this.setAction.setChange('removeMember', 'list', JSON.stringify(list))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    joinList: async (user_id: string, list_id: string) => {
      return new Promise(async (resolve, reject) => {
        const res = await axios.post('/list/share/join', {
          user_id,
          list_id
        })
        const {code} = res.data
        if (code === 1) {
          await this.setAction.setChange('join', 'list', list_id)
          resolve(null)
        }
      })
    },

    leaveList: async (user_id: string, list: IList) => {
      let tasks: ITask[] = []
      do {
        tasks = await db.get('tasks', list._id, 'list_id')
        if (tasks[0]) {
          await db.delete('tasks', tasks[0].local_id)
        }
      } while (tasks[0])
      let l = JSON.parse(JSON.stringify(list))
      l.members = l.members.filter((member: string) => member !== user_id)
      delete l.tasks
      await db.delete('lists', list.local_id)
      await this.setAction.setChange('update', 'list', JSON.stringify(l))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    createNewListByTask: async (task: ITask) => {
      const listId = mongoose.Types.ObjectId()
      const newList = {
        local_id: listId.toHexString(),
        _id: listId.toHexString(),
        title: '无标题清单',
        owner_id: JSON.parse(localStorage.user).user_id,
        created_at: new Date().toISOString(),
        show_completed: true,
        sharing_status: "NotShare",
        invitation_token: null,
        members: [],
        sort_type: 0,
        sort_asc: true,
        theme: 'blue',
        position: 0
      }
      await db.insert('lists', newList)
      await this.setAction.setChange('add', 'list', JSON.stringify(newList))
      task.list_id = listId
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 清单拖拽排序，将两个清单的位置互换
     *
     * @param a 清单对象 a
     * @param b 清单对象 b
     */
    swapListPosition: async (a: IList, b: IList) => {
      [a.position, b.position] = [b.position, a.position]
      await db.update('lists', JSON.parse(JSON.stringify(a)))
      await db.update('lists', JSON.parse(JSON.stringify(b)))
      await this.setAction.setChange('update', 'list', JSON.stringify(a))
      await this.setAction.setChange('update', 'list', JSON.stringify(b))
      await this.getAction.getLists()
    }
  }

  taskAction = {
    /**
     * @brief 添加任务
     *
     * @param fromlist 添加任务的目标清单 id
     * @param title 任务标题
     */
    addTask: async (fromList: string, title: string) => {
      const newId = mongoose.Types.ObjectId()
      const newTask: ITask = {
        local_id: newId.toHexString(),
        _id: newId.toHexString(),
        title,
        list_id: '000000000000000000000000',
        created_by: JSON.parse(localStorage.user).user_id,
        created_at: new Date().toISOString(),
        completed: false,
        completed_at: null,
        completed_by: null,
        importance: false,
        myDay: false,
        steps: [],
        reminder: null,
        recurrence: null,
        due_date: null,
        assignment: null,
        note: '',
        note_updated_at: null,
        linkedEntities: [],
        position: 0,
        today_position: 0
      }
      switch (fromList) {
        case 'myday':
          this.tasks.filter(task => task.myDay).sort((a: ITask, b: ITask) => a.today_position || 0 - (b.today_position || 0)).map(async (task, index) => {
            await db.update('tasks', {
              ...JSON.parse(JSON.stringify(task)),
              today_position: (index + 1) * 4096000
            })
            await this.setAction.setChange('update', 'task', JSON.stringify({
              ...task,
              today_position: (index + 1) * 4096000
            }))
          })
          newTask.myDay = true
          break
        case 'important':
          newTask.importance = true
          break
        case 'planned':
          newTask.due_date = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          break
        case 'inbox':
          this.tasks.filter(task => task.list_id === '000000000000000000000000').sort((a, b) => a.position - b.position).map(async (task, index) => {
            await db.update('tasks', {
              ...JSON.parse(JSON.stringify(task)),
              position: (index + 1) * 4096000
            })
            await this.setAction.setChange('update', 'task', JSON.stringify({
              ...task,
              position: (index + 1) * 4096000
            }))
          })
          break
        default:
          this.tasks.filter(task => task.list_id === fromList).sort((a, b) => a.position - b.position).map(async (task, index) => {
            await db.update('tasks', {
              ...JSON.parse(JSON.stringify(task)),
              position: (index + 1) * 4096000
            })
            await this.setAction.setChange('update', 'task', JSON.stringify({
              ...task,
              position: (index + 1) * 4096000
            }))
          })
          newTask.list_id = fromList
      }
      await db.insert('tasks', newTask)
      await this.setAction.setChange('add', 'task', JSON.stringify(newTask))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 给共享清单内的任务添加评论
     *
     * @param text 评论内容文本
     * @param user_id 用户编号
     * @param username 用户名
     * @param task 任务对象实体
     */
    addComment: async (comment: string, {user_id, username}, task: ITask) => {
      task.comments = [
        ...(task.comments || []),
        {
          comment,
          user_id,
          username,
          submit_at: new Date().toISOString()
        }
      ]
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 删除任务
     *
     * @param task_id 删除的任务 id
     */
    deleteTask: async (task_id: string) => {
      await db.delete('tasks', task_id)
      await this.setAction.setChange('delete', 'task', task_id)

      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 修改任务标题
     *
     * @param task 目标任务对象
     * @param title 新的标题
     */
    renameTask: async (task: ITask, title: string) => {
      task.title = title

      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 修改任务的完成属性
     *
     * @param task 目标任务对象
     */
    changeTaskCompleted: async (task: ITask) => {
      task.completed = !task.completed
      if (task.completed) {
        task.completed_at = new Date().toISOString()
        task.completed_by = JSON.parse(localStorage.user).user_id
        if (task.recurrence && !task.recurrence.ignore) {
          const newId = mongoose.Types.ObjectId()
          let newTask = {
            ...task,
            local_id: newId.toHexString(),
            _id: newId.toHexString(),
            created_by: JSON.parse(localStorage.user).user_id,
            created_at: new Date().toISOString(),
            completed: false,
            completed_at: null,
            completed_by: null,
          }
          const date = new Date(newTask.due_date || '')
          switch (newTask.recurrence?.type) {
            case 'Daily':
              newTask.due_date = new Date(date.getTime() + newTask.recurrence.interval * 24 * 3600 * 1000).toISOString()
              break
            case 'Weekly':
              if (newTask.recurrence.days_of_week.length > 0) {
                // 工作日
                const due_day = date.getDay()
                if (due_day !== 5 && due_day !== 6) {
                  newTask.due_date = new Date(date.getTime() + 24 * 3600 * 1000).toISOString()
                } else {
                  if (due_day === 5) {
                    newTask.due_date = new Date(date.getTime() + 3 * 24 * 3600 * 1000).toISOString()
                  } else {
                    newTask.due_date = new Date(date.getTime() + 2 * 24 * 3600 * 1000).toISOString()
                  }
                }
              } else {
                newTask.due_date = new Date(date.getTime() + newTask.recurrence.interval * 7 * 24 * 3600 * 1000).toISOString()
              }
              break
            case 'Monthly':
              if (date.getMonth() == 11) {
                newTask.due_date = new Date(date.getFullYear() + 1, 0, date.getDate()).toISOString()
              } else {
                newTask.due_date = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate()).toISOString()
              }
              break
            case 'Yearly':
              newTask.due_date = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate()).toISOString()
          }
          await db.insert('tasks', JSON.parse(JSON.stringify(newTask)))
          await this.setAction.setChange('add', 'task', JSON.stringify(newTask))
          task.recurrence.ignore = true
        }
      } else {
        task.completed_at = null
        task.completed_by = null
      }

      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 修改任务的重要属性
     *
     * @param task 目标任务对象
     */
    changeTaskImportance: async (task: ITask) => {
      task.importance = !task.importance
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 修改任务的 “我的一天” 属性
     *
     * @param task 目标任务对象
     */
    changeTaskMyday: async (task: ITask) => {
      task.myDay = !task.myDay
      task.today_position = task.myDay ? 0 : null
      this.tasks.slice().sort((a, b) => a.today_position || 0 - (b.today_position || 0)).map(async (task, index) => {
        task.today_position = (index + 1) * 4096000
        await db.update('tasks', JSON.parse(JSON.stringify(task)))
        await this.setAction.setChange('update', 'task', JSON.stringify(task))
      })
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 给任务添加步骤
     *
     * @param task 目标任务对象
     * @param text 新步骤的标题
     */
    addTaskStep: async (task: ITask, title: string) => {
      task.steps?.slice().sort((a, b) => a.position - b.position).map((step, index) => {
        step.position = (index + 1) * 4069000
      })
      task.steps?.push({
        title,
        completed: false,
        completed_at: null,
        created_at: new Date().toISOString(),
        position: 0
      })
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 删除任务指定步骤
     *
     * @param task 目标任务对象
     * @param step 要删除的任务步骤对象
     */
    deleteTaskStep: async (task: ITask, step: IStep) => {
      task.steps = task.steps?.filter(s => JSON.stringify(s) !== JSON.stringify(step)) || null
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 修改任务对应步骤的完成属性
     *
     * @param task 目标任务对象
     * @param step 要修改的步骤对象
     */
    changeStepCompleted: async (task: ITask, step: IStep) => {
      task.steps = task.steps?.map(s => {
        if (JSON.stringify(s) === JSON.stringify(step)) {
          s.completed = !step.completed
          if (s.completed) {
            s.completed_at = new Date().toISOString()
          } else {
            s.completed_at = null
          }
        }
        return s
      }) || null
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 设置或移除任务备注
     *
     * @param task 目标任务对象
     * @param note 新的备注，可以为空字符
     */
    setTaskNote: async (task: ITask, note: string) => {
      task.note = note
      if (task.note === '') {
        task.note_updated_at = null
      } else {
        task.note_updated_at = new Date().toISOString()
      }

      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 设置任务的提醒时间
     *
     * @param task 目标任务对象
     * @param ISODate ISO时间格式字符串，为空则取消提醒时间
     */
    setTaskReminder: async (task: ITask, ISODate: string) => {
      if (!ISODate) {
        task.reminder = null
      } else {
        const reminder = {
          type: '',
          snooze_time: 0,
          snoozed_at: '',
          is_snoozed: false,
          date: ISODate
        }
        task.reminder = reminder
      }
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 当到达任务的提醒时间时，将提醒时间推迟 5 分钟
     *
     * @param task 目标任务对象
     */
    snooze: async (task: ITask) => {
      if (task.reminder === null) return
      task.reminder.date = new Date(Date.now() + 5 * 60 * 1000).toISOString()
      task.reminder.snooze_time = task.reminder?.snooze_time || 0 + 1
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 设置任务的截止时间
     *
     * @param task 目标任务对象
     * @param ISODate ISO时间格式字符串，为空则取消截止时间
     */
    setTaskDueDate: async (task: ITask, ISODate: string) => {
      if (!ISODate) {
        // 移除截止日期
        task.due_date = null
        task.recurrence = null
      } else {
        task.due_date = ISODate
      }
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 设置任务的重复周期
     *
     * @param task 目标任务对象
     * @param recurrence_type 重复类型，为空则取消重复
     * @param interval 重复周期
     */
    setTaskRecurrence: async (task: ITask, recurrence_type: number, interval = 1) => {
      if (!recurrence_type) task.recurrence = null
      switch (recurrence_type) {
        case 1:
          task.recurrence = {
            days_of_week: [],
            interval,
            type: 'Daily',
            ignore: false
          }
          task.due_date = task.due_date || new Date().toISOString()
          break
        case 2:
          task.recurrence = {
            days_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            interval,
            type: 'Weekly',
            ignore: false
          }
          let due_date = task.due_date ? new Date(task.due_date) : new Date()
          // 工作日
          switch (due_date.getDay()) {
            case 0:
              due_date = new Date(due_date.getTime() + 24 * 60 * 60 * 1000)
              break
            case 6:
              due_date = new Date(due_date.getTime() + 2 * 24 * 60 * 60 * 1000)
              break
          }
          task.due_date = due_date.toISOString()
          break
        case 3:
          task.recurrence = {
            days_of_week: [],
            interval,
            type: 'Weekly',
            ignore: false
          }
          task.due_date = task.due_date || new Date().toISOString()
          break
        case 4:
          task.recurrence = {
            days_of_week: [],
            interval,
            type: 'Monthly',
            ignore: false
          }
          task.due_date = task.due_date || new Date().toISOString()
          break
        case 5:
          task.recurrence = {
            days_of_week: [],
            interval,
            type: 'Yearly',
            ignore: false
          }
          task.due_date = task.due_date || new Date().toISOString()
          break
      }
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 附件上传，成功后添加该附件到附件实体列表
     *
     * @param file 文件对象
     * @param task 目标任务对象
     */
    fileUpload: async (file: Blob, task: ITask) => {
      if (!localStorage.user) window.location.href = '/user/login?msgType=-1'
      const user_id = JSON.parse(localStorage.user).user_id
      let form = new FormData()
      form.append('file', file)
      const res = await axios.post(`/task/uploadFile?user_id=${user_id}`, form)
      const {code, data} = res.data
      if (code === 1) this.taskAction.addLinkedEntities(file, data, task)
    },

    /**
     * @brief 添加附件到附件实体列表
     *
     * @param file 文件对象
     * @param uploadResult 上传成功后服务器返回的结果
     * @param task 任务对象
     */
    addLinkedEntities: async (file: Blob, uploadResult: any, task: ITask) => {
      const linkedEntities: ILinkedEntitie = {
        weblink: uploadResult.url,
        extension: uploadResult.key.split(".").pop().toUpperCase(),
        display_name: uploadResult.key,
        preview: {
          size: file.size,
          content_type: file.type,
          content_description: {
            label: uploadResult.key.split(".").pop().toUpperCase()
          }
        }
      }
      if (!task.linkedEntities) task.linkedEntities = []
      task.linkedEntities.push(linkedEntities)
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 从附件实体列表中删除附件实体
     *
     * @param task 目标任务对象
     * @param file 要删除的附件对象
     */
    deleteLinkedEntitity: async (task: ITask, file: ILinkedEntitie) => {
      task.linkedEntities = task.linkedEntities?.filter(l => l.display_name !== file.display_name) || null
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 分配任务
     *
     * @param task 目标任务对象
     * @param assigner 分配发起人 id
     * @param assignee 被分配人 id
     */
    assignTask: async (task: ITask, assigner: string, assignee: string) => {
      if (!assigner && !assignee) {
        task.assignment = null
      } else {
        task.assignment = {
          assigner,
          assignee
        }
      }
      await db.update('tasks', JSON.parse(JSON.stringify(task)))
      await this.setAction.setChange('update', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 移动任务到指定清单
     *
     * @param task 目标任务对象
     * @param list_id 目标清单 id
     */
    moveTaskToList: async (task: ITask, list_id: string) => {
      try {
        task.list_id = list_id
        task.assignment = null
        await db.update('tasks', JSON.parse(JSON.stringify(task)))
        await this.setAction.setChange('update', 'task', JSON.stringify(task))
        await this.getAction.getTasks()
        await this.getAction.getLists()
      } catch (error) {
        console.log('MoveTaskToList: ' + error)
      }
    },

    /**
     * @brief 复制任务到指定清单
     *
     * @param task 目标任务对象
     * @param list_id 目标清代 id
     */
    cloneTaskToList: async (task: ITask, list_id: string) => {
      const taskId = mongoose.Types.ObjectId()
      const newTask = {
        ...task,
        local_id: taskId.toHexString(),
        _id: taskId.toHexString(),
        list_id,
        created_at: new Date().toISOString(),
        created_by: JSON.parse(localStorage.user).user_id,
        assignment: null,
        position: 0,
        today_position: 0
      }
      await db.insert('tasks', JSON.parse(JSON.stringify(newTask)))
      await this.setAction.setChange('add', 'task', JSON.stringify(task))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    },

    /**
     * @brief 任务拖拽排序，将两个任务的位置互换
     *
     * @param a 清单对象 a
     * @param b 清单对象 b
     */
    swapTaskPosition: async (a: ITask, b: ITask) => {
      [a.position, b.position] = [b.position, a.position]
      await db.update('tasks', JSON.parse(JSON.stringify(a)))
      await db.update('tasks', JSON.parse(JSON.stringify(b)))
      await this.setAction.setChange('update', 'task', JSON.stringify(a))
      await this.setAction.setChange('update', 'task', JSON.stringify(b))
      await this.getAction.getTasks()
      await this.getAction.getLists()
    }
  }

  /**
   * @brief 从奇妙清单导入清单数据
   *
   * @param code 奇妙清单导入页重定向回网站时 queryString 附带的参数
   */
  importFromWunderlist = async code => {
    const res1 = await axios.post('/user/importFromWunderList', {
      code,
      client_id: '6adde9030ff0b820f884',
      client_secret: 'fb73204bb89d05acf0b7357db848e6f00940e0f46926438a9ef20454fe0e'
    })
    if (res1.data.code !== 1) return
    const assess_token = res1.data.data
    const res2 = await axios.get('https://a.wunderlist.com/api/v1/lists', {
      headers: {
        'X-Access-Token': assess_token,
        'X-Client-ID': '6adde9030ff0b820f884'
      }
    })
    res2.data.map(async l => {
      const res3 = await axios.get(`https://a.wunderlist.com/api/v1/tasks?list_id=${l.id}`, {
        headers: {
          'X-Access-Token': assess_token,
          'X-Client-ID': '6adde9030ff0b820f884'
        }
      })
      const listId = mongoose.Types.ObjectId()
      await res3.data.map(async task => {
        const newId = mongoose.Types.ObjectId()
        const newTask = {
          local_id: newId.toHexString(),
          _id: newId.toHexString(),
          title: task.title,
          list_id: listId.toHexString(),
          created_by: JSON.parse(localStorage.user).user_id,
          created_at: task.created_at,
          completed: false,
          completed_at: null,
          completed_by: null,
          importance: task.starred,
          myDay: false,
          steps: [],
          reminder: null,
          recurrence: null,
          due_date: task.due_date || null,
          assignment: null,
          note: '',
          note_updated_at: null,
          linkedEntities: [],
          position: 0,
          today_position: 0
        }
        await db.insert('tasks', newTask)
        await this.setAction.setChange('add', 'task', JSON.stringify(newTask))
      })
      const newList = {
        local_id: listId.toHexString(),
        _id: listId.toHexString(),
        title: l.title,
        owner_id: JSON.parse(localStorage.user).user_id,
        created_at: l.created_at,
        show_completed: true,
        sharing_status: "NotShare",
        invitation_token: null,
        members: [],
        sort_type: 0,
        sort_asc: true,
        theme: 'blue',
        position: 0
      }
      await db.insert('lists', newList)
      await this.setAction.setChange('add', 'list', JSON.stringify(newList))
    })
    await this.getAction.getTasks()
    await this.getAction.getLists()
  }

  /**
   * @brief 将导入的 JSON 中的清单和任务进行持久化
   *
   * @param tasks 导入的任务数据
   * @param lists 导入的清单数据
   */
  import = async ({lists, tasks}: { lists: IList[], tasks: ITask[] }) => {
    this.lists.slice().sort((a, b) => a.position - b.position).map(async (l, index) => {
      await db.update('lists', {
        ...JSON.parse(JSON.stringify(l)),
        position: (index + lists.length) * 4096000
      })
      await this.setAction.setChange('update', 'list', JSON.stringify({
        ...l,
        position: (index + lists.length) * 4096000
      }))
    })
    lists.map(async (list, index) => {
      const newListId = mongoose.Types.ObjectId()
      tasks.map(async task => {
        if (task.list_id !== list._id) return
        const taskId = mongoose.Types.ObjectId()
        task = {
          ...task,
          local_id: taskId.toHexString(),
          _id: taskId.toHexString(),
          list_id: newListId.toHexString(),
          position: 0
        }
        await db.insert('tasks', task)
        await this.setAction.setChange('add', 'task', JSON.stringify(task))
      })
      list = {
        ...list,
        local_id: newListId.toHexString(),
        _id: newListId.toHexString(),
        position: index * 4096000
      }
      await db.insert('lists', list)
      await this.setAction.setChange('add', 'list', JSON.stringify(list))
    })
    await this.getAction.getTasks()
    await this.getAction.getLists()
  }
}

// @ts-ignore
decorate(data, {
  ws: observable,
  user: observable,
  users: observable,
  tasks: observable,
  lists: observable,
  myday_showCompleted: observable,
  important_showCompleted: observable,
  planned_showCompleted: observable,
  assign_showCompleted: observable,
  inbox_showCompleted: observable,
  mydaySortType: observable,
  mydaySortASC: observable,
  inboxSortType: observable,
  inboxSortASC: observable,
  birthYear: observable,
  birthMonth: observable,
  birthDay: observable,
  country: observable,
  sex: observable,
  postalCode: observable,
  timezoom: observable,
  myday: computed,
  important: computed,
  planned: computed,
  assigned_to_me: computed,
  inbox: computed,
  getLists: action,
  addList: action,
  deleteList: action,
  cloneList: action,
  renameList: action,
  cloneInbox: action,
  changeListSortType: action,
  changeListSortAsc: action,
  openShare: action,
  limitShare: action,
  closeShare: action,
  removeMember: action,
  joinList: action,
  leaveList: action,
  assignTask: action,
  getTasks: action,
  addTask: action,
  deleteTask: action,
  changeTaskCompleted: action,
  changeTaskImportance: action,
  changeTaskMyday: action,
  addTaskStep: action,
  addComment: action,
  deleteTaskStep: action,
  changeStepCompleted: action,
  renameTask: action,
  snooze: action,
  setTaskNote: action,
  changeListShowCompleted: action,
  setTaskReminder: action,
  setTaskDueDate: action,
  setTaskRecurrence: action,
  initWs: action,
  fileUpload: action,
  addLinkedEntities: action,
  deleteLinkedEntitity: action,
  changeListTheme: action,
  importFromWunderlist: action,
  createNewListByTask: action,
  moveTaskToList: action,
  cloneTaskToList: action,
  getUsers: action,
  import: action,
  swapListPosition: action,
  swapTaskPosition: action,
  setUser: action
})


export default new data()
