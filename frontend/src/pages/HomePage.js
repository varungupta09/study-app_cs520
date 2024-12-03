import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <h1>Welcome to StudySphere</h1>
      <p>Your ultimate tool for organizing and managing study projects!</p>
      <div className="home-buttons">
        <Link to="/new-project" className="home-button">Create New Project</Link>
        <Link to="/project-library" className="home-button">View Project Library</Link>
      </div>
    </div>
  );
};

export default HomePage;
