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
  Modal,
  Select,
} from "antd";
import { TeamOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { useMembers } from "../../lib/hooks/useMembers";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

interface MembersManagerProps {
  messId: string;
}

export default function MembersManager({ messId }: MembersManagerProps) {
  const { members, loading, updateMemberRole, removeMember, isManager } =
    useMembers();

  if (!isManager) {
    return (
      <Alert
        message="Access Denied"
        description="You must be the Mess Manager to access member management."
        type="error"
        showIcon
      />
    );
  }

  if (loading) {
    return <Spin tip="Loading Mess Members..." style={{ margin: "50px 0" }} />;
  }

  const handleRoleChange = async (
    uid: string,
    newRole: "manager" | "member"
  ) => {
    const success = await updateMemberRole(uid, newRole);
    if (success) {
      message.success(`Successfully changed role to ${newRole}.`);
    } else {
      message.error("Failed to change role. Check permissions.");
    }
  };

  const handleRemoveMember = (member: any) => {
    Modal.confirm({
      title: `Are you sure you want to remove ${member.displayName}?`,
      content:
        "This action will permanently remove the user from your mess. They will need to rejoin.",
      icon: <DeleteOutlined style={{ color: "red" }} />,
      okText: "Yes, Remove",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        const success = await removeMember(member.uid);
        if (success) {
          message.success(
            `${member.displayName} has been removed from the mess.`
          );
        } else {
          message.error("Failed to remove member. Check console.");
        }
      },
    });
  };

  return (
    <Card className="shadow-lg">
      <Title level={2} style={{ margin: 0 }}>
        <TeamOutlined /> Mess Member Management
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
        Total Members: <Text strong>{members.length}</Text> | Mess ID:{" "}
        <Text code>{messId}</Text>
      </Text>

      <Table
        dataSource={members}
        rowKey="uid"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      >
        <Column
          title="Name"
          dataIndex="displayName"
          key="displayName"
          render={(name, record: any) => (
            <Text strong style={{ display: "flex", alignItems: "center" }}>
              <UserOutlined
                style={{
                  marginRight: 8,
                  color: record.role === "manager" ? "#ff4d4f" : "#1890ff",
                }}
              />
              {name}
            </Text>
          )}
        />
        <Column title="Email" dataIndex="email" key="email" />
        <Column
          title="Role"
          dataIndex="role"
          key="role"
          render={(role: string) => (
            <Tag color={role === "manager" ? "volcano" : "green"}>
              {role.toUpperCase()}
            </Tag>
          )}
        />

        <Column
          title="Action"
          key="action"
          render={(_, record: any) => (
            <div style={{ display: "flex", gap: 8 }}>
              <Select
                value={record.role}
                onChange={(value: "manager" | "member") =>
                  handleRoleChange(record.uid, value)
                }
                style={{ width: 120 }}
                disabled={record.uid === messId}
              >
                <Option value="manager">Manager</Option>
                <Option value="member">Member</Option>
              </Select>

              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveMember(record)}
                disabled={record.uid === messId}
              >
                Remove
              </Button>
            </div>
          )}
        />
      </Table>
    </Card>
  );
}
