import { useState, useRef } from 'react';
import api from '../api/axios';
import { useAuthContext } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const toast = useRef(null);

  const submit = async () => {
    try {
      const res = await api.post('/login', { username, password });
      login(res.data);
      navigate('/orders');
    } catch (err) {
      const message = err.response?.data?.detail || "Login failed";
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

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea, #764ba2)"
        }}
      >
        <Card
          title="Order Tracking Login"
          subTitle="Sign in to continue"
          style={{
            width: "380px",
            borderRadius: "16px",
            boxShadow: "0 15px 30px rgba(0,0,0,0.2)"
          }}
        >
          <div className="p-fluid">
            <span className="p-input-icon-left" style={{ marginBottom: "16px" }}>
             
              <InputText
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </span>

            <span className="p-input-icon-left" style={{ marginBottom: "20px" }}>
              <i className="pi pi-lock" />
              <Password
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                toggleMask
                feedback={false}
              />
            </span>

            <Button
              label="Login"
              icon="pi pi-sign-in"
              onClick={submit}
              className="p-button-lg"
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none"
              }}
            />

            <Divider />

            <p style={{ textAlign: "center", color: "#888", fontSize: "13px" }}>
              Secure access for Merchants & Operations Team
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}