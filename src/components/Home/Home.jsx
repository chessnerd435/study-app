import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

export default function Home() {
    const { user, userData, logout } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [myQuizzes, setMyQuizzes] = useState([]);
    const [tab, setTab] = useState('explore');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchQuizzes() {
            try {
                // Fetch public quizzes
                const publicQuery = query(
                    collection(db, 'quizzes'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
                const publicSnap = await getDocs(publicQuery);
                setQuizzes(publicSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Fetch user's quizzes if logged in
                if (user) {
                    const myQuery = query(
                        collection(db, 'quizzes'),
                        where('creatorId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );
                    const mySnap = await getDocs(myQuery);
                    setMyQuizzes(mySnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        fetchQuizzes();
    }, [user]);

    const displayQuizzes = tab === 'explore' ? quizzes : myQuizzes;

    return (
        <div className="home">
            <header className="home-header">
                <div className="logo">
                    <span className="logo-icon">📚</span>
                    <span className="logo-text">Study</span>
                </div>
                <div className="user-stats">
                    <div className="stat">
                        <span className="stat-icon">⚡</span>
                        <span className="stat-value">{userData?.xp || 0}</span>
                    </div>
                    <div className="stat streak">
                        <span className="stat-icon">🔥</span>
                        <span className="stat-value">{userData?.streak || 0}</span>
                    </div>
                    <button className="profile-btn" onClick={logout} title="Logout">
                        {userData?.displayName?.[0]?.toUpperCase() || '?'}
                    </button>
                </div>
            </header>

            <main className="home-main">
                <div className="tabs">
                    <button
                        className={`tab ${tab === 'explore' ? 'active' : ''}`}
                        onClick={() => setTab('explore')}
                    >
                        🌎 Explore
                    </button>
                    <button
                        className={`tab ${tab === 'my' ? 'active' : ''}`}
                        onClick={() => setTab('my')}
                    >
                        📝 My Quizzes
                    </button>
                </div>

                <button className="create-btn" onClick={() => navigate('/create')}>
                    <span className="create-icon">+</span>
                    Create New Quiz
                </button>

                {loading ? (
                    <div className="loading-state">
                        <span className="spinner">📚</span>
                        <p>Loading quizzes...</p>
                    </div>
                ) : displayQuizzes.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">{tab === 'my' ? '📝' : '🔍'}</span>
                        <h3>{tab === 'my' ? 'No quizzes yet' : 'No quizzes found'}</h3>
                        <p>{tab === 'my' ? 'Create your first quiz!' : 'Be the first to create one!'}</p>
                    </div>
                ) : (
                    <div className="quiz-grid">
                        {displayQuizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                className="quiz-card"
                                onClick={() => navigate(`/quiz/${quiz.id}`)}
                            >
                                <div className="quiz-icon">📖</div>
                                <div className="quiz-info">
                                    <h3 className="quiz-title">{quiz.title}</h3>
                                    <p className="quiz-meta">
                                        {quiz.questionCount} questions • by {quiz.creatorName}
                                    </p>
                                </div>
                                <div className="quiz-arrow">→</div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
