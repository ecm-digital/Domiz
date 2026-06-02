import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wifi, Thermometer, Lock, Lightbulb, Camera, Speaker,
    Smartphone, Zap, Shield, ChevronRight, CheckCircle,
    ArrowRight, Volume2, Sun, Wind
} from 'lucide-react';

const SMART_FEATURES = [
    {
        icon: <Lightbulb size={28} />,
        title: "Inteligentne Oświetlenie",
        desc: "Automatyczna regulacja jasności i barwy światła w zależności od pory dnia i aktywności. Scenariusze oświetleniowe sterowane głosem i aplikacją.",
        gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
    },
    {
        icon: <Thermometer size={28} />,
        title: "Klimatyzacja & Grzanie",
        desc: "Inteligentny termostat uczący się Twoich preferencji. Ogrzewanie podłogowe sterowane strefowo, pompa ciepła z rekuperacją.",
        gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
    },
    {
        icon: <Lock size={28} />,
        title: "Zamki Elektroniczne",
        desc: "Dostęp bez kluczy – odcisk palca, kod PIN, karta lub telefon. Zdalne nadawanie dostępów dla gości i serwisantów.",
        gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
    },
    {
        icon: <Camera size={28} />,
        title: "Monitoring 24/7",
        desc: "Kamery IP z AI rozpoznającym ruch i powiadomienia na telefon w czasie rzeczywistym. Zapis w chmurze z 30-dniową historią.",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
    },
    {
        icon: <Speaker size={28} />,
        title: "System Audio Multiroom",
        desc: "Muzyka w każdym pomieszczeniu sterowana głosem. Integracja ze Spotify, Apple Music i radiem internetowym.",
        gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
    },
    {
        icon: <Shield size={28} />,
        title: "System Alarmowy",
        desc: "Czujniki otwarcia, ruchu, dymu i zalania. Automatyczne powiadamianie służb i centrala monitoringu 24h.",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    }
];

const ECOSYSTEMS = [
    { name: "Apple HomeKit", icon: <Smartphone size={20} />, features: ["Siri", "HomePod", "Apple TV"] },
    { name: "Google Home", icon: <Volume2 size={20} />, features: ["Asystent Google", "Nest Hub", "Chromecast"] },
    { name: "Amazon Alexa", icon: <Wifi size={20} />, features: ["Echo", "Routines", "Skills"] },
    { name: "KNX / Z-Wave", icon: <Zap size={20} />, features: ["Otwarte", "Profesjonalne", "Niezawodne"] },
];

const PACKAGES = [
    {
        name: "Starter",
        price: "od 5 000 zł",
        desc: "Idealne na początek przygody ze smart home",
        features: [
            "Inteligentne oświetlenie (do 8 pomieszczeń)",
            "Termostat WiFi",
            "2 czujniki otwarcia drzwi",
            "Asystent głosowy",
            "Konfiguracja i szkolenie"
        ],
        popular: false
    },
    {
        name: "Premium",
        price: "od 15 000 zł",
        desc: "Najpopularniejszy pakiet dla nowoczesnych domów",
        features: [
            "Wszystko z pakietu Starter",
            "System alarmowy z czujnikami",
            "Zamek elektroniczny",
            "Monitoring 2 kamery IP",
            "System audio 3 strefy",
            "Automatyka rolet/bram",
            "Scenariusze automatyzacji"
        ],
        popular: true
    },
    {
        name: "Prestige",
        price: "od 35 000 zł",
        desc: "Pełna automatyzacja dla wymagających",
        features: [
            "Wszystko z pakietu Premium",
            "KNX/Z-Wave profesjonalny",
            "Multiroom audio cały dom",
            "Monitoring 6 kamer + AI",
            "Ogrzewanie podłogowe strefowe",
            "Panel fotowoltaiczny + integracja",
            "Dedykowany opiekun systemu",
            "Serwis gwarancyjny 3 lata"
        ],
        popular: false
    }
];

