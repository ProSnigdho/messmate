"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Typography,
  Spin,
  InputNumber,
  DatePicker,
  Table,
  Tag,
  Select,
} from "antd";
import {
  ShoppingOutlined,
  DollarCircleOutlined,
  HistoryOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useGroceryHistory,
  GroceryPurchase,
  MemberSpentSummary,
} from "../../lib/hooks/useGroceryHistory";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

const RecordPurchaseForm: React.FC<{
  recordNewPurchase: (
    items: string,
    cost: number,
    date: Date
  ) => Promise<boolean>;
}> = ({ recordNewPurchase }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const groceryOptions = [
    "Rice",
    "Chicken",
    "Potato",
    "Beef",
    "Fish",
    "Onion",
    "Ginger",
    "Garlic",
    "Vegetables",
    "Eggs",
    "Oil",
    "Salt",
    "Other Masala",
    "Snacks",
    "Drinks",
    "Others",
  ];

  const onFinish = async (values: {
    items: string[];
    totalCost: number;
    date: dayjs.Dayjs;
  }) => {
    setSubmitting(true);
    const itemList = values.items.join(", ");
    const success = await recordNewPurchase(
      itemList,
      values.totalCost,
      values.date.toDate()
    );
    setSubmitting(false);

    if (success) {
      form.resetFields();
    }
  };

  return (
    <Card
      className="shadow-xl border-t-4"
      style={{
        marginBottom: 24,
        borderColor: "#00695C",
        borderRadius: "10px",
      }}
      styles={{
        body: { padding: 24 },
      }}
      title={
        <Title
          level={4}
          style={{
            margin: 0,
            color: "#00695C",
          }}
        >
          <DollarCircleOutlined style={{ marginRight: 8 }} /> Record New Items
        </Title>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ date: dayjs() }}
        style={{ fontSize: "16px" }}
      >
        <Form.Item
          name="items"
          label={
            <span style={{ fontWeight: "600" }}>Select Purchased Items</span>
          }
          rules={[{ required: true, message: "Please select grocery items" }]}
        >
          <Select
            size="large"
            mode="multiple"
            allowClear
            placeholder="Select grocery items"
            style={{ width: "100%" }}
            options={groceryOptions.map((item) => ({
              label: item,
              value: item,
            }))}
          />
        </Form.Item>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="date"
              label={<span style={{ fontWeight: "600" }}>Purchase Date</span>}
              rules={[{ required: true, message: "Select the date" }]}
            >
              <DatePicker
                size="large"
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="totalCost"
              label={
                <span style={{ fontWeight: "600" }}>Total Cost (Taka - ৳)</span>
              }
              rules={[
                { required: true, message: "Enter the total bill amount" },
              ]}
            >
              <InputNumber
                size="large"
                min={1}
                step={0.01}
                placeholder="e.g., 550.75"
                style={{ width: "100%" }}
                formatter={(value) =>
                  `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value: string | undefined) => {
                  const cleanedValue = value
                    ? value.replace(/৳\s?|(,*)/g, "")
                    : "";
                  return parseFloat(cleanedValue) || 0;
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<ShoppingOutlined />}
            block
            style={{
              height: 48,
              fontSize: 18,
              fontWeight: "bold",
              backgroundColor: "#00695C",
              borderColor: "#00695C",
              transition: "background-color 0.3s, border-color 0.3s",
            }}
          >
            Add as Meal Expense
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

const MemberTotalSpentSummary: React.FC<{
  summary: MemberSpentSummary[];
}> = ({ summary }) => {
  const totalAllSpent = summary.reduce((sum, s) => sum + s.totalSpent, 0);

  return (
    <Card
      className="shadow-xl"
      style={{
        marginBottom: 24,
        borderRadius: "10px",
      }}
      title={
        <Title
          level={4}
          style={{
            margin: 0,
            color: "#00695C",
          }}
        >
          <PieChartOutlined style={{ marginRight: 8 }} /> Member Total Spent
          Summary
        </Title>
      }
    >
      <Table dataSource={summary} rowKey="name" pagination={false} size="large">
        <Column
          title="Member"
          dataIndex="name"
          key="name"
          render={(name: string) => (
            <Text style={{ fontSize: "16px", fontWeight: "600" }}>{name}</Text>
          )}
        />
        <Column
          title="Total Spent (৳)"
          dataIndex="totalSpent"
          key="totalSpent"
          align="right"
          render={(spent: number) => (
            <Text
              style={{ fontSize: "16px", color: "#00695C", fontWeight: "bold" }}
            >
              ৳ {spent.toFixed(2)}
            </Text>
          )}
        />
      </Table>
      <div style={{ marginTop: 15, textAlign: "right", paddingRight: 8 }}>
        <Text strong style={{ fontSize: 18, marginRight: 8 }}>
          Grand Total:
        </Text>
        <Tag
          style={{
            fontSize: 18,
            padding: "5px 12px",
            height: "auto",
            backgroundColor: "#00695C",
            color: "white",
            fontWeight: "bold",
            borderRadius: "6px",
          }}
        >
          ৳ {totalAllSpent.toFixed(2)}
        </Tag>
      </div>
    </Card>
  );
};

interface GroceryListProps {
  messId: string;
}

export default function GroceryList({ messId }: GroceryListProps) {
  const {
    allPurchases,
    history: memberHistory,
    allMembers,
    loading,
    recordNewPurchase,
    isManager,
    memberSpentSummary,
    user,
  } = useGroceryHistory();

  const currentUserId = user?.uid;

  const [selectedMemberId, setSelectedMemberId] = useState<string | "all">(
    "all"
  );

  const displayHistory = useMemo(() => {
    if (!isManager) {
      return memberHistory;
    }

    if (selectedMemberId === "all") {
      return allPurchases;
    }

    return allPurchases.filter(
      (purchase) => purchase.boughtById === selectedMemberId
    );
  }, [isManager, selectedMemberId, allPurchases, memberHistory]);

  if (loading) {
    return (
      <Spin
        tip="Loading Expense Data..."
        size="large"
        style={{ margin: "100px 0", display: "block", textAlign: "center" }}
      />
    );
  }

  const showRecordForm = true;

  return (
    <Card
      className="shadow-2xl"
      style={{ minHeight: "100vh", padding: "16px", borderRadius: "12px" }}
    >
      <Title
        level={2}
        style={{
          margin: 0,
          marginBottom: 24,
          color: "#00695C",
          fontWeight: "800",
        }}
      >
        <ShoppingOutlined style={{ marginRight: 10 }} /> Daily Meal Expense
        Tracker
      </Title>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={8}>
          {showRecordForm && (
            <RecordPurchaseForm recordNewPurchase={recordNewPurchase} />
          )}
          <MemberTotalSpentSummary summary={memberSpentSummary} />
        </Col>

        <Col xs={24} lg={showRecordForm ? 16 : 24}>
          <Card
            className="shadow-xl"
            style={{ borderRadius: "10px" }}
            title={
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: "#00695C",
                }}
              >
                <HistoryOutlined style={{ marginRight: 8 }} /> Purchase History
              </Title>
            }
            size="small"
          >
            {isManager && (
              <Row gutter={[16, 8]} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={7}>
                  <Text strong style={{ fontSize: 16 }}>
                    View Purchases By:
                  </Text>
                </Col>
                <Col xs={24} sm={17}>
                  <Select
                    defaultValue="all"
                    size="large"
                    style={{ width: "100%" }}
                    onChange={(value: string) =>
                      setSelectedMemberId(value as string)
                    }
                  >
                    <Option value="all">All Members</Option>
                    {allMembers.map((member) => (
                      <Option key={member.uid} value={member.uid}>
                        {member.displayName}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            )}
            {!isManager && (
              <div style={{ marginBottom: 20, fontSize: 16 }}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  Showing **Your** Purchase History.
                </Text>
              </div>
            )}

            <Table
              dataSource={displayHistory}
              rowKey="id"
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                pageSizeOptions: ["8", "15", "25"],
              }}
              scroll={{ x: 600 }}
              size="large"
              locale={{
                emptyText: (
                  <Text
                    type="secondary"
                    style={{ fontSize: 16, padding: "20px 0" }}
                  >
                    No purchases found for this view.
                  </Text>
                ),
              }}
            >
              <Column
                title="Date"
                key="date"
                width={120}
                render={(_, record: GroceryPurchase) => (
                  <Text strong style={{ fontSize: 16 }}>
                    {dayjs(record.date.toDate()).format("MMM DD, YY")}
                  </Text>
                )}
              />
              <Column
                title="Items Bought"
                dataIndex="items"
                key="items"
                render={(items: string) => (
                  <Text style={{ fontSize: 16 }}>{items}</Text>
                )}
              />
              <Column
                title="Cost (৳)"
                dataIndex="totalCost"
                key="totalCost"
                width={130}
                align="right"
                render={(cost: number) => (
                  <Tag
                    style={{
                      fontSize: 16,
                      padding: "5px 10px",
                      backgroundColor: "#E0F2F1",
                      color: "#00695C",
                      fontWeight: "bold",
                    }}
                  >
                    ৳ {cost.toFixed(2)}
                  </Tag>
                )}
              />
              <Column
                title="Bought By"
                dataIndex="boughtBy"
                key="boughtBy"
                width={150}
                render={(_, record: GroceryPurchase) => (
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    {record.boughtBy}
                    {record.boughtById === currentUserId ? (
                      <Tag
                        style={{
                          marginLeft: 5,
                          backgroundColor: "#00695C",
                          color: "white",
                          padding: "2px 6px",
                          fontSize: 12,
                          borderRadius: "4px",
                        }}
                      >
                        (You)
                      </Tag>
                    ) : (
                      ""
                    )}
                  </Text>
                )}
              />
            </Table>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
