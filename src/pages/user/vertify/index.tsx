import './index.css'
import React, {FC} from 'react'
import { RouteComponentProps } from 'react-router-dom'
import {Form, Input, Button, message} from 'antd'
import axios from '../../../common/request'
import {FormComponentProps} from "antd/es/form";

const FormItem = Form.Item

type VertifyProps = RouteComponentProps & FormComponentProps & {}

const Vertify: FC<VertifyProps> = ({history, form}) => {

  const submit = () => {
    const user_id = JSON.parse(localStorage.user).user_id
    form.validateFields(async (err, values) => {
      if (!err) {
        const res = await axios.post('/user/vertify/password', {
          user_id,
          password: values.password
        })
        const {code} = res.data
        if (code === 1) {
          history.push('/user/editAcco')
        } else {
          message.error('密码验证失败')
        }
      }
    })
  }

  const {getFieldDecorator} = form
  return (
    <div className='vertify-container'>
      <div className='vertify-form-container'>
        <div className='vertify-title'>输入密码</div>
        <div style={{marginBottom: '30px', fontSize: '17px'}}>由于你正在进行敏感操作，因此需要验证密码。</div>
        <Form>
          <FormItem>
            {getFieldDecorator('password', {
              rules: [{required: true, message: '请输入密码'}]
            })(
              <Input size='large' type='password' placeholder='密码'/>
            )}
          </FormItem>
        </Form>
        <span className='link' style={{marginBottom: '15px'}}
              onClick={() => history.push('/user/forgetPass')}>忘记了密码？</span>
        <span className='link' style={{marginBottom: '15px'}}
              onClick={() => history.push('/user/login')}>使用其他帐户登录</span>
        <Button type="primary" block onClick={submit}>确定</Button>
      </div>
    </div>
  )
}

export default Form.create()(Vertify)
