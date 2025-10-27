import { Suspense } from "react";
import { Spin } from "antd";
import Login from "./Login";

export default function AuthPageWrapper() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <Spin size="large" />
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}
