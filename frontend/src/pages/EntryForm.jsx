import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Select,
} from "antd";
import {
  CarOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { createVehicle } from "../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

export default function EntryFormPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // ✅ Vehicle type detection
  const detectVehicleType = (plate, containerId) => {
    if (containerId && containerId.trim() !== "") return "Container Truck";
    if (!plate) return "Unknown";
    const p = plate.toUpperCase();
    if (p.startsWith("L")) return "Lorry";
    if (p.startsWith("T")) return "Truck";
    if (p.startsWith("V")) return "Van";
    return "Car";
  };

  // ✅ Form submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const vehicleType = detectVehicleType(values.vehicleNo, values.containerId);
      const res = await createVehicle({ ...values, type: vehicleType });

      if (res.data.status === "duplicate" || res.data.error) {
        message.warning("⚠️ This vehicle is already inside.");
      } else {
        message.success("✅ Vehicle entered successfully!");
        form.resetFields(); // clear inputs
        navigate("/dashboard");
      }
    } catch (err) {
      message.error("❌ Failed to add vehicle: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Plant options (easier to expand later)
  const plantOptions = [
    { value: "Badalgama", label: "Badalgama Plant" },
    { value: "Madampe", label: "Madampe Plant" },
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
        <Title level={3} style={{ color: "#2c3e50", fontWeight: "700" }}>
          <CarOutlined style={{ marginRight: "12px" }} />
          Vehicle Entry System
        </Title>
        <Text type="secondary" style={{ fontSize: "14px" }}>
          Secure vehicle registration and entry management
        </Text>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          }}
          styles={{ body: { padding: "24px" } }}
          variant="outlined"
        >
          <Title level={4} style={{ marginBottom: "16px", color: "#2c3e50" }}>
            <FormOutlined style={{ marginRight: "12px", color: "#667eea" }} />
            Vehicle Information
          </Title>

          <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
            {/* Vehicle No */}
            <Form.Item
              name="vehicleNo"
              label="Vehicle Number"
              rules={[{ required: true, message: "Please enter vehicle number" }]}
            >
              <Input
                placeholder="e.g. WP-KL 4455"
                prefix={<CarOutlined style={{ color: "#667eea" }} />}
              />
            </Form.Item>

            {/* Container ID */}
            <Form.Item name="containerId" label="Container ID">
              <Input
                placeholder="e.g. CMAU7654321"
                prefix={<ContainerOutlined style={{ color: "#667eea" }} />}
              />
            </Form.Item>

            {/* Plant Dropdown */}
            <Form.Item
              name="plant"
              label="Destination Plant"
              rules={[{ required: true, message: "Please select a plant" }]}
            >
              <Select placeholder="Choose destination plant" size="large">
                {plantOptions.map((p) => (
                  <Option key={p.value} value={p.value}>
                    {p.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Submit Button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  borderRadius: "12px",
                  padding: "14px",
                  fontWeight: "600",
                }}
                icon={<CheckCircleOutlined />}
              >
                Complete Vehicle Entry <ArrowRightOutlined />
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
