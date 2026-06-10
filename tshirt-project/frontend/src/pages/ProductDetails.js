import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import BASE_URL from "../api";
import ReviewSection from "../components/ReviewSection";

// SIZE FUNCTION
const getSizes = (category) => {
  if (category === "kids") return ["XS", "S", "M"];
  if (category === "men") return ["S", "M", "L", "XL", "XXL"];
  if (category === "women") return ["XS", "S", "M", "L"];
  if (category === "unisex") return ["S", "M", "L", "XL"];
  return ["M", "L", "XL"];
};

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [cartError, setCartError] = useState("");

  const token = localStorage.getItem("token");

  // 🔄 FETCH PRODUCT
  useEffect(() => {
    console.log("Fetching product with ID:", id);
    axios
      .get(`${BASE_URL}/products/${id}`)
      .then((res) => {
        console.log("Product data received:", res.data);
        setProduct(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Error fetching product:", err);
        setFetchError(true);
        setLoading(false);
      });
  }, [id]);

  // 🛒 ADD TO CART
  const addToCart = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    setSizeError(false);
    setCartError("");
    setLoadingBtn(true);

    const images = product.images?.length
      ? product.images
      : [product.image || "https://via.placeholder.com/500"];

    axios
      .post(
        `${BASE_URL}/cart`,
        {
          name: product.name,
          price: product.price,
          image: images[selectedImage],
          quantity,
          size: selectedSize,
        },
        { headers: { Authorization: token } }
      )
      .then(() => {
        setAdded(true);
        setSelectedSize("");
        setQuantity(1);
        setTimeout(() => setAdded(false), 2000);
        setLoadingBtn(false);
      })
      .catch(() => {
        setCartError("Error adding to cart. Please try again.");
        setLoadingBtn(false);
      });
  };

  // ⚡ BUY NOW
  const buyNow = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    setSizeError(false);

    const images = product.images?.length
      ? product.images
      : [product.image || "https://via.placeholder.com/500"];

    navigate("/checkout", {
      state: {
        cart: [{
          name: product.name,
          price: product.price,
          image: images[selectedImage],
          quantity,
          size: selectedSize,
        }],
        total: product.price * quantity,
      }
    });
  };

  // 🔄 LOADING SCREEN
  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading product...</h2>;
  }

  // ✅ PRODUCT NOT FOUND
  if (fetchError || !product) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "60px" }}>
        Product not found.
      </h2>
    );
  }

  const images = product.images?.length
    ? product.images
    : [product.image || "https://via.placeholder.com/500"];

  // Safe values for ratings (in case product doesn't have these fields yet)
  const averageRating = product.averageRating || 0;
  const totalReviews = product.totalReviews || 0;
  const ratingDistribution = product.ratingDistribution || {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

  return (
    <>
      <div className="product-container">
        <div className="product-wrapper">
          {/* IMAGE */}
          <div style={{ position: "relative" }}>

  {/* ❤️ WISHLIST */}
  <div
    onClick={async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        await axios.post(
          `${BASE_URL}/wishlist`,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            image: images[selectedImage],
          },
          { headers: { Authorization: token } }
        );

        alert("Added to wishlist ❤️");
      } catch {
        alert("Error adding wishlist");
      }
    }}
    style={{
      position: "absolute",
      top: "10px",
      right: "10px",
      fontSize: "24px",
      cursor: "pointer",
      zIndex: 10,
      background: "white",
      borderRadius: "50%",
      padding: "6px"
    }}
  >
    ❤️
  </div>

  {/* IMAGE */}
  <img
    src={images[selectedImage]}
    alt={product.name}
    className="product-image"
  />

            {/* THUMBNAILS */}
            <div className="thumbnail-row">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="thumb"
                  style={{
                    width: "60px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: selectedImage === i ? "2px solid black" : "none",
                  }}
                  onClick={() => setSelectedImage(i)}
                />
              ))}
            </div>
          </div>

          {/* DETAILS */}
          <div className="product-details">
            <h2>{product.name}</h2>
            
            {/* ⭐ RATING DISPLAY - Only show if there are reviews */}
            {(averageRating > 0 || totalReviews > 0) && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        color: star <= Math.round(averageRating) ? "#FFD700" : "#ddd",
                        fontSize: "18px",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span style={{ fontWeight: "bold" }}>{averageRating.toFixed(1)}</span>
                <span style={{ color: "#666" }}>({totalReviews} reviews)</span>
              </div>
            )}
            
            {/* Show message if no reviews yet */}
            {totalReviews === 0 && (
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>
                No reviews yet. Be the first to review!
              </p>
            )}
            
            <p className="price">₹{product.price}</p>
            <p>
              <b>Brand:</b> {product.brand}
            </p>

            {product.color && (
              <p>
                <b>Color:</b> {product.color}
              </p>
            )}

            {/* SIZE */}
            <p>
              <b>Select Size:</b>
            </p>
            <div className="size-buttons">
              {getSizes(product.category).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  style={{
                    background: selectedSize === size ? "black" : "white",
                    color: selectedSize === size ? "white" : "black",
                    border: sizeError
                      ? "1px solid red"
                      : "1px solid black",
                    padding: "8px 12px",
                    margin: "0 5px 5px 0",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* ✅ INLINE SIZE ERROR */}
            {sizeError && (
              <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
                Please select a size
              </p>
            )}

            {/* QUANTITY */}
            <p>
              <b>Quantity:</b>
            </p>
            <div className="qty" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                -
              </button>
              <span style={{ fontSize: "18px", minWidth: "30px", textAlign: "center" }}>{quantity}</span>
              <button 
                onClick={() => setQuantity((q) => q + 1)}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>

            {/* ADD TO CART */}
            <button
              onClick={addToCart}
              disabled={loadingBtn}
              style={{
                marginTop: "15px",
                padding: "12px 24px",
                background: added ? "green" : "black",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loadingBtn ? "not-allowed" : "pointer",
                opacity: loadingBtn ? 0.7 : 1,
                width: "100%",
                fontWeight: "bold",
              }}
            >
              {loadingBtn ? "Adding..." : added ? "Added!" : "Add to Cart"}
            </button>

            {/* ⚡ BUY NOW */}
            <button
              className="btn-buynow-detail"
              onClick={buyNow}
            >
               Buy Now
            </button>

            {/* ✅ INLINE CART ERROR */}
            {cartError && (
              <p style={{ color: "red", fontSize: "13px", marginTop: "8px" }}>
                {cartError}
              </p>
            )}

            {/* DESCRIPTION */}
            {product.description && (
              <p style={{ marginTop: "20px", lineHeight: "1.5", color: "#555" }}>
                {product.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ REVIEWS SECTION - Always show, even if no reviews yet */}
      <ReviewSection 
        productId={id}
        productRating={averageRating}
        totalReviews={totalReviews}
        ratingDistribution={ratingDistribution}
      />
    </>
  );
}

export default ProductDetails;