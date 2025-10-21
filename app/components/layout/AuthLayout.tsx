"use client";

import React, { ReactNode } from "react";
import { Row, Col, Card, Typography } from "antd";
import { HomeOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-container">
      <Row
        justify="center"
        align="middle"
        style={{ minHeight: "100vh", background: "#e9ecef", padding: "20px 0" }}
      >
        <Col xs={24} sm={16} md={12} lg={8} xl={6}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 8px 25px rgba(0, 50, 50, 0.1)",
              padding: 20,
              minHeight: 580,
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 30, paddingTop: 10 }}>
              <HomeOutlined style={{ fontSize: 40, color: "#004d40" }} />
              <Title
                level={3}
                style={{ margin: "5px 0 10px 0", color: "#004d40" }}
              >
                Messmate
              </Title>
            </div>

            {children}
          </Card>
        </Col>
      </Row>

      <style jsx global>{`
        .ant-form-item {
          margin-bottom: 10px !important;
        }
        .ant-form-item-label > label {
          font-size: 13px !important;
          color: #333;
        }
        .ant-input,
        .ant-input-password,
        .ant-btn {
          border-radius: 6px !important;
        }
        .auth-container {
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
