
import { Search, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage';

export function NotFound() {
    const navigate = useNavigate();
    const { t } = useLanguage();

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
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>{t('notFound.title')}</h2>

            <p style={{ maxWidth: '500px', marginBottom: '2.5rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                {t('notFound.description')}
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => navigate('/')} className="btn-primary">
                    <Home size={18} /> {t('notFound.home')}
                </button>
                <button onClick={() => navigate(-1)} className="btn-secondary">
                    <ArrowLeft size={18} /> {t('notFound.back')}
                </button>
            </div>
        </div>
    );
}
