import { Hero } from '../components/Hero';
import { PropertyCard } from '../components/PropertyCard';
import { ArrowRight, Star, Shield, Clock } from 'lucide-react';

const FEATURED_PROPERTIES = [
    {
        id: 1,
        title: "Nowoczesna Willa z Basenem",
        price: "1 250 000 PLN",
        location: "Tłuszcz, Aleja Lipowa",
        beds: 4,
        baths: 3,
        sqft: 220,
        image: "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop"
    },
    {
        id: 2,
        title: "Apartament w Centrum",
        price: "450 000 PLN",
        location: "Tłuszcz, ul. Warszawska",
        beds: 2,
        baths: 1,
        sqft: 65,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop"
    },
    {
        id: 3,
        title: "Dom Rodzinny na Przedmieściach",
        price: "890 000 PLN",
        location: "Jasienica, ul. Centralna",
        beds: 5,
        baths: 2,
        sqft: 180,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop"
    }
];



export function Home() {
    return (
        <div style={{ minHeight: '100vh' }}>
            <Hero />

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
                        >
                            Zobacz wszystkie <ArrowRight size={20} />
                        </button>
                    </div>

                    <div className="properties-grid">
                        {FEATURED_PROPERTIES.map((prop) => (
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
                            <button className="btn-primary">
                                Skontaktuj się z nami
                            </button>
                            <button className="btn-secondary">
                                Zobacz kalkulatory
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
