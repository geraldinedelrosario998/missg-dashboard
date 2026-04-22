"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type Order = {
  id: number;
  username: string;
  code: string;
  price: number;
  qty: number;
  created_at: string;
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [view, setView] = useState<"live" | "sales" | "stocks">("live");

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, [userEmail]);

  async function checkSession() {
    const { data, error } = await supabase.auth.getUser();

    if (!error && data.user) {
      setUserEmail(data.user.email || null);
    }

    setLoading(false);
  }

  async function handleLogin() {
  try {
    setLoggingIn(true);
    setErrorText("Trying to log in...");

    const loginPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Login timed out after 10 seconds")), 10000)
    );

    const result: any = await Promise.race([loginPromise, timeoutPromise]);

    if (result.error) {
      setErrorText(result.error.message);
      return;
    }

    setUserEmail(result.data.user?.email || null);
    setErrorText("");
  } catch (err: any) {
    setErrorText(err.message || "Login failed");
  } finally {
    setLoggingIn(false);
  }
}      

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setOrders([]);
    setEmail("");
    setPassword("");
    setErrorText("");
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("id, username, code, price, qty, created_at")
      .order("created_at", { ascending: false });

    if (!error) {
      setOrders(data || []);
    }
    const user = await supabase.auth.getUser();

const { data: stockData, error: stockError } = await supabase
  .from("stock_entries")
  .select("*")
  .eq("user_id", user.data.user?.id)
  .order("id", { ascending: false });

if (!stockError) {
  setStockEntries(stockData || []);
}
}
const salesFilteredOrders = orders.filter((o) => {
  if (!filterDate) return true;

  const orderDate = new Date(o.created_at);
  const year = orderDate.getFullYear();
  const month = String(orderDate.getMonth() + 1).padStart(2, "0");
  const day = String(orderDate.getDate()).padStart(2, "0");
  const localDate = `${year}-${month}-${day}`;

  return localDate === filterDate;
});
  const totalQty = salesFilteredOrders.reduce((sum, o) => sum + o.qty, 0);
const totalSales = salesFilteredOrders.reduce((sum, o) => sum + o.price, 0);
const groupedSales = salesFilteredOrders.reduce((acc, order) => {
  const dateKey = new Date(order.created_at).toLocaleDateString();

  if (!acc[dateKey]) {
    acc[dateKey] = [];
  }

  acc[dateKey].push(order);
  return acc;
}, {} as Record<string, Order[]>);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f0f0f",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f0f0f",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            background: "#171717",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Dashboard Login</h2>

          <form
  onSubmit={(e) => {
  e.preventDefault();
  e.stopPropagation(); // 👈 ADD THIS LINE
  handleLogin();
}}
>
  <input
  type="email"
  placeholder="Email"
  value={email}
  autoCapitalize="none"
  autoCorrect="off"
  autoComplete="email"
  onChange={(e) => setEmail(e.target.value)}
  style={{
    width: "100%",
    padding: "12px 14px",
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#0f0f0f",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
  }}
/>

  <input
  type="password"
  placeholder="Password"
  value={password}
  autoCapitalize="none"
  autoCorrect="off"
  autoComplete="current-password"
  onChange={(e) => setPassword(e.target.value)}
  style={{
    width: "100%",
    padding: "12px 14px",
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#0f0f0f",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
  }}
/>

  {errorText ? (
    <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 10 }}>
      {errorText}
    </div>
  ) : null}

  <button
  type="button"
  onClick={handleLogin}
    disabled={loggingIn}
    style={{
      width: "100%",
      padding: "12px 14px",
      borderRadius: 8,
      border: "none",
      background: "#d61f45",
      color: "white",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    {loggingIn ? "Logging in..." : "Login"}
  </button>
</form>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        color: "white",
        background: "#0f0f0f",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    }}
  >
    <h2 style={{ margin: 0, fontSize: 20 }}>📊 Miss G Dashboard</h2>

    <button
      onClick={handleLogout}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "none",
        background: "#2a2a2a",
        color: "white",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  </div>

  <div
    style={{
      display: "flex",
      gap: 8,
      overflowX: "auto",
    }}
  >
    <button
      onClick={() => setView("live")}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: "none",
        background: view === "live" ? "#d61f45" : "#232323",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      Live
    </button>

    <button
      onClick={() => setView("sales")}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: "none",
        background: view === "sales" ? "#d61f45" : "#232323",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      Sales Log
    </button>

    <button
      onClick={() => setView("stocks")}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: "none",
        background: view === "stocks" ? "#d61f45" : "#232323",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      Stocks
    </button>
  </div>
