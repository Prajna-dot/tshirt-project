import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api";

// SIZE FUNCTION
const getSizes = (category) => {
  if (category === "kids") return ["XS", "S", "M"];
  if (category === "men") return ["S", "M", "L", "XL", "XXL"];
  if (category === "women") return ["XS", "S", "M", "L"];
  if (category === "unisex") return ["S", "M", "L", "XL"];
  return ["M", "L", "XL"];
};

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(null);

  const [category, setCategory] = useState("ALL");
  const [brand, setBrand] = useState("ALL");
  const [color, setColor] = useState("ALL"); // ✅ now used
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(5000);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // FETCH PRODUCTS
  useEffect(() => {
    axios.get(`${BASE_URL}/products`)
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // 🎨 GET COLORS DYNAMICALLY
  const allColors = ["ALL", ...new Set(
    products.map(p => p.color).filter(Boolean)
  )];

  // FILTER PRODUCTS
  const filteredProducts = products.filter(p => {
    if (!p) return false;
    return (
      (category === "ALL" || p.category === category) &&
      (brand === "ALL" || p.brand === brand) &&
      (color === "ALL" || p.color?.toLowerCase() === color.toLowerCase()) &&
      (p.price <= maxPrice) &&
      (p.name?.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // ❤️ ADD TO WISHLIST
  const addToWishlist = async (p) => {
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/wishlist`,
        {
          productId: p._id,
          name: p.name,
          price: p.price,
          image: p.images?.[0] || p.image || ""
        },
        { headers: { Authorization: token } }
      );

      alert("Added to wishlist ❤️");
    } catch {
      alert("Error adding wishlist");
    }
  };

  // 🛒 ADD TO CART
  const addToCart = async (p) => {
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    const sizes = getSizes(p.category);

    let selectedSize = prompt(
      `Available sizes: ${sizes.join(", ")}\nEnter size:`
    );

    if (!selectedSize) {
      alert("Size is required");
      return;
    }

    selectedSize = selectedSize.trim().toUpperCase();

    if (!sizes.includes(selectedSize)) {
      alert(`Invalid size!\nChoose from: ${sizes.join(", ")}`);
      return;
    }

    try {
      setLoadingBtn(p._id);

      await axios.post(
        `${BASE_URL}/cart`,
        {
          name: p.name,
          price: p.price,
          image: p.images?.[0] || p.image || "",
          quantity: 1,
          size: selectedSize
        },
        { headers: { Authorization: token } }
      );

      alert(`Added to cart (${selectedSize})`);
    } catch {
      alert("Error adding to cart");
    } finally {
      setLoadingBtn(null);
    }
  };

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading products...</h2>;
  }

  return (
    <div style={{ display: "flex" }}>

      {/* SIDEBAR */}
      <div className="sidebar">

        <h3>Search</h3>
        <input onChange={(e) => setSearch(e.target.value)} />

        <h3>Category</h3>
        {["ALL", "men", "women", "kids", "unisex"].map(c => (
          <div key={c}>
            <input
              type="radio"
              checked={category === c}
              onChange={() => setCategory(c)}
            />
            {c}
          </div>
        ))}

        <h3>Brand</h3>
        <select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="ALL">ALL</option>
          <option value="Nike">Nike</option>
          <option value="Adidas">Adidas</option>
          <option value="Puma">Puma</option>
        </select>

        <h3>Price</h3>
        <input
          type="range"
          min="100"
          max="5000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
        />
        <p>Up to ₹{maxPrice}</p>

        {/* 🎨 COLOR FILTER */}
        <h3>Colour</h3>
        <select value={color} onChange={(e) => setColor(e.target.value)}>
          {allColors.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

      </div>

      {/* PRODUCTS */}
      <div className="products">
        {filteredProducts.length === 0 ? (
          <h2>No products found</h2>
        ) : (
          filteredProducts.map(p => (
            <div
              key={p._id}
              className="card"
              onClick={() => navigate(`/product/${p._id}`)}
            >
              {/* ❤️ WISHLIST */}
             <div
           className="wishlist-icon"
           onClick={(e) => {
           e.stopPropagation();
          addToWishlist(p);
           }}
            >
          ❤️
          </div>
              {/* IMAGE */}
              <img
                src={p.images?.[0] || p.image || "https://via.placeholder.com/200"}
                alt={p.name}
              />

              {/* DETAILS */}
              <div className="card-content">
                <h3>{p.name}</h3>
                <p className="price">₹{p.price}</p>
              </div>

              {/* BUTTON */}
              <div className="card-actions">
                <button
                  className="btn-cart"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p);
                  }}
                  disabled={loadingBtn === p._id}
                >
                  {loadingBtn === p._id ? "Adding..." : "Add to Cart"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default Products;