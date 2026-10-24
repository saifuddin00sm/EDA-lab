import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, removeFromCart, updateQty, total } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0)
    return (
      <div className="page empty-state">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );

  return (
    <div className="page">
      <h1 className="page-title">Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-img" />
              <div className="cart-item-details">
                <h3>{item.name}</h3>
                <span className="product-category">{item.category}</span>
              </div>
              <div className="cart-item-controls">
                <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                <span className="qty-value">{item.qty}</span>
                <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
              </div>
              <span className="cart-item-price">${(item.price * item.qty).toFixed(2)}</span>
              <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>Free</span></div>
          <div className="summary-row total-row"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button className="btn btn-primary full-width" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
          <Link to="/" className="btn btn-outline full-width">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
