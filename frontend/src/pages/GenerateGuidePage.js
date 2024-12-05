import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GenerateGuidePage.css';

const GenerateGuidePage = () => {
  const { studySetId } = useParams();
  const navigate = useNavigate(); // Use useNavigate hook for navigation
  const [studyGuides, setStudyGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, guideId: null });

  const maxStudyGuides = 5;

  const fetchStudyGuides = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/study-guides`);
      if (!response.ok) throw new Error('Failed to fetch study guides.');
      const data = await response.json();
      setStudyGuides(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyGuides();
  }, [studySetId]);

  const handleCreateStudyGuide = async () => {
    if (studyGuides.length >= maxStudyGuides) {
      alert(`You can only create up to ${maxStudyGuides} study guides. Please delete one before creating a new one.`);
      return;
    }

    try {
      setCreating(true);
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/study-guides`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create a study guide.');
      await fetchStudyGuides();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (guideId) => {
    setDeleteConfirmation({ show: true, guideId });
  };

  const handleDeleteStudyGuide = async (guideId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/study-guides/${guideId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete study guide.');
      await fetchStudyGuides();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeleteConfirmation({ show: false, guideId: null });
    }
  };

  const handleReturnToStudySet = () => {
    navigate(`/study-sets/${studySetId}`);
  };

  if (loading) return <p>Loading study guides...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="generate-guide-page">
      <h1>Study Guides for Study Set {studySetId}</h1>

      <button onClick={handleReturnToStudySet} className="return-button">
        Return to Study Set
      </button>

      {studyGuides.length === 0 && <p>No study guides created yet.</p>}

      <button
        onClick={handleCreateStudyGuide}
        disabled={creating}
        className="create-guide-button"
      >
        {creating ? 'Waiting for study guide creation...' : 'Create Study Guide'}
      </button>

      {studyGuides.length > 0 && (
        <div className="study-guides-list">
          <h2>Existing Study Guides</h2>
          <ul>
            {studyGuides.map((guide) => (
              <li key={guide.id} className="study-guide-item">
                <span>{guide.guide_content}</span>
                <button
                  onClick={() => confirmDelete(guide.id)}
                  className="delete-guide-button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {deleteConfirmation.show && (
        <div className="confirmation-popup">
          <p>Are you sure you want to delete this study guide?</p>
          <button
            onClick={() => handleDeleteStudyGuide(deleteConfirmation.guideId)}
            className="confirm-delete-button"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => setDeleteConfirmation({ show: false, guideId: null })}
            className="cancel-delete-button"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateGuidePage;
