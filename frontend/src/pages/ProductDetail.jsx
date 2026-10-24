import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function StarRating({ rating }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= Math.round(rating) ? "star filled" : "star"}
        >
          ★
        </span>
      ))}
      <span className="rating-value">{rating}</span>
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= (hovered || value) ? "star filled" : "star"}
          style={{ cursor: "pointer", fontSize: "1.5rem" }}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

const INITIAL_FORM = { author: "", rating: 0, comment: "" };

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3000/api/search", {
          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ productId: id }),
        });

        const productData = await res.json();
        const reviewsData = productData.product.reviews;

        setProduct(productData.product ?? null);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading)
    return (
      <div className="page empty-state">
        <p>Loading...</p>
      </div>
    );

  if (!product)
    return (
      <div className="page empty-state">
        <h2>Product not found</h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Back to Products
        </button>
      </div>
    );

  const inCart = cart.find((i) => i.id === product.id);

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!form.rating) return;
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          productId: product.id,
          date: new Date().toISOString(),
        }),
      });
      const newReview = await res.json();
      setReviews((prev) => [newReview, ...prev]);
      setForm(INITIAL_FORM);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews?.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
    : (product.rating ?? 0).toFixed(1);

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-layout">
        {/* Left — Product Info */}
        <div className="detail-left">
          <img src={product.image} alt={product.name} className="detail-img" />
          <div className="detail-info">
            <span className="product-category">{product.category}</span>
            <h1 className="detail-name">{product.name}</h1>
            <StarRating rating={product.rating ?? 0} />
            {product.description && (
              <p className="detail-description">{product.description}</p>
            )}
            <div className="detail-price">${product.price.toFixed(2)}</div>
            <div className="detail-actions">
              <button
                className={`btn ${added ? "btn-success" : "btn-primary"}`}
                onClick={handleAdd}
              >
                {added
                  ? "Added to Cart!"
                  : inCart
                    ? `In Cart (${inCart.qty}) — Add More`
                    : "Add to Cart"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate("/cart")}
              >
                View Cart
              </button>
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
              <span className="reviews-count">{reviews.length} reviews</span>
            </div>
          </div>

          {/* Review Form */}
          <form className="review-form" onSubmit={handleSubmitReview}>
            <h3>Leave a Review</h3>
            <input
              placeholder="Your name"
              value={form.author}
              onChange={(e) =>
                setForm((p) => ({ ...p, author: e.target.value }))
              }
              required
            />
            <div className="review-form-rating">
              <span>Rating</span>
              <StarPicker
                value={form.rating}
                onChange={(r) => setForm((p) => ({ ...p, rating: r }))}
              />
            </div>
            <textarea
              placeholder="Write your review…"
              value={form.comment}
              onChange={(e) =>
                setForm((p) => ({ ...p, comment: e.target.value }))
              }
              required
              rows={3}
            />
            <button
              type="submit"
              className={`btn ${submitted ? "btn-success" : "btn-primary"}`}
              disabled={submitting || !form.rating}
            >
              {submitted
                ? "Review Submitted!"
                : submitting
                  ? "Submitting…"
                  : "Submit Review"}
            </button>
          </form>

          {/* Reviews List */}
          <div className="reviews-list">
            {reviews.length === 0 && (
              <p className="no-results">No reviews yet. Be the first!</p>
            )}
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-top">
                  <div className="review-author-info">
                    <div className="review-avatar">{review.author[0]}</div>
                    <div>
                      <span className="review-author">{review.author}</span>
                      <span className="review-date">
                        {review.date
                          ? new Date(review.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
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
