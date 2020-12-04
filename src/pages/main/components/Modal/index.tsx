import './index.css'
import React, {FC} from 'react'
import {observer} from 'mobx-react'
import {IList, ITask} from "../../../../stores/types";
import {IMobxStore} from "../../type";
import AssignModal from './AssignModal/'
import ShareModal from "./ShareModal/";

export type ModalProps = Partial<IMobxStore> & {
  selected_list: IList
  selected_task?: ITask
}


const Modal: FC<ModalProps> = ({selected_list, selected_task}) => {
  return (
    <>
      <AssignModal selected_list={selected_list} selected_task={selected_task}/>
      <ShareModal selected_list={selected_list}/>
    </>
  )
}

export default observer(Modal)




