import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { useEffect } from "react";

export default function Products() {
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState({});
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);


  function handleAdd(product) {
    addToCart(product);
    setAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(
      () => setAdded((prev) => ({ ...prev, [product.id]: false })),
      1000,
    );
  }
  useEffect(() => {
    async function getProduct() {
      setIsLoading(true);
      const res = await fetch(`http://localhost:3000/api/search?q=${query}`);

      const data = await res.json();
      setIsLoading(false);
      setProducts(data.products);
    }

    getProduct();
  }, [query]);

  if (isLoading)
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  return (
    <div className="page">
      <div className="products-header">
        <h1 className="page-title">Our Products</h1>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")}>
              ✕
            </button>
          )}
        </div>
      </div>
      {products.length === 0 && (
        <p className="no-results">
          No products found for &ldquo;{query}&rdquo;
        </p>
      )}
      <div className="product-grid">
        {products.length &&
          products.map((p) => {
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
                  <div className="card-actions">
                    <button
                      className={`btn ${added[p.id] ? "btn-success" : "btn-primary"}`}
                      onClick={() => handleAdd(p)}
                    >
                      {added[p.id]
                        ? "Added!"
                        : inCart
                          ? `In Cart (${inCart.qty})`
                          : "Add to Cart"}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
