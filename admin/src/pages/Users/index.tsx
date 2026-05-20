import React, { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Modal, Form, Input } from 'antd';
import { getUsers, lockUser, resetUserPassword } from '@/api/users';
import type { UserOrgRow } from '@/types/user';

const UserList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserOrgRow | null>(null);
  const [form] = Form.useForm();

  const handleLock = async (record: UserOrgRow) => {
    try {
      await lockUser(record.userId, !record.isLocked);
      message.success(record.isLocked ? '已解封' : '已封禁');
      actionRef.current?.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const showResetPasswordModal = (record: UserOrgRow) => {
    setCurrentUser(record);
    setIsModalOpen(true);
  };

  const handleResetPassword = async () => {
    try {
      const values = await form.validateFields();
      if (currentUser) {
        await resetUserPassword(currentUser.userId, values.newPassword);
        message.success('密码重置成功');
        setIsModalOpen(false);
        form.resetFields();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns: ProColumns<UserOrgRow>[] = [
    {
      title: 'UID',
      dataIndex: 'userId',
      width: 60,
      search: false,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      copyable: true,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      render: (_, record) => record.name || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      render: (_, record) => record.email || '-',
    },
    {
      title: '系统角色',
      dataIndex: 'systemRole',
      valueEnum: {
        user: { text: '普通用户', status: 'Default' },
        admin: { text: '管理员', status: 'Success' },
      },
      search: false,
    },
    {
      title: '所属组织',
      dataIndex: 'orgName',
      render: (_, record) => record.orgName || <span style={{ color: '#999' }}>无组织</span>,
    },
    {
      title: '组织角色',
      dataIndex: 'orgRole',
      valueEnum: {
        owner: { text: '拥有者', status: 'Success' },
        leader: { text: '管理者', status: 'Processing' },
        member: { text: '成员', status: 'Default' },
        temp: { text: '临时', status: 'Warning' },
      },
      search: false,
      render: (_, record) => {
        if (!record.orgRole) return '-';
        const map: Record<string, string> = { owner: '拥有者', leader: '管理者', member: '成员', temp: '临时' };
        return map[record.orgRole] || record.orgRole;
      },
    },
    {
      title: '拥有组织数',
      dataIndex: 'ownedOrgsCount',
      search: false,
      width: 100,
    },
    {
      title: '账号状态',
      dataIndex: 'isLocked',
      valueEnum: {
        false: { text: '正常', status: 'Success' },
        true: { text: '已封禁', status: 'Error' },
      },
      search: false,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <Button 
            key="password" 
            type="link" 
            size="small"
            onClick={() => showResetPasswordModal(record)}
        >
          重置密码
        </Button>,
        <Popconfirm
          key="lock"
          title={record.isLocked ? '确定解封该用户吗？' : '确定封禁该用户吗？'}
          description={record.isLocked ? '解封后用户可正常登录' : '封禁后用户将无法登录'}
          onConfirm={() => handleLock(record)}
        >
          <Button type="link" danger size="small">
            {record.isLocked ? '解封' : '封禁'}
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<UserOrgRow>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          const { current, pageSize, ...searchParams } = params;
          const res: any = await getUsers({
            page: current,
            pageSize,
            keyword: searchParams.phone || searchParams.name || searchParams.email || undefined,
            orgName: searchParams.orgName,
          });
          
          return {
            data: res.data || [],
            success: true,
            total: res.pagination?.total || 0,
          };
        }}
        rowKey="_key"
        pagination={{
          showQuickJumper: true,
        }}
        search={{
          labelWidth: 'auto',
          filterType: 'light',
        }}
        dateFormatter="string"
        headerTitle="用户列表"
      />
      <Modal
        title={`重置密码 - ${currentUser?.name || currentUser?.phone}`}
        open={isModalOpen}
        onOk={handleResetPassword}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserList;
