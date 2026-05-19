import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';

const Dashboard: React.FC = () => {
  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="活跃用户"
              value={1128}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="进行中项目"
              value={93}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="团队数量"
              value={45}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 20 }}>
        <h3>欢迎使用 LNJ 工时管理后台</h3>
        <p>这里将展示系统概况和统计数据。</p>
      </Card>
    </div>
  );
};

export default Dashboard;
