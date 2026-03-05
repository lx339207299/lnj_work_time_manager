import React, { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Modal, Form, Input } from 'antd';
import { getUsers, lockUser, resetUserPassword } from '@/api/users';
import type { User } from '@/types/user';

const UserList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const handleLock = async (record: User) => {
    try {
      await lockUser(record.id, !record.isLocked);
      message.success(record.isLocked ? '已解封' : '已封禁');
      actionRef.current?.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const showResetPasswordModal = (record: User) => {
    setCurrentUser(record);
    setIsModalOpen(true);
  };

  const handleResetPassword = async () => {
    try {
      const values = await form.validateFields();
      if (currentUser) {
        await resetUserPassword(currentUser.id, values.newPassword);
        message.success('密码重置成功');
        setIsModalOpen(false);
        form.resetFields();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns: ProColumns<User>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
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
    },
    {
      title: '邮箱',
      dataIndex: 'email',
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
      dataIndex: 'currentOrgName', // 使用一个不重复的 key，避免和后端返回的嵌套对象冲突
      search: true, // 开启搜索
      render: (_, record) => record.currentOrg?.name || '-',
      formItemProps: {
          name: 'orgName', // 对应 UserListParams 中的 orgName
      }
    },
    {
        title: '拥有组织数',
        dataIndex: ['_count', 'ownedOrgs'],
        search: false,
        width: 100,
        render: (_, record) => record._count?.ownedOrgs || 0,
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
      <ProTable<User>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          const { current, pageSize, ...searchParams } = params;
          // 构建搜索参数
          let keyword = '';
          if (searchParams.phone) keyword = searchParams.phone;
          if (searchParams.name) keyword = searchParams.name;
          if (searchParams.email) keyword = searchParams.email;

          const res: any = await getUsers({
            page: current,
            pageSize,
            keyword,
            orgName: searchParams.orgName,
          });
          
          // 后端返回结构：{ status: { code: 0 }, data: [...], pagination: { total: 10 } }
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
        headerTitle="用户列表"
        toolBarRender={() => [
        ]}
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
