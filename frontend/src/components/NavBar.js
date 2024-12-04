import React from "react";
import { Link } from "react-router-dom";
import "./NavBar.css"; // Styling file

const NavBar = ({ onLogout }) => {
  return (
    <nav className="navbar">
      <Link to="/home-page" className="navbar-logo-link"><div className="navbar-logo"/></Link>
      <div className="navbar-links">

        {/* Logout Button */}
        <button className="navbar-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
