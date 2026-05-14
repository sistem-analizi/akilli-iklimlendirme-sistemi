import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { observeAuth } from "./services/authService";
import { createAppRouter } from "./router";

function RootApp() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = observeAuth((currentUser) => {
      setUser(currentUser || null);
    });

    return () => unsubscribe();
  }, []);

  const router = useMemo(() => {
    if (user === undefined) return null;
    return createAppRouter(user);
  }, [user]);

  if (user === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f172a",
          color: "white",
          fontSize: "20px",
        }}
      >
        Yükleniyor...
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);