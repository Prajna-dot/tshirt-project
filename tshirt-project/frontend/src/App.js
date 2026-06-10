import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaHeart } from "react-icons/fa";

import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Login from "./pages/Login";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";

import "./App.css";

// ✅ NAVBAR
function Navbar({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    onLogout();
    navigate("/login");
  };

  return (
    <nav className="navbar">

      {/* LEFT - Logo */}
      <div className="nav-left">
        <h2 className="logo" onClick={() => navigate("/")}>
          TeeStore
        </h2>
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <Link to="/">HOME</Link>
        <Link to="/products">PRODUCTS</Link>
        {isLoggedIn && <Link to="/orders">ORDERS</Link>}
      </div>

      {/* RIGHT */}
      <div className="nav-right">

        {/* ❤️ WISHLIST */}
        {isLoggedIn && (
          <Link to="/wishlist" className="cart-icon">
            <FaHeart />
          </Link>
        )}

        {/* 🛒 CART */}
        {isLoggedIn && (
          <Link to="/cart" className="cart-icon">
            <FaShoppingCart />
          </Link>
        )}

        {/* LOGIN / LOGOUT */}
        {!isLoggedIn ? (
          <Link to="/login">LOGIN</Link>
        ) : (
          <button onClick={logout}>LOGOUT</button>
        )}
      </div>

    </nav>
  );
}

// ✅ APP
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("token")
  );

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  return (
    <BrowserRouter>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />

      {/* ✅ PAGE WRAPPER */}
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Routes>
      </div>

      <Footer />
    </BrowserRouter>
  );
}

export default App;