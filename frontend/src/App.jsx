import { Routes, Route, Link, useLocation } from "react-router-dom";
import EntryFormPage from "./pages/EntryForm";
import DashboardPage from "./pages/Dashboard";
import AnalyticsPage from "./pages/Analytics";
import { Layout, Typography, Menu, Button } from "antd";
import {
  FormOutlined,
  DashboardOutlined,
  BarChartOutlined,
  CarOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function App() {
  const location = useLocation();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const menuItems = [
    { 
      key: "/", 
      icon: <FormOutlined style={{ fontSize: '16px' }} />, 
      label: (
        <Link to="/" style={{ fontWeight: '500', fontSize: '14px' }}>
          Entry Form
        </Link>
      )
    },
    {
      key: "/dashboard",
      icon: <DashboardOutlined style={{ fontSize: '16px' }} />,
      label: (
        <Link to="/dashboard" style={{ fontWeight: '500', fontSize: '14px' }}>
          Dashboard
        </Link>
      ),
    },
    {
      key: "/analytics",
      icon: <BarChartOutlined style={{ fontSize: '16px' }} />,
      label: (
        <Link to="/analytics" style={{ fontWeight: '500', fontSize: '14px' }}>
          Analytics
        </Link>
      ),
    },
  ];



  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Vehicle Entry';
      case '/dashboard':
        return 'Dashboard';
      case '/analytics':
        return 'Analytics';
      default:
        return 'Vehicle Management';
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Professional Header */}
      <Header
        style={{
          background: 'linear-gradient(135deg, #7CB342 0%, #8BC34A 100%)',
          padding: '0 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo Section */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <CarOutlined style={{ fontSize: '20px', color: 'white' }} />
          </div>
          <div>
            <Title 
              level={4} 
              style={{ 
                color: 'white', 
                margin: 0, 
                fontWeight: '700',
                fontSize: '18px',
                lineHeight: 1.2
              }}
            >
              Haycarb Vehicle System
            </Title>
            <Text 
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '12px',
                display: 'block'
              }}
            >
              {getCurrentPageTitle()}
            </Text>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Navigation Menu */}
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{
              background: 'transparent',
              borderBottom: 'none',
              minWidth: '400px',
              '& .ant-menu-item': {
                borderRadius: '8px',
                margin: '0 4px',
                transition: 'all 0.3s ease',
              },
              '& .ant-menu-item:hover': {
                background: 'rgba(255, 255, 255, 0.15)',
              },
              '& .ant-menu-item-selected': {
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }
            }}
          />


        </div>

        {/* Mobile Menu Button */}
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
          style={{
            color: 'white',
            display: 'none',
            '@media (max-width: 768px)': {
              display: 'block',
            }
          }}
        />
      </Header>

      {/* Mobile Menu Overlay */}
      {mobileMenuVisible && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <Menu
            theme="dark"
            mode="vertical"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{
              background: 'transparent',
              border: 'none',
            }}
            onClick={() => setMobileMenuVisible(false)}
          />
        </div>
      )}

      {/* Page Content */}
      <Content style={{ position: 'relative' }}>
        <Routes>
          <Route path="/" element={<EntryFormPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </Content>

      {/* Professional Footer */}
      <Footer 
        style={{ 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderTop: '1px solid #e2e8f0',
          padding: '24px 50px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CarOutlined style={{ fontSize: '18px', color: '#7CB342', marginRight: '8px' }} />
              <Text strong style={{ color: '#2c3e50', fontSize: '14px' }}>
                Haycarb PLC
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Text style={{ color: '#64748b', fontSize: '13px' }}>
                Vehicle Monitoring System
              </Text>
              <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
              <Text style={{ color: '#64748b', fontSize: '13px' }}>
                © {new Date().getFullYear()} All Rights Reserved
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: '#52c41a' 
              }} />
              <Text style={{ color: '#52c41a', fontSize: '12px', fontWeight: '500' }}>
                System Online
              </Text>
            </div>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}