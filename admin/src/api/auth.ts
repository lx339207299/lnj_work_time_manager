import request from '@/utils/request';

export const login = (data: any) => {
  return request.post('/auth/login-password', data);
};

export const getUserInfo = () => {
  return request.get('/users/profile');
};
