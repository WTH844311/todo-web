import './index.css'
import React, {FC} from 'react'
import {inject, observer} from 'mobx-react'
import {DataType, ITask} from "../../../../stores/types";

type NotificationProps = {
  data?: DataType
  task: ITask
  setReminderList: any
  reminderList: ITask[]
}

const Notification: FC<NotificationProps> = ({task, setReminderList, reminderList, data}) => {
  const finish = () => {
    let index, arr = JSON.parse(JSON.stringify(reminderList))
    reminderList.map((v, i) => {
      if (v._id === task._id) return index = i
    })
    arr.splice(index, 1)
    setReminderList(arr)
  }

  const {sound} = JSON.parse(localStorage.setting)
  return (
    <div id="notifications">
      <div className="notificationToast toast-transition-enter-done">
        <div className="notificationToast-body">
          <span
            className="checkBox big"
            title="共享任务一, 标记为已完成"
            role="checkbox"
            tabIndex={0}
            onClick={() => {
              if (!task.completed && sound) new Audio('/res/audio/done.wav').play()
              data?.taskAction.changeTaskCompleted(task)
              finish()
            }}
          >
            <i className="icon svgIcon checkbox-20">
              <svg focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                   viewBox="0 0 24 24"><path fillRule="evenodd"
                                             d="M12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8m0-17c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9"></path></svg>
            </i>
            <i className="icon svgIcon checkbox-completed-outline-20 checkBox-hover">
              <svg focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                   viewBox="0 0 24 24"><g fillRule="evenodd"><path
                d="M12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8m0-17c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9"></path><path
                d="M10.9902 13.3027l-2.487-2.51-.71.704 3.193 3.224 5.221-5.221-.707-.707z"></path></g></svg>
            </i>
          </span>
          <div className="notificationToast-textWrapper">
            <div className="notificationToast-text" role="button" tabIndex={0}>
              <p id="detail-hint" className="hidden">点击以查看任务详细信息</p>
              <span><span>提醒：{task.title}</span></span>
            </div>
            <div className="metaDataInfo">
              <span className="metaDataInfo-group">
                <span className="taskItemInfo-reminder" title="明天">
                  <i className="icon svgIcon reminder-16">
                    <svg focusable="false" xmlns="http://www.w3.org/2000/svg" width="16"
                         height="16" viewBox="0 0 16 16"><path fillRule="evenodd"
                         d="M5 10V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H5zm2 1h2c0 .551-.449 1-1 1-.551 0-1-.449-1-1zm5-1V7c0-2.206-1.794-4-4-4S4 4.794 4 7v3H3v1h3c0 1.103.897 2 2 2s2-.897 2-2h3v-1h-1z"></path></svg>
                  </i>
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="notificationToast-buttons">
          <button className="notificationToast-postponeButton" onClick={() => {
            data?.taskAction.snooze(task)
            finish()
          }}>
            <span>推迟</span>
          </button>
          <button className="notificationToast-cancelButton" onClick={finish}><span>解除</span></button>
        </div>
      </div>
    </div>
  )
}

export default inject('data')(observer(Notification))
