import {DataType, StateType, IReminder, ITask, IStep} from '../../stores/types';
import {RouteComponentProps} from 'react-router-dom';

export type IRouteMatchParams = {
  list_index: string;
  task_id: string;
}

export type IMobxStore = RouteComponentProps<IRouteMatchParams> & {
  data: DataType;
  state: StateType;
}

export type IState = {
  listRenameInputVisible: boolean;
  searchVisible: boolean;
  reminderList: ITask[];
  searchValue: string;
  searchData: ISearchData | null;
}

interface ISearchData {
  tasks: ITask[];
  note: ITask[];
  step: ITask[];
}
