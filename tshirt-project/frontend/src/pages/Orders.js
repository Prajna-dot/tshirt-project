import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { useNavigate } from "react-router-dom";
import OrderTracker from "../components/OrderTracker"; // ✅ Import tracker component

function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // ✅ For tracking modal

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    axios.get(`${BASE_URL}/orders`, {
      headers: { Authorization: token }
    })
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.log("ORDER ERROR:", err);
        setError("Failed to fetch orders");
        setLoading(false);
      });

  }, [token, navigate]);

  // ✅ Handle cancel order
  const handleCancelOrder = async (orderId, reason) => {
    if (!reason) return;
    
    try {
      await axios.post(
        `${BASE_URL}/orders/${orderId}/cancel`,
        { reason },
        { headers: { Authorization: token } }
      );
      alert("Order cancelled successfully");
      // Refresh orders list
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || "Error cancelling order");
    }
  };

  // 🔄 LOADING UI
  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading orders...</h2>;
  }

  return (
    <>
      <div className="orders-container">
        <h2>My Orders</h2>

        {/* ❗ ERROR UI */}
        {error && (
          <p style={{ color: "red", textAlign: "center" }}>
            {error}
          </p>
        )}

        {/* EMPTY STATE */}
        {!error && orders.length === 0 && (
          <p style={{ textAlign: "center" }}>No orders yet.</p>
        )}

        {/* ORDERS LIST */}
        {orders.map(order => (
          <div className="order-card" key={order._id}>
            
            {/* ✅ ORDER HEADER WITH STATUS BADGE */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "15px",
              paddingBottom: "10px",
              borderBottom: "1px solid #eee"
            }}>
              <div>
                <strong>Order #{order._id.slice(-8)}</strong>
                <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  backgroundColor: order.status === 'delivered' ? '#4CAF50' : 
                                 order.status === 'cancelled' ? '#f44336' :
                                 order.status === 'shipped' ? '#2196F3' : 
                                 order.status === 'confirmed' ? '#FF9800' : '#9E9E9E',
                  color: "white"
                }}>
                  {order.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>

            {/* ITEMS */}
            <div className="order-items">
              {order.products?.map((item, index) => (
                <div className="order-item" key={index}>
                  <img src={item.image} alt={item.name} />

                  <div className="order-info">
                    <h4>{item.name}</h4>
                    <p>₹{item.price}</p>

                    {/* EXTRA INFO */}
                    {item.size && <p>Size: {item.size}</p>}
                    {item.quantity && <p>Qty: {item.quantity}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ ORDER FOOTER WITH ACTIONS */}
            <div style={{ 
              marginTop: "15px", 
              paddingTop: "15px", 
              borderTop: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              <div className="order-total">
                <h3>Total: ₹{order.total}</h3>
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                {/* ✅ TRACK ORDER BUTTON */}
                <button
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#1976D2"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#2196F3"}
                >
                  📍 Track Order
                </button>

                {/* ✅ CANCEL BUTTON (only for cancellable orders) */}
                {['pending', 'confirmed', 'processing'].includes(order.status) && (
                  <button
                    onClick={() => {
                      const reason = prompt("Why do you want to cancel this order?");
                      if (reason) handleCancelOrder(order._id, reason);
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#d32f2f"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "#f44336"}
                  >
                    ❌ Cancel Order
                  </button>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* ✅ ORDER TRACKER MODAL */}
      {selectedOrder && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          backdropFilter: "blur(3px)"
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "85vh",
            overflow: "auto",
            padding: "0",
            position: "relative",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            animation: "slideIn 0.3s ease"
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "20px 25px",
              borderBottom: "2px solid #f0f0f0",
              backgroundColor: "#fafafa",
              borderRadius: "12px 12px 0 0"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px" }}>
                  Track Order
                </h3>
                <p style={{ margin: "5px 0 0", fontSize: "13px", color: "#666" }}>
                  Order #{selectedOrder._id.slice(-8)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "28px",
                  cursor: "pointer",
                  color: "#999",
                  padding: "0 8px",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.color = "#333"}
                onMouseLeave={(e) => e.target.style.color = "#999"}
              >
                ×
              </button>
            </div>
            
            {/* Modal Body with OrderTracker */}
            <div style={{ padding: "25px" }}>
              <OrderTracker orderId={selectedOrder._id} />
            </div>
            
            {/* Modal Footer */}
            <div style={{ 
              padding: "15px 25px",
              borderTop: "1px solid #f0f0f0",
              backgroundColor: "#fafafa",
              borderRadius: "0 0 12px 12px"
            }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#333",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#555"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#333"}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Add keyframe animation for modal */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(-30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export default Orders;