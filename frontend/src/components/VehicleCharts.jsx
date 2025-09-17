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
  // sample fallback if no backend data
  const sampleData = [
    { id: 1, type: "Car", status: "inside", inTime: "2024-01-15T08:30:00" },
    { id: 2, type: "Truck", status: "exited", inTime: "2024-01-15T09:15:00" },
    { id: 3, type: "Car", status: "inside", inTime: "2024-01-15T10:45:00" },
  ];

  const data = vehicles && vehicles.length ? vehicles : sampleData;

  // ... chart logic from before ...

  return (
    <div style={{ marginTop: 40 }}>
      <Title level={3} style={{ textAlign: "center", color: "#2E7D32" }}>
        📈 Vehicle Insights
      </Title>
      {/* Row with charts */}
    </div>
  );
}
