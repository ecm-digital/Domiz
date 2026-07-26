import { useState } from 'react';
import { Search, ArrowRight, ChevronDown, MapPin, Home as HomeIcon, Wallet, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from '../context/useLanguage';
import './Hero.css';

export function Hero() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('');
    const [searchMaxPrice, setSearchMaxPrice] = useState('');

    const priceOptions: { label: string; value: string }[] = [
        { label: t('common.any'), value: '' },
        { label: '500 000 PLN', value: '500000' },
        { label: '1 000 000 PLN', value: '1000000' },
        { label: '2 000 000 PLN', value: '2000000' },
    ];

    const typeOptions: { label: string; value: string }[] = [
        { label: t('common.all'), value: '' },
        { label: t('common.house'), value: 'dom' },
        { label: t('common.apartment'), value: 'mieszkanie' },
        { label: t('common.land'), value: 'dzialka' },
    ];

    const stats = [
        { value: '150+', label: t('hero.offers') },
        { value: '85+', label: t('hero.sold') },
        { value: '3', label: t('hero.experience') },
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
        <section className="home-hero">
            <div className="home-hero-glow" aria-hidden="true" />

            <div className="container home-hero-inner">
                <div className="home-hero-grid">
                    <div className="home-hero-copy">
                        <span className="home-hero-badge">
                            <span className="home-hero-badge-dot" />
                            {t('hero.badge')}
                        </span>

                        <h1 className="home-hero-title">
                            {t('hero.titleTop')}
                            <span className="home-hero-title-accent">Domiz Homes</span>
                        </h1>

                        <p className="home-hero-subtitle">
                            {t('hero.subtitle')}
                        </p>

                        <div className="home-hero-actions">
                            <button className="btn-primary" onClick={() => {
                                trackEvent('hero_cta_click', { cta: 'browse_offers' });
                                navigate('/oferty');
                            }}>
                                {t('hero.browse')}
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </button>
                            <button className="btn-secondary" onClick={() => {
                                trackEvent('hero_cta_click', { cta: 'sell_property' });
                                navigate('/dodaj-nieruchomosc');
                            }}>
                                {t('hero.sell')}
                            </button>
                        </div>

                        <div className="home-hero-stats">
                            {stats.map((stat) => (
                                <div key={stat.label} className="home-hero-stat">
                                    <span className="home-hero-stat-value">{stat.value}</span>
                                    <span className="home-hero-stat-label">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="home-hero-media">
                        <figure className="home-hero-media-main">
                            <img src="/properties/gwiazdy/salon.jpg" alt="" fetchPriority="high" />
                            <span className="home-hero-media-badge">
                                <Sparkles size={16} />
                                {t('hero.mediaBadge')}
                            </span>
                        </figure>
                        <figure className="home-hero-media-side">
                            <img src="/properties/gwiazdy/kuchnia.jpg" alt="" loading="lazy" />
                        </figure>
                        <figure className="home-hero-media-side">
                            <img src="/properties/gwiazdy/pokoj.jpg" alt="" loading="lazy" />
                        </figure>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="home-hero-search">
                    <div className="home-hero-search-field">
                        <label htmlFor="hero-search-location">{t('hero.locationLabel')}</label>
                        <div className="home-hero-search-control">
                            <MapPin size={18} />
                            <input
                                id="hero-search-location"
                                type="text"
                                placeholder={t('hero.locationPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="home-hero-search-field">
                        <label htmlFor="hero-search-type">{t('hero.type')}</label>
                        <div className="home-hero-search-control">
                            <HomeIcon size={18} />
                            <select
                                id="hero-search-type"
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                            >
                                {typeOptions.map((o) => (
                                    <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="home-hero-search-chevron" />
                        </div>
                    </div>

                    <div className="home-hero-search-field">
                        <label htmlFor="hero-search-price">{t('hero.maxPrice')}</label>
                        <div className="home-hero-search-control">
                            <Wallet size={18} />
                            <select
                                id="hero-search-price"
                                value={searchMaxPrice}
                                onChange={(e) => setSearchMaxPrice(e.target.value)}
                            >
                                {priceOptions.map((o) => (
                                    <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="home-hero-search-chevron" />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary home-hero-search-submit">
                        <Search size={18} strokeWidth={2.5} />
                        {t('hero.search')}
                    </button>
                </form>
            </div>
        </section>
    );
}
