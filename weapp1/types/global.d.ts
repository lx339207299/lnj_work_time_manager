/// <reference types="@tarojs/taro" />

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.styl';

// Project related types
export interface Project {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  role?: string; // 用户在项目中的角色 (owner, member等)
  memberCount?: number; // 项目成员数量
  totalHours?: number; // 项目总工时
  totalDays?: number; // 项目总天数
}

export interface CreateProjectData {
  name: string;
  description?: string;
  orgId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: 'active' | 'completed';
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export interface AddProjectMemberData {
  projectId: string;
  userId: string;
  role: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
  }
}


