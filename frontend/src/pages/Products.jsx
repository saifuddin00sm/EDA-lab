import { useState } from "react";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";

export default function Products() {
  const { addToCart, cart } = useCart();
  const [added, setAdded] = useState({});

  function handleAdd(product) {
    addToCart(product);
    setAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product.id]: false })), 1000);
  }

  return (
    <div className="page">
      <h1 className="page-title">Our Products</h1>
      <div className="product-grid">
        {products.map((p) => {
          const inCart = cart.find((i) => i.id === p.id);
          return (
            <div key={p.id} className="product-card">
              <img src={p.image} alt={p.name} className="product-img" />
              <div className="product-info">
                <span className="product-category">{p.category}</span>
                <h3 className="product-name">{p.name}</h3>
                <div className="product-footer">
                  <span className="product-price">${p.price.toFixed(2)}</span>
                  <span className="product-rating">★ {p.rating}</span>
                </div>
                <button
                  className={`btn ${added[p.id] ? "btn-success" : "btn-primary"}`}
                  onClick={() => handleAdd(p)}
                >
                  {added[p.id] ? "Added!" : inCart ? `In Cart (${inCart.qty})` : "Add to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
