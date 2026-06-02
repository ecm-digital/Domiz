import { useParams, useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { MapPin, Bed, Bath, Square, ArrowLeft, Phone, Mail, Check, Share2, Loader2, X, ChevronLeft, ChevronRight, ShieldCheck, FileCheck, Banknote } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import agentPhoto from '../assets/tomaszgnat.jpeg';
import { PropertyCard } from '../components/PropertyCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { MortgageCalculator } from '../components/MortgageCalculator';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from '../context/useLanguage';
import { setSeo } from '../utils/seo';

export function PropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { properties, loading } = useProperties();
    const { t, language } = useLanguage();

    // Wyciągnij faktyczne ID z URL (np. z "piekny-dom-17384938" weź "17384938")
    const propertyId = id?.split('-').pop();

    // Bezpieczne porównanie ID (string vs number)
    const property = properties.find(p => String(p.id) === propertyId);

    const [activeImage, setActiveImage] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const allImages = property ? [property.image, ...(property.images || [])] : [];
    const imageCount = allImages.length;

    const openLightbox = () => setIsLightboxOpen(true);
    const closeLightbox = () => setIsLightboxOpen(false);

    const nextImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (imageCount === 0) return;
        setActiveImage((prev) => (prev + 1) % imageCount);
    }, [imageCount, setActiveImage]);

    const prevImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (imageCount === 0) return;
        setActiveImage((prev) => (prev - 1 + imageCount) % imageCount);
    }, [imageCount, setActiveImage]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isLightboxOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, nextImage, prevImage]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (property) {
            const path = window.location.pathname;
            const description = property.description
                ? `${property.description.replace(/\s+/g, ' ').trim().substring(0, 157)}...`
                : `Oferta nieruchomości ${property.title} w Domiz Homes.`;

            setSeo({
                title: `${property.title} | Domiz Homes`,
                description,
                path,
                image: property.image,
                keywords: `${property.title}, ${property.location}, nieruchomość na sprzedaż, Domiz Homes`,
            });
        } else {
            setSeo({
                title: 'Oferta | Domiz Homes',
                description: 'Oferta nieruchomości Domiz Homes.',
                path: window.location.pathname,
                noindex: true,
            });
        }
    }, [id, property]);

    useEffect(() => {
        if (!property) return;
        trackEvent('property_view', {
            property_id: property.id,
            property_type: property.type,
            property_status: property.status,
        });
    }, [property]);

    // JSON-LD Schema.org dla oferty (RealEstateListing / Product)
    useEffect(() => {
        if (!property) return;
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: property.title,
            description: property.description.substring(0, 200),
            url: window.location.href,
            image: property.image,
            address: { '@type': 'PostalAddress', addressLocality: property.location },
            numberOfRooms: property.beds,
            floorSize: { '@type': 'QuantitativeValue', value: property.sqft, unitCode: 'MTK' },
            offers: { '@type': 'Offer', price: property.price, priceCurrency: 'PLN' },
            realEstateAgent: {
                '@type': 'RealEstateAgent',
                name: property.agent.name,
                email: property.agent.email,
                telephone: property.agent.phone,
            },
        };
        let script = document.getElementById('property-jsonld') as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.id = 'property-jsonld';
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(schema);
        return () => {
            const s = document.getElementById('property-jsonld');
            if (s) s.remove();
        };
    }, [property]);

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="container" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '60vh' }}>
                <h2>{t('property.notFound')}</h2>
                <button className="btn-primary" onClick={() => navigate('/oferty')} style={{ marginTop: '1rem' }}>
                    <ArrowLeft size={20} /> {t('property.backToOffers')}
                </button>
            </div>
        );
    }

    const formattedPrice = property.status === 'wynajem'
        ? `${property.price.toLocaleString(language === 'en' ? 'en-US' : 'pl-PL')} zł/${t('common.month')}`
        : `${property.price.toLocaleString(language === 'en' ? 'en-US' : 'pl-PL')} zł`;

    // Użyj lokalnego zdjęcia dla Tomasza, a dla innych (przyszłych) agentów - zdjęcia z bazy
    const displayAgentImage = property.agent.name === 'Tomasz Gnat' ? agentPhoto : property.agent.image;
    // Override numeru telefonu dla Tomasza
    const displayAgentPhone = '+48 517 303 400';

    // Filter other properties for "See Also" section
    const relatedProperties = properties
        .filter(p => String(p.id) !== propertyId)
        .slice(0, 3);

    const handleShare = async () => {
        if (!property) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: property.title,
                    text: `Zobacz ofertę: ${property.title}`,
                    url: window.location.href,
                });
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(window.location.href);
            }

            trackEvent('property_share', {
                property_id: property.id,
                property_type: property.type,
            });
        } catch (error) {
            console.error('Share failed', error);
        }
    };

    return (
        <div style={{ background: 'var(--color-bg-light)', minHeight: '100vh', paddingTop: '100px', paddingBottom: '4rem' }}>
            <div className="container" style={{ padding: '1rem 0' }}>
                <Breadcrumbs items={[{ label: 'Oferty', path: '/oferty' }, { label: property.title }]} />
            </div>
            <div className="container" style={{ padding: '0 0 1rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'none', border: 'none', color: 'var(--color-text-muted)',
                        cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500'
                    }}
                >
                    <ArrowLeft size={18} /> Wróć
                </button>
            </div>

            {/* Gallery Section - Improved Layout */}
            <div className="container" style={{ marginBottom: '2rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1rem',
                    // Na desktopie (szerokim) chcemy układ 2:1, ale zrobimy to prościej CSS w style tagu poniżej
                }} className="gallery-grid">

                    {/* Main Image */}
                    <div style={{
                        gridColumn: '1 / -1',
                        aspectRatio: '16/9',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        position: 'relative',
                        maxHeight: '600px',
                        cursor: 'zoom-in'
                    }} onClick={openLightbox}>
                        <img
                            src={allImages[activeImage] || property.image}
                            alt={property.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute', top: '1rem', left: '1rem',
                            display: 'flex', gap: '0.5rem'
                        }}>
                            <span style={{
                                background: property.status === 'sprzedaz' ? '#10b981' : '#3b82f6',
                                color: 'white', padding: '0.5rem 1rem', borderRadius: '9999px',
                                fontSize: '0.875rem', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {property.status === 'sprzedaz' ? 'Na Sprzedaż' : 'Wynajem'}
                            </span>
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                        <div style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            gap: '1rem',
                            overflowX: 'auto',
                            paddingBottom: '0.5rem'
                        }}>
                            {allImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    style={{
                                        border: activeImage === idx ? '2px solid #10b981' : '2px solid transparent',
                                        borderRadius: '0.5rem',
                                        overflow: 'hidden',
                                        minWidth: '100px',
                                        width: '120px',
                                        height: '80px',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    <img src={img} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Layout */}
            <div className="container">
                <div className="property-content-grid">
                    {/* Left Column: Details */}
                    <div className="property-main">
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 'bold', color: 'var(--color-text-main)', margin: 0, lineHeight: 1.2 }}>
                                    {property.title}
                                </h1>
                                <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '800', color: '#10b981', whiteSpace: 'nowrap' }}>
                                    {formattedPrice}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>
                                <MapPin size={20} style={{ marginRight: '0.5rem', color: '#10b981' }} />
                                {property.location}
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="glass-panel" style={{
                            padding: '1.5rem',
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <Bed size={28} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Sypialnie</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{property.beds}</div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>
                                <Bath size={28} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Łazienki</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{property.baths}</div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>
                                <Square size={28} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Powierzchnia</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{property.sqft} m²</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Opis Nieruchomości</h3>
                            <div style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', fontSize: '1rem', whiteSpace: 'pre-line' }}>
                                {property.description}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Udogodnienia</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                                {(property.features || []).map((feature, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563' }}>
                                        <div style={{ background: '#ecfdf5', borderRadius: '50%', padding: '4px' }}>
                                            <Check size={14} color="#10b981" />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Map */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Lokalizacja</h3>
                            <div style={{ width: '100%', height: '350px', borderRadius: '0.75rem', overflow: 'hidden' }}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(property.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                ></iframe>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Agent & Sidebar */}
                    <div className="property-sidebar">
                        <div style={{ position: 'sticky', top: '120px' }}>
                            {/* Agent Card */}
                            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <img
                                        src={displayAgentImage}
                                        alt={property.agent.name}
                                        style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }}
                                    />
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{property.agent.name}</h4>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Ekspert ds. Nieruchomości</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <a
                                        href={`tel:${displayAgentPhone}`}
                                        className="btn-secondary"
                                        style={{ justifyContent: 'center', textDecoration: 'none' }}
                                        onClick={() => {
                                            trackEvent('lead_contact_click', {
                                                type: 'phone',
                                                source: 'property_details_sidebar',
                                                property_id: property.id,
                                            });
                                        }}
                                    >
                                        <Phone size={18} /> Zadzwoń
                                    </a>
                                        <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-border)' }}
                                        onClick={() => {
                                            trackEvent('lead_contact_click', {
                                                type: 'form',
                                                source: 'property_details_sidebar',
                                                property_id: property.id,
                                            });
                                            navigate('/osiedle-tluszcz#kontakt');
                                        }}
                                    >
                                        <Mail size={18} /> Formularz kontaktowy
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => {
                                    trackEvent('lead_contact_click', {
                                        type: 'presentation',
                                        source: 'property_details_sidebar',
                                        property_id: property.id,
                                    });
                                    navigate('/osiedle-tluszcz#kontakt');
                                }}
                                >
                                    Umów Prezentację
                                </button>
                            </div>

                            {/* Share */}
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <button
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                    onClick={handleShare}
                                >
                                    <Share2 size={18} /> Udostępnij tę ofertę
                                </button>
                            </div>

                            {/* Trust Signals / USP Section */}
                            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem', background: 'linear-gradient(to bottom right, #ffffff, #f0fdf4)' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937' }}>
                                    Dlaczego warto?
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                        <div style={{ background: '#ecfdf5', padding: '0.25rem', borderRadius: '0.25rem' }}>
                                            <ShieldCheck size={18} color="#10b981" />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', color: '#374151', fontSize: '0.875rem' }}>Bezpieczna transakcja</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.2' }}>Weryfikujemy stan prawny każdej nieruchomości.</span>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                        <div style={{ background: '#ecfdf5', padding: '0.25rem', borderRadius: '0.25rem' }}>
                                            <FileCheck size={18} color="#10b981" />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', color: '#374151', fontSize: '0.875rem' }}>Komplet dokumentów</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.2' }}>Dbamy o formalności od A do Z.</span>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                        <div style={{ background: '#ecfdf5', padding: '0.25rem', borderRadius: '0.25rem' }}>
                                            <Banknote size={18} color="#10b981" />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', color: '#374151', fontSize: '0.875rem' }}>Pomoc w kredycie</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.2' }}>Bezpłatne porównanie ofert banków.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mortgage Calculator Section */}
            {property.status === 'sprzedaz' && property.price > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <MortgageCalculator initialPrice={property.price} />
                </div>
            )}

            {/* Related Properties Section */}
            {relatedProperties.length > 0 && (
                <div className="container" style={{ marginTop: '4rem', marginBottom: '2rem' }}>
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                        fontWeight: 'bold',
                        marginBottom: '2rem',
                        color: 'var(--color-text-main)',
                        textAlign: 'left'
                    }}>
                        Zobacz także
                    </h2>
                    <div className="properties-grid">
                        {relatedProperties.map(prop => (
                            <PropertyCard key={prop.id} {...prop} />
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox}>
                        <X size={32} />
                    </button>

                    <button className="lightbox-nav prev" onClick={prevImage}>
                        <ChevronLeft size={48} />
                    </button>

                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={allImages[activeImage]}
                            alt={`Zdjęcie ${activeImage + 1}`}
                            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
                        />
                        <div className="lightbox-counter">
                            {activeImage + 1} / {allImages.length}
                        </div>
                    </div>

                    <button className="lightbox-nav next" onClick={nextImage}>
                        <ChevronRight size={48} />
                    </button>
                </div>
            )}

            {/* Mobile Sticky CTA */}
            <div className="mobile-sticky-cta">
                <a
                    href={`tel:${displayAgentPhone}`}
                    className="cta-button primary"
                    onClick={() => {
                        trackEvent('lead_contact_click', {
                            type: 'phone',
                            source: 'property_details_mobile_sticky',
                            property_id: property.id,
                        });
                    }}
                >
                    <Phone size={18} /> Zadzwoń
                </a>
                <button
                    className="cta-button secondary"
                    onClick={() => {
                        trackEvent('lead_contact_click', {
                            type: 'form',
                            source: 'property_details_mobile_sticky',
                            property_id: property.id,
                        });
                        navigate('/osiedle-tluszcz#kontakt');
                    }}
                >
                    <Mail size={18} /> Formularz kontaktowy
                </button>
            </div>

            {/* CSS for Responsive Layout & Lightbox & Sticky CTA */}
            <style>{`
                .property-content-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }
                
                @media (min-width: 1024px) {
                    .property-content-grid {
                        grid-template-columns: 2fr 1fr;
                        align-items: start;
                    }
                }

                /* Lightbox Styles */
                .lightbox-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    backdrop-filter: blur(5px);
                }

                .lightbox-content {
                    position: relative;
                    max-width: 100%;
                    max-height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                }

                .lightbox-close {
                    position: absolute;
                    top: 2rem;
                    right: 2rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    cursor: pointer;
                    z-index: 1010;
                    padding: 0.5rem;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: background 0.2s;
                }
                .lightbox-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .lightbox-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    color: white;
                    cursor: pointer;
                    z-index: 1010;
                    padding: 1rem;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.2s;
                }
                .lightbox-nav:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-50%) scale(1.1);
                }
                .lightbox-nav.prev { left: 2rem; }
                .lightbox-nav.next { right: 2rem; }

                .lightbox-counter {
                    color: rgba(255, 255, 255, 0.8);
                    margin-top: 1rem;
                    font-size: 1.1rem;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .lightbox-nav {
                        padding: 0.5rem;
                    }
                    .lightbox-nav svg {
                        width: 32px;
                        height: 32px;
                    }
                    .lightbox-nav.prev { left: 0.5rem; }
                    .lightbox-nav.next { right: 0.5rem; }
                    .lightbox-close { top: 1rem; right: 1rem; }
                }

                /* Mobile Sticky CTA */
                .mobile-sticky-cta {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    padding: 1rem;
                    display: flex;
                    gap: 1rem;
                    z-index: 900;
                    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
                    border-top: 1px solid #e5e7eb;
                }

                .mobile-sticky-cta .cta-button {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                    border: none;
                    font-size: 1rem;
                }

                .mobile-sticky-cta .cta-button.primary {
                    background: #10b981;
                    color: white;
                }

                .mobile-sticky-cta .cta-button.secondary {
                    background: #f3f4f6;
                    color: #1f2937;
                    border: 1px solid #e5e7eb;
                }

                /* Hide on desktop */
                @media (min-width: 768px) {
                    .mobile-sticky-cta {
                        display: none;
                    }
                }
                
                /* Adjust bottom padding on mobile to account for sticky bar */
                @media (max-width: 768px) {
                    .property-sidebar {
                        padding-bottom: 80px;
                    }
                }

                .properties-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }

                /* Mobile Sticky CTA */
                .mobile-sticky-cta {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    padding: 1rem;
                    display: flex;
                    gap: 1rem;
                    z-index: 900;
                    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
                    border-top: 1px solid #e5e7eb;
                }

                .mobile-sticky-cta .cta-button {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                    border: none;
                    font-size: 1rem;
                }

                .mobile-sticky-cta .cta-button.primary {
                    background: #10b981;
                    color: white;
                }

                .mobile-sticky-cta .cta-button.secondary {
                    background: #f3f4f6;
                    color: #1f2937;
                    border: 1px solid #e5e7eb;
                }

                /* Hide on desktop */
                @media (min-width: 768px) {
                    .mobile-sticky-cta {
                        display: none;
                    }
                }
                
                /* Adjust bottom padding on mobile to account for sticky bar */
                @media (max-width: 768px) {
                    .property-sidebar {
                        padding-bottom: 80px;
                    }
                }
            `}</style>
        </div>
    );
}
