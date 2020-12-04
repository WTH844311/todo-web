import './styles/index.css'
import './styles/header.css'
import './styles/leftColumn.css'
import './styles/main.css'
import './styles/rightColumn.css'
import './styles/theme.css'
import React, {Component, LegacyRef} from 'react'
import {observer, inject} from 'mobx-react'
import {withRouter} from 'react-router-dom';
import {Icon, Button} from 'antd'
import {ContextMenuTrigger} from "react-contextmenu"
import ContextMenu from './components/contextMenu/index'
import Modal from './components/Modal/index'
import ListStatisticsModal from './components/listStatisticsModal/index'
import Notification from './components/notification/index'
import AccountDrawer from './components/accountDrawer/index'
import SettingDrawer from './components/settingDrawer/index'
import {arraysEqual, formatDate} from '../../common/util'
import getIcon from '../../common/icons'
import db from '../../common/db'
import {IState, IMobxStore} from './type'
import {IList, ITask} from '../../stores/types'

const documentTypes = ['DOC', 'DOCX', 'WPS', 'XML', 'CSV', 'XLS', 'XLSM', 'PPT', 'PPTX', 'PPTM', 'XPS']

class Main extends Component<IMobxStore, IState> {

  private reminderTimer: NodeJS.Timeout | null = null;

  private fromTask: ITask | null = null;

  private fromList: IList | null = null;

  private chatRef: any = null;

  constructor(props: IMobxStore) {
    super(props)
    this.state = {
      leftColumnEnter: true,
      listRenameInputVisible: false,
      taskRenameInputVisible: false,
      noteInputVisible: false,
      searchVisible: false,
      reminderList: [],
      searchValue: '',
      searchData: null,
      chatButtonDisabled: true
    }
  }

  /**
   * 1. 检测登录状态
   * 2. 读取用户列表
   * 3. 读取缓存数据
   * 4. 与服务器建立 websocket 连接
   * 5. 其他
   */
  componentDidMount() {
    const {wsAction, getAction, setAction, users, ws, user} = this.props.data
    if (!localStorage.token || !localStorage.user) return this.props.history.push('/user/login')
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
    window.addEventListener('click', this.handleClick)
    this.reminderTimer = setInterval(this.processReminderTask, 60 * 1000)
    this.handleWunderlistImport()
  }

