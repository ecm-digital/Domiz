import { useEffect, useState } from 'react';
import { Search, ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../../utils/analytics';
import { useLanguage } from '../../context/useLanguage';

const SLIDES = [
    {
        image: "/properties/gwiazdy/balkon-zachod.webp",
        title: { pl: "Apartament na Gwiazdach w Katowicach", en: "Apartment at Gwiazdy Estate in Katowice" },
        desc: { pl: "Apartament z panoramicznym widokiem na Osiedlu Gwiazdy w Katowicach.", en: "An apartment with panoramic views at the Gwiazdy Estate in Katowice." }
    },
    {
        image: "/properties/carousel/suburban_house.png",
        title: { pl: "Dom pod Warszawą", en: "Home near Warsaw" },
        desc: { pl: "Nowoczesny dom z ogrodem pod Warszawą.", en: "A modern home with a garden near Warsaw." }
    },
    {
        image: "/properties/carousel/dubai-apartment.png",
        title: { pl: "Apartament inwestycyjny w Dubaju", en: "Investment apartment in Dubai" },
        desc: { pl: "Apartament premium z widokiem na panoramę Dubaju.", en: "A premium apartment overlooking the Dubai skyline." }
    }
];

const AUTO_ADVANCE_MS = 5000;

export function HomeHero() {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('');
    const [searchMaxPrice, setSearchMaxPrice] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isDocumentVisible, setIsDocumentVisible] = useState(() => document.visibilityState === 'visible');

    useEffect(() => {
        const handleVisibilityChange = () => setIsDocumentVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        SLIDES.forEach(({ image }) => {
            const imageElement = new Image();
            imageElement.src = image;
            imageElement.decode?.().catch(() => undefined);
        });
    }, []);

    useEffect(() => {
        if (isPaused || !isDocumentVisible) return;

        const timer = window.setTimeout(() => {
            setCurrentSlide((previousSlide) => (previousSlide + 1) % SLIDES.length);
        }, AUTO_ADVANCE_MS);

        return () => window.clearTimeout(timer);
    }, [currentSlide, isDocumentVisible, isPaused]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        trackEvent('hero_carousel_nav', { direction: 'next' });
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
        trackEvent('hero_carousel_nav', { direction: 'prev' });
    };

    const priceOptions = [
        { label: t('common.any'), value: '' },
        { label: '500 000 PLN', value: '500000' },
        { label: '1 000 000 PLN', value: '1000000' },
        { label: '2 000 000 PLN', value: '2000000' },
    ];

    const typeOptions = [
        { label: t('common.all'), value: '' },
        { label: t('common.house'), value: 'dom' },
        { label: t('common.apartment'), value: 'mieszkanie' },
        { label: t('common.land'), value: 'dzialka' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (searchType) params.set('type', searchType);
        if (searchMaxPrice) params.set('maxPrice', searchMaxPrice);
        trackEvent('hero_search_submit', {
            search_query: searchQuery.trim() || 'all',
            property_type: searchType || 'all',
            max_price: searchMaxPrice || 'none',
        });
        navigate(`/oferty?${params.toString()}`);
    };

    return (
        <section
            className="home-hero-section"
            aria-roledescription="carousel"
            aria-label={language === 'en' ? 'Featured properties' : 'Wyróżnione nieruchomości'}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
            }}
        >
            {/* Background Slideshow */}
            <div className="hero-slideshow">
                {SLIDES.map((slide, idx) => (
                    <div
                        key={idx}
                        className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}
                        aria-hidden={idx !== currentSlide}
                    >
                        <img
                            className="hero-slide-image"
                            src={slide.image}
                            alt=""
                            decoding="async"
                            fetchPriority={idx === 0 ? 'high' : 'low'}
                        />
                    </div>
                ))}
                <div className="hero-slide-overlay" />
            </div>

            <div className="container hero-grid">
                {/* Hero Text Content */}
                <div className="hero-content">
                    <div className="hero-badge animate-fade-in">
                        <span className="hero-badge-dot" />
                        <span>{t('hero.badge')}</span>
                    </div>

                    <h1 className="hero-title text-white">
                        {t('hero.titleTop')} <br />
                        <span className="text-gradient-white">Domiz Homes</span>
                    </h1>

                    <p className="hero-subtitle text-white-muted">
                        {SLIDES[currentSlide].desc[language]} {t('hero.subtitle')}
                    </p>

                    <div className="hero-actions">
                        <button className="btn-primary hero-btn-primary" onClick={() => {
                            trackEvent('hero_cta_click', { cta: 'browse_offers' });
                            navigate('/oferty');
                        }}>
                            {t('hero.browse')}
                            <ArrowRight size={20} strokeWidth={2.5} />
                        </button>
                        <button className="btn-secondary-white hero-btn-secondary" onClick={() => {
                            trackEvent('hero_cta_click', { cta: 'sell_property' });
                            navigate('/dodaj-nieruchomosc');
                        }}>
                            {t('hero.sell')}
                        </button>
                    </div>

                </div>

                {/* Glassmorphic Search Card */}
                <div className="hero-search-wrap">
                    <form onSubmit={handleSearch} className="search-card-glass">
                        <h3 className="search-card-title text-white">{t('hero.searchTitle')}</h3>

                        <div className="search-input-group">
                            <label className="text-white-dim">{t('hero.locationLabel')}</label>
                            <div className="search-input-wrap-glass">
                                <Search size={18} className="search-icon text-white-dim" />
                                <input
                                    type="text"
                                    placeholder={t('hero.locationPlaceholder')}
                                    className="search-input-glass"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="search-filters">
                            <div className="search-filter">
                                <label className="text-white-dim">{t('hero.type')}</label>
                                <select
                                    className="search-input-glass"
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                >
                                    {typeOptions.map((o) => (
                                        <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="search-filter">
                                <label className="text-white-dim">{t('hero.maxPrice')}</label>
                                <select
                                    className="search-input-glass"
                                    value={searchMaxPrice}
                                    onChange={(e) => setSearchMaxPrice(e.target.value)}
                                >
                                    {priceOptions.map((o) => (
                                        <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary search-submit-btn-glass">
                            {t('hero.search')}
                        </button>
                    </form>

                    {/* Carousel navigation indicators */}
                    <div className="hero-carousel-controls">
                        <button onClick={prevSlide} className="carousel-control-btn" aria-label="Previous slide">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="carousel-dots">
                            {SLIDES.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                                    onClick={() => {
                                        setCurrentSlide(idx);
                                        trackEvent('hero_carousel_dot', { slideIndex: idx });
                                    }}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                        <button onClick={nextSlide} className="carousel-control-btn" aria-label="Next slide">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="hero-scroll-indicator text-white-dim" aria-hidden="true">
                <ChevronDown size={24} />
            </div>
        </section>
    );
}
