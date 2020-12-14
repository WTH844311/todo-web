import React, {FC, useState} from 'react'
import {RouteComponentProps} from 'react-router-dom'
import {inject, observer} from 'mobx-react'
import {Icon} from "antd"
import './index.css'
import {IMobxStore} from "../../type";

type HeaderProps = RouteComponentProps & IMobxStore & {
  searchValue: string
  setSearchValue: (value: string) => void
  setSearchData: (data: any) => void
}

const Header: FC<any> = ({ state, data, searchValue, setSearchValue, setSearchData }) => {
  const [searchVisible, setSearchVisible] = useState(false)
  const {changeAccountDrawer, changeSettingDrawer} = state
  return (
    <div className='header'>
      <div className='headerLeftRegion'>
        <div className='headerLeftRegion-Region_1'>
          <div className='branding-container'>
            <span>To Do</span>
          </div>
          <div className='searchBox-container'>
            <div className={`searchToolbar ${searchVisible ? 'search-is-open search-is-active' : ''}`}>
              <span className='searchToolbar-iconWrapper' onClick={() => setSearchVisible(true)}>
                  <button className='searchToolbar-icon search' title='搜索'><Icon type="search"/></button>
              </span>
              {
                searchVisible && (
                  <div className='searchToolbar-inputWrapper'>
                    <input
                      className="chromeless searchToolbar-input search"
                      type="text"
                      placeholder="搜索"
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                    />
                    <span className='searchToolbar-iconWrapper' onClick={() => {
                      setSearchValue('')
                      setSearchVisible(false)
                      setSearchData(null)
                    }}>
                            <button className='searchToolbar-icon stop' title='退出搜索'>
                                <svg viewBox="64 64 896 896" version="1.1"
                                     xmlns="http://www.w3.org/2000/svg" p-id="2170"
                                     width=".6rem" height=".6rem"><path
                                  d="M877.216 491.808M575.328 510.496 946.784 140.672c17.568-17.504 17.664-45.824 0.192-63.424-17.504-17.632-45.792-17.664-63.36-0.192L512.032 446.944 143.712 77.216C126.304 59.712 97.92 59.648 80.384 77.12 62.848 94.624 62.816 123.008 80.288 140.576l368.224 369.632L77.216 879.808c-17.568 17.504-17.664 45.824-0.192 63.424 8.736 8.8 20.256 13.216 31.776 13.216 11.424 0 22.848-4.352 31.584-13.056l371.36-369.696 371.68 373.088C892.192 955.616 903.68 960 915.168 960c11.456 0 22.912-4.384 31.648-13.088 17.504-17.504 17.568-45.824 0.096-63.392L575.328 510.496 575.328 510.496zM575.328 510.496"
                                  p-id="2171" fill="#767678"></path></svg>
                            </button>
                        </span>
                  </div>
                )
              }
            </div>
          </div>
        </div>
        <div className='headerLeftRegion-Region_2'>
          <div className='options-container' onClick={changeSettingDrawer}>
            <div className='headerOptions-setting'>
              <Icon type="setting" style={{fontSize: '17px'}}/>
            </div>
          </div>
        </div>
      </div>
      <div className='headerRightRegion'>
        <div className='avatar-container' onClick={changeAccountDrawer}>
          <div className='avatarContainer-circle'>
            {localStorage.user && <span>{JSON.parse(localStorage.user)?.username.charAt(0)}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default inject('state', 'data')(observer(Header))