import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { getOrderStatuses, getMerchants } from "../api/orders.api";
import OrderTable from "../components/OrderTable";
import { connectOrderSocket } from "../api/websocket";
import { useAuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [merchants, setMerchants] = useState([]);

  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const toast = useRef(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState({
    order_id: "",
    product_name: "",
    customer_name: "",
    customer_contact: "",
    customer_address: "",
    merchant_name: String(user?.username || ""),
  });

  const loadOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
    } catch (err) {
      console.error("Failed to load orders", err);
      setOrders([]);
    }
  };

  
  useEffect(() => {
    getOrderStatuses().then((res) =>
      setStatuses(
        Array.isArray(res.data?.statuses)
          ? res.data.statuses.map((s) => ({ label: s, value: s }))
          : []
      )
    );

    if (user.role === "operations_team") {
      getMerchants()
        .then((res) =>
          setMerchants(
            Array.isArray(res.data?.merchants)
              ? res.data.merchants.map((m) => ({ label: m, value: m }))
              : []
          )
        )
        .catch((err) => console.error(err));
    }

    loadOrders();
  }, [user.role]);

  
  useEffect(() => {
    const ws = connectOrderSocket(localStorage.getItem("token"), (msg) => {
      if (
        !msg ||
        typeof msg.order_id !== "string" ||
        typeof msg.current_status !== "string"
      ) {
        console.error("Invalid websocket payload ignored:", msg);
        return;
      }

      setOrders((prev) => {
        if (!Array.isArray(prev)) return [];

        const exists = prev.some((o) => o.order_id === msg.order_id);

        if (exists) {
          return prev.map((o) =>
            o.order_id === msg.order_id
              ? {
                  ...o,
                  current_status: msg.current_status,
                  updated_at: msg.timestamp || o.updated_at,
                }
              : o
          );
        }

        return [...prev, msg];
      });
    });

    return () => ws.close();
  }, []);

  
  const handleCreateOrder = async () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const contactRegex = /^[0-9]{7,15}$/;

    if (!nameRegex.test(form.customer_name)) {
      toast.current.show({
        severity: "error",
        summary: "Invalid Input",
        detail: "Customer name must contain only letters",
        life: 3000,
      });
      return;
    }

    if (!contactRegex.test(form.customer_contact)) {
      toast.current.show({
        severity: "error",
        summary: "Invalid Input",
        detail: "Customer contact must contain only numbers",
        life: 3000,
      });
      return;
    }

    if (
      !form.order_id ||
      !form.product_name ||
      !form.customer_address
    ) {
      toast.current.show({
        severity: "error",
        summary: "Missing Fields",
        detail: "All fields are required",
        life: 3000,
      });
      return;
    }

    const payload = {
      ...form,
      merchant_name: String(user.username),
    };

    try {
      await api.post("/orders", payload);

      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Order created successfully",
        life: 3000,
      });

      setDialogVisible(false);
      setForm({
        order_id: "",
        product_name: "",
        customer_name: "",
        customer_contact: "",
        customer_address: "",
        merchant_name: String(user.username),
      });
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.detail || "Failed to create order",
        life: 4000,
      });
    }
  };

  
  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <Toast ref={toast} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Orders</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <span>
            {user.username} ({user.role})
          </span>
          <Button
            label="Logout"
            className="p-button-text p-button-danger"
            onClick={handleLogout}
          />
        </div>
      </div>

      <OrderTable
        orders={orders}
        statuses={statuses}
        merchants={merchants}
        isOps={user.role === "operations_team"}
      />

      {user.role === "merchant" && (
        <Button
          icon="pi pi-plus"
          className="p-button-rounded p-button-success"
          onClick={() => setDialogVisible(true)}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            width: "60px",
            height: "60px",
          }}
        />
      )}

      <Dialog
        header="Create New Order"
        visible={dialogVisible}
        footer={
          <>
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => setDialogVisible(false)}
            />
            <Button label="Create" onClick={handleCreateOrder} />
          </>
        }
        onHide={() => setDialogVisible(false)}
      >
        {[
          ["order_id", "Order ID"],
          ["product_name", "Product Name"],
          ["customer_name", "Customer Name"],
          ["customer_contact", "Customer Contact"],
          ["customer_address", "Customer Address"],
        ].map(([key, label]) => (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <label>{label}</label>
            <InputText
              value={form[key]}
              onChange={(e) =>
                setForm({ ...form, [key]: e.target.value })
              }
            />
          </div>
        ))}
      </Dialog>
    </>
  );
}


















































































