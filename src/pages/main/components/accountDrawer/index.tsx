import './index.css'
import React, { FC } from 'react'
import { observer, inject } from 'mobx-react'
import { withRouter } from 'react-router-dom'
import { Drawer } from 'antd'
import { DataType } from '../../../../stores/types'

const logOut = (history: string[], changeAccountDrawer: any, data: DataType) => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (data.ws !== null) data.ws.close()
    changeAccountDrawer()
    history.push('/user/login')
}

const AccountDrawer: FC<any> = ({ history, state, data }) => {
    const { changeAccountDrawer, accountDrawerVisible } = state
    const { username, email } = JSON.parse(localStorage.user)
    return (
        <Drawer
            title="我的帐户"
            placement="right"
            mask={false}
            width={320}
            onClose={changeAccountDrawer}
            visible={accountDrawerVisible}
            getContainer={false}
            style={{ position: 'absolute' }}
        >
            <div className='account-main'>
                <div className='avatar'>{username.substring(0, 2)}</div>
                <div className='account-options'>
                    <span style={{ fontWeight: 600, fontSize: 17 }}>{username}</span>
                    <span>{email}</span>
                    <a onClick={() => {
                        changeAccountDrawer()
                        history.push('/user/profile')
                    }}>个人中心</a>
                    <a onClick={() => logOut(history, state.changeAccountDrawer, data)}>注销</a>
                </div>
            </div>
        </Drawer>
    )
}

export default inject('data', 'state')(withRouter(observer(AccountDrawer)))