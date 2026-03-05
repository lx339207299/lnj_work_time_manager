import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 假设后端返回结构 { status: { code: 0, msg: '' }, data: [], property: {} }
    if (res.status && res.status.code !== 0) {
      message.error(res.status.msg || '请求失败');
      return Promise.reject(new Error(res.status.msg || '请求失败'));
    }
    return res;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        // window.location.href = '/login'; 
      }
      message.error(data?.status?.msg || data?.message || '请求失败');
    } else {
      message.error('网络错误');
    }
    return Promise.reject(error);
  }
);

export default request;
