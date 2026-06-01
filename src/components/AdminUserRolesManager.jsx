import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ALLOWED_ROLES = ['CANDIDATE', 'ADMIN'];

const ROLE_LABELS = {
    CANDIDATE: 'Kandydat',
    ADMIN: 'Administrator',
};

const ROLE_COLORS = {
    CANDIDATE: { background: '#e6f7ff', color: '#1890ff', border: '#91d5ff' },
    ADMIN: { background: '#fff0f6', color: '#c41d7f', border: '#ffadd2' },
};

function RoleBadge({ role }) {
    const colors = ROLE_COLORS[role] || { background: '#f5f5f5', color: '#595959', border: '#d9d9d9' };
    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: colors.background,
            color: colors.color,
            border: `1px solid ${colors.border}`,
        }}>
            {ROLE_LABELS[role] || role}
        </span>
    );
}

function AdminUserRolesManager() {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    // { [id]: selectedRole }
    const [selectedRoles, setSelectedRoles] = useState({});
    // { [id]: { type: 'success'|'error', message: string } }
    const [rowMessages, setRowMessages] = useState({});
    // { [id]: boolean }
    const [saving, setSaving] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) { navigate('/admin/login'); return; }
        try {
            const parsed = JSON.parse(storedUser);
            if (parsed.role !== 'ADMIN') { navigate('/admin/login'); return; }
        } catch {
            navigate('/admin/login'); return;
        }

        fetch('http://localhost:8081/api/candidates', { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Błąd pobierania listy kandydatów (status ' + res.status + ')');
                return res.json();
            })
            .then(data => {
                setCandidates(data);
                const initRoles = {};
                data.forEach(c => { initRoles[c.id] = c.role || 'CANDIDATE'; });
                setSelectedRoles(initRoles);
                setLoading(false);
            })
            .catch(err => {
                setFetchError(err.message);
                setLoading(false);
            });
    }, [navigate]);

    const handleRoleChange = (id, newRole) => {
        setSelectedRoles(prev => ({ ...prev, [id]: newRole }));
        // Ukryj poprzedni komunikat gdy użytkownik zmienia wybór
        setRowMessages(prev => ({ ...prev, [id]: null }));
    };

    const handleSave = async (candidate) => {
        const newRole = selectedRoles[candidate.id];

        // Walidacja: nie można zapisać tej samej roli
        if (newRole === candidate.role) {
            setRowMessages(prev => ({
                ...prev,
                [candidate.id]: { type: 'error', message: 'Wybrana rola jest identyczna z obecną.' },
            }));
            return;
        }

        setSaving(prev => ({ ...prev, [candidate.id]: true }));
        setRowMessages(prev => ({ ...prev, [candidate.id]: null }));

        try {
            const res = await fetch(`http://localhost:8081/api/candidates/${candidate.id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Błąd serwera');
            }

            const updated = await res.json();

            // Aktualizuj lokalny stan listy
            setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
            setSelectedRoles(prev => ({ ...prev, [updated.id]: updated.role }));
            setRowMessages(prev => ({
                ...prev,
                [candidate.id]: { type: 'success', message: `Rola zmieniona na: ${ROLE_LABELS[updated.role] || updated.role}` },
            }));
        } catch (err) {
            setRowMessages(prev => ({
                ...prev,
                [candidate.id]: { type: 'error', message: err.message },
            }));
        } finally {
            setSaving(prev => ({ ...prev, [candidate.id]: false }));
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-roles-content">

                {/* NAGŁÓWEK */}
                <div className="admin-roles-header">
                    <div className="admin-header-group">
                        <div className="admin-header-bar"></div>
                        <h1 className="admin-header-title">Zarządzanie Rolami Użytkowników</h1>
                    </div>
                    <button
                        className="back-button"
                        onClick={() => navigate('/admin-dashboard')}
                    >
                        Wróć do panelu
                    </button>
                </div>

                {/* INFORMACJA */}
                <div className="admin-roles-info-card">
                    <span className="admin-roles-info-icon">🔑</span>
                    <div>
                        <strong>Zmiana roli użytkownika</strong>
                        <p>Jako administrator możesz przypisywać role kandydatom. Zmiana roli na <em>Administrator</em> daje użytkownikowi dostęp do panelu administracyjnego.</p>
                    </div>
                </div>

                {/* TREŚĆ */}
                {loading && (
                    <div className="admin-roles-loading">
                        <div className="admin-roles-spinner"></div>
                        <span>Ładowanie listy użytkowników...</span>
                    </div>
                )}

                {fetchError && (
                    <div className="admin-roles-alert admin-roles-alert-error">
                        ❌ {fetchError}
                    </div>
                )}

                {!loading && !fetchError && candidates.length === 0 && (
                    <div className="admin-roles-empty">
                        Brak zarejestrowanych kandydatów w systemie.
                    </div>
                )}

                {!loading && !fetchError && candidates.length > 0 && (
                    <div className="admin-table-wrapper">
                        <table className="admin-table admin-roles-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '5%' }}>#</th>
                                    <th style={{ width: '20%' }}>Imię i nazwisko</th>
                                    <th style={{ width: '25%' }}>Email</th>
                                    <th style={{ width: '15%', textAlign: 'center' }}>Aktualna rola</th>
                                    <th style={{ width: '20%', textAlign: 'center' }}>Nowa rola</th>
                                    <th style={{ width: '15%', textAlign: 'center' }}>Akcja</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map((candidate, index) => {
                                    const currentRole = candidate.role || 'CANDIDATE';
                                    const selected = selectedRoles[candidate.id] || currentRole;
                                    const isUnchanged = selected === currentRole;
                                    const isSaving = saving[candidate.id] || false;
                                    const msg = rowMessages[candidate.id];

                                    return (
                                        <tr key={candidate.id} className="admin-roles-row">
                                            <td>{index + 1}</td>
                                            <td>
                                                <span className="admin-roles-name">
                                                    {candidate.firstName} {candidate.lastName}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="admin-roles-email">{candidate.email}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <RoleBadge role={currentRole} />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <select
                                                    id={`role-select-${candidate.id}`}
                                                    className="admin-roles-select"
                                                    value={selected}
                                                    onChange={e => handleRoleChange(candidate.id, e.target.value)}
                                                    disabled={isSaving}
                                                >
                                                    {ALLOWED_ROLES.map(r => (
                                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="admin-roles-action-cell">
                                                    <button
                                                        id={`save-role-btn-${candidate.id}`}
                                                        className={`admin-roles-save-btn ${isUnchanged || isSaving ? 'admin-roles-save-btn--disabled' : ''}`}
                                                        onClick={() => handleSave(candidate)}
                                                        disabled={isUnchanged || isSaving}
                                                    >
                                                        {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                                                    </button>
                                                    {msg && (
                                                        <div className={`admin-roles-row-msg admin-roles-row-msg--${msg.type}`}>
                                                            {msg.type === 'success' ? '✓' : '✗'} {msg.message}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminUserRolesManager;
