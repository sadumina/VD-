import { useState, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Select,
  Upload,
  Modal,
  Space,
  Row,
  Col,
} from "antd";
import {
  CarOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  UploadOutlined,
  CameraOutlined,
  ScanOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { createVehicle, uploadOCR } from "../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

export default function EntryFormPage() {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [cameraOpen, setCameraOpen] = useState(false);
  const webcamRef = useRef(null);

  // ✅ OCR Handler (Upload)


  // ✅ OCR Handler (Camera)
  const captureAndScan = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      message.error("❌ Failed to capture image");
      return;
    }
    try {
      setOcrLoading(true);
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

      const ocrRes = await uploadOCR(file);
      if (ocrRes.data.text) {
        form.setFieldsValue({ vehicleNo: ocrRes.data.text });
        message.success(`✅ Plate captured: ${ocrRes.data.text}`);
      } else {
        message.warning("⚠️ No plate detected");
      }
    } catch (err) {
      message.error("❌ Camera OCR failed: " + err.message);
    } finally {
      setOcrLoading(false);
      setCameraOpen(false);
    }
  };

  // ✅ Submit form
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await createVehicle(values);
      if (res.data.status === "ok") {
        message.success("✅ Vehicle entry completed");
        form.resetFields();
        navigate("/dashboard");
      } else {
        message.warning(res.data.message || "⚠️ Error occurred");
      }
    } catch (err) {
      message.error("❌ Entry failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background:
          "linear-gradient(135deg, #e8f5e8 0%, #a8e6a3 50%, #4caf50 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        style={{
          maxWidth: "700px",
          width: "100%",
          margin: "0 auto",
          borderRadius: "20px",
          boxShadow: "0 25px 50px rgba(76, 175, 80, 0.3)",
          border: "3px solid rgba(76, 175, 80, 0.2)",
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
            background:
              "linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)",
            color: "white",
            padding: "35px 24px",
            margin: "-24px -24px 30px -24px",
            position: "relative",
          }}
        >
          <SafetyOutlined
            style={{
              fontSize: "40px",
              marginBottom: "16px",
              display: "block",
              color: "#e8f5e8",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
            }}
          />
          <Title
            level={2}
            style={{
              color: "white",
              margin: "0 0 8px 0",
              fontWeight: "700",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            Vehicle Entry System
          </Title>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "16px",
              fontWeight: "400",
            }}
          >
            Secure vehicle registration and tracking
          </Text>
        </div>

        {/* Form */}
        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          {/* Vehicle Number */}
          <Form.Item
            name="vehicleNo"
            label={
              <span
                style={{
                  fontWeight: "600",
                  color: "#2e7d32",
                  fontSize: "16px",
                }}
              >
                Vehicle License Plate
              </span>
            }
            rules={[{ required: true, message: "Please enter vehicle number" }]}
          >
            <Input
              placeholder="e.g. WP-KL 4455"
              prefix={<CarOutlined style={{ color: "#4caf50" }} />}
              style={{
                height: "50px",
                borderRadius: "12px",
                fontSize: "16px",
                border: "2px solid #c8e6c9",
                backgroundColor: "#f1f8e9",
              }}
            />
          </Form.Item>

          {/* Container ID */}
          <Form.Item name="containerId" label="Container ID (Optional)">
            <Input
              placeholder="e.g. CMAU7654321"
              prefix={<ContainerOutlined style={{ color: "#4caf50" }} />}
              style={{
                height: "50px",
                borderRadius: "12px",
                fontSize: "16px",
                border: "2px solid #c8e6c9",
                backgroundColor: "#f1f8e9",
              }}
            />
          </Form.Item>

         
          {/* Plant */}
          <Form.Item
            name="plant"
            label="Destination Plant"
            rules={[{ required: true, message: "Please select a plant" }]}
          >
            <Select placeholder="Choose plant" size="large">
              <Option value="Badalgama">
                <Space>
                  <EnvironmentOutlined style={{ color: "#4caf50" }} />
                  Badalgama Plant
                </Space>
              </Option>
              <Option value="Madampe">
                <Space>
                  <EnvironmentOutlined style={{ color: "#4caf50" }} />
                  Madampe Plant
                </Space>
              </Option>
            </Select>
          </Form.Item>

          {/* Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<CheckCircleOutlined />}
              style={{
                height: "56px",
                borderRadius: "16px",
                fontWeight: "700",
                fontSize: "18px",
                background:
                  "linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)",
                border: "none",
              }}
            >
              Complete Vehicle Entry{" "}
              <ArrowRightOutlined style={{ marginLeft: "8px" }} />
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Camera Modal */}
      <Modal
        open={cameraOpen}
        onCancel={() => setCameraOpen(false)}
        onOk={captureAndScan}
        okText="Capture & Scan"
        cancelText="Cancel"
        confirmLoading={ocrLoading}
        width={600}
        centered
        maskClosable={false}
        closeIcon={<CloseOutlined style={{ color: "white" }} />}
        title={
          <Space style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>
            <CameraOutlined /> License Plate Scanner
          </Space>
        }
      >
        <div
          style={{
            border: "3px dashed #4caf50",
            borderRadius: "16px",
            padding: "12px",
            background: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{
              width: "100%",
              borderRadius: "12px",
              maxHeight: "300px",
              objectFit: "cover",
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