</div>

      {view === "live" && (
        <div>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                style={{
                  background: "#1e1e1e",
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 8,
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                  @{o.username}
                </div>
                <div style={{ marginBottom: 4 }}>Code: {o.code}</div>
                <div style={{ marginBottom: 4 }}>
                  ₱{o.price} x {o.qty}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  {new Date(o.created_at).toLocaleDateString()}{" "}
                  {new Date(o.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
{view === "sales" && (
  <div style={{ marginTop: 20, height: "calc(100vh - 120px)", overflowY: "auto" }}>
    <h3>Sales Log</h3>

<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
  
  <input
    type="date"
    value={filterDate}
    onChange={(e) => setFilterDate(e.target.value)}
    onClick={(e) => {
      if ((e.currentTarget as HTMLInputElement).showPicker) {
        (e.currentTarget as HTMLInputElement).showPicker();
      }
    }}
    style={{
      padding: "8px 10px",
      borderRadius: 6,
      border: "1px solid #333",
      background: "#0f0f0f",
      color: "white",
      cursor: "pointer",
    }}
  />

  <button
    onClick={() => setFilterDate("")}
    style={{
      padding: "8px 12px",
      borderRadius: 6,
      border: "1px solid #2a2a2a",
      background: "#1a1a1a",
      color: "#aaa",
      cursor: "pointer",
    }}
  >
    Clear
  </button>

</div>

    {salesFilteredOrders.length === 0 ? (
      <p style={{ color: "#888" }}>No records found.</p>
    ) : (
      Object.entries(groupedSales).map(([date, orders]: [string, Order[]]) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <div
  style={{
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 6,
    color: "#ff4d6d",
    fontSize: 13,
  }}
>
  {date}
</div>

          <div
  style={{
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    background: "#121212",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  }}
>
            <div
  style={{
    display: "grid",
    gridTemplateColumns: "70px 1fr 90px 60px",
    background: "#101010",
    padding: "12px 12px",
    fontSize: 11,
    borderBottom: "1px solid #2a2a2a",
    color: "#777",
    fontWeight: "600",
  }}
>
  <div>Time</div>
  <div>User</div>
  <div>Price</div>
  <div>Qty</div>
</div>

{orders.map((o: Order) => (
  <div
    key={o.id}
    style={{
      display: "grid",
      gridTemplateColumns: "70px 1fr 90px 60px",
      padding: "14px 12px",
      borderBottom: "1px solid #1e1e1e",
      fontSize: 14,
      background: "#151515",
    }}
  >
<div style={{ fontSize: 12, color: "#aaa" }}>
  {new Date(o.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}
</div>
                <div>@{o.username}</div>
                <div>₱{o.price}</div>
                <div>{o.qty}</div>
              </div>
            ))}
          </div>
        </div>
      ))
    )}

    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: "#000",
        padding: "14px 16px",
        borderTop: "2px solid #d61f45",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        zIndex: 20,
        marginTop: 12,
        fontWeight: "bold",
      }}
    >
      <div>Total Qty: {totalQty}</div>
      <div>Total Sales: ₱{totalSales.toLocaleString()}</div>
    </div>
  </div>
)}

{view === "stocks" && (
  <div style={{ marginTop: 20 }}>
    <h3>Stocks</h3>

    {stockEntries.length === 0 ? (
      <p style={{ color: "#888" }}>No stock entries yet.</p>
    ) : (
      stockEntries.map((s) => (
        <div
          key={s.id}
          style={{
            background: "#1e1e1e",
            padding: 12,
            marginBottom: 8,
            borderRadius: 8,
          }}
        >
          <div><b>{s.product || "No product"}</b></div>
          <div>Qty: {s.quantity}</div>
          <div>₱{s.amount}</div>
          <div style={{ fontSize: 12, color: "#999" }}>
            {s.date}
          </div>
        </div>
      ))
    )}
  </div>
)}
    </div>
  );
}