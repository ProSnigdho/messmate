"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Checkbox,
  message,
  Alert,
  Spin,
  Divider,
  DatePicker,
  Select,
  Tag,
  Button,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import {
  doc,
  setDoc,
  collection,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../lib/auth-context";
import { useMealTracking } from "../../lib/hooks/useMealTracking";
import { updateMeal } from "../../lib/database";
import { db } from "../../lib/firebase";
import type { Meal, UserProfile } from "../../lib/types";
import Dayjs from "dayjs";
import type { Dayjs as DayjsType } from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type MealType = "breakfast" | "lunch" | "dinner";
type RangeValue = [DayjsType | null, DayjsType | null] | null;

interface FullMealHistoryEntry {
  key: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  total: number;
}

interface BillingSummaryProps {
  userMealData: any[];
  billingSummary: {
    totalMeals: number;
    totalGroceryCost: number;
    mealRate: number;
  };
  loading: boolean;
}

const MonthlyBillingSummary: React.FC<BillingSummaryProps> = ({
  userMealData,
  billingSummary,
  loading,
}) => {
  const { totalMeals, totalGroceryCost, mealRate } = billingSummary;

  const dataSource = userMealData.map((data: any) => {
    const totalMealsValue = data.monthlyTotalMeals || 0;
    const totalPaidValue = data.monthlyTotalPaid || 0;

    const mealCost = totalMealsValue * mealRate;
    const totalPaid = totalPaidValue;

    const paidVsDue = totalPaid - mealCost;

    return {
      key: data.user.uid,
      name: data.user.displayName,
      totalMeals: totalMealsValue,
      totalPaid: totalPaid.toFixed(2),
      mealCost: mealCost.toFixed(2),
      paidVsDue: paidVsDue.toFixed(2),
    };
  });

  const columns = [
    { title: "Member", dataIndex: "name", key: "name", width: 100 },
    {
      title: "Total Meals (Monthly)",
      dataIndex: "totalMeals",
      key: "totalMeals",
      align: "center" as const,
      width: 120,
    },
    {
      title: "Total Paid (Grocery)",
      dataIndex: "totalPaid",
      key: "totalPaid",
      align: "right" as const,
      width: 130,
      render: (text: string) => (
        <Text strong type="warning">
          {text} ৳
        </Text>
      ),
    },
    {
      title: "Actual Meal Cost",
      dataIndex: "mealCost",
      key: "mealCost",
      align: "right" as const,
      width: 120,
      render: (text: string) => <Text>{text} ৳</Text>,
    },
    {
      title: "Final Balance (Settlement)",
      dataIndex: "paidVsDue",
      key: "paidVsDue",
      align: "right" as const,
      width: 150,
      render: (text: string) => {
        const amount = parseFloat(text);

        if (amount > 0.01) {
          return (
            <Tag color="green" style={{ fontSize: 14 }}>
              Pabe: {text} ৳
            </Tag>
          );
        } else if (amount < -0.01) {
          return (
            <Tag color="red" style={{ fontSize: 14 }}>
              Dite Hobe: {Math.abs(amount).toFixed(2)} ৳
            </Tag>
          );
        } else {
          return (
            <Tag color="blue" style={{ fontSize: 14 }}>
              Settled (0.00 ৳)
            </Tag>
          );
        }
      },
    },
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          💰 Monthly Billing Summary & Final Settlement
        </Title>
      }
      style={{ marginTop: 20 }}
      loading={loading}
    >
      <div
        style={{
          marginBottom: 15,
          border: "1px solid #e8e8e8",
          padding: "10px",
          borderRadius: "4px",
        }}
      >
        <Text strong>📊 Summary for the Month:</Text>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <Text>
            Total Meals in Mess:{" "}
            <Text strong type="success">
              {totalMeals}
            </Text>
          </Text>
          <Text>
            Total Grocery Cost:{" "}
            <Text strong>{totalGroceryCost.toFixed(2)} ৳</Text>
          </Text>
          <Text>
            Meal Rate:{" "}
            <Text strong type="warning">
              {mealRate.toFixed(2)} ৳ / Meal
            </Text>
          </Text>
        </div>
      </div>

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="key"
        pagination={false}
        bordered
        size="middle"
        scroll={{ x: 720 }}
      />
    </Card>
  );
};

const convertToCSV = (
  data: FullMealHistoryEntry[],
  memberName: string,
  dateRange: RangeValue
): string => {
  if (data.length === 0) return "";

  const rangeStart = dateRange ? dateRange[0]?.format("DD MMM YYYY") : "N/A";
  const rangeEnd = dateRange ? dateRange[1]?.format("DD MMM YYYY") : "N/A";

  let csv = `\n\n`;
  csv += `Meal History for: ${memberName}\n`;
  csv += `Date Range: ${rangeStart} to ${rangeEnd}\n\n`;

  const headers = ["Date", "Breakfast", "Lunch", "Dinner", "Daily Total"];
  csv += headers.join(",") + "\n";

  data.forEach((item) => {
    const row = [
      item.date,
      item.breakfast ? "1" : "0",
      item.lunch ? "1" : "0",
      item.dinner ? "1" : "0",
      item.total.toString(),
    ];
    csv += row.join(",") + "\n";
  });

  const grandTotal = data.reduce((sum, item) => sum + item.total, 0);

  csv += `\n,,,,,Total Meals in Range: ${grandTotal}`;
  csv += `\n`;

  return csv;
};

