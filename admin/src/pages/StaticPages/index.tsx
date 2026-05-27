import React, { useRef, useState, useEffect } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { staticPageApi } from '@/api/staticPage';
import type { StaticPage, StaticPageParams } from '@/api/staticPage';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';

const StaticPages: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<StaticPageParams>();
  const [saving, setSaving] = useState(false);

  // wangEditor
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const toolbarConfig: Partial<IToolbarConfig> = {};
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入页面内容（支持 HTML）...',
  };

  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  const columns: ProColumns<StaticPage>[] = [
    {
      title: '标题',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      copyable: true,
      ellipsis: true,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      search: false,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      search: false,
      width: 180,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>编辑</a>,
        <a key="delete" style={{ color: '#ff4d4f' }} onClick={() => handleDelete(record)}>删除</a>,
      ],
    },
  ];

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ name: '', code: '', content: '', remark: '' });
    editor?.setHtml('');
    setIsModalVisible(true);
  };

  const handleEdit = async (record: StaticPage) => {
    setEditingId(record.id);
    const res = await staticPageApi.get(record.id);
    const data = (res as any).data;
    form.setFieldsValue({ name: data.name || '', code: data.code, content: data.content, remark: data.remark || '' });
    editor?.setHtml(data.content || '');
    setIsModalVisible(true);
  };

  const handleDelete = (record: StaticPage) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${record.code}" 吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await staticPageApi.remove(record.id);
        message.success('删除成功');
        actionRef.current?.reload();
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingId) {
        await staticPageApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await staticPageApi.create(values);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      actionRef.current?.reload();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation
      message.error(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ProTable<StaticPage>
        headerTitle="静态页面管理"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建页面
          </Button>,
        ]}
        request={async (params) => {
          const res = await staticPageApi.list({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword,
          });
          const responseData = res as any;
        return {
          data: responseData.data || [],
          success: true,
          total: responseData.property?.total || 0,
        };
        }}
        columns={columns}
      />

      <Modal
        title={editingId ? '编辑页面' : '新建页面'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
        confirmLoading={saving}
        width={900}
        afterOpenChange={(open) => {
          if (open) {
            // 重新设置编辑器内容
            setTimeout(() => {
              const content = form.getFieldValue('content');
              if (content && editor) editor.setHtml(content);
            }, 100);
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="例如: 隐私协议" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code（唯一标识）"
            rules={[{ required: true, message: '请输入唯一标识' }]}
          >
            <Input placeholder="例如: ysxy, yhxy" />
          </Form.Item>
          <Form.Item name="remark" label="备注（仅管理员可见）">
            <Input placeholder="备注说明，方便管理员识别" />
          </Form.Item>
          <Form.Item
            name="content"
            label="页面内容（HTML）"
            rules={[{ required: true, message: '请输入页面内容' }]}
          >
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
              <Toolbar
                editor={editor}
                defaultConfig={toolbarConfig}
                mode="default"
                style={{ borderBottom: '1px solid #d9d9d9' }}
              />
              <Editor
                defaultConfig={editorConfig}
                value={form.getFieldValue('content') || ''}
                onCreated={setEditor}
                onChange={(editor) => form.setFieldValue('content', editor.getHtml())}
                mode="default"
                style={{ height: 400, overflowY: 'hidden' }}
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StaticPages;
