import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuizPage.css';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState([]); // Initialize quiz as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState([]);

  // Fetch quiz questions
  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/study-set/quiz/${quizId}`);
      if (!response.ok) throw new Error('Failed to fetch quiz details.');
      const data = await response.json();
      console.log(data);
      const quiz_content = JSON.parse(data[0].quiz_content);
      console.log(quiz_content);
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
    const newUserAnswers = [...userAnswers];
    newUserAnswers[questionIndex] = answerIndex;
    setUserAnswers(newUserAnswers);
  };

  const handleSubmit = () => {
    const newFeedback = quiz.map((question, index) => {
      return userAnswers[index] === question.correctAnswer;
    });
    setFeedback(newFeedback);
    setSubmitted(true);
  };

  if (loading) return <p>Loading quiz...</p>;
  if (error) return <p className="error">{error}</p>;

  // Check if quiz data exists before rendering questions
  if (!quiz || quiz.length === 0) return <p>No quiz questions available.</p>;

  return (
    <div className="quiz-page">
      <h1>Quiz</h1>

      <div className="quiz-details">
        <h2>Questions</h2>
        {quiz.map((question, index) => (
          <div key={index} className="question-item">
            <p>{question.question}</p>

            {question.answers.map((answer, answerIndex) => (
              <div key={answerIndex} className="answer-option">
                <label>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={answerIndex}
                    checked={userAnswers[index] === answerIndex}
                    onChange={() => handleAnswerChange(index, answerIndex)}
                  />
                  {answer}
                </label>
              </div>
            ))}

            {submitted && (
              <p
                className={
                  feedback[index] ? 'correct-answer' : 'incorrect-answer'
                }
              >
                {feedback[index] ? 'Correct' : 'Incorrect'}
              </p>
            )}
          </div>
        ))}

        <button onClick={handleSubmit} className="submit-quiz-button">
          Submit Quiz
        </button>

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
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
