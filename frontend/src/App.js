import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StudySetsPage from './pages/StudySetsPage';
import StudySetPage from './pages/StudySetPage';
import NewProjectPage from './pages/NewProjectPage';
import ProjectLibraryPage from './pages/ProjectLibraryPage';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // useNavigate hook

  // Check if the user is logged in when the app starts
  useEffect(() => {
    const token = localStorage.getItem('authToken'); // Assuming you store a token in localStorage
    if (token) {
      setIsAuthenticated(true); // Set to true if a token is present
    }
  }, []);

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove the auth token from localStorage
    setIsAuthenticated(false); // Update the state to reflect the user is logged out
    navigate('/'); // Redirect to the Landing Page
  };

  return (
    <div>
      {/* Only show the NavBar if the user is authenticated */}
      {isAuthenticated && <NavBar onLogout={handleLogout} />}

      <Routes>
        {/* Default route - Landing Page only if user is not authenticated */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/home-page" /> : <LandingPage />}
        />

        {/* If the user is not authenticated, show the LoginPage */}
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/signup" element={<SignupPage />} />
          </>
        ) : (
          <>
            {/* Protected Routes for authenticated users */}
            <Route path="/home-page" element={<HomePage />} />
            <Route path="/new-project" element={<NewProjectPage />} />
            <Route path="/project-libraryyyyyy" element={<ProjectLibraryPage />} />
            <Route path="/project-library" element={<StudySetsPage />} /> 
            <Route path="/study-sets/:studySetId" element={<StudySetPage />} />
            {/* Redirect to HomePage if authenticated */}
            <Route path="*" element={<Navigate to="/home-page" />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;
