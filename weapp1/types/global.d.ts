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
  id: number;
  orgId: number;
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
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: 'active' | 'completed';
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  joinedAt: string;
}

export interface AddProjectMemberData {
  projectId: number;
  userId: number;
  role: string;
}

export interface UserInfo {
  id: number;
  name: string;
  phone: string;
  avatar: string?;
  birthday?: string;
  orgId?: number;
  currentOrg?: {
    id: number;
    name: string;
  };
  role?: string;
  memberships?: any[]; // Keep flexible for now, or define strict type if needed
}

export interface ProfileReqOptions {
  token?: string,
  ignoreTokenInvalid?: boolean,
}

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
  }
}


