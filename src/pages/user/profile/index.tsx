import './index.css'
import React, {FC, useEffect, useState} from 'react'
import { RouteComponentProps } from 'react-router-dom'
import {inject, observer} from 'mobx-react'
import {message} from 'antd'
import getIcon from '../../../common/icons'
import axios from '../../../common/request'

type PropfileProps = RouteComponentProps & {
  data: any
}

const Profile: FC<PropfileProps> = ({ data, history }) => {
  const {country, birthDay, birthMonth, birthYear} = data || {}
  const [usernameInput, setUsernameInput] = useState<string | null>(null)
  const [currentNavigation, setCurrentNavigation] = useState(0)
  const [showUsernameEdit, setShowUsernameEdit] = useState(false)

  useEffect(() => {
    const getProfile = async () => {
      if (!localStorage.user) return history.push('/user/login')
      const user_id = JSON.parse(localStorage.user).user_id
      const res = await axios.get(`/user/profile?user_id=${user_id}`)
      const {code, data} = res.data
      if (code === -1) return history.push('/user/login')
      if (code === 1) {
        for (let i in data) {
          data[i] = data[i]
        }
      } else {
        message.error('获取数据失败')
      }
    }

    getProfile()
  }, [])

  const updateUsername = async () => {
    if (!usernameInput) return message.error('用户名不能为空')
    let user = JSON.parse(localStorage.user)
    const res = await axios.post('/user/update/username', {
      user_id: user.user_id,
      username: usernameInput
    })
    const {code} = res.data
    if (code === -1) return message.error('用户名已被使用')
    if (code === 1) {
      user.username = usernameInput
      localStorage.user = JSON.stringify(user)
      setUsernameInput(null)
      setShowUsernameEdit(false)
    } else {
      message.error('更新失败')
    }
  }

  if (!localStorage.user) return null
  const {username, email} = JSON.parse(localStorage.user)
  return (
    <>
      <div className='banner'>
        <div className='title'>你的信息</div>
        <div className='options'>
          <div className='option-item'>
            {getIcon({
              name: 'key',
              size: '28',
              color: 'white'
            })}
            <div style={{fontWeight: 800, fontSize: '15px'}}
                 onClick={() => history.push('/user/vertify')}>更改密码
            </div>
            <div>提高密码强度</div>
            <div className='option' onClick={() => history.push('/user/vertify')}>
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
            className={`item ${currentNavigation === 0 ? 'active' : ''}`}
            onClick={() => setCurrentNavigation(0)}
          >
            个人资料
          </div>
          <div
            className={`item ${currentNavigation === 1 ? 'active' : ''}`}
            onClick={() => setCurrentNavigation(1)}
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
                      maxLength={255}
                      defaultValue={username}
                      onChange={e => setUsernameInput(e.target.value)}
                    />
                    <div className='header-buttom'>
                      <div className='header-buttom-save' onClick={updateUsername}>保存</div>
                      <div className='header-buttom-cancel'
                           onClick={() => setShowUsernameEdit(false)}>取消
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className='info-header'>{username}</div>
                  <div className='header-edit' onClick={() => setShowUsernameEdit(true)}>编辑名字</div>
                </>
              )}
              <div className='user-meta'>
                <div className='meta-item'>
                  <div className='metaItem-icon'>
                    {getIcon({
                      name: 'user',
                      size: '28',
                      color: 'black'
                    })}
                  </div>
                  <div className='metaItem-text'>{email}</div>
                  <div className='metaItem-option' onClick={() => history.push('/user/vertify')}>编辑邮箱</div>
                </div>
                <div className='meta-item'>
                  <div className='metaItem-icon'>
                    {getIcon({
                      name: 'cake',
                      size: '28',
                      color: 'black'
                    })}
                  </div>
                  <div className='metaItem-text'>{birthYear ? `${birthYear}/${birthMonth}/${birthDay}` : '未设置'}</div>
                  <div className='metaItem-option' onClick={() => history.push('/user/editProf')}>编辑出生日期
                  </div>
                </div>
                <div className='meta-item'>
                  <div className='metaItem-icon'>
                    {getIcon({
                      name: 'location',
                      size: '28',
                      color: 'black'
                    })}
                  </div>
                  <div className='metaItem-text'>{country || '未设置'}</div>
                  <div className='metaItem-option' onClick={() => history.push('/user/editProf')}>编辑国家/地区
                  </div>
                </div>
                <div className='meta-item'>
                  <div className='metaItem-icon'>
                    {getIcon({
                      name: 'language',
                      size: '28',
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

export default inject('data')(observer(Profile))
