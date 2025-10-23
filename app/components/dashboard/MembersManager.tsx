"use client";

import React from "react";
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
} from "antd";
import { TeamOutlined, UserOutlined, CrownOutlined } from "@ant-design/icons";
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
}

export default function MembersManager({ messId }: MembersManagerProps) {
  const { user } = useAuth();
  const { members, loading, updateMemberRole, isManager } = useMembers();

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

  const managerCount = members.filter((m) => m.role === "manager").length;
  const memberCount = members.filter((m) => m.role === "member").length;

  return (
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
        scroll={{ x: 800 }}
        loading={loading}
        locale={{
          emptyText: "No members found in your mess",
        }}
      >
        <Column
          title="Member"
          dataIndex="displayName"
          key="displayName"
          width="30%"
          render={(name: string, record: Member) => (
            <Space>
              {record.role === "manager" ? (
                <CrownOutlined style={{ color: "#ff7a45", fontSize: "16px" }} />
              ) : (
                <UserOutlined style={{ color: "#1890ff", fontSize: "16px" }} />
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
          width="40%"
          sorter={(a: Member, b: Member) => a.email.localeCompare(b.email)}
        />

        <Column
          title="Role"
          dataIndex="role"
          key="role"
          width="20%"
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
          title="Change Role"
          key="action"
          width="30%"
          render={(_: any, record: Member) => {
            const isCurrentUser = user && record.uid === user.uid;
            const managerMembers = members.filter((m) => m.role === "manager");
            const isOnlyManager =
              record.role === "manager" && managerMembers.length === 1;

            return (
              <Tooltip
                title={
                  isCurrentUser
                    ? "You cannot change your own role"
                    : isOnlyManager
                    ? "Cannot change role of the only manager"
                    : "Change member role"
                }
              >
                <Select
                  value={record.role}
                  onChange={(value: "manager" | "member") =>
                    handleRoleChange(record.uid, value, record.displayName)
                  }
                  style={{ width: 120 }}
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
            );
          }}
        />
      </Table>
    </Card>
  );
}
