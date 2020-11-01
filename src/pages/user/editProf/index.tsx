import './index.css'
import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { message, Spin } from 'antd'
import axios from '../../../common/request'

const Countrys = [
    '阿富汗',
    '奥兰群岛',
    '阿尔巴尼亚',
    '阿尔及利亚',
    '美属萨摩亚',
    '安道尔',
    '安哥拉',
    '安圭拉',
    '南极洲',
    '安提瓜和巴布达',
    '阿根廷',
    '亚美尼亚',
    '阿鲁巴',
    '澳大利亚',
    '奥地利',
    '阿塞拜疆',
    '巴哈马',
    '巴林',
    '孟加拉国',
    '巴巴多斯',
    '白俄罗斯',
    '比利时',
    '伯利兹',
    '贝宁',
    '百慕大',
    '不丹',
    '玻利维亚',
    '波黑',
    '博茨瓦纳',
    '布维岛',
    '巴西',
    '英属印度洋领地',
    '文莱',
    '保加利亚',
    '布基纳法索',
    '布隆迪',
    '柬埔寨',
    '喀麦隆',
    '加拿大',
    '佛得角',
    '开曼群岛',
    '中非',
    '乍得',
    '智利',
    '中国',
    '圣诞岛',
    '科科斯（基林）群岛',
    '哥伦比亚',
    '科摩罗',
    '刚果（布）',
    '刚果（金）',
    '库克群岛',
    '哥斯达黎加',
    '科特迪瓦',
    '克罗地亚',
    '古巴',
    '塞浦路斯',
    '捷克',
    '丹麦',
    '吉布提',
    '多米尼克',
    '多米尼加',
    '厄瓜多尔',
    '埃及',
    '萨尔瓦多',
    '赤道几内亚',
    '厄立特里亚',
    '爱沙尼亚',
    '埃塞俄比亚',
    '福克兰群岛（马尔维纳斯）',
    '法罗群岛',
    '斐济',
    '芬兰',
    '法国',
    '法属圭亚那',
    '法属波利尼西亚',
    '法属南部领地',
    '加蓬',
    '冈比亚',
    '格鲁吉亚',
    '德国',
    '加纳',
    '直布罗陀',
    '希腊',
    '格陵兰',
    '格林纳达',
    '瓜德罗普',
    '关岛',
    '危地马拉',
    '格恩西岛',
    '几内亚',
    '几内亚比绍',
    '圭亚那',
    '海地',
    '赫德岛和麦克唐纳岛',
    '梵蒂冈',
    '洪都拉斯',
    '香港',
    '匈牙利',
    '冰岛',
    '印度',
    '印度尼西亚',
    '伊朗',
    '伊拉克',
    '爱尔兰',
    '英国属地曼岛',
    '以色列',
    '意大利',
    '牙买加',
    '日本',
    '泽西岛',
    '约旦',
    '哈萨克斯坦',
    '肯尼亚',
    '基里巴斯',
    '朝鲜',
    '韩国',
    '科威特',
    '吉尔吉斯斯坦',
    '老挝',
    '拉脱维亚',
    '黎巴嫩',
    '莱索托',
    '利比里亚',
    '利比亚',
    '列支敦士登',
    '立陶宛',
    '卢森堡',
    '澳门',
    '前南马其顿',
    '马达加斯加',
    '马拉维',
    '马来西亚',
    '马尔代夫',
    '马里',
    '马耳他',
    '马绍尔群岛',
    '马提尼克',
    '毛利塔尼亚',
    '毛里求斯',
    '马约特',
    '墨西哥',
    '密克罗尼西亚联邦',
    '摩尔多瓦',
    '摩纳哥',
    '蒙古',
    '黑山',
    '蒙特塞拉特',
    '摩洛哥',
    '莫桑比克',
    '缅甸',
    '纳米比亚',
    '瑙鲁',
    '尼泊尔',
    '荷兰',
    '荷属安的列斯',
    '新喀里多尼亚',
    '新西兰',
    '尼加拉瓜',
    '尼日尔',
    '尼日利亚',
    '纽埃',
    '诺福克岛',
    '北马里亚纳',
    '挪威',
    '阿曼',
    '巴基斯坦',
    '帕劳',
    '巴勒斯坦',
    '巴拿马',
    '巴布亚新几内亚',
    '巴拉圭',
    '秘鲁',
    '菲律宾',
    '皮特凯恩',
    '波兰',
    '葡萄牙',
    '波多黎各',
    '卡塔尔',
    '留尼汪',
    '罗马尼亚',
    '俄罗斯联邦',
    '卢旺达',
    '圣赫勒拿',
    '圣基茨和尼维斯',
    '圣卢西亚',
    '圣皮埃尔和密克隆',
    '圣文森特和格林纳丁斯',
    '萨摩亚',
    '圣马力诺',
    '圣多美和普林西比',
    '沙特阿拉伯',
    '塞内加尔',
    '塞尔维亚',
    '塞舌尔',
    '塞拉利昂',
    '新加坡',
    '斯洛伐克',
    '斯洛文尼亚',
    '所罗门群岛',
    '索马里',
    '南非',
    '南乔治亚岛和南桑德韦奇岛',
    '西班牙',
    '斯里兰卡',
    '苏丹',
    '苏里南',
    '斯瓦尔巴岛和扬马延岛',
    '斯威士兰',
    '瑞典',
    '瑞士',
    '叙利亚',
    '台湾',
    '塔吉克斯坦',
    '坦桑尼亚',
    '泰国',
    '东帝汶',
    '多哥',
    '托克劳',
    '汤加',
    '特立尼达和多巴哥',
    '突尼斯',
    '土耳其',
    '土库曼斯坦',
    '特克斯和凯科斯群岛',
    '图瓦卢',
    '乌干达',
    '乌克兰',
    '阿联酋',
    '英国',
    '美国',
    '美国本土外小岛屿',
    '乌拉圭',
    '乌兹别克斯坦',
    '瓦努阿图',
    '委内瑞拉',
    '越南',
    '英属维尔京群岛',
    '美属维尔京群岛',
    '瓦利斯和富图纳',
    '西撒哈拉',
    '也门',
    '赞比亚',
    '津巴布韦'
]

