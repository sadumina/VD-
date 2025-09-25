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

  // ✅ OCR Handler
  const handleOCR = async ({ file }) => {
    try {
      setOcrLoading(true);
      const res = await uploadOCR(file);
      if (res.data.text) {
        form.setFieldsValue({ vehicleNo: res.data.text });
        message.success(`✅ Plate detected: ${res.data.text}`);
      } else {
        message.warning("⚠️ No text detected in the image");
      }
    } catch (err) {
      message.error("❌ OCR failed: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // ✅ Camera capture → OCR
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
    <div style={{ 
      minHeight: "100vh", 
      padding: "20px", 
      background: "linear-gradient(135deg, #e8f5e8 0%, #a8e6a3 50%, #4caf50 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Card style={{ 
        maxWidth: "700px", 
        width: "100%",
        margin: "0 auto", 
        borderRadius: "20px",
        boxShadow: "0 25px 50px rgba(76, 175, 80, 0.3)",
        border: "3px solid rgba(76, 175, 80, 0.2)",
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ 
          textAlign: "center", 
          marginBottom: "30px",
          background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)",
          color: "white",
          padding: "35px 24px",
          margin: "-24px -24px 30px -24px",
          position: "relative"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grid\" width=\"10\" height=\"10\" patternUnits=\"userSpaceOnUse\"><path d=\"M 10 0 L 0 0 0 10\" fill=\"none\" stroke=\"rgba(255,255,255,0.1)\" stroke-width=\"0.5\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grid)\"/></svg>')",
            opacity: 0.3
          }}></div>
          <SafetyOutlined style={{ 
            fontSize: "40px", 
            marginBottom: "16px", 
            display: "block",
            color: "#e8f5e8",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
            position: "relative",
            zIndex: 1
          }} />
          <Title level={2} style={{ 
            color: "white", 
            margin: "0 0 8px 0",
            fontWeight: "700",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            position: "relative",
            zIndex: 1
          }}>
            Vehicle Entry System
          </Title>
          <Text style={{ 
            color: "rgba(255, 255, 255, 0.9)", 
            fontSize: "16px",
            fontWeight: "400",
            position: "relative",
            zIndex: 1
          }}>
            Secure vehicle registration and tracking
          </Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          {/* Vehicle info */}
          <Form.Item
            name="vehicleNo"
            label={<span style={{ fontWeight: "600", color: "#2e7d32", fontSize: "16px" }}>Vehicle License Plate</span>}
            rules={[{ required: true, message: "Please enter vehicle number" }]}
            style={{ marginBottom: "24px" }}
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
                transition: "all 0.3s ease",
                boxShadow: "inset 0 2px 4px rgba(76, 175, 80, 0.1)"
              }}
            />
          </Form.Item>

          <Form.Item 
            name="containerId" 
            label={<span style={{ fontWeight: "600", color: "#2e7d32", fontSize: "16px" }}>Container ID (Optional)</span>}
            style={{ marginBottom: "32px" }}
          >
            <Input 
              placeholder="e.g. CMAU7654321" 
              prefix={<ContainerOutlined style={{ color: "#4caf50" }} />}
              style={{
                height: "50px",
                borderRadius: "12px",
                fontSize: "16px",
                border: "2px solid #c8e6c9",
                backgroundColor: "#f1f8e9",
                transition: "all 0.3s ease",
                boxShadow: "inset 0 2px 4px rgba(76, 175, 80, 0.1)"
              }}
            />
          </Form.Item>

          {/* OCR buttons */}
          <div style={{ 
            marginBottom: "32px",
            background: "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)",
            padding: "24px",
            borderRadius: "16px",
            border: "2px solid rgba(76, 175, 80, 0.2)",
            boxShadow: "0 8px 24px rgba(76, 175, 80, 0.15)"
          }}>
            <Title level={5} style={{ 
              color: "#2e7d32", 
              marginBottom: "20px",
              fontWeight: "700",
              textAlign: "center"
            }}>
              <ScanOutlined style={{ marginRight: "8px", color: "#4caf50" }} /> 
              Automatic Plate Detection
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Upload customRequest={handleOCR} showUploadList={false} accept="image/*">
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={ocrLoading} 
                    block
                    style={{
                      height: "48px",
                      borderRadius: "10px",
                      fontWeight: "600",
                      fontSize: "15px",
                      background: "linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)",
                      color: "white",
                      border: "none",
                      boxShadow: "0 6px 20px rgba(76, 175, 80, 0.4)",
                      transition: "all 0.3s ease"
                    }}
                  >
                    Upload Image
                  </Button>
                </Upload>
              </Col>
              <Col xs={24} sm={12}>
                <Button 
                  icon={<CameraOutlined />} 
                  onClick={() => setCameraOpen(true)} 
                  block
                  style={{
                    height: "48px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "15px",
                    background: "linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)",
                    color: "white",
                    border: "none",
                    boxShadow: "0 6px 20px rgba(46, 125, 50, 0.4)",
                    transition: "all 0.3s ease"
                  }}
                >
                  Use Camera
                </Button>
              </Col>
            </Row>
          </div>

          {/* Plant */}
          <Form.Item
            name="plant"
            label={<span style={{ fontWeight: "600", color: "#2e7d32", fontSize: "16px" }}>Destination Plant</span>}
            rules={[{ required: true, message: "Please select a plant" }]}
            style={{ marginBottom: "32px" }}
          >
            <Select 
              placeholder="Choose plant" 
              size="large"
              style={{
                borderRadius: "12px"
              }}
            >
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
          <Form.Item style={{ marginBottom: 0 }}>
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
                background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)",
                border: "none",
                boxShadow: "0 12px 32px rgba(76, 175, 80, 0.4)",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
            >
              Complete Vehicle Entry <ArrowRightOutlined style={{ marginLeft: "8px" }} />
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Camera modal */}
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
        styles={{
          header: {
            background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
            color: "white",
            borderRadius: "16px 16px 0 0",
            textAlign: "center",
            padding: "24px",
            border: "none"
          },
          body: {
            padding: "24px",
            background: "linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%)"
          },
          footer: {
            background: "linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%)",
            borderTop: "2px solid rgba(76, 175, 80, 0.2)",
            padding: "16px 24px"
          }
        }}
        title={
          <Space style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>
            <CameraOutlined /> License Plate Scanner
          </Space>
        }
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            height: "40px"
          }
        }}
        cancelButtonProps={{
          style: {
            borderRadius: "8px",
            fontWeight: "600",
            height: "40px",
            borderColor: "#4caf50",
            color: "#4caf50"
          }
        }}
      >
        <div style={{
          border: "3px dashed #4caf50",
          borderRadius: "16px",
          padding: "12px",
          background: "rgba(255, 255, 255, 0.8)",
          boxShadow: "inset 0 4px 8px rgba(76, 175, 80, 0.1)"
        }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{ 
              width: "100%", 
              borderRadius: "12px", 
              maxHeight: "300px", 
              objectFit: "cover",
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)"
            }}
          />
        </div>
      </Modal>
    </div>
  );
}