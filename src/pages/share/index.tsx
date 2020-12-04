import './index.css'
import React, {Component, FC, useEffect, useState} from 'react'
import {withRouter, RouteComponentProps} from 'react-router-dom'
import {observer, inject} from 'mobx-react'
import {Button} from 'antd'
import jsonwebtoken from 'jsonwebtoken'
import {jwt} from '../../common/config'
import getIcon from '../../common/icons'
import axios from '../../common/request'
import {DataType} from "../../stores/types";

type ShareProps = RouteComponentProps & {
  data: DataType
}

const Share: FC<ShareProps> = ({ history, match, data }) => {
  const [joined, setJoined] = useState(false)
  const [invitationTokenAvailable, setInvitationTokenAvailable] = useState(false)

  useEffect(() => {
    const checkInvitationToken = async () => {
      const res = await axios.post('/user/vertify/invitationToken', {
        // @ts-ignore
        invitationToken: match.params.InvitationToken
      })
      const {code} = res.data
      if (code === 1) setInvitationTokenAvailable(true)
    }

    if (!localStorage.token) return history.push('/user/login')
    checkIfJoined()
    checkInvitationToken()
  }, [])

  const checkIfJoined = async () => {
    // @ts-ignore
    const tokenDecoded = jsonwebtoken.verify(match.params.InvitationToken, jwt.secretKey)
    const user_id = JSON.parse(localStorage.user).user_id
    if (tokenDecoded.owner_id === user_id) return setJoined(true)
    const res = await axios.post('/user/checkIfjoinedList', {
      user_id: user_id,
      list_id: tokenDecoded.list_id
    })
    const {code} = res.data
    if (code === 2) setJoined(true)
  }

  // @ts-ignore
  const tokenDecoded = jsonwebtoken.verify(match.params.InvitationToken, jwt.secretKey)
  if (!tokenDecoded) return null
  if (!localStorage.user) return null
  const user = JSON.parse(localStorage.user)
  if (!invitationTokenAvailable) return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <svg viewBox="64 64 896 896" focusable="false" width="100" height="100">
        <path fill='#77a5de'
              d="M764 280.9c-14-30.6-33.9-58.1-59.3-81.6C653.1 151.4 584.6 125 512 125s-141.1 26.4-192.7 74.2c-25.4 23.6-45.3 51-59.3 81.7-14.6 32-22 65.9-22 100.9v27c0 6.2 5 11.2 11.2 11.2h54c6.2 0 11.2-5 11.2-11.2v-27c0-99.5 88.6-180.4 197.6-180.4s197.6 80.9 197.6 180.4c0 40.8-14.5 79.2-42 111.2-27.2 31.7-65.6 54.4-108.1 64-24.3 5.5-46.2 19.2-61.7 38.8a110.85 110.85 0 0 0-23.9 68.6v31.4c0 6.2 5 11.2 11.2 11.2h54c6.2 0 11.2-5 11.2-11.2v-31.4c0-15.7 10.9-29.5 26-32.9 58.4-13.2 111.4-44.7 149.3-88.7 19.1-22.3 34-47.1 44.3-74 10.7-27.9 16.1-57.2 16.1-87 0-35-7.4-69-22-100.9zM512 787c-30.9 0-56 25.1-56 56s25.1 56 56 56 56-25.1 56-56-25.1-56-56-56z"></path>
      </svg>
      <span style={{fontSize: 25}}>列表不可用</span>
      <span style={{fontSize: 15, color: 'grey'}}>链接已失效，可能清单不存在或者共享被单方面终止</span>
    </div>
  )
  return (
    <div className='share-container'>
      <div className='share-main'>
        {getIcon({
          name: 'Share-list-new',
          size: '100'
        })}
        <div className='share-title'>
          <h3>加入共享清单</h3>
        </div>
        <div className='share-detail'>{tokenDecoded.owner} shared the list {tokenDecoded.list_name} with you</div>
        {
          joined ? (
            <Button type='primary' block onClick={() => history.push(`/lists/${tokenDecoded.list_id}`)}>
              打开
            </Button>
          ) : (
            <Button type='primary' block onClick={async () => {
              await data.listAction.joinList(user.user_id, tokenDecoded.list_id)
              checkIfJoined()
            }}>
              加入
            </Button>
          )
        }
        <div>
          <span>
            你已经通过用户名
            <span style={{fontWeight: 500}}> {user.username} </span>
            登录
          </span>
        </div>
      </div>
    </div>
  )
}

export default inject('data')(withRouter(observer(Share)))
