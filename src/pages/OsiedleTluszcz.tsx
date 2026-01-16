import { Home, Thermometer, Wrench, Shield, MapPin, ShoppingCart, Trees, School, Heart, Train, Building, Dumbbell, Phone, Mail, Check, X } from 'lucide-react';

const NEARBY_PLACES = [
    { icon: ShoppingCart, name: 'Biedronka', distance: '500m' },
    { icon: School, name: 'Szkoła Podstawowa', distance: '800m' },
    { icon: Heart, name: 'Przychodnia', distance: '1.2km' },
    { icon: Train, name: 'Stacja PKP', distance: '1.5km' },
    { icon: Trees, name: 'Park Miejski', distance: '600m' },
    { icon: Building, name: 'Urząd Miasta', distance: '1km' },
    { icon: Dumbbell, name: 'Siłownia', distance: '900m' },
    { icon: ShoppingCart, name: 'Lidl', distance: '700m' },
];

const PRICING_PACKAGES = [
    {
        name: 'Stan Inwestorski',
        price: '790 000',
        features: [
            { name: 'Ściany działowe', included: true },
            { name: 'Instalacja elektryczna', included: true },
            { name: 'Instalacja wod-kan', included: true },
            { name: 'Ogrzewanie podłogowe', included: true },
            { name: 'Tynki', included: false },
            { name: 'Wylewki', included: false },
            { name: 'Biały montaż', included: false },
        ],
        highlighted: false,
    },
    {
        name: 'Pod Klucz',
        price: '890 000',
        features: [
            { name: 'Ściany działowe', included: true },
            { name: 'Instalacja elektryczna', included: true },
            { name: 'Instalacja wod-kan', included: true },
            { name: 'Ogrzewanie podłogowe', included: true },
            { name: 'Tynki', included: true },
            { name: 'Wylewki', included: true },
            { name: 'Biały montaż', included: false },
        ],
        highlighted: false,
    },
    {
        name: 'Budżet Eco',
        price: '940 000',
        features: [
            { name: 'Ściany działowe', included: true },
            { name: 'Instalacja elektryczna', included: true },
            { name: 'Instalacja wod-kan', included: true },
            { name: 'Ogrzewanie podłogowe', included: true },
            { name: 'Tynki', included: true },
            { name: 'Wylewki', included: true },
            { name: 'Biały montaż', included: true },
        ],
        highlighted: false,
    },
    {
        name: 'Premium',
        price: '1 050 000',
        features: [
            { name: 'Ściany działowe', included: true },
            { name: 'Instalacja elektryczna', included: true },
            { name: 'Instalacja wod-kan', included: true },
            { name: 'Ogrzewanie podłogowe', included: true },
            { name: 'Tynki', included: true },
            { name: 'Wylewki', included: true },
            { name: 'Biały montaż', included: true },
            { name: 'Wykończenie premium', included: true },
        ],
        highlighted: true,
    },
];

const FLOOR_PLANS = [
    { floor: 'Parter', rooms: 'Salon + kuchnia', area: '45 m²', desc: 'Otwarta przestrzeń' },
    { floor: 'Parter', rooms: 'Łazienka', area: '6 m²', desc: 'Z prysznicem' },
    { floor: 'Parter', rooms: 'Pomieszczenie gospodarcze', area: '4 m²', desc: 'Pralnia/kotłownia' },
    { floor: 'Piętro', rooms: '3 sypialnie', area: '36 m²', desc: '12 m² każda' },
    { floor: 'Piętro', rooms: 'Łazienka', area: '8 m²', desc: 'Z wanną' },
    { floor: 'Piętro', rooms: 'Garderoba', area: '5 m²', desc: 'Przy sypialni głównej' },
];

