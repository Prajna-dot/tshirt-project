// components/OrderTracker.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../api';

const OrderTracker = ({ orderId }) => {
  const [tracking, setTracking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  
  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStep = tracking ? statusSteps.indexOf(tracking.status) : -1;
  
  const cancelOrder = async () => {
    const reason = prompt("Why do you want to cancel this order?");
    if (!reason) return;
    
    setCancelling(true);
    try {
      await axios.post(
        `${BASE_URL}/orders/${orderId}/cancel`,
        { reason },
        { headers: { Authorization: localStorage.getItem('token') } }
      );
      alert("Order cancelled successfully");
      // Refresh tracking
      fetchTracking();
    } catch (err) {
      alert(err.response?.data?.message || "Error cancelling order");
    }
    setCancelling(false);
  };
  
  const fetchTracking = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/orders/${orderId}/track`, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setTracking(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  useEffect(() => {
    fetchTracking();
  }, [orderId]);
  
  if (!tracking) return <div>Loading tracking...</div>;
  
  return (
    <div className="order-tracker">
      <h4>Order Status</h4>
      
      {/* Progress Steps */}
      <div className="tracking-steps">
        {statusSteps.map((step, idx) => (
          <div key={step} className={`step ${idx <= currentStep ? 'completed' : ''}`}>
            <div className="step-dot" />
            <div className="step-label">
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Current Status Details */}
      <div className="status-details">
        <p><strong>Current Status:</strong> {tracking.status}</p>
        {tracking.estimatedDelivery && (
          <p><strong>Estimated Delivery:</strong> {new Date(tracking.estimatedDelivery).toLocaleDateString()}</p>
        )}
        {tracking.trackingNumber && (
          <p>
            <strong>Tracking Number:</strong> 
            {tracking.trackingUrl ? (
              <a href={tracking.trackingUrl} target="_blank"> {tracking.trackingNumber}</a>
            ) : (
              ` ${tracking.trackingNumber}`
            )}
          </p>
        )}
      </div>
      
      {/* Status History Timeline */}
      <div className="status-history">
        <h5>Order Timeline</h5>
        {tracking.history?.map((event, idx) => (
          <div key={idx} className="timeline-event">
            <div className="event-time">
              {new Date(event.timestamp).toLocaleString()}
            </div>
            <div className="event-status">
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </div>
            {event.note && <div className="event-note">{event.note}</div>}
          </div>
        ))}
      </div>
      
      {/* Cancel Button (if applicable) */}
      {['pending', 'confirmed', 'processing'].includes(tracking.status) && (
        <button 
          onClick={cancelOrder} 
          disabled={cancelling}
          className="cancel-order-btn"
        >
          {cancelling ? "Cancelling..." : "Cancel Order"}
        </button>
      )}
    </div>
  );
};

export default OrderTracker;