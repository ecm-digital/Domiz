import { useParams, useNavigate } from 'react-router-dom';
import { PROPERTIES } from '../data/properties';
import { MapPin, Bed, Bath, Square, ArrowLeft, Phone, Mail, Check, Share2, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const property = PROPERTIES.find(p => p.id === Number(id));
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!property) {
        return (
            <div className="container" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
                <h2>Nie znaleziono oferty</h2>
                <button className="btn-primary" onClick={() => navigate('/oferty')} style={{ marginTop: '1rem' }}>
                    <ArrowLeft size={20} /> Wróć do listy ofert
                </button>
            </div>
        );
    }

    const formattedPrice = property.status === 'wynajem'
        ? `${property.price.toLocaleString('pl-PL')} zł/mies.`
        : `${property.price.toLocaleString('pl-PL')} zł`;

    const allImages = [property.image, ...(property.images || [])];

    return (
        <div style={{ background: '#f8faf9', minHeight: '100vh', paddingTop: '80px', paddingBottom: '4rem' }}>
            {/* Breadcrumb / Back Navigation */}
            <div className="container" style={{ padding: '1.5rem 0' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'none', border: 'none', color: '#6b7280',
                        cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500'
                    }}
                >
                    <ArrowLeft size={18} />
                    Wróć
                </button>
            </div>

            {/* Gallery Section */}
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1rem', height: '500px', marginBottom: '2rem' }}>
                    {/* Main Image */}
                    <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', height: '100%' }}>
                        <img
                            src={allImages[activeImage] || property.image}
                            alt={property.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute', top: '1.5rem', left: '1.5rem',
                            display: 'flex', gap: '0.5rem'
                        }}>
                            <span style={{
                                background: property.status === 'sprzedaz' ? '#10b981' : '#3b82f6',
                                color: 'white', padding: '0.5rem 1rem', borderRadius: '9999px',
                                fontSize: '0.875rem', fontWeight: '600', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                {property.status === 'sprzedaz' ? 'Na Sprzedaż' : 'Wynajem'}
                            </span>
                            {property.featured && (
                                <span style={{
                                    background: '#fbbf24', color: '#1f2937', padding: '0.5rem 1rem',
                                    borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    Wyróżniona
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Side Images Grid */}
                    <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '1rem', height: '100%' }}>
                        {allImages.slice(1, 4).map((img, idx) => (
                            <div
                                key={idx}
                                onClick={() => setActiveImage(idx + 1)}
                                style={{
                                    borderRadius: '0.75rem', overflow: 'hidden', cursor: 'pointer',
                                    border: activeImage === idx + 1 ? '2px solid #10b981' : 'none',
                                    position: 'relative'
                                }}
                            >
                                <img
                                    src={img}
                                    alt={`Zdjęcie ${idx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                                {idx === 2 && allImages.length > 4 && (
                                    <div style={{
                                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 'bold', fontSize: '1.25rem'
                                    }}>
                                        +{allImages.length - 4}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem' }}>
                    {/* Left Column: Details */}
                    <div>
                        {/* Header Info */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                                    {property.title}
                                </h1>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>
                                    {formattedPrice}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280', fontSize: '1.125rem' }}>
                                <MapPin size={20} style={{ marginRight: '0.5rem', color: '#10b981' }} />
                                {property.location}
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div style={{
                            background: 'white', padding: '1.5rem', borderRadius: '1rem',
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
                            border: '1px solid #e5e7eb', marginBottom: '2rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '0.75rem', color: '#10b981' }}>
                                    <Bed size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Sypialnie</p>
                                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>{property.beds}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '0.75rem', color: '#10b981' }}>
                                    <Bath size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Łazienki</p>
                                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>{property.baths}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '0.75rem', color: '#10b981' }}>
                                    <Square size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Powierzchnia</p>
                                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>{property.sqft} m²</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>Opis Nieruchomości</h3>
                            <p style={{ color: '#4b5563', lineHeight: '1.8', fontSize: '1rem' }}>
                                {property.description}
                            </p>
                        </div>

                        {/* Features */}
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>Udogodnienia</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {(property.features || []).map((feature, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}>
                                        <div style={{ background: '#10b981', borderRadius: '50%', padding: '2px' }}>
                                            <Check size={14} color="white" />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Agent & Contact */}
                    <div>
                        <div style={{ position: 'sticky', top: '100px' }}>
                            {/* Agent Card */}
                            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <img
                                        src={property.agent.image}
                                        alt={property.agent.name}
                                        style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold' }}>{property.agent.name}</h4>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Agent Nieruchomości</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <a href={`tel:${property.agent.phone}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563', textDecoration: 'none',
                                        padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', transition: 'background 0.2s'
                                    }}>
                                        <Phone size={18} color="#10b981" />
                                        {property.agent.phone}
                                    </a>
                                    <a href={`mailto:${property.agent.email}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563', textDecoration: 'none',
                                        padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', transition: 'background 0.2s'
                                    }}>
                                        <Mail size={18} color="#10b981" />
                                        {property.agent.email}
                                    </a>
                                </div>

                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    Umów Prezentację
                                </button>
                            </div>

                            {/* Offer Actions */}
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: 'white',
                                        cursor: 'pointer', color: '#4b5563', fontWeight: '500'
                                    }}>
                                        <Share2 size={18} />
                                        Udostępnij
                                    </button>
                                    <button style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: 'white',
                                        cursor: 'pointer', color: '#4b5563', fontWeight: '500'
                                    }}>
                                        <Heart size={18} />
                                        Zapisz
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
