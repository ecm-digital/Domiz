import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import {
    Upload, MapPin, Home, DollarSign, Ruler, Phone,
    Mail, User, ArrowRight, CheckCircle, Building,
    Info, Camera
} from 'lucide-react';
import { db } from '../firebase';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from '../context/useLanguage';

const STEPS = [
    { num: 1, title: "Dane podstawowe", icon: <Home size={20} /> },
    { num: 2, title: "Szczegóły", icon: <Info size={20} /> },
    { num: 3, title: "Kontakt", icon: <Phone size={20} /> },
];

export function AddProperty() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        type: 'dom',
        status: 'sprzedaz',
        title: '',
        price: '',
        location: '',
        area: '',
        rooms: '',
        description: '',
        features: '',
        name: '',
        phone: '',
        email: '',
    });

    const update = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.location.trim() || !form.name.trim() || !form.phone.trim() || !form.email.trim()) {
            trackEvent('lead_form_submit', {
                source: 'add_property_form',
                status: 'validation_error',
            });
            return;
        }
        setSubmitting(true);

        try {
            await addDoc(collection(db, 'inquiries'), {
                type: 'sell-property',
                payload: {
                    ...form,
                    price: Number(form.price) || null,
                    area: Number(form.area) || null,
                    rooms: Number(form.rooms) || null,
                },
                createdAt: new Date().toISOString(),
                source: 'add-property-page',
            });

            trackEvent('lead_form_submit', {
                source: 'add_property_form',
                status: 'success',
            });
            setSubmitted(true);
        } catch (error) {
            console.error(error);
            trackEvent('lead_form_submit', {
                source: 'add_property_form',
                status: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.875rem 1rem',
        borderRadius: '0.625rem',
        border: '1px solid var(--color-border)',
        fontSize: '1rem',
        fontFamily: 'inherit',
        background: 'white',
        color: 'var(--color-text-main)',
        transition: 'all 0.2s ease',
        outline: 'none',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 500 as const,
        color: 'var(--color-text-muted)',
        marginBottom: '0.5rem'
    };

    if (submitted) {
        return (
            <div style={{
                paddingTop: 'var(--header-height)', minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 2rem',
                        boxShadow: '0 12px 30px rgba(16, 185, 129, 0.3)',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}>
                        <CheckCircle size={48} color="white" />
                    </div>
                    <h1 style={{ marginBottom: '1rem' }}>
                        {t('addProperty.successTitle')}
                    </h1>
                    <p style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '1.125rem', maxWidth: '500px',
                        margin: '0 auto 2.5rem', lineHeight: '1.7'
                    }}>
                        {t('addProperty.successDesc')}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-primary" onClick={() => navigate('/')}>
                            {t('addProperty.home')} <ArrowRight size={18} />
                        </button>
                        <button className="btn-secondary" onClick={() => {
                            setSubmitted(false);
                            setStep(1);
                            setForm({
                                type: 'dom', status: 'sprzedaz', title: '', price: '',
                                location: '', area: '', rooms: '', description: '',
                                features: '', name: '', phone: '', email: ''
                            });
                        }}>
                            {t('addProperty.addAnother')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
            {/* Hero */}
            <section style={{
                padding: '5rem 0 3rem', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '20%', right: '20%',
                    width: '500px', height: '500px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    borderRadius: '50%', filter: 'blur(100px)',
                    pointerEvents: 'none'
                }} />
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
                        <span className="section-label">{t('addProperty.label')}</span>
                        <h1 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                            {t('addProperty.heroTitlePrefix')} <span className="text-gradient">Domiz Homes</span>
                        </h1>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1.125rem', lineHeight: '1.7'
                        }}>
                            {t('addProperty.heroDesc')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Form */}
            <section className="section-padding" style={{ paddingTop: '1rem' }}>
                <div className="container" style={{ maxWidth: '780px' }}>
                    {/* Steps */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: '1rem',
                        marginBottom: '3rem', flexWrap: 'wrap'
                    }}>
                        {STEPS.map(s => (
                            <button
                                key={s.num}
                                onClick={() => setStep(s.num)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.875rem 1.5rem', borderRadius: '0.875rem',
                                    border: step === s.num ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    background: step === s.num ? 'rgba(16, 185, 129, 0.08)' : 'white',
                                    color: step === s.num ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                                    fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: step === s.num ? 1 : 0.7
                                }}
                            >
                                <span style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: step === s.num
                                        ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
                                        : 'var(--color-bg-light-alt)',
                                    color: step === s.num ? 'white' : 'var(--color-text-dim)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 700
                                }}>
                                    {step > s.num ? <CheckCircle size={16} /> : s.num}
                                </span>
                                {s.title}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="glass-panel" style={{
                            padding: '2.5rem', borderRadius: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            {/* Step 1 */}
                            {step === 1 && (
                                <div>
                                    <h3 style={{
                                        fontSize: '1.25rem', fontWeight: 600,
                                        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}>
                                        <Building size={20} color="var(--color-primary)" /> Dane Nieruchomości
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                        <div>
                                            <label style={labelStyle}>Typ nieruchomości</label>
                                            <select
                                                style={inputStyle}
                                                value={form.type}
                                                onChange={e => update('type', e.target.value)}
                                            >
                                                <option value="dom">Dom</option>
                                                <option value="mieszkanie">Mieszkanie</option>
                                                <option value="dzialka">Działka</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Rodzaj oferty</label>
                                            <select
                                                style={inputStyle}
                                                value={form.status}
                                                onChange={e => update('status', e.target.value)}
                                            >
                                                <option value="sprzedaz">Sprzedaż</option>
                                                <option value="wynajem">Wynajem</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.25rem' }}>
                                        <label style={labelStyle}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                Tytuł ogłoszenia
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="np. Nowoczesny dom z ogrodem"
                                            style={inputStyle}
                                            value={form.title}
                                            onChange={e => update('title', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                                        <div>
                                            <label style={labelStyle}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <DollarSign size={14} /> Cena (PLN)
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="np. 750 000"
                                                style={inputStyle}
                                                value={form.price}
                                                onChange={e => update('price', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <MapPin size={14} /> Lokalizacja
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="np. Tłuszcz, ul. Warszawska"
                                                style={inputStyle}
                                                value={form.location}
                                                onChange={e => update('location', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2 */}
                            {step === 2 && (
                                <div>
                                    <h3 style={{
                                        fontSize: '1.25rem', fontWeight: 600,
                                        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}>
                                        <Ruler size={20} color="var(--color-primary)" /> Szczegóły
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                        <div>
                                            <label style={labelStyle}>Powierzchnia (m²)</label>
                                            <input
                                                type="number"
                                                placeholder="np. 120"
                                                style={inputStyle}
                                                value={form.area}
                                                onChange={e => update('area', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Liczba pokoi</label>
                                            <input
                                                type="number"
                                                placeholder="np. 4"
                                                style={inputStyle}
                                                value={form.rooms}
                                                onChange={e => update('rooms', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.25rem' }}>
                                        <label style={labelStyle}>Opis nieruchomości</label>
                                        <textarea
                                            placeholder="Opisz swoją nieruchomość – lokalizacja, standard, atuty..."
                                            style={{
                                                ...inputStyle, minHeight: '140px',
                                                resize: 'vertical' as const, fontFamily: 'inherit'
                                            }}
                                            value={form.description}
                                            onChange={e => update('description', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ marginTop: '1.25rem' }}>
                                        <label style={labelStyle}>Cechy (oddzielone przecinkiem)</label>
                                        <input
                                            type="text"
                                            placeholder="np. Garaż, Ogród, Pompa ciepła"
                                            style={inputStyle}
                                            value={form.features}
                                            onChange={e => update('features', e.target.value)}
                                        />
                                    </div>
                                    {/* Photo upload area */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <label style={labelStyle}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <Camera size={14} /> Zdjęcia
                                            </span>
                                        </label>
                                        <div style={{
                                            border: '2px dashed var(--color-border)',
                                            borderRadius: '1rem',
                                            padding: '2.5rem', textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            background: 'rgba(16, 185, 129, 0.02)'
                                        }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.02)';
                                            }}
                                        >
                                            <Upload size={36} color="var(--color-primary)" style={{ marginBottom: '0.75rem' }} />
                                            <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 0.25rem', fontWeight: 500 }}>
                                                Przeciągnij zdjęcia lub kliknij aby wybrać
                                            </p>
                                            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', margin: 0 }}>
                                                JPG, PNG do 10MB każde, max. 15 zdjęć
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3 */}
                            {step === 3 && (
                                <div>
                                    <h3 style={{
                                        fontSize: '1.25rem', fontWeight: 600,
                                        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}>
                                        <User size={20} color="var(--color-primary)" /> Dane Kontaktowe
                                    </h3>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={labelStyle}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <User size={14} /> Imię i nazwisko
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Jan Kowalski"
                                            style={inputStyle}
                                            value={form.name}
                                            onChange={e => update('name', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                        <div>
                                            <label style={labelStyle}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <Phone size={14} /> Telefon
                                                </span>
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="+48 517 303 400"
                                                style={inputStyle}
                                                value={form.phone}
                                                onChange={e => update('phone', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <Mail size={14} /> Email
                                                </span>
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="jan@email.com"
                                                style={inputStyle}
                                                value={form.email}
                                                onChange={e => update('email', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="glass-panel" style={{
                                        marginTop: '2rem', padding: '1.5rem',
                                        borderRadius: '1rem',
                                        border: '1px solid rgba(16, 185, 129, 0.15)',
                                        background: 'rgba(16, 185, 129, 0.03)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            <CheckCircle size={20} color="var(--color-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <div>
                                                <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                                                    Co dalej?
                                                </p>
                                                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                                                    Po wysłaniu formularza nasz agent skontaktuje się z Tobą w ciągu 24h,
                                                    aby umówić wizję lokalną i przygotować profesjonalną sesję zdjęciową.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            gap: '1rem', flexWrap: 'wrap'
                        }}>
                            {step > 1 ? (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setStep(s => s - 1)}
                                >
                                    ← Wstecz
                                </button>
                            ) : <div />}
                            {step < 3 ? (
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => setStep(s => s + 1)}
                                >
                                    Dalej <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'} <ArrowRight size={18} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </section>
        </div>
    );
}
