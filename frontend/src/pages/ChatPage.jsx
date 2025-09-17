import { useState } from "react";
import { Layout, Input, Button, List, Typography, Card } from "antd";
import { SendOutlined, MessageOutlined } from "@ant-design/icons";

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "system", text: "👋 Welcome to Haycarb Assistant Chat!" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState(["Session 1"]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", text: input };
    setMessages([...messages, newMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "🤖 This is a sample AI response." },
      ]);
    }, 600);
  };

  return (
    <Layout style={{ minHeight: "80vh", background: "#fafafa" }}>
      {/* Sidebar */}
      <Sider
        width={220}
        style={{
          background: "#2E7D32",
          color: "white",
          padding: "20px 10px",
        }}
      >
        <Title level={4} style={{ color: "white", marginBottom: 20 }}>
          <MessageOutlined /> Chat History
        </Title>
        <List
          dataSource={history}
          renderItem={(item) => (
            <List.Item style={{ color: "white", cursor: "pointer" }}>
              {item}
            </List.Item>
          )}
        />
      </Sider>

      {/* Main Chat Area */}
      <Content style={{ padding: 20 }}>
        <Card
          style={{
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px",
              marginBottom: "15px",
              maxHeight: "60vh",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    maxWidth: "70%",
                    backgroundColor:
                      msg.role === "user" ? "#2E7D32" : "#E0E0E0",
                    color: msg.role === "user" ? "white" : "#333",
                  }}
                >
                  <Text>{msg.text}</Text>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 10 }}>
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={handleSend}
            />
            <Button
              type="primary"
              onClick={handleSend}
              style={{ background: "#2E7D32", borderColor: "#2E7D32" }}
              icon={<SendOutlined />}
            >
              Send
            </Button>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
