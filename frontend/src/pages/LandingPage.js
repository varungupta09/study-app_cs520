import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // Import the CSS file for styling

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to StudySphere</h1>
          <p>
            Transform your class materials into personalized study tools like quizzes and study guides using AI.
            Track your progress and focus on what matters most.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn-primary">Get Started</Link>
            <Link to="/login" className="btn-secondary">Login</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Our Key Features</h2>
        <div className="feature-list">
          <div className="feature">
            <h3>Simplify Learning</h3>
            <p>Automatically create personalized study materials to reduce preparation time and enhance learning efficiency.</p>
          </div>
          <div className="feature">
            <h3>Enhanced Knowledge Retention</h3>
            <p>AI-powered analysis ensures you focus on the most relevant and important topics for better retention.</p>
          </div>
          <div className="feature">
            <h3>Tailored Study Methods</h3>
            <p>Whether you prefer quizzes, study guides, or summaries, your study materials will be customized to fit your learning style.</p>
          </div>
          <div className="feature">
            <h3>Track Your Progress</h3>
            <p>Monitor your learning performance and retention to ensure you are meeting your goals with StudySphere.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <h2>About StudySphere</h2>
        <p>
          StudySphere is a web app that uses artificial intelligence to help students transform their class materials—like notes and slides—into tailored study materials such as quizzes and study guides.
          By identifying knowledge gaps and focusing on key areas, we help students maximize their learning effectiveness and retention.
        </p>
      </section>

      {/* Call to Action Section */}
      <section className="cta">
        <h2>Start Learning Smarter Today</h2>
        <p>Join StudySphere and unlock personalized, AI-powered study materials that are tailored just for you.</p>
        <Link to="/signup" className="btn-primary">Sign Up Now</Link>
      </section>
    </div>
  );
};

export default LandingPage;
