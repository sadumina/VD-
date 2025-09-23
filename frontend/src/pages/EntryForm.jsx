import { useState, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Select,
  Row,
  Col,
  Modal,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import { createVehicle } from "../services/api";
import {
  CarOutlined,
  ContainerOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  FormOutlined,
} from "@ant-design/icons";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";

const { Title, Text } = Typography;

export default function EntryFormPage() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [form] = Form.useForm();
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const detectVehicleType = (plate, containerId) => {
    if (containerId && containerId.trim() !== "") return "Container Truck";
    if (!plate) return "Unknown";
    const p = plate.toUpperCase();
    if (p.startsWith("L")) return "Lorry";
    if (p.startsWith("T")) return "Truck";
    if (p.startsWith("V")) return "Van";
    return "Car";
  };

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
      message.error("⚠ Failed to add vehicle");
    } finally {
      setLoading(false);
    }
  };

  // 📸 Capture + OCR
  
const captureAndRecognize = async () => {
  const imageSrc = webcamRef.current.getScreenshot();
  if (!imageSrc) {
    message.error("⚠ Could not capture image");
    return;
  }
  setOcrLoading(true);

  try {
    const result = await Tesseract.recognize(imageSrc, "eng");
    let text = result.data.text.toUpperCase().replace(/\s+/g, " ").trim();

    // Fix common OCR mistakes
    text = text.replace(/O/g, "0").replace(/I/g, "1");

    // Regex patterns
    const plateRegex = /\b([A-Z]{1,3}[- ]?[A-Z]{0,2}[- ]?\d{3,4})\b/; 
    const containerRegex = /\b([A-Z]{4}\s?\d{6,7}\s?\d)\b/;

    const plateMatch = text.match(plateRegex);
    const containerMatch = text.match(containerRegex);

    if (plateMatch) {
      const plate = plateMatch[0].replace(/\s+/g, "").replace("-", "");
      form.setFieldsValue({ vehicleNo: plate });
      message.success(`📸 Plate detected: ${plate}`);
    }

    if (containerMatch) {
      const containerId = containerMatch[0].replace(/\s+/g, "");
      form.setFieldsValue({ containerId });
      message.success(`📦 Container detected: ${containerId}`);
    }

    if (!plateMatch && !containerMatch) {
      message.warning("❌ No valid plate or container detected, try again.");
    }

    setScanning(false);
  } catch (err) {
    message.error("⚠ OCR failed: " + err.message);
  } finally {
    setOcrLoading(false);
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
            {/* Vehicle No */}
            <Form.Item
              name="vehicleNo"
              label="Vehicle Number"
              rules={[{ required: true, message: "Please enter vehicle number" }]}
            >
              <Input
                placeholder="e.g. WP-KL 4455"
                prefix={<CarOutlined style={{ color: "#667eea" }} />}
                addonAfter={
                  <Button
                    type="link"
                    icon={<CameraOutlined />}
                    onClick={() => setScanning(true)}
                  >
                    Scan
                  </Button>
                }
              />
            </Form.Item>

            {/* Container ID */}
            {/* Container ID */}
            <Form.Item
                name="containerId"
                label="Container ID"
                rules={[{ required: true, message: "Please enter container ID" }]}
            >
           <Input
             placeholder="e.g. CMAU 765432 1"
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

      {/* Camera Modal */}
      <Modal
        open={scanning}
        onCancel={() => setScanning(false)}
        footer={null}
        title="📸 Scan Number Plate"
      >
        <Spin spinning={ocrLoading} tip="Detecting plate...">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{ facingMode: "environment" }}
            style={{ width: "100%" }}
          />
          <Button
            type="primary"
            block
            onClick={captureAndRecognize}
            style={{ marginTop: 10 }}
          >
            Capture & Detect
          </Button>
        </Spin>
      </Modal>
    </div>
  );
}
