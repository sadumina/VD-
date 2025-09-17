import { Card, Row, Col, Typography } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

const { Title } = Typography;

export default function VehicleCharts({ vehicles }) {
  // ✅ Sample fallback data
  const sampleData = [
    { id: 1, type: "Car", status: "inside", inTime: "2024-01-15T08:30:00" },
    { id: 2, type: "Truck", status: "exited", inTime: "2024-01-15T09:15:00" },
    { id: 3, type: "Car", status: "inside", inTime: "2024-01-15T10:45:00" },
  ];

  const data = vehicles && vehicles.length ? vehicles : sampleData;

  // ✅ Inside vs Exited
  const statusData = [
    { name: "Inside", value: data.filter((v) => v.status === "inside").length },
    { name: "Exited", value: data.filter((v) => v.status === "exited").length },
  ];

  // ✅ Vehicle types
  const typeCounts = data.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
  }));

  // ✅ Entries by hour
  const timeData = data.map((v) => {
    const hour = new Date(v.inTime).getHours();
    return { hour: `${hour}:00`, count: 1 };
  });
  const hourlyCounts = timeData.reduce((acc, v) => {
    acc[v.hour] = (acc[v.hour] || 0) + 1;
    return acc;
  }, {});
  const lineData = Object.entries(hourlyCounts).map(([hour, count]) => ({
    hour,
    count,
  }));

  const COLORS = ["#2E7D32", "#FF5252", "#4CAF50", "#2196F3", "#FFC107"];

  return (
    <div style={{ marginTop: 40 }}>
      <Title level={3} style={{ textAlign: "center", marginBottom: 20, color: "#2E7D32" }}>
        📈 Vehicle Insights
      </Title>
      <Row gutter={[20, 20]}>
        {/* Pie Chart */}
        <Col xs={24} md={8}>
          <Card title="Inside vs Exited" bordered={false} style={{ borderRadius: 12, height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Bar Chart */}
        <Col xs={24} md={8}>
          <Card title="Vehicle Types" bordered={false} style={{ borderRadius: 12, height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2E7D32" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Line Chart */}
        <Col xs={24} md={8}>
          <Card title="Entries Over Time" bordered={false} style={{ borderRadius: 12, height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2E7D32" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
