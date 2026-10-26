import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosbase, { errorMessage } from './axiosConfig';

const authorizationHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const Questions = ({ username, globalSearch = '' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ title: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All Questions');
    const [search, setSearch] = useState('');
    const [askFormOpen, setAskFormOpen] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextOffset, setNextOffset] = useState(0);
    const requestVersion = React.useRef(0);
    const selectedId = new URLSearchParams(location.search).get('question');
    const effectiveSearch = search || globalSearch;
    const invalidateRequests = useCallback(() => { requestVersion.current++; }, []);

    const fetchQuestions = useCallback(async (offset = 0) => {
        const version = ++requestVersion.current;
        setFetching(true); setError('');
        try {
            const { data, headers } = await axiosbase.get('/all_question/', { params: {
                search: effectiveSearch, offset,
                filter: ({'Popular':'popular','Unanswered':'unanswered','My Questions':'mine'})[filter] || 'all',
            } });
            let rows = data;
            if (!offset && selectedId && !effectiveSearch && filter === 'All Questions' && !rows.some(row => String(row.id) === selectedId)) {
                const response = await axiosbase.get(`/all_question/${selectedId}`);
                rows = [response.data, ...rows];
            }
            if (version !== requestVersion.current) return;
            setNextOffset(offset + data.length);
            setQuestions(current => offset ? [...current, ...rows.filter(row => !current.some(item => item.id === row.id))] : rows);
            setHasMore(headers['x-has-more'] === 'true');
        } catch (requestError) {
            if (version !== requestVersion.current) return;
            setError(errorMessage(requestError, 'We could not load questions. Please try again.'));
        } finally { if (version === requestVersion.current) setFetching(false); }
    }, [effectiveSearch, filter, selectedId]);
    useEffect(() => {
        let active = true;
        const timer = setTimeout(() => { if (active) fetchQuestions(); }, 250);
        return () => { active = false; invalidateRequests(); clearTimeout(timer); };
    }, [fetchQuestions, invalidateRequests]);

    useEffect(() => {
        if (new URLSearchParams(location.search).get('ask') === '1') {
            setAskFormOpen(true);
            navigate('/questions', { replace: true });
        }
    }, [location.search, navigate]);

    const visibleQuestions = questions;
    const incrementAnswerCount = async (questionId) => {
        try {
            const { data } = await axiosbase.get(`/all_question/${questionId}`);
            setQuestions(current => current.map(question => question.id === questionId ? data : question));
        } catch (failure) { setError(errorMessage(failure, 'Your answer was saved, but the answer count could not be refreshed.')); }
        window.dispatchEvent(new Event('community-changed'));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!newQuestion.title.trim() || !newQuestion.description.trim()) return;

        setLoading(true);
        setError('');
        try {
            await axiosbase.post('/all_question/', {
                title: newQuestion.title.trim(),
                description: newQuestion.description.trim(),
            }, {
                headers: authorizationHeaders(),
            });
            setNewQuestion({ title: '', description: '' });
            await fetchQuestions();
            setAskFormOpen(false);
            window.dispatchEvent(new Event('community-changed'));
        } catch (requestError) {
            setError(errorMessage(requestError, 'Your question could not be posted. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="questions-content">
            <header className="questions-header">
                <span className="questions-header-icon" aria-hidden="true">?</span>
                <div className="questions-header-copy">
                    <h1>Questions &amp; Answers</h1>
                    <p>Find answers, ask new questions, and help others.</p>
                </div>
                <button
                    className="ask-question-toggle"
                    type="button"
                    aria-expanded={askFormOpen}
                    onClick={() => setAskFormOpen((open) => !open)}
                >
                    {askFormOpen ? 'Close' : 'Ask Question'}
                </button>
            </header>

            {askFormOpen && <section className="question-form-card">
                <h2>Ask a Question</h2>
                <p>Describe what you need help with and the community can weigh in.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Question title"
                        aria-label="Question title"
                        maxLength={500}
                        value={newQuestion.title}
                        onChange={(event) => setNewQuestion({ ...newQuestion, title: event.target.value })}
                        required
                    />
                    <textarea
                        placeholder="Add details to help people answer..."
                        aria-label="Question description"
                        maxLength={20000}
                        value={newQuestion.description}
                        onChange={(event) => setNewQuestion({ ...newQuestion, description: event.target.value })}
                        required
                    />
                    <button className="primary-button" type="submit" disabled={loading}>
                        {loading ? 'Posting...' : 'Post Question'}
                    </button>
                </form>
            </section>}

            <section className="questions-list-section">
                <div className="questions-filters" role="tablist" aria-label="Filter questions">
                    {['All Questions', 'Popular', 'Unanswered', 'My Questions'].map((option) => (
                        <button type="button" role="tab" aria-selected={filter === option} className={filter === option ? 'current' : ''} key={option} onClick={() => setFilter(option)}>
                            {option}
                        </button>
                    ))}
                </div>
                <label className="questions-search">
                    <span className="sr-only">Search questions</span>
                    <span className="questions-search-icon" aria-hidden="true">⌕</span>
                    <input value={search} onChange={(event) => setSearch(event.target.value)} maxLength={255} placeholder="Search questions..." />
                </label>
                {error && <p className="questions-error" role="alert">{error}</p>}
                {fetching && questions.length === 0 ? <p className="questions-empty">Loading questions...</p> : visibleQuestions.length === 0 ? (
                    <p className="questions-empty">{search ? 'No questions match your search.' : 'No questions yet. Be the first to ask!'}</p>
                ) : (
                    <div className="questions-list">
                        {visibleQuestions.map((question) => <QuestionItem key={question.id} question={question} initiallyExpanded={String(question.id) === selectedId} onAnswerAdded={incrementAnswerCount} />)}
                    </div>
                )}
                {hasMore && <button className="view-all" disabled={fetching} onClick={() => fetchQuestions(nextOffset)}>{fetching ? 'Loading...' : 'Load more questions'}</button>}
                {error && <button className="view-all" onClick={() => fetchQuestions()}>Retry</button>}
            </section>
        </div>
    );
};

const QuestionItem = ({ question, onAnswerAdded, initiallyExpanded }) => {
    const [answers, setAnswers] = useState([]);
    const [showAnswers, setShowAnswers] = useState(initiallyExpanded);
    const [newAnswer, setNewAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetchingAnswers, setFetchingAnswers] = useState(false);
    const [hasMoreAnswers, setHasMoreAnswers] = useState(false);
    const cardRef = React.useRef(null);

    const fetchAnswers = useCallback(async (offset = 0) => {
        setError(''); setFetchingAnswers(true);
        try {
            const { data, headers } = await axiosbase.get(`/answers/${question.id}`, {
                params: { offset },
                headers: authorizationHeaders(),
            });
            setAnswers(current => offset ? [...current, ...data.filter(row => !current.some(item => item.id === row.id))] : data);
            setHasMoreAnswers(headers['x-has-more'] === 'true');
        } catch (requestError) {
            setError(errorMessage(requestError, 'Answers could not be loaded. Please try again.'));
        } finally { setFetchingAnswers(false); }
    }, [question.id]);
    useEffect(() => {
        if (initiallyExpanded) { setShowAnswers(true); fetchAnswers(); cardRef.current?.scrollIntoView?.({ block: 'nearest' }); }
    }, [initiallyExpanded, fetchAnswers]);

    const handleAnswerSubmit = async (event) => {
        event.preventDefault();
        if (!newAnswer.trim()) return;

        setLoading(true);
        setError('');
        try {
            await axiosbase.post('/answers/', {
                questionId: question.id,
                answerText: newAnswer.trim(),
            }, {
                headers: authorizationHeaders(),
            });
            setNewAnswer('');
            await onAnswerAdded(question.id);
            await fetchAnswers();
        } catch (requestError) {
            setError(errorMessage(requestError, 'Your answer could not be posted. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const toggleAnswers = () => {
        const shouldLoadAnswers = !showAnswers;
        setShowAnswers((isVisible) => !isVisible);
        if (shouldLoadAnswers) fetchAnswers();
    };

    return (
        <article ref={cardRef} className="question-card">
            <div className="question-card-icon" aria-hidden="true">{(question.username || 'Q').slice(0, 1).toUpperCase()}</div>
            <div className="question-card-body">
                <button className="question-title-button" type="button" onClick={toggleAnswers} aria-expanded={showAnswers}>
                    <h2>{question.title}</h2>
                </button>
                <p className="question-description">{question.description}</p>
                <div className="question-card-footer">
                    <div className="question-card-meta">
                        <span>Asked by <strong>{question.username || 'Community member'}</strong></span>
                        <span>{question.created_at ? new Date(question.created_at).toLocaleDateString() : ''}</span>
                    </div>
                    <button className="answers-toggle" type="button" onClick={toggleAnswers} aria-expanded={showAnswers}>
                        {showAnswers ? 'Hide' : 'View'} answers <span>{answers.length || Number(question.answer_count) || 0}</span>
                    </button>
                </div>
                {showAnswers && (
                    <div className="answers-area">
                        {error && <p className="questions-error" role="alert">{error}</p>}
                        <form onSubmit={handleAnswerSubmit} className="answer-form">
                            <textarea
                                placeholder="Write your answer..."
                                aria-label={`Answer ${question.title}`}
                                maxLength={20000}
                                value={newAnswer}
                                onChange={(event) => setNewAnswer(event.target.value)}
                                required
                            />
                            <button className="primary-button" type="submit" disabled={loading}>
                                {loading ? 'Posting...' : 'Post Answer'}
                            </button>
                        </form>
                        {fetchingAnswers ? <p className="questions-empty">Loading answers...</p> : answers.length === 0 ? <p className="questions-empty">No answers yet.</p> : answers.map((answer) => (
                            <div className="answer-card" key={answer.id}>
                                <p>{answer.answer_text}</p>
                                <small>By {answer.username} · {answer.created_at ? new Date(answer.created_at).toLocaleDateString() : ''}</small>
                            </div>
                        ))}
                        {hasMoreAnswers && <button className="view-all" onClick={() => fetchAnswers(answers.length)}>Load more answers</button>}
                        {error && <button className="view-all" onClick={() => fetchAnswers()}>Retry answers</button>}
                    </div>
                )}
            </div>
        </article>
    );
};

export default Questions;
