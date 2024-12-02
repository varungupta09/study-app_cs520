import React, { useState } from 'react';
import './NewProjectPage.css';

const NewProjectPage = () => {
  const [projectName, setProjectName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // handle form submission logic
    console.log('Project Created:', projectName);
  };

  return (
    <div className="create-project-container">
      <h2>Create a New Study Project</h2>
      <form className="create-project-form" onSubmit={handleSubmit}>
        <label htmlFor="project-name">Project Name:</label>
        <input
          type="text"
          id="project-name"
          placeholder="Enter project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />
        <button type="submit" className="submit-button">Create Project</button>
      </form>
    </div>
  );
};

export default NewProjectPage;