// // src/pages/Dashboard.jsx
// import { useEffect, useState, useRef } from "react";
// import api from "../api/axios";
// import { getOrderStatuses, getMerchants } from "../api/orders.api";
// import OrderTable from "../components/OrderTable";
// import { connectOrderSocket } from "../api/websocket";
// import { useAuthContext } from "../auth/AuthContext";
// import { useNavigate } from "react-router-dom";
// import { Button } from "primereact/button";
// import { Dialog } from "primereact/dialog";
// import { InputText } from "primereact/inputtext";
// import { Toast } from "primereact/toast";

// export default function Dashboard() {
//   const [orders, setOrders] = useState([]);
//   const [statuses, setStatuses] = useState([]);
//   const [merchants, setMerchants] = useState([]);

//   const { user, logout } = useAuthContext();
//   const navigate = useNavigate();
//   const toast = useRef(null);

//   const [dialogVisible, setDialogVisible] = useState(false);
//   const [form, setForm] = useState({
//     order_id: "",
//     product_name: "",
//     customer_name: "",
//     customer_contact: "",
//     customer_address: "",
//     merchant_name: String(user?.username || ""),
//   });

//   /* ---------------- LOAD ORDERS ---------------- */
//   const loadOrders = async () => {
//     try {
//       const res = await api.get("/orders");
//       setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
//     } catch (err) {
//       console.error("Failed to load orders", err);
//       setOrders([]);
//     }
//   };

//   /* ---------------- INITIAL LOAD ---------------- */
//   useEffect(() => {
//     getOrderStatuses().then((res) =>
//       setStatuses(
//         Array.isArray(res.data?.statuses)
//           ? res.data.statuses.map((s) => ({ label: s, value: s }))
//           : []
//       )
//     );

//     if (user.role === "operations_team") {
//       getMerchants()
//         .then((res) =>
//           setMerchants(
//             Array.isArray(res.data?.merchants)
//               ? res.data.merchants.map((m) => ({ label: m, value: m }))
//               : []
//           )
//         )
//         .catch((err) => console.error(err));
//     }

//     loadOrders();
//   }, [user.role]);

//   /* ---------------- LIVE WEBSOCKET UPDATES ---------------- */
//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     const ws = connectOrderSocket(token, (msg) => {
//       // --------- HARD PAYLOAD VALIDATION ---------
//       if (
//         !msg ||
//         typeof msg.order_id !== "string" ||
//         typeof msg.current_status !== "string" ||
//         !msg.timestamp
//       ) {
//         console.warn("Invalid WS payload ignored:", msg);
//         return;
//       }

//       // --------- AUTHORIZATION CHECK ---------
//       if (
//         user.role === "merchant" &&
//         msg.merchant_name !== user.username
//       ) {
//         return;
//       }

//       setOrders((prev) => {
//         if (!Array.isArray(prev)) return [];

//         const exists = prev.find(
//           (o) => o.order_id === msg.order_id
//         );

//         // --------- UPDATE EXISTING ORDER ---------
//         if (exists) {
//           return prev.map((o) =>
//             o.order_id === msg.order_id
//               ? {
//                   ...o,
//                   current_status: msg.current_status,
//                   updated_at: msg.timestamp,
//                   metadata: msg.metadata || o.metadata,
//                 }
//               : o
//           );
//         }

//         // --------- ADD NEW ORDER ---------
//         return [
//           {
//             order_id: msg.order_id,
//             merchant_name: msg.merchant_name,
//             current_status: msg.current_status,
//             created_at: msg.timestamp,
//             updated_at: msg.timestamp,
//             customer_contact:
//               msg.metadata?.customer_contact || "-",
//             metadata: msg.metadata || {},
//           },
//           ...prev,
//         ];
//       });
//     });

