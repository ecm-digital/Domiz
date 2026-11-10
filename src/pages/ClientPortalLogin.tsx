import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, LockKeyhole } from 'lucide-react';
import { auth } from '../firebase';
import './ClientPortal.css';

export function ClientPortalLogin() {
  const [language, setLanguage] = useState<'pl' | 'en' | 'it'>(() => (localStorage.getItem('domiz.client-language') as 'pl' | 'en' | 'it') || 'pl');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    document.title = language === 'pl' ? 'Logowanie do panelu właściciela | Domiz Homes' : language === 'it' ? 'Accesso area proprietario | Domiz Homes' : 'Owner portal login | Domiz Homes';
  }, [language]);
  const copy = language === 'pl' ? { back: 'Wróć na stronę Domiz Homes', eyebrow: 'STREFA KLIENTA', title: 'Zaloguj się do swojej sprzedaży', text: 'Znajdziesz tu dokumenty, postęp prac i wszystkie najważniejsze ustalenia.', noAccess: 'To konto nie ma jeszcze dostępu do panelu klienta.', invalid: 'Nieprawidłowy adres e-mail lub hasło.', email: 'Adres e-mail', password: 'Hasło', login: 'Zaloguj się', help: 'Nie masz danych dostępu? Skontaktuj się ze swoim opiekunem Domiz Homes.' } : language === 'en' ? { back: 'Back to Domiz Homes', eyebrow: 'CLIENT PORTAL', title: 'Sign in to your sale', text: 'Find your documents, progress and all key arrangements here.', noAccess: 'This account does not have access to the client portal yet.', invalid: 'Incorrect email address or password.', email: 'Email address', password: 'Password', login: 'Sign in', help: 'Do not have access details? Contact your Domiz Homes advisor.' } : { back: 'Torna a Domiz Homes', eyebrow: 'AREA CLIENTI', title: 'Accedi alla tua vendita', text: 'Qui trovi documenti, progressi e tutti gli accordi principali.', noAccess: 'Questo account non ha ancora accesso all’area clienti.', invalid: 'Indirizzo e-mail o password non corretti.', email: 'Indirizzo e-mail', password: 'Password', login: 'Accedi', help: 'Non hai i dati di accesso? Contatta il tuo consulente Domiz Homes.' };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setIsSubmitting(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), password); const redirect = searchParams.get('redirect'); navigate(redirect?.startsWith('/panel-klienta') ? redirect : '/panel-klienta'); }
    catch { setError(copy.invalid); }
    finally { setIsSubmitting(false); }
  };
  return <main className="client-login"><Link className="client-login__back" to="/"><ArrowLeft size={16} /> {copy.back}</Link><section className="client-login__card"><div className="client-language-switch client-login__languages"><button className={language === 'pl' ? 'is-active' : ''} onClick={() => { setLanguage('pl'); localStorage.setItem('domiz.client-language', 'pl'); }}>PL</button><button className={language === 'en' ? 'is-active' : ''} onClick={() => { setLanguage('en'); localStorage.setItem('domiz.client-language', 'en'); }}>EN</button><button className={language === 'it' ? 'is-active' : ''} onClick={() => { setLanguage('it'); localStorage.setItem('domiz.client-language', 'it'); }}>IT</button></div><div className="client-login__mark"><LockKeyhole size={24} /></div><p className="client-eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.text}</p>{searchParams.get('error') === 'no-access' && <div className="client-login__alert">{copy.noAccess}</div>}{error && <div className="client-login__alert">{error}</div>}<form onSubmit={submit}><label>{copy.email}<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label><label>{copy.password}<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label><button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : copy.login}</button></form><small>{copy.help}</small></section></main>;
}
