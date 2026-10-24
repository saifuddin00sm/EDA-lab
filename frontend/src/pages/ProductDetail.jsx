import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";

function StarRating({ rating }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "star filled" : "star"}>★</span>
      ))}
      <span className="rating-value">{rating}</span>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [added, setAdded] = useState(false);

  const product = products.find((p) => p.id === Number(id));

  if (!product)
    return (
      <div className="page empty-state">
        <h2>Product not found</h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>Back to Products</button>
      </div>
    );

  const inCart = cart.find((i) => i.id === product.id);

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  const avgRating = (
    product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
  ).toFixed(1);

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="detail-layout">
        {/* Left — Product Info */}
        <div className="detail-left">
          <img src={product.image} alt={product.name} className="detail-img" />
          <div className="detail-info">
            <span className="product-category">{product.category}</span>
            <h1 className="detail-name">{product.name}</h1>
            <StarRating rating={product.rating} />
            <p className="detail-description">{product.description}</p>
            <div className="detail-price">${product.price.toFixed(2)}</div>
            <div className="detail-actions">
              <button
                className={`btn ${added ? "btn-success" : "btn-primary"}`}
                onClick={handleAdd}
              >
                {added ? "Added to Cart!" : inCart ? `In Cart (${inCart.qty}) — Add More` : "Add to Cart"}
              </button>
              <button className="btn btn-outline" onClick={() => navigate("/cart")}>View Cart</button>
            </div>
          </div>
        </div>

        {/* Right — Reviews */}
        <div className="detail-right">
          <div className="reviews-header">
            <h2>Customer Reviews</h2>
            <div className="reviews-summary">
              <span className="reviews-avg">{avgRating}</span>
              <StarRating rating={Number(avgRating)} />
              <span className="reviews-count">{product.reviews.length} reviews</span>
            </div>
          </div>

          <div className="reviews-list">
            {product.reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-top">
                  <div className="review-author-info">
                    <div className="review-avatar">{review.author[0]}</div>
                    <div>
                      <span className="review-author">{review.author}</span>
                      <span className="review-date">{new Date(review.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
