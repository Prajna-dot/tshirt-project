import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { useNavigate } from "react-router-dom";

function Cart() {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingBtn, setLoadingBtn] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // 🔄 FETCH CART
  useEffect(() => {
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    axios.get(`${BASE_URL}/cart`, {
      headers: { Authorization: token }
    })
      .then(res => {
        setCart(res.data.items);          // FIXED
        setDiscount(res.data.discount);   // NEW
        setFinalTotal(res.data.finalTotal); // NEW
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load cart");
        setLoading(false);
      });

  }, [token, navigate]);

  // ➕ Increase quantity
  const increaseQty = (item) => {
    axios.put(`${BASE_URL}/cart/${item._id}`,
      { quantity: item.quantity + 1 },
      { headers: { Authorization: token } }
    )
      .then(() => window.location.reload());
  };

  // ➖ Decrease quantity
  const decreaseQty = (item) => {
    if (item.quantity === 1) return;

    axios.put(`${BASE_URL}/cart/${item._id}`,
      { quantity: item.quantity - 1 },
      { headers: { Authorization: token } }
    )
      .then(() => window.location.reload());
  };

  // ❌ Remove item
  const removeItem = (id) => {
    if (!window.confirm("Remove this item?")) return;

    axios.delete(`${BASE_URL}/cart/${id}`, {
      headers: { Authorization: token }
    })
      .then(() => window.location.reload())
      .catch(() => setError("Error removing item"));
  };

  // 💰 Total
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 🚀 GO TO CHECKOUT
  const goToCheckout = () => {
    if (cart.length === 0) return;

    setLoadingBtn(true);

    setTimeout(() => {
      navigate("/checkout", {
        state: {
          cart,
          total: totalAmount,
          discount,
          finalTotal
        }
      });
    }, 400);
  };

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading cart...</h2>;
  }

  return (
    <div className="cart-container">
      <h2>My Cart</h2>

      {error && (
        <p style={{ color: "red", textAlign: "center" }}>
          {error}
        </p>
      )}

      {!error && cart.length === 0 && (
        <p style={{ textAlign: "center" }}>Your cart is empty.</p>
      )}

      {/* CART ITEMS */}
      {cart.map(item => (
        <div className="cart-card" key={item._id}>
          <img src={item.image} alt={item.name} />

          <div className="cart-details">
            <h3>{item.name}</h3>
            <p className="price">₹{item.price}</p>
            <p><b>Size:</b> {item.size}</p>

            <div className="actions">
              <div className="qty">
                <button onClick={() => decreaseQty(item)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => increaseQty(item)}>+</button>
              </div>

              <button
                className="remove-btn"
                onClick={() => removeItem(item._id)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* SUMMARY */}
      {cart.length > 0 && (
        <div className="cart-summary">
          <h3>Total: ₹{totalAmount}</h3>
          <h3>Discount (10%): ₹{discount}</h3>
          <h3>Final Total: ₹{finalTotal}</h3>

          <button
            className="order-btn"
            onClick={goToCheckout}
            disabled={loadingBtn}
          >
            {loadingBtn ? "Processing..." : "Place Now"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;