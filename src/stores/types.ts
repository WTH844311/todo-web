export interface DataType {
    // observable
    ws: WebSocket | null;
    checkTimer: NodeJS.Timeout | null;
    myday_showCompleted: boolean;
    important_showCompleted: boolean;
    planned_showCompleted: boolean;
    assign_showCompleted: boolean;
    inbox_showCompleted: boolean;
    user: IUser | null;
    users: any[];
    tasks: ITask[];
    lists: IList[];
    mydaySortType: number;
    mydaySortASC: boolean;
    inboxSortType: number;
    inboxSortASC: boolean;

    // computed
    myday: IList;
    important: IList;
    planned: IList;
    assigned_to_me: IList;
    inbox: IList;

    // action
    getAction: any;
    setAction: any;
    wsAction: any;
    taskAction: any;
    listAction: any;
}

export interface StateType {
    // observable
    accountDrawerVisible: boolean;
    settingDrawerVisible: boolean;
    assignmentModalVisible: boolean;
    shareOptionModalVisible: boolean;
    shareAccessManagementModalVisible: boolean;
    listStatisticsModalVisible: boolean;

    // action
    changeAccountDrawer: any;
    changeSettingDrawer: any;
    changeShareOptionModal: any;
    changeAssignmentModal: any;
    changeListStatisticsModal: any;
    changeShareAccessManagement: any;
}

export interface IStep {
    _id?: any;
    title: string;
    completed: boolean;
    completed_at: string | null;
    created_at: string;
    position: number;
}

export interface IReminder {
    _id?: any;
    type: string;
    snooze_time: number;
    snoozed_at: string;
    is_snoozed: boolean;
    date: string;
}

interface IRecurrence {
    _id?: any;
    interval: number;
    type: string;
    ignore: boolean;
    days_of_week: string[]
}

export interface ILinkedEntitie {
    _id?: any;
    weblink: string;
    extension: string;
    display_name: string;
    preview: {
        _id?: any;
        size: number;
        content_type: string;
        content_description: {
            label: string;
        }
    }
}

interface IAssignment {
    assigner: any;
    assignee: any;
}

interface IComment {
    comment: string;
    user_id: string;
    username: string;
    submit_at: string;
}

export interface ITask {
    _id: any;
    local_id: any;
    list_id: any;
    title: string;
    created_by: any;
    created_at: string;
    completed: boolean;
    completed_at: string | null;
    completed_by: any | null;
    importance: boolean;
    myDay: boolean;
    steps: IStep[] | null;
    reminder: IReminder | null;
    recurrence: IRecurrence | null;
    due_date: string | null;
    note: string | null;
    note_updated_at: string | null;
    linkedEntities: ILinkedEntitie[] | null;
    position: number;
    today_position: number | null;
    assignment?: IAssignment | null;
    comments?: IComment[];
}

export interface IList {
    _id: any;
    local_id: any;
    title: string;
    owner_id: any;
    created_at: string;
    show_completed: boolean;
    sharing_status: string;
    sharing_link: string | null;
    invitation_token: string | null;
    sort_type: number;
    sort_asc: boolean;
    background: string | null;
    theme: string;
    position: number;
    members: string[];

    // 默认清单独有属性
    defaultList: boolean;
    tasks?: ITask[];
    icon: HTMLElement;
}

export interface IUser {
    user_id: string;
    username: string;
    email: string;
}

export type WsMsgDataProps = {
    type: string;
    data?: {
        lists: IList[];
        tasks: ITask[];
    };
    change_type: string;
    target_type: string;
    target: string;
}