const MonthlyMealHistory: React.FC<{
  messId: string;
  allMembers: { uid: string; displayName: string }[];
  isManager: boolean;
}> = ({ messId, allMembers, isManager }) => {
  if (!isManager) return null;

  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<RangeValue>([
    Dayjs().startOf("month"),
    Dayjs().endOf("month"),
  ]);
  const [historyData, setHistoryData] = useState<FullMealHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selectedMemberName = useMemo(() => {
    return (
      allMembers.find((m) => m.uid === selectedMemberId)?.displayName ||
      "Selected Member"
    );
  }, [allMembers, selectedMemberId]);

  const memberOptions = allMembers.map((member) => ({
    label: member.displayName,
    value: member.uid,
  }));

  const grandTotal = useMemo(() => {
    return historyData.reduce((sum, entry) => sum + entry.total, 0);
  }, [historyData]);

  useEffect(() => {
    if (!selectedMemberId && allMembers.length > 0) {
      setSelectedMemberId(allMembers[0].uid);
    }
  }, [allMembers, selectedMemberId]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedMemberId || !dateRange || !dateRange[0] || !dateRange[1]) {
        setHistoryData([]);
        return;
      }

      setHistoryLoading(true);

      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      try {
        const mealsRef = collection(db, "meals");
        const q = query(
          mealsRef,
          where("messId", "==", messId),
          where("userId", "==", selectedMemberId),
          where("date", ">=", startDate),
          where("date", "<=", endDate)
        );

        const snapshot = await getDocs(q);
        const data: FullMealHistoryEntry[] = snapshot.docs.map((doc) => {
          const meal = doc.data() as Meal;
          const total =
            (meal.breakfast ? 1 : 0) +
            (meal.lunch ? 1 : 0) +
            (meal.dinner ? 1 : 0);

          return {
            key: doc.id,
            date: meal.date,
            breakfast: meal.breakfast || false,
            lunch: meal.lunch || false,
            dinner: meal.dinner || false,
            total,
          };
        });
        setHistoryData(data.sort((a, b) => (a.date < b.date ? 1 : -1)));
      } catch (error) {
        console.error("Error fetching meal history:", error);
        message.error("Failed to load meal history.");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [messId, selectedMemberId, dateRange]);

  const handleDownloadCSV = () => {
    if (historyData.length === 0) {
      message.warning("No data to download for the selected period.");
      return;
    }

    const csvContent = convertToCSV(historyData, selectedMemberName, dateRange);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    const filename = `${selectedMemberName}_Meal_History_${dateRange?.[0]?.format(
      "YYYYMMDD"
    )}_to_${dateRange?.[1]?.format("YYYYMMDD")}.csv`;
    link.setAttribute("download", filename);
    link.click();

    message.success("CSV file generated and downloaded!");
  };

  const historyColumns = [
    { title: "Date", dataIndex: "date", key: "date", width: 120 },
    {
      title: "Breakfast",
      dataIndex: "breakfast",
      key: "breakfast",
      align: "center" as const,
      width: 90,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Lunch",
      dataIndex: "lunch",
      key: "lunch",
      align: "center" as const,
      width: 90,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Dinner",
      dataIndex: "dinner",
      key: "dinner",
      align: "center" as const,
      width: 90,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Daily Total",
      dataIndex: "total",
      key: "total",
      align: "center" as const,
      width: 90,
    },
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          🗓️ Monthly Meal History (Manager View)
        </Title>
      }
      extra={
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownloadCSV}
          disabled={historyLoading || historyData.length === 0}
        >
          Download CSV
        </Button>
      }
      style={{ marginTop: 20 }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <Text strong>Select Member:</Text>
        <Select
          style={{ flexGrow: 1, minWidth: 150 }}
          placeholder="Select a member"
          options={memberOptions}
          value={selectedMemberId}
          onChange={setSelectedMemberId}
          disabled={historyLoading}
        />

        <Text strong>Select Date Range (DD-MM-YYYY):</Text>
        <RangePicker
          style={{ flexGrow: 1, minWidth: 200 }}
          value={dateRange}
          onChange={(dates) => setDateRange(dates as RangeValue)}
          format="DD-MM-YYYY"
          disabled={historyLoading}
        />
      </div>

      <Table
        dataSource={historyData}
        columns={historyColumns}
        rowKey="key"
        loading={historyLoading}
        pagination={{ pageSize: 10 }}
        bordered
        size="middle"
        scroll={{ x: 600 }}
      />

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Text strong style={{ fontSize: "16px" }}>
          Selected Range Total Meals:{" "}
        </Text>
        <Text strong type="success" style={{ fontSize: "16px" }}>
          {grandTotal}
        </Text>
      </div>
    </Card>
  );
};

