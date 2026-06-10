import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../api";

function ReviewSection({ productId, productRating, totalReviews, ratingDistribution }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userReview, setUserReview] = useState(null); // Store user's review if exists
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // Get user info from token
  const getCurrentUserId = () => {
    try {
      if (!token) return null;
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/reviews/product/${productId}?sort=${sortBy}&page=${page}`
      );
      console.log("Fetched reviews:", response.data);
      
      setReviews(response.data.reviews || []);
      setTotalPages(response.data.pages || 1);
      
      // Check if current user has a review
      const userReviewData = response.data.userReview || null;
      console.log("User review from API:", userReviewData);
      console.log("Current user ID:", currentUserId);
      
      setUserReview(userReviewData);
      
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, sortBy, page]);

  // Reset form when editing/canceling
  const resetForm = () => {
    setFormData({ rating: 5, title: "", comment: "" });
    setShowReviewForm(false);
    setEditingReview(null);
    setError("");
  };

  // Handle form submit (add/edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("Please enter a review title");
      return;
    }
    
    if (!formData.comment.trim()) {
      setError("Please enter your review comment");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (editingReview) {
        // Edit review
        await axios.put(
          `${BASE_URL}/reviews/${editingReview}`,
          formData,
          { headers: { Authorization: token } }
        );
        setSuccess("Review updated successfully!");
      } else {
        // Add review
        await axios.post(
          `${BASE_URL}/reviews/product/${productId}`,
          formData,
          { headers: { Authorization: token } }
        );
        setSuccess("Review added successfully!");
      }
      
      // Reset form and refresh
      resetForm();
      fetchReviews(); // Refresh to get updated userReview status
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.response?.data?.message || "Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit click
  const handleEdit = async (reviewId) => {
    try {
      // Find the review in current reviews list
      const reviewToEdit = reviews.find(r => r._id === reviewId);
      if (reviewToEdit) {
        setFormData({
          rating: reviewToEdit.rating,
          title: reviewToEdit.title,
          comment: reviewToEdit.comment,
        });
        setEditingReview(reviewId);
        setShowReviewForm(true);
        setError("");
      }
    } catch (err) {
      console.error("Error setting up edit:", err);
    }
  };

  // Handle delete
  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    
    try {
      await axios.delete(`${BASE_URL}/reviews/${reviewId}`, {
        headers: { Authorization: token }
      });
      setSuccess("Review deleted successfully!");
      resetForm();
      fetchReviews(); // Refresh to update userReview status
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting review");
    }
  };

  // Handle helpful
  const handleHelpful = async (reviewId) => {
    if (!isLoggedIn) {
      alert("Please login to mark reviews as helpful");
      return;
    }
    
    try {
      await axios.post(
        `${BASE_URL}/reviews/${reviewId}/helpful`,
        {},
        { headers: { Authorization: token } }
      );
      fetchReviews();
    } catch (err) {
      console.error("Error marking helpful:", err);
    }
  };

  // Star rating input component
  const StarRatingInput = ({ rating, onChange }) => {
    return (
      <div style={{ display: "flex", gap: "5px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              background: "none",
              border: "none",
              fontSize: "28px",
              cursor: "pointer",
              color: star <= rating ? "#FFD700" : "#ddd",
              padding: "0 5px",
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", borderTop: "1px solid #eee", marginTop: "40px" }}>
      <h3 style={{ marginBottom: "20px", fontSize: "24px" }}>Customer Reviews</h3>
      
      {/* Rating Summary */}
      <div style={{ 
        display: "flex", 
        gap: "40px", 
        marginBottom: "30px", 
        padding: "20px", 
        backgroundColor: "#fafafa", 
        borderRadius: "8px",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", fontWeight: "bold" }}>{(productRating || 0).toFixed(1)}</div>
          <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "5px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} style={{ color: star <= Math.round(productRating || 0) ? "#FFD700" : "#ddd", fontSize: "20px" }}>
                ★
              </span>
            ))}
          </div>
          <div style={{ color: "#666", marginTop: "5px" }}>Based on {totalReviews || 0} reviews</div>
        </div>
        
        <div style={{ flex: 1, maxWidth: "300px" }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution?.[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ width: "30px" }}>{star} ★</span>
                <div style={{ flex: 1, height: "8px", backgroundColor: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                  <div 
                    style={{ 
                      width: `${percentage}%`, 
                      height: "100%", 
                      backgroundColor: "#FFD700" 
                    }} 
                  />
                </div>
                <span style={{ width: "40px", color: "#666" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔥 FIXED: Write Review Button - Only show if logged in AND no existing review AND form not showing */}
      {isLoggedIn && !userReview && !showReviewForm && (
        <button 
          onClick={() => setShowReviewForm(true)}
          style={{
            padding: "12px 24px",
            backgroundColor: "black",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "20px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          ✍️ Write a Review
        </button>
      )}

      {/* 🔥 FIXED: Show user's existing review with Edit button */}
      {isLoggedIn && userReview && !showReviewForm && (
        <div style={{ 
          padding: "15px", 
          backgroundColor: "#e8f5e9", 
          borderRadius: "8px", 
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div>
            <span style={{ fontWeight: "bold" }}>Your Review:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
              <div style={{ display: "flex", gap: "2px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{ color: star <= userReview.rating ? "#FFD700" : "#ddd", fontSize: "16px" }}>
                    ★
                  </span>
                ))}
              </div>
              <span style={{ color: "#666", fontSize: "14px" }}>
                Posted on {new Date(userReview.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => handleEdit(userReview.id)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Edit My Review
          </button>
        </div>
      )}

      {/* Review Form */}
      {(showReviewForm || editingReview) && (
        <div style={{ 
          border: "1px solid #ddd", 
          borderRadius: "8px", 
          padding: "25px", 
          marginBottom: "30px",
          backgroundColor: "#f9f9f9"
        }}>
          <h4 style={{ marginBottom: "20px", fontSize: "18px" }}>
            {editingReview ? "Edit Your Review" : "Write Your Review"}
          </h4>
          
          {error && (
            <div style={{ 
              color: "red", 
              marginBottom: "15px", 
              padding: "10px", 
              backgroundColor: "#ffebee", 
              borderRadius: "4px" 
            }}>
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div style={{ 
              color: "green", 
              marginBottom: "15px", 
              padding: "10px", 
              backgroundColor: "#e8f5e9", 
              borderRadius: "4px" 
            }}>
              ✅ {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>Your Rating *</label>
              <StarRatingInput 
                rating={formData.rating} 
                onChange={(rating) => setFormData({ ...formData, rating })} 
              />
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>Review Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Summarize your experience (e.g., Great product!)"
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
                maxLength={100}
              />
              <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                {formData.title.length}/100 characters
              </small>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>Your Review *</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Share your thoughts about this product..."
                rows={5}
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical"
                }}
                maxLength={1000}
              />
              <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                {formData.comment.length}/1000 characters
              </small>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "black",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  opacity: submitting ? 0.7 : 1,
                  fontWeight: "bold",
                }}
              >
                {submitting ? "Submitting..." : editingReview ? "Update Review" : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ccc",
                  color: "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <strong>Sort by: </strong>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: "8px 12px", marginLeft: "10px", borderRadius: "4px", border: "1px solid #ddd", cursor: "pointer" }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
          <div style={{ color: "#666" }}>{totalReviews || 0} total reviews</div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "#666",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px"
        }}>
          <p style={{ fontSize: "16px" }}>No reviews yet.</p>
          {isLoggedIn && !userReview && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                backgroundColor: "black",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Be the first to review!
            </button>
          )}
        </div>
      ) : (
        <div>
          {reviews.map((review) => {
            // Check if this review belongs to current user
            const isCurrentUserReview = currentUserId === review.userId;
            
            return (
              <div key={review._id} style={{ 
                borderBottom: "1px solid #eee", 
                padding: "20px 0",
                backgroundColor: isCurrentUserReview ? "#f9f9f9" : "transparent",
                borderRadius: isCurrentUserReview ? "8px" : "0",
                paddingLeft: isCurrentUserReview ? "15px" : "0",
                paddingRight: isCurrentUserReview ? "15px" : "0",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "5px", display: "flex", alignItems: "center", gap: "8px" }}>
                      {review.userName}
                      {isCurrentUserReview && (
                        <span style={{ 
                          fontSize: "11px", 
                          backgroundColor: "#4caf50", 
                          color: "white", 
                          padding: "2px 6px", 
                          borderRadius: "4px" 
                        }}>
                          You
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{ color: star <= review.rating ? "#FFD700" : "#ddd", fontSize: "14px" }}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ color: "#666", fontSize: "12px" }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <h4 style={{ margin: "10px 0 5px 0", fontSize: "16px" }}>{review.title}</h4>
                <p style={{ color: "#333", lineHeight: "1.5", marginBottom: "10px" }}>{review.comment}</p>
                
                <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleHelpful(review._id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      borderRadius: "4px",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f0f0f0"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  >
                    👍 Helpful ({review.helpful || 0})
                  </button>
                  
                  {isCurrentUserReview && (
                    <>
                      <button
                        onClick={() => handleEdit(review._id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#0066cc",
                          fontSize: "12px",
                          padding: "5px 10px",
                          borderRadius: "4px",
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#cc0000",
                          fontSize: "12px",
                          padding: "5px 10px",
                          borderRadius: "4px",
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                  
                  {review.verified && (
                    <span style={{ color: "green", fontSize: "11px" }}>✓ Verified Purchase</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "30px" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ 
                  padding: "8px 16px", 
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span style={{ padding: "8px 16px" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ 
                  padding: "8px 16px", 
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReviewSection;