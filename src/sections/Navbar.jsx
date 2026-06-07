import { Link } from "react-router-dom";

export default function Navbar({
  onSignInClick,
  user,
  onSignOutClick,
}) {
  return (
    <header className="topbar">
      {/* Logo */}
      <Link
        className="brand"
        to="/"
        aria-label="PropertyDNA"
      >
        <img
          src="/logo.png"
          alt="PropertyDNA Logo"
          className="brandLogo"
        />

        <span className="brandName">
          Property<b>DNA</b>
        </span>
      </Link>

      {/* Navigation */}
      <nav aria-label="Main navigation">
        <a className="active" href="#home">
          Home
        </a>

        <a href="#about">
          About
        </a>

        <a href="#works">
          How It Works
        </a>

        <a href="#contact">
          Contact
        </a>
      </nav>

      {/* User Section */}
      {user ? (
        <div className="navUserSection">

          {/* Username */}
          <Link
            to="/dashboard"
            className="userGreeting"
            style={{
              textDecoration: "none",
              cursor: "pointer",
              color: "inherit",
            }}
            title="Open Dashboard"
          >
            Hi,{" "}
            <b style={{ color: "#16a34a" }}>
              {user.name.split(" ")[0]}
            </b>
          </Link>

          {/* Dashboard Button */}
          <Link
            to="/dashboard"
            className="signInBtn"
            style={{
              textDecoration: "none",
              marginLeft: "12px",
              marginRight: "8px",
              padding: "10px 16px",
            }}
          >
            Dashboard
          </Link>

          {/* Logout */}
          <button
            className="signInBtn"
            onClick={onSignOutClick}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          className="signInBtn"
          onClick={onSignInClick}
        >
          Sign In
        </button>
      )}

      {/* Predictor */}
      <a
        className="try"
        href="#predictor"
      >
        Try Predictor
      </a>
    </header>
  );
}
