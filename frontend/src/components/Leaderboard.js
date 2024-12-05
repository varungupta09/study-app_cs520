import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = ({ quizId }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leaderboard data from the backend
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/quizzes/${quizId}/scores`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard data.');
      const data = await response.json();

      // Filter and group by user to keep only their best score
      const userBestScores = Object.values(
        data.scores.reduce((acc, score) => {
          if (!acc[score.username] || acc[score.username].score < score.score) {
            acc[score.username] = score;
          }
          return acc;
        }, {})
      );

      // Sort by score descending, then by date ascending
      userBestScores.sort((a, b) => b.score - a.score || new Date(a.taken_date) - new Date(b.taken_date));
      setScores(userBestScores);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [quizId]);

  if (loading) return <p>Loading leaderboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      {scores.length === 0 ? (
        <p>No scores available yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr key={score.scoreId}>
                <td>{index + 1}</td>
                <td>{score.username}</td>
                <td>{(score.score * 100).toFixed(2)}%</td>
                <td>{new Date(score.taken_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leaderboard;
