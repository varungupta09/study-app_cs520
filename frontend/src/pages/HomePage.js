import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">
          Welcome to <span className="highlight">StudySphere</span>
        </h1>
        <p className="home-subtitle">
          Organize, manage, and excel in your study projects effortlessly.
        </p>
        <div className="home-buttons">
          <Link to="/new-project" className="home-button primary">
            Create New Project
          </Link>
          <Link to="/project-library" className="home-button secondary">
            View Project Library
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;