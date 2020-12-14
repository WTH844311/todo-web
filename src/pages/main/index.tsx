import './styles/index.css'
import './components/Lists/index.css'
import './components/Tasks/index.css'
import './components/TaskDetail/index.css'
import './styles/theme.css'
import React, {FC, useEffect, useState} from 'react'
import {observer, inject} from 'mobx-react'
import {withRouter} from 'react-router-dom';
import ContextMenu from './components/contextMenu/index'
import Modal from './components/Modal/index'
import ListStatisticsModal from './components/listStatisticsModal/index'
import AccountDrawer from './components/accountDrawer/index'
import SettingDrawer from './components/settingDrawer/index'
import db from '../../common/db'
import {IMobxStore} from './type'
import {IList, ITask} from '../../stores/types'
import Header from './components/Header'
import Lists from './components/Lists'
import Tasks from './components/Tasks'
import TaskDetail from './components/TaskDetail'

const Main: FC<IMobxStore> = ({ data, history, match }) => {

  let reminderTimer: NodeJS.Timeout | null = null;

  const [fromTask, setFromTask] = useState<ITask | null>(null)
  const [reminderList, setReminderList] = useState<any>([])
  const [listRenameInputVisible, setListRenameInputVisible] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchData, setSearchData] = useState(null)

  const {
    myday,
    important,
    planned,
    assigned_to_me,
    inbox,
    lists,
    tasks,
    users,
    user
  } = data

  /**
   * 1. 检测登录状态
   * 2. 读取用户列表
   * 3. 读取缓存数据
   * 4. 与服务器建立 websocket 连接
   * 5. 其他
   */
  useEffect(() => {
    const {wsAction, getAction, setAction, users, ws, user} = data
    if (!localStorage.token || !localStorage.user) return history.push('/user/login')
    if (!localStorage.setting) {
      localStorage.setting = JSON.stringify({
        sound: true
      })
    }
    if (!user) setAction.setUser()
    if (users.length === 0) getAction.getUsers()
    db.initDB().then(async ok => {
      if (ok === true) {
        /**
         * initWs 是一个耗时操作，故在调用之前先获取本地数据库的数据，提高用户体验
         * @todo 目前的问题：initWs完成前，用户无法进行数据操作
         */
        await getAction.getTasks()
        await getAction.getLists()
        if (!ws) wsAction.initWs()
      }
    })
    window.addEventListener('click', handleClick)
    reminderTimer = setInterval(processReminderTask, 60 * 1000)

    return () => {
      window.removeEventListener('click', handleClick)
      reminderTimer && clearInterval(reminderTimer)
    }
  }, [])

  useEffect(() => {
    if (!searchValue) return setSearchData(null)
    const result = {
      tasks: tasks.filter(t => t.title.includes(searchValue)),
      note: tasks.filter(t => t.note && t.note.includes(searchValue)),
      step: tasks.filter(t => t.steps && t.steps.length > 0 && t.steps.find(s => s.title.includes(searchValue)))
    }
    setSearchData(JSON.parse(JSON.stringify(result)))
  }, [searchValue])

  const processReminderTask = () => {
    if (data.tasks.length > 0) {
      data.tasks.map(t => {
        if (!t.completed && (t.reminder && t.reminder.date)) {
          const time = Date.now() - new Date(t.reminder.date).getTime()
          if (time < 60 * 1000 && time > 0) {
            setReminderList([...reminderList.filter(rt => rt._id !== t._id), t])
          }
        }
      })
    }
  }

  // 全局 click 事件拦截
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLDivElement;
    switch (true) {
      case target.classList.contains('step-title') || target.classList.contains('editableContent-display') || target.classList.contains('step'):
        const list = document.getElementsByClassName('step')
        for (var i = 0; i < list.length; i++) {
          list[i].classList.remove('selected')
        }
        const index = +target.id.charAt(target.id.length - 1)
        document.getElementById(`step-${index}`)?.classList.add('selected')
        break
    }
  }


  if (!users) return null
  const {list_index, task_id} = match.params
  const selected_task = tasks.find(task => task.local_id === task_id)
  const selected_list: IList = [myday, important, planned, assigned_to_me, inbox].find(l => l._id === list_index)
    ? data[list_index]
    : lists.find(l => l.local_id === list_index) || inbox

  const listsProps = {list_index, selected_list, searchValue, setSearchValue, fromTask, setFromTask}
  const tasksProps = {list_index, selected_list, searchValue, searchData, fromTask, setFromTask, reminderList, setReminderList}
  return (
    <div id='container' className='leftColumn-visible'>
      <Header searchValue={searchValue} setSearchValue={setSearchValue} setSearchData={setSearchData}/>
      <div className={`app ${selected_list.theme ? 'theme-' + selected_list.theme : ''}`}>
        <Lists {...listsProps}/>
        <Tasks {...tasksProps}/>
        {selected_task && <TaskDetail list_index={list_index} selected_list={selected_list} selected_task={selected_task}/>}
        {user && <SettingDrawer/>}
        {user && <AccountDrawer/>}
      </div>
      {user && <ContextMenu setListRenameVisible={() => setListRenameInputVisible(true)}
                            listMenu_obj={selected_list} taskMenu_obj={selected_task || {}}/>}
      {user && users?.find(u => u.user_id === user.user_id) && selected_list.owner_id &&
      <Modal selected_list={selected_list} selected_task={selected_task}/>}
      {/* @ts-ignore */}
      <ListStatisticsModal selected_list={selected_list}/>
    </div>
  )
}

export default inject('data', 'state')(withRouter(observer(Main)))
