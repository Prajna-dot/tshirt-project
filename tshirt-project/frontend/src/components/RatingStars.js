import React from "react";

function RatingStars({ rating, size = "medium", showNumber = false }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starSize = {
    small: "16px",
    medium: "20px",
    large: "24px",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{ display: "flex", gap: "2px" }}>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} style={{ color: "#FFD700", fontSize: starSize[size] }}>
            ★
          </span>
        ))}
        {hasHalfStar && (
          <span style={{ color: "#FFD700", fontSize: starSize[size] }}>½</span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} style={{ color: "#ddd", fontSize: starSize[size] }}>
            ★
          </span>
        ))}
      </div>
      {showNumber && (
        <span style={{ fontSize: "14px", color: "#666" }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default RatingStars;