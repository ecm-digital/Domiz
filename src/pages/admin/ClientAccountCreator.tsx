import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Check, Copy, KeyRound, Loader2, UserPlus } from 'lucide-react';
import { functions } from '../../firebase';

interface ClientAccountCreatorProps { properties: Array<{ id: number; title: string; location: string }>; }

export function ClientAccountCreator({ properties }: ClientAccountCreatorProps) {
  const defaultProperty = properties.find(item => String(item.id) === '1784754054299') || properties[0];
  const [form, setForm] = useState({ ownerName: '', email: '', password: '', propertyId: defaultProperty ? String(defaultProperty.id) : '', caretakerName: 'Tomasz Gnat' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const selectedProperty = properties.find(item => String(item.id) === form.propertyId);

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage(''); setSaving(true);
    try {
      const create = httpsCallable<{ email: string; password: string; ownerName: string; propertyId: string; propertyTitle: string; propertyLocation: string; caretakerName: string }, { uid: string; message: string }>(functions, 'createClientPortalAccount');
      const result = await create({ ...form, propertyTitle: selectedProperty?.title || '', propertyLocation: selectedProperty?.location || '' });
      setMessage(result.data.message);
    } catch (requestError: any) {
      setError(requestError?.message || 'Nie udało się utworzyć konta klienta.');
    } finally { setSaving(false); }
  };

  const copyMessage = async () => { await navigator.clipboard.writeText(message); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };

  return <div className="glass-panel" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', maxWidth: '940px' }}>
    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}><div style={{ display: 'grid', placeItems: 'center', flex: '0 0 auto', width: '42px', height: '42px', borderRadius: '12px', background: '#e8f8f0', color: '#087653' }}><UserPlus size={21} /></div><div><h2 style={{ margin: 0 }}>Konta klientów</h2><p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Utwórz bezpieczny dostęp do panelu klienta i od razu skopiuj gotową wiadomość WhatsApp po angielsku.</p></div></div>
    <form onSubmit={createAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.9rem', marginTop: '1.35rem' }}>
      <label style={labelStyle}>Imię klienta<input required value={form.ownerName} onChange={event => setForm({ ...form, ownerName: event.target.value })} placeholder="np. Anna Kowalska" style={inputStyle} /></label>
      <label style={labelStyle}>E-mail / login<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="klient@example.com" style={inputStyle} /></label>
      <label style={labelStyle}>Hasło tymczasowe<input required minLength={6} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="minimum 6 znaków" style={inputStyle} /></label>
      <label style={labelStyle}>Opiekun<select value={form.caretakerName} onChange={event => setForm({ ...form, caretakerName: event.target.value })} style={inputStyle}><option>Tomasz Gnat</option><option>Adrian Huber</option></select></label>
      <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Nieruchomość<select required value={form.propertyId} onChange={event => setForm({ ...form, propertyId: event.target.value })} style={inputStyle}><option value="">Wybierz ofertę</option>{properties.map(property => <option key={property.id} value={property.id}>{property.title} · {property.location}</option>)}</select></label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.1rem' }}><button className="btn-primary" disabled={saving} style={{ minHeight: '44px', padding: '0.7rem 1rem', opacity: saving ? 0.7 : 1 }}>{saving ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />} {saving ? 'Tworzenie konta…' : 'Utwórz konto klienta'}</button></div>
    </form>
    {error && <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.6rem', background: '#fff1f2', color: '#be123c', fontSize: '0.85rem' }}>{error}</div>}
    {message && <section style={{ marginTop: '1.25rem', padding: '1rem', border: '1px solid #bbf7d0', borderRadius: '0.75rem', background: '#f0fdf4' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '0.65rem' }}><div><strong style={{ color: '#166534' }}>Konto utworzone</strong><div style={{ color: '#47765b', fontSize: '0.78rem', marginTop: '0.15rem' }}>Skopiuj wiadomość i wyślij ją klientowi przez WhatsApp.</div></div><button type="button" onClick={() => void copyMessage()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.7rem', border: '1px solid #86efac', borderRadius: '0.45rem', background: 'white', color: '#166534', fontWeight: 700, cursor: 'pointer' }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Skopiowano' : 'Kopiuj wiadomość'}</button></div><textarea readOnly value={message} rows={12} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, background: 'white' }} /></section>}
  </div>;
}

const labelStyle: React.CSSProperties = { display: 'grid', gap: '0.38rem', color: '#475569', fontSize: '0.78rem', fontWeight: 700 };
const inputStyle: React.CSSProperties = { width: '100%', minHeight: '42px', padding: '0.62rem 0.72rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: 'white', color: '#1e293b', font: 'inherit' };
