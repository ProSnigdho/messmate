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
  Row,
  Col,
  Statistic,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
  HomeOutlined,
  DollarOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import { useMembers } from "../../lib/hooks/useMembers";
import { useAuth } from "../../lib/auth-context";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

const PRIMARY_COLOR = "#00695C";
const SECONDARY_COLOR = "#00bfa5";

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
      message.error(
        "Failed to change role. You might not have permission or there must be at least one manager."
      );
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

    const monthlyRent = Math.max(0, values.monthlyRent || 0);
    const customRent = Math.max(0, values.customRent || 0);

    const success = await updateMemberRent(
      selectedMember.uid,
      monthlyRent,
      customRent
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

  const totalMembers = members.length;

  return (
    <>
      <Title
        level={2}
        style={{
          margin: "20px 0 10px 0",
          color: PRIMARY_COLOR,
          fontWeight: "bold",
          fontSize: "1.5rem",
        }}
      >
        <TeamOutlined style={{ marginRight: 10 }} /> Mess Member Management
      </Title>

      <Text
        type="secondary"
        style={{ marginBottom: 20, display: "block", fontSize: "0.9rem" }} // Optimized font size
      >
        Mess ID:{" "}
        <Text code copyable style={{ fontSize: "0.9rem" }}>
          {messId}
        </Text>
      </Text>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            className="shadow-md"
            style={{ borderLeft: `5px solid ${PRIMARY_COLOR}` }}
          >
            <Statistic
              title="Total Members"
              value={totalMembers}
              prefix={<TeamOutlined style={{ color: PRIMARY_COLOR }} />}
              valueStyle={{
                color: PRIMARY_COLOR,
                fontWeight: "bold",
                fontSize: 20,
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            className="shadow-md"
            style={{ borderLeft: "5px solid #cf1322" }}
          >
            <Statistic
              title="Managers"
              value={managerCount}
              prefix={<CrownOutlined style={{ color: "#cf1322" }} />}
              valueStyle={{
                color: "#cf1322",
                fontWeight: "bold",
                fontSize: 20,
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            className="shadow-md"
            style={{ borderLeft: "5px solid #389e0d" }}
          >
            <Statistic
              title="Basic Members"
              value={memberCount}
              prefix={<UserOutlined style={{ color: "#389e0d" }} />}
              valueStyle={{
                color: "#389e0d",
                fontWeight: "bold",
                fontSize: 20,
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            className="shadow-md"
            style={{ borderLeft: "5px solid #fa8c16" }}
          >
            <Statistic
              title="Total Monthly Rent"
              value={totalRent}
              prefix="৳"
              valueStyle={{
                color: "#fa8c16",
                fontWeight: "bold",
                fontSize: 20,
              }}
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="shadow-lg"
        styles={{ body: { padding: "0" } }}
        style={{ borderRadius: "8px", borderTop: `4px solid ${PRIMARY_COLOR}` }}
      >
        <Table
          dataSource={members}
          rowKey="uid"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} members`,
          }}
          scroll={{ x: 700 }}
          loading={loading}
          locale={{
            emptyText: "No members found in your mess",
          }}
          size="middle"
        >
          <Column
            title="Member"
            dataIndex="displayName"
            key="displayName"
            width={150}
            render={(name: string, record: Member) => (
              <Space>
                {record.role === "manager" ? (
                  <CrownOutlined
                    style={{ color: PRIMARY_COLOR, fontSize: "16px" }}
                  />
                ) : (
                  <UserOutlined
                    style={{ color: SECONDARY_COLOR, fontSize: "16px" }}
                  />
                )}
                <Text strong style={{ color: PRIMARY_COLOR, fontSize: 13 }}>
                  {name}
                </Text>
                {user && record.uid === user.uid && (
                  <Tag
                    color="blue"
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      padding: "1px 5px",
                    }}
                  >
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
            responsive={["md"]}
            width={200}
            sorter={(a: Member, b: Member) => a.email.localeCompare(b.email)}
          />

          <Column
            title="Total Rent"
            key="totalRent"
            width={100}
            render={(_: any, record: Member) => {
              const total =
                (record.monthlyRent || 0) + (record.customRent || 0);
              return (
                <Tag
                  color="green"
                  style={{ margin: 0, fontWeight: "bold", fontSize: "11px" }}
                >
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
            title="Base Rent"
            dataIndex="monthlyRent"
            key="monthlyRent"
            responsive={["lg"]}
            width={100}
            render={(rent: number) => (
              <Text type="secondary" style={{ fontSize: 12 }}>
                ৳{rent || 0}
              </Text>
            )}
            sorter={(a: Member, b: Member) =>
              (a.monthlyRent || 0) - (b.monthlyRent || 0)
            }
          />

          <Column
            title="Custom Rent"
            dataIndex="customRent"
            key="customRent"
            responsive={["lg"]}
            width={100}
            render={(customRent: number) => (
              <Text type="secondary" style={{ fontSize: 12 }}>
                ৳{customRent || 0}
              </Text>
            )}
            sorter={(a: Member, b: Member) =>
              (a.customRent || 0) - (b.customRent || 0)
            }
          />

          <Column
            title="Role"
            dataIndex="role"
            key="role"
            width={120}
            render={(role: string) => (
              <Tag
                color={role === "manager" ? "volcano" : PRIMARY_COLOR}
                icon={role === "manager" ? <CrownOutlined /> : <UserOutlined />}
                style={{ fontSize: "11px", padding: "3px 5px" }}
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
            width={150}
            render={(_: any, record: Member) => {
              const isCurrentUser = user && record.uid === user.uid;
              const managerMembers = members.filter(
                (m) => m.role === "manager"
              );
              const isOnlyManager =
                record.role === "manager" && managerMembers.length === 1;

              return (
                <Space size={4}>
                  {" "}
                  <Tooltip
                    title={
                      isCurrentUser
                        ? "You cannot change your own role"
                        : isOnlyManager
                        ? "Must have at least one manager"
                        : "Change member role"
                    }
                  >
                    <Select
                      value={record.role}
                      onChange={(value: "manager" | "member") =>
                        handleRoleChange(record.uid, value, record.displayName)
                      }
                      style={{ width: 85 }}
                      disabled={isCurrentUser || isOnlyManager}
                      size="small"
                    >
                      <Option value="manager" style={{ fontSize: 12 }}>
                        <Space size={4}>
                          <CrownOutlined /> Manager
                        </Space>
                      </Option>
                      <Option value="member" style={{ fontSize: 12 }}>
                        <Space size={4}>
                          <UserOutlined /> Member
                        </Space>
                      </Option>
                    </Select>
                  </Tooltip>
                  <Tooltip title="Edit Rent Contribution">
                    <Button
                      type="default"
                      icon={<DollarOutlined />}
                      onClick={() => handleRentEdit(record)}
                      size="small"
                      style={{
                        color: PRIMARY_COLOR,
                        borderColor: PRIMARY_COLOR,
                        fontSize: 12,
                        padding: "0 8px",
                      }}
                    >
                      Rent
                    </Button>
                  </Tooltip>
                </Space>
              );
            }}
          />
        </Table>
      </Card>

      <Modal
        title={
          <Title
            level={4}
            style={{ margin: 0, color: PRIMARY_COLOR, fontSize: "1.2rem" }}
          >
            <HomeOutlined /> Edit Rent for {selectedMember?.displayName}
          </Title>
        }
        open={rentModalVisible}
        onCancel={() => {
          setRentModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={350}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRentUpdate}
          style={{ paddingTop: 15 }}
        >
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
              step={10}
              size="middle"
            />
          </Form.Item>

          <Form.Item
            name="customRent"
            label="Additional/Custom Rent (৳)"
            tooltip="Additional rent for special arrangements (e.g., specific room, furniture)."
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter additional rent (e.g., utilities, service charges)"
              prefix="৳"
              step={10}
              size="middle"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                style={{ backgroundColor: PRIMARY_COLOR }}
                size="middle"
              >
                <CalculatorOutlined /> Update Rent
              </Button>
              <Button
                onClick={() => {
                  setRentModalVisible(false);
                  form.resetFields();
                }}
                size="middle"
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
