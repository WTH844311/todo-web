import './index.css'
import React, { Component } from 'react'
import { Button, Form, Input, message } from 'antd'
import axios from '../../../common/request'

const FormItem = Form.Item

class Register extends Component {

    state = {
        buttonContent: '发送验证码',
        buttonDisable: false,
    }

    sendCaptchaByEmail = () => {
        this.props.form.validateFields(['email'], async (err, values) => {
            if (!err) {
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
                    email: values.email
                })
                const { code, msg } = res.data
                if (code === -1) {
                    message.error(msg)
                }
            }
        })
    }

    submit = () => {
        this.props.form.validateFields(async (err, values) => {
            if (!err) {
                const res = await axios.post('/user/register', {
                    username: values.username,
                    password: values.password,
                    email: values.email,
                    captcha: values.captcha
                })
                const { code, msg } = res.data
                if (code === 1) {
                    message.success(msg)
                    this.props.history.push(`/user/login`)
                }
            }
        })
    }

    render() {
        const { getFieldDecorator } = this.props.form
        const { buttonContent, buttonDisable } = this.state
        return (
            <div className='register-container'>
                <div className='register-form-container'>
                    <div className='register-title'>注册</div>
                    <Form>
                        <FormItem>
                            {getFieldDecorator('email', {
                                rules: [{ required: true, message: '请输入邮箱' }, {
                                    validator: (rule, value, callback) => {
                                        const reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/
                                        if (!reg.test(value)) {
                                            rule.message = '邮箱格式错误'
                                            callback(true)
                                        } else {
                                            axios.post(`/user/vertify/email`, {
                                                email: value
                                            })
                                                .then(res => {
                                                    if (res.data.code !== 1) {
                                                        rule.message = '邮箱已经被使用'
                                                        callback(true)
                                                    } else {
                                                        callback()
                                                    }
                                                })
                                        }
                                    }
                                }],
                                validateFirst: true
                            })(
                                <Input size='large' placeholder='邮箱'/>
                            )}
                        </FormItem>
                        <div className='email-captcha'>
                            <FormItem>
                                {getFieldDecorator('captcha', {
                                    rules: [{ required: true, message: '请输入验证码' }]
                                })(
                                    <Input size='large' placeholder='请输入验证码'/>
                                )}
                            </FormItem>
                            <Button type='primary' onClick={this.sendCaptchaByEmail} disabled={buttonDisable}>{buttonContent}</Button>
                        </div>
                        <FormItem>
                            {getFieldDecorator('username', {
                                rules: [{ required: true, message: '请输入用户名' }, {
                                    validator: (rule, value, callback) => {
                                        axios.post(`/user/vertify/username`, {
                                            username: value
                                        })
                                            .then(res => {
                                                if (res.data.code !== 1) {
                                                    rule.message = '用户名已经被使用'
                                                    callback(true)
                                                }
                                                callback()
                                            })
                                    }
                                }],
                                validateFirst: true
                            })(
                                <Input size='large' placeholder='用户名'/>
                            )}
                        </FormItem>
                        <FormItem>
                            {getFieldDecorator('password', {
                                rules: [{ required: true, message: '请输入密码' }]
                            })(
                                <Input size='large' type='password' placeholder='密码'/>
                            )}
                        </FormItem>
                    </Form>
                    <span className='link' onClick={() => this.props.history.push('/user/login')}>已注册帐号，直接登录</span>
                    <Button type="primary" block onClick={this.submit}>确定</Button>
                </div>
            </div>
        )
    }
}

export default Form.create()(Register)