"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Typography, Checkbox, message, Alert, Spin } from "antd";
import { useAuth } from "../../lib/auth-context";
import { useMealTracking } from "../../lib/hooks/useMealTracking";
import { updateMeal } from "../../lib/database";
import type { Meal, UserProfile } from "../../lib/types";

import { doc, setDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

const { Title, Text } = Typography;

const MealTracker: React.FC = () => {
  const { user, isManager } = useAuth();
  const { userMealData, loading, currentDate, messId } = useMealTracking();
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
    mealType: "breakfast" | "lunch" | "dinner",
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

  return (
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
      />
      {loading && (
        <Spin tip="Loading real-time data..." style={{ marginTop: 20 }} />
      )}
    </Card>
  );
};

export default MealTracker;
