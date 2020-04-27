import './index.css'
import React from 'react'
import { observer, inject } from 'mobx-react'
import { Modal, Button, Switch, message } from 'antd'
import getIcon from '../../../../common/icons'
import { shareLink_prefix } from '../../../../common/config'

const ShareModal = ({ selected_list, selected_task, data, state }) => {
    const { listAction, taskAction, users } = data
    if (!selected_list.owner_id) return null
    if (!localStorage.user) return null
    const user_id = JSON.parse(localStorage.user).user_id
    if (!users && !users.find(user => user.user_id === user_id)) return null
    return (
        <>
            {/* 分配任务窗口 */}
            <Modal
                title="分配给"
                width={350}
                centered
                visible={state.assignmentModalVisible}
                onCancel={state.changeAssignmentModal}
                footer={null}
            >
                {
                    <div className='SOModal-members assignment'>
                        <span>列表成员</span>
                        <div className='SOModal-memberItem' onClick={() => {
                            taskAction.assignTask(selected_task, user_id, user_id)
                            state.changeAssignmentModal()
                        }}>
                            <div className='SOModal-memberInfo'>
                                <div className='SOModal-avatar'>
                                    <span>{users.find(user => user.user_id === user_id).username.substring(0, 1)}</span>
                                </div>
                                <span>{users.find(user => user.user_id === user_id).username}</span>
                            </div>
                            <span>(分配给我)</span>
                        </div>
                        {
                            selected_list.owner_id !== user_id && (
                                <div className='SOModal-memberItem' onClick={() => {
                                    taskAction.assignTask(selected_task, user_id, selected_list.owner_id)
                                    state.changeAssignmentModal()
                                }}>
                                    <div className='SOModal-memberInfo'>
                                        <div className='SOModal-avatar'>
                                            <span>{users.find(user => user.user_id === selected_list.owner_id).username.substring(0, 1)}</span>
                                        </div>
                                        <span>{users.find(user => user.user_id === selected_list.owner_id).username}</span>
                                    </div>
                                </div>
                            )
                        }
                        {
                            selected_list.members.filter(m => m !== user_id).map((member, index) => (
                                <div key={index} className='SOModal-memberItem' onClick={() => {
                                    taskAction.assignTask(selected_task, user_id, member)
                                    state.changeAssignmentModal()
                                }}>
                                    <div key={index} className='SOModal-memberInfo'>
                                        <div className='SOModal-avatar'>
                                            <span>{users.find(user => user.user_id === member).username.substring(0, 1)}</span>
                                        </div>
                                        <span>{users.find(user => user.user_id === member).username}</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                }
            </Modal>
            {/* 共享选项弹窗 */}
            <Modal
                title="共享列表"
                width={350}
                centered
                visible={state.shareOptionModalVisible}
                onOk={state.changeShareOptionModal}
                onCancel={state.changeShareOptionModal}
                footer={selected_list.sharing_status !== 'NotShare' && [
                    selected_list.owner_id === user_id ? (
                        <div
                            key='button'
                            onClick={state.changeShareAccessManagement}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                color: '#465efc',
                                fontSize: '16px',
                                padding: '15px 0'
                            }}
                        >
                            管理访问权限
                        </div>
                    ) : (
                        <div
                            key='button'
                            onClick={() => listAction.leaveList(user_id, selected_list)}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                color: '#db3a29',
                                fontSize: '16px',
                                padding: '15px 0'
                            }}
                        >
                            离开列表
                        </div>
                    )
                ]}
            >
                {
                    selected_list.sharing_status === 'NotShare' ? (
                        <>
                            <div style={{ textAlign: 'center' }}>{getIcon({ name: 'Share-list-new', size: '100' })}</div>
                            <p className="sharing-state"><span>请邀请一些人员。在其加入后，将在此处显示。</span></p>
                            <Button type='primary' block onClick={() => listAction.openShare(selected_list)}>创建邀请链接</Button>
                        </>
                    ) : users.length > 0 && (
                        <div className='SOModal-members'>
                            <span>列表成员</span>
                            <div className='SOModal-memberItem'>
                                <div className='SOModal-memberInfo'>
                                    <div className='SOModal-avatar'>
                                        <span>{users.find(user => user.user_id === selected_list.owner_id).username.substring(0, 1)}</span>
                                    </div>
                                    <span>{users.find(user => user.user_id === selected_list.owner_id).username}</span>
                                </div>
                                <span>所有者</span>
                            </div>
                            {selected_list.members.map((member, index) => (
                                <div key={index} className='SOModal-memberItem'>
                                    <div key={index} className='SOModal-memberInfo'>
                                        <div className='SOModal-avatar'>
                                            <span>{users.find(user => user.user_id === member).username.substring(0, 1)}</span>
                                        </div>
                                        <span>{users.find(user => user.user_id === member).username}</span>
                                    </div>
                                    {selected_list.owner_id === user_id && (
                                        <div className='SOModal-memberDelete' onClick={() => listAction.removeMember(member, selected_list)}>
                                            <svg viewBox="64 64 896 896" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170" width=".6rem" height=".6rem"><path d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496" p-id="2171" fill="#767678"></path></svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                }
                <div className='SOModal-inviteLink'>
                    {selected_list.sharing_status === 'Open' && (
                        <div className='CopySharingLink'>
                            <input
                                id='share-link'
                                className="CopySharingLink-input"
                                tabIndex="-1"
                                type="text"
                                readOnly
                                value={`${shareLink_prefix}sharing/${selected_list.invitation_token}`}
                                onChange={e => console.log(e.target.value)}
                            />
                            <Button onClick={() => {
                                const shareLinkInput = document.getElementById('share-link')
                                shareLinkInput.select()
                                document.execCommand('copy')
                                message.success('复制成功')
                            }}>复制链接</Button>
                        </div>
                    )}
                    <span>具有此链接和 ToDo 账户的任何人都可以加入并编辑此列表。</span>
                </div>
            </Modal>
            <Modal
                title="管理访问权限"
                width={350}
                centered
                visible={state.shareAccessManagementModalVisible}
                onOk={state.changeShareAccessManagement}
                onCancel={state.changeShareAccessManagement}
                footer={null}
            >
                <div className='SAMModal-limitAccess'>
                    <div className='limitAccess-around'>
                        <span>将访问权限限制于当前成员</span>
                        <Switch checkedChildren="开" unCheckedChildren="关" defaultChecked={selected_list.sharing_status === 'Limit'} onClick={() => listAction.limitShare(selected_list)} />
                    </div>
                    <span>打开此切换可防止新的人员加入列表。</span>
                </div>
                <div className='SAMModal-link'>
                    <span>邀请链接</span>
                    {selected_list.sharing_status === 'Open' && <p style={{ userSelect: 'all' }}>{`${shareLink_prefix}sharing/${selected_list.invitation_token}`}</p>}
                </div>
                <Button type="danger" size='large' block onClick={() => {
                    state.changeShareAccessManagement()
                    state.changeShareOptionModal()
                    listAction.closeShare(selected_list)
                }}>停止共享</Button>
            </Modal>
        </>
    )
}

export default inject('data', 'state')(observer(ShareModal))