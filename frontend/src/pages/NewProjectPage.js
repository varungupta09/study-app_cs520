import React, { useState } from "react";
import "./NewProjectPage.css";

const NewProjectPage = () => {
  const [projectName, setProjectName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // handle form submission logic
    console.log("Project Created:", projectName);
  };

  return (
    <div className="create-project-container">
      <div className="create-project-form">
        <h2>Create a New Study Project</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            id="project-name"
            placeholder="Enter project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
          <button type="submit">Create Project</button>
        </form>
      </div>
    </div>
  );
};

export default NewProjectPage;