import './index.css'
import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import { Modal, DatePicker } from 'antd'
import moment from 'moment'
import {
    Chart,
    Geom,
    Axis,
    Legend,
} from 'bizcharts'
const { WeekPicker } = DatePicker

const genLastWeekDays = (lastDay = new Date()) => {
    let days = []
    let count = 6
    do {
        days.push(moment(lastDay.getTime() - count*24*3600*1000).format('MM-DD'))
        count--
    } while(count >= 0)
    return days
}

class ListStaticsModal extends Component {

    state = {
        lastWeekDays: genLastWeekDays()
    }

    handleWeekChange = weekData => {
        this.setState({ lastWeekDays: genLastWeekDays(moment(weekData).day(6).toDate()) })
    }

    render() {
        const { data, state, selected_list } = this.props
        const { users } = data
        const completedTasks = selected_list.tasks.filter(t => t.completed)
        let arr = []
        this.state.lastWeekDays.map(d => {
            let count = 0
            completedTasks.map(ct => {
                if (moment(ct.completed_at).format('MM-DD') === d) count++
            })
            arr.push(count)
        })
        const data1 = [1, 2, 3, 4, 5, 6, 7].map((_, i) => {
            return {
                date: this.state.lastWeekDays[i],
                "任务完成数": arr[i]
            }
        })
        const scale = {
            任务完成数: {
                min: 0,
                minTickInterval: 1
                // tickInterval: 3
            }
        }
        let chartIns = null
        if (selected_list.defaultList) return null
        return (
            <Modal
                title={`${selected_list.title} 的统计详情`}
                width={1000}
                visible={state.listStatisticsModalVisible}
                onCancel={state.changeListStatisticsModal}
                footer={null}
            >
                <div className='statistics-container'>
                    <div className='statistics-left'>
                        <div className='statistics-header'><h3>概览</h3></div>
                        <div className='statistics-item'>
                            <div className='statistics-title'>创建日期</div>
                            <div className='statistics-content'>{moment(selected_list.created_at).format('YYYY-MM-DD hh:mm:ss')}</div>
                        </div>
                        <div className='statistics-item'>
                            <div className='statistics-title'>任务总数</div>
                            <div className='statistics-content'>{selected_list.tasks.length}</div>
                        </div>
                        <div className='statistics-item'>
                            <div className='statistics-title'>完成任务数</div>
                            <div className='statistics-content'>{selected_list.tasks.filter(t => t.completed).length}</div>
                        </div>
                        <div className='statistics-item'>
                            <div className='statistics-title'>剩余未完成任务数</div>
                            <div className='statistics-content'>{selected_list.tasks.filter(t => !t.completed).length}</div>
                        </div>
                        {
                            selected_list.tasks.length > 0 && (
                                <div className='statistics-item'>
                                    <div className='statistics-title'>进度</div>
                                    <div className='statistics-content'>{`${(selected_list.tasks.filter(t => t.completed).length/selected_list.tasks.length*100).toFixed()}%`}</div>
                                </div>
                            )
                        }
                        {
                            selected_list.sharing_status !== 'NotShare' && selected_list.tasks.filter(t => t.completed).length > 0 && (
                                <>
                                    {/* 成员完成的任务占所有已完成任务的比例 */}
                                    <div className='statistics-header'><h3>成员贡献度</h3></div>
                                    <div className='statistics-memberList'>
                                        <div className='statistics-item'>
                                            <div className='avatar'>{users.find(u => u.user_id === selected_list.owner_id)?.username.substring(0, 2)}</div>
                                            <div className='statistics-title'>{users.find(u => u.user_id === selected_list.owner_id)?.username.username} (所有者)</div>
                                            <div className='statistics-content'>{`${(selected_list.tasks.filter(t => t.completed_by === selected_list.owner_id).length/selected_list.tasks.filter(t => t.completed).length*100).toFixed()}%`}</div>
                                        </div>
                                        {selected_list.members.map(m => {
                                            const username = users.find(u => u.user_id === m)?.username
                                            if (selected_list.tasks.filter(t => t.completed_by === m).length === 0) return null
                                            return (
                                                <div className='statistics-item' key={m}>
                                                    <div className='avatar'>{username.substring(0, 2)}</div>
                                                    <div className='statistics-title'>{username}</div>
                                                    <div className='statistics-content'>{`${(selected_list.tasks.filter(t => t.completed_by === m).length/selected_list.tasks.filter(t => t.completed).length*100).toFixed()}%`}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )
                        }
                    </div>
                    <div className='statistics-right'>
                        <WeekPicker placeholder='选择日期' onChange={date => this.handleWeekChange(date)}/>
                        <Chart
                            height={400}
                            width={600}
                            data={data1}
                            forceFit={true}
                            padding={['10%', '5%', '25%', '10%']}
                            scale={scale}
                            onGetG2Instance={chart => chartIns = chart}
                        >
                            {/* 图例 */}
                            <Legend
                                custom={true}
                                allowAllCanceled={true}
                                offsetY={15}
                                offsetX={15}
                                items={[
                                    {
                                        value: "任务完成数",
                                        marker: {
                                            symbol: "square",
                                            fill: "#3182bd",
                                            radius: 5
                                        }
                                    }
                                ]}
                                onClick={ev => {
                                    const item = ev.item;
                                    const value = item.value;
                                    const checked = ev.checked;
                                    const geoms = chartIns.getAllGeoms();
    
                                    for (let i = 0; i < geoms.length; i++) {
                                        const geom = geoms[i];
    
                                        if (geom.getYScale().field === value) {
                                            if (checked) geom.show()
                                            else geom.hide()
                                        }
                                    }
                                }}
                            />
                            {/* 坐标轴 */}
                            <Axis
                                name="平均效率"
                                grid={null}
                                label={{
                                    textStyle: {
                                        fill: "#fdae6b"
                                    }
                                }}
                            />
                            {/* 柱状图 */}
                            <Geom
                                type="interval"
                                // position=a*b a表示x轴各项的值，b表示各项y轴值
                                position="date*任务完成数"
                                color="#3182bd" 
                            />
                        </Chart>
                    </div>
                </div>
            </Modal>
        )
    }
}

export default inject('data', 'state')(observer(ListStaticsModal))