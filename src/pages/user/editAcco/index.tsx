import './index.css'
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { message, Spin, Button } from 'antd'
import axios from '../../../common/request'

class EditAcco extends Component {

    constructor(props) {
        super(props)
        this.email = null
        this.captcha = null
        this.password = null
    }

    state = {
        buttonContent: '发送验证码',
        buttonDisable: false,
        loading: false
    }

    componentDidMount() {
        const { email } = JSON.parse(localStorage.user)
        this.email = email
    }

    sendCaptchaByEmail = async () => {
        if (!this.email) return message.error('请输入邮箱地址')
        this.setState({ buttonDisable: true, buttonContent: '30 秒后重复发送' })
        let timer, count = 30
        timer = setInterval(() => {
            this.setState({ buttonContent: `${--count} 秒后重复发送` })
            if (count === 0) {
                clearInterval(timer)
                this.setState({ buttonDisable: false, buttonContent: '获取验证码' })
            }
        }, 1000)
        const res = await axios.post(`/user/sendEmail`, {
            email: this.email
        })
        const { code, msg } = res.data
        if (code === -1) {
            message.error(msg)
        }
    }

    submit = async () => {
        if ((!this.email && !this.captcha && !this.password) || (this.email && !this.captcha && !this.password) || (!this.email && this.captcha && !this.password)) return message.error('邮箱或密码至少填写一项')
        const user_id = JSON.parse(localStorage.user).user_id
        this.setState({ loading: true })
        if (this.email && this.captcha) {
            const res = await axios.post('/user/update/email', {
                user_id,
                email: this.email,
                captcha: this.captcha
            })
            const { code, msg } = res.data
            if (code === 1) {
                message.success('修改邮箱成功')
                if (!this.password) {
                    this.setState({ loading: false })
                    const user = JSON.parse(localStorage.user)
                    user.email = this.email
                    localStorage.user = JSON.stringify(user)
                    return this.props.history.go(-2)
                }
            } else if (msg === 'Invalid captcha') {
                message.error('修改邮箱失败：验证码无效')
                this.setState({ loading: false })
            } else {
                message.error('修改邮箱失败')
                this.setState({ loading: false })
            }
        }
        if (this.password) {
            const res = await axios.post('/user/update/password', {
                user_id,
                password: this.password,
            })
            const { code } = res.data
            if (code === 1) {
                message.success('修改密码成功')
                this.props.history.push('/user/login')
            } else {
                message.error('修改密码失败')
            }
            this.setState({ loading: false })
        }
    }

    render() {
        const { loading, buttonContent, buttonDisable } = this.state
        const { email } = JSON.parse(localStorage.user)
        return (
            <>
                <div className='banner'>
                    <div className='title'>更改邮箱和密码</div>
                </div>
                <div className='editAcco-main'>
                    <div className='editAcco-main-row'>
                        <label>邮箱</label>
                        <div className='edit-container'>
                            <input
                                className='editAcco-input'
                                type="text"
                                maxLength="255"
                                placeholder='邮箱'
                                defaultValue={email}
                                onChange={e => this.email = e.target.value}
                            />
                        </div>
                    </div>
                    <div className='editAcco-main-row'>
                        <div className='edit-container'>
                            <input
                                className='editAcco-input'
                                type="text"
                                maxLength="255"
                                placeholder='验证码'
                                onChange={e => this.captcha = e.target.value}
                            />
                            <Button type='primary' style={{ width: '200px', height: '34px' }} onClick={this.sendCaptchaByEmail} disabled={buttonDisable}>{buttonContent}</Button>
                        </div>
                    </div>
                    <div className='editAcco-main-row'>
                        <label>新的密码</label>
                        <div className='edit-container'>
                            <input
                                className='editAcco-input'
                                type="password"
                                maxLength="255"
                                onChange={e => this.password = e.target.value}
                            />
                        </div>
                    </div>
                    {loading && <Spin/>}
                    <div className='submit'>
                        <div className='submit-buttom-save' onClick={this.submit}>保存</div>
                        <div className='submit-buttom-cancel' onClick={() => this.props.history.push('/')}>取消</div>
                    </div>
                </div>
            </>
        )
    }
}

export default inject('data')(observer(EditAcco))