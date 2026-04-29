import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const navigate = useNavigate();
        const [admin, setAdmin] = useState(null);

        useEffect(() => {
                const adminString = localStorage.getItem('currentUser');
                if (adminString) {
                    const parsedAdmin = JSON.parse(adminString);
                    if (parsedAdmin.role === 'ADMIN') {
                        setAdmin(parsedAdmin);
                    } else {
                        navigate('/admin/login');
                    }
                } else {
                    navigate('/admin/login');
                }
            }, [navigate]);

    const handleLogout = async () => {
            try {
                await fetch('http://localhost:8081/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error("Błąd podczas zamykania sesji admina:", error);
            }

            localStorage.removeItem('currentUser');
            navigate('/admin/login', { replace: true });
        };

    if (!admin) return null;

    return (
        <div style={{ padding: '20px', border: '2px solid red' }}>
            <h2 style={{ color: 'red' }}>Panel Administratora</h2>
            {admin && admin.role === 'ADMIN' ? (
                <div>
                    <p>Zalogowano jako: <strong>{admin.email}</strong></p>
                    <p>Tutaj w przyszłości będzie lista wszystkich rekrutacji.</p>
                    <button onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white' }}>Wyloguj Admina</button>
                </div>
            ) : (
                <p>Brak uprawnień! <button onClick={() => navigate('/admin/login')}>Zaloguj</button></p>
            )}
        </div>
    );
}

export default AdminDashboard;