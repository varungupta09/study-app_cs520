import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StudySetPage.css';

const StudySetPage = () => {
  const { studySetId } = useParams();
  const [studySet, setStudySet] = useState({ name: '', description: '', files: [] });
  const [originalStudySet, setOriginalStudySet] = useState(null);  // Store the original study set
  const [editMode, setEditMode] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Confirmation state
  const navigate = useNavigate();

  // Fetch study set details
  useEffect(() => {
    const fetchStudySet = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}`);
        if (!response.ok) throw new Error('Failed to fetch study set.');
        const data = await response.json();
        setStudySet(data);
        setOriginalStudySet(data);  // Store the original study set when fetched
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudySet();
  }, [studySetId]);

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setNewFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  // Handle study set updates
  const handleUpdateStudySet = async () => {
    if (!studySet) return;

    const formData = new FormData();
    formData.append('name', studySet.name);
    formData.append('description', studySet.description);

    newFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update study set.');

      // Fetch the latest study set data after the update
      const updatedStudySetResponse = await fetch(`http://localhost:5001/api/study-set/${studySetId}`);
      if (!updatedStudySetResponse.ok) throw new Error('Failed to fetch updated study set.');
      
      const updatedStudySet = await updatedStudySetResponse.json();
      setStudySet(updatedStudySet);  // Update state with the updated study set
      setEditMode(false);
      setNewFiles([]);  // Clear new files after saving
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle study set deletion
  const handleDeleteStudySet = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete study set.');

      alert('Study set deleted successfully.');
      navigate('/study-sets');
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle cancel and reset to original state
  const handleCancel = () => {
    setStudySet(originalStudySet);  // Reset to the original study set
    setEditMode(false);  // Exit edit mode
    setNewFiles([]);  // Clear new files
  };

  // Show delete confirmation dialog
  const confirmDelete = () => {
    setShowDeleteConfirmation(true);
  };

  // Handle confirmation (delete or cancel)
  const handleDeleteConfirmation = async (confirm) => {
    setShowDeleteConfirmation(false);
    if (confirm) {
      await handleDeleteStudySet();  // Proceed with deletion if confirmed
    }
  };

  // Render loading, error, and content based on states
  if (loading) return <p>Loading study set...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="study-set-page">
      <h1>{editMode ? 'Edit Study Set' : studySet.name}</h1>

      {editMode ? (
        <div className="edit-mode">
          <input
            type="text"
            value={studySet.name}
            onChange={(e) => setStudySet({ ...studySet, name: e.target.value })}
            placeholder="Study Set Name"
            className="input-field"
            aria-label="Study Set Name"
          />
          <textarea
            value={studySet.description}
            onChange={(e) => setStudySet({ ...studySet, description: e.target.value })}
            placeholder="Study Set Description"
            className="input-field"
            aria-label="Study Set Description"
          />
          
          {/* Display current files in edit mode */}
          <div className="current-files">
            <h3>Current Files</h3>
            {studySet.files && studySet.files.length > 0 ? (
              <ul>
                {studySet.files.map((file, index) => (
                  <li key={index}>
                    <a href={`http://localhost:5001/${file.file_path}`} target="_blank" rel="noopener noreferrer">
                      {file.file_path}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No files uploaded yet.</p>
            )}
          </div>

          <div className="file-upload">
            <label htmlFor="file-upload" className="custom-file-upload">
              Add Files
            </label>
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileChange}
              className="input-field file-input"
              accept=".txt,.doc,.docx,.ppt,.pptx"
              aria-label="Upload Files"
            />
            {/* Display newly selected files */}
            {newFiles.length > 0 && (
              <div className="new-files-preview">
                <h3>New Files</h3>
                <ul>
                  {newFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button onClick={handleUpdateStudySet} className="confirm-button">Save Changes</button>
          <button onClick={handleCancel} className="cancel-button">Cancel</button>
        </div>
      ) : (
        <div className="view-mode">
          <p>{studySet.description || 'No description available'}</p>
          <h3>Files</h3>
          <ul>
            {studySet.files && studySet.files.length > 0 ? (
              studySet.files.map((file, index) => (
                <li key={index}>
                  <a href={`http://localhost:5001/${file.file_path}`} target="_blank" rel="noopener noreferrer">
                    {file.file_path}
                  </a>
                </li>
              ))
            ) : (
              <p>No files uploaded yet.</p>
            )}
          </ul>
          <button onClick={() => setEditMode(true)} className="edit-button">Edit</button>
          <button onClick={confirmDelete} className="delete-button">Delete Study Set</button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirmation && (
        <div className="delete-confirmation">
          <p>Are you sure you want to delete this study set?</p>
          <button onClick={() => handleDeleteConfirmation(true)} className="confirm-delete">Yes</button>
          <button onClick={() => handleDeleteConfirmation(false)} className="cancel-delete">No</button>
        </div>
      )}

      {/* Return to Study Set Library Button (only visible in view mode) */}
      {!editMode && (
        <div className="return-button">
          <button onClick={() => navigate('/project-library')} className="return-to-library-button">
            Return to Study Set Library
          </button>
        </div>
      )}
    </div>
  );
};

export default StudySetPage;
