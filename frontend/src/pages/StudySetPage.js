import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GrFormPreviousLink } from "react-icons/gr"; // Import the back link icon
import { MdEdit, MdDelete } from "react-icons/md"; // Import the edit and delete icons
import { AiOutlineShareAlt } from "react-icons/ai"; // Import share icon
import ChatComponent from "../components/Chat.js"; // Import Chat Component
import "./StudySetPage.css";

const StudySetPage = () => {
  const userId = localStorage.getItem('userId');
  const { studySetId } = useParams();
  const [studySet, setStudySet] = useState({
    name: "",
    description: "",
    files: [],
  });
  const [originalStudySet, setOriginalStudySet] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [username, setUsername] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudySet = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/study-set/${studySetId}`
        );
        if (!response.ok) throw new Error("Failed to fetch study set.");
        const data = await response.json();
        setStudySet(data);
        setOriginalStudySet(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudySet();
  }, [studySetId]);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setNewFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleMarkForDeletion = (file) => {
    setFilesToDelete((prev) => {
      const updatedFiles = prev.includes(file)
        ? prev.filter((f) => f !== file)
        : [...prev, file];
      return updatedFiles;
    });
  };

  const handleUpdateStudySet = async () => {
    if (!studySet) return;

    const formData = new FormData();
    formData.append("name", studySet.name);
    formData.append("description", studySet.description);
    newFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(
        `http://localhost:5001/api/study-set/${studySetId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to update study set.");

      for (const file of filesToDelete) {
        const fileId = file.file_id;
        try {
          const deleteResponse = await fetch(
            `http://localhost:5001/api/study-set/file/${fileId}`,
            {
              method: "DELETE",
            }
          );
          if (!deleteResponse.ok)
            throw new Error(`Failed to delete file ${fileId}`);
        } catch (error) {
          console.error(`Error deleting file ${fileId}:`, error);
        }
      }

      const updatedStudySetResponse = await fetch(
        `http://localhost:5001/api/study-set/${studySetId}`
      );
      if (!updatedStudySetResponse.ok)
        throw new Error("Failed to fetch updated study set.");
      const updatedStudySet = await updatedStudySetResponse.json();
      setStudySet(updatedStudySet);
      setEditMode(false);
      setNewFiles([]);
      setFilesToDelete([]);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancel = () => {
    setStudySet(originalStudySet);
    setEditMode(false);
    setNewFiles([]);
    setFilesToDelete([]);
  };

  const handleDeleteStudySet = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/study-set/${studySetId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete study set.");
      navigate("/project-library");
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle sharing the study set
  const handleShareStudySet = async () => {
    if (!username) {
      alert("Please enter a username.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studySetId,
          sharedWithUsername: username, // Assuming 'username' is the user ID
          sharedByUserId: userId, // Replace with the actual current user's ID
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to share the study set.");
      }

      const data = await response.json();
      alert(data.message || "Study set shared successfully.");
      setShowShareModal(false); // Close the modal
      setUsername([]);
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <p>Loading study set...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="study-set-container">
      <div className="study-set-page">
        {/* Back Link Icon */}
        <div className="back-link">
          <GrFormPreviousLink
            onClick={() => navigate("/project-library")}
            className="back-link-icon"
          />
        </div>

        {/* Header with Edit and Delete Icons */}
        <div className="header-actions">
          <h1>{editMode ? "Edit Study Set" : studySet.name}</h1>
          <div className="icon-buttons">
            {!editMode && (
              <>
                <MdEdit
                  onClick={() => setEditMode(true)}
                  className="edit-icon"
                />
                <MdDelete
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="delete-icon"
                />
                <AiOutlineShareAlt
                  onClick={() => setShowShareModal(true)} // Open share modal
                  className="share-icon"
                />
              </>
            )}
          </div>
        </div>

        {/* Modal for sharing */}
          {showShareModal && (
            <div className="share-modal">
              <div className="modal-content">
                <h3>Share Study Set</h3>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="input-field"
                />
                <div className="modal-actions">
                  <button onClick={handleShareStudySet} className="confirm-button">
                    Share
                  </button>
                  <button onClick={() => setShowShareModal(false)} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        {editMode ? (
          <div className="edit-mode">
            <input
              type="text"
              value={studySet.name}
              onChange={(e) =>
                setStudySet({ ...studySet, name: e.target.value })
              }
              placeholder="Study Set Name"
              className="input-field"
            />
            <textarea
              value={studySet.description}
              onChange={(e) =>
                setStudySet({ ...studySet, description: e.target.value })
              }
              placeholder="Study Set Description"
              className="input-field"
            />

            <div className="current-files">
              <h3>Current Files</h3>
              {studySet.files.length > 0 ? (
                <ul>
                  {studySet.files.map((file, index) => (
                    <li
                      key={index}
                      className={
                        filesToDelete.includes(file) ? "file-marked-delete" : ""
                      }
                    >
                      <span>{file.file_path}</span>
                      <button
                        className="delete-file-button"
                        onClick={() => handleMarkForDeletion(file)}
                      >
                        {filesToDelete.includes(file) ? "Undo" : "Delete"}
                      </button>
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
                accept=".pdf"
              />
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
            <div className="button-group">
              <button onClick={handleUpdateStudySet} className="confirm-button">
                Save Changes
              </button>
              <button onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="view-mode">
            <p>{studySet.description === "null" ? 'No description available' : studySet.description}</p>
            <h3>Files</h3>
            <ul>
              {studySet.files.length > 0 ? (
                studySet.files.map((file, index) => (
                  <li key={index}>
                    <span>{file.file_path.split('/').pop()}</span> {/* Extract and display only the file name */}
                  </li>
                ))
              ) : (
                <p>No files uploaded yet.</p>
              )}
            </ul>
            <div className="button-group">
              <button
                onClick={() =>
                  navigate(`/study-set/${studySetId}/generate-study-guide`)
                }
                className="generate-guide-button"
              >
                Generate Study Guide
              </button>
              <button
                onClick={() =>
                  navigate(`/study-set/${studySetId}/generate-quiz`)
                }
                className="generate-quiz-button"
              >
                Generate Quiz
              </button>
              <button
                onClick={() =>
                  navigate(`/study-set/${studySetId}/generate-study-plan`)
                }
                className="generate-plan-button"
              >
                Generate Study Plan
              </button>
            </div>
          </div>
        )}

        {/* Chat Component */}
        <ChatComponent studySetId={studySetId} userId={userId} />

        {showDeleteConfirmation && (
          <div className="delete-confirmation-modal">
            <div className="modal-content">
              <p>Are you sure you want to delete this study set?</p>
              <div className="button-group">
                <button
                  onClick={handleDeleteStudySet}
                  className="confirm-delete-button"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="cancel-delete-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudySetPage;



