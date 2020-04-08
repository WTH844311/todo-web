import React, { Component } from 'react'
import { Route, Switch, withRouter } from 'react-router-dom'
import { firstRoute } from '../common/config'
import { Provider } from 'mobx-react'
import data from '../stores/data'
import state from '../stores/state'
import Share from './share/index'
import Main from './main/index'
import Login from './user/login/index'
import Register from './user/register/index'
import ForgetPass from './user/forgetPass/index'
import Profile from './user/profile/index'
import EditProf from './user/editProf/index'
import EditAcco from './user/editAcco/index'
import Vertify from './user/vertify/index'

class RouteApp extends Component {

    render() {
        return (
            <Provider data={data} state={state}>
                <Switch>
                    <Route exact path={`${firstRoute}/`} component={Main}/>
                    <Route exact path={`${firstRoute}/lists/:list_index`} component={Main}/>
                    <Route path={`${firstRoute}/lists/:list_index/tasks/:task_id`} component={Main}/>
                    <Route path={`${firstRoute}/sharing/:InvitationToken`} component={Share}/>
                    <Route path={`${firstRoute}/user/login`} component={Login}/>
                    <Route path={`${firstRoute}/user/register`} component={Register}/>
                    <Route path={`${firstRoute}/user/forgetPass`} component={ForgetPass}/>
                    <Route path={`${firstRoute}/user/profile`} component={Profile}/>
                    <Route path={`${firstRoute}/user/editProf`} component={EditProf}/>
                    <Route path={`${firstRoute}/user/editAcco`} component={EditAcco}/>
                    <Route path={`${firstRoute}/user/vertify`} component={Vertify}/>
                </Switch>
            </Provider>
        )
    }
}

export default withRouter(RouteApp)