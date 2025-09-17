import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  FormOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        width={220}
        style={{
          background: "#2E7D32",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            color: "white",
            fontWeight: "600",
            fontSize: "18px",
            padding: "20px",
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          🚦 Vehicle Detector
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ background: "#2E7D32", marginTop: 10 }}
          items={[
            {
              key: "/dashboard",
              icon: <DashboardOutlined />,
              label: <Link to="/dashboard">Dashboard</Link>,
            },
            {
              key: "/entry",
              icon: <FormOutlined />,
              label: <Link to="/entry">Entry Form</Link>,
            },
            {
              key: "/reports",
              icon: <FileTextOutlined />,
              label: <Link to="/reports">Reports</Link>,
            },
          ]}
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ margin: 0, color: "#2E7D32" }}>
            Vehicle Tracking System
          </h2>
          <div style={{ fontSize: 14, color: "#555" }}>👤 Admin</div>
        </Header>

        <Content style={{ margin: "20px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
            }}
          >
            <Outlet /> {/* This loads Dashboard or EntryForm */}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
