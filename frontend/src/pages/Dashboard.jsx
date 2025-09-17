import { useEffect, useState } from "react";
import { fetchVehicles, markExit } from "../services/api";
import {
  Table,
  Button,
  message,
  Card,
  Tag,
  Typography,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tabs,
} from "antd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDuration } from "../services/vehicleUtils";
import dayjs from "dayjs";
import {
  CarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BarsOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [filterDate, setFilterDate] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchVehicles();
      setVehicles(res.data.reverse());
    } catch {
      message.error("❌ Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async (id) => {
    try {
      await markExit(id);
      message.success("✅ Exit marked");
      load();
    } catch {
      message.error("❌ Failed to mark exit");
    }
  };

  const exportVehiclePDF = (vehicle) => {
    const doc = new jsPDF();
    doc.text("Haycarb Vehicle Report", 14, 15);

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: [
        ["Vehicle No", vehicle.vehicleNo || "N/A"],
        ["Container ID", vehicle.containerId || "—"],
        ["Type", vehicle.type || "Unknown"],
        ["In Time", vehicle.inTime || "N/A"],
        ["Out Time", vehicle.outTime || "Inside"],
        ["Duration", formatDuration(vehicle.inTime, vehicle.outTime) || "N/A"],
        ["Status", vehicle.status === "inside" ? "Inside" : "Exited"],
      ],
    });

    doc.save(`${vehicle.vehicleNo || "vehicle"}.pdf`);
  };

  const printVehicle = (vehicle) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Vehicle Report - ${vehicle.vehicleNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #2E7D32; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #2E7D32; color: white; text-align: left; }
          </style>
        </head>
        <body>
          <h2>🚗 Vehicle Report</h2>
          <table>
            <tr><th>Vehicle No</th><td>${vehicle.vehicleNo || "N/A"}</td></tr>
            <tr><th>Container ID</th><td>${vehicle.containerId || "—"}</td></tr>
            <tr><th>Type</th><td>${vehicle.type || "Unknown"}</td></tr>
            <tr><th>In Time</th><td>${vehicle.inTime || "N/A"}</td></tr>
            <tr><th>Out Time</th><td>${vehicle.outTime || "Inside"}</td></tr>
            <tr><th>Duration</th><td>${formatDuration(vehicle.inTime, vehicle.outTime) || "N/A"}</td></tr>
            <tr><th>Status</th><td>${vehicle.status === "inside" ? "Inside" : "Exited"}</td></tr>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getDurationHours = (inTime, outTime) => {
    const start = dayjs(inTime);
    const end = outTime ? dayjs(outTime) : dayjs();
    return end.diff(start, "hour");
  };

  useEffect(() => {
    vehicles.forEach((v) => {
      if (getDurationHours(v.inTime, v.outTime) >= 2 && v.status === "inside") {
        message.warning(`⚠️ Vehicle ${v.vehicleNo} has been inside for over 2 hours`);
      }
    });
  }, [vehicles]);

  // Filtering logic
  const filterVehicles = (status) => {
    return vehicles.filter((v) => {
      const matchesStatus = v.status === status;
      const matchesSearch = v.vehicleNo?.toLowerCase().includes(searchText.toLowerCase());
      const matchesType = filterType ? v.type === filterType : true;
      const matchesDate =
        filterDate.length === 2
          ? dayjs(v.inTime).isAfter(filterDate[0]) && dayjs(v.inTime).isBefore(filterDate[1])
          : true;
      return matchesStatus && matchesSearch && matchesType && matchesDate;
    });
  };

  const insideVehicles = filterVehicles("inside");
  const exitedVehicles = filterVehicles("exited");

  // KPI calculations
  const totalInside = vehicles.filter((v) => v.status === "inside").length;
  const today = dayjs().startOf("day");
  const enteredToday = vehicles.filter((v) => dayjs(v.inTime).isAfter(today)).length;
  const durations = vehicles.map((v) =>
    dayjs(v.outTime || new Date()).diff(dayjs(v.inTime), "minute")
  );
  const avgDuration =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const typeCounts = vehicles.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {});
  const mostCommonType =
    Object.keys(typeCounts).length > 0
      ? Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "N/A";

  // Common columns for both tables
  const columns = [
    { title: "Vehicle No", dataIndex: "vehicleNo" },
    { title: "Container ID", dataIndex: "containerId", render: (t) => t || "—" },
    { title: "Type", dataIndex: "type" },
    {
      title: "In Time",
      dataIndex: "inTime",
      sorter: (a, b) => new Date(a.inTime) - new Date(b.inTime),
      defaultSortOrder: "descend",
    },
    {
      title: "Out Time",
      dataIndex: "outTime",
      render: (t, r) => t || (r.status === "inside" ? <Tag color="green">⏳ Inside</Tag> : "—"),
    },
    {
      title: "Duration",
      render: (_, record) => {
        const hours = getDurationHours(record.inTime, record.outTime);
        const durationText = formatDuration(record.inTime, record.outTime);
        return hours >= 2 && record.status === "inside" ? (
          <Tag color="red">⚠️ {durationText}</Tag>
        ) : (
          <Tag color="blue">{durationText}</Tag>
        );
      },
    },
    {
      title: "Status",
      render: (_, r) =>
        r.status === "inside" ? <Tag color="green">Inside</Tag> : <Tag color="red">Exited</Tag>,
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          <Button
            type="primary"
            onClick={() => exportVehiclePDF(r)}
            style={{ backgroundColor: "#2E7D32", borderColor: "#2E7D32" }}
          >
            Download PDF
          </Button>
          <Button onClick={() => printVehicle(r)}>Print</Button>
          {r.status === "inside" && (
            <Button
              type="primary"
              onClick={() => handleExit(r.id)}
              style={{ backgroundColor: "#1B5E20", borderColor: "#1B5E20" }}
            >
              Mark Exit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 30, background: "#F5F5F5", minHeight: "100vh" }}>
      <Card
        style={{
          maxWidth: "95%",
          margin: "0 auto",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={3} style={{ color: "#2E7D32", marginBottom: 20 }}>
          📊 Vehicle Dashboard
        </Title>

        {/* KPI Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={6}>
            <Card bordered={false}>
              <Statistic title="Total Inside" value={totalInside} prefix={<CarOutlined />} valueStyle={{ color: "#2E7D32" }} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card bordered={false}>
              <Statistic title="Entered Today" value={enteredToday} prefix={<CalendarOutlined />} valueStyle={{ color: "#1976D2" }} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card bordered={false}>
              <Statistic title="Avg Duration" value={`${avgDuration} min`} prefix={<ClockCircleOutlined />} valueStyle={{ color: "#FF9800" }} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card bordered={false}>
              <Statistic title="Most Common Type" value={mostCommonType} prefix={<BarsOutlined />} valueStyle={{ color: "#6A1B9A" }} />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Space style={{ marginBottom: 20, flexWrap: "wrap" }}>
          <Input.Search placeholder="Search by Vehicle No" value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 200 }} />
          <Select placeholder="Filter by Type" allowClear style={{ width: 150 }} onChange={(val) => setFilterType(val)}>
            <Select.Option value="Car">Car</Select.Option>
            <Select.Option value="Truck">Truck</Select.Option>
            <Select.Option value="Container Truck">Container Truck</Select.Option>
            <Select.Option value="Lorry">Lorry</Select.Option>
            <Select.Option value="Van">Van</Select.Option>
            <Select.Option value="Other">Other</Select.Option>
          </Select>
          <RangePicker onChange={(val) => setFilterDate(val)} />
        </Space>

        {/* ✅ Tabs for Inside / Exited Vehicles */}
        <Tabs
          defaultActiveKey="inside"
          items={[
            {
              key: "inside",
              label: "🚗 Inside Vehicles",
              children: (
                <Table
                  loading={loading}
                  dataSource={insideVehicles}
                  rowKey="id"
                  pagination={{ pageSize: 6 }}
                  bordered
                  columns={columns}
                />
              ),
            },
            {
              key: "exited",
              label: "📤 Exited Vehicles",
              children: (
                <Table
                  loading={loading}
                  dataSource={exitedVehicles}
                  rowKey="id"
                  pagination={{ pageSize: 6 }}
                  bordered
                  columns={columns}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
