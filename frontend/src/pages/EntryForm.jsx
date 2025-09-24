import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Select,
  Upload,
  Spin,
} from "antd";
import {
  CarOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  FormOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { createVehicle } from "../services/api";

const { Title, Text } = Typography;

export default function EntryFormPage() {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // ✅ Auto detect type
  const detectVehicleType = (plate, containerId) => {
    if (containerId && containerId.trim() !== "") return "Container Truck";
    if (!plate) return "Unknown";
    const p = plate.toUpperCase();
    if (p.startsWith("L")) return "Lorry";
    if (p.startsWith("T")) return "Truck";
    if (p.startsWith("V")) return "Van";
    return "Car";
  };

  // ✅ Upload & OCR
  const handleOCR = async (file) => {
    setOcrLoading(true);

    // Save preview for user
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("📡 OCR Response:", data);

      if (data.vehicleNo) {
        form.setFieldsValue({ vehicleNo: data.vehicleNo });
        message.success(`✅ Plate detected: ${data.vehicleNo}`);
      }
      if (data.containerId) {
        form.setFieldsValue({ containerId: data.containerId });
        message.success(`📦 Container detected: ${data.containerId}`);
      }

      if (!data.vehicleNo && !data.containerId) {
        message.warning(
          `⚠️ OCR found: ${data.raw || "No valid plate/container detected. Enter manually."}`
        );
      }
    } catch (err) {
      message.error("❌ OCR failed: " + err.message);
    } finally {
      setOcrLoading(false);
    }

    return false; // prevent default upload
  };

  // ✅ Submit form
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const vehicleType = detectVehicleType(values.vehicleNo, values.containerId);
      const res = await createVehicle({ ...values, type: vehicleType });

      if (res.data.status === "duplicate" || res.data.error) {
        message.warning("⚠️ This vehicle is already inside.");
      } else {
        message.success("✅ Vehicle entered successfully!");
        navigate("/dashboard");
      }
    } catch {
      message.error("❌ Failed to add vehicle");
    } finally {
      setLoading(false);
    }
  };

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

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            border: "none",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Title level={4} style={{ marginBottom: "16px", color: "#2c3e50" }}>
            <FormOutlined style={{ marginRight: "12px", color: "#667eea" }} />
            Vehicle Information
          </Title>

          <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
            {/* Upload Photo */}
            <Form.Item label="Upload Plate Photo">
              <Upload
                beforeUpload={handleOCR}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<CameraOutlined />}>Upload / Capture</Button>
              </Upload>
              {ocrLoading && (
                <Spin tip="Detecting plate..." style={{ marginTop: 8 }} />
              )}
              {preview && (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      padding: "4px",
                    }}
                  />
                </div>
              )}
            </Form.Item>

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

            {/* Plant */}
            <Form.Item
              name="plant"
              label="Destination Plant"
              rules={[{ required: true, message: "Please select a plant" }]}
            >
              <Select placeholder="Choose destination plant" size="large">
                <Select.Option value="Badalgama">Badalgama Plant</Select.Option>
                <Select.Option value="Madampe">Madampe Plant</Select.Option>
              </Select>
            </Form.Item>

            {/* Submit */}
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