export function OsiedleTluszcz() {
    return (
        <div style={{ background: '#f8faf9' }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                paddingTop: '120px',
                paddingBottom: '3rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    filter: 'blur(100px)'
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '9999px',
                        marginBottom: '1.5rem'
                    }}>
                        <Home size={24} />
                        <span style={{ fontWeight: '600' }}>OFERTA SPECJALNA</span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: '800',
                        marginBottom: '1rem',
                        color: 'white'
                    }}>
                        Tłuszcz
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '3rem' }}>
                        Nowoczesne osiedle domów jednorodzinnych
                    </p>

                    {/* Feature Pills */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '2rem',
                        flexWrap: 'wrap'
                    }}>
                        {[
                            { icon: Thermometer, text: 'Podłogówka w cenie' },
                            { icon: Wrench, text: 'Możliwe zmiany projektu' },
                            { icon: Shield, text: 'Gwarancja 5 lat' },
                        ].map((feature, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'rgba(255,255,255,0.15)',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '0.5rem',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <feature.icon size={20} />
                                <span style={{ fontWeight: '500' }}>{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section style={{ padding: '5rem 0', background: 'white' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '1rem'
                        }}>
                            Osiedle domów w <span style={{ color: '#10b981' }}>Tłuszczu</span>
                        </h2>
                        <p style={{ color: '#6b7280', maxWidth: '700px', margin: '0 auto' }}>
                            Nowoczesne osiedle domów jednorodzinnych położone w spokojnej okolicy miasta Tłuszcz, z doskonałym dojazdem do Warszawy.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '3rem',
                        alignItems: 'center'
                    }}>
                        <div>
                            <p style={{ color: '#4b5563', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                                Budujemy nowoczesne, energooszczędne domy jednorodzinne w standardzie deweloperskim lub pod klucz.
                                Każdy dom posiada <strong>ogrzewanie podłogowe</strong>, doskonałą izolację termiczną oraz nowoczesne rozwiązania techniczne.
                            </p>
                            <p style={{ color: '#4b5563', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                                Osiedle znajduje się w pobliżu wszystkich niezbędnych usług - szkół, sklepów, przychodni oraz stacji PKP
                                zapewniającej szybki dojazd do centrum Warszawy (ok. 40 minut).
                            </p>
                            <p style={{ color: '#4b5563', lineHeight: '1.8' }}>
                                Możliwość wprowadzenia zmian w projekcie według indywidualnych potrzeb klienta.
                                Oferujemy również pomoc w uzyskaniu kredytu hipotecznego.
                            </p>
                        </div>
                        <div style={{
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                        }}>
                            <img
                                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop"
                                alt="Osiedle domów"
                                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Nearby Section */}
            <section style={{ padding: '4rem 0', background: '#f8faf9' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '3rem'
                    }}>
                        W pobliżu
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {NEARBY_PLACES.map((place, i) => (
                            <div key={i} style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '0.75rem',
                                textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                }}
                            >
                                <place.icon size={28} style={{ color: '#10b981', marginBottom: '0.75rem' }} />
                                <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem' }}>{place.name}</p>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{place.distance}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section style={{ padding: '5rem 0', background: 'white' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h2 style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '0.5rem'
                        }}>
                            Cennik
                        </h2>
                        <p style={{ color: '#6b7280' }}>Ceny brutto za dom</p>
                    </div>

                    {/* Size Tabs */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '3rem',
                        flexWrap: 'wrap'
                    }}>
                        {['80', '100', '120'].map((size, i) => (
                            <button
                                key={size}
                                style={{
                                    padding: '0.625rem 1.5rem',
                                    borderRadius: '9999px',
                                    border: 'none',
                                    background: i === 1 ? '#10b981' : '#e5e7eb',
                                    color: i === 1 ? 'white' : '#4b5563',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {size} m²
                            </button>
                        ))}
                    </div>

                    <h3 style={{
                        textAlign: 'center',
                        marginBottom: '2rem',
                        color: '#1f2937',
                        fontWeight: '600'
                    }}>
                        Wybierz pakiet wykończenia
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {PRICING_PACKAGES.map((pkg, i) => (
                            <div key={i} style={{
                                background: pkg.highlighted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'white',
                                padding: '2rem',
                                borderRadius: '1rem',
                                border: pkg.highlighted ? 'none' : '1px solid #e5e7eb',
                                color: pkg.highlighted ? 'white' : '#1f2937',
                                position: 'relative',
                                boxShadow: pkg.highlighted ? '0 20px 40px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
                            }}>
                                {pkg.highlighted && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-12px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: '#fbbf24',
                                        color: '#1f2937',
                                        padding: '0.25rem 1rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}>
                                        POLECANY
                                    </div>
                                )}

                                <h4 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    marginBottom: '1rem',
                                    marginTop: pkg.highlighted ? '0.5rem' : 0
                                }}>
                                    {pkg.name}
                                </h4>

                                <p style={{
                                    fontSize: '2rem',
                                    fontWeight: '800',
                                    marginBottom: '1.5rem'
                                }}>
                                    {pkg.price} <span style={{ fontSize: '1rem', fontWeight: '400' }}>PLN</span>
                                </p>

                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
                                    {pkg.features.map((feature, j) => (
                                        <li key={j} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginBottom: '0.5rem',
                                            fontSize: '0.875rem',
                                            opacity: feature.included ? 1 : 0.5
                                        }}>
                                            {feature.included ? (
                                                <Check size={16} style={{ color: pkg.highlighted ? 'white' : '#10b981' }} />
                                            ) : (
                                                <X size={16} />
                                            )}
                                            {feature.name}
                                        </li>
                                    ))}
                                </ul>

                                <button style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: pkg.highlighted ? '2px solid white' : '1px solid #10b981',
                                    background: pkg.highlighted ? 'transparent' : 'white',
                                    color: pkg.highlighted ? 'white' : '#10b981',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                    {pkg.highlighted ? 'Zarezerwuj' : 'Dowiedz się więcej'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Floor Plans Section */}
            <section style={{ padding: '4rem 0', background: '#f8faf9' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '0.5rem'
                    }}>
                        Rzuty pięter
                    </h2>
                    <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
                        Dom 100 m² - Typ A
                    </p>

                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f3f4f6' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Piętro</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Pomieszczenie</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Powierzchnia</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Opis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {FLOOR_PLANS.map((plan, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '1rem', color: '#4b5563' }}>{plan.floor}</td>
                                        <td style={{ padding: '1rem', color: '#1f2937', fontWeight: '500' }}>{plan.rooms}</td>
                                        <td style={{ padding: '1rem', color: '#10b981', fontWeight: '600' }}>{plan.area}</td>
                                        <td style={{ padding: '1rem', color: '#6b7280' }}>{plan.desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section style={{ padding: '4rem 0', background: 'white' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '2rem'
                    }}>
                        Galeria
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem'
                    }}>
                        {[
                            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670',
                            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675',
                            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653',
                        ].map((img, i) => (
                            <div key={i} style={{
                                borderRadius: '0.75rem',
                                overflow: 'hidden',
                                height: '220px'
                            }}>
                                <img
                                    src={img}
                                    alt={`Galeria ${i + 1}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.3s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA Section */}
            <section style={{ padding: '4rem 0', background: '#f8faf9' }}>
                <div className="container">
                    <div style={{
                        background: 'white',
                        borderRadius: '1.5rem',
                        padding: '3rem',
                        maxWidth: '600px',
                        margin: '0 auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        textAlign: 'center'
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '1.5rem'
                        }}>
                            Podoba Ci się ta oferta?
                        </h2>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            justifyContent: 'center'
                        }}>
                            <img
                                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200"
                                alt="Agent"
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                }}
                            />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>Tomasz Gnat</p>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Specjalista ds. nieruchomości</p>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                justifyContent: 'center',
                                color: '#4b5563'
                            }}>
                                <Phone size={18} style={{ color: '#10b981' }} />
                                <span>+48 123 456 789</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                justifyContent: 'center',
                                color: '#4b5563'
                            }}>
                                <Mail size={18} style={{ color: '#10b981' }} />
                                <span>kontakt@domizhomes.pl</span>
                            </div>
                        </div>

                        <button className="btn-primary" style={{
                            width: '100%',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        }}>
                            Umów prezentację
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