class EditProf extends Component {

    constructor(props) {
        super(props)
        this.postalCode = null
        this.country = null
        this.timezoom = null
        this.sex = null

    }

    state = {
        selected_year: null,
        selected_month: null,
        selected_day: null,
        days: [''],
        loading: false
    }

    componentDidMount() {
        const { birthYear, birthMonth, country, sex, timezoom, postalCode } = this.props.data
        this.country = country
        this.sex = sex
        this.timezoom = timezoom
        this.postalCode = postalCode
        if (birthYear) {
            this.setState({ 
                selected_year: birthYear, 
                selected_month: birthMonth
            })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { selected_year, selected_month } = this.state
        if (
            (prevState.selected_year !== selected_year || prevState.selected_month !== selected_month) 
            && selected_year && selected_month
        ) {
            let dayss = ['']
            for (let count = 0; count < this.getMonthDates(selected_year, selected_month); count++) {
                dayss.push(count+1)
            }
            this.setState({ days: dayss })
        }
    }

    submit = async () => {
        const user_id = JSON.parse(localStorage.user).user_id
        const { selected_year, selected_month, selected_day } = this.state
        if (!this.country || !this.sex || !selected_year || !selected_month || !selected_day) {
            return message.error('提交失败，请检查有否存在未填写的字段')
        }
        this.setState({ loading: true })
        const res = await axios.post('/user/update/profile', {
            user_id,
            birthYear: selected_year,
            birthMonth: selected_month,
            birthDay: selected_day,
            sex: this.sex,
            country: this.country,
            postalCode: this.postalCode,
            timezoom: this.timezoom
        })
        const { code } = res.data
        if (code === 1) {
            message.success('修改成功')
            this.props.history.go(-1)
        } else {
            message.error('提交失败')
        }
        this.setState({ loading: false })
    }

    getMonthDates = (year, month) => {
        return new Date(year, month, 0).getDate()
    }

    getSelectValue = id => {
        const sel = document.getElementById(id)
        const index = sel.selectedIndex
        return sel.options[index].value
    }

    setSelectState = (id, value) => {
        if (id === 'BirthYear') {
            this.setState({ selected_year: value !== '' ? value : null })
        } else if (id === 'BirthMonth') {
            this.setState({ selected_month: value !== '' ? value : null })
        } else {
            this.setState({ selected_day: value !== '' ? value : null })
        }
    }

    render() {
        const { days, loading } = this.state
        const { country, sex, birthDay, birthMonth, birthYear, postalCode, timezoom } = this.props.data
        let years = [''],
            months = ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        for (let count = 0; count <=100; count++) {
            years.push(new Date().getFullYear() - count)
        }
        return (
            <>
                <div className='banner'>
                    <div className='title'>个人信息</div>
                </div>
                <div className='editProf-main'>
                    <div className='editProf-main-row'>
                        <label>出生日期</label>
                        <div className='edit-container'>
                            <select id='BirthYear' defaultValue={birthYear} onChange={() => this.setSelectState('BirthYear', this.getSelectValue('BirthYear'))}>
                                {years.map(y => <option key={`${y}年`} value={y}>{y}年</option>)}
                            </select>
                            <select id='BirthMonth' defaultValue={birthMonth} onChange={() => this.setSelectState('BirthMonth', this.getSelectValue('BirthMonth'))}>
                                {months.map(m => <option key={`${m}月`} value={m}>{m}月</option>)}
                            </select>
                            <select id='BirthDay' defaultValue={birthDay} onChange={() => this.setSelectState('BirthDay', this.getSelectValue('BirthDay'))}>
                                {days.map(d => <option key={`${d}日`} value={d}>{d}日</option>)}
                            </select>
                        </div>
                    </div>
                    <div className='editProf-main-row'>
                        <label>性别</label>
                        <div className='edit-container'>
                            <select id='Sex' defaultValue={sex} onChange={e => this.sex = e.target.value}>
                                <option value={0}>未指定</option>
                                <option value={1}>男</option>
                                <option value={2}>女</option>
                            </select>
                        </div>
                    </div>
                    <div className='editProf-main-row'>
                        <label>国家/地区</label>
                        <div className='edit-container'>
                            <select id='Country' defaultValue={country} onChange={e => this.country = e.target.value}>
                                {Countrys.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className='editProf-main-row'>
                        <label>邮政编码</label>
                        <div className='edit-container'>
                            <input
                                className='postalCode-input'
                                type="text"
                                maxLength="255"
                                defaultValue={postalCode}
                                onChange={e => this.postalCode = e.target.value}
                            />
                        </div>
                    </div>
                    <div className='editProf-main-row'>
                        <label>时区</label>
                        <div className='edit-container'>
                            <select id='Timezone' defaultValue={timezoom} onChange={e => this.timezoom = e.target.value}>
                                <option value='GMT'>通用时间 - GMT</option>
                                <option value='CST'>北京，中国 - CST</option>
                            </select>
                        </div>
                    </div>
                    {loading && <Spin/>}
                    <div className='submit'>
                        <div className='submit-buttom-save' onClick={this.submit}>保存</div>
                        <div className='submit-buttom-cancel' onClick={() => this.props.history.go(-1)}>取消</div>
                    </div>
                </div>
            </>
        )
    }
}

export default inject('data')(observer(EditProf))