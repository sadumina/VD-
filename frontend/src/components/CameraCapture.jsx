import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button, message, Card, Space } from "antd";
import axios from "axios";

export default function CameraCapture({ onDetected }) {
  const webcamRef = useRef(null);
  const [capturing, setCapturing] = useState(false);

  const capture = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();

    // Convert Base64 → Blob
    const byteString = atob(imageSrc.split(",")[1]);
    const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    const formData = new FormData();
    formData.append("file", blob, "capture.jpg");

    try {
      setCapturing(true);
      const res = await axios.post("http://localhost:8000/api/scan-plate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.plates && res.data.plates.length > 0) {
        message.success("✅ Plate detected: " + res.data.plates[0]);
        onDetected(res.data.plates); // send back to parent
      } else {
        message.warning("⚠️ No plate detected, try again");
      }
    } catch (err) {
      console.error(err);
      message.error("❌ Error detecting plate");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Card style={{ marginTop: 20 }}>
      <Space direction="vertical" align="center" style={{ width: "100%" }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={400}
          videoConstraints={{ facingMode: "environment" }}
        />
        <Button type="primary" loading={capturing} onClick={capture}>
          Capture & Detect Plate
        </Button>
      </Space>
    </Card>
  );
}
