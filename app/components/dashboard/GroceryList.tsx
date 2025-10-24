"use client";

import React, { useState } from "react";
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
      title={
        <Title level={4} style={{ margin: 0 }}>
          <DollarCircleOutlined /> Record New Meal Expense
        </Title>
      }
      size="small"
      style={{ marginBottom: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ date: dayjs() }}
      >
        <Form.Item
          name="items"
          label="Select Purchased Items"
          rules={[{ required: true, message: "Please select grocery items" }]}
        >
          <Select
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="date"
              label="Purchase Date"
              rules={[{ required: true, message: "Select the date" }]}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="totalCost"
              label="Total Cost (Taka)"
              rules={[
                { required: true, message: "Enter the total bill amount" },
              ]}
            >
              <InputNumber
                min={1}
                placeholder="e.g., 550.75"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<ShoppingOutlined />}
            block
          >
            Record as Meal Expense
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
      title={
        <Title level={4} style={{ margin: 0 }}>
          <PieChartOutlined /> Member Total Spent Summary
        </Title>
      }
      size="small"
      style={{ marginBottom: 20 }}
    >
      <Table dataSource={summary} rowKey="name" pagination={false} size="small">
        <Column title="Member" dataIndex="name" key="name" />
        <Column
          title="Total Spent (৳)"
          dataIndex="totalSpent"
          key="totalSpent"
          align="right"
          render={(spent: number) => (
            <Text strong type="success">
              ৳ {spent.toFixed(2)}
            </Text>
          )}
        />
      </Table>
      <div style={{ marginTop: 10, textAlign: "right", paddingRight: 8 }}>
        <Text strong>Grand Total: </Text>
        <Tag color="blue" style={{ fontSize: 14 }}>
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
    history,
    loading,
    recordNewPurchase,
    isManager,
    memberSpentSummary,
    user,
  } = useGroceryHistory();

  const currentUserId = user?.uid;

  if (loading) {
    return <Spin tip="Loading Expense Data..." style={{ margin: "50px 0" }} />;
  }

  const showRecordForm = true;

  return (
    <Card className="shadow-lg">
      <Title level={2} style={{ margin: 0, marginBottom: 16 }}>
        <ShoppingOutlined /> Daily Meal Expense Tracker
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          {showRecordForm && (
            <RecordPurchaseForm recordNewPurchase={recordNewPurchase} />
          )}

          <MemberTotalSpentSummary summary={memberSpentSummary} />
        </Col>

        <Col xs={24} lg={showRecordForm ? 16 : 24}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                <HistoryOutlined /> Purchase History ({isManager ? "All" : "My"}{" "}
                Purchases)
              </Title>
            }
            size="small"
          >
            <Table
              dataSource={history}
              rowKey="id"
              pagination={{ pageSize: 7 }}
              scroll={{ x: 600 }}
            >
              <Column
                title="Date"
                key="date"
                width={100}
                render={(_, record: GroceryPurchase) => (
                  <Text strong>
                    {dayjs(record.date.toDate()).format("MMM DD")}
                  </Text>
                )}
              />
              <Column
                title="Items Bought"
                dataIndex="items"
                key="items"
                render={(items: string) => <Text>{items}</Text>}
              />
              <Column
                title="Cost"
                dataIndex="totalCost"
                key="totalCost"
                width={120}
                render={(cost: number) => (
                  <Tag
                    color="green"
                    style={{ fontSize: 14, padding: "4px 8px" }}
                  >
                    ৳ {cost.toFixed(2)}
                  </Tag>
                )}
              />
              <Column
                title="Bought By"
                dataIndex="boughtBy"
                key="boughtBy"
                width={120}
                render={(_, record: GroceryPurchase) => (
                  <Text type="secondary">
                    {record.boughtBy}
                    {record.boughtById === currentUserId ? " (You)" : ""}
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
