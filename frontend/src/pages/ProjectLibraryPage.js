import React from 'react';
import './ProjectLibraryPage.css';

const ProjectLibraryPage = () => {
  const projects = ['Project 1', 'Project 2', 'Project 3']; // Replace with dynamic project data

  return (
    <div className="project-library-container">
      <h2>Your Project Library</h2>
      <ul className="project-list">
        {projects.map((project, index) => (
          <li key={index} className="project-item">
            {project}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectLibraryPage;
