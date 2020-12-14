import React, {FC, useState} from 'react'
import {inject, observer} from 'mobx-react'
import {Icon} from "antd";
import {ContextMenuTrigger} from "react-contextmenu";
import {IList} from "../../../../stores/types";
import './index.css'
import {withRouter} from "react-router-dom";

const Lists: FC<any> = ({ data, list_index, selected_list, searchValue, setSearchValue, history, fromTask, setFromTask }) => {
  const [listsExpand, setListsExpand] = useState(true)
  const [fromList, setFromList] = useState<IList | null>(null)
  const changeColumnState = () => {
    setListsExpand(!listsExpand)
  }
  const setListIndex = (newIndex: string) => history.push(`/lists/${newIndex}`)
  const {
    listAction,
    myday,
    important,
    planned,
    assigned_to_me,
    inbox,
    lists,
    users,
    user
  } = data
  if (!users) return null
  const defaultList = [myday, important, planned, assigned_to_me, inbox]
  return (
    <div
      className={`leftColumn ${listsExpand ? 'leftColumn-entered' : 'leftColumn-exited'}`}
    >
      <div className='sidebar'>
        <div className='sidebar-header'>
          <div className='hamburgerMenu' onClick={changeColumnState}>
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
                        onClick={() => setListIndex(list._id)} onMouseDown={e => {
                      if (e.button === 2) setListIndex(list._id)
                    }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => {
                          if (fromTask && fromTask._id !== '000000000000000000000000') {
                            data.taskAction.moveTaskToList(fromTask, '000000000000000000000000')
                          }
                        }}
                        onDragEnd={() => {
                          setFromList(null)
                          setFromTask(null)
                        }}
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
                  onClick={() => setListIndex(list._id)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => {
                    if (fromTask) {
                      if (list._id === 'myday' && !fromTask.myDay) {
                        data.taskAction.changeTaskMyday(fromTask)
                      } else if (list._id === 'important' && !fromTask.importance) {
                        data.taskAction.changeTaskImportance(fromTask)
                      } else if (selected_list.sharing_status !== 'NotShare' && list._id === 'assigned_to_me') {
                        const {user_id}: any = user
                        data.taskAction.assignTask(fromTask, user_id, user_id)
                      }
                    }
                  }}
                  onDragEnd={() => {
                    setFromList(null)
                    setFromTask(null)
                  }}
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
                      if (searchValue !== '') setSearchValue('')
                      setListIndex(list.local_id)
                    }} onMouseDown={e => {
                      if (e.button === 2) setListIndex(list.local_id)
                    }}
                     draggable
                     onDragStart={() => setFromList(list)}
                     onDragOver={e => e.preventDefault()}
                     onDrop={() => {
                       if (fromList) {
                         data.listAction.swapListPosition(fromList, list)
                       } else {
                         data.taskAction.moveTaskToList(fromTask, list._id)
                       }
                     }}
                     onDragEnd={() => setFromList(null)}
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
  )
}

export default inject('data')(withRouter(observer(Lists)))