export function SmartHome() {
    const navigate = useNavigate();
    const [activeEco, setActiveEco] = useState(0);

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
            {/* Hero */}
            <section style={{
                padding: '5rem 0 3rem', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
                    width: '700px', height: '700px',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
                    pointerEvents: 'none'
                }} />
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
                        <span className="section-label">Smart Home</span>
                        <h1 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                            Dom, Który <span className="text-gradient">Myśli za Ciebie</span>
                        </h1>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1.125rem', lineHeight: '1.7',
                            maxWidth: '600px', margin: '0 auto 2rem'
                        }}>
                            Automatyka domowa, inteligentne systemy zarządzania i bezpieczeństwa.
                            Twój dom, Twoje zasady – sterowanie z dowolnego miejsca na świecie.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => navigate('/osiedle-tluszcz#kontakt')}>
                                Umów prezentację <ArrowRight size={18} />
                            </button>
                            <button className="btn-secondary" onClick={() =>
                                document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })
                            }>
                                Zobacz pakiety
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{ paddingBottom: '3rem' }}>
                <div className="container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1.5rem',
                    }}>
                        {[
                            { icon: <Sun size={24} />, val: "40%", label: "Oszczędność energii" },
                            { icon: <Shield size={24} />, val: "24/7", label: "Monitoring" },
                            { icon: <Wind size={24} />, val: "100+", label: "Urządzeń w sieci" },
                            { icon: <Smartphone size={24} />, val: "1", label: "Aplikacja do sterowania" },
                        ].map((s, i) => (
                            <div key={i} className="glass-panel" style={{
                                padding: '1.5rem', textAlign: 'center', borderRadius: '1rem'
                            }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 0.75rem', color: 'var(--color-primary)'
                                }}>
                                    {s.icon}
                                </div>
                                <p style={{
                                    fontSize: '2rem', fontWeight: 800, margin: 0,
                                    background: 'linear-gradient(135deg, var(--color-text-main) 0%, var(--color-primary-dark) 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    {s.val}
                                </p>
                                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {s.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="section-padding">
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        <h2>Możliwości <span className="text-gradient">Smart Home</span></h2>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {SMART_FEATURES.map((f, idx) => (
                            <div key={idx} className="glass-panel" style={{
                                padding: '2rem', borderRadius: '1.25rem',
                                display: 'flex', flexDirection: 'column',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute', top: '-20px', right: '-20px',
                                    width: '100px', height: '100px',
                                    background: f.gradient, opacity: 0.08,
                                    borderRadius: '50%', filter: 'blur(30px)',
                                    pointerEvents: 'none'
                                }} />
                                <div style={{
                                    width: '56px', height: '56px',
                                    background: f.gradient,
                                    borderRadius: '0.875rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', marginBottom: '1.25rem'
                                }}>
                                    {f.icon}
                                </div>
                                <h3 style={{
                                    fontSize: '1.15rem', fontWeight: 600,
                                    marginBottom: '0.75rem', color: 'var(--color-text-main)'
                                }}>
                                    {f.title}
                                </h3>
                                <p style={{
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: '1.7', fontSize: '0.9rem', margin: 0
                                }}>
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Ecosystems */}
            <section className="section-padding" style={{ background: 'var(--color-bg-light-alt)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        <span className="section-label">Kompatybilność</span>
                        <h2 style={{ marginTop: '0.5rem' }}>
                            Wspieramy <span className="text-gradient">Wszystkie</span> Ekosystemy
                        </h2>
                    </div>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{
                            display: 'flex', gap: '0.75rem', justifyContent: 'center',
                            marginBottom: '2rem', flexWrap: 'wrap'
                        }}>
                            {ECOSYSTEMS.map((eco, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveEco(idx)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
                                        border: `1px solid ${activeEco === idx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        background: activeEco === idx ? 'rgba(16, 185, 129, 0.08)' : 'white',
                                        color: activeEco === idx ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                                        fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {eco.icon} {eco.name}
                                </button>
                            ))}
                        </div>
                        <div className="glass-panel" style={{
                            padding: '2rem', borderRadius: '1.25rem',
                            display: 'flex', flexDirection: 'column', gap: '1rem'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {ECOSYSTEMS[activeEco].name}
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {ECOSYSTEMS[activeEco].features.map((f, i) => (
                                    <span key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        background: 'rgba(16, 185, 129, 0.08)',
                                        padding: '0.5rem 1rem', borderRadius: '999px',
                                        color: 'var(--color-primary-dark)', fontSize: '0.875rem', fontWeight: 500
                                    }}>
                                        <ChevronRight size={14} /> {f}
                                    </span>
                                ))}
                            </div>
                            <p style={{
                                color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.7', margin: 0
                            }}>
                                Pełna integracja z ekosystemem {ECOSYSTEMS[activeEco].name}. Konfigurujemy urządzenia,
                                tworzymy scenariusze automatyzacji i szkolimy z obsługi.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Packages */}
            <section className="section-padding" id="packages">
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        <span className="section-label">Cennik</span>
                        <h2 style={{ marginTop: '0.5rem' }}>
                            Pakiety <span className="text-gradient">Smart Home</span>
                        </h2>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem', alignItems: 'stretch'
                    }}>
                        {PACKAGES.map((pkg, idx) => (
                            <div key={idx} className="glass-panel" style={{
                                padding: '2.5rem 2rem',
                                borderRadius: '1.25rem',
                                display: 'flex', flexDirection: 'column',
                                border: pkg.popular ? '2px solid var(--color-primary)' : undefined,
                                boxShadow: pkg.popular ? '0 8px 30px rgba(16, 185, 129, 0.15)' : undefined,
                                position: 'relative'
                            }}>
                                {pkg.popular && (
                                    <span style={{
                                        position: 'absolute', top: '-12px', left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                                        color: 'white',
                                        padding: '0.375rem 1.25rem', borderRadius: '999px',
                                        fontSize: '0.8rem', fontWeight: 600
                                    }}>
                                        Najpopularniejszy
                                    </span>
                                )}
                                <h3 style={{
                                    fontSize: '1.35rem', fontWeight: 700,
                                    marginBottom: '0.25rem', color: 'var(--color-text-main)'
                                }}>
                                    {pkg.name}
                                </h3>
                                <p style={{
                                    color: 'var(--color-text-dim)',
                                    fontSize: '0.875rem', marginBottom: '1rem'
                                }}>
                                    {pkg.desc}
                                </p>
                                <p style={{
                                    fontSize: '2rem', fontWeight: 800, margin: '0 0 1.5rem',
                                    background: 'linear-gradient(135deg, var(--color-text-main) 0%, var(--color-primary-dark) 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    {pkg.price}
                                </p>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: '0.625rem',
                                    flexGrow: 1, marginBottom: '1.5rem'
                                }}>
                                    {pkg.features.map((f, i) => (
                                        <span key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            color: 'var(--color-text-secondary)', fontSize: '0.9rem'
                                        }}>
                                            <CheckCircle size={16} color="#10b981" /> {f}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    className={pkg.popular ? 'btn-primary' : 'btn-secondary'}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={() => navigate('/osiedle-tluszcz#kontakt')}
                                >
                                    Wybierz pakiet
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section-padding cta-section" style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
                    pointerEvents: 'none'
                }} />
                <div className="container">
                    <div className="glass-panel" style={{
                        padding: '4rem 3rem', textAlign: 'center',
                        maxWidth: '800px', margin: '0 auto',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                        <h2 style={{ marginBottom: '1rem' }}>
                            Gotowy na <span className="text-gradient">inteligentny dom</span>?
                        </h2>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1.125rem', maxWidth: '500px',
                            margin: '0 auto 2rem'
                        }}>
                            Umów bezpłatną prezentację systemu Smart Home w naszym showroomie.
                        </p>
                        <button className="btn-primary" onClick={() => navigate('/osiedle-tluszcz#kontakt')}>
                            Umów prezentację <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
