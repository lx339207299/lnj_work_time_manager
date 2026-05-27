import React, { useRef } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag, Tooltip } from 'antd';
import { systemLogsApi } from '@/api/systemLogs';
import type { SystemLog } from '@/api/systemLogs';

const moduleMap: Record<string, { text: string; color: string }> = {
  USER: { text: '用户', color: 'blue' },
  ORG: { text: '组织', color: 'green' },
  SYSTEM: { text: '系统', color: 'orange' },
  AUTH: { text: '认证', color: 'purple' },
};

const actionMap: Record<string, { text: string; color: string }> = {
  BAN: { text: '封禁', color: 'red' },
  UNBAN: { text: '解封', color: 'green' },
  UPDATE: { text: '更新', color: 'blue' },
  LOGIN: { text: '登录', color: 'cyan' },
  CREATE: { text: '创建', color: 'green' },
  DELETE: { text: '删除', color: 'red' },
  LOCK: { text: '锁定', color: 'red' },
  UNLOCK: { text: '解锁', color: 'green' },
  RESET_PASSWORD: { text: '重置密码', color: 'orange' },
};

const SystemLogs: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<SystemLog>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '操作用户',
      dataIndex: 'userName',
      render: (_, r) => r.user?.name || r.user?.phone || `UID:${r.user?.id}`,
      ellipsis: true,
    },
    {
      title: '模块',
      dataIndex: 'module',
      valueType: 'select',
      valueEnum: {
        USER: { text: '用户' },
        ORG: { text: '组织' },
        SYSTEM: { text: '系统' },
        AUTH: { text: '认证' },
      },
      render: (_, r) => {
        const m = moduleMap[r.module] || { text: r.module, color: 'default' };
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(actionMap).map(([k, v]) => [k, { text: v.text }]),
      ),
      render: (_, r) => {
        const a = actionMap[r.action] || { text: r.action, color: 'default' };
        return <Tag color={a.color}>{a.text}</Tag>;
      },
    },
    {
      title: '详情',
      dataIndex: 'detail',
      search: false,
      ellipsis: true,
      width: 200,
      render: (_, r) =>
        r.detail ? (
          <Tooltip title={r.detail}>
            <span style={{ cursor: 'pointer' }}>{r.detail.slice(0, 50)}{r.detail.length > 50 ? '...' : ''}</span>
          </Tooltip>
        ) : '-',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      search: false,
      width: 130,
      render: (_, r) => r.ip || '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
  ];

  return (
    <ProTable<SystemLog>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params) => {
        const { current, pageSize, module, action, keyword } = params;
        const res = await systemLogsApi.list({
          page: current,
          pageSize,
          module: module as string,
          action: action as string,
          keyword,
        });
        return {
          data: (res as any).data || [],
          success: true,
          total: (res as any).property?.total || 0,
        };
      }}
      rowKey="id"
      pagination={{ showQuickJumper: true }}
      search={{ labelWidth: 'auto' }}
      dateFormatter="string"
      headerTitle="系统日志"
      toolBarRender={false}
    />
  );
};

export default SystemLogs;
