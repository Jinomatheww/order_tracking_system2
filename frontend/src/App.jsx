import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateOrder from "./pages/CreateOrder";
import OrderDetails from "./pages/OrderDetails";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ROLES } from "./utils/enums";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/orders" />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/create"
        element={
          <ProtectedRoute roles={[ROLES.MERCHANT]}>
            <CreateOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:order_id"
        element={
          <ProtectedRoute>
            <OrderDetails />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}