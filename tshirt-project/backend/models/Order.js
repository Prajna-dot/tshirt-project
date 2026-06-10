const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  products: Array,
  total: Number,

  // ✅ Shipping address saved with each order
  shippingAddress: {
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },

  paymentId: { type: String },
  razorpayOrderId: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid"], 
    default: "pending" 
  },

  // ✅ Order status management fields
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  
  trackingNumber: String,
  trackingUrl: String,
  estimatedDelivery: Date,
  
  cancellationRequested: { type: Boolean, default: false },
  cancellationReason: String,
  
  refundStatus: {
    type: String,
    enum: ['none', 'processing', 'completed', 'failed'],
    default: 'none'
  },
  refundAmount: Number,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Add method to update status
orderSchema.methods.updateStatus = function(newStatus, note = '') {
  this.status = newStatus;
  this.statusHistory.push({ 
    status: newStatus, 
    timestamp: new Date(),
    note: note 
  });
  return this.save();
};

// ✅ Add method to check if order can be cancelled
orderSchema.methods.canCancel = function() {
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  const hoursSinceOrder = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  return cancellableStatuses.includes(this.status) && hoursSinceOrder <= 1;
};

// ✅ Add method to check if return is eligible (within 7 days of delivery)
orderSchema.methods.canReturn = function() {
  if (this.status !== 'delivered') return false;
  
  const deliveredEvent = this.statusHistory.find(h => h.status === 'delivered');
  if (!deliveredEvent) return false;
  
  const daysSinceDelivery = (Date.now() - deliveredEvent.timestamp) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery <= 7;
};

module.exports = mongoose.model("Order", orderSchema);