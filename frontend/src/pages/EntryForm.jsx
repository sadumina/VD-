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
  Space,
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
      const text = result.data.text.toUpperCase().replace(/\s+/g, " ").trim();

      // ✅ Sri Lankan plate regex
      const plateRegex = /\b([A-Z]{1,3}[- ]?[A-Z]{0,2}[- ]?\d{3,4})\b/;
      const match = text.match(plateRegex);

      if (match) {
        const plate = match[0].replace(/\s+/g, "").replace("-", "");
        form.setFieldsValue({ vehicleNo: plate });
        message.success(`📸 Plate detected: ${plate}`);
        setScanning(false);
      } else {
        message.warning("❌ No valid plate detected, try again.");
      }
    } catch (err) {
      message.error("⚠ OCR failed: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <Title
          level={2}
          style={{
            color: "#2c3e50",
            marginBottom: "8px",
            fontWeight: "700",
            fontSize: "32px",
          }}
        >
          <CarOutlined style={{ marginRight: "12px" }} />
          Vehicle Entry System
        </Title>
        <Text type="secondary" style={{ fontSize: "16px" }}>
          Secure vehicle registration and entry management
        </Text>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <Row gutter={[32, 32]}>
          {/* Main Form Card */}
          <Col xs={24} lg={14}>
            <Card
              style={{
                borderRadius: "16px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                border: "none",
              }}
              bodyStyle={{ padding: "40px" }}
            >
              <div style={{ marginBottom: "32px" }}>
                <Title
                  level={3}
                  style={{
                    color: "#2c3e50",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FormOutlined style={{ marginRight: "12px", color: "#667eea" }} />
                  Vehicle Information
                </Title>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  Please provide accurate vehicle details for entry registration
                </Text>
              </div>

              <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
                {/* Vehicle Number */}
                <Form.Item
                  name="vehicleNo"
                  label={
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "16px",
                      }}
                    >
                      Vehicle Number (License Plate)
                    </span>
                  }
                  rules={[{ required: true, message: "Please enter vehicle number" }]}
                >
                  <Input
                    placeholder="e.g. WP-KL 4455"
                    prefix={<CarOutlined style={{ color: "#667eea" }} />}
                    style={{
                      borderRadius: "12px",
                      padding: "14px 16px",
                      fontSize: "16px",
                      border: "2px solid #e2e8f0",
                      transition: "all 0.3s ease",
                    }}
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
                <Form.Item
                  name="containerId"
                  label={
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "16px",
                      }}
                    >
                      Container ID <Text type="secondary">(Optional)</Text>
                    </span>
                  }
                >
                  <Input
                    placeholder="e.g. CMAU 765432 1"
                    prefix={<ContainerOutlined style={{ color: "#667eea" }} />}
                    style={{
                      borderRadius: "12px",
                      padding: "14px 16px",
                      fontSize: "16px",
                      border: "2px solid #e2e8f0",
                      transition: "all 0.3s ease",
                    }}
                  />
                </Form.Item>

                {/* Plant Selection */}
                <Form.Item
                  name="plant"
                  label={
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "16px",
                      }}
                    >
                      Destination Plant
                    </span>
                  }
                  rules={[{ required: true, message: "Please select a plant" }]}
                >
                  <Select
                    placeholder="Choose destination plant"
                    style={{ fontSize: "16px" }}
                    size="large"
                  >
                    <Select.Option value="Badalgama">
                      <Space>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#52c41a",
                          }}
                        />
                        Badalgama Plant
                      </Space>
                    </Select.Option>
                    <Select.Option value="Madampe">
                      <Space>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#ff7875",
                          }}
                        />
                        Madampe Plant
                      </Space>
                    </Select.Option>
                  </Select>
                </Form.Item>

                {/* Submit Button */}
                <Form.Item style={{ marginTop: "32px", marginBottom: "0" }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    block
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "16px",
                      height: "auto",
                      fontSize: "16px",
                      fontWeight: "600",
                      boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                      transition: "all 0.3s ease",
                    }}
                    icon={<CheckCircleOutlined />}
                  >
                    Complete Vehicle Entry
                    <ArrowRightOutlined style={{ marginLeft: "8px" }} />
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Right Side Content */}
          <Col xs={24} lg={10}>
            {/* Process Steps Card */}
            <Card
              style={{
                borderRadius: "16px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                border: "none",
                marginBottom: "24px",
                background: "linear-gradient(135deg, #f9f9ff 0%, #f3f4ff 100%)",
              }}
              bodyStyle={{ padding: "32px" }}
            >
              <Title level={4} style={{ color: "#2c3e50", marginBottom: "24px" }}>
                🚦 Entry Process
              </Title>

              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "18px",
                    top: "40px",
                    bottom: "40px",
                    width: "2px",
                    background: "#d6d6f5",
                  }}
                />
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  {/* Step 1 */}
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #52c41a 0%, #7dd56f 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "16px",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "13px",
                        zIndex: 1,
                        boxShadow: "0 3px 8px rgba(82,196,26,0.3)",
                      }}
                    >
                      1
                    </div>
                    <div>
                      <Text strong style={{ color: "#2c3e50", fontSize: "15px" }}>
                        Vehicle Identification
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        Enter vehicle number and container details
                      </Text>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "16px",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "13px",
                        zIndex: 1,
                        boxShadow: "0 3px 8px rgba(24,144,255,0.3)",
                      }}
                    >
                      2
                    </div>
                    <div>
                      <Text strong style={{ color: "#2c3e50", fontSize: "15px" }}>
                        Plant Selection
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        Choose destination plant facility
                      </Text>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #722ed1 0%, #b37feb 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "16px",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "13px",
                        zIndex: 1,
                        boxShadow: "0 3px 8px rgba(114,46,209,0.3)",
                      }}
                    >
                      3
                    </div>
                    <div>
                      <Text strong style={{ color: "#2c3e50", fontSize: "15px" }}>
                        System Registration
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: "13px" }}>
                        Automatic entry logging and tracking
                      </Text>
                    </div>
                  </div>
                </Space>
              </div>
            </Card>

            {/* Quick Stats Card */}
            <Card
              style={{
                marginTop: "24px",
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                border: "none",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <Title level={5} style={{ color: "#2c3e50", marginBottom: "16px" }}>
                📊 System Status
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#52c41a",
                        marginBottom: "4px",
                      }}
                    >
                      Online
                    </div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      System Status
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#1890ff",
                        marginBottom: "4px",
                      }}
                    >
                      24/7
                    </div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Monitoring
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
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
