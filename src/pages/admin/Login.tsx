
import { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import './admin-theme.css';

export function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const targetPath = searchParams.get('redirect') || '/admin';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            navigate(targetPath);
        } catch (err: any) {
            console.error(err);
            if (
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/user-not-found' ||
                err.code === 'auth/invalid-credential'
            ) {
                setError('Nieprawidłowy email lub hasło.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Ten email jest już zajęty.');
            } else if (err.code === 'auth/weak-password') {
                setError('Hasło musi mieć co najmniej 6 znaków.');
            } else {
                setError('Wystąpił błąd logowania: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setInfo('');
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
            navigate(targetPath);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Logowanie przez Google zostało anulowane.');
            } else {
                setError('Nie udało się zalogować przez Google: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        setError('');
        setInfo('');
        if (!email.trim()) {
            setError('Wpisz najpierw adres e-mail powyżej, aby wysłać link resetujący hasło.');
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setInfo(`Wysłaliśmy link do zmiany hasła na adres ${email.trim()}.`);
        } catch (err: any) {
            console.error(err);
            setError('Nie udało się wysłać linku resetującego: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <h2 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>
                    {isLogin ? 'Zaloguj się do Panelu' : 'Zarejestruj Admina'}
                </h2>

                {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
                {info && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{info}</div>}

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--color-border)',
                        background: '#fff',
                        color: '#1f2937',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        marginBottom: '1rem'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                        <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                    </svg>
                    Zaloguj się przez Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    <span style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                    lub e-mailem
                    <span style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--color-border)',
                            fontSize: '1rem'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Hasło"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--color-border)',
                            fontSize: '1rem'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Zaloguj się' : 'Zarejestruj się')}
                    </button>
                </form>

                {isLogin && (
                    <div style={{ marginTop: '0.85rem' }}>
                        <button
                            type="button"
                            onClick={handlePasswordReset}
                            disabled={loading}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.82rem',
                                textDecoration: 'underline',
                                cursor: 'pointer'
                            }}
                        >
                            Nie pamiętam hasła
                        </button>
                    </div>
                )}

                <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {isLogin ? 'Nie masz konta?' : 'Masz już konto?'}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontWeight: 'bold',
                            marginLeft: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
                    </button>
                </div>
            </div>
        </div>
    );
}
