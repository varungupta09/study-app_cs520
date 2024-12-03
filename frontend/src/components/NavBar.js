import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css'; // Styling file

const NavBar = ({ onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>StudySphere</h1>
      </div>
      <div className="navbar-links">
        {/* Home Link */}
        <Link to="/home-page" className="navbar-link">Home</Link>
        {/* Logout Button */}
        <button className="navbar-button" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;
