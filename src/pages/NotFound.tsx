
import { Search, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            paddingTop: '120px'
        }}>
            <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '2rem',
                borderRadius: '50%',
                marginBottom: '2rem'
            }}>
                <Search size={64} color="var(--color-primary)" />
            </div>

            <h1 style={{ marginBottom: '1rem', fontSize: '3rem', fontWeight: 'bold' }}>404</h1>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>Strona nie zostałanaleziona</h2>

            <p style={{ maxWidth: '500px', marginBottom: '2.5rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Ups! Wygląda na to, że strona, której szukasz, nie istnieje lub została przeniesiona.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => navigate('/')} className="btn-primary">
                    <Home size={18} /> Strona Główna
                </button>
                <button onClick={() => navigate(-1)} className="btn-secondary">
                    <ArrowLeft size={18} /> Powrót
                </button>
            </div>
        </div>
    );
}
