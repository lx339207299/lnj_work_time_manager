import request from '../utils/request';

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  content: string | null;
  status: number;
  errorMsg: string | null;
  createdAt: string;
}

export interface MailQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

export const mailApi = {
  // 获取邮件列表
  getList(params: MailQuery) {
    return request.get<{ list: EmailLog[]; total: number }>('/admin/mail', { params });
  },

  // 获取邮件详情
  getDetail(id: string) {
    return request.get<EmailLog>(`/admin/mail/${id}`);
  },

  // 发送邮件
  send(data: SendMailParams) {
    return request.post<null>('/admin/mail/send', data);
  },
};
