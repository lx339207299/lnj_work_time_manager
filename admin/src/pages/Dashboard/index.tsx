import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Spin, Table } from 'antd';
import {
  UserOutlined,
  BankOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Column, Line } from '@ant-design/charts';
import { dashboardApi } from '@/api/dashboard';
import type {
  DashboardOverview,
  TrendItem,
  WorkHourTrendItem,
  OrgRankingItem,
} from '@/api/dashboard';

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [userTrend, setUserTrend] = useState<TrendItem[]>([]);
  const [workHourTrend, setWorkHourTrend] = useState<WorkHourTrendItem[]>([]);
  const [orgRanking, setOrgRanking] = useState<OrgRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, utRes, whRes, orRes] = await Promise.all([
        dashboardApi.overview(),
        dashboardApi.userTrend(30),
        dashboardApi.workHourTrend(30),
        dashboardApi.orgRanking(10),
      ]);
      setOverview((ovRes as any).data);
      setUserTrend((utRes as any).data || []);
      setWorkHourTrend((whRes as any).data || []);
      setOrgRanking((orRes as any).data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  const userTrendConfig = {
    data: userTrend,
    xField: 'date',
    yField: 'total',
    smooth: true,
    color: '#1989fa',
    xAxis: { label: { formatter: (v: string) => v.slice(5) } },
    yAxis: { title: { text: '累计用户' } },
    tooltip: { formatter: (d: any) => ({ name: '累计用户', value: d.total }) },
    height: 280,
  };

  const whTrendConfig = {
    data: workHourTrend,
    xField: 'date',
    yField: 'hours',
    color: '#52c41a',
    xAxis: { label: { formatter: (v: string) => v.slice(5) } },
    yAxis: { title: { text: '工时(h)' } },
    tooltip: { formatter: (d: any) => ({ name: '工时', value: d.hours?.toFixed(1) + 'h' }) },
    height: 280,
  };

  const orgColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: '组织', dataIndex: 'orgName', ellipsis: true },
    { title: '总工时', dataIndex: 'totalHours', render: (v: number) => v.toFixed(1) + 'h', width: 100 },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="总用户" value={overview?.totalUsers || 0} prefix={<UserOutlined />} />
            <Statistic title="今日新增" value={overview?.todayNewUsers || 0} valueStyle={{ fontSize: 14, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="组织数" value={overview?.totalOrgs || 0} prefix={<BankOutlined />} />
            <Statistic title="周新增用户" value={overview?.weekNewUsers || 0} valueStyle={{ fontSize: 14, color: '#1989fa' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="项目数" value={overview?.totalProjects || 0} prefix={<ProjectOutlined />} />
            <Statistic title="月新增用户" value={overview?.monthNewUsers || 0} valueStyle={{ fontSize: 14, color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日工时" value={overview?.todayWorkHours?.toFixed(1) || '0'} suffix="h" prefix={<ClockCircleOutlined />} />
            <Statistic title="月总工时" value={overview?.monthWorkHours?.toFixed(1) || '0'} suffix="h" valueStyle={{ fontSize: 14, color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      {/* 趋势图 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title={<span><RiseOutlined /> 用户增长趋势（近30天）</span>}>
            {userTrend.length > 0 ? <Line {...userTrendConfig} /> : <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>暂无数据</div>}
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span><ClockCircleOutlined /> 工时趋势（近30天）</span>}>
            {workHourTrend.length > 0 ? <Column {...whTrendConfig} /> : <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>暂无数据</div>}
          </Card>
        </Col>
      </Row>

      {/* 排行榜 */}
      <Card
        title={<span><TeamOutlined /> 组织工时排行</span>}
        style={{ marginTop: 16 }}
      >
        {orgRanking.length > 0 ? (
          <Table
            dataSource={orgRanking}
            columns={orgColumns}
            rowKey="orgId"
            pagination={false}
            size="small"
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
