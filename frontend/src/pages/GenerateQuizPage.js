import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';
import './GenerateQuizPage.css';

const GenerateQuizPage = () => {
  const { studySetId } = useParams();
  const navigate = useNavigate();  // Initialize navigate hook
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, quizId: null });

  const maxQuizzes = 5;

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/quizzes`);
      if (!response.ok) throw new Error('Failed to fetch quizzes.');
      const data = await response.json();
      setQuizzes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [studySetId]);

  const handleCreateQuiz = async () => {
    if (quizzes.length >= maxQuizzes) {
      alert(`You can only create up to ${maxQuizzes} quizzes. Please delete one before creating a new one.`);
      return;
    }

    try {
      setCreating(true);
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Quiz', questions: [] }), // Example, customize as needed
      });

      if (!response.ok) throw new Error('Failed to create a quiz.');
      await fetchQuizzes();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (quizId) => {
    setDeleteConfirmation({ show: true, quizId });
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete quiz.');
      await fetchQuizzes();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeleteConfirmation({ show: false, quizId: null });
    }
  };

  const handleQuizClick = (quizId) => {
    navigate(`/quiz/${studySetId}/${quizId}`);
  };

  // Navigate to the study set page when clicking the "Return to Study Set" button
  const handleReturnToStudySet = () => {
    navigate(`/study-sets/${studySetId}`);
  };

  if (loading) return <p>Loading quizzes...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="generate-quiz-page">
      <h1>Quizzes for Study Set {studySetId}</h1>

      {quizzes.length === 0 && <p>No quizzes created yet.</p>}

      <button
        onClick={handleCreateQuiz}
        disabled={creating}
        className="create-quiz-button"
      >
        {creating ? 'Waiting for quiz creation...' : 'Create Quiz'}
      </button>

      {/* Return to Study Set Button */}
      <button
        onClick={handleReturnToStudySet}
        className="return-to-study-set-button"
      >
        Return to Study Set
      </button>

      {quizzes.length > 0 && (
        <div className="quizzes-list">
          <h2>Existing Quizzes</h2>
          <ul>
            {quizzes.map((quiz, index) => (
              <li key={quiz.id} className="quiz-item">
                <div className="quiz-box" onClick={() => handleQuizClick(quiz.id)}>
                  Study Quiz {index + 1}
                </div>
                <button
                  onClick={() => confirmDelete(quiz.id)}
                  className="delete-quiz-button"
                >
                  Delete
                </button>
                <Leaderboard quizId={quiz.id} /> {/* Add Leaderboard component */}
              </li>
            ))}
          </ul>
        </div>
      )}

      {deleteConfirmation.show && (
        <div className="confirmation-popup">
          <p>Are you sure you want to delete this quiz?</p>
          <button
            onClick={() => handleDeleteQuiz(deleteConfirmation.quizId)}
            className="confirm-delete-button"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => setDeleteConfirmation({ show: false, quizId: null })}
            className="cancel-delete-button"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateQuizPage;
