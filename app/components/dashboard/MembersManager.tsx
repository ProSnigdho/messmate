"use client";

import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Typography,
  Spin,
  Alert,
  message,
  Tag,
  Select,
  Space,
  Tooltip,
  InputNumber,
  Modal,
  Form,
  Input,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
  HomeOutlined,
  EditOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useMembers } from "../../lib/hooks/useMembers";
import { useAuth } from "../../lib/auth-context";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

interface MembersManagerProps {
  messId: string;
}

interface Member {
  uid: string;
  displayName: string;
  email: string;
  role: "manager" | "member";
  messId: string | null;
  monthlyRent?: number;
  customRent?: number;
}

export default function MembersManager({ messId }: MembersManagerProps) {
  const { user } = useAuth();
  const { members, loading, updateMemberRole, isManager, updateMemberRent } =
    useMembers();
  const [rentModalVisible, setRentModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [form] = Form.useForm();

  if (!isManager) {
    return (
      <Alert
        message="Access Denied"
        description="You must be the Mess Manager to access member management."
        type="error"
        showIcon
        style={{ margin: "20px 0" }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", margin: "50px 0" }}>
        <Spin size="large" tip="Loading Mess Members..." />
      </div>
    );
  }

  const handleRoleChange = async (
    uid: string,
    newRole: "manager" | "member",
    currentName: string
  ) => {
    const success = await updateMemberRole(uid, newRole);
    if (success) {
      message.success(
        `Successfully changed ${currentName}'s role to ${newRole}.`
      );
    } else {
      message.error("Failed to change role. You may not have permission.");
    }
  };

  const handleRentEdit = (member: Member) => {
    setSelectedMember(member);
    form.setFieldsValue({
      monthlyRent: member.monthlyRent || 0,
      customRent: member.customRent || 0,
    });
    setRentModalVisible(true);
  };

  const handleRentUpdate = async (values: {
    monthlyRent: number;
    customRent: number;
  }) => {
    if (!selectedMember) return;

    const success = await updateMemberRent(
      selectedMember.uid,
      values.monthlyRent,
      values.customRent
    );
    if (success) {
      message.success(
        `Successfully updated rent for ${selectedMember.displayName}`
      );
      setRentModalVisible(false);
      form.resetFields();
    } else {
      message.error("Failed to update rent.");
    }
  };

  const managerCount = members.filter((m) => m.role === "manager").length;
  const memberCount = members.filter((m) => m.role === "member").length;
  const totalRent = members.reduce(
    (sum, member) => sum + (member.monthlyRent || 0) + (member.customRent || 0),
    0
  );

  return (
    <>
      <Card
        className="shadow-lg"
        style={{ margin: "20px 0" }}
        styles={{ body: { padding: "24px" } }}
      >
        <Title
          level={2}
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <TeamOutlined style={{ color: "#1890ff" }} />
          Mess Member Management
        </Title>

        <Space direction="vertical" style={{ width: "100%", marginBottom: 24 }}>
          <Text type="secondary" style={{ fontSize: "16px" }}>
            Total Members: <Text strong>{members.length}</Text>
            {" | "} Managers: <Tag color="volcano">{managerCount}</Tag>
            {" | "} Members: <Tag color="green">{memberCount}</Tag>
            {" | "} Total Monthly Rent: <Tag color="orange">৳{totalRent}</Tag>
          </Text>
          <Text type="secondary">
            Mess ID:{" "}
            <Text code copyable>
              {messId}
            </Text>
          </Text>
        </Space>

        <Table
          dataSource={members}
          rowKey="uid"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} members`,
          }}
          scroll={{ x: 1000 }}
          loading={loading}
          locale={{
            emptyText: "No members found in your mess",
          }}
        >
          <Column
            title="Member"
            dataIndex="displayName"
            key="displayName"
            width="25%"
            render={(name: string, record: Member) => (
              <Space>
                {record.role === "manager" ? (
                  <CrownOutlined
                    style={{ color: "#ff7a45", fontSize: "16px" }}
                  />
                ) : (
                  <UserOutlined
                    style={{ color: "#1890ff", fontSize: "16px" }}
                  />
                )}
                <Text strong>{name}</Text>
                {user && record.uid === user.uid && (
                  <Tag color="blue" style={{ margin: 0 }}>
                    You
                  </Tag>
                )}
              </Space>
            )}
            sorter={(a: Member, b: Member) =>
              a.displayName.localeCompare(b.displayName)
            }
          />

          <Column
            title="Email"
            dataIndex="email"
            key="email"
            width="30%"
            sorter={(a: Member, b: Member) => a.email.localeCompare(b.email)}
          />

          <Column
            title="Monthly Rent"
            dataIndex="monthlyRent"
            key="monthlyRent"
            width="15%"
            render={(rent: number, record: Member) => (
              <Space>
                <DollarOutlined style={{ color: "#52c41a" }} />
                <Text strong>{rent || 0} ৳</Text>
              </Space>
            )}
            sorter={(a: Member, b: Member) =>
              (a.monthlyRent || 0) - (b.monthlyRent || 0)
            }
          />

          <Column
            title="Custom Rent"
            dataIndex="customRent"
            key="customRent"
            width="15%"
            render={(customRent: number, record: Member) => (
              <Space>
                <HomeOutlined style={{ color: "#fa8c16" }} />
                <Text strong>{customRent || 0} ৳</Text>
              </Space>
            )}
            sorter={(a: Member, b: Member) =>
              (a.customRent || 0) - (b.customRent || 0)
            }
          />

          <Column
            title="Total Rent"
            key="totalRent"
            width="15%"
            render={(_: any, record: Member) => {
              const total =
                (record.monthlyRent || 0) + (record.customRent || 0);
              return (
                <Tag color="green" style={{ margin: 0 }}>
                  ৳{total}
                </Tag>
              );
            }}
            sorter={(a: Member, b: Member) =>
              (a.monthlyRent || 0) +
              (a.customRent || 0) -
              ((b.monthlyRent || 0) + (b.customRent || 0))
            }
          />

          <Column
            title="Role"
            dataIndex="role"
            key="role"
            width="15%"
            render={(role: string, record: Member) => (
              <Tag
                color={role === "manager" ? "volcano" : "green"}
                icon={role === "manager" ? <CrownOutlined /> : <UserOutlined />}
                style={{ fontSize: "12px", padding: "4px 8px" }}
              >
                {role.toUpperCase()}
              </Tag>
            )}
            filters={[
              { text: "Manager", value: "manager" },
              { text: "Member", value: "member" },
            ]}
            onFilter={(value, record: Member) => record.role === value}
          />

          <Column
            title="Actions"
            key="action"
            width="20%"
            render={(_: any, record: Member) => {
              const isCurrentUser = user && record.uid === user.uid;
              const managerMembers = members.filter(
                (m) => m.role === "manager"
              );
              const isOnlyManager =
                record.role === "manager" && managerMembers.length === 1;

              return (
                <Space>
                  <Tooltip title="Change member role">
                    <Select
                      value={record.role}
                      onChange={(value: "manager" | "member") =>
                        handleRoleChange(record.uid, value, record.displayName)
                      }
                      style={{ width: 100 }}
                      disabled={isCurrentUser || isOnlyManager}
                      size="small"
                    >
                      <Option value="manager">
                        <Space size="small">
                          <CrownOutlined />
                          Manager
                        </Space>
                      </Option>
                      <Option value="member">
                        <Space size="small">
                          <UserOutlined />
                          Member
                        </Space>
                      </Option>
                    </Select>
                  </Tooltip>

                  <Tooltip title="Edit Rent">
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleRentEdit(record)}
                      size="small"
                    />
                  </Tooltip>
                </Space>
              );
            }}
          />
        </Table>
      </Card>

      <Modal
        title={
          <Space>
            <HomeOutlined />
            Edit Rent for {selectedMember?.displayName}
          </Space>
        }
        open={rentModalVisible}
        onCancel={() => {
          setRentModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleRentUpdate}>
          <Form.Item
            name="monthlyRent"
            label="Monthly Base Rent (৳)"
            rules={[{ required: true, message: "Please enter monthly rent" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter monthly rent"
              prefix="৳"
            />
          </Form.Item>

          <Form.Item
            name="customRent"
            label="Additional/Custom Rent (৳)"
            tooltip="Additional rent for special arrangements"
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter additional rent"
              prefix="৳"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Rent
              </Button>
              <Button
                onClick={() => {
                  setRentModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
