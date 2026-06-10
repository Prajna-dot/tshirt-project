import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api";

// SAME SIZE FUNCTION
const getSizes = () => ["XS", "S", "M", "L", "XL"];

function Wishlist() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // FETCH
  useEffect(() => {
    axios
      .get(`${BASE_URL}/wishlist`, {
        headers: { Authorization: token },
      })
      .then((res) => setItems(res.data))
      .catch(() => setItems([]));
  }, [token]);

  // REMOVE
  const removeItem = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/wishlist/${id}`, {
        headers: { Authorization: token },
      });

      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {
      alert("Error removing item");
    }
  };

  // ADD TO CART WITH SIZE
  const addToCart = async (item) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const sizes = getSizes();

    let selectedSize = prompt(
      `Available sizes: ${sizes.join(", ")}\nEnter size:`
    );

    if (!selectedSize) {
      alert("Size is required");
      return;
    }

    selectedSize = selectedSize.trim().toUpperCase();

    if (!sizes.includes(selectedSize)) {
      alert(`Invalid size! Choose from: ${sizes.join(", ")}`);
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/cart`,
        {
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
          size: selectedSize,
        },
        { headers: { Authorization: token } }
      );

      alert(`Added to cart (${selectedSize}) 🛒`);
    } catch {
      alert("Error adding to cart");
    }
  };

  if (items.length === 0) {
    return (
      <div className="wishlist-container">
        <h2>My Wishlist ❤️</h2>
        <p className="empty">Your wishlist is empty.</p>
      </div>
    );
  }

  return (
  <div className="cart-container">
    <h2>My Wishlist ❤️</h2>

    {items.length === 0 ? (
      <p style={{ textAlign: "center" }}>Your wishlist is empty.</p>
    ) : (
      items.map((item) => (
        <div className="wishlist-row" key={item._id}>

          {/* IMAGE */}
          <img
            src={item.image}
            alt={item.name}
            className="wishlist-img"
            onClick={() => navigate(`/product/${item.productId}`)}
          />

          {/* DETAILS */}
          <div className="wishlist-info">
            <h3>{item.name}</h3>
            <p className="price">₹{item.price}</p>

            {/* BUTTONS */}
            <div className="wishlist-actions">

              <button
                className="btn-cart"
                onClick={() => addToCart(item)}
              >
                Add to Cart
              </button>

              <button
                className="btn-remove"
                onClick={() => removeItem(item._id)}
              >
                Remove
              </button>

            </div>
          </div>

        </div>
      ))
    )}
  </div>
);
}

export default Wishlist;