//     return () => ws.close();
//   }, [user.role, user.username]);

//   /* ---------------- CREATE ORDER ---------------- */
//   const handleCreateOrder = async () => {
//     const nameRegex = /^[A-Za-z\s]+$/;
//     const contactRegex = /^[0-9]{7,15}$/;

//     if (!nameRegex.test(form.customer_name)) {
//       toast.current.show({
//         severity: "error",
//         summary: "Invalid Input",
//         detail: "Customer name must contain only letters",
//         life: 3000,
//       });
//       return;
//     }

//     if (!contactRegex.test(form.customer_contact)) {
//       toast.current.show({
//         severity: "error",
//         summary: "Invalid Input",
//         detail: "Customer contact must contain only numbers",
//         life: 3000,
//       });
//       return;
//     }

//     if (
//       !form.order_id ||
//       !form.product_name ||
//       !form.customer_address
//     ) {
//       toast.current.show({
//         severity: "error",
//         summary: "Missing Fields",
//         detail: "All fields are required",
//         life: 3000,
//       });
//       return;
//     }

//     try {
//       await api.post("/orders", {
//         ...form,
//         merchant_name: String(user.username),
//       });

//       toast.current.show({
//         severity: "success",
//         summary: "Success",
//         detail: "Order created successfully",
//         life: 3000,
//       });

//       setDialogVisible(false);
//       setForm({
//         order_id: "",
//         product_name: "",
//         customer_name: "",
//         customer_contact: "",
//         customer_address: "",
//         merchant_name: String(user.username),
//       });
//     } catch (err) {
//       toast.current.show({
//         severity: "error",
//         summary: "Error",
//         detail:
//           err.response?.data?.detail || "Failed to create order",
//         life: 4000,
//       });
//     }
//   };

//   /* ---------------- LOGOUT ---------------- */
//   const handleLogout = () => {
//     logout();
//     localStorage.clear();
//     navigate("/login");
//   };

//   return (
//     <>
//       <Toast ref={toast} />

//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: "20px",
//         }}
//       >
//         <h2>Orders</h2>
//         <div style={{ display: "flex", gap: "12px" }}>
//           <span>
//             {user.username} ({user.role})
//           </span>
//           <Button
//             label="Logout"
//             className="p-button-text p-button-danger"
//             onClick={handleLogout}
//           />
//         </div>
//       </div>

//       <OrderTable
//         orders={orders}
//         statuses={statuses}
//         merchants={merchants}
//         isOps={user.role === "operations_team"}
//       />

//       {user.role === "merchant" && (
//         <Button
//           icon="pi pi-plus"
//           className="p-button-rounded p-button-success"
//           onClick={() => setDialogVisible(true)}
//           style={{
//             position: "fixed",
//             bottom: "30px",
//             right: "30px",
//             width: "60px",
//             height: "60px",
//           }}
//         />
//       )}

//       <Dialog
//         header="Create New Order"
//         visible={dialogVisible}
//         footer={
//           <>
//             <Button
//               label="Cancel"
//               className="p-button-text"
//               onClick={() => setDialogVisible(false)}
//             />
//             <Button label="Create" onClick={handleCreateOrder} />
//           </>
//         }
//         onHide={() => setDialogVisible(false)}
//       >
//         {[
//           ["order_id", "Order ID"],
//           ["product_name", "Product Name"],
//           ["customer_name", "Customer Name"],
//           ["customer_contact", "Customer Contact"],
//           ["customer_address", "Customer Address"],
//         ].map(([key, label]) => (
//           <div key={key} style={{ marginBottom: "1rem" }}>
//             <label>{label}</label>
//             <InputText
//               value={form[key]}
//               onChange={(e) =>
//                 setForm({ ...form, [key]: e.target.value })
//               }
//             />
//           </div>
//         ))}
//       </Dialog>
//     </>
//   );
// }
