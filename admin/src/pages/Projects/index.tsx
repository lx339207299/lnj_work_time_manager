import React, { useRef } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { projectsApi } from '@/api/projects';
import type { AdminProject } from '@/api/projects';



const ProjectList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleToggleStatus = async (record: AdminProject) => {
    const newStatus = record.status === 'active' ? 'completed' : 'active';
    try {
      await projectsApi.setStatus(record.id, newStatus);
      message.success('状态更新成功');
      actionRef.current?.reload();
    } catch {
      message.error('操作失败');
    }
  };

  const columns: ProColumns<AdminProject>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '所属组织',
      dataIndex: 'orgName',
      render: (_, record) => record.organization?.name || '-',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
      render: (_, record) => record.description || '-',
    },
    {
      title: '成员数',
      dataIndex: 'memberCount',
      search: false,
      width: 80,
      render: (_, record) => record._count?.projectMembers ?? 0,
    },
    {
      title: '工时记录数',
      dataIndex: 'recordCount',
      search: false,
      width: 100,
      render: (_, record) => record._count?.workRecords ?? 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        active: { text: '进行中', status: 'Success' },
        completed: { text: '已完成', status: 'Default' },
        archived: { text: '已归档', status: 'Warning' },
      },
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <Popconfirm
          key="toggle"
          title={record.status === 'active' ? '确定标记为已完成？' : '确定重新激活？'}
          onConfirm={() => handleToggleStatus(record)}
        >
          <Button type="link" size="small">
            {record.status === 'active' ? '设为完成' : '恢复进行'}
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ProTable<AdminProject>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params) => {
        const { current, pageSize, keyword } = params;
        const res = await projectsApi.list({
          page: current,
          pageSize,
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
      headerTitle="项目管理"
    />
  );
};

export default ProjectList;
