"use client";

import React, { useState } from "react";
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
} from "antd";
import { BellOutlined, EditOutlined } from "@ant-design/icons";
import { useNotices, Notice } from "../../lib/hooks/useNotices";
import moment from "moment";

const { Title, Text } = Typography;
const { TextArea } = Input;

const AddNoticeForm: React.FC<{
  addNotice: (title: string, content: string) => Promise<boolean>;
}> = ({ addNotice }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { title: string; content: string }) => {
    setSubmitting(true);
    const success = await addNotice(values.title, values.content);
    setSubmitting(false);

    if (success) {
      message.success("Notice published successfully!");
      form.resetFields();
    } else {
      message.error("Failed to publish notice. Check console for details.");
    }
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          Publish New Notice
        </Title>
      }
      size="small"
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input placeholder="e.g., Mess Fee Submission Deadline" />
        </Form.Item>

        <Form.Item
          name="content"
          label="Content"
          rules={[{ required: true, message: "Please enter notice content" }]}
        >
          <TextArea rows={4} placeholder="Detailed message for members..." />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<EditOutlined />}
            block
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

  if (loading) {
    return <Spin tip="Loading Notice Board..." style={{ margin: "50px 0" }} />;
  }

  return (
    <Card className="shadow-lg">
      <Title level={2} style={{ margin: 0 }}>
        <BellOutlined /> **Mess Notice Board**
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
        Important announcements and information for all mess members.
      </Text>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          {isManager ? (
            <AddNoticeForm addNotice={addNotice} />
          ) : (
            <Alert
              message="Member View"
              description="Only the Mess Manager can post new notices. You can view all announcements here."
              type="info"
              showIcon
            />
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                Recent Notices
              </Title>
            }
            size="small"
          >
            {notices.length === 0 ? (
              <Alert
                message="No notices found for this mess."
                type="warning"
                showIcon
              />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={notices}
                renderItem={(item: Notice) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text strong style={{ fontSize: "18px" }}>
                            {item.title}
                          </Text>
                          <Tag color="geekblue">
                            {moment(item.date.toDate()).fromNow()}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            Posted by: <strong>{item.authorName}</strong>
                          </Text>
                        </div>
                      }
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text>{item.content}</Text>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
