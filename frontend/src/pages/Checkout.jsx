import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const initialForm = { name: "", email: "", address: "", city: "", zip: "", card: "", expiry: "", cvv: "" };

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [placed, setPlaced] = useState(false);

  if (cart.length === 0 && !placed) {
    navigate("/");
    return null;
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setPlaced(true);
    clearCart();
  }

  if (placed)
    return (
      <div className="page empty-state">
        <div className="success-icon">✓</div>
        <h2>Order Placed Successfully!</h2>
        <p>Thank you, {form.name}. A confirmation will be sent to {form.email}.</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>Back to Shop</button>
      </div>
    );

  return (
    <div className="page">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Information</h2>
          <div className="form-row">
            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          </div>
          <input name="address" placeholder="Street Address" value={form.address} onChange={handleChange} required />
          <div className="form-row">
            <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
            <input name="zip" placeholder="ZIP Code" value={form.zip} onChange={handleChange} required />
          </div>

          <h2>Payment Details</h2>
          <input name="card" placeholder="Card Number" maxLength={19} value={form.card} onChange={handleChange} required />
          <div className="form-row">
            <input name="expiry" placeholder="MM / YY" maxLength={5} value={form.expiry} onChange={handleChange} required />
            <input name="cvv" placeholder="CVV" maxLength={3} value={form.cvv} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary full-width">
            Place Order — ${total.toFixed(2)}
          </button>
        </form>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          {cart.map((item) => (
            <div key={item.id} className="summary-item">
              <span>{item.name} × {item.qty}</span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-row total-row"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
