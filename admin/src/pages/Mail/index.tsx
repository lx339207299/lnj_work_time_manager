import React, { useRef, useState, useEffect } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Modal, Form, Input, message, Drawer, Descriptions } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { mailApi } from '@/api/mail';
import type { EmailLog, SendMailParams } from '@/api/mail';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';

const Mail: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  
  // 发送邮件 Modal
  const [isSendModalVisible, setIsSendModalVisible] = useState(false);
  const [sendForm] = Form.useForm<SendMailParams>();
  const [sending, setSending] = useState(false);

  // wangEditor 实例
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const toolbarConfig: Partial<IToolbarConfig> = {};
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入邮件内容...',
  };

  // 组件销毁时，及时销毁编辑器
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  // 邮件详情 Drawer
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [currentMail, setCurrentMail] = useState<EmailLog | null>(null);

  const columns: ProColumns<EmailLog>[] = [
    {
      title: '收件人',
      dataIndex: 'to',
      copyable: true,
      ellipsis: true,
    },
    {
      title: '主题',
      dataIndex: 'subject',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        0: { text: '成功', status: 'Success' },
        1: { text: '失败', status: 'Error' },
      },
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.status === 0 ? 'success' : 'error'}>
          {record.status === 0 ? '发送成功' : '发送失败'}
        </Tag>
      ),
    },
    {
      title: '发送时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      tooltip: '搜索收件人或主题',
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      render: (_, record) => [
        <a
          key="view"
          onClick={() => {
            setCurrentMail(record);
            setIsDetailVisible(true);
          }}
        >
          查看详情
        </a>,
      ],
    },
  ];

  const handleSendMail = async () => {
    try {
      const values = await sendForm.validateFields();
      setSending(true);
      await mailApi.send(values);
      message.success('邮件发送成功');
      setIsSendModalVisible(false);
      sendForm.resetFields();
      actionRef.current?.reload();
    } catch (error: any) {
      if (error.errorFields) return; // Form validation failed
      message.error(error.message || '邮件发送失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <ProTable<EmailLog>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params = {}) => {
          const res: any = await mailApi.getList({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword,
          });
          return {
            data: res.data || [],
            success: true,
            total: res.property?.total || res.pagination?.total || 0,
          };
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          pageSize: 20,
        }}
        dateFormatter="string"
        headerTitle="邮件发送记录"
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            onClick={() => {
              sendForm.resetFields();
              editor?.setHtml('');
              setIsSendModalVisible(true);
            }}
            type="primary"
          >
            发送测试邮件
          </Button>,
        ]}
      />

      <Modal
        title="发送测试邮件"
        open={isSendModalVisible}
        onOk={handleSendMail}
        onCancel={() => setIsSendModalVisible(false)}
        confirmLoading={sending}
      >
        <Form form={sendForm} layout="vertical">
          <Form.Item
            name="to"
            label="收件人邮箱"
            rules={[{ required: true, message: '请输入收件人邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="例如: example@qq.com" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="邮件主题"
            rules={[{ required: true, message: '请输入邮件主题' }]}
          >
            <Input placeholder="请输入主题" />
          </Form.Item>
          <Form.Item
            name="html"
            label="邮件内容"
            rules={[{ required: true, message: '请输入邮件内容' }]}
            valuePropName="value"
            getValueFromEvent={(content) => content}
          >
            <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
              <Toolbar
                editor={editor}
                defaultConfig={toolbarConfig}
                mode="default"
                style={{ borderBottom: '1px solid #ccc' }}
              />
              <Editor
                defaultConfig={editorConfig}
                value={sendForm.getFieldValue('html')}
                onCreated={setEditor}
                onChange={editor => sendForm.setFieldsValue({ html: editor.getHtml() })}
                mode="default"
                style={{ height: '300px', overflowY: 'hidden' }}
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="邮件详情"
        width={600}
        open={isDetailVisible}
        onClose={() => setIsDetailVisible(false)}
      >
        {currentMail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{currentMail.id}</Descriptions.Item>
            <Descriptions.Item label="收件人">{currentMail.to}</Descriptions.Item>
            <Descriptions.Item label="主题">{currentMail.subject}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentMail.status === 0 ? 'success' : 'error'}>
                {currentMail.status === 0 ? '发送成功' : '发送失败'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发送时间">{currentMail.createdAt}</Descriptions.Item>
            {currentMail.status === 1 && (
              <Descriptions.Item label="错误信息">
                <span style={{ color: 'red' }}>{currentMail.errorMsg}</span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="邮件内容">
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '400px', overflowY: 'auto' }}>
                {currentMail.content}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
};

export default Mail;
