import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './CreateQuiz.css';

export default function CreateQuiz() {
    const { user, userData, refreshUserData } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([
        { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: 0 }
    ]);
    const [saving, setSaving] = useState(false);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: 0 }
        ]);
    };

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const toggleQuestionType = (index) => {
        const newQuestions = [...questions];
        const current = newQuestions[index];
        if (current.type === 'multiple_choice') {
            newQuestions[index] = {
                text: current.text,
                type: 'type_in',
                correctAnswer: ''
            };
        } else {
            newQuestions[index] = {
                text: current.text,
                type: 'multiple_choice',
                options: ['', '', '', ''],
                correctAnswer: 0
            };
        }
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return alert('Please enter a quiz title');

        // Validate questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) return alert(`Question ${i + 1} is empty`);
            if (q.type === 'multiple_choice') {
                if (q.options.some(o => !o.trim())) {
                    return alert(`Question ${i + 1} has empty options`);
                }
            } else {
                if (!q.correctAnswer.trim()) {
                    return alert(`Question ${i + 1} needs an answer`);
                }
            }
        }

        setSaving(true);
        try {
            const quizData = {
                title: title.trim(),
                creatorId: user.uid,
                creatorName: userData?.displayName || 'Anonymous',
                questionCount: questions.length,
                createdAt: new Date(),
                isPublic: true,
                questions: questions.map(q => ({
                    text: q.text,
                    type: q.type,
                    ...(q.type === 'multiple_choice'
                        ? { options: q.options, correctAnswer: q.options[q.correctAnswer] }
                        : { correctAnswer: q.correctAnswer })
                }))
            };

            await addDoc(collection(db, 'quizzes'), quizData);

            // Update user's quizzes created count
            await refreshUserData();

            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Error saving quiz: ' + err.message);
        }
        setSaving(false);
    };

    return (
        <div className="create-quiz">
            <header className="create-header">
                <button className="back-btn" onClick={() => navigate('/')}>←</button>
                <h1>Create Quiz</h1>
                <div className="spacer"></div>
            </header>

            <form onSubmit={handleSubmit}>
                <div className="quiz-title-section">
                    <input
                        type="text"
                        placeholder="Quiz Title (e.g., Spanish Vocabulary)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="quiz-title-input"
                    />
                </div>

                <div className="questions-list">
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="question-card">
                            <div className="question-header">
                                <span className="question-number">Question {qIndex + 1}</span>
                                <div className="question-actions">
                                    <button
                                        type="button"
                                        className="type-toggle"
                                        onClick={() => toggleQuestionType(qIndex)}
                                    >
                                        {q.type === 'multiple_choice' ? '📝 Multiple Choice' : '⌨️ Type Answer'}
                                    </button>
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => removeQuestion(qIndex)}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder="Enter your question..."
                                value={q.text}
                                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                className="question-input"
                            />

                            {q.type === 'multiple_choice' ? (
                                <div className="options-grid">
                                    {q.options.map((option, oIndex) => (
                                        <div
                                            key={oIndex}
                                            className={`option-input-wrapper ${q.correctAnswer === oIndex ? 'correct' : ''}`}
                                        >
                                            <input
                                                type="text"
                                                placeholder={`Option ${oIndex + 1}`}
                                                value={option}
                                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className={`correct-btn ${q.correctAnswer === oIndex ? 'selected' : ''}`}
                                                onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                                title="Mark as correct answer"
                                            >
                                                ✓
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="type-in-answer">
                                    <label>Correct Answer:</label>
                                    <input
                                        type="text"
                                        placeholder="Type the correct answer..."
                                        value={q.correctAnswer}
                                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button type="button" className="add-question-btn" onClick={addQuestion}>
                    + Add Question
                </button>

                <button type="submit" className="save-quiz-btn" disabled={saving}>
                    {saving ? 'Saving...' : `Save Quiz (${questions.length} questions)`}
                </button>
            </form>
        </div>
    );
}
