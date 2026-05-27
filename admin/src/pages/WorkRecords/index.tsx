import React, { useRef } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { workRecordsApi } from '@/api/workRecords';
import type { AdminWorkRecord } from '@/api/workRecords';

const wageTypeMap: Record<string, { text: string; color: string }> = {
  hour: { text: '时薪', color: 'blue' },
  day: { text: '日薪', color: 'green' },
  month: { text: '月薪', color: 'purple' },
};

const WorkRecords: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<AdminWorkRecord>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '日期',
      dataIndex: 'date',
      valueType: 'date',
      sorter: true,
      width: 120,
    },
    {
      title: '用户',
      dataIndex: 'userName',
      ellipsis: true,
    },
    {
      title: '组织',
      dataIndex: 'orgName',
      ellipsis: true,
    },
    {
      title: '项目',
      dataIndex: 'projectName',
      ellipsis: true,
    },
    {
      title: '工时(h)',
      dataIndex: 'duration',
      search: false,
      width: 90,
      sorter: true,
      render: (_, r) => r.duration?.toFixed(1),
    },
    {
      title: '薪资',
      dataIndex: 'wageType',
      search: false,
      width: 70,
      render: (_, r) => {
        const wt = wageTypeMap[r.wageType] || { text: r.wageType, color: 'default' };
        return <Tag color={wt.color}>{wt.text}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      search: false,
      width: 90,
      render: (_, r) => `¥${r.amount?.toFixed(2)}`,
    },
    {
      title: '备注',
      dataIndex: 'content',
      search: false,
      ellipsis: true,
      width: 150,
      render: (_, r) => r.content || '-',
    },
    {
      title: '记录时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
  ];

  return (
    <ProTable<AdminWorkRecord>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params) => {
        const { current, pageSize, keyword, orgId, projectId, startDate, endDate } = params as any;
        const res = await workRecordsApi.list({
          page: current,
          pageSize,
          keyword,
          orgId,
          projectId,
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
      headerTitle="工时记录"
      toolBarRender={false}
    />
  );
};

export default WorkRecords;
