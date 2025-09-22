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
  Avatar,
} from "antd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  CarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BarsOutlined,
  DownloadOutlined,
  PrinterOutlined,
  LogoutOutlined,
  SearchOutlined,
  FilterOutlined,
  DashboardOutlined,
  WarningOutlined,
} from "@ant-design/icons";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatDuration = (inTime, outTime) => {
  if (!inTime) return "N/A";
  const start = dayjs.utc(inTime);
  const end = outTime ? dayjs.utc(outTime) : dayjs.utc();
  if (!start.isValid() || !end.isValid()) return "Invalid";
  const diffMinutes = end.diff(start, "minute");
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [filterDate, setFilterDate] = useState([]);
  const [filterPlant, setFilterPlant] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchVehicles();
      setVehicles(res.data.reverse());
    } catch {
      message.error("⚠ Failed to fetch vehicles");
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
      message.error("⚠ Failed to mark exit");
    }
  };

  const exportVehiclePDF = (vehicle) => {
    const doc = new jsPDF();
    doc.text("Haycarb Vehicle Report", 14, 15);
    autoTable(doc, {
      head: [["Field", "Value"]],
      body: [
        ["Vehicle No", vehicle.vehicleNo || "N/A"],
        ["Container ID", vehicle.containerId || "–"],
        ["Type", vehicle.type || "Unknown"],
        ["Plant", vehicle.plant || "N/A"],
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
            <tr><th>Container ID</th><td>${vehicle.containerId || "–"}</td></tr>
            <tr><th>Type</th><td>${vehicle.type || "Unknown"}</td></tr>
            <tr><th>Plant</th><td>${vehicle.plant || "N/A"}</td></tr>
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
    const start = dayjs.utc(inTime);
    const end = outTime ? dayjs.utc(outTime) : dayjs.utc();
    if (!start.isValid() || !end.isValid()) return 0;
    return end.diff(start, "hour");
  };

  useEffect(() => {
    vehicles.forEach((v) => {
      if (getDurationHours(v.inTime, v.outTime) >= 2 && v.status === "inside") {
        message.warning(`⚠️ Vehicle ${v.vehicleNo} has been inside for over 2 hours`);
      }
    });
  }, [vehicles]);

  const filterVehicles = (status) => {
    return vehicles.filter((v) => {
      const matchesStatus = v.status === status;
      const matchesSearch = v.vehicleNo?.toLowerCase().includes(searchText.toLowerCase());
      const matchesType = filterType ? v.type === filterType : true;
      const matchesPlant = filterPlant ? v.plant === filterPlant : true;
      const matchesDate =
        filterDate.length === 2
          ? dayjs(v.inTime).isAfter(filterDate[0]) && dayjs(v.inTime).isBefore(filterDate[1])
          : true;
      return matchesStatus && matchesSearch && matchesType && matchesPlant && matchesDate;
    });
  };

  const insideVehicles = filterVehicles("inside");
  const exitedVehicles = filterVehicles("exited");

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

  const columns = [
    {
      title: "Vehicle No",
      dataIndex: "vehicleNo",
      render: (text) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
            {text?.charAt(0)}
          </Avatar>
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Container ID",
      dataIndex: "containerId",
      render: (t) => (t ? <Text code>{t}</Text> : <Text type="secondary">–</Text>),
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (type) => (
        <Tag
          color={
            type === "Car"
              ? "blue"
              : type === "Truck"
              ? "orange"
              : type === "Container Truck"
              ? "purple"
              : type === "Lorry"
              ? "green"
              : type === "Van"
              ? "cyan"
              : "default"
          }
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "Plant",
      dataIndex: "plant",
      render: (plant) =>
        plant ? (
          <Tag color={plant === "Badalgama" ? "geekblue" : "volcano"}>{plant}</Tag>
        ) : (
          <Text type="secondary">–</Text>
        ),
    },
    {
      title: "In Time",
      dataIndex: "inTime",
      sorter: (a, b) => new Date(a.inTime) - new Date(b.inTime),
      defaultSortOrder: "descend",
      render: (time) => (
        <Space direction="vertical" size="small">
          <Text>{dayjs.utc(time).tz("Asia/Colombo").format("MMM DD, YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {dayjs.utc(time).tz("Asia/Colombo").format("HH:mm")}
          </Text>
        </Space>
      ),
    },
    {
      title: "Out Time",
      dataIndex: "outTime",
      render: (t, r) =>
        t ? (
          <Space direction="vertical" size="small">
            <Text>{dayjs.utc(t).tz("Asia/Colombo").format("MMM DD, YYYY")}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {dayjs.utc(t).tz("Asia/Colombo").format("HH:mm")}
            </Text>
          </Space>
        ) : r.status === "inside" ? (
          <Tag color="processing" icon={<ClockCircleOutlined />}>
            Inside
          </Tag>
        ) : (
          <Text type="secondary">–</Text>
        ),
    },
    {
      title: "Duration",
      render: (_, record) => {
        const hours = getDurationHours(record.inTime, record.outTime);
        const durationText = formatDuration(record.inTime, record.outTime);
        return hours >= 2 && record.status === "inside" ? (
          <Tag color="error" icon={<WarningOutlined />}>
            {durationText}
          </Tag>
        ) : (
          <Tag color="blue" icon={<ClockCircleOutlined />}>
            {durationText}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      render: (_, r) =>
        r.status === "inside" ? (
          <Tag color="success">Inside</Tag>
        ) : (
          <Tag color="default">Exited</Tag>
        ),
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space wrap>
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => exportVehiclePDF(r)}
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              borderRadius: "6px",
            }}
          >
            PDF
          </Button>
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => printVehicle(r)}
            style={{ borderRadius: "6px" }}
          >
            Print
          </Button>
          {r.status === "inside" && (
            <Button
              type="primary"
              size="small"
              danger
              icon={<LogoutOutlined />}
              onClick={() => handleExit(r.id)}
              style={{ borderRadius: "6px" }}
            >
              Exit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "16px",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <Title
          level={2}
          style={{
            color: "#2c3e50",
            marginBottom: "8px",
            fontWeight: "700",
            fontSize: "clamp(20px, 5vw, 32px)",
          }}
        >
          <DashboardOutlined style={{ marginRight: "12px" }} />
          Vehicle Management Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: "clamp(12px, 3vw, 16px)" }}>
          Real-time vehicle tracking and management system
        </Text>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          {/* Each KPI card keeps your gradient styles */}
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: "12px", background: "linear-gradient(135deg, #7CB342 0%, #8BC34A 100%)" }}>
              <Statistic title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Vehicles Inside</span>} value={totalInside} prefix={<CarOutlined style={{ color: "white" }} />} valueStyle={{ color: "white", fontSize: "24px" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: "12px", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
              <Statistic title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Entered Today</span>} value={enteredToday} prefix={<CalendarOutlined style={{ color: "white" }} />} valueStyle={{ color: "white", fontSize: "24px" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: "12px", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
              <Statistic title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Avg Duration</span>} value={`${avgDuration} min`} prefix={<ClockCircleOutlined style={{ color: "white" }} />} valueStyle={{ color: "white", fontSize: "24px" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: "12px", background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
              <Statistic title={<span style={{ color: "rgba(255,255,255,0.8)" }}>Most Common</span>} value={mostCommonType} prefix={<BarsOutlined style={{ color: "white" }} />} valueStyle={{ color: "white", fontSize: "20px" }} />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: "24px", borderRadius: "12px" }}>
          <Title level={4} style={{ marginBottom: "16px" }}>
            <FilterOutlined style={{ marginRight: "8px" }} />
            Filters & Search
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input placeholder="Search by Vehicle No" prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select placeholder="Filter by Type" allowClear style={{ width: "100%" }} onChange={(val) => setFilterType(val)}>
                <Select.Option value="Car">Car</Select.Option>
                <Select.Option value="Truck">Truck</Select.Option>
                <Select.Option value="Container Truck">Container Truck</Select.Option>
                <Select.Option value="Lorry">Lorry</Select.Option>
                <Select.Option value="Van">Van</Select.Option>
                <Select.Option value="Other">Other</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select placeholder="Filter by Plant" allowClear style={{ width: "100%" }} onChange={(val) => setFilterPlant(val)}>
                <Select.Option value="Badalgama">Badalgama</Select.Option>
                <Select.Option value="Madampe">Madampe</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker style={{ width: "100%" }} onChange={(val) => setFilterDate(val)} />
            </Col>
          </Row>
        </Card>

        {/* Tables */}
        <Tabs
          defaultActiveKey="inside"
          items={[
            {
              key: "inside",
              label: `🚗 Inside Vehicles (${insideVehicles.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={insideVehicles}
                  rowKey="id"
                  pagination={{ pageSize: 8, responsive: true }}
                  columns={columns}
                  scroll={{ x: "max-content" }} // ✅ mobile horizontal scroll
                />
              ),
            },
            {
              key: "exited",
              label: `📤 Exited Vehicles (${exitedVehicles.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={exitedVehicles}
                  rowKey="id"
                  pagination={{ pageSize: 8, responsive: true }}
                  columns={columns}
                  scroll={{ x: "max-content" }}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
