import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { useLocation, useNavigate } from "react-router-dom";

const INPUT_STYLE = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #E2DDD8",
  borderRadius: "6px",
  fontSize: "14px",
  fontFamily: "Outfit, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  background: "white",
};

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli",
  "Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"
];

// ✅ Field is outside Checkout so it doesn't get re-created on every keystroke
const Field = ({ label, name, placeholder, type = "text", value, onChange, error }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={{ display: "block", fontSize: "12px", fontWeight: "600",
      textTransform: "uppercase", letterSpacing: "0.08em", color: "#888880", marginBottom: "6px" }}>
      {label}
    </label>
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        ...INPUT_STYLE,
        borderColor: error ? "#E84040" : "#E2DDD8",
      }}
    />
    {error && (
      <p style={{ color: "#E84040", fontSize: "12px", marginTop: "4px" }}>{error}</p>
    )}
  </div>
);

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const cart = location.state?.cart || [];
  const totalPrice = location.state?.total || 0;
  const token = localStorage.getItem("token");

  const [address, setAddress] = useState({
    fullName: "", phone: "", street: "", city: "", state: "", pincode: ""
  });
  const [errors, setErrors] = useState({});
  const [saveAddr, setSaveAddr] = useState(true);
  const [loadingAddr, setLoadingAddr] = useState(true);

  // 🔄 Load saved address on mount
  useEffect(() => {
    if (!token) return;
    axios.get(`${BASE_URL}/users/address`, { headers: { Authorization: token } })
      .then(res => {
        if (res.data?.fullName) setAddress(res.data);
      })
      .catch(() => {})
      .finally(() => setLoadingAddr(false));
  }, [token]);

  const handleChange = (e) => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  // ✅ Validate all fields
  const validate = () => {
    const newErrors = {};
    if (!address.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!address.phone.trim() || !/^\d{10}$/.test(address.phone.trim()))
      newErrors.phone = "Enter a valid 10-digit phone number";
    if (!address.street.trim()) newErrors.street = "Street address is required";
    if (!address.city.trim()) newErrors.city = "City is required";
    if (!address.state) newErrors.state = "Please select a state";
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.trim()))
      newErrors.pincode = "Enter a valid 6-digit pincode";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!token) { alert("Please login first"); return; }
    if (cart.length === 0) { alert("Cart is empty"); return; }
    if (!validate()) return;

    try {
      // 💾 Optionally save address for next time
      if (saveAddr) {
        await axios.put(`${BASE_URL}/users/address`, address, {
          headers: { Authorization: token }
        });
      }

      // 🧾 CREATE RAZORPAY ORDER
      const { data } = await axios.post(
  `${BASE_URL}/orders/create-order`,
  { amount: totalPrice },
  { headers: { Authorization: token } }
);

console.log("Razorpay key:", process.env.REACT_APP_RAZORPAY_KEY_ID);
console.log("Window Razorpay:", window.Razorpay);
console.log("Order data:", data);

      // 💳 Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "TeeStore",
        description: "Order Payment",
        order_id: data.id,
        prefill: {
          name: address.fullName,
          contact: address.phone,
        },

        handler: async function (response) {
          try {
            // 🔐 VERIFY PAYMENT
            const verify = await axios.post(
              `${BASE_URL}/orders/verify-payment`,
              response,
              { headers: { Authorization: token } }
            );

            if (verify.data.success) {
              // 🛒 PLACE ORDER with address
              await axios.post(
                `${BASE_URL}/orders`,
                {
                  products: cart,
                  total: totalPrice,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  shippingAddress: address,
                },
                { headers: { Authorization: token } }
              );

              // 🧹 CLEAR CART
              try {
                await axios.delete(`${BASE_URL}/cart/clear`, {
                  headers: { Authorization: token }
                });
              } catch (e) {}

              navigate("/orders");
            } else {
              alert("Payment Verification Failed");
            }
          } catch (err) {
            console.error("VERIFY ERROR:", err);
            alert("Error verifying payment");
          }
        },
        theme: { color: "#0A0A0A" },
      };

      const razor = new window.Razorpay(options);
      razor.open();

    } catch (error) {
      console.error("CHECKOUT ERROR:", error.response || error);
      alert("Payment failed to initiate");
    }
  };

  return (
    <div style={{ maxWidth: "960px", margin: "40px auto", padding: "0 24px",
      display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" }}>

      {/* ── LEFT: ADDRESS FORM ── */}
      <div style={{ flex: "1", minWidth: "300px", background: "white",
        borderRadius: "12px", padding: "32px", border: "1.5px solid #E2DDD8",
        boxShadow: "0 2px 8px rgba(10,10,10,0.06)" }}>

        <h2 style={{ fontSize: "24px", marginBottom: "24px", fontStyle: "italic" }}>
          Delivery Address
        </h2>

        {loadingAddr ? (
          <p style={{ color: "#888", fontSize: "14px" }}>Loading saved address...</p>
        ) : (
          <>
            <Field label="Full Name" name="fullName" placeholder="John Doe"
              value={address.fullName} onChange={handleChange} error={errors.fullName} />
            <Field label="Phone Number" name="phone" placeholder="10-digit mobile number" type="tel"
              value={address.phone} onChange={handleChange} error={errors.phone} />
            <Field label="Street Address" name="street" placeholder="House no., Street, Area"
              value={address.street} onChange={handleChange} error={errors.street} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Field label="City" name="city" placeholder="City"
                value={address.city} onChange={handleChange} error={errors.city} />
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600",
                  textTransform: "uppercase", letterSpacing: "0.08em", color: "#888880", marginBottom: "6px" }}>
                  State
                </label>
                <select
                  name="state"
                  value={address.state}
                  onChange={handleChange}
                  style={{ ...INPUT_STYLE, borderColor: errors.state ? "#E84040" : "#E2DDD8" }}
                >
                  <option value="">Select State</option>
                  {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && (
                  <p style={{ color: "#E84040", fontSize: "12px", marginTop: "4px" }}>{errors.state}</p>
                )}
              </div>
            </div>

            <Field label="Pincode" name="pincode" placeholder="6-digit pincode" type="tel"
              value={address.pincode} onChange={handleChange} error={errors.pincode} />

            {/* Save address checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: "8px",
              fontSize: "13px", color: "#888880", cursor: "pointer", marginTop: "4px" }}>
              <input
                type="checkbox"
                checked={saveAddr}
                onChange={e => setSaveAddr(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#F5A623" }}
              />
              Save this address for future orders
            </label>
          </>
        )}
      </div>

      {/* ── RIGHT: ORDER SUMMARY ── */}
      <div style={{ width: "320px", minWidth: "280px" }}>

        {/* Items */}
        <div style={{ background: "white", borderRadius: "12px", padding: "24px",
          border: "1.5px solid #E2DDD8", boxShadow: "0 2px 8px rgba(10,10,10,0.06)",
          marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "16px", fontStyle: "italic" }}>
            Order Summary ({cart.length} item{cart.length !== 1 ? "s" : ""})
          </h3>
          {cart.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center",
              marginBottom: "12px", paddingBottom: "12px",
              borderBottom: i < cart.length - 1 ? "1px solid #E2DDD8" : "none" }}>
              <img src={item.image} alt={item.name}
                style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px",
                  border: "1px solid #E2DDD8" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>{item.name}</p>
                <p style={{ fontSize: "12px", color: "#888" }}>Size: {item.size} · Qty: {item.quantity}</p>
              </div>
              <p style={{ fontSize: "14px", fontWeight: "700", color: "#2ECC71" }}>₹{item.price}</p>
            </div>
          ))}
        </div>

        {/* Total + Pay */}
        <div style={{ background: "white", borderRadius: "12px", padding: "24px",
          border: "1.5px solid #E2DDD8", boxShadow: "0 2px 8px rgba(10,10,10,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#888", fontSize: "14px" }}>Subtotal</span>
            <span style={{ fontSize: "14px" }}>₹{totalPrice}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <span style={{ color: "#888", fontSize: "14px" }}>Delivery</span>
            <span style={{ fontSize: "14px", color: "#2ECC71", fontWeight: "600" }}>FREE</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between",
            paddingTop: "16px", borderTop: "1.5px solid #E2DDD8", marginBottom: "20px" }}>
            <span style={{ fontWeight: "700", fontSize: "18px", fontStyle: "italic" }}>Total</span>
            <span style={{ fontWeight: "700", fontSize: "20px", color: "#2ECC71" }}>₹{totalPrice}</span>
          </div>

          <button
            onClick={handlePayment}
            style={{ width: "100%", padding: "14px", backgroundColor: "#0A0A0A",
              color: "white", border: "none", borderRadius: "6px", cursor: "pointer",
              fontSize: "14px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.08em" }}
            onMouseEnter={e => e.target.style.backgroundColor = "#F5A623"}
            onMouseLeave={e => e.target.style.backgroundColor = "#0A0A0A"}
          >
            Pay ₹{totalPrice}
          </button>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#888", marginTop: "12px" }}>
            🔒 Secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;