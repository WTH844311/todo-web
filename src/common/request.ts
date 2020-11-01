import axios from 'axios';
import qs from 'qs';
import * as sysConfig from './config';

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
axios.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

// 请求拦截器
axios.interceptors.request.use(config => {

    // config.withCredentials = true

    /*
        url 是用于请求的服务器 URL
     */
    // if (config.url.indexOf('?') !== -1) {
    //     config.url += `&t=${new Date().getTime()}`
    // } else {
    //     config.url += `?t=${new Date().getTime()}`
    // }

    /*
        transformRequest 允许在向服务器发送前，修改请求数据
        只能用在 'PUT', 'POST' 和 'PATCH' 这几个请求方法
        后面数组中的函数必须返回一个字符串，或 ArrayBuffer，或 Stream

        注意：此项使用后文件上传会失败，暂时找不到原因
     */
    config.transformRequest = [function (data, headers) {
        if (data instanceof FormData) {
            // form-data 文件上传
            return data
        } else {
            return qs.stringify(data, { allowDots: true })
        }
    }]

    /*
        paramsSerializer 是一个负责 params 序列化的函数
     */
    config.paramsSerializer = params => {
        return qs.stringify(params, { arrayFormat: 'repeat' })
    }

    // `timeout` 指定请求超时的毫秒数(0 表示无超时时间)
    // 如果请求话费了超过 `timeout` 的时间，请求将被中断
    config.timeout = 10000

    /*
        baseURL 将自动加在 url 前面，除非 url 是一个绝对 URL
        它可以通过设置一个 baseURL 便于为 axios 实例的方法传递相对 URL
     */
    config.baseURL = sysConfig.serverDomain
    const token = localStorage.token
    if (token) {
        config.headers.common['authorization'] = token
    }

    return config
}, error => {
    return Promise.reject(error)
})

// 响应拦截器
axios.interceptors.response.use(res => {
    const { code, msg, data } = res.data
    // token 过期，重定向到登录界面
    if (code === -1) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href="/user/login?msgType=-1"
    } else if (code === -2) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href="/user/login?msgType=-2"
    }
    return res
}, error => {
    return Promise.reject(error)
})

export default axios
