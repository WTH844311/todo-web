import React, {FC} from "react";
import {ContextMenuTrigger} from "react-contextmenu";
import {formatDate} from "../../../../common/util";
import getIcon from "../../../../common/icons";


const TaskItem: FC<any> = ({ task, index, lists, users, selected_list, list_index, taskAction, fromTask, setFromTask, history }) => {
  return (
    <div id={`taskItem-${index}`} key={task.local_id} className={`taskItem ${task.completed && 'completed'}`}
         onClick={() => history.push(`/lists/${list_index}/tasks/${task.local_id}`)}
         onMouseDown={e => {
           if (e.button === 2) history.push(`/lists/${list_index}/tasks/${task.local_id}`)
         }}
         draggable
         onDragStart={() => setFromTask(task)}
         onDragOver={e => e.preventDefault()}
         onDragEnd={() => setFromTask(null)}
         onDrop={() => taskAction.swapTaskPosition(fromTask, task)}
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

export default React.memo(TaskItem)