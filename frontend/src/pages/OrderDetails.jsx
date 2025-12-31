import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { getOrderStatuses } from "../api/orders.api";
import StatusHistory from "../components/StatusHistory.jsx";
import { useAuthContext } from "../auth/AuthContext";
import { Toast } from "primereact/toast";
import { Dropdown} from "primereact/dropdown";
import { Button } from "primereact/button";
import { connectOrderSocket } from "../api/websocket";

export default function OrderDetails() {
  const { order_id } = useParams();
  const { user } = useAuthContext();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [statuses, setStatuses] = useState([]);
  const toast = useRef(null);

  const loadData = async () => {
    const res = await api.get(`/orders/${order_id}`);
    setOrder(res.data);
    const histRes = await api.get(`/orders/${order_id}/history`);
    setHistory(histRes.data.history || []);
  };

  useEffect(() => {
    getOrderStatuses().then((res) =>
      setStatuses(res.data.statuses.map((s) => ({ label: s, value: s })))
    );
    loadData();
  }, [order_id]);

  useEffect(() => {
    const ws = connectOrderSocket(localStorage.getItem("token"), (msg) => {
      if (msg.order_id === order_id) {
        setOrder((prev) => ({ ...prev, current_status: msg.current_status, updated_at: msg.timestamp }));
        loadData(); 
      }
    });
    return () => ws.close();
  }, [order_id]);

  const updateStatus = async () => {
    try {
      const res = await api.put(`/orders/${order_id}/status`, {
        new_status: newStatus,
      });
      toast.current.show({
        severity: "success",
        summary: "Status Updated",
        detail: `Order moved to ${res.data.new_status}`,
        life: 3000,
      });
      loadData();
    } catch (err) {
      const message = err.response?.data?.detail || "Update Failed";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: message,
        life: 4000,
      });
    }
  };

  return order ? (
    <>
      <Toast ref={toast} />
      <h2>Order {order.order_id}</h2>
      <p>Product: {order.product_name}</p>
      <p>Customer: {order.customer_name}</p>
      <p>Contact: {order.customer_contact}</p>
      <p>Address: {order.customer_address}</p>
      <p>Merchant: {order.merchant_name}</p>
      <p>Status: {order.current_status}</p>
      <p>Created: {new Date(order.created_at).toLocaleString()}</p>
      <p>Updated: {new Date(order.updated_at).toLocaleString()}</p>

      {user.role === "operations_team" && (
        <>
          <Dropdown
            value={newStatus}
            options={statuses}
            onChange={(e) => setNewStatus(e.value)}
            placeholder="Select New Status"
          />
          <Button label="Update" onClick={updateStatus} />
        </>
      )}

      <StatusHistory history={history} />
    </>
  ) : null;
}