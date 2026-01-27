import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import './TakeQuiz.css';

export default function TakeQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user, addXP } = useAuth();

    const [quiz, setQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answer, setAnswer] = useState('');
    const [selectedOption, setSelectedOption] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchQuiz() {
            try {
                const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
                if (quizDoc.exists()) {
                    setQuiz({ id: quizDoc.id, ...quizDoc.data() });
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        fetchQuiz();
    }, [quizId]);

    const checkAnswer = () => {
        if (!quiz) return;

        const q = quiz.questions[currentQuestion];
        let correct = false;

        if (q.type === 'multiple_choice') {
            correct = q.options[selectedOption] === q.correctAnswer;
        } else {
            correct = answer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
        }

        setIsCorrect(correct);
        if (correct) setScore(score + 1);
        setShowResult(true);
    };

    const nextQuestion = async () => {
        setShowResult(false);
        setAnswer('');
        setSelectedOption(null);

        if (currentQuestion + 1 >= quiz.questions.length) {
            setFinished(true);
            // Award XP based on score
            if (user) {
                const xpEarned = score * 10 + (score === quiz.questions.length ? 50 : 0);
                await addXP(xpEarned);
            }
        } else {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    if (loading) {
        return (
            <div className="take-quiz loading">
                <div className="loader">📚</div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="take-quiz error">
                <h2>Quiz not found</h2>
                <button onClick={() => navigate('/')}>Go Home</button>
            </div>
        );
    }

    if (finished) {
        const percentage = Math.round((score / quiz.questions.length) * 100);
        const xpEarned = score * 10 + (score === quiz.questions.length ? 50 : 0);

        return (
            <div className="take-quiz finished">
                <div className="finish-card">
                    <div className="finish-emoji">
                        {percentage === 100 ? '🎉' : percentage >= 70 ? '😊' : '💪'}
                    </div>
                    <h1>
                        {percentage === 100 ? 'Perfect!' : percentage >= 70 ? 'Great job!' : 'Keep practicing!'}
                    </h1>
                    <div className="score-display">
                        <span className="score-number">{score}</span>
                        <span className="score-divider">/</span>
                        <span className="score-total">{quiz.questions.length}</span>
                    </div>
                    <p className="percentage">{percentage}% correct</p>
                    {user && (
                        <div className="xp-earned">
                            <span className="xp-icon">⚡</span>
                            <span>+{xpEarned} XP</span>
                        </div>
                    )}
                    <div className="finish-buttons">
                        <button className="retry-btn" onClick={() => {
                            setCurrentQuestion(0);
                            setScore(0);
                            setFinished(false);
                            setAnswer('');
                            setSelectedOption(null);
                        }}>
                            Try Again
                        </button>
                        <button className="home-btn" onClick={() => navigate('/')}>
                            Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const q = quiz.questions[currentQuestion];
    const progress = ((currentQuestion) / quiz.questions.length) * 100;

    return (
        <div className={`take-quiz ${showResult ? (isCorrect ? 'correct-bg' : 'wrong-bg') : ''}`}>
            <header className="quiz-header">
                <button className="close-btn" onClick={() => navigate('/')}>✕</button>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="score-badge">{score} ⭐</div>
            </header>

            <main className="quiz-content">
                <h2 className="question-text">{q.text}</h2>

                {q.type === 'multiple_choice' ? (
                    <div className="options-container">
                        {q.options.map((option, index) => (
                            <button
                                key={index}
                                className={`option-btn ${selectedOption === index ? 'selected' : ''} ${showResult
                                        ? option === q.correctAnswer
                                            ? 'correct'
                                            : selectedOption === index
                                                ? 'wrong'
                                                : ''
                                        : ''
                                    }`}
                                onClick={() => !showResult && setSelectedOption(index)}
                                disabled={showResult}
                            >
                                <span className="option-number">{index + 1}</span>
                                <span className="option-text">{option}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="type-answer-container">
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            disabled={showResult}
                            autoFocus
                            className={showResult ? (isCorrect ? 'correct' : 'wrong') : ''}
                        />
                        {showResult && !isCorrect && (
                            <p className="correct-answer-hint">
                                Correct answer: <strong>{q.correctAnswer}</strong>
                            </p>
                        )}
                    </div>
                )}
            </main>

            <footer className="quiz-footer">
                {!showResult ? (
                    <button
                        className="check-btn"
                        onClick={checkAnswer}
                        disabled={q.type === 'multiple_choice' ? selectedOption === null : !answer.trim()}
                    >
                        Check
                    </button>
                ) : (
                    <div className={`result-footer ${isCorrect ? 'correct' : 'wrong'}`}>
                        <div className="result-message">
                            {isCorrect ? (
                                <>
                                    <span className="result-icon">✓</span>
                                    <span>Correct!</span>
                                </>
                            ) : (
                                <>
                                    <span className="result-icon">✗</span>
                                    <span>Incorrect</span>
                                </>
                            )}
                        </div>
                        <button className="continue-btn" onClick={nextQuestion}>
                            Continue
                        </button>
                    </div>
                )}
            </footer>
        </div>
    );
}
