import { useState, useRef } from "react";
import api from "../api/axios";
import { useAuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

export default function CreateOrder() {
  const [form, setForm] = useState({
    order_id: "",
    product_name: "",
    customer_name: "",
    customer_contact: "",
    customer_address: "",
  });
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const toast = useRef(null);

  const submit = async () => {
    try {
      await api.post("/orders", { ...form, merchant_name: user.username });
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Order created",
        life: 3000,
      });
      navigate("/orders");
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to create order";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: message,
        life: 4000,
      });
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <h2>Create Order</h2>
      {Object.keys(form).map((k) => (
        <input
          key={k}
          placeholder={k.replace("_", " ")}
          onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        />
      ))}
      <button onClick={submit}>Create</button>
    </>
  );
}