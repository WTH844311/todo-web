import './index.css'
import React, {FC, useEffect} from 'react'
import {RouteComponentProps, withRouter} from 'react-router-dom'
import {Form, Input, Button, message} from 'antd'
import axios from '../../../common/request'
import {FormComponentProps} from "antd/es/form";

const FormItem = Form.Item

type LoginProps = RouteComponentProps & FormComponentProps & {}

const Login: FC<LoginProps> = ({location, form, history}) => {

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const msgType = urlParams.get('msgType') || 0
    switch (+msgType) {
      case -1:
        message.info('登录状态过期，请重新登录')
        break
      case -2:
        message.info('检测到当前帐户密码已被修改，需重新登录')
        break
    }
  }, [])

  // 提交登录
  const submit = () => {
    form.validateFields(async (err, values) => {
        if (!err) {
          const res = await axios.post('/user/login', {
            account: values.account,
            password: values.password
          })
          const {code, msg, data} = res.data
          if (code !== 1) {
            if (msg === 'Wrong username or email') {
              message.error('用户名或邮箱错误')
            } else {
              message.error('密码错误')
            }
          } else {
            const o = {}
            const {user_id, username, email} = data
            o['user_id'] = user_id
            o['username'] = username
            o['email'] = email
            localStorage.user = JSON.stringify(o)
            localStorage.token = data.token
            history.push(`/lists/inbox`)
          }
        }
      }
    )
  }

  const {getFieldDecorator} = form
  return (
    <div className='login-container'>
      <div className='login-form-container'>
        <div className='login-title'>登录</div>
        <Form>
          <FormItem>
            {getFieldDecorator('account', {
              rules: [{required: true, message: '请输入用户名或邮箱'}]
            })(
              <Input size='large' placeholder='用户名 / 邮箱'/>
            )}
          </FormItem>
          <FormItem>
            {getFieldDecorator('password', {
              rules: [{required: true, message: '请输入密码'}]
            })(
              <Input size='large' type='password' placeholder='密码'/>
            )}
          </FormItem>
        </Form>
        <div className='login-form-option'>
            <span className='link' style={{marginBottom: '10px'}}
                  onClick={() => history.push('/user/register')}>创建新帐户</span>
          <span className='link' style={{marginBottom: '10px'}}
                onClick={() => history.push('/user/forgetPass')}>忘记了密码？</span>
        </div>
        <Button type="primary" block onClick={submit}>确定</Button>
      </div>
    </div>
  )
}

export default Form.create()(withRouter(Login))
