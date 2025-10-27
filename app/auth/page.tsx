// app/auth/page.tsx
// This file is the Server Component wrapper containing the Suspense boundary.

import { Suspense } from "react";
import { Spin } from "antd";

// Import the client component you named 'Login'
import Login from "./Login";

// This is the default export for the /auth route.
export default function AuthPageWrapper() {
  return (
    // 🛑 The Suspense wrapper is mandatory because the 'Login' component
    // uses the client-only hook useSearchParams().
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
