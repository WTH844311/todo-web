import './index.css'
import React, {FC, useState} from 'react'
import {withRouter} from 'react-router-dom';
import {observer, inject} from 'mobx-react'
import {Modal, DatePicker} from 'antd'
import moment from 'moment'
import {
  Chart,
  Geom,
  Axis,
  Legend,
} from 'bizcharts'
import {IList} from "../../../../stores/types";
import {IMobxStore} from "../../type";

const {WeekPicker} = DatePicker

const genLastWeekDays = (lastDay = new Date()) => {
  let days: string[] = []
  let count = 6
  do {
    days.push(moment(lastDay.getTime() - count * 24 * 3600 * 1000).format('MM-DD'))
    count--
  } while (count >= 0)
  return days
}

type ListStaticsModalProps = Partial<IMobxStore> & {
  selected_list: IList
}

const ListStaticsModal: FC<ListStaticsModalProps> = ({ data, state, selected_list }) => {
  const {defaultList, tasks = [], title, created_at, sharing_status, members, owner_id} = selected_list || {}
  const {users = []} = data || {}
  const {listStatisticsModalVisible, changeListStatisticsModal} = state || {}
  const [lastWeekDays, setLastWeekDays] = useState(genLastWeekDays())

  const handleWeekChange = (weekData: moment.Moment | null) => {
    setLastWeekDays(genLastWeekDays(moment(weekData).day(6).toDate()))
  }

  const completedTasks = tasks.filter(t => t.completed)
  let arr: number[] = []
  lastWeekDays.map(d => {
    let count = 0
    completedTasks.map(ct => {
      if (moment(ct.completed_at).format('MM-DD') === d) count++
    })
    arr.push(count)
  })
  const data1 = [1, 2, 3, 4, 5, 6, 7].map((_, i) => {
    return {
      date: lastWeekDays[i],
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
  let chartIns: G2.Chart | null = null
  if (defaultList) return null
  return (
    <Modal
      title={`${title} 的统计详情`}
      width={1000}
      visible={listStatisticsModalVisible}
      onCancel={changeListStatisticsModal}
      footer={null}
    >
      <div className='statistics-container'>
        <div className='statistics-left'>
          <div className='statistics-header'><h3>概览</h3></div>
          <div className='statistics-item'>
            <div className='statistics-title'>创建日期</div>
            <div className='statistics-content'>{moment(created_at).format('YYYY-MM-DD hh:mm:ss')}</div>
          </div>
          <div className='statistics-item'>
            <div className='statistics-title'>任务总数</div>
            <div className='statistics-content'>{tasks.length}</div>
          </div>
          <div className='statistics-item'>
            <div className='statistics-title'>完成任务数</div>
            <div className='statistics-content'>{tasks.filter(t => t.completed).length}</div>
          </div>
          <div className='statistics-item'>
            <div className='statistics-title'>剩余未完成任务数</div>
            <div className='statistics-content'>{tasks.filter(t => !t.completed).length}</div>
          </div>
          {
            tasks.length > 0 && (
              <div className='statistics-item'>
                <div className='statistics-title'>进度</div>
                <div
                  className='statistics-content'>{`${(tasks.filter(t => t.completed).length / tasks.length * 100).toFixed()}%`}</div>
              </div>
            )
          }
          {
            sharing_status !== 'NotShare' && tasks.filter(t => t.completed).length > 0 && (
              <>
                {/* 成员完成的任务占所有已完成任务的比例 */}
                <div className='statistics-header'><h3>成员贡献度</h3></div>
                <div className='statistics-memberList'>
                  <div className='statistics-item'>
                    <div
                      className='avatar'>{users.find(u => u.user_id === owner_id)?.username.substring(0, 2)}</div>
                    <div
                      className='statistics-title'>{users.find(u => u.user_id === owner_id)?.username.username} (所有者)
                    </div>
                    <div
                      className='statistics-content'>{`${(tasks?.filter(t => t.completed_by === owner_id).length / tasks.filter(t => t.completed).length * 100).toFixed()}%`}</div>
                  </div>
                  {members.map(m => {
                    const username = users.find(u => u.user_id === m)?.username
                    if (tasks?.filter(t => t.completed_by === m).length === 0) return null
                    return (
                      <div className='statistics-item' key={m}>
                        <div className='avatar'>{username.substring(0, 2)}</div>
                        <div className='statistics-title'>{username}</div>
                        <div
                          className='statistics-content'>{`${(tasks?.filter(t => t.completed_by === m).length / tasks.filter(t => t.completed).length * 100).toFixed()}%`}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          }
        </div>
        <div className='statistics-right'>
          <WeekPicker placeholder='选择日期' onChange={handleWeekChange}/>
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
              onClick={({item: {value}, checked}) => {
                const geoms = chartIns?.getAllGeoms() || [];

                for (let i = 0; i < geoms.length; i++) {
                  const geom = geoms[i];
                  // @ts-ignore
                  if (geom.getYScale().field === value) {
                    // @ts-ignore
                    checked ? geom.show() : geom.hide()
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

// @ts-ignore
export default inject('data', 'state')(withRouter(observer(ListStaticsModal)))
