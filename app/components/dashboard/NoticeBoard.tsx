"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Typography,
  Spin,
  Alert,
  message,
  List,
  Tag,
  Divider,
  Avatar,
  Space,
} from "antd";
import {
  BellOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNotices, Notice } from "../../lib/hooks/useNotices";
import moment from "moment";

const { Title, Text } = Typography;
const { TextArea } = Input;

const PRIMARY_COLOR = "#004d40";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return isMobile;
};

const getRelativeTimeDisplay = (date: any) => {
  const noticeDate = moment(date.toDate());
  const now = moment();

  if (now.diff(noticeDate, "hours") < 24) {
    return noticeDate.fromNow();
  }
  return noticeDate.format("MMM DD, YYYY | h:mm A");
};

const AddNoticeForm: React.FC<{
  addNotice: (title: string, content: string) => Promise<boolean>;
}> = ({ addNotice }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const onFinish = async (values: { title: string; content: string }) => {
    setSubmitting(true);
    const success = await addNotice(values.title, values.content);
    setSubmitting(false);

    if (success) {
      message.success("Notice published successfully!");
      form.resetFields();
    } else {
      message.error("Failed to publish notice.");
    }
  };

  const cardTitle = (
    <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: PRIMARY_COLOR }}>
      <EditOutlined />
      {isMobile ? " New Notice" : " Create New Announcement"}
    </Title>
  );

  return (
    <Card
      title={cardTitle}
      size="default"
      style={{
        border: `1px solid ${PRIMARY_COLOR}`,
        background: "rgba(0, 77, 64, 0.05)",
      }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="title"
          label={<Text strong>Title</Text>}
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input
            placeholder={
              isMobile
                ? "e.g., Fee Deadline"
                : "e.g., Monthly Fee Submission Deadline"
            }
            size={isMobile ? "middle" : "large"}
          />
        </Form.Item>

        <Form.Item
          name="content"
          label={<Text strong>Content</Text>}
          rules={[{ required: true, message: "Please enter notice content" }]}
        >
          <TextArea
            rows={isMobile ? 4 : 5}
            placeholder={
              isMobile
                ? "Detailed message..."
                : "Detailed message for members..."
            }
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<EditOutlined />}
            block
            size={isMobile ? "middle" : "large"}
            style={{
              backgroundColor: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
            }}
          >
            Publish Notice
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

interface NoticeBoardProps {
  messId: string;
}

export default function NoticeBoard({ messId }: NoticeBoardProps) {
  const { notices, loading, addNotice, isManager } = useNotices();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <Spin
        tip="Loading Notice Board..."
        style={{ margin: "50px 0" }}
        size="large"
      />
    );
  }

  const renderNoticeItem = (item: Notice) => (
    <>
      <List.Item style={{ padding: isMobile ? "12px 0" : "16px 0" }}>
        <List.Item.Meta
          avatar={
            <Avatar
              icon={<BellOutlined />}
              style={{ backgroundColor: PRIMARY_COLOR, color: "#fff" }}
              size={isMobile ? "default" : "large"}
            />
          }
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <Text
                strong
                style={{
                  fontSize: isMobile ? "16px" : "20px",
                  color: "rgba(0, 0, 0, 0.85)",
                }}
              >
                {item.title}
              </Text>

              <Space size="small" style={{ flexShrink: 0 }}>
                <Tag
                  icon={<ClockCircleOutlined />}
                  color="default"
                  style={{ fontSize: isMobile ? "11px" : "12px" }}
                >
                  {getRelativeTimeDisplay(item.date)}
                </Tag>
              </Space>
            </div>
          }
          description={
            <div style={{ marginTop: 4 }}>
              <Text
                type="secondary"
                style={{ fontSize: isMobile ? "12px" : "14px" }}
              >
                Posted by: <Text strong>{item.authorName}</Text>
              </Text>
            </div>
          }
        />
        <div style={{ marginTop: 8, paddingLeft: isMobile ? 48 : 60 }}>
          <Text
            style={{
              fontSize: isMobile ? "14px" : "16px",
              lineHeight: "1.6",
              color: "rgba(0, 0, 0, 0.75)",
            }}
          >
            {item.content}
          </Text>
        </div>
      </List.Item>
      <Divider style={{ margin: "12px 0" }} />
    </>
  );

  return (
    <Card className="shadow-lg" style={{ padding: isMobile ? 12 : 24 }}>
      <Title
        level={isMobile ? 2 : 1}
        style={{
          margin: 0,
          fontSize: isMobile ? "24px" : "36px",
          color: PRIMARY_COLOR,
        }}
      >
        <BellOutlined style={{ marginRight: 10 }} /> Mess Notice Board
      </Title>
      <Text
        type="secondary"
        style={{
          display: "block",
          marginBottom: 30,
          fontSize: isMobile ? "14px" : "16px",
        }}
      >
        Important announcements and information for all mess members.
      </Text>

      <Row gutter={[isMobile ? 16 : 32, isMobile ? 16 : 32]}>
        <Col xs={24} lg={9}>
          {" "}
          {isManager ? (
            <AddNoticeForm addNotice={addNotice} />
          ) : (
            <Alert
              message={
                <Text strong style={{ fontSize: isMobile ? "14px" : "16px" }}>
                  Member View
                </Text>
              }
              description={
                <Text style={{ fontSize: isMobile ? "12px" : "14px" }}>
                  Only the Mess Manager can post new announcements. You can view
                  all notices here.
                </Text>
              }
              type="info"
              showIcon
              style={{ padding: isMobile ? 12 : 20 }}
            />
          )}
        </Col>

        <Col xs={24} lg={15}>
          {" "}
          <Card
            title={
              <Title
                level={isMobile ? 4 : 3}
                style={{ margin: 0, color: PRIMARY_COLOR }}
              >
                Recent Announcements
              </Title>
            }
            size="default"
          >
            {notices.length === 0 ? (
              <Alert
                message={
                  <Text strong style={{ fontSize: isMobile ? "14px" : "16px" }}>
                    No notices found for this mess.
                  </Text>
                }
                description={
                  <Text style={{ fontSize: isMobile ? "12px" : "14px" }}>
                    The manager hasn't posted any announcements yet.
                  </Text>
                }
                type="warning"
                showIcon
              />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={notices}
                renderItem={renderNoticeItem}
                split={false}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
