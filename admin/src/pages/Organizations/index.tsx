import React, { useRef } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { getOrganizations, setOrgStatus } from '@/api/organizations';
import type { Organization } from '@/api/organizations';

const OrgList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleToggleStatus = async (record: Organization) => {
    try {
      await setOrgStatus(record.id, !record.isDeleted);
      message.success(record.isDeleted ? '已启用' : '已禁用');
      actionRef.current?.reload();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ProColumns<Organization>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '企业名称',
      dataIndex: 'name',
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
      title: '负责人',
      dataIndex: 'ownerName',
      search: false,
      render: (_, record) =>
        record.owner ? `${record.owner.name || record.owner.phone} (${record.owner.phone})` : '-',
    },
    {
      title: '成员数',
      dataIndex: 'memberCount',
      search: false,
      width: 80,
      render: (_, record) => record._count?.members ?? 0,
    },
    {
      title: '项目数',
      dataIndex: 'projectCount',
      search: false,
      width: 80,
      render: (_, record) => record._count?.projects ?? 0,
    },
    {
      title: '状态',
      dataIndex: 'isDeleted',
      valueEnum: {
        false: { text: '正常', status: 'Success' },
        true: { text: '已禁用', status: 'Error' },
      },
      search: false,
      width: 80,
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
      width: 100,
      render: (_, record) => [
        <Popconfirm
          key="toggle"
          title={record.isDeleted ? '确定启用该企业吗？' : '确定禁用该企业吗？'}
          description={record.isDeleted ? '启用后企业可正常使用' : '禁用后企业将无法使用'}
          onConfirm={() => handleToggleStatus(record)}
        >
          <Button type="link" danger={!record.isDeleted} size="small">
            {record.isDeleted ? '启用' : '禁用'}
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ProTable<Organization>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params) => {
        const { current, pageSize, ...searchParams } = params;
        const res: any = await getOrganizations({
          page: current,
          pageSize,
          keyword: searchParams.name,
        });

        return {
          data: res.data || [],
          success: true,
          total: res.pagination?.total || 0,
        };
      }}
      rowKey="id"
      pagination={{
        showQuickJumper: true,
      }}
      search={{
        labelWidth: 'auto',
        filterType: 'light',
      }}
      dateFormatter="string"
      headerTitle="企业列表"
    />
  );
};

export default OrgList;
