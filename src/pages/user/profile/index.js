import './index.css'
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { message } from 'antd'
import getIcon from '../../../common/icons'
import axios from '../../../common/request'

class Profile extends Component {

    constructor(props) {
        super(props)
        this.usernameInput = null
        this.state = {
            currentNavigation: 0,
            showUsernameEdit: false
        }
    }

    componentDidMount() {
        this.getProfile()
    }

    getProfile = async () => {
        if (!localStorage.user) return this.props.history.push('/user/login')
        const user_id = JSON.parse(localStorage.user).user_id
        const res = await axios.get(`/user/profile?user_id=${user_id}`)
        const { code, data } = res.data
        if (code === -1) return this.props.history.push('/user/login')
        if (code === 1) {
            for (let i in data) {
                this.props.data[i] = data[i]
            }
        } else {
            message.error('获取数据失败')
        }
    }

    updateUsername = async () => {
        if (!this.usernameInput) return message.error('用户名不能为空')
        let user = JSON.parse(localStorage.user)
        const res = await axios.post('/user/update/username', {
            user_id: user.user_id,
            username: this.usernameInput
        })
        const { code } = res.data
        if (code === -1) return message.error('用户名已被使用')
        if (code === 1) {
            user.username = this.usernameInput
            localStorage.user = JSON.stringify(user)
            this.usernameInput = null
            this.setState({ showUsernameEdit: false })
        } else {
            message.error('更新失败')
        }
    }

    render() {
        const { currentNavigation, showUsernameEdit } = this.state
        const { country, birthDay, birthMonth, birthYear } = this.props.data
        if (!localStorage.user) return null
        const { username, email } = JSON.parse(localStorage.user)
        return (
            <>
                <div className='banner'>
                    <div className='title'>你的信息</div>
                    <div className='options'>
                        <div className='option-item'>
                            {getIcon({
                                name: 'key',
                                size: 28,
                                color: 'white'
                            })}
                            <div style={{ fontWeight: 800, fontSize: '15px' }} onClick={() => this.props.history.push('/user/vertify')}>更改密码</div>
                            <div>提高密码强度</div>
                            <div className='option' onClick={() => this.props.history.push('/user/vertify')}>
                                <span>更改</span>
                                {getIcon({
                                    name: 'next',
                                    // size: 28,
                                    color: 'white'
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='profile-main'>
                    <div className='navigation'>
                        <div 
                            className={`item ${currentNavigation === 0 ? 'active':''}`}
                            onClick={() => this.setState({ currentNavigation: 0 })}
                        >
                            个人资料
                        </div>
                        <div 
                            className={`item ${currentNavigation === 1 ? 'active':''}`}
                            onClick={() => this.setState({ currentNavigation: 1 })}
                        >
                            联系人信息
                        </div>
                    </div>
                    {currentNavigation === 0 ? (
                        <div className='info-navi1'>
                            <div className='avatar'>{username.substring(0, 2)}</div>
                            <div className='info'>
                                {showUsernameEdit ? (
                                    <>
                                        <div className='info-header'>
                                            <input
                                                className='username-input'
                                                type="text"
                                                maxLength="255"
                                                defaultValue={username}
                                                onChange={e => this.usernameInput = e.target.value}
                                            />
                                            <div className='header-buttom'>
                                                <div className='header-buttom-save' onClick={this.updateUsername}>保存</div>
                                                <div className='header-buttom-cancel' onClick={() => this.setState({ showUsernameEdit: false })}>取消</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className='info-header'>{username}</div>
                                        <div className='header-edit' onClick={() => this.setState({ showUsernameEdit: true })}>编辑名字</div>
                                    </>
                                )}
                                <div className='user-meta'>
                                    <div className='meta-item'>
                                        <div className='metaItem-icon'>
                                            {getIcon({
                                                name: 'user',
                                                size: 28,
                                                color: 'black'
                                            })}
                                        </div>
                                        <div className='metaItem-text'>{email}</div>
                                        <div className='metaItem-option' onClick={() => this.props.history.push('/user/vertify')}>编辑邮箱</div>
                                    </div>
                                    <div className='meta-item'>
                                        <div className='metaItem-icon'>
                                            {getIcon({
                                                name: 'cake',
                                                size: 28,
                                                color: 'black'
                                            })}
                                        </div>
                                        <div className='metaItem-text'>{birthYear ? `${birthYear}/${birthMonth}/${birthDay}` : '未设置'}</div>
                                        <div className='metaItem-option' onClick={() => this.props.history.push('/user/editProf')}>编辑出生日期</div>
                                    </div>
                                    <div className='meta-item'>
                                        <div className='metaItem-icon'>
                                            {getIcon({
                                                name: 'location',
                                                size: 28,
                                                color: 'black'
                                            })}
                                        </div>
                                        <div className='metaItem-text'>{country || '未设置'}</div>
                                        <div className='metaItem-option' onClick={() => this.props.history.push('/user/editProf')}>编辑国家/地区</div>
                                    </div>
                                    <div className='meta-item'>
                                        <div className='metaItem-icon'>
                                            {getIcon({
                                                name: 'language',
                                                size: 28,
                                                color: 'black'
                                            })}
                                        </div>
                                        <div className='metaItem-text'>中文（中国）</div>
                                        <div className='metaItem-option'>更改显示语言</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='info-navi2'>

                        </div>
                    )}
                </div>
            </>
        )
    }
}

export default inject('data')(observer(Profile))