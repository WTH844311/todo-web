import React, {FC} from "react";
import {Modal as AntdModal} from "antd";
import {ModalProps} from "../index";
import {inject, observer} from "mobx-react";

const Index: FC<ModalProps> = ({selected_list = {}, selected_task = {}, data, state}) => {
  const {taskAction, users = []} = data || {}
  const {
    assignmentModalVisible,
    changeAssignmentModal,
  } = state || {}
  const user_id = data?.user?.user_id
  return (
    <AntdModal
      title="分配给"
      width={350}
      centered
      visible={assignmentModalVisible}
      onCancel={changeAssignmentModal}
      footer={null}
    >
      {
        <div className='SOModal-members assignment'>
          <span>列表成员</span>
          <div className='SOModal-memberItem' onClick={() => {
            taskAction.assignTask(selected_task, user_id, user_id)
            changeAssignmentModal()
          }}>
            <div className='SOModal-memberInfo'>
              <div className='SOModal-avatar'>
                <span>{users?.find(user => user.user_id === user_id).username.substring(0, 1)}</span>
              </div>
              <span>{users?.find(user => user.user_id === user_id).username}</span>
            </div>
            <span>(分配给我)</span>
          </div>
          {selected_list.owner_id !== user_id && (
            <div className='SOModal-memberItem' onClick={() => {
              taskAction.assignTask(selected_task, user_id, selected_list.owner_id)
              changeAssignmentModal()
            }}>
              <div className='SOModal-memberInfo'>
                <div className='SOModal-avatar'>
                  <span>{users?.find(user => user.user_id === selected_list.owner_id).username.substring(0, 1)}</span>
                </div>
                <span>{users?.find(user => user.user_id === selected_list.owner_id).username}</span>
              </div>
            </div>
          )}
          {selected_list.members?.filter(m => m !== user_id).map((member, index) => (
            <div key={index} className='SOModal-memberItem' onClick={() => {
              taskAction.assignTask(selected_task, user_id, member)
              changeAssignmentModal()
            }}>
              <div key={index} className='SOModal-memberInfo'>
                <div className='SOModal-avatar'>
                  <span>{users?.find(user => user.user_id === member).username.substring(0, 1)}</span>
                </div>
                <span>{users?.find(user => user.user_id === member).username}</span>
              </div>
            </div>
          ))}
        </div>
      }
    </AntdModal>
  )
}

export default inject('data', 'state')(observer(Index))
