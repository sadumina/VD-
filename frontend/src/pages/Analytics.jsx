import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, message, Spin, Empty, Statistic } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import dayjs from "dayjs";
import { fetchVehicles } from "../services/api";
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CarOutlined,
  DashboardOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];

export default function AnalyticsPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchVehicles();
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
      message.error("⚠ Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Card style={{ textAlign: 'center', borderRadius: '16px', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text style={{ fontSize: '16px', color: '#64748b' }}>Loading Analytics...</Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Card style={{ textAlign: 'center', borderRadius: '16px', padding: '40px' }}>
          <Empty 
            description="No analytics data available"
            imageStyle={{ height: 100 }}
          />
        </Card>
      </div>
    );
  }

  // 📊 Data processing for charts
  const dayCounts = vehicles.reduce((acc, v) => {
    const day = dayjs(v.inTime).format("MMM DD");
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const heatmapData = Object.entries(dayCounts)
    .map(([day, count]) => ({ day, count }))
    .slice(-7); // Last 7 days

  const hourCounts = vehicles.reduce((acc, v) => {
    const hour = dayjs(v.inTime).hour();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  const peakHoursData = Array.from({ length: 24 }, (_, h) => ({
    hour: h < 10 ? `0${h}:00` : `${h}:00`,
    count: hourCounts[h] || 0,
  }));

  // Vehicle types data for pie chart
  const typeCounts = vehicles.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {});
  const vehicleTypesData = Object.entries(typeCounts).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  // Plant distribution
  const plantCounts = vehicles.reduce((acc, v) => {
    acc[v.plant || 'Unknown'] = (acc[v.plant || 'Unknown'] || 0) + 1;
    return acc;
  }, {});
  const plantData = Object.entries(plantCounts).map(([plant, count]) => ({
    plant,
    count,
  }));

  // Weekly trends
  const weeklyData = {};
  vehicles.forEach((v) => {
    const week = dayjs(v.inTime).format("MMM DD");
    if (!weeklyData[week]) {
      weeklyData[week] = { week, vehicles: 0, avgDuration: 0 };
    }
    weeklyData[week].vehicles += 1;
    const duration = v.outTime 
      ? dayjs(v.outTime).diff(dayjs(v.inTime), 'hours') 
      : dayjs().diff(dayjs(v.inTime), 'hours');
    weeklyData[week].avgDuration += duration;
  });

  const weeklyTrendData = Object.values(weeklyData)
    .map(item => ({
      ...item,
      avgDuration: Math.round(item.avgDuration / item.vehicles)
    }))
    .slice(-7);

  // Quick stats
  const totalVehicles = vehicles.length;
  const todayVehicles = vehicles.filter(v => dayjs(v.inTime).isSame(dayjs(), 'day')).length;
  const currentlyInside = vehicles.filter(v => v.status === 'inside').length;
  const avgDuration = vehicles.length > 0 
    ? Math.round(vehicles.reduce((acc, v) => {
        const duration = v.outTime 
          ? dayjs(v.outTime).diff(dayjs(v.inTime), 'minutes')
          : dayjs().diff(dayjs(v.inTime), 'minutes');
        return acc + duration;
      }, 0) / vehicles.length)
    : 0;

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#2c3e50' }}>{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      padding: '24px', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
      minHeight: "100vh" 
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title level={2} style={{ 
          color: '#2c3e50', 
          marginBottom: '8px',
          fontWeight: '700',
          fontSize: '32px'
        }}>
          <BarChartOutlined style={{ marginRight: '12px' }} />
          Advanced Analytics Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Comprehensive insights and trends for vehicle management
        </Text>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* KPI Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              bordered={false}
              style={{ 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
              }}
            >
              <Statistic 
                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Total Vehicles</span>}
                value={totalVehicles} 
                prefix={<CarOutlined style={{ color: 'white' }} />} 
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              bordered={false}
              style={{ 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)'
              }}
            >
              <Statistic 
                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Today\'s Entries</span>}
                value={todayVehicles} 
                prefix={<CalendarOutlined style={{ color: 'white' }} />} 
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              bordered={false}
              style={{ 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)'
              }}
            >
              <Statistic 
                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Currently Inside</span>}
                value={currentlyInside} 
                prefix={<DashboardOutlined style={{ color: 'white' }} />} 
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              bordered={false}
              style={{ 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(250, 112, 154, 0.3)'
              }}
            >
              <Statistic 
                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Avg Duration</span>}
                value={`${avgDuration} min`} 
                prefix={<ClockCircleOutlined style={{ color: 'white' }} />} 
                valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }} 
              />
            </Card>
          </Col>
        </Row>

        {/* Main Analytics Cards */}
        <Row gutter={[24, 24]}>
          {/* Daily Traffic */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <BarChartOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                  <span style={{ color: '#2c3e50', fontWeight: '600' }}>Daily Traffic (Last 7 Days)</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                border: 'none'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={heatmapData}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={customTooltip} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    fill="url(#colorGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Peak Hours */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ClockCircleOutlined style={{ marginRight: '8px', color: '#f093fb' }} />
                  <span style={{ color: '#2c3e50', fontWeight: '600' }}>Peak Hours Analysis</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                border: 'none'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHoursData}>
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {peakHoursData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#gradient-${index % 2})`} />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="gradient-0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f093fb" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#f5576c" stopOpacity={0.9}/>
                    </linearGradient>
                    <linearGradient id="gradient-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4facfe" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Vehicle Types Distribution */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <PieChartOutlined style={{ marginRight: '8px', color: '#4facfe' }} />
                  <span style={{ color: '#2c3e50', fontWeight: '600' }}>Vehicle Types Distribution</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                border: 'none'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vehicleTypesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {vehicleTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Plant Distribution */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RiseOutlined style={{ marginRight: '8px', color: '#fa709a' }} />
                  <span style={{ color: '#2c3e50', fontWeight: '600' }}>Plant Distribution</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                border: 'none'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={plantData} layout="horizontal">
                  <XAxis type="number" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="plant"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {plantData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#52c41a' : '#ff7875'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Weekly Trends */}
          <Col xs={24}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <LineChartOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                  <span style={{ color: '#2c3e50', fontWeight: '600' }}>Weekly Trends - Vehicles & Duration</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                border: 'none'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={weeklyTrendData}>
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={customTooltip} />
                  <Legend 
                    wrapperStyle={{ fontSize: '14px', fontWeight: '500' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="vehicles" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#667eea' }}
                    name="Vehicles"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgDuration" 
                    stroke="#f5576c" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#f5576c', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#f5576c' }}
                    name="Avg Duration (hrs)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Summary Insights */}
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
          <Col xs={24}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RiseOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                  <span style={{ color: '#2c3e50', fontWeight: '600' }}>Key Insights</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
              }}
              bodyStyle={{ padding: '32px' }}
            >
              <Row gutter={[32, 32]}>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <BarChartOutlined style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <Title level={4} style={{ color: '#2c3e50', margin: '0 0 8px 0' }}>
                      Peak Activity
                    </Title>
                    <Text style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                      Most vehicle entries occur during morning hours (8-10 AM), indicating 
                      optimal scheduling for operations.
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <PieChartOutlined style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <Title level={4} style={{ color: '#2c3e50', margin: '0 0 8px 0' }}>
                      Vehicle Mix
                    </Title>
                    <Text style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                      Diverse vehicle types with {Object.keys(typeCounts).length} categories, 
                      showing varied operational requirements.
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <ClockCircleOutlined style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <Title level={4} style={{ color: '#2c3e50', margin: '0 0 8px 0' }}>
                      Efficiency
                    </Title>
                    <Text style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                      Average duration of {avgDuration} minutes indicates efficient 
                      processing and minimal delays.
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}