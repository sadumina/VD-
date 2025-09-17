import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, message } from "antd";
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
} from "recharts";
import dayjs from "dayjs";
import { fetchVehicles } from "../services/api";

const { Title } = Typography;

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
      message.error("❌ Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!vehicles || vehicles.length === 0)
    return <p style={{ textAlign: "center" }}>No data available</p>;

  // 📅 Heatmap-like (vehicles per day)
  const dayCounts = vehicles.reduce((acc, v) => {
    const day = dayjs(v.inTime).format("YYYY-MM-DD");
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const heatmapData = Object.entries(dayCounts).map(([day, count]) => ({
    day,
    count,
  }));

  // ⏰ Peak hours
  const hourCounts = vehicles.reduce((acc, v) => {
    const hour = dayjs(v.inTime).hour();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  const peakHoursData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    count: hourCounts[h] || 0,
  }));

  // 🚙 Vehicle types over time
  const typeTimeData = {};
  vehicles.forEach((v) => {
    const day = dayjs(v.inTime).format("YYYY-MM-DD");
    if (!typeTimeData[day]) typeTimeData[day] = { day };
    typeTimeData[day][v.type] = (typeTimeData[day][v.type] || 0) + 1;
  });
  const vehicleTypeData = Object.values(typeTimeData);

  return (
    <div style={{ padding: 30 }}>
      <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
        📊 Advanced Analytics
      </Title>
      <Row gutter={[20, 20]}>
        {/* Heatmap by Day */}
        <Col xs={24} md={12}>
          <Card title="Busiest Days (Vehicles per Day)" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heatmapData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2E7D32" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Peak Hours */}
        <Col xs={24} md={12}>
          <Card title="Peak Hours (Entries per Hour)" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHoursData}>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1976D2" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Vehicle Types Over Time */}
        <Col xs={24}>
          <Card title="Vehicle Types Over Time" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vehicleTypeData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Car" stroke="#2E7D32" />
                <Line type="monotone" dataKey="Truck" stroke="#FF9800" />
                <Line type="monotone" dataKey="Lorry" stroke="#9C27B0" />
                <Line type="monotone" dataKey="Van" stroke="#1976D2" />
                <Line type="monotone" dataKey="Other" stroke="#607D8B" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
