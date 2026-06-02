import { useState } from 'react';
import { Search, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from '../context/useLanguage';

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
        <section className="hero-section">
            <div className="container hero-grid">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        <span>{t('hero.badge')}</span>
                    </div>

                    <h1 className="hero-title">
                        {t('hero.titleTop')} <br />
                        <span className="text-gradient">Domiz Homes</span>
                    </h1>

                    <p className="hero-subtitle">
                        {t('hero.subtitle')}
                    </p>

                    <div className="hero-actions">
                        <button className="btn-primary hero-btn-primary" onClick={() => {
                            trackEvent('hero_cta_click', { cta: 'browse_offers' });
                            navigate('/oferty');
                        }}>
                            {t('hero.browse')}
                            <ArrowRight size={20} strokeWidth={2.5} />
                        </button>
                        <button className="btn-secondary hero-btn-secondary" onClick={() => {
                            trackEvent('hero_cta_click', { cta: 'sell_property' });
                            navigate('/dodaj-nieruchomosc');
                        }}>
                            {t('hero.sell')}
                        </button>
                    </div>

                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-value">150+</span>
                            <span className="hero-stat-label">{t('hero.offers')}</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <span className="hero-stat-value">85+</span>
                            <span className="hero-stat-label">{t('hero.sold')}</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <span className="hero-stat-value">3</span>
                            <span className="hero-stat-label">{t('hero.experience')}</span>
                        </div>
                    </div>
                </div>

                <div className="hero-search-wrap">
                    <div className="hero-media-grid" aria-hidden="true">
                        <div className="hero-media-large">
                            <img src="/properties/gwiazdy/salon.jpg" alt="" />
                        </div>
                        <div className="hero-media-small">
                            <img src="/properties/gwiazdy/kuchnia.jpg" alt="" />
                        </div>
                        <div className="hero-media-small">
                            <img src="/properties/gwiazdy/pokoj.jpg" alt="" />
                        </div>
                    </div>
                    <form onSubmit={handleSearch} className="search-card hero-search-card">
                        <h3 className="search-card-title">{t('hero.searchTitle')}</h3>

                        <div className="search-input-group">
                            <label>{t('hero.locationLabel')}</label>
                            <div className="search-input-wrap">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder={t('hero.locationPlaceholder')}
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="search-filters">
                            <div className="search-filter">
                                <label>{t('hero.type')}</label>
                                <select className="search-input" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                                    {typeOptions.map((o) => (
                                        <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="search-filter">
                                <label>{t('hero.maxPrice')}</label>
                                <select className="search-input" value={searchMaxPrice} onChange={(e) => setSearchMaxPrice(e.target.value)}>
                                    {priceOptions.map((o) => (
                                        <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary search-submit-btn">
                            {t('hero.search')}
                        </button>
                    </form>
                </div>
            </div>

            <div className="hero-scroll-indicator" aria-hidden="true">
                <ChevronDown size={24} />
            </div>
        </section>
    );
}
