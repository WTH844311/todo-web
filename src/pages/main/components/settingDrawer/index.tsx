import './index.css'
import React, {FC, useState} from 'react'
import {observer, inject} from 'mobx-react'
import {withRouter} from 'react-router-dom'
import {Drawer, Button, Switch} from 'antd'
import {IMobxStore} from "../../type";
import {IList, ITask} from "../../../../stores/types";

const exportJSON = ({lists, tasks}: {lists: IList[], tasks: ITask[]}) => {
  const content = JSON.stringify({
    lists,
    tasks
  })
  const eleLink = document.createElement('a');
  eleLink.download = `todoExportData-${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}.json`
  eleLink.style.display = 'none';
  // 字符内容转变成blob地址
  const blob = new Blob([content]);
  eleLink.href = URL.createObjectURL(blob);
  document.body.appendChild(eleLink);
  eleLink.click();
  document.body.removeChild(eleLink);
}

const importJSON = data => {
  const eleInput = document.createElement('input')
  eleInput.type = 'file'
  eleInput.accept = 'application/json'
  document.body.appendChild(eleInput);
  eleInput.click();
  eleInput.addEventListener('change', (e: any) => {
    const fr = new FileReader()
    fr.readAsText(e.path[0]?.files[0])
    fr.onload = function () {
      // @ts-ignore
      const result = JSON.parse(this.result)
      data.import(result)
    };
  })
  document.body.removeChild(eleInput);
}

type SettingDrawerProps = Partial<IMobxStore>

const SettingDrawer: FC<SettingDrawerProps> = ({state, data}) => {
  const {changeSettingDrawer, settingDrawerVisible} = state || {}
  const setting = JSON.parse(localStorage.setting)
  const [sound, setSound] = useState(setting?.sound)
  return (
    <Drawer
      title="设置"
      placement="right"
      mask={false}
      width={320}
      onClose={changeSettingDrawer}
      visible={settingDrawerVisible}
      getContainer={false}
      style={{position: 'absolute'}}
    >
      <div className='setting-item'>
        <div className='settingItem-header'>导入和导出</div>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '15px'}}>
          <svg focusable="false" aria-hidden="true" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21.7 4.9c-.4-1.2-1.4-2.1-2.5-2.5C18 2 17 2 15 2H9c-2 0-3 0-4.1.3-1.2.5-2.1 1.4-2.6 2.6C2 6 2 7 2 9v6c0 2 0 3 .3 4.1.4 1.2 1.4 2.1 2.5 2.5C6 22 7 22 9 22h6c2 0 3 0 4.1-.3 1.2-.4 2.1-1.4 2.5-2.5.4-1.2.4-2.2.4-4.2V9c0-2 0-3-.3-4.1zm-6.9 10.3l-2.8-2-2.8 2 1.1-3.2-2.8-2h3.4L12 6.8l1.1 3.2h3.4l-2.8 2 1.1 3.2zM20 15c0 1.9 0 2.7-.2 3.5-.2.5-.7 1-1.3 1.3-.8.2-1.6.2-3.5.2H9c-1.9 0-2.7 0-3.5-.2-.5-.2-1-.7-1.3-1.3C4 17.7 4 16.9 4 15V9c0-1.9 0-2.7.2-3.5.2-.5.7-1 1.3-1.3.1 0 .3-.1.4-.1v14.5c0 .2.1.3.3.3l5.7-1.9 5.7 1.9c.2 0 .3-.1.3-.3V4.1c.2 0 .4.1.5.1.5.2 1 .7 1.3 1.3.3.8.3 1.6.3 3.5v6z"
              fill="#DB4C3F" fillRule="nonzero"></path>
          </svg>
          <span style={{flex: 1}}>从奇妙清单导入</span>
          <Button type='primary'
                  onClick={() => window.location.href = `https://www.wunderlist.com/oauth/authorize?client_id=6adde9030ff0b820f884&redirect_uri=http://localhost:3000/&state=${Math.random()}`}>导入</Button>
        </div>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '15px'}}>
          <span style={{flex: 1}}>从本地文件导入</span>
          <Button type='primary' onClick={() => importJSON(data)}>导入</Button>
        </div>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '15px'}}>
          <span style={{flex: 1}}>导出清单和任务</span>
          {/*<Button type='primary' onClick={() => exportJSON(data)}>导出</Button>*/}
        </div>
      </div>
      <div className='setting-item'>
        <div className='settingItem-header'>完成任务音效</div>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '15px'}}>
          <span style={{flex: 1}}>{sound ? '打开' : '关闭'}</span>
          <Switch defaultChecked={setting?.sound} onChange={isChecked => {
            const setting = JSON.parse(localStorage.setting)
            setting.sound = isChecked
            setSound(isChecked)
            localStorage.setting = JSON.stringify(setting)
          }}/>
        </div>
      </div>
    </Drawer>
  )
}


// @ts-ignore
export default inject('data', 'state')(withRouter(observer(SettingDrawer)))
