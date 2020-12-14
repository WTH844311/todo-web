import React, {FC, useEffect, useMemo, useState} from 'react'
import {inject, observer} from "mobx-react";
import {withRouter} from 'react-router-dom'
import './index.css'
import {IList} from "../../../../stores/types";
import {ContextMenuTrigger} from "react-contextmenu";
import getIcon from "../../../../common/icons";
import {Icon} from "antd";
import Notification from "../notification";
import TaskItem from './TaskItem'

const Tasks: FC<any> = ({ state, data, list_index, selected_list, searchData, searchValue, reminderList, setReminderList, history, fromTask, setFromTask }) => {
  const [listRenameInputVisible, setListRenameInputVisible] = useState(false)

  useEffect(() => {
    const foo = state => setListRenameInputVisible(state)
    addEventListener('changeListRenameInputVisible', foo)

    return () => {
      removeEventListener('changeListRenameInputVisible', foo)
    }
  }, [])

  const {lists, users, listAction, taskAction} = data
  const {changeShareOptionModal} = state
  const taskItemProps = {lists, users, selected_list, list_index, taskAction, fromTask, setFromTask, history}
  const sortType = () => {
    const o = {1: '重要性', 2: '截止日期', 3: '是否添加到 “我的一天”', 4: '完成状态', 5: '字母顺序', 6: '创建日期'}
    return (o as any)[selected_list.sort_type]
  }
  const getSortedList = useMemo(() => {
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
  }, [selected_list])

  return (
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
                      onBlur={() => setListRenameInputVisible(false)}
                      onKeyDown={e => {
                        const target = e.target as HTMLInputElement;
                        if (e.keyCode === 13 && target.value !== '') {
                          listAction.renameList(selected_list, target.value)
                          setListRenameInputVisible(false)
                        }
                      }}
                    />
                  ) : (
                    <h2 className='listTitle' style={searchData ? {color: 'blue'} : undefined} onClick={() => {
                      if (!selected_list.defaultList) setListRenameInputVisible(true)
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
                            d="M922.3 45786 372.183628l-39.393195 38.687114L676.138314 211.079416l0 683.909301-54.713113 0L621.425202 129.010259l53.320393 0L922.345786 372.183628zM349.254406 894.989741 101.654214 651.815349l39.393195-38.687114 206.814276 199.792349L347.861686 129.010259l54.713113 0 0 765.978459L349.254406 894.988718z"
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
            setReminderList={setReminderList}
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
                          {searchData.tasks.map((task, index) => <TaskItem task={task} index={index} {...taskItemProps}/>)}
                        </>
                      )}
                      {searchData.note.length > 0 && (
                        <>
                          <h3 className="searchResultsGroup-header"><span>备注</span></h3>
                          {searchData.note.map((task, index) => <TaskItem task={task} index={index} {...taskItemProps}/>)}
                        </>
                      )}
                      {searchData.step.length > 0 && (
                        <>
                          <h3 className="searchResultsGroup-header"><span>步骤</span></h3>
                          {searchData.step.map((task, index) => <TaskItem task={task} index={index} {...taskItemProps}/>)}
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
                          getSortedList?.filter(t => !t.completed || selected_list.show_completed).map((task, index) => <TaskItem task={task} index={index} {...taskItemProps}/>)
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
  )
}

export default inject('state', 'data')(withRouter(observer(Tasks)))