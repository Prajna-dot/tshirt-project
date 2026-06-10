const Order = require("../models/Order");

// 🛒 PLACE ORDER (UPDATED with status management)
exports.placeOrder = async (req, res) => {
  try {
    const { products, total, paymentId, orderId, shippingAddress } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const newOrder = new Order({
      user: req.user.id,
      products,
      total,
      paymentId,
      razorpayOrderId: orderId,
      paymentStatus: "paid",
      shippingAddress: shippingAddress || {},
      
      // ✅ NEW: Initialize order status
      status: 'confirmed',
      statusHistory: [{
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Order placed and payment confirmed'
      }],
      
      // Calculate estimated delivery (7-10 days from now)
      estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    });

    await newOrder.save();

    res.status(201).json({ 
      message: "Order placed successfully", 
      order: newOrder 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error placing order" });
  }
};

// 📦 GET USER ORDERS (UPDATED with sorting)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 }); // Show newest first
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// ✅ NEW: GET SINGLE ORDER DETAILS
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order" });
  }
};

// ✅ NEW: CANCEL ORDER
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findOne({ 
      _id: orderId, 
      user: req.user.id 
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    const hoursSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        message: `Order cannot be cancelled. Current status: ${order.status}` 
      });
    }
    
    if (hoursSinceOrder > 1) {
      return res.status(400).json({ 
        message: "Order can only be cancelled within 1 hour of placement" 
      });
    }
    
    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason || 'No reason provided';
    order.statusHistory.push({ 
      status: 'cancelled', 
      timestamp: new Date(),
      note: `Cancelled by user. Reason: ${reason || 'Not specified'}`
    });
    
    await order.save();
    
    res.json({ 
      message: "Order cancelled successfully", 
      order 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error cancelling order" });
  }
};

// ✅ NEW: TRACK ORDER
exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ 
      _id: orderId, 
      user: req.user.id 
    }).select('status statusHistory trackingNumber trackingUrl estimatedDelivery');
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({
      status: order.status,
      history: order.statusHistory,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery
    });
  } catch (err) {
    res.status(500).json({ message: "Error tracking order" });
  }
};

// ✅ NEW: UPDATE ORDER STATUS (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, trackingUrl, note } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    order.status = status;
    
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;
    
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}`
    });
    
    await order.save();
    
    res.json({ 
      message: "Order status updated", 
      order 
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating order status" });
  }
};

// ✅ NEW: REQUEST RETURN
exports.requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, items } = req.body;
    
    const order = await Order.findOne({ 
      _id: orderId, 
      user: req.user.id 
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        message: "Order must be delivered to request a return" 
      });
    }
    
    // Check if within return window (7 days after delivery)
    const deliveredEvent = order.statusHistory.find(h => h.status === 'delivered');
    if (deliveredEvent) {
      const daysSinceDelivery = (Date.now() - new Date(deliveredEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDelivery > 7) {
        return res.status(400).json({ 
          message: "Return window has expired (7 days)" 
        });
      }
    }
    
    // Add return request to order (you might want to create a separate Return model)
    order.returnRequested = {
      status: 'pending',
      reason,
      items: items || order.products,
      requestedAt: new Date()
    };
    
    await order.save();
    
    res.json({ 
      message: "Return request submitted successfully", 
      order 
    });
  } catch (err) {
    res.status(500).json({ message: "Error requesting return" });
  }
};