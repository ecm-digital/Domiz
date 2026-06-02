import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
    Clock, Leaf, CheckCircle, ArrowRight,
    Phone, ChevronRight, ShieldCheck, Ruler
} from 'lucide-react';

const BENEFITS = [
    {
        icon: <Clock size={28} />,
        title: "Szybka realizacja",
        desc: "Domy modułowe powstają w fabryce równolegle z przygotowaniem działki. Montaż na miejscu trwa zaledwie kilka dni.",
        features: ["2–4 miesiące do kluczy", "Kontrolowana jakość", "Niezależnie od pogody"],
        color: "rgba(16, 185, 129, 0.1)"
    },
    {
        icon: <Ruler size={28} />,
        title: "Projekt na miarę",
        desc: "Dopasowujemy układ i metraż do Twoich potrzeb. Od kompaktowych domków po przestronne rezydencje.",
        features: ["Indywidualne projekty", "Elastyczne moduły", "Rozbudowa w przyszłości"],
        color: "rgba(59, 130, 246, 0.1)"
    },
    {
        icon: <Leaf size={28} />,
        title: "Energooszczędność",
        desc: "Nowoczesna konstrukcja, dobra izolacja i możliwość montażu pomp ciepła oraz fotowoltaiki od samego początku.",
        features: ["Niskie rachunki", "Ekologiczne materiały", "Certyfikaty energetyczne"],
        color: "rgba(34, 197, 94, 0.1)"
    },
    {
        icon: <ShieldCheck size={28} />,
        title: "Trwałość i gwarancja",
        desc: "Solidna konstrukcja szkieletowa, materiały od sprawdzonych dostawców oraz wieloletnia gwarancja na dom.",
        features: ["Gwarancja na konstrukcję", "Odporne na warunki", "Długi okres użytkowania"],
        color: "rgba(245, 158, 11, 0.1)"
    }
];

const PROCESS_STEPS = [
    { step: "01", title: "Konsultacja i wybór projektu", desc: "Omawiamy potrzeby, działkę i budżet. Wybieramy lub dopasowujemy projekt." },
    { step: "02", title: "Produkcja modułów", desc: "Twój dom powstaje w hali – w stałych warunkach, z kontrolą jakości." },
    { step: "03", title: "Przygotowanie działki", desc: "Fundament, przyłącza. W tym czasie moduły są już w produkcji." },
    { step: "04", title: "Montaż i wykończenie", desc: "Dostawa, montaż w kilka dni, wykończenie pod klucz i odbiór." },
];

export function ModularHomes() {
    const navigate = useNavigate();

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
            <div className="container" style={{ paddingTop: '1rem' }}>
                <Breadcrumbs items={[{ label: 'Domy modułowe' }]} />
            </div>
            {/* Hero */}
            <section style={{
                padding: '5rem 0 3rem', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '30%', right: '10%',
                    width: '500px', height: '500px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    borderRadius: '50%', filter: 'blur(100px)',
                    pointerEvents: 'none'
                }} />
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
                        <span className="section-label">Domy modułowe</span>
                        <h1 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                            Nowoczesne <span className="text-gradient">Domy Modułowe</span>
                        </h1>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1.125rem', lineHeight: '1.7',
                            maxWidth: '600px', margin: '0 auto 2rem'
                        }}>
                            Szybka realizacja, wysoka jakość i energooszczędność. Twój wymarzony dom
                            w kilka miesięcy – bez wieloletniego oczekiwania na budowę.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => navigate('/osiedle-tluszcz#kontakt')}>
                                Umów konsultację <ArrowRight size={18} />
                            </button>
                            <button className="btn-secondary" onClick={() => navigate('/domy-modulowe/konfigurator')}>
                                Skonfiguruj dom
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="section-padding">
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        <span className="section-label">Dlaczego warto</span>
                        <h2 style={{ marginTop: '0.5rem' }}>
                            Zalety <span className="text-gradient">Domów Modułowych</span>
                        </h2>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {BENEFITS.map((item, idx) => (
                            <div key={idx} className="glass-panel" style={{
                                padding: '2rem', borderRadius: '1.25rem',
                                display: 'flex', flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute', top: '-30px', right: '-30px',
                                    width: '120px', height: '120px',
                                    background: item.color,
                                    borderRadius: '50%', filter: 'blur(40px)',
                                    pointerEvents: 'none'
                                }} />
                                <div style={{
                                    width: '64px', height: '64px',
                                    background: item.color,
                                    borderRadius: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '1.25rem',
                                    border: '1px solid rgba(16, 185, 129, 0.15)',
                                    color: 'var(--color-primary-dark)'
                                }}>
                                    {item.icon}
                                </div>
                                <h3 style={{
                                    fontSize: '1.25rem', fontWeight: 600,
                                    marginBottom: '0.75rem', color: 'var(--color-text-main)'
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{
                                    color: 'var(--color-text-secondary)',
                                    lineHeight: '1.7', fontSize: '0.95rem',
                                    marginBottom: '1.25rem', flexGrow: 1
                                }}>
                                    {item.desc}
                                </p>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                    paddingTop: '1rem', borderTop: '1px solid var(--color-border)'
                                }}>
                                    {item.features.map((f, i) => (
                                        <span key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            color: 'var(--color-text-muted)', fontSize: '0.875rem'
                                        }}>
                                            <CheckCircle size={14} color="#10b981" /> {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process */}
            <section className="section-padding" style={{ background: 'var(--color-bg-light-alt)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem' }}>
                        <span className="section-label">Jak to działa</span>
                        <h2 style={{ marginTop: '0.5rem' }}>
                            Prosty <span className="text-gradient">Proces</span> Od Pomysłu do Kluczy
                        </h2>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '2rem', position: 'relative'
                    }}>
                        {PROCESS_STEPS.map((s, idx) => (
                            <div key={idx} style={{
                                textAlign: 'center', position: 'relative',
                                display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}>
                                <div style={{
                                    width: '80px', height: '80px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '1.5rem', fontWeight: 800,
                                    marginBottom: '1.5rem',
                                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                                }}>
                                    {s.step}
                                </div>
                                {idx < PROCESS_STEPS.length - 1 && (
                                    <ChevronRight size={24} style={{
                                        position: 'absolute', right: '-1rem', top: '28px',
                                        color: 'var(--color-text-dim)',
                                        display: 'none'
                                    }} className="process-arrow" />
                                )}
                                <h3 style={{
                                    fontSize: '1.1rem', fontWeight: 600,
                                    marginBottom: '0.5rem', color: 'var(--color-text-main)'
                                }}>
                                    {s.title}
                                </h3>
                                <p style={{
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '220px'
                                }}>
                                    {s.desc}
                                </p>
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
                            Chcesz wiedzieć więcej o <span className="text-gradient">domach modułowych</span>?
                        </h2>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1.125rem', maxWidth: '500px',
                            margin: '0 auto 2rem'
                        }}>
                            Skontaktuj się z nami – chętnie odpowiemy na pytania i przygotujemy indywidualną wycenę.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href="tel:+48517303400" className="btn-primary" style={{ textDecoration: 'none' }}>
                                <Phone size={18} /> Zadzwoń
                            </a>
                            <button className="btn-secondary" onClick={() => navigate('/osiedle-tluszcz#kontakt')}>
                                Formularz kontaktowy
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
