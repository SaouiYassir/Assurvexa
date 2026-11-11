import { useEffect, useState } from 'react';
import api from '../../../services/api';
import './agents.css';

function Agents() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getAgents = async () => {
        try {
            const response = await api.get('/agents');
            setAgents(response.data?.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch agents:", err);
            setError("Could not load agents data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAgents();
    }, []);

    return (
        <main className="agents-container">
            <div className="agents-header">
                <h1>Agents Management</h1>
                <button className="btn-primary">+ Add Agent</button>
            </div>

            {loading && <div className="status-message">Loading agents...</div>}
            {error && <div className="status-message error">{error}</div>}

            {!loading && !error && (
                <div className="table-responsive">
                    <table className="agents-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Date Integration</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.length > 0 ? (
                                agents.map((agent) => (
                                    <tr key={agent.id}>
                                        <td>#{agent.id}</td>
                                        <td className="font-weight-medium">
                                            {agent.user.first_name} {agent.user.last_name}
                                        </td>
                                        <td>{agent.user.email}</td>
                                        <td>
                                            {agent.date_integration 
                                                ? new Date(agent.date_integration).toLocaleDateString() 
                                                : 'N/A'}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon btn-edit" title="Modifier">
                                                    Modifier
                                                </button>
                                                <button className="btn-icon btn-delete" title="Supprimer">
                                                    Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="no-data">
                                        No agents found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default Agents;