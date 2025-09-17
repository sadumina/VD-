import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { createVehicle } from "../services/api";


const { Title } = Typography;

export default function EntryFormPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Detect vehicle type based on plate
  const detectVehicleType = (plate, containerId) => {
    // If container ID is provided, assume it's a container truck
    if (containerId && containerId.trim() !== "") {
      return "Container Truck";
    }

    if (!plate) return "Unknown";
    const p = plate.toUpperCase();

    if (p.startsWith("L")) return "Lorry";
    if (p.startsWith("T")) return "Truck";
    if (p.startsWith("V")) return "Van";

    // Default fallback
    return "Car";
  };


  const handleSubmit = async (values) => {
  setLoading(true);
  try {
    // Pass both plate + containerId
    const vehicleType = detectVehicleType(values.vehicleNo, values.containerId);

    const res = await createVehicle({
      ...values,
      type: vehicleType,
    });

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
    padding: "40px 20px",
    background: "#F5F5F5",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Card
    style={{
      width: "100%",
      maxWidth: 520,
      borderRadius: 16,
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      padding: "10px 20px",
    }}
  >
    <Title
      level={3}
      style={{
        color: "#2E7D32",
        marginBottom: 10,
        textAlign: "center",
        fontWeight: 600,
      }}
    >
      🚦 Vehicle Entry Form
    </Title>
    <p style={{ textAlign: "center", color: "#666", marginBottom: 30 }}>
      Please log vehicle details for entry into the premises
    </p>

    <Form layout="vertical" onFinish={handleSubmit} size="large">
      {/* Vehicle Plate */}
      <Form.Item
        name="vehicleNo"
        label={<span style={{ fontWeight: 500 }}>Vehicle No (Plate)</span>}
        rules={[{ required: true, message: "Please enter vehicle number" }]}
      >
        <Input
          placeholder="e.g. WP-KL 4455"
          style={{ borderRadius: 8, padding: "10px 12px" }}
        />
      </Form.Item>

      {/* Container ID */}
      <Form.Item
        name="containerId"
        label={<span style={{ fontWeight: 500 }}>Container ID (Optional)</span>}
      >
        <Input
          placeholder="e.g. CMAU 765432 1"
          style={{ borderRadius: 8, padding: "10px 12px" }}
        />
      </Form.Item>

      {/* Future camera integration */}
      <div
        style={{
          background: "#FAFAFA",
          border: "1px dashed #CCC",
          borderRadius: 8,
          padding: "12px",
          textAlign: "center",
          color: "#888",
          marginBottom: 20,
        }}
      >
        📷 Camera/ANPR integration placeholder
      </div>

      {/* Submit */}
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
          block
          style={{
            backgroundColor: "#2E7D32",
            borderColor: "#2E7D32",
            borderRadius: 8,
            fontWeight: 500,
          }}
        >
          Submit Entry
        </Button>
      </Form.Item>
    </Form>
  </Card>
</div>

  );
}
