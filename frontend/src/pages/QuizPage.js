import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuizPage.css';

const QuizPage = () => {
  const userId = localStorage.getItem('userId');
  const { studySetId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [score, setScore] = useState(0); // Store score

  // Fetch quiz questions
  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/study-set/quiz/${quizId}`);
      if (!response.ok) throw new Error('Failed to fetch quiz details.');
      const data = await response.json();
      const quiz_content = JSON.parse(data[0].quiz_content);
      setQuiz(quiz_content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    if (submitted) return; // Prevent changes after submission
    const newUserAnswers = [...userAnswers];
    newUserAnswers[questionIndex] = answerIndex;
    setUserAnswers(newUserAnswers);
  };

  const handleScoreSubmission = async (score) => {
    try {
      const response = await fetch('http://localhost:5001/api/quizzes/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          quizId,
          score,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz score.');
      }

      const data = await response.json();
      console.log('Score submitted successfully:', data);
    } catch (err) {
      console.error('Error submitting score:', err.message);
    }
  };

  const handleSubmit = () => {
    const newFeedback = quiz.map((question, index) => {
      return userAnswers[index] === question.correctAnswer;
    });

    setFeedback(newFeedback);
    setSubmitted(true);

    // Calculate score
    const correctAnswers = newFeedback.filter(Boolean).length;
    const normalizedScore = correctAnswers / quiz.length; // Convert to decimal between 0-1
    setScore(correctAnswers); // Update score state

    // Submit score to backend
    handleScoreSubmission(normalizedScore);
  };

  const handleGoHome = () => {
    navigate(`/study-set/${studySetId}/generate-quiz`);
  };

  if (loading) return <p>Loading quiz...</p>;
  if (error) return <p className="error">{error}</p>;

  if (!quiz || quiz.length === 0) return <p>No quiz questions available.</p>;

  return (
    <div className="quiz-page">
      <h1>Quiz</h1>

      <div className="quiz-details">
        <h2>Questions</h2>
        {quiz.map((question, index) => (
          <div key={index} className="question-item">
            {/* Render the question in bold with a number */}
            <p className="question">
              <strong>{`Q${index + 1}: ${question.question}`}</strong>
            </p>

            {/* Render answers in a horizontal layout */}
            <div className="answers-container">
              {question.answers.map((answer, answerIndex) => (
                <div key={answerIndex} className="answer-option">
                  <label>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={answerIndex}
                      checked={userAnswers[index] === answerIndex}
                      onChange={() => handleAnswerChange(index, answerIndex)}
                      disabled={submitted} // Disable inputs after submission
                    />
                    {answer}
                  </label>
                </div>
              ))}
            </div>

            {/* Show feedback after submission */}
            {submitted && (
              <p
                className={
                  feedback[index] ? 'correct-answer' : 'incorrect-answer'
                }
              >
                {feedback[index] ? 'Correct' : `Incorrect! Correct answer: ${question.answers[question.correctAnswer]}`}
              </p>
            )}
          </div>
        ))}

        {/* Submission buttons */}
        {!submitted && (
          <div className="quiz-buttons">
            <button onClick={handleSubmit} className="submit-quiz-button">
              Submit Quiz
            </button>
            <button onClick={handleGoHome} className="go-home-button">
              Back to Quiz List
            </button>
          </div>
        )}

        {/* Feedback after submission */}
        {submitted && (
          <div className="quiz-feedback">
            <h3>Feedback</h3>
            {quiz.map((question, index) => (
              <div key={index} className="feedback-item">
                <p>{question.question}</p>
                <p>
                  {feedback[index]
                    ? 'Correct!'
                    : `Incorrect! Correct answer: ${question.answers[question.correctAnswer]}`}
                </p>
              </div>
            ))}

            {/* Display score */}
            <h4>Your Score: {score}/{quiz.length}</h4>

            <button onClick={handleGoHome} className="go-home-button">
              Back to Quiz List
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