  componentDidUpdate(prevProps: Readonly<IMobxStore>, prevState: Readonly<IState>) {
    const {tasks} = this.props.data
    if (prevState.searchValue !== this.state.searchValue) {
      if (!this.state.searchValue) {
        this.setState({searchData: null})
      } else {
        const result = {
          tasks: tasks.filter(t => t.title.includes(this.state.searchValue)),
          note: tasks.filter(t => t.note && t.note.includes(this.state.searchValue)),
          step: tasks.filter(t => t.steps && t.steps.length > 0 && t.steps.find(s => s.title.includes(this.state.searchValue)))
        }
        this.setState({searchData: JSON.parse(JSON.stringify(result))})
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.handleClick)
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer)
    }
  }

  /**
   * @deprecated Wunderlist 服务器已被关闭，api失效
   */
  handleWunderlistImport = () => {
    // const urlParams = new URLSearchParams(this.props.location.search)
    // const code = urlParams.get('code')
    // if (code) this.props.data.importFromWunderlist(code)
  }

  processReminderTask = () => {
    const {data} = this.props
    if (data.tasks.length > 0) {
      data.tasks.map(t => {
        if (!t.completed && (t.reminder && t.reminder.date)) {
          const time = Date.now() - new Date(t.reminder.date).getTime()
          if (time < 60 * 1000 && time > 0) {
            this.setReminderList([...this.state.reminderList.filter(rt => rt._id !== t._id), t])
          }
        }
      })
    }
  }

  // 全局 click 事件拦截
  handleClick = (e: MouseEvent) => {
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

  setReminderList = (list: ITask[]) => this.setState({reminderList: list})

  setListIndex = (newIndex: string) => this.props.history.push(`/lists/${newIndex}`)

  changeColumnState = () => this.setState({leftColumnEnter: !this.state.leftColumnEnter})

  bytesToSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  }

  mimeTypeTofileName = (type: string) => {
    switch (true) {
      case type.includes('image'):
        return '图片'
      case type.includes('office'):
      case type.includes('document'):
      case type.includes('excel'):
      case type.includes('ms'):
      case type.includes('powerpoint'):
        return '文档'
      default:
        return '文件'
    }
  }

  render() {
    const {data, state} = this.props
    const {
      leftColumnEnter,
      listRenameInputVisible,
      taskRenameInputVisible,
      noteInputVisible,
      searchVisible,
      reminderList,
      searchValue,
      searchData,
      chatButtonDisabled
    } = this.state
    const {
      listAction,
      taskAction,
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
    const {
      changeAccountDrawer,
      changeSettingDrawer,
      changeShareOptionModal
    } = state
    if (!users) return null
    const defaultList = [myday, important, planned, assigned_to_me, inbox]
    const {list_index, task_id} = this.props.match.params
    const selected_task = tasks.find(task => task.local_id === task_id)
    const selected_list: IList = defaultList.find(l => l._id === list_index)
      ? (data as any)[list_index]
      : lists.find(l => l.local_id === list_index) || inbox
    const interval = () => {
      if (selected_task?.recurrence) {
        const {interval, type} = selected_task.recurrence
        return ({
          Daily: `每${interval > 1 ? ` ${interval} ` : ''}天`,
          Weekly: `每${interval > 1 ? ` ${interval} ` : ''}周`,
          Monthly: `每${interval > 1 ? ` ${interval} 个` : ''}月`,
          Yearly: `每${interval > 1 ? ` ${interval} ` : ''}年`
        } as any)[type]
      }
      return '重复'
    }
    const daysOfWeek = () => {
      if (selected_task?.recurrence && selected_task?.recurrence.days_of_week.length > 0) {
        if (arraysEqual(selected_task.recurrence.days_of_week, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) && selected_task.recurrence.type === 'Weekly') return ['工作日']
        const o = {
          Monday: '星期一',
          Tuesday: '星期二',
          Wednesday: '星期三',
          Thursday: '星期四',
          Friday: '星期五',
          Saturday: '星期六',
          Sunday: '星期日'
        }
        return selected_task.recurrence.days_of_week.map(d => d = (o as any)[d])
      }
      return []
    }
    const sortType = () => {
      const o = {1: '重要性', 2: '截止日期', 3: '是否添加到 “我的一天”', 4: '完成状态', 5: '字母顺序', 6: '创建日期'}
      return (o as any)[selected_list.sort_type]
    }
    const getSortedList = () => {
      const {tasks, sort_asc, sort_type, defaultList, _id}: IList = selected_list
      if (!tasks) return []
      if (defaultList && _id !== 'myday' && _id !== 'inbox') return tasks
      const getSortIndex = _id === 'myday' ? 'today_position' : 'position'
      const sortRule = (sort_asc, getSortIndex) => [
        tasks.slice().sort((a, b) => b[getSortIndex] - a[getSortIndex]),
        [
          ...tasks.filter(t => sort_asc ? t.importance : !t.importance).sort((a, b) => b[getSortIndex] - a[getSortIndex]),
          ...tasks.filter(t => sort_asc ? !t.importance : t.importance).sort((a, b) => b[getSortIndex] - a[getSortIndex])
        ],
        [
          // 设置截止日期的未完成的
          ...tasks.filter(t => !t.completed && t.due_date).sort((a, b) => {
            // @ts-ignore
            const a_due_date = new Date(a.due_date).getTime(), b_due_date = new Date(b.due_date).getTime()
            if (a_due_date !== b_due_date) return sort_asc ? a_due_date - b_due_date : b_due_date - a_due_date
            return b[getSortIndex] - a[getSortIndex]
          }),
          // 未设置截止日期的未完成的
          ...tasks.filter(t => !t.completed && !t.due_date).sort((a, b) => b[getSortIndex] - a[getSortIndex]),
          // 设置截止日期的已完成的
          ...tasks.filter(t => t.completed && t.due_date).sort((a, b) => {
            // @ts-ignore
            const a_due_date = new Date(a.due_date).getTime(), b_due_date = new Date(b.due_date).getTime()
            if (a_due_date !== b_due_date) return sort_asc ? a_due_date - b_due_date : b_due_date - a_due_date
            return b[getSortIndex] - a[getSortIndex]
          }),
          // 未设置截止日期的已完成的
          ...tasks.filter(t => t.completed && !t.due_date).sort((a, b) => b[getSortIndex] - a[getSortIndex])
        ],
        [
          ...tasks.filter(t => sort_asc ? t.myDay : !t.myDay).sort((a, b) => b[getSortIndex] - a[getSortIndex]),
          ...tasks.filter(t => sort_asc ? !t.myDay : t.myDay).sort((a, b) => b[getSortIndex] - a[getSortIndex])
        ],
        [
          ...tasks.filter(t => sort_asc ? !t.completed : t.completed).sort((a, b) => b[getSortIndex] - a[getSortIndex]),
          ...tasks.filter(t => sort_asc ? t.completed : !t.completed).sort((a, b) => b[getSortIndex] - a[getSortIndex])
        ],
        [],
        tasks.slice().sort((a, b) => sort_asc ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      ][sort_type]
      return sortRule(sort_asc, getSortIndex)
    }
    const TaskItem = (task: ITask, index: number) => {
      return (
        <div id={`taskItem-${index}`} key={task.local_id} className={`taskItem ${task.completed && 'completed'}`}
             onClick={() => this.props.history.push(`/lists/${list_index}/tasks/${task.local_id}`)}
             onMouseDown={e => {
               if (e.button === 2) this.props.history.push(`/lists/${list_index}/tasks/${task.local_id}`)
             }}
             draggable
             onDragStart={() => this.fromTask = task}
             onDragOver={e => e.preventDefault()}
             onDragEnd={() => this.fromTask = null}
             onDrop={() => data.taskAction.swapTaskPosition(this.fromTask, task)}
        >
          <div className='taskItem-body'>
          <span className="checkBox big" title={`${task.title} 标记为已完成`} onClick={() => {
            const {sound} = JSON.parse(localStorage.setting)
            if (!task.completed && sound) new Audio('/res/audio/done.wav').play()
            taskAction.changeTaskCompleted(task)
          }}>
            {task.completed ? (
              <i className="icon svgIcon checkbox-completed-20">
                <svg focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24">
                  <path fillRule="evenodd"
                        d="M10.9854 15.0752l-3.546-3.58 1.066-1.056 2.486 2.509 4.509-4.509 1.06 1.061-5.575 5.575zm1.015-12.075c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9z"></path>
                </svg>
              </i>
            ) : (
              <>
                <i className="icon svgIcon checkbox-20">
                  <svg focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                       viewBox="0 0 24 24">
                    <path fillRule="evenodd"
                          d="M12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8m0-17c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9"></path>
                  </svg>
                </i>
                <i className="icon svgIcon checkbox-completed-outline-20 checkBox-hover">
                  <svg focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                       viewBox="0 0 24 24">
                    <g fillRule="evenodd">
                      <path
                        d="M12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8m0-17c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9"></path>
                      <path
                        d="M10.9902 13.3027l-2.487-2.51-.71.704 3.193 3.224 5.221-5.221-.707-.707z"></path>
                    </g>
                  </svg>
                </i>
              </>
            )}
          </span>
            <div style={{flex: '1 1'}}>
              <ContextMenuTrigger id='task-menu'>
                <button id={`taskItem-titleWrapper-${index}`} className='taskItem-titleWrapper' onClick={() => {
                  const list = document.getElementsByClassName('taskItem')
                  for (let i = 0; i < list.length; i++) {
                    list[i].classList.remove('selected')
                  }
                  document.getElementById(`taskItem-${index}`)?.classList.add('selected')
                }}>
                  <span className='taskItem-title'>{task.title}</span>
                  <div className='metaDataInfo'>
                    {task.list_id !== selected_list.local_id && (
                      <span className='metaDataInfo-group'>
                      <span className='taskItemInfo-steps'>
                        <span className="taskItemInfo-label">
                          {
                            task.list_id === '000000000000000000000000'
                              ? '任务'
                              : lists.find(l => l.local_id === task.list_id)
                              ? lists.find(l => l.local_id === task.list_id)?.title
                              : 1
                          }
                        </span>
                      </span>
                    </span>
                    )}
                    {task.myDay && (
                      <span className='metaDataInfo-group'>
                      <span className='taskItemInfo-myDay'>
                        <i className="icon svgIcon my-day-16">
                          <svg focusable="false"
                               xmlns="http://www.w3.org/2000/svg"
                               xmlnsXlink="http://www.w3.org/1999/xlink"
                               width="16" height="16"
                               viewBox="0 0 16 16">
                            <defs><path id="a" d="M0 10h10V0H0z"></path></defs>
                            <g fillRule="evenodd" transform="translate(3 3)"><path
                              d="M5 3.5c-.827 0-1.5.673-1.5 1.5S4.173 6.5 5 6.5 6.5 5.827 6.5 5 5.827 3.5 5 3.5"></path><path
                              d="M4.5 2h1V0h-1zm0 8h1V8h-1zM8 5.5h2v-1H8zm-8 0h2v-1H0zm8.8892-3.6821l-.707-.707-1.414 1.414.707.707zM1.1108 8.1821l.707.707 1.414-1.414-.707-.707zm5.6573-.707l1.414 1.414.707-.707-1.414-1.414zM1.1108 1.8179l1.414 1.414.707-.707-1.414-1.414z"
                              mask="url(https://to-do.microsoft.com/tasks/id/AQMkADAwATNiZmYAZC0yMzc3AC05ZDY4LTAwAi0wMAoARgAAA0oYxRx2yAZFr2dNRTrf-jsHAJc3Tf-qvQlIi8bDlmS5iO0AAAAChDFuAAAAlzdN-_q9CUiLxsOWZLmI7QAAAAKERQsAAAA=/details#b)"></path></g></svg></i>
                        <span className="taskItemInfo-label">我的一天</span>
                      </span>
                    </span>
                    )}
                    {task.steps?.length !== undefined && task.steps.length > 0 && (
                      <span className='metaDataInfo-group'>
                      <span className='taskItemInfo-steps'>
                        <span className="taskItemInfo-label">第 {task.steps.filter(step => step.completed).length} 步，共 {task.steps.length} 步</span>
                      </span>
                    </span>
                    )}
                    {task.due_date && (
                      <span className='metaDataInfo-group'>
                    <span
                      className={`taskItemInfo-date ${task.completed ? 'inactive' : new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0) ? 'overdue' : 'active'}`}>
                      <i className="icon svgIcon due-date-16">
                        <svg focusable="false"
                             xmlns="http://www.w3.org/2000/svg"
                             width="16" height="16"
                             viewBox="0 0 16 16"><path
                          fillRule="evenodd"
                          d="M10 3v1H5.999V3H5v1H3v9h10V4h-2V3h-1zm1 3V5h1v2H4V5h1v1h.999V5H10v1h1zm-7 6h8V7.999H4V12z"></path></svg></i>
                      <span className="taskItemInfo-label">
                        {new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0) ? (
                          `过期时间: ${new Date().getFullYear() === new Date(task.due_date).getFullYear() ? formatDate(task.due_date, 'Year') : formatDate(task.due_date)}`
                        ) : (
                          `${new Date().getFullYear() === new Date(task.due_date).getFullYear() ? formatDate(task.due_date, 'Year') : formatDate(task.due_date)} 到期`
                        )}
                      </span>
                      {task.recurrence && <i className="icon svgIcon recurring-16">
                        <svg focusable="false" xmlns="http://www.w3.org/2000/svg" width="16"
                             height="16" viewBox="0 0 16 16">
                          <path fillRule="evenodd"
                                d="M10.7998 10.73c.67-.75.99-1.71.93-2.73h1c.07 1.24-.36 2.46-1.17 3.39-.9 1.02-2.2 1.61-3.57 1.61-1.657 0-3.136-.849-3.99-2.186V12h-1V9h3v1h-1.319c.635 1.22 1.889 2 3.309 2 1.08 0 2.11-.46 2.81-1.27zM12 4h1v3h-3V6h1.306C10.663 4.78 9.399 4 8 4c-1.074 0-2.096.458-2.805 1.257-.671.757-.981 1.724-.92 2.743h-.994c-.056-1.252.343-2.478 1.166-3.406C5.346 3.581 6.641 3 8 3c1.64 0 3.138.842 4 2.191V4z"></path>
                        </svg>
                      </i>}
                      </span>
                    </span>
                    )}
                    {((!task.completed && task.reminder && Date.now() < new Date(task.reminder.date).getTime()) || task.note) && (
                      <span className='metaDataInfo-group'>
                      {(!task.completed && task.reminder && Date.now() < new Date(task.reminder.date).getTime()) && (
                        <span className="taskItemInfo-reminder" title="今天">
                          <i className="icon svgIcon reminder-16">
                            <svg focusable="false"
                                 xmlns="http://www.w3.org/2000/svg"
                                 width="16" height="16"
                                 viewBox="0 0 16 16"><path
                              fillRule="evenodd"
                              d="M5 10V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H5zm2 1h2c0 .551-.449 1-1 1-.551 0-1-.449-1-1zm5-1V7c0-2.206-1.794-4-4-4S4 4.794 4 7v3H3v1h3c0 1.103.897 2 2 2s2-.897 2-2h3v-1h-1z"></path></svg></i>
                        </span>
                      )}
                        {task.note && (
                          <span className="taskItemInfo-note">
                          <i className="icon svgIcon note-16">
                            <svg focusable="false"
                                 xmlns="http://www.w3.org/2000/svg"
                                 width="16" height="16"
                                 viewBox="0 0 16 16"><path
                              fillRule="evenodd"
                              d="M3 3v10h5.957L13 8.957V3H3zm1 1h8v3.999H8V12H4V4zm5 5h2.543L9 11.543V9z"
                              fill='#767678'></path></svg></i>
                        </span>
                        )}
                    </span>
                    )}
                    {task.linkedEntities?.length !== undefined && task.linkedEntities.length > 0 && (
                      <span className='metaDataInfo-group'>
                      <span className="taskItemInfo-attachments">
                        <i className="icon svgIcon attachment-16"><svg
                          xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                          viewBox="0 0 16 16"><path
                          d="M6 11.5c0 .2761424-.22385763.5-.5.5-.27614237 0-.5-.2238576-.5-.5V6c0-1.65714237 1.34285763-3 3-3s3 1.34285763 3 3v5c0 1.1041424-.8958576 2-2 2-1.10414237 0-2-.8958576-2-2V6.5c0-.27614237.22385763-.5.5-.5.27614237 0 .5.22385763.5.5V11c0 .5518576.44814237 1 1 1s1-.4481424 1-1V6c0-1.10485763-.89514237-2-2-2-1.10485763 0-2 .89514237-2 2v5.5z"
                          fill='#767678'></path></svg></i>
                        <span className="taskItemInfo-label">文件已附加</span>
                      </span>
                    </span>
                    )}
                    {task.comments?.length !== undefined && task.comments.length > 0 && (
                      <span className='metaDataInfo-group'>{getIcon({name: 'message', size: '.9rem'})}</span>
                    )}
                  </div>
                </button>
              </ContextMenuTrigger>
            </div>
            {task.assignment && users.find(u => u.user_id === task.assignment?.assignee) && <div
              className='avatar'>{users.find(u => u.user_id === task.assignment?.assignee)?.username.substring(0, 2)}</div>}
            <span className='importanceButton' onClick={() => taskAction.changeTaskImportance(task)}>
            {task.importance ? getIcon({name: 'important'}) : getIcon({name: 'unimportant'})}
          </span>
          </div>
        </div>
      )
    }
    // @ts-ignore
    return (
      <div id='container' className='leftColumn-visible'>
        <div className='header'>
          <div className='headerLeftRegion'>
            <div className='headerLeftRegion-Region_1'>
              <div className='branding-container'>
                <span>To Do</span>
              </div>
              <div className='searchBox-container'>
                <div className={`searchToolbar ${searchVisible ? 'search-is-open search-is-active' : ''}`}>
                  <span className='searchToolbar-iconWrapper'
                        onClick={() => this.setState({searchVisible: true})}>
                      <button className='searchToolbar-icon search' title='搜索'><Icon
                        type="search"/></button>
                  </span>
                  {
                    searchVisible && (
                      <div className='searchToolbar-inputWrapper'>
                        <input
                          className="chromeless searchToolbar-input search"
                          type="text"
                          placeholder="搜索"
                          value={searchValue}
                          onChange={e => this.setState({searchValue: e.target.value})}
                        />
                        <span className='searchToolbar-iconWrapper' onClick={() => {
                          this.setState({
                            searchVisible: false,
                            searchValue: '',
                            searchData: null
                          })
                        }}>
                            <button className='searchToolbar-icon stop' title='退出搜索'>
                                <svg viewBox="64 64 896 896" version="1.1"
                                     xmlns="http://www.w3.org/2000/svg" p-id="2170"
                                     width=".6rem" height=".6rem"><path
                                  d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                  p-id="2171" fill="#767678"></path></svg>
                            </button>
                        </span>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
            <div className='headerLeftRegion-Region_2'>
              <div className='options-container' onClick={changeSettingDrawer}>
                <div className='headerOptions-setting'>
                  <Icon type="setting" style={{fontSize: '17px'}}/>
                </div>
              </div>
            </div>
          </div>
          <div className='headerRightRegion'>
            <div className='avatar-container' onClick={changeAccountDrawer}>
              <div className='avatarContainer-circle'>
                {localStorage.user && <span>{JSON.parse(localStorage.user)?.username.charAt(0)}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className={`app ${selected_list.theme ? 'theme-' + selected_list.theme : ''}`}>
          <div
            className={`leftColumn ${leftColumnEnter ? 'leftColumn-entered' : 'leftColumn-exited'}`}
          >
            <div className='sidebar'>
              <div className='sidebar-header'>
                <div className='hamburgerMenu' onClick={this.changeColumnState}>
                  <Icon type="menu"/>
                </div>
              </div>
              <div className='sidebar-content'>
                <nav role='navigation' className='sidebar-scroll'>
                  <ul id="sortable" className='list-tree'>
                    {defaultList.map(list => {
                      if (list._id === 'inbox') {
                        return <ContextMenuTrigger key={list._id} id='basicList-menu'>
                          <li className={`listItem-container ${list_index === list._id ? 'active' : ''}`}
                              onClick={() => this.setListIndex(list._id)} onMouseDown={e => {
                            if (e.button === 2) this.setListIndex(list._id)
                          }}
                              onDragOver={e => e.preventDefault()}
                              onDrop={() => {
                                if (this.fromTask && this.fromTask._id !== '000000000000000000000000') {
                                  data.taskAction.moveTaskToList(this.fromTask, '000000000000000000000000')
                                }
                              }}
                              onDragEnd={() => [this.fromTask, this.fromList] = [null, null]}
                          >
                            <div className={`listItem color-${list.theme}`}>
                              <div className='listItem-icon'><Icon type="home"/></div>
                              <div className="listItem-title"><span>{list.title}</span></div>
                              <div className="listItem-count">
                                <span>{inbox.tasks?.filter(t => !t.completed).length || null}</span></div>
                            </div>
                          </li>
                        </ContextMenuTrigger>
                      }
                      return <li
                        key={list._id}
                        className={`listItem-container ${list_index === list._id ? 'active' : ''}`}
                        onClick={() => this.setListIndex(list._id)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => {
                          if (this.fromTask) {
                            if (list._id === 'myday' && !this.fromTask.myDay) {
                              data.taskAction.changeTaskMyday(this.fromTask)
                            } else if (list._id === 'important' && !this.fromTask.importance) {
                              data.taskAction.changeTaskImportance(this.fromTask)
                            } else if (selected_list.sharing_status !== 'NotShare' && list._id === 'assigned_to_me') {
                              const {user_id}: any = user
                              data.taskAction.assignTask(this.fromTask, user_id, user_id)
                            }
                          }
                        }}
                        onDragEnd={() => [this.fromTask, this.fromList] = [null, null]}
                      >
                        <div className={`listItem color-${list.theme}`}>
                          <div className='listItem-icon'>{list.icon}</div>
                          <div className="listItem-title"><span>{list.title}</span></div>
                          <div className="listItem-count">
                            <span>{list.tasks?.filter(t => !t.completed).length || null}</span></div>
                        </div>
                      </li>
                    })}
                    <div className="sidebar-lastStaticList"/>
                    {
                      lists.slice().sort((a, b) => b.position - a.position).map(list => (
                        <ContextMenuTrigger key={list.local_id} id='userList-menu'>
                          {/* <Dragger allowX={false}> */}
                          <div className='sortable-lists' onClick={() => {
                            if (searchValue !== '') this.setState({searchValue: ''})
                            this.setListIndex(list.local_id)
                          }} onMouseDown={e => {
                            if (e.button === 2) this.setListIndex(list.local_id)
                          }}
                               draggable
                               onDragStart={() => this.fromList = list}
                               onDragOver={e => e.preventDefault()}
                               onDrop={() => {
                                 if (this.fromList) {
                                   data.listAction.swapListPosition(this.fromList, list)
                                 } else {
                                   data.taskAction.moveTaskToList(this.fromTask, list._id)
                                 }
                               }}
                               onDragEnd={() => this.fromList = null}
                          >
                            <li className={`listItem-container ${list_index === list.local_id ? 'active' : ''}`}>
                              <div className={`listItem ${list.theme ? 'color-' + list.theme : ''}`}>
                                <div className='listItem-icon'>
                                  <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg"
                                       p-id="32362" width="1rem" height="1rem">
                                    <path
                                      d="M160 128c-17.728 0-32 14.272-32 32v128c0 17.728 14.272 32 32 32h128c17.728 0 32-14.272 32-32v-128c0-17.728-14.272-32-32-32zM192 192h64v64H192z m256 0v64h448V192zM160 384c-17.728 0-32 14.272-32 32v128c0 17.728 14.272 32 32 32h128c17.728 0 32-14.272 32-32v-128c0-17.728-14.272-32-32-32zM192 448h64v64H192z m256 0v64h448V448z m-288 192c-17.728 0-32 14.272-32 32v128c0 17.728 14.272 32 32 32h128c17.728 0 32-14.272 32-32v-128c0-17.728-14.272-32-32-32z m32 64h64v64H192z m256 0v64h448v-64z"
                                      fill="#767678" p-id="32363"></path>
                                  </svg>
                                </div>
                                <div className="listItem-title">
                                  <span>{list.title}</span>
                                </div>
                                {list.sharing_status !== 'NotShare' && (
                                  <div className="listItem-shareIcon">
                                    <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg"
                                         p-id="64720" width="1rem" height="1rem">
                                      <path
                                        d="M824.2 699.9c-25.4-25.4-54.7-45.7-86.4-60.4C783.1 602.8 812 546.8 812 484c0-110.8-92.4-201.7-203.2-200-109.1 1.7-197 90.6-197 200 0 62.8 29 118.8 74.2 155.5-31.7 14.7-60.9 34.9-86.4 60.4C345 754.6 314 826.8 312 903.8c-0.1 4.5 3.5 8.2 8 8.2h56c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5C493.8 707.7 551.1 684 612 684c60.9 0 118.2 23.7 161.3 66.8C814.5 792 838 846.3 840 904.3c0.1 4.3 3.7 7.7 8 7.7h56c4.5 0 8.1-3.7 8-8.2-2-77-33-149.2-87.8-203.9zM612 612c-34.2 0-66.4-13.3-90.5-37.5-24.5-24.5-37.9-57.1-37.5-91.8 0.3-32.8 13.4-64.5 36.3-88 24-24.6 56.1-38.3 90.4-38.7 33.9-0.3 66.8 12.9 91 36.6 24.8 24.3 38.4 56.8 38.4 91.4 0 34.2-13.3 66.3-37.5 90.5-24.2 24.2-56.4 37.5-90.6 37.5z"
                                        p-id="64721" fill="#767678"></path>
                                      <path
                                        d="M361.5 510.4c-0.9-8.7-1.4-17.5-1.4-26.4 0-15.9 1.5-31.4 4.3-46.5 0.7-3.6-1.2-7.3-4.5-8.8-13.6-6.1-26.1-14.5-36.9-25.1-25.8-25.2-39.7-59.3-38.7-95.4 0.9-32.1 13.8-62.6 36.3-85.6 24.7-25.3 57.9-39.1 93.2-38.7 31.9 0.3 62.7 12.6 86 34.4 7.9 7.4 14.7 15.6 20.4 24.4 2 3.1 5.9 4.4 9.3 3.2 17.6-6.1 36.2-10.4 55.3-12.4 5.6-0.6 8.8-6.6 6.3-11.6-32.5-64.3-98.9-108.7-175.7-109.9-110.9-1.7-203.3 89.2-203.3 199.9 0 62.8 28.9 118.8 74.2 155.5-31.8 14.7-61.1 35-86.5 60.4-54.8 54.7-85.8 126.9-87.8 204-0.1 4.5 3.5 8.2 8 8.2h56.1c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5 29.4-29.4 65.4-49.8 104.7-59.7 3.9-1 6.5-4.7 6-8.7z"
                                        p-id="64722" fill="#767678"></path>
                                    </svg>
                                  </div>
                                )}
                                <div className="listItem-count">
                                  <span>{list.tasks ? (list.tasks.filter(t => !t.completed).length || null) : null}</span>
                                </div>
                              </div>
                            </li>
                          </div>
                          {/* </Dragger> */}
                        </ContextMenuTrigger>
                      ))
                    }
                  </ul>
                </nav>
                <div className='sidebar-addList'>
                  <div className='baseAdd addList'>
                    <div className='baseAdd-icon'>
                      <Icon type="plus"/>
                    </div>
                    <input
                      id="baseAddInput-addList"
                      className="baseAdd-input chromeless"
                      type="text"
                      maxLength={255}
                      placeholder="新建清单"
                      tabIndex={-1}
                      onKeyDown={e => {
                        const target = e.target as HTMLInputElement;
                        if (e.keyCode === 13 && target.value !== '') {
                          listAction.addList(target.value)
                          target.value = ''
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='main'>
            <div className='tasksToolbar'>
              <div className='tasksToolbar-top'>
                <div className='tasksToolbar-headline'>
                  <div className="tasksToolbar-titleContainer">
                    <div className='tasksToolbar-titleItem'>
                      {
                        listRenameInputVisible && !searchData ? (
                          <input
                            className="chromeless editing tasksToolbar-input"
                            type="text"
                            size={3}
                            maxLength={255}
                            autoFocus
                            defaultValue={selected_list.title}
                            onBlur={() => this.setState({listRenameInputVisible: false})}
                            onKeyDown={e => {
                              const target = e.target as HTMLInputElement;
                              if (e.keyCode === 13 && target.value !== '') {
                                listAction.renameList(selected_list, target.value)
                                this.setState({listRenameInputVisible: false})
                              }
                            }}
                          />
                        ) : (
                          <h2 className='listTitle' style={searchData ? {color: 'blue'} : undefined} onClick={() => {
                            if (!selected_list.defaultList) this.setState({listRenameInputVisible: true})
                          }}>
                            {searchData ? `正在搜索 “${searchValue}”` : selected_list.title}
                          </h2>
                        )
                      }
                    </div>
                    {!searchData && (
                      <div className='tasksToolbar-titleItem'>
                        <ContextMenuTrigger id='listOptions-menu' holdToDisplay={0}>
                          <div className='listOptions'>
                            <Icon type="ellipsis"/>
                          </div>
                        </ContextMenuTrigger>
                      </div>
                    )}
                  </div>
                  <div className="tasksToolbar-subline"/>
                </div>
                {!searchData && (
                  <div className='tasksToolbar-right'>
                    <div className='tasksToolbar-actions'>
                      {!selected_list.defaultList && (
                        <div className='tasksToolbar-actionsItem' onClick={changeShareOptionModal}>
                          <div className='toolbarButton-icon'>
                            <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="41408"
                                 width="20" height="20">
                              <path
                                d="M800 608v128h128v64h-128v128h-64v-128h-128v-64h128v-128h64zM512 128a256 256 0 0 1 161.088 454.976c-22.4 18.88-37.952 28.608-69.184 40A254.656 254.656 0 0 1 512 640a255.36 255.36 0 0 1-91.904-16.96 288.064 288.064 0 0 0-195.968 264.48L224 896H160a352 352 0 0 1 190.912-313.056A256 256 0 0 1 512 128z m0 64a192 192 0 1 0 0 384 192 192 0 0 0 0-384z"
                                fill="#767678" p-id="41409"></path>
                            </svg>
                          </div>
                          <div
                            className='sharingButton-membersCount'>{selected_list.sharing_status === 'NotShare' ? '共享' : selected_list.members.length + 1}</div>
                        </div>
                      )}
                      {selected_list.sort_type !== -1 && (
                        <ContextMenuTrigger id='listOptions-sort' holdToDisplay={0}>
                          <div className='tasksToolbar-actionsItem'>
                            <div className='toolbarButton-icon'>
                              <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="38863"
                                   width="20" height="20">
                                <path
                                  d="M922.345786 372.183628l-39.393195 38.687114L676.138314 211.079416l0 683.909301-54.713113 0L621.425202 129.010259l53.320393 0L922.345786 372.183628zM349.254406 894.989741 101.654214 651.815349l39.393195-38.687114 206.814276 199.792349L347.861686 129.010259l54.713113 0 0 765.978459L349.254406 894.988718z"
                                  p-id="38864" fill="#767678"></path>
                              </svg>
                            </div>
                            <span style={{marginLeft: '3px'}}>排序</span>
                          </div>
                        </ContextMenuTrigger>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className='flex-container'>
              {reminderList.map(t => (
                <Notification
                  key={t._id}
                  reminderList={reminderList}
                  setReminderList={this.setReminderList}
                  task={t}/>
              ))}
              <div className='flexBoxFix'>
                {selected_list.sort_type > 0 && (
                  <div className="sortingIndicator shrinkSort-enter-done">
                    <div className="sortingIndicator-inner">
                      <div className="sortingIndicator-active">
                        按{sortType()}排列
                        <button className="sortingIndicator-toggle center" tabIndex={0}
                                onClick={() => listAction.changeListSortAsc(selected_list)}>
                          {selected_list.sort_asc ? getIcon({name: 'Up'}) : getIcon({name: 'Down'})}
                        </button>
                      </div>
                      <button className="sortingIndicator-disable"
                              onClick={() => listAction.changeListSortType(selected_list, 0)}>
                        {getIcon({name: 'Cancel', size: '.8rem', viewBox: '64 64 896 896'})}
                      </button>
                    </div>
                  </div>
                )}
                <div className='main-background'>
                  {searchData ? (
                    <div className='searchResults'>
                      <div className='chunkedComponentList sticky'>
                        <div className='chunkedScrollContainer'>
                          <div className='componentList space-aside'>
                            {searchData.tasks.length > 0 && (
                              <>
                                <h3 className="searchResultsGroup-header"><span>任务</span></h3>
                                {searchData.tasks.map((task, index) => TaskItem(task, index))}
                              </>
                            )}
                            {searchData.note.length > 0 && (
                              <>
                                <h3 className="searchResultsGroup-header"><span>备注</span></h3>
                                {searchData.note.map((task, index) => TaskItem(task, index))}
                              </>
                            )}
                            {searchData.step.length > 0 && (
                              <>
                                <h3 className="searchResultsGroup-header"><span>步骤</span></h3>
                                {searchData.step.map((task, index) => TaskItem(task, index))}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className='tasks'>
                        <div className='chunkedComponentList sticky'>
                          <div className='chunkedScrollContainer'>
                            <div className='componentList space-aside'>
                              {
                                // @ts-ignore
                                getSortedList()?.filter(t => !t.completed || selected_list.show_completed).map((task, index) => TaskItem(task, index))
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      {list_index !== 'assigned_to_me' && (
                        <div className='baseAdd addTask'>
                          <div className='baseAdd-icon'>
                            <Icon type="plus"/>
                          </div>
                          <input
                            id="baseAddInput-addTask"
                            className="baseAdd-input chromeless"
                            type="text"
                            maxLength={255}
                            placeholder={`添加${list_index === 'planned' ? '一个今天到期的' : ''}任务`}
                            tabIndex={-1}
                            onKeyDown={e => {
                              const target = e.target as HTMLInputElement;
                              // @ts-ignore
                              if (e.code === 13 && target.value !== '') {
                                taskAction.addTask(list_index, target.value)
                                target.value = ''
                              }
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                  <div className='backgroundLines'/>
                </div>
              </div>
            </div>
          </div>
          {
            selected_task && (
              <div className={`rightColumn ${selected_task ? 'rightColumn-entered' : 'rightColumn-exited'}`}>
                <div className='details'>
                  <div className='details-body'>
                    <div className={`detailHeader ${selected_task.completed ? 'completed' : ''}`}>
                      <div className='detailHeader-titleWrapper'>
                        {selected_task.completed ? (
                          <span className='detailHeader-checkbox checkBox completed'
                            onClick={() => taskAction.changeTaskCompleted(selected_task)}>
                              <i className="icon svgIcon checkbox-completed-20"><svg
                                focusable="false" xmlns="http://www.w3.org/2000/svg"
                                width="24" height="24" viewBox="0 0 24 24"><path
                                fillRule="evenodd"
                                d="M10.9854 15.0752l-3.546-3.58 1.066-1.056 2.486 2.509 4.509-4.509 1.06 1.061-5.575 5.575zm1.015-12.075c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9z"></path></svg></i>
                            </span>
                        ) : (
                          <span className='checkBox completed' onClick={() => {
                            const {sound} = JSON.parse(localStorage.setting)
                            if (!selected_task.completed && sound) new Audio('/res/audio/done.wav').play()
                            taskAction.changeTaskCompleted(selected_task)
                          }}>
                            <i className="icon svgIcon checkbox-16">
                              <svg focusable="false"
                               xmlns="http://www.w3.org/2000/svg"
                               width="30"
                               height="30"
                               viewBox="2 0 24 24"><path
                              fillRule="evenodd"
                              d="M6 12c0-3.309 2.691-6 6-6s6 2.691 6 6-2.691 6-6 6-6-2.691-6-6zm-1 0c0 3.859 3.141 7 7 7s7-3.141 7-7-3.141-7-7-7-7 3.141-7 7z"></path></svg></i>
                            <i
                              className="icon svgIcon checkbox-completed-outline-16 checkBox-hover"><svg
                              focusable="false" xmlns="http://www.w3.org/2000/svg"
                              width="30" height="30" viewBox="4 2 24 24"><g
                              fillRule="evenodd"><path
                              d="M6 12c0-3.309 2.691-6 6-6s6 2.691 6 6-2.691 6-6 6-6-2.691-6-6zm-1 0c0 3.859 3.141 7 7 7s7-3.141 7-7-3.141-7-7-7-7 3.141-7 7z"></path><path
                              d="M11.2402 12.792l-1.738-1.749-.709.705 2.443 2.46 3.971-3.957-.706-.708z"></path></g></svg></i>
                          </span>
                        )}
                        <div className='detailHeader-title'>
                          <div className={`editableContent ${taskRenameInputVisible ? 'edit' : ''}`}>
                            <div className={`editableContent${taskRenameInputVisible ? '-edit' : '-display'}`}>
                              {taskRenameInputVisible ? (
                                <textarea
                                  className="editableContent-textarea"
                                  draggable={false}
                                  autoFocus
                                  maxLength={255}
                                  defaultValue={selected_task.title}
                                  onBlur={() => this.setState({taskRenameInputVisible: false})}
                                  onKeyDown={e => {
                                    const target = e.target as HTMLInputElement;
                                    if (e.keyCode === 13 && target.value !== '') {
                                      taskAction.renameTask(selected_task, target.value)
                                      this.setState({taskRenameInputVisible: false})
                                    }
                                  }}
                                />
                              ) : (
                                <span style={{display: 'block'}}
                                  onClick={() => this.setState({taskRenameInputVisible: true})}>
                                  {selected_task.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className='importanceButton'
                          onClick={() => taskAction.changeTaskImportance(selected_task)}>
                          {selected_task.importance ? getIcon({name: 'important'}) : getIcon({name: 'unimportant'})}
                        </span>
                      </div>
                    </div>
                    <div className='steps'>
                      <div className='steps-inner'>
                        {selected_task?.steps?.slice().sort((a, b) => b.position - a.position).map((step, index) => (
                          <div
                            key={index}
                            id={`step-${index}`}
                            className={`step ${step.completed ? 'completed' : ''}`}
                          >
                            {step.completed ? (
                              <span className='detailHeader-checkbox checkBox completed'
                                    onClick={() => taskAction.changeStepCompleted(selected_task, step)}>
                                <i className="icon svgIcon checkbox-completed-20"><svg
                                  focusable="false" xmlns="http://www.w3.org/2000/svg"
                                  width="20" height="20" viewBox="0 0 24 24"><path
                                  fillRule="evenodd"
                                  d="M10.9854 15.0752l-3.546-3.58 1.066-1.056 2.486 2.509 4.509-4.509 1.06 1.061-5.575 5.575zm1.015-12.075c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9z"></path></svg></i>
                              </span>
                            ) : (
                              <span className='checkBox completed'
                                    onClick={() => taskAction.changeStepCompleted(selected_task, step)}>
                                <i className="icon svgIcon checkbox-16"><svg
                                  focusable="false" xmlns="http://www.w3.org/2000/svg"
                                  width="24" height="24" viewBox="0 0 24 24"><path
                                  fillRule="evenodd"
                                  d="M6 12c0-3.309 2.691-6 6-6s6 2.691 6 6-2.691 6-6 6-6-2.691-6-6zm-1 0c0 3.859 3.141 7 7 7s7-3.141 7-7-3.141-7-7-7-7 3.141-7 7z"></path></svg></i>
                                <i
                                  className="icon svgIcon checkbox-completed-outline-16 checkBox-hover"><svg
                                  focusable="false" xmlns="http://www.w3.org/2000/svg"
                                  width="24" height="24" viewBox="0 0 24 24"><g
                                  fillRule="evenodd"><path
                                  d="M6 12c0-3.309 2.691-6 6-6s6 2.691 6 6-2.691 6-6 6-6-2.691-6-6zm-1 0c0 3.859 3.141 7 7 7s7-3.141 7-7-3.141-7-7-7-7 3.141-7 7z"></path><path
                                  d="M11.2402 12.792l-1.738-1.749-.709.705 2.443 2.46 3.971-3.957-.706-.708z"></path></g></svg></i>
                              </span>
                            )}
                            <div id={`step-body-${index}`} className='step-body'>
                              <div className='step-title'>
                                <div className='editableContent small'>
                                  <div
                                    id={`editableContent-display-${index}`}
                                    className='editableContent-display'
                                  >
                                    {step.title}
                                  </div>
                                </div>
                              </div>
                              <div className='step-delete'>
                                <button className='stepDelete-icon'
                                        onClick={() => taskAction.deleteTaskStep(selected_task, step)}>
                                  <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg"
                                       p-id="2170" width=".6rem" height=".6rem">
                                    <path
                                      d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                      p-id="2171" fill="#767678"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className='baseAdd addStep'>
                        <button className="baseAdd-icon" type="button">
                          <i className="icon svgIcon checkbox-16">
                            <svg focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                 viewBox="0 0 24 24">
                              <path fillRule="evenodd"
                                    d="M6 12c0-3.309 2.691-6 6-6s6 2.691 6 6-2.691 6-6 6-6-2.691-6-6zm-1 0c0 3.859 3.141 7 7 7s7-3.141 7-7-3.141-7-7-7-7 3.141-7 7z"></path>
                            </svg>
                          </i>
                        </button>
                        <input
                          id="baseAddInput-addStep"
                          className="baseAdd-input chromeless"
                          type="text"
                          maxLength={255}
                          placeholder="下一步"
                          tabIndex={-1}
                          onKeyDown={e => {
                            const target = e.target as HTMLInputElement;
                            if (e.keyCode === 13 && target.value !== '') {
                              taskAction.addTaskStep(selected_task, target.value)
                              target.value = ''
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className='details-separator'/>
                    <div className='section' onClick={() => {
                      if (!selected_task.myDay) taskAction.changeTaskMyday(selected_task)
                    }}>
                      <div className={`section-item ${selected_task.myDay ? 'isSet' : ''}`}>
                        <button className='section-innerClick'>
                          <div className='section-inner'>
                            <div className='section-icon'>
                              <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3838"
                                   width="1em" height="1em">
                                <path
                                  d="M480 96v160h64V96zM240 195.008L195.008 240l112.992 114.016 46.016-46.016z m544 0l-114.016 112.992 46.016 46.016L828.992 240zM512 288c-123.36 0-224 100.64-224 224s100.64 224 224 224 224-100.64 224-224-100.64-224-224-224z m0 64c88.736 0 160 71.264 160 160s-71.264 160-160 160-160-71.264-160-160 71.264-160 160-160zM96 480v64h160v-64z m672 0v64h160v-64zM308 670.016L195.008 784 240 828.992l114.016-112.992z m408 0l-46.016 45.984 114.016 112.992 44.992-44.992zM480 768v160h64v-160z"
                                  p-id="3839"></path>
                              </svg>
                            </div>
                            <div className='section-content'>
                              <div className='section-title'>{selected_task.myDay ? '已' : ''}添加到 “我的一天”</div>
                            </div>
                          </div>
                        </button>
                        {selected_task.myDay && (
                          <button className="section-delete" title="从我的一天移除" onClick={e => {
                            e.stopPropagation()
                            taskAction.changeTaskMyday(selected_task)
                          }
                          }>
                            <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170"
                                 width=".6rem" height=".6rem">
                              <path
                                d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                p-id="2171" fill="#767678"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className='section'>
                      <ContextMenuTrigger id='taskSchedule-remind' holdToDisplay={0}>
                        <div
                          className={`section-item ${selected_task.reminder ? 'isSet' : ''} ${selected_task.reminder ? ((new Date(selected_task.reminder.date).getTime() < Date.now() || selected_task.completed) ? 'isInactive' : '') : ''}`}>
                          <button className='section-innerClick'>
                            <div className='section-inner'>
                              <div className='section-icon'>
                                <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg"
                                     p-id="48103" width="1rem" height="1rem">
                                  <path
                                    d="M512 813.248c-158.784 0-288-129.216-288-288s129.216-288 288-288 288 129.216 288 288-129.216 288-288 288m0-640c-194.08 0-352 157.92-352 352 0 101.856 43.744 193.472 113.152 257.824a31.04 31.04 0 0 0-13.248 7.552l-58.528 58.56a31.968 31.968 0 1 0 45.248 45.216l58.528-58.528a31.584 31.584 0 0 0 8.832-19.84A349.664 349.664 0 0 0 512 877.248c71.328 0 137.664-21.44 193.152-58.048a31.04 31.04 0 0 0 8.224 16.672l58.528 58.56a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.28l-58.528-58.528a31.36 31.36 0 0 0-9.28-6.176C819.616 720.064 864 627.84 864 525.248c0-194.08-157.92-352-352-352"
                                    p-id="48104"
                                    fill={selected_task.reminder ? ((new Date(selected_task.reminder.date).getTime() < Date.now() || selected_task.completed) ? '#767678' : '#465efc') : '#767678'}></path>
                                  <path
                                    d="M544 519.104v-185.856a32 32 0 0 0-64 0v199.104c0 8.48 3.36 16.64 9.376 22.624l107.296 107.296a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.248L544 519.104zM182.624 286.4l90.528-90.56a32 32 0 0 0-45.248-45.216L137.376 241.152A31.968 31.968 0 1 0 182.624 286.4M883.872 227.872l-90.496-90.496a31.968 31.968 0 1 0-45.248 45.248l90.496 90.496a31.904 31.904 0 0 0 45.248 0 31.968 31.968 0 0 0 0-45.248"
                                    p-id="48105"
                                    fill={selected_task.reminder ? ((new Date(selected_task.reminder.date).getTime() < Date.now() || selected_task.completed) ? '#767678' : '#465efc') : '#767678'}></path>
                                </svg>
                              </div>
                              <div className='section-content'>
                                <div className='section-title'>
                                  {selected_task.reminder ? `在 ${new Date(selected_task.reminder.date).getHours()}:${(new Date(selected_task.reminder.date).getMinutes() < 10 ? '0' : '') + new Date(selected_task.reminder.date).getMinutes()} 时提醒我` : '提醒我'}
                                </div>
                                {selected_task.reminder && <div
                                  className='section-description'>{`${formatDate(selected_task.reminder.date, 'Year')}`}</div>}
                              </div>
                            </div>
                          </button>
                          {selected_task.reminder && (
                            <button className="section-delete" title="移除提醒我" onClick={e => {
                              e.stopPropagation()
                              taskAction.setTaskReminder(selected_task)
                            }}>
                              <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170"
                                   width=".6rem" height=".6rem">
                                <path
                                  d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                  p-id="2171" fill="#767678"></path>
                              </svg>
                            </button>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuTrigger id='taskSchedule-deadline' holdToDisplay={0}>
                        <div
                          className={`section-item ${selected_task.due_date ? 'isSet' : ''} ${selected_task.due_date ? (selected_task.completed ? 'isInactive' : (new Date(selected_task.due_date).getTime() < new Date().setHours(0, 0, 0, 0) ? 'isPast' : '')) : ''}`}>
                          <button className='section-innerClick'>
                            <div className='section-inner'>
                              <div className='section-icon'>
                                <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg"
                                     p-id="8197" width="1em" height="1em">
                                  <path
                                    d="M288 128v32H160v704h704V160h-128V128h-64v32H352V128zM224 224h64v32h64V224h320v32h64V224h64v64H224z m0 128h576v448H224z m192 64v64h64v-64z m128 0v64h64v-64z m128 0v64h64v-64zM288 544v64h64v-64z m128 0v64h64v-64z m128 0v64h64v-64z m128 0v64h64v-64zM288 672v64h64v-64z m128 0v64h64v-64z m128 0v64h64v-64z"
                                    p-id="8198"></path>
                                </svg>
                              </div>
                              <div className='section-content'>
                                <div className='section-title'>
                                  {
                                    selected_task.due_date ? (
                                      new Date(selected_task.due_date).getTime() < new Date().setHours(0, 0, 0, 0) ? (
                                        `过期时间：${new Date(selected_task.due_date).getFullYear() !== new Date().getFullYear() ? formatDate(selected_task.due_date) : formatDate(selected_task.due_date, 'Year')}`
                                      ) : (
                                        `${new Date(selected_task.due_date).getFullYear() !== new Date().getFullYear() ? formatDate(selected_task.due_date) : formatDate(selected_task.due_date, 'Year')} 到期`
                                      )
                                    ) : '添加截止日期'
                                  }
                                </div>
                              </div>
                            </div>
                          </button>
                          <button className="section-delete" title="删除截止日期"
                                  onClick={() => taskAction.setTaskDueDate(selected_task)}>
                            <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170"
                                 width=".6rem" height=".6rem">
                              <path
                                d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                p-id="2171" fill="#767678"></path>
                            </svg>
                          </button>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuTrigger id='taskSchedule-repeat' holdToDisplay={0}>
                        <div className={`section-item ${selected_task.recurrence ? 'isSet' : ''}`}>
                          <button className='section-innerClick'>
                            <div className='section-inner'>
                              <div className='section-icon'>
                                <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg"
                                     p-id="55386" width="1rem" height="1rem">
                                  <path
                                    d="M704.977934 375.943557c13.492638-0.980708 26.985275-2.135412 40.525367-2.673219 8.723552-0.340084 11.91876 3.100301 12.496112 12.258844 0.363811 5.931699 0.347993 11.863398 0.411264 17.795096 0.506172 48.386844 0.869982 96.773689 1.534333 145.128898 0.158179 11.784308 1.249611 23.505345 1.937688 35.258018 11.808035 7.750753 24.636322 0.632715 36.855622 2.475495 1.660876 0.253086 3.416659-0.015818 5.101261-0.237268 3.92283-0.498263 5.718158-3.029121 6.07406-6.73841 0.237268-2.530858 0.284722-5.085443 0.300539-7.616301 0.363811-60.234424 0.197723-120.437213 3.005394-180.655819 2.103776-45.737352 0.711804-91.640792 1.700421-137.457233 0.379629-16.371489-1.384063-30.488932-17.795097-38.706312-2.103776-1.059797-3.717198-3.456203-5.188259-5.48089-6.192694-8.423012-15.02697-10.43979-24.715412-10.471426-9.332539-0.023727-18.696715 0.063271-28.029254-0.181905-8.320196-0.189814-9.870347-1.281247-11.84758-10.155068-1.993051-9.079454-2.720673-18.427811-4.80863-27.483538-2.254046-9.664715-7.292035-17.186109-18.467356-18.158907-2.530858-0.22145-5.030081-0.695986-7.553029-1.059797-9.807075-1.447335-16.592939 3.03703-17.747643 12.73338a152.484204 152.484204 0 0 0-0.869983 22.87263c0.727622 23.117807 0.102816 21.235482-22.643271 22.018466-5.077534 0.189814-10.178795 0.094907-15.240512-0.332175-4.761177-0.395447-7.339489-3.47993-8.280651-8.122473-2.570403-12.417023-4.903538-24.881499-7.908932-37.195706-2.720673-11.135776-10.914326-16.703664-21.615111-19.123797-13.310732-3.005394-19.060525 0.268904-22.524637 13.239552-1.526424 5.694431-2.609947 11.54704-3.321751 17.415468-1.059797 8.351832 0.869982 18.206361-2.926305 24.80241-5.164532 8.905457-17.431286 2.870942-25.941296 6.350872-1.550151 0.632715-3.266389 0.925345-4.927265 1.154704-4.745359 0.632715-7.671664-1.281247-9.364175-6.43787-3.733016-11.230683-6.880771-22.682816-11.191138-33.668323-1.77951-4.468546-5.156623-9.704259-9.174361-11.586585-6.991496-3.242662-12.828287-7.55303-19.020981-11.863397-7.228764-5.061716-18.411993 0.577352-19.637878 9.332539-0.869982 5.828883-0.949072 11.831762-0.869982 17.739734 0.22145 11.03296 0.933254 22.050102 1.233793 33.059335 0.253086 9.601443-1.70042 11.388862-12.021576 11.76849-3.400841 0.134452-6.801681 0.158179-10.186704 0.118634-33.850228-0.316357-26.732189 4.168007-34.324764-29.357955a164.149878 164.149878 0 0 0-7.616301-24.043152c-2.73649-6.880771-8.541646-9.965254-16.031405-10.495153-12.606837-0.893709-22.619545 5.820974-33.154242 10.795692-1.913961 0.909527-3.574837 3.938648-3.92283 6.200603-0.759257 4.966809-0.846256 10.091797-0.790893 15.153513 0.023727 9.332539 0.498263 18.641352 0.474536 27.965983 0 3.685562-2.261954 6.540687-6.034515 6.777954a678.586343 678.586343 0 0 1-30.528476 1.075615c-6.643503 0.102816-9.522354-2.554585-9.807076-8.731461-0.300539-6.770046 0.332175-13.658725-0.616896-20.325954-1.898144-13.128827-7.513485-24.462326-19.851419-30.765745-3.400841-1.739965-9.095272-2.641583-12.021576-0.949072-10.384427 6.010788-19.819783 13.413548-18.902347 27.523083 0.506172 7.62421 1.028161 15.240511 1.225884 22.856813 0.268904 9.032-2.412224 12.243026-11.412588 13.334458-6.722592 0.846256-13.524273 1.241702-20.294319 1.55806-6.864953 0.316357-9.688441-2.008869-10.083888-8.185744-0.237268-4.215461 0.347993-8.565373-0.395447-12.693836-1.154704-6.643503-2.29359-13.47682-4.903537-19.61415-5.805156-13.888084-21.354116-18.348722-33.897682-10.637514-7.355307 4.531818-9.490718 11.895033-10.170886 19.511335-0.790893 9.277177-0.276813 18.641352-0.52199 27.973891-0.134452 5.006354-3.353387 8.304378-8.011747 7.7033-17.763461-2.29359-35.329198 1.225884-52.950298 1.834872-22.350641 0.775075-32.062809 13.413548-29.603132 35.163111 0.569443 5.045898 2.159138 10.012708 2.388497 15.042788 1.660876 36.475993 1.913961 72.951986-0.901618 109.404253-0.656441 8.43883-1.913961 16.893478-1.7716 25.308581 0.759257 41.521892-0.869982 83.012148 2.609947 124.565675 3.432476 41.363713 6.485324 82.759062 10.091797 124.091139 3.321751 38.010326 5.164532 76.139286 6.880771 114.23661 0.711804 15.46987 4.001919 29.951125 9.411628 44.369107 5.4018 14.346802 15.754592 24.35951 28.274431 31.200736 20.325955 11.072504 43.166949 16.948841 66.007945 15.580595 21.306662-1.304974 42.27324 0.917436 63.382179 1.028162 26.320925 0.158179 52.626032 0.047454 78.931138 0.047453v1.18634c28.021345 0 56.011055 0.031636 84.016582-0.047454 6.785863-0.031636 13.801086 0.514081 20.325955-1.004434 27.46772-6.358781 55.678879-4.44482 83.478774-7.671664 26.439559-3.052848 22.959629-0.498263 23.434165-27.032728 0.063271-3.400841 0.031636-6.817499-0.102816-10.186705-0.340084-8.486284-2.388497-11.009233-10.408154-10.66124-27.918529 1.162613-55.995237-0.790893-83.779314 4.349913-9.126907 1.660876-18.58599 1.92187-27.918529 1.977233-36.475993 0.079089-72.983622-0.102816-109.475433-0.355902-7.62421-0.039545-15.374963-0.142361-22.856813-1.455243-15.185149-2.657401-30.188392-3.400841-45.500084-0.89371-7.47394 1.233793-15.280056 0.972799-22.872631 0.506172-21.702109-1.320792-34.94166-15.422417-46.401702-31.793906-1.344518-1.937688-1.502697-4.824448-1.795328-7.315762-4.982627-42.05179-10.004799-84.087762-11.286046-126.519181-0.893709-29.658494-2.29359-59.396077-5.757702-88.817303-2.704855-22.856813-3.345478-45.634536-3.638109-68.491349-0.253086-20.381317-0.158179-40.754725-0.134451-61.120224 0.015818-5.093352 0.079089-10.186704 0.419173-15.264239 0.205632-3.733016 2.254046-6.422053 6.137331-6.754227 8.462557-0.74344 17.004203-0.608988 25.356035-1.898144 44.503559-6.849135 89.21275-9.617261 134.293661-9.435356 42.344421 0.158179 84.665114 1.075615 127.096533-2.29359 41.347895-3.321751 82.964694-3.47993 124.447041-6.501142 35.455741-2.562494 70.895664-6.564413 106.6124-5.536252 5.892154 0.158179 11.808035-1.10725 17.747643-1.534333z m-146.813499-42.692414c-20.246865 1.265429-40.35137 4.66627-60.534964 6.864953-7.560939 0.846256-15.185149 1.391972-22.80145 1.471061-53.464379 0.506172-106.928757 0.81462-160.369409 1.225885a346.173942 346.173942 0 0 0-40.493731 2.689037c-18.451538 2.333135-37.251068 1.85069-55.204343 2.530858-18.13518-2.435951-35.985639 3.242662-53.148021-3.369205-4.44482-16.648301-1.312883-33.597142-1.913962-50.379895-0.395447-11.736855 0.553625-23.521163 1.18634-35.273836 0.079089-0.775075 2.507131-1.581786 3.938648-2.024687 0.506172-0.158179 1.660876 0.498263 1.961415 1.067706 1.10725 2.190774 2.277772 4.429002 2.847215 6.801682 1.787419 7.434396 2.870942 15.02697 5.03799 22.303187 3.179391 10.582151 13.840631 16.822298 23.679341 14.497072 8.011748-1.898144 13.579636-6.999405 16.529668-14.473345 1.85069-4.697905 2.609947-9.822893 3.756742-14.789702 2.926305-12.393296 3.321751-12.796652 14.212351-12.598929 4.22337 0.079089 8.462557 0.340084 12.693835 0.616897 13.247461 0.909527 13.484729 0.893709 16.031405 16.331944 1.012343 6.208511 3.290116 11.309772 8.383467 15.02697 4.349912 3.195208 9.126907 4.531818 14.283531 2.29359 12.021576-5.235713 22.991265-11.230683 23.449983-26.890367 0.079089-2.008869 4.476455-5.409709 7.054767-5.575797 11.808035-0.759257 23.703068-0.775075 35.574375-0.648533 3.661835 0.039545 5.820974 2.673219 6.564413 6.485324 1.463152 7.434396 2.182865 15.185149 4.982627 22.06592 5.828883 14.275622 21.148483 18.902347 33.502235 10.558424 13.1051-8.81055 22.619545-20.009597 24.675867-36.72117 1.138886-9.071545 4.44482-11.191138 13.381913-12.353752a172.833885 172.833885 0 0 1 17.716007-1.621331c7.299944-0.189814 15.556869-7.434396 21.472749-0.395446 3.875377 4.650452 3.677653 12.654291 5.694431 19.005163 1.763692 5.615342 3.282207 11.531222 6.271783 16.50594 9.648897 16.078858 30.251664 16.237037 39.331118 0.063272 3.622291-6.461597 5.18035-14.21235 6.857043-21.559748 1.123068-4.903538 0.74344-10.123433 1.138887-15.208876 0.395447-4.903538 3.242662-7.592574 8.019656-8.177835 8.383468-0.96489 16.80648-1.842781 25.229493-2.657401 3.978193-0.395447 6.683047 1.913961 7.292035 5.457162 1.684602 9.99689 2.847215 20.072869 4.255005 30.109304 1.708329 12.179755 11.03296 19.281976 23.370893 17.76346 17.810914-2.214501 30.338662-14.932063 32.980246-33.320329 0.711804-4.903538 0.340084-10.858963 3.037029-14.315167 4.081009-5.219895 11.009233-2.07214 16.687846-1.423607 4.160098 0.474536 8.225289 2.00096 12.337934 2.989576 12.235117 2.95794 12.274662 2.95794 13.627089 14.180714 0.379629 3.353387 0.031636 6.936133 1.012344 10.083888 1.265429 3.938648 2.950032 8.051293 5.536252 11.199048 6.327145 7.719117 14.924154 11.942487 24.739138 9.514445 9.4749-2.325226 16.395215-8.88173 19.455972-18.459447 1.550151-4.824448 1.384063-10.249976 3.440386-14.73434 1.028161-2.261954 5.219895-3.859559 8.146199-4.175916 1.795328-0.197723 4.191734 2.29359 5.820974 4.057282 1.043979 1.130977 1.542242 3.100301 1.581786 4.721632 0.553625 17.795096 1.028161 35.621829 1.320792 53.424834 0.063271 4.642543-3.03703 7.592574-7.972203 7.988021-4.215461 0.316357-8.478375 0.632715-12.693836 0.434992-30.623384-1.471061-61.112316 0.972799-91.269072 5.101261-27.863167 3.812105-55.773787 3.994011-83.636953 5.789338z m404.779126 484.516977c0-8.011748 0.142361-13.097191-0.023727-18.190543-1.312883-44.448196-14.678977-84.823293-40.762634-120.90384-19.827692-27.443993-47.08978-43.894571-79.58758-50.973065-59.07972-12.796652-114.45806-1.344518-166.419742 28.448427-7.299944 4.191734-13.856448 9.727986-20.405044 15.10606-19.432245 15.92068-32.157716 36.736988-43.483306 58.826634-15.46987 30.196301-22.271552 62.029752-20.167776 95.745528 0.514081 8.415103 2.689037 16.719482 3.638108 25.150403 4.136371 36.270361 17.818823 68.70489 39.734473 97.675307a133.755854 133.755854 0 0 0 39.726565 35.273835c5.140806 2.973758 8.304378 1.913961 13.366094-2.159138 10.463517-8.43883 7.212946-22.184554 13.207916-32.292168 0.608988-1.028161-0.213541-3.377114-1.012343-4.721632-2.989576-5.101261-5.33062-11.072504-9.601443-14.821339-12.765016-11.214865-18.087727-26.447468-23.829612-41.403257-6.07406-15.873226-8.818459-32.584799-12.06112-49.241009-4.950991-25.308582-0.893709-48.687384 9.965254-71.599559 10.234158-21.591384 22.437639-41.506074 38.690494-59.396078 8.937093-9.862438 18.372448-16.450578 30.734108-20.998213 24.438599-8.937093 49.430823-10.73242 75.055763-9.99689 36.523447 1.043979 63.247727 17.320561 79.184224 50.142627a221.73481 221.73481 0 0 1 13.413548 35.542739c7.861478 27.443993 6.089877 55.647244 2.870943 83.375959-3.005394 26.083657-14.916245 48.481752-36.191272 64.956056-1.724147 1.297065-4.215461 1.581786-6.350872 2.333135-0.601079-2.37268-1.676694-4.745359-1.739965-7.173401-0.134452-5.907972 0.276813-11.863398 0.316357-17.779279 0.031636-5.441345-2.135412-9.783349-6.690956-12.946921-2.783944-1.937688-5.298984-4.302459-8.185745-6.074059-12.472385-7.7033-26.835005-5.267349-35.90655 6.722592-9.25345 12.14021-17.700189 24.881499-26.755916 37.148252-6.524869 8.858004-12.132301 19.107979-20.515769 25.704028-11.641948 9.174361-14.054172 20.484133-13.903902 33.565506 0.158179 12.772925 5.876336 22.018466 18.411993 23.884974 14.489163 2.198683 27.230452 9.055727 41.150172 12.369569 20.586949 4.927264 41.252988 9.62517 61.926936 14.054172 4.919356 1.051888 10.155068 1.210067 15.185149 0.925345 20.697674-1.10725 32.157716-23.829611 20.365499-40.912904-3.242662-4.66627-8.889639-7.592574-12.891559-11.808035-1.10725-1.18634-1.233793-5.085443-0.158178-6.271783a68.11172 68.11172 0 0 1 11.341408-10.060161c16.980476-12.179755 28.764785-28.495881 38.279229-46.78924 15.295874-29.310501 21.275026-60.582417 20.136141-90.478179zM527.280056 505.238773l0.094907-0.569443c6.746319 0.316357 13.524273 1.059797 20.262683 0.869982 9.316722-0.253086 16.347762-5.599524 17.162382-12.21139 0.790893-6.248056-4.713723-14.315166-12.14021-17.731825a23.584434 23.584434 0 0 0-2.341044-0.925345c-21.464841-6.722592-43.380491-6.95986-65.359412-3.954466-6.248056 0.838347-10.416063 5.433436-11.610311 11.974122-1.455243 8.098746 3.084483 15.912771 11.151593 17.194018 14.172806 2.254046 28.495881 3.638109 42.771503 5.346438z m-258.123805-20.365499c-3.321751-0.521989-6.706774-0.569443-10.083888-0.632715-5.907972-0.094907-11.823853-0.023727-17.731825-0.023727v0.442901c-9.277177 0-18.58599-0.490354-27.815713 0.14236-9.016182 0.59317-14.591979 6.287601-15.319601 13.998809-0.775075 8.169926 2.712764 13.824813 11.62613 17.368015 4.610907 1.858599 9.593534 3.638109 14.473345 3.875376 13.484729 0.632715 27.001093 0.4429 40.493731 0.514081a26.890368 26.890368 0 0 0 5.03008-0.537808c8.304378-1.660876 15.367054-9.965254 15.185149-17.874185-0.158179-7.908932-7.323671-15.857408-15.865317-17.241472zM486.770508 605.682206c7.940567 2.673219 16.244946 4.270823 22.904266 5.931699 10.202522-1.637149 18.562263-2.878851 26.87455-4.397366 4.136371-0.759257 8.43883-1.447335 12.179755-3.203118 6.422053-3.052848 11.127867-7.948476 11.072504-15.659684-0.079089-6.754228-7.220855-14.180715-14.734339-15.533142-2.467587-0.419173-5.085443-0.656441-7.592575-0.419174-13.461002 1.289156-26.94573 2.546676-40.359279 4.302459-4.049373 0.529898-8.098746 2.277772-11.784308 4.160098-5.061716 2.59413-6.841226 7.339489-6.501142 12.81247s2.783944 10.265793 7.956386 11.997849zM353.48919 513.914871a744.467745 744.467745 0 0 0 39.900561-4.168007c4.824448-0.656441 9.704259-2.451769 14.077898-4.66627 6.501142-3.266389 7.766571-14.813429 2.119594-19.535061-3.084483-2.570403-7.078494-4.856084-10.961779-5.559979-6.540687-1.146795-13.32655-0.909527-17.779279-1.146795-9.807075 0.632715-17.39965 0.672259-24.834046 1.7716a70.286676 70.286676 0 0 0-16.830206 4.769086c-5.931699 2.499222-8.43883 7.750753-8.098747 14.275622 0.355902 6.168967 3.954466 11.341408 10.107615 12.946921 3.954466 1.028161 8.249016 1.605513 12.306298 1.281247z m196.125689 159.048617a27.554718 27.554718 0 0 0-5.045898 0.023727c-14.156988 1.739965-28.313976 3.456203-42.431419 5.457163-2.37268 0.332175-4.705814 1.676694-6.88077 2.894669-4.840266 2.720673-7.33158 9.126907-6.192694 15.343328 1.004434 5.536252 4.571363 9.316722 9.648897 10.471425 5.662795 1.297065 11.649856 1.138886 20.824217 1.898144 9.25345-1.518515 21.749562-3.084483 34.008406-5.718158 9.77544-2.087958 17.201927-10.969688 15.556869-17.004203-1.898144-7.070585-10.202522-12.788743-19.487608-13.381913z m-350.863938 37.61488c1.977233 5.140806 6.050333 8.249016 11.420497 8.478374 9.213905 0.395447 18.427811 0.079089 27.641716 0.07909v-0.52199h27.681262c12.132301-0.063271 19.756511-9.965254 18.918164-16.276581-1.012343-7.25249-8.43883-13.888084-18.372448-14.259804-14.236077-0.553625-28.551244-0.632715-42.724049 0.498263-6.342963 0.490354-12.670109 3.875377-18.530628 6.88077-5.615342 2.831398-8.011748 9.886165-6.034514 15.074424z m444.046972-114.347335c12.021576 4.943082 24.675867 5.567888 37.456701 5.354346 4.215461 0 8.462557 0.047454 12.693835-0.031635 1.676694-0.015818 3.400841-0.158179 5.03799-0.506172 7.197128-1.40779 13.880175-8.842186 14.425891-15.896953 0.514081-6.770046-5.559979-14.868792-12.812469-17.083292-0.81462-0.260995-1.605513-0.616897-2.428042-0.711804-17.02793-1.637149-33.881864-1.202158-49.905359 5.536252-2.989576 1.265429-5.55207 3.827923-7.877296 6.21642-4.950991 5.164532-2.950032 14.51289 3.416658 17.10702z m-413.478951 25.055495c18.158907 0.506172 29.626858-1.581786 39.465569-9.150634 4.982627-3.796287 7.315762-10.597969 5.520434-15.778319-2.135412-6.200602-6.801681-10.020617-13.17628-10.091796-10.977597-0.158179-21.98683 0.253086-32.901156 1.10725-6.690956 0.498263-13.366095 1.834872-19.875145 3.448294-7.25249 1.795328-10.336974 6.089877-10.044344 12.535657 0.276813 6.429962 3.559019 11.54704 9.822894 13.247461 8.873821 2.388497 17.984911 4.009828 21.156392 4.682087zM676.347602 500.145421a83.518319 83.518319 0 0 0 18.981436-6.168967c6.95986-3.218935 9.886165-10.099706 8.430921-16.648301-1.146795-5.219895-5.868427-8.96082-13.603363-8.937093-16.798571 0.158179-33.636687 0.680168-50.443166 1.645058-7.386942 0.4429-12.693835 6.342963-13.32655 12.970648-0.759257 7.671664 4.429002 15.264238 12.258844 16.672028 6.58814 1.18634 13.366095 1.344518 18.301268 1.795327 7.671664-0.458718 13.69827-0.142361 19.40061-1.312882z m-326.243435 110.487776c12.298389 2.878851 24.596778 6.485324 37.409247 5.219895a95.06536 95.06536 0 0 0 17.281016-3.416658c7.885205-2.37268 12.717562-8.5891 12.005759-14.259804-0.569443-4.539727-6.113604-9.854529-12.81247-10.653331-9.174361-1.067706-18.467356-1.18634-27.704988-1.70833l-0.047453 1.154704c-7.576757 0-15.185149-0.079089-22.777724 0.023727-2.499222 0.047454-5.03799 0.395447-7.513485 0.869983-3.764652 0.688077-8.684007 5.417618-8.130382 8.565373 0.569443 3.084483 1.961415 6.445779 4.017738 8.778914 2.111685 2.420133 5.219895 4.729541 8.304378 5.433436z m7.220855 96.884414c3.290116 2.404315 7.173401 4.618816 11.072504 5.354347 5.718158 1.067706 11.728946 0.759257 17.581556 1.028161 0-0.142361 0.023727-0.284722 0.023726-0.434991 5.852609 0 11.760581 0.253086 17.636918-0.063272 7.829842-0.419173 14.504981-3.717198 20.041233-9.316721 2.926305-2.950032 3.677653-8.573282 0.632715-11.373044-3.559019-3.353387-7.47394-7.798207-11.839671-8.644463-16.592939-3.187299-33.454781-2.81558-50.110992-0.079089-5.156623 0.854165-8.778914 4.88772-10.044343 10.202522-1.289156 5.48089 0.711804 10.178795 4.982627 13.342368z m-45.476358-688.788865h5.48089c-0.300539-2.07214 0-4.508091-1.028161-6.168967a66.276848 66.276848 0 0 0-7.379033-9.807075c-2.989576-3.337569-7.434396-3.590655-11.009233-1.028161-2.81558 2.016778-2.111685 8.027566 1.660875 10.416063 4.136371 2.609947 8.604918 4.642543 12.282571 6.580231z"
                                    p-id="55387"></path>
                                </svg>
                              </div>
                              <div className='section-content'>
                                <div className='section-title'>
                                  {interval()}
                                </div>
                                <div className='section-description'>
                                  {
                                    daysOfWeek().map((d, i, arr) => {
                                      if (i === arr.length - 1) {
                                        return d
                                      }
                                      return d + ', '
                                    })
                                  }
                                </div>
                              </div>
                            </div>
                          </button>
                          <button className="section-delete" title="删除重复">
                            <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170"
                                 width=".6rem" height=".6rem">
                              <path
                                d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                p-id="2171" fill="#767678"></path>
                            </svg>
                          </button>
                        </div>
                      </ContextMenuTrigger>
                    </div>
                    {(selected_list.sharing_status && selected_list.sharing_status !== 'NotShare') && (
                      <div className='section'>
                        <div className={`section-item ${selected_task.assignment ? 'isSet' : ''}`}>
                          <button className='section-innerClick' onClick={state.changeAssignmentModal}>
                            <div className='section-inner'>
                              <div className='section-icon'>
                                {
                                  selected_task.assignment ? (
                                    <div
                                      className='avatar'>{users.find(u => u.user_id === selected_task?.assignment?.assignee)?.username.substring(0, 2)}</div>
                                  ) : <Icon type="user-add"/>
                                }
                              </div>
                              <div className='section-content'>
                                <div
                                  className='section-title'>{selected_task.assignment && users.find(u => u.user_id === selected_task?.assignment?.assignee) ? users.find(u => u.user_id === selected_task.assignment?.assignee)?.username : '分配给'}</div>
                              </div>
                            </div>
                          </button>
                          {selected_task.assignment && (
                            <button className="section-delete" title="删除分配人"
                                    onClick={() => taskAction.assignTask(selected_task)}>
                              <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170"
                                   width=".6rem" height=".6rem">
                                <path
                                  d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                  p-id="2171" fill="#767678"></path>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div className='section'>
                      {selected_task?.linkedEntities?.map((file, index) => (
                        <a key={index} className="link section-item file-item" rel="noopener noreferrer"
                           id="l-2auvz9rbfqt"
                           href={documentTypes.includes(file.extension) ? `https://view.officeapps.live.com/op/view.aspx?src=${file.weblink}` : file.weblink}
                           target="_blank" download={file.display_name}>
                          <div className="thumbnail-wrapper">
                            <div className="thumbnail">{file.extension}</div>
                          </div>
                          <div className="file-content">
                            <div className="file-title">{file.display_name}</div>
                            <div className="file-metadata">
                              <span>{this.bytesToSize(file.preview.size)}</span>
                              <span>{this.mimeTypeTofileName(file.preview.content_type)}</span>
                            </div>
                          </div>
                          <button className="section-delete" title="删除文件" onClick={e => {
                            e.stopPropagation()
                            taskAction.deleteLinkedEntitity(selected_task, file)
                          }}>
                            <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170"
                                 width=".6rem" height=".6rem">
                              <path
                                d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                p-id="2171" fill="#767678"></path>
                            </svg>
                          </button>
                        </a>
                      ))}
                      <div className='section-item'>
                        <button className='section-innerClick'>
                          <div className='section-inner'>
                            <div className='section-icon'>
                              <Icon type="paper-clip"/>
                            </div>
                            <div className='section-content'>
                              <input
                                id="fileAttach"
                                className="inputFile"
                                type="file"
                                tabIndex={-1}
                                onChange={() => {
                                  // const file = (document.getElementById('fileAttach') as HTMLInputElement)?.files ? [0]
                                  // if (file.size > 25 * 1024 * 1024) return message.error('上传文件大小不能超过25MB')
                                  // taskAction.fileUpload(file, selected_task)
                                }}
                              />
                              <label htmlFor='fileAttach' className='section-title'>添加文件</label>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className='section no-border'>
                      <div
                        className={`section-item detailNote ${noteInputVisible ? 'edit' : ''}`}
                        onClick={() => this.setState({noteInputVisible: true})}
                      >
                        <div
                          className={`editableContent ${noteInputVisible ? 'edit' : ''} ${selected_task.note ? '' : 'empty'} multiLine`}>
                          {
                            noteInputVisible ? (
                              <div
                                className="editableContent-edit"
                                draggable="false"
                              >
                                                                <textarea
                                                                  className="editableContent-textarea"
                                                                  draggable="false"
                                                                  placeholder={'添加备注'}
                                                                  defaultValue={selected_task.note || undefined}
                                                                  maxLength={-1}
                                                                  style={{resize: 'none', overflow: 'auto'}}
                                                                  autoFocus
                                                                  onBlur={() => this.setState({noteInputVisible: false})}
                                                                  onChange={e => taskAction.setTaskNote(selected_task, e.target.value)}
                                                                />
                              </div>
                            ) : (
                              <div className='editableContent-display'>
                                <span>{selected_task.note || '添加备注'}</span>
                              </div>
                            )
                          }
                          <div className='editableContent-footer'>
                            <div className='editableContent-lastEdited'>
                              {selected_task.note &&
                              <span>{`已在 ${formatDate(selected_task?.note_updated_at || '')} 更新`}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {((selected_task.comments?.length !== undefined && selected_task.comments.length > 0) || selected_list.sharing_status !== 'NotShare') && (
                      <div className='section'>
                        <div className='chat-window'>
                          <div className='chat-header'>评论</div>
                          <div className='chat-area'>
                            {selected_task.comments?.map((c, i) => {
                              if (c.user_id === user?.user_id) {
                                return (
                                  <div key={i} className='chat-message me'>
                                    <div className='chat-content'>{c.comment}</div>
                                    <div className='chat-avatar'>{c.username?.substring(0, 2)}</div>
                                  </div>
                                )
                              } else {
                                return (
                                  <div key={i} className='chat-message'>
                                    <div className='chat-avatar'>{c.username?.substring(0, 2)}</div>
                                    <div className='chat-content'>{c.comment}</div>
                                  </div>
                                )
                              }
                            })}
                          </div>
                          <div className='chat-submit'>
                            <input
                              ref={ref => this.chatRef = ref}
                              className="chat-input"
                              type="text"
                              placeholder="输入评论"
                              onChange={() => this.setState({chatButtonDisabled: !this.chatRef.value})}
                            />
                            <Button type='primary' style={{width: 60}} disabled={chatButtonDisabled} onClick={() => {
                              taskAction.addComment(this.chatRef.value, JSON.parse(localStorage.user), selected_task)
                              this.chatRef.value = ''
                              this.setState({chatButtonDisabled: true})
                            }}>提交</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className='detailFooter'>
                    <button className='detailFooter-close'
                            onClick={() => this.props.history.push(`/lists/${list_index}`)}>
                      <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="59355"
                           width="1rem" height="1rem">
                        <path
                          d="M567.957453 787.362488l0-95.78453c0-17.632589-14.294564-31.927153-31.927153-31.927153s-31.927153 14.294564-31.927153 31.927153l0 64.111157c0 17.49035-14.178931 31.66928-31.66928 31.66928l-255.92888 0c-17.49035 0-31.66928-14.178931-31.66928-31.66928L184.835705 244.346077c0-17.49035 14.178931-31.66928 31.66928-31.66928l255.92888 0c17.49035 0 31.66928 14.178931 31.66928 31.66928l0 64.0999 0 0 0 0.011256c0 17.632589 14.294564 31.927153 31.927153 31.927153s31.927153-14.294564 31.927153-31.927153l0-0.011256 0 0 0-95.773274c0-35.263132-28.586059-63.84919-63.84919-63.84919L184.832635 148.823514c-35.263132 0-63.84919 28.586059-63.84919 63.84919L120.983445 787.362488c0 35.263132 28.586059 63.84919 63.84919 63.84919l319.275627 0C539.371394 851.212702 567.957453 822.62562 567.957453 787.362488z"
                          p-id="59356" fill="#767678"></path>
                        <path
                          d="M704.94029 286.170648c-12.367679 12.367679-12.367679 32.419364 0 44.787042l137.133264 137.133264L344.212576 468.090954c-17.49035 0-31.66928 14.178931-31.66928 31.66928l0 0.514723c0 17.49035 14.178931 31.66928 31.66928 31.66928l497.860978 0-137.133264 137.133264c-12.367679 12.367679-12.367679 32.419364 0 44.787042l0.364297 0.364297c12.367679 12.367679 32.419364 12.367679 44.787042 0L939.958932 524.361539c6.801916-5.808286 11.119245-14.440897 11.119245-24.086581l0-0.148379 0-0.005117 0-0.207731 0-0.005117 0-0.148379c0-9.645684-4.317329-18.277272-11.119245-24.086581L750.09163 285.806351c-12.367679-12.367679-32.419364-12.367679-44.787042 0L704.94029 286.170648z"
                          p-id="59357" fill="#767678"></path>
                      </svg>
                    </button>
                    <div className='detailFooter-info'>
                      <span className='date'>
                        {
                          selected_task.completed ? (
                            `已由 ${users.find(user => user.user_id === selected_task.completed_by)?.username} 在 ${formatDate(selected_task.completed_at || '')} 完成`
                          ) : (
                            `由 ${users.find(user => user.user_id === selected_task.created_by)?.username} 创建于 ${formatDate(selected_task.created_at)}`
                          )
                        }
                      </span>
                    </div>
                    <button className='detailFooter-trash' onClick={() => taskAction.deleteTask(selected_task._id)}>
                      <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13777"
                           width="1rem" height="1rem">
                        <path
                          d="M402.286446 420.571429v329.142857c0 10.276571-8.009143 18.285714-18.285715 18.285714h-36.571428a18.066286 18.066286 0 0 1-18.285714-18.285714v-329.142857c0-10.276571 8.009143-18.285714 18.285714-18.285715h36.571428c10.276571 0 18.285714 8.009143 18.285715 18.285715z m146.285714 0v329.142857c0 10.276571-8.009143 18.285714-18.285714 18.285714h-36.571429a18.066286 18.066286 0 0 1-18.285714-18.285714v-329.142857c0-10.276571 8.009143-18.285714 18.285714-18.285715h36.571429c10.276571 0 18.285714 8.009143 18.285714 18.285715z m146.285714 0v329.142857c0 10.276571-8.009143 18.285714-18.285714 18.285714h-36.571429a18.066286 18.066286 0 0 1-18.285714-18.285714v-329.142857c0-10.276571 8.009143-18.285714 18.285714-18.285715h36.571429c10.276571 0 18.285714 8.009143 18.285714 18.285715z m73.142857 413.732571V292.608H256.000731v541.696c0 27.428571 15.433143 43.446857 18.285715 43.446857h475.428571c2.852571 0 18.285714-16.018286 18.285714-43.446857zM384.000731 219.428571h256l-27.428571-66.852571A21.942857 21.942857 0 0 0 602.84416 146.285714H421.705874a19.236571 19.236571 0 0 0-9.728 6.290286z m530.285715 18.285715v36.571428c0 10.276571-8.009143 18.285714-18.285715 18.285715H841.143589v541.696c0 62.866286-41.142857 116.553143-91.428572 116.553142h-475.428571c-50.285714 0-91.428571-51.419429-91.428572-114.285714V292.534857H128.000731a18.066286 18.066286 0 0 1-18.285714-18.285714v-36.571429c0-10.276571 8.009143-18.285714 18.285714-18.285714h176.566858L344.576731 123.977143c11.446857-28.013714 45.714286-50.870857 75.995429-50.870857h182.857143c30.281143 0 64.585143 22.857143 75.995428 50.870857l40.009143 95.414857H896.000731c10.276571 0 18.285714 8.009143 18.285715 18.285714z"
                          fill="#767678" p-id="13778"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          }
          {user && <SettingDrawer/>}
          {user && <AccountDrawer/>}
        </div>
        {user && <ContextMenu setListRenameVisible={() => this.setState({listRenameInputVisible: true})}
                              listMenu_obj={selected_list} taskMenu_obj={selected_task || {}}/>}
        {user && users?.find(u => u.user_id === user.user_id) && selected_list.owner_id &&
        <Modal selected_list={selected_list} selected_task={selected_task}/>}
        {/* @ts-ignore */}
        <ListStatisticsModal selected_list={selected_list}/>
      </div>
    )
  }
}

export default inject('data', 'state')(withRouter(observer(Main)))