const MealTracker: React.FC = () => {
  const { user, isManager } = useAuth();
  const { userMealData, loading, currentDate, messId, billingSummary } =
    useMealTracking();
  const [isUpdating, setIsUpdating] = useState(false);

  const currentUser = user as UserProfile | null;

  const formattedDate = new Date(currentDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (!currentUser || !messId)
    return (
      <Alert
        message="Mess Required"
        description="Please create or join a mess to track meals."
        type="warning"
        showIcon
        style={{ margin: "20px 0" }}
      />
    );

  const handleMealToggle = async (
    record: any,
    mealType: MealType,
    checked: boolean
  ) => {
    if (isUpdating) return;

    if (!isManager && record.user.uid !== currentUser.uid) {
      message.error("You can only update your own meals.");
      return;
    }

    setIsUpdating(true);

    try {
      const userId = record.user.uid;
      const existingMealId = record.meals.id;
      const userName = record.user.displayName || "Unknown User";

      if (existingMealId) {
        await updateMeal(existingMealId, {
          [mealType]: checked,
        } as Partial<Meal>);
        message.success(`${userName}'s ${mealType} updated!`);
      } else {
        const docRef = doc(collection(db, "meals"));

        await setDoc(docRef, {
          messId: messId,
          userId: userId,
          userName: userName,
          date: currentDate,
          breakfast: mealType === "breakfast" ? checked : false,
          lunch: mealType === "lunch" ? checked : false,
          dinner: mealType === "dinner" ? checked : false,
          createdAt: Timestamp.now(),
        } as Omit<Meal, "id">);

        message.success(`${userName}'s meal record created!`);
      }
    } catch (error) {
      console.error("Meal update failed:", error);
      message.error(`Failed to update meal: ${(error as Error).message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getDisabledState = (record: any) =>
    isUpdating || (!isManager && record.user.uid !== currentUser.uid);

  const columns = [
    {
      title: "Member",
      dataIndex: ["user", "displayName"],
      key: "displayName",
      width: 120,
      render: (_: string, record: any) => (
        <Text strong={record.user.uid === currentUser.uid}>
          {record.user.displayName}{" "}
          {record.user.uid === currentUser.uid && "(You)"}
        </Text>
      ),
    },
    {
      title: "Role",
      dataIndex: ["user", "role"],
      key: "role",
      width: 80,
      render: (role: string) => (
        <Text type={role === "manager" ? "warning" : "secondary"}>
          {role.toUpperCase()}
        </Text>
      ),
    },
    {
      title: "Breakfast",
      dataIndex: ["meals", "breakfast"],
      key: "breakfast",
      align: "center" as const,
      width: 80,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleMealToggle(record, "breakfast", e.target.checked)
          }
          disabled={getDisabledState(record)}
        />
      ),
    },
    {
      title: "Lunch",
      dataIndex: ["meals", "lunch"],
      key: "lunch",
      align: "center" as const,
      width: 70,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) => handleMealToggle(record, "lunch", e.target.checked)}
          disabled={getDisabledState(record)}
        />
      ),
    },
    {
      title: "Dinner",
      dataIndex: ["meals", "dinner"],
      key: "dinner",
      align: "center" as const,
      width: 70,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) => handleMealToggle(record, "dinner", e.target.checked)}
          disabled={getDisabledState(record)}
        />
      ),
    },
    {
      title: "Daily Total",
      key: "dailyTotal",
      align: "center" as const,
      width: 80,
      render: (_: any, record: any) => {
        const meals = record.meals;
        return (
          (meals.breakfast ? 1 : 0) +
          (meals.lunch ? 1 : 0) +
          (meals.dinner ? 1 : 0)
        );
      },
    },
    {
      title: "Monthly Total",
      dataIndex: "monthlyTotalMeals",
      key: "monthlyTotalMeals",
      align: "center" as const,
      width: 90,
      render: (value: number, record: any) => {
        if (isManager || record.user.uid === currentUser.uid) {
          return (
            <Text strong type="success">
              {value}
            </Text>
          );
        }
        return <Text type="secondary">N/A</Text>;
      },
    },
  ];

  const allMembersList = userMealData.map((data) => ({
    uid: data.user.uid,
    displayName: data.user.displayName,
  }));

  return (
    <>
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Daily Meal Tracker
          </Title>
        }
        extra={<Text type="secondary">Date: {formattedDate}</Text>}
        style={{ margin: "20px 0" }}
      >
        <Table
          dataSource={userMealData}
          columns={columns}
          rowKey={(record) => record.user.uid}
          loading={loading || isUpdating}
          pagination={false}
          bordered
          size="middle"
          scroll={{ x: 700 }}
        />
        {loading && (
          <Spin tip="Loading real-time data..." style={{ marginTop: 20 }} />
        )}
      </Card>

      <Divider />

      <MonthlyBillingSummary
        userMealData={userMealData}
        billingSummary={billingSummary}
        loading={loading}
      />

      <Divider />

      <MonthlyMealHistory
        messId={messId}
        allMembers={allMembersList}
        isManager={isManager}
      />
    </>
  );
};

export default MealTracker;
