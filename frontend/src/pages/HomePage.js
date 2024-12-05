import React from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link along with useNavigate
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  const redirectToCreateStudySet = () => {
    navigate("/project-library", { state: { openModal: true } });
  };

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
          <button
            className="home-button primary"
            onClick={redirectToCreateStudySet}
          >
            Create New Project
          </button>
            <Link to="/project-library" className="home-button secondary">
              View Project Library
            </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
