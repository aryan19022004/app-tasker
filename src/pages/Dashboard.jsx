import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchTasks = async () => {
        try {
            const { data } = await api.get('/tasks');
            setTasks(data);
        } catch (err) {
            if (err.response?.status === 401) {
                handleLogout();
            } else {
                setError('Failed to fetch tasks.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await api.delete(`/tasks/${id}`);
                setTasks(tasks.filter(t => t._id !== id));
            } catch (err) {
                alert('Failed to delete task');
            }
        }
    };

    const handleStatusToggle = async (task) => {
        try {
            const newStatus = task.status === 'pending' ? 'completed' : 'pending';
            const { data } = await api.put(`/tasks/${task._id}`, { status: newStatus });
            setTasks(tasks.map(t => t._id === task._id ? data : t));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const openModal = (task = null) => {
        setCurrentTask(task || { title: '', description: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentTask(null);
    };

    const saveTask = async (e) => {
        e.preventDefault();
        try {
            if (currentTask._id) {
                const { data } = await api.put(`/tasks/${currentTask._id}`, currentTask);
                setTasks(tasks.map(t => t._id === currentTask._id ? data : t));
            } else {
                const { data } = await api.post('/tasks', currentTask);
                setTasks([...tasks, data]);
            }
            closeModal();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save task');
        }
    };

    const handleTaskChange = (e) => {
        setCurrentTask({ ...currentTask, [e.target.name]: e.target.value });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <nav className="navbar">
                <div className="navbar-brand">App<span style={{ color: 'var(--text-main)' }}>Tasker</span></div>
                <div className="navbar-nav">
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Welcome, {user.username} {user.role === 'admin' ? '(Admin)' : ''}</span>
                    <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <main className="container">
                <div className="dashboard-header">
                    <div>
                        <h2>Your Tasks</h2>
                        <p>Manage your daily goals and objectives.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>+ New Task</button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <p style={{ textAlign: 'center', marginTop: '3rem' }}>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>No tasks found</h3>
                        <p>You haven't created any tasks yet. Click the button above to get started.</p>
                    </div>
                ) : (
                    <div className="tasks-grid">
                        {tasks.map(task => (
                            <div key={task._id} className="task-card glass-card" style={{ padding: '1.5rem', height: '100%' }}>
                                <div className="task-card-header">
                                    <h3 style={{ margin: 0, fontSize: '1.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</h3>
                                    <span className={`task-status status-${task.status}`}>
                                        {task.status}
                                    </span>
                                </div>
                                <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', flex: 1 }}>{task.description}</p>
                                {user.role === 'admin' && task.user && (
                                    <p style={{ marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--primary-color)' }}>Owner: {task.user.email}</p>
                                )}

                                <div className="task-actions">
                                    <button
                                        className="btn btn-outline"
                                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }}
                                        onClick={() => handleStatusToggle(task)}
                                    >
                                        Mark {task.status === 'pending' ? 'Done' : 'Pending'}
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ background: '#f3f4f6', color: '#374151', padding: '0.5rem 1rem' }}
                                        onClick={() => openModal(task)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        style={{ padding: '0.5rem 1rem' }}
                                        onClick={() => handleDelete(task._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <h2>{currentTask._id ? 'Edit Task' : 'Create New Task'}</h2>
                        <form onSubmit={saveTask} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="form-input"
                                    value={currentTask.title}
                                    onChange={handleTaskChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-input"
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                    value={currentTask.description}
                                    onChange={handleTaskChange}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
