import { useParams, useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { MapPin, Bed, Bath, Square, ArrowLeft, Phone, Mail, Check, Share2, Loader2, X, ChevronLeft, ChevronRight, ShieldCheck, FileCheck, Banknote, CalendarDays } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import agentPhoto from '../assets/tomaszgnat.jpeg';
import { PropertyCard } from '../components/PropertyCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { MortgageCalculator } from '../components/MortgageCalculator';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from '../context/useLanguage';
import { setSeo } from '../utils/seo';
import { getLocalizedProperty } from '../data/propertyLocalization';
import { db } from '../firebase';

const VIEWING_TIME_SLOTS = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function PropertyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { properties, loading } = useProperties();
    const { t, language } = useLanguage();

    // Wyciągnij faktyczne ID z URL (np. z "piekny-dom-17384938" weź "17384938")
    const propertyId = id?.split('-').pop();

    // Bezpieczne porównanie ID (string vs number)
    const property = properties.find(p => String(p.id) === propertyId);
    const localizedProperty = property ? getLocalizedProperty(property, language) : null;
    const displayTitle = localizedProperty?.title || '';
    const displayDescription = localizedProperty?.description || '';
    const displayFeatures = localizedProperty?.features || [];

    const [activeImage, setActiveImage] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isViewingModalOpen, setIsViewingModalOpen] = useState(false);
    const [selectedViewingDate, setSelectedViewingDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return toDateKey(tomorrow);
    });
    const [selectedViewingTime, setSelectedViewingTime] = useState(VIEWING_TIME_SLOTS[2]);
    const [viewerName, setViewerName] = useState('');
    const [viewerEmail, setViewerEmail] = useState('');
    const [viewerPhone, setViewerPhone] = useState('');
    const [viewingNote, setViewingNote] = useState('');
    const [viewingConsent, setViewingConsent] = useState(false);
    const [isViewingSubmitting, setIsViewingSubmitting] = useState(false);
    const [viewingError, setViewingError] = useState('');
    const [viewingSuccess, setViewingSuccess] = useState(false);

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
            const description = displayDescription
                ? `${displayDescription.replace(/\s+/g, ' ').trim().substring(0, 157)}...`
                : `Oferta nieruchomości ${displayTitle} w Domiz Homes.`;

            setSeo({
                title: `${displayTitle} | Domiz Homes`,
                description,
                path,
                image: property.image,
                keywords: `${displayTitle}, ${property.location}, nieruchomość na sprzedaż, Domiz Homes`,
            });
        } else {
            setSeo({
                title: 'Oferta | Domiz Homes',
                description: 'Oferta nieruchomości Domiz Homes.',
                path: window.location.pathname,
                noindex: true,
            });
        }
    }, [id, property, displayDescription, displayTitle]);

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
            name: displayTitle,
            description: displayDescription.substring(0, 200),
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
    }, [property, displayDescription, displayTitle]);

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
    const displayAgentPhone = property.agent.phone || '+48 517 303 400';

    // Filter other properties for "See Also" section
    const relatedProperties = properties
        .filter(p => String(p.id) !== propertyId)
        .slice(0, 3);

    const handleShare = async () => {
        if (!property) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: displayTitle,
                    text: `Zobacz ofertę: ${displayTitle}`,
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

    const viewingDates = Array.from({ length: 10 }, (_, index) => {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + index + 1);
        return date;
    });

    const openViewingModal = () => {
        setViewingError('');
        setViewingSuccess(false);
        setIsViewingModalOpen(true);
        trackEvent('lead_contact_click', {
            type: 'presentation',
            source: 'property_details_sidebar',
            property_id: property.id,
        });
    };

    const submitViewingRequest = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!viewerName.trim() || !viewerEmail.trim() || !viewerPhone.trim() || !viewingConsent) {
            setViewingError(language === 'en' ? 'Complete the required fields and accept the consent.' : 'Uzupełnij wymagane pola i zaakceptuj zgodę.');
            return;
        }

        setIsViewingSubmitting(true);
        setViewingError('');
        try {
            await addDoc(collection(db, 'inquiries'), {
                type: 'viewing_request',
                name: viewerName.trim(),
                email: viewerEmail.trim(),
                phone: viewerPhone.trim(),
                message: viewingNote.trim(),
                source: 'Karta oferty — umów prezentację',
                leadStatus: 'presentation',
                createdAt: new Date().toISOString(),
                payload: {
                    propertyId: String(property.id),
                    propertyTitle: displayTitle,
                    propertyLocation: property.location,
                    appointmentDate: selectedViewingDate,
                    appointmentTime: selectedViewingTime,
                    timezone: 'Europe/Warsaw',
                },
            });
            setViewingSuccess(true);
        } catch (error) {
            console.error('Viewing request failed', error);
            setViewingError(language === 'en' ? 'We could not send the request. Please try again.' : 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę.');
        } finally {
            setIsViewingSubmitting(false);
        }
    };

    return (
        <div style={{ background: 'var(--color-bg-light)', minHeight: '100vh', paddingTop: '100px', paddingBottom: '4rem' }}>
            <div className="container" style={{ padding: '1rem 0' }}>
                <Breadcrumbs items={[{ label: 'Oferty', path: '/oferty' }, { label: displayTitle }]} />
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
                    <ArrowLeft size={18} /> {t('property.back')}
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
                            alt={displayTitle}
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
                                {property.status === 'sprzedaz' ? t('common.forSale') : t('common.forRent')}
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
                                    {displayTitle}
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
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('property.bedrooms')}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{property.beds}</div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>
                                <Bath size={28} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('property.bathrooms')}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{property.baths}</div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>
                                <Square size={28} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('property.area')}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{property.sqft} m²</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>{t('property.description')}</h3>
                            <div style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', fontSize: '1rem', whiteSpace: 'pre-line' }}>
                                {displayDescription}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>{t('property.features')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                                {displayFeatures.map((feature, idx) => (
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
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>{t('property.location')}</h3>
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
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{t('property.agentRole')}</p>
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
                                        <Phone size={18} /> {t('property.call')}
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
                                        <Mail size={18} /> {t('property.contactForm')}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={openViewingModal}
                                >
                                    {t('property.bookViewing')}
                                </button>
                            </div>

                            {/* Share */}
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <button
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                    onClick={handleShare}
                                >
                                    <Share2 size={18} /> {t('property.share')}
                                </button>
                            </div>

                            {/* Trust Signals / USP Section */}
                            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem', background: 'linear-gradient(to bottom right, #ffffff, #f0fdf4)' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937' }}>
                                    {t('property.why')}
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                        <div style={{ background: '#ecfdf5', padding: '0.25rem', borderRadius: '0.25rem' }}>
                                            <ShieldCheck size={18} color="#10b981" />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', color: '#374151', fontSize: '0.875rem' }}>{t('property.safeTitle')}</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.2' }}>{t('property.safeDesc')}</span>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                        <div style={{ background: '#ecfdf5', padding: '0.25rem', borderRadius: '0.25rem' }}>
                                            <FileCheck size={18} color="#10b981" />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', color: '#374151', fontSize: '0.875rem' }}>{t('property.documentsTitle')}</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.2' }}>{t('property.documentsDesc')}</span>
                                        </div>
                                    </li>
                                    <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                        <div style={{ background: '#ecfdf5', padding: '0.25rem', borderRadius: '0.25rem' }}>
                                            <Banknote size={18} color="#10b981" />
                                        </div>
                                        <div>
                                            <strong style={{ display: 'block', color: '#374151', fontSize: '0.875rem' }}>{t('property.financeTitle')}</strong>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.2' }}>{t('property.financeDesc')}</span>
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
                        {t('property.related')}
                    </h2>
                    <div className="properties-grid">
                        {relatedProperties.map(prop => (
                            <PropertyCard key={prop.id} {...prop} />
                        ))}
                    </div>
                </div>
            )}

            {isViewingModalOpen && (
                <div className="viewing-modal-overlay" role="presentation" onMouseDown={() => !isViewingSubmitting && setIsViewingModalOpen(false)}>
                    <div className="viewing-modal" role="dialog" aria-modal="true" aria-labelledby="viewing-modal-title" onMouseDown={(event) => event.stopPropagation()}>
                        <button className="viewing-modal-close" type="button" onClick={() => setIsViewingModalOpen(false)} aria-label="Zamknij formularz">
                            <X size={22} />
                        </button>
                        {viewingSuccess ? (
                            <div className="viewing-success">
                                <div className="viewing-success-icon"><Check size={28} /></div>
                                <h2 id="viewing-modal-title">Prośba o prezentację wysłana</h2>
                                <p>Potwierdzimy dostępność terminu i wrócimy do Ciebie najszybciej jak to możliwe.</p>
                                <button type="button" className="btn-primary" onClick={() => setIsViewingModalOpen(false)}>Gotowe</button>
                            </div>
                        ) : (
                            <form onSubmit={submitViewingRequest}>
                                <div className="viewing-modal-heading">
                                    <span className="section-label"><CalendarDays size={15} /> Prezentacja nieruchomości</span>
                                    <h2 id="viewing-modal-title">Wybierz dogodny termin</h2>
                                    <p>{displayTitle}</p>
                                </div>

                                <fieldset className="viewing-fieldset">
                                    <legend>Dzień</legend>
                                    <div className="viewing-date-grid">
                                        {viewingDates.map((date) => {
                                            const value = toDateKey(date);
                                            return (
                                                <button key={value} type="button" className={`viewing-choice ${selectedViewingDate === value ? 'is-selected' : ''}`} onClick={() => setSelectedViewingDate(value)}>
                                                    <strong>{new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'short' }).format(date)}</strong>
                                                    <span>{new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'short' }).format(date)}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </fieldset>

                                <fieldset className="viewing-fieldset">
                                    <legend>Godzina</legend>
                                    <div className="viewing-time-grid">
                                        {VIEWING_TIME_SLOTS.map((time) => <button key={time} type="button" className={`viewing-choice viewing-time ${selectedViewingTime === time ? 'is-selected' : ''}`} onClick={() => setSelectedViewingTime(time)}>{time}</button>)}
                                    </div>
                                </fieldset>

                                <div className="viewing-form-grid">
                                    <label>Imię i nazwisko<input required value={viewerName} onChange={(event) => setViewerName(event.target.value)} autoComplete="name" /></label>
                                    <label>E-mail<input required type="email" value={viewerEmail} onChange={(event) => setViewerEmail(event.target.value)} autoComplete="email" /></label>
                                    <label>Telefon<input required type="tel" value={viewerPhone} onChange={(event) => setViewerPhone(event.target.value)} autoComplete="tel" /></label>
                                    <label>Wiadomość <span>(opcjonalnie)</span><textarea rows={3} value={viewingNote} onChange={(event) => setViewingNote(event.target.value)} /></label>
                                </div>

                                <label className="viewing-consent"><input type="checkbox" checked={viewingConsent} onChange={(event) => setViewingConsent(event.target.checked)} /> Wyrażam zgodę na kontakt w sprawie tej prezentacji.</label>
                                {viewingError && <p className="viewing-error" role="alert">{viewingError}</p>}
                                <button type="submit" className="btn-primary viewing-submit" disabled={isViewingSubmitting}>{isViewingSubmitting ? 'Wysyłanie…' : 'Wyślij prośbę o prezentację'}</button>
                            </form>
                        )}
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
                            alt={`${t('property.photo')} ${activeImage + 1}`}
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

                .viewing-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1100;
                    display: grid;
                    place-items: center;
                    padding: 1rem;
                    background: rgba(15, 23, 42, 0.62);
                    backdrop-filter: blur(7px);
                }
                .viewing-modal {
                    position: relative;
                    width: min(100%, 680px);
                    max-height: min(90vh, 760px);
                    overflow-y: auto;
                    padding: 2rem;
                    background: #fff;
                    border-radius: 1.25rem;
                    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.34);
                }
                .viewing-modal-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    display: grid;
                    place-items: center;
                    width: 2.5rem;
                    height: 2.5rem;
                    border: 0;
                    border-radius: 50%;
                    background: #f1f5f9;
                    color: #334155;
                    cursor: pointer;
                }
                .viewing-modal-heading { padding-right: 2.5rem; margin-bottom: 1.5rem; }
                .viewing-modal-heading .section-label { display: inline-flex; align-items: center; gap: 0.4rem; }
                .viewing-modal-heading h2 { margin: 0.6rem 0 0.4rem; font-size: clamp(1.5rem, 4vw, 2rem); }
                .viewing-modal-heading p { margin: 0; color: var(--color-text-secondary); }
                .viewing-fieldset { margin: 0 0 1.35rem; padding: 0; border: 0; }
                .viewing-fieldset legend { margin-bottom: 0.7rem; font-weight: 700; color: #1e293b; }
                .viewing-date-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.55rem; }
                .viewing-time-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.55rem; }
                .viewing-choice { min-height: 58px; padding: 0.5rem; border: 1px solid #dbe3ec; border-radius: 0.75rem; background: #fff; color: #334155; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem; font-size: 0.8rem; }
                .viewing-choice strong { text-transform: capitalize; font-size: 0.78rem; }
                .viewing-choice.is-selected { border-color: var(--color-primary); background: #ecfdf5; color: #047857; box-shadow: inset 0 0 0 1px var(--color-primary); }
                .viewing-choice:hover { border-color: var(--color-primary); }
                .viewing-time { min-height: 44px; font-weight: 700; font-size: 0.9rem; }
                .viewing-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1rem; }
                .viewing-form-grid label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.86rem; font-weight: 650; color: #334155; }
                .viewing-form-grid label:last-child { grid-column: 1 / -1; }
                .viewing-form-grid label span { font-weight: 400; color: #64748b; }
                .viewing-form-grid input, .viewing-form-grid textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 0.65rem; padding: 0.72rem 0.8rem; font: inherit; color: #0f172a; resize: vertical; }
                .viewing-form-grid input:focus, .viewing-form-grid textarea:focus { outline: 3px solid rgba(16, 185, 129, 0.18); border-color: var(--color-primary); }
                .viewing-consent { display: flex; align-items: flex-start; gap: 0.6rem; color: #475569; font-size: 0.85rem; line-height: 1.45; }
                .viewing-consent input { margin-top: 0.15rem; accent-color: var(--color-primary); }
                .viewing-error { margin: 0.75rem 0 0; color: #b91c1c; font-size: 0.9rem; }
                .viewing-submit { width: 100%; justify-content: center; margin-top: 1.25rem; }
                .viewing-submit:disabled { cursor: wait; opacity: 0.72; }
                .viewing-success { text-align: center; padding: 1.5rem 0 0.5rem; }
                .viewing-success-icon { width: 3.5rem; height: 3.5rem; display: grid; place-items: center; margin: 0 auto 1rem; border-radius: 50%; background: #dcfce7; color: #15803d; }
                .viewing-success h2 { margin: 0; color: #1e293b; }
                .viewing-success p { max-width: 420px; margin: 0.7rem auto 1.5rem; color: #64748b; line-height: 1.55; }
                @media (max-width: 640px) {
                    .viewing-modal { padding: 1.35rem; border-radius: 1rem; }
                    .viewing-date-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .viewing-form-grid { grid-template-columns: 1fr; }
                    .viewing-form-grid label:last-child { grid-column: auto; }
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
