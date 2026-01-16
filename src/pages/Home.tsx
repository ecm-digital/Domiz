import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { PropertyCard } from '../components/PropertyCard';
import { ArrowRight, Star, Shield, Clock } from 'lucide-react';
import { PROPERTIES } from '../data/properties';

export function Home() {
    const navigate = useNavigate();
    const featuredProperties = PROPERTIES.filter(p => p.featured).slice(0, 3);

    return (
        <div style={{ minHeight: '100vh' }}>
            <Hero />
            {/* ... Features Section ... */}
            {/* Features Section */}
            <section className="section-padding" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '800px', height: '800px', background: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: '50%', filter: 'blur(100px)', zIndex: -1, pointerEvents: 'none'
                }} />

                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Dlaczego <span className="text-gradient">Domiz Homes</span>?</h2>
                        <p style={{ color: '#9ca3af', fontSize: '1.125rem', lineHeight: '1.7' }}>
                            Oferujemy kompleksowe wsparcie na każdym etapie transakcji. Zaufaj ekspertom z wieloletnim doświadczeniem.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {[
                            {
                                icon: <Star color="#34d399" size={28} />,
                                title: "Premium Standard",
                                desc: "Tylko zweryfikowane i sprawdzone nieruchomości w najlepszych lokalizacjach."
                            },
                            {
                                icon: <Shield color="#34d399" size={28} />,
                                title: "Bezpieczna Transakcja",
                                desc: "Pełna opieka prawna nad każdym etapem zakupu i sprzedaży."
                            },
                            {
                                icon: <Clock color="#34d399" size={28} />,
                                title: "Oszczędność Czasu",
                                desc: "Dopasujemy oferty idealnie do Twoich potrzeb i możliwości."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="glass-panel feature-card">
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'white' }}>{feature.title}</h3>
                                <p style={{ color: '#9ca3af', lineHeight: '1.7', margin: 0 }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Properties Section */}
            <section className="section-padding" style={{ background: 'var(--color-bg-darker)' }}>
                <div className="container">
                    <div className="section-header">
                        <div>
                            <span className="section-label">Oferta</span>
                            <h2 style={{ marginTop: '0.5rem' }}>Wyróżnione Nieruchomości</h2>
                        </div>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: '#34d399', background: 'none', border: 'none',
                            fontWeight: '500', cursor: 'pointer', fontSize: '1rem',
                            transition: 'gap 0.2s ease'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.gap = '0.75rem'}
                            onMouseLeave={(e) => e.currentTarget.style.gap = '0.5rem'}
                            onClick={() => navigate('/oferty')}
                        >
                            Zobacz wszystkie <ArrowRight size={20} />
                        </button>
                    </div>

                    <div className="properties-grid">
                        {featuredProperties.map((prop) => (
                            <PropertyCard key={prop.id} {...prop} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section-padding cta-section" style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
                    pointerEvents: 'none'
                }} />
                <div className="container">
                    <div className="glass-panel" style={{
                        padding: '4rem 3rem',
                        borderRadius: '1.5rem',
                        textAlign: 'center',
                        maxWidth: '800px',
                        margin: '0 auto',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        position: 'relative'
                    }}>
                        <h2 style={{ marginBottom: '1rem' }}>Gotowy na zmianę adresu?</h2>
                        <p style={{ color: '#d1d5db', fontSize: '1.125rem', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                            Skontaktuj się z nami już dziś. Pomożemy Ci znaleźć Twój wymarzony nowy dom.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => navigate('/osiedle-tluszcz')}>
                                Skontaktuj się z nami
                            </button>
                            <button className="btn-secondary" onClick={() => navigate('/kalkulatory')}>
                                Zobacz kalkulatory
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
