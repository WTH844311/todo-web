import { DataType, StateType, IReminder, ITask, IStep } from '../../stores/types';
import { RouteComponentProps } from 'react-router-dom';

export type IRouteMatchParams = {
    list_index: string;
    task_id: string;
}

export type IProps = RouteComponentProps<IRouteMatchParams> & {
    data: DataType;
    state: StateType;
}

export type IState = {
    leftColumnEnter: boolean;
    listRenameInputVisible: boolean;
    taskRenameInputVisible: boolean;
    noteInputVisible: boolean;
    searchVisible: boolean;
    reminderList: IReminder[];
    searchValue: string;
    searchData: ISearchData | null;
    chatButtonDisabled: boolean;
}

interface ISearchData {
    tasks: ITask[];
    note: ITask[];
    step: ITask[];
}