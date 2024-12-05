import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import ReactMarkdown from 'react-markdown';
import './GenerateStudyPlanPage.css';

const GenerateStudyPlanPage = () => {
  const { studySetId } = useParams();
  const navigate = useNavigate(); // Hook for navigation
  const [days, setDays] = useState('');
  const [studyPlan, setStudyPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studyPlans, setStudyPlans] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, planId: null });

  const handleGenerateStudyPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/study-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) throw new Error('Failed to generate study plan.');
      const data = await response.json();
      setStudyPlan(data.plan_content);
      fetchStudyPlans(); // Refresh the list of study plans
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudyPlans = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/study-plans`);
      if (!response.ok) throw new Error('Failed to fetch study plans.');
      const data = await response.json();
      setStudyPlans(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteStudyPlan = async (planId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/study-set/${studySetId}/study-plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete study plan.');
      fetchStudyPlans(); // Refresh the list of study plans
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteConfirmation({ show: false, planId: null });
    }
  };

  useEffect(() => {
    fetchStudyPlans();
  }, [studySetId]);

  // New button click handler
  const handleReturnToStudySet = () => {
    navigate(`/study-sets/${studySetId}`); 
  };

  return (
    <div className="generate-study-plan-page">
      <h1>Generate Study Plan</h1>
      <input
        type="number"
        value={days}
        onChange={(e) => setDays(e.target.value)}
        placeholder="Enter number of days"
      />
      <div className="button-container">

        <button onClick={handleGenerateStudyPlan} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Study Plan'}
        </button>

        <button onClick={handleReturnToStudySet} className="return-button">
          Return to Study Set
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="plans-container">
        {studyPlan && (
          <>
            <h2>New Study Plan:</h2>
            <div className="study-plan">
              <ReactMarkdown>{studyPlan}</ReactMarkdown>
            </div>
          </>
        )}

        <h2>Existing Study Plans:</h2>
        {studyPlans.length === 0 ? (
          <p>No study plans created yet.</p>
        ) : (
          studyPlans.map((plan) => (
            <div key={plan.id} className="study-plan">
              <ReactMarkdown>{plan.plan_content}</ReactMarkdown>
              <button onClick={() => setDeleteConfirmation({ show: true, planId: plan.id })}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {deleteConfirmation.show && (
        <div className="confirmation-popup">
          <p>Are you sure you want to delete this study plan?</p>
          <button onClick={() => handleDeleteStudyPlan(deleteConfirmation.planId)} className="confirm-delete-button">
            Yes, Delete
          </button>
          <button onClick={() => setDeleteConfirmation({ show: false, planId: null })} className="cancel-delete-button">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateStudyPlanPage;