import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SensorHistoryPage from "./pages/SensorHistoryPage";
import DeviceHistoryPage from "./pages/DeviceHistoryPage";
import ReferenceHistoryPage from "./pages/ReferenceHistoryPage";
import ReferenceSettingsPage from "./pages/ReferenceSettingsPage";
import RegisterPage from "./pages/RegisterPage";

export const createAppRouter = (user) =>
  createBrowserRouter([
    {
      path: "/login",
      element: <LoginPage user={user} />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute user={user}>
          <Layout user={user} />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <DashboardPage />,
        },
        {
          path: "sensor-history",
          element: <SensorHistoryPage />,
        },
        {
          path: "device-history",
          element: <DeviceHistoryPage />,
        },
        {
          path: "reference-history",
          element: <ReferenceHistoryPage />,
        },
        {
          path: "reference-settings",
          element: <ReferenceSettingsPage />,
        },
        
      ],
    },
  ]);