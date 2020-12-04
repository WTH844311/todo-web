import './index.css'
import React, {Component, FC, useEffect, useState} from 'react'
import {RouteComponentProps} from 'react-router-dom'
import {inject, observer} from 'mobx-react'
import {message, Spin, Button} from 'antd'
import axios from '../../../common/request'

type EditAccoProps = RouteComponentProps & {}

const EditAcco: FC<EditAccoProps> = ({history}) => {
  const [loading, setLoading] = useState(false)
  const [buttonContent, setButtonContent] = useState('发送验证码')
  const [buttonDisable, setButtonDisable] = useState(false)
  let email: string | null = JSON.parse(localStorage.user).email,
    captcha: string | null = null,
    password: string | null = null

  const sendCaptchaByEmail = async () => {
    if (!email) return message.error('请输入邮箱地址')
    setButtonDisable(true)
    setButtonContent('30 秒后重复发送')
    let timer, count = 30
    timer = setInterval(() => {
      setButtonContent(`${--count} 秒后重复发送`)
      if (count === 0) {
        clearInterval(timer)
        setButtonDisable(false)
        setButtonContent('获取验证码')
      }
    }, 1000)
    const res = await axios.post(`/user/sendEmail`, {
      email
    })
    const {code, msg} = res.data
    if (code === -1) {
      message.error(msg)
    }
  }

  const submit = async () => {
    if ((!email && !captcha && !password) || (email && !captcha && !password) || (!email && captcha && !password)) return message.error('邮箱或密码至少填写一项')
    const user_id = JSON.parse(localStorage.user).user_id
    setLoading(true)
    if (email && captcha) {
      const res = await axios.post('/user/update/email', {
        user_id,
        email,
        captcha
      })
      const {code, msg} = res.data
      if (code === 1) {
        message.success('修改邮箱成功')
        if (!password) {
          setLoading(false)
          const user = JSON.parse(localStorage.user)
          user.email = email
          localStorage.user = JSON.stringify(user)
          return history.go(-2)
        }
      } else if (msg === 'Invalid captcha') {
        message.error('修改邮箱失败：验证码无效')
        setLoading(false)
      } else {
        message.error('修改邮箱失败')
        setLoading(false)
      }
    }
    if (password) {
      const res = await axios.post('/user/update/password', {
        user_id,
        password,
      })
      const {code} = res.data
      if (code === 1) {
        message.success('修改密码成功')
        history.push('/user/login')
      } else {
        message.error('修改密码失败')
      }
      setLoading(false)
    }
  }

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
              maxLength={255}
              placeholder='邮箱'
              defaultValue={email || undefined}
              onChange={e => email = e.target.value}
            />
          </div>
        </div>
        <div className='editAcco-main-row'>
          <div className='edit-container'>
            <input
              className='editAcco-input'
              type="text"
              maxLength={6}
              placeholder='验证码'
              onChange={e => captcha = e.target.value}
            />
            <Button type='primary' style={{width: '200px', height: '34px'}} onClick={sendCaptchaByEmail}
                    disabled={buttonDisable}>{buttonContent}</Button>
          </div>
        </div>
        <div className='editAcco-main-row'>
          <label>新的密码</label>
          <div className='edit-container'>
            <input
              className='editAcco-input'
              type="password"
              maxLength={32}
              onChange={e => password = e.target.value}
            />
          </div>
        </div>
        {loading && <Spin/>}
        <div className='submit'>
          <div className='submit-buttom-save' onClick={submit}>保存</div>
          <div className='submit-buttom-cancel' onClick={() => history.push('/')}>取消</div>
        </div>
      </div>
    </>
  )
}

export default inject('data')(observer(EditAcco))
