import { Routes, Route, Link, useLocation } from "react-router-dom";
import EntryFormPage from "./pages/EntryForm";
import DashboardPage from "./pages/Dashboard";
import AnalyticsPage from "./pages/Analytics";
import { Layout, Typography, Menu } from "antd";
import {
  FormOutlined,
  TableOutlined,
  BarChartOutlined,
  AreaChartOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

export default function App() {
  const location = useLocation();

  const menuItems = [
    { key: "/", icon: <FormOutlined />, label: <Link to="/">Entry Form</Link> },
    {
      key: "/dashboard",
      icon: <TableOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: "/analytics",
      icon: <AreaChartOutlined />,
      label: <Link to="/analytics">Analytics</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Header with Navbar */}
      <Header
        style={{
          background: "#2E7D32",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        {/* Logo / Title */}
        <Title level={3} style={{ color: "white", margin: 0 }}>
          🚦 Haycarb Vehicle Detector
        </Title>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{
            background: "transparent",
            borderBottom: "none",
            flex: 1,
            justifyContent: "flex-end",
          }}
          items={menuItems}
        />
      </Header>

      {/* Page Content */}
      <Content style={{ padding: "30px" }}>
        <Routes>
          <Route path="/" element={<EntryFormPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </Content>

      {/* Footer */}
      <Footer style={{ textAlign: "center", background: "#F0F0F0" }}>
        © {new Date().getFullYear()} Haycarb PLC | Vehicle Monitoring System
      </Footer>
    </Layout>
  );
}
