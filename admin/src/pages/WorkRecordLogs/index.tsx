import React, { useRef } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag, Tooltip } from 'antd';
import { workRecordLogsApi } from '@/api/workRecordLogs';
import type { WorkRecordLog } from '@/api/workRecordLogs';

const actionMap: Record<string, { text: string; color: string }> = {
  CREATE: { text: '新增', color: 'green' },
  UPDATE: { text: '修改', color: 'blue' },
  DELETE: { text: '删除', color: 'red' },
};

/**
 * 解析日志中的 JSON 数据，提取摘要信息
 * oldData/newData 存储的是完整 WorkRecord 对象的 JSON 字符串
 */
function formatDataSummary(jsonStr: string | null): string {
  if (!jsonStr) return '-';
  try {
    const obj = JSON.parse(jsonStr);
    const parts: string[] = [];
    if (obj.duration !== undefined) parts.push(`工时: ${obj.duration}h`);
    if (obj.amount !== undefined) parts.push(`金额: ¥${obj.amount}`);
    if (obj.content) parts.push(`备注: ${obj.content.slice(0, 20)}${obj.content.length > 20 ? '...' : ''}`);
    if (obj.date) parts.push(`日期: ${obj.date}`);
    return parts.join(', ') || jsonStr;
  } catch {
    return jsonStr.length > 50 ? jsonStr.slice(0, 50) + '...' : jsonStr;
  }
}

const WorkRecordLogs: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<WorkRecordLog>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      search: false,
      ellipsis: true,
      width: 100,
    },
    {
      title: '操作',
      dataIndex: 'action',
      valueType: 'select',
      valueEnum: {
        CREATE: { text: '新增' },
        UPDATE: { text: '修改' },
        DELETE: { text: '删除' },
      },
      width: 80,
      render: (_, r) => {
        const a = actionMap[r.action] || { text: r.action, color: 'default' };
        return <Tag color={a.color}>{a.text}</Tag>;
      },
    },
    {
      title: '目标成员',
      dataIndex: 'targetMemberName',
      search: false,
      ellipsis: true,
      width: 100,
    },
    {
      title: '项目ID',
      dataIndex: 'projectId',
      search: false,
      width: 80,
    },
    {
      title: '日期',
      dataIndex: 'date',
      valueType: 'dateRange',
      width: 110,
      search: {
        transform: (value: any) => ({ startDate: value[0], endDate: value[1] }),
      },
    },
    {
      title: '旧数据',
      dataIndex: 'oldData',
      search: false,
      width: 180,
      ellipsis: true,
      render: (_, r) =>
        r.oldData ? (
          <Tooltip title={<pre style={{ maxHeight: 300, overflow: 'auto', margin: 0, fontSize: 12 }}>{JSON.stringify(JSON.parse(r.oldData), null, 2)}</pre>}>
            <span style={{ cursor: 'pointer' }}>{formatDataSummary(r.oldData)}</span>
          </Tooltip>
        ) : '-',
    },
    {
      title: '新数据',
      dataIndex: 'newData',
      search: false,
      width: 180,
      ellipsis: true,
      render: (_, r) =>
        r.newData ? (
          <Tooltip title={<pre style={{ maxHeight: 300, overflow: 'auto', margin: 0, fontSize: 12 }}>{JSON.stringify(JSON.parse(r.newData), null, 2)}</pre>}>
            <span style={{ cursor: 'pointer' }}>{formatDataSummary(r.newData)}</span>
          </Tooltip>
        ) : '-',
    },
    {
      title: '记录时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
  ];

  return (
    <ProTable<WorkRecordLog>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params) => {
        const { current, pageSize, keyword, orgId, projectId, action, startDate, endDate } = params as any;
        const res = await workRecordLogsApi.list({
          page: current,
          pageSize,
          keyword,
          orgId: orgId ? Number(orgId) : undefined,
          projectId: projectId ? Number(projectId) : undefined,
          action: action as string,
          startDate,
          endDate,
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
      headerTitle="操作日志"
      toolBarRender={false}
    />
  );
};

export default WorkRecordLogs;
