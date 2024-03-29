import './index.css'
import React, {Component, FC, useState} from 'react'
import {RouteComponentProps} from 'react-router-dom'
import {Button, Form, Input, message} from 'antd'
import axios from '../../../common/request'

const FormItem = Form.Item

type ForgetPassProps = RouteComponentProps & {
  form: any
}

const ForgetPass: FC<ForgetPassProps> = ({form, history}) => {

  const [buttonContent, setButtonContent] = useState('发送验证码')
  const [buttonDisable, setButtonDisable] = useState(false)

  const sendCaptchaByEmail = () => {
    form.validateFields(['email'], (err, values) => {
      if (!err) {
        setButtonContent('30 秒后重复发送')
        setButtonDisable(true)
        let timer, count = 30
        timer = setInterval(() => {
          setButtonContent(`${--count} 秒后重复发送`)
          if (count === 0) {
            clearInterval(timer)
            setButtonDisable(false)
            setButtonContent('获取验证码')
          }
        }, 1000)
        axios.post(`/user/sendEmail`, {
          email: values.email
        })
          .then(res => {
            if (res.data.code === -1) {
              message.error(res.data.msg)
            }
          })
      }
    })
  }

  const submit = () => {
    form.validateFields(async (err, values) => {
      if (!err) {
        const res = await axios.post('/user/reset/password', {
          email: values.email,
          captcha: values.captcha,
          password: values.password
        })
        const {code, msg} = res.data
        if (code === 1) {
          message.success('修改成功')
          history.push('/user/login')
        } else if (msg === 'Invalid captcha') {
          message.error('验证码无效')
        } else {
          message.error('修改失败')
        }
      }
    })
  }

  const {getFieldDecorator} = form
  return (
    <div className='forget-container'>
      <div className='forget-form-container'>
        <div className='forget-title'>忘记密码</div>
        <Form>
          <FormItem>
            {getFieldDecorator('email', {
              rules: [{required: true, message: '请输入邮箱'}, {
                validator: (rule, value, callback) => {
                  const reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/
                  if (!reg.test(value)) {
                    rule.message = '邮箱格式错误'
                    callback(true)
                  }
                  callback()
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
                rules: [{required: true, message: '请输入验证码'}]
              })(
                <Input size='large' placeholder='验证码'/>
              )}
            </FormItem>
            <Button type='primary' onClick={sendCaptchaByEmail} disabled={buttonDisable}>{buttonContent}</Button>
          </div>
          <FormItem>
            {getFieldDecorator('password', {
              rules: [{required: true, message: '请输入密码'}]
            })(
              <Input size='large' type='password' placeholder='新密码'/>
            )}
          </FormItem>
        </Form>
        <span className='link' onClick={() => history.go(-1)}>返回</span>
        <Button type="primary" block onClick={submit}>确定</Button>
      </div>
    </div>
  )
}

export default Form.create()(ForgetPass)
