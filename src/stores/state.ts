import { observable, action, decorate } from 'mobx'

class State {
    accountDrawerVisible = false
    settingDrawerVisible = false
    assignmentModalVisible = false
    shareOptionModalVisible = false
    shareAccessManagementModalVisible = false
    listStatisticsModalVisible = false

    changeListStatisticsModal = () => this.listStatisticsModalVisible = !this.listStatisticsModalVisible

    changeSettingDrawer = () => {
        this.settingDrawerVisible = !this.settingDrawerVisible
        this.accountDrawerVisible = false
        if (this.settingDrawerVisible) {
            document.querySelector('.options-container').classList.add('visible')
            document.querySelector('.avatar-container').classList.remove('visible')
        } else {
            document.querySelector('.options-container').classList.remove('visible')
        }
    }

    changeAccountDrawer = () => {
        this.accountDrawerVisible = !this.accountDrawerVisible
        this.settingDrawerVisible = false
        if (this.accountDrawerVisible) {
            document.querySelector('.avatar-container').classList.add('visible')
            document.querySelector('.options-container').classList.remove('visible')
        } else {
            document.querySelector('.avatar-container').classList.remove('visible')
        }
    }

    changeAssignmentModal = () => this.assignmentModalVisible = !this.assignmentModalVisible

    changeShareOptionModal = () => this.shareOptionModalVisible = !this.shareOptionModalVisible

    changeShareAccessManagement = () => {
        this.shareOptionModalVisible = !this.shareOptionModalVisible
        this.shareAccessManagementModalVisible = !this.shareAccessManagementModalVisible
    }
}

decorate(State, {
    accountDrawerVisible:observable,
    settingDrawerVisible:observable,
    shareOptionModalVisible:observable,
    shareAccessManagementModalVisible:observable,
    listStatisticsModalVisible: observable,
    assignmentModalVisible: observable,
    changeListStatisticsModal: action,
    changeAccountDrawer: action,
    changeSettingDrawer: action,
    changeShareAccessManagement: action,
    changeShareOptionModal: action,
    changeAssignmentModal: action,
})

export default new State()