import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { cart } = useCart();
  const { pathname } = useLocation();
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">ShopHub</Link>
      <div className="nav-links">
        <Link to="/" className={pathname === "/" ? "active" : ""}>Products</Link>
        <Link to="/cart" className={pathname === "/cart" ? "active" : ""}>
          Cart {itemCount > 0 && <span className="badge">{itemCount}</span>}
        </Link>
      </div>
    </nav>
  );
}
