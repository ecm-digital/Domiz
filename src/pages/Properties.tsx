import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { PropertyCard } from '../components/PropertyCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Search, SlidersHorizontal, Grid, List, X } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { useLanguage } from '../context/useLanguage';



type PropertyType = 'wszystkie' | 'dom' | 'mieszkanie' | 'dzialka';
type PropertyStatus = 'wszystkie' | 'sprzedaz' | 'wynajem';

function PropertyCardSkeleton() {
    return (
        <div className="property-card-skeleton" aria-hidden="true">
            <div className="skeleton-block skeleton-image" />
            <div className="skeleton-line skeleton-line-title" />
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-stats">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}

export function Properties() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlSearch = searchParams.get('search') || '';
    const urlType = searchParams.get('type') || '';
    const urlMaxPrice = searchParams.get('maxPrice') || '';

    const [searchQuery, setSearchQuery] = useState(urlSearch);
    const { properties, loading } = useProperties();

    const typeFromUrl = (urlType === 'dom' || urlType === 'mieszkanie' || urlType === 'dzialka') ? urlType : 'wszystkie';
    const maxPriceFromUrl = urlMaxPrice ? Math.min(Number(urlMaxPrice) || 2000000, 2000000) : 2000000;

    const [propertyType, setPropertyType] = useState<PropertyType>(typeFromUrl);
    const [propertyStatus, setPropertyStatus] = useState<PropertyStatus>('wszystkie');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPriceFromUrl]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(!!urlType || !!urlMaxPrice);
    const { t, language } = useLanguage();

    useEffect(() => {
        setSearchQuery(urlSearch);
        if (urlType === 'dom' || urlType === 'mieszkanie' || urlType === 'dzialka') setPropertyType(urlType);
        if (urlMaxPrice) setPriceRange([0, Math.min(Number(urlMaxPrice), 2000000)]);
    }, [urlSearch, urlType, urlMaxPrice]);

    // Sync filtrów do URL (umożliwia udostępnianie linków z filtrami); debounce dla suwaka ceny
    useEffect(() => {
        const t = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.set('search', searchQuery.trim());
            if (propertyType !== 'wszystkie') params.set('type', propertyType);
            if (priceRange[1] < 2000000 && priceRange[1] > 0) params.set('maxPrice', String(priceRange[1]));
            const newQuery = params.toString();
            const current = searchParams.toString();
            if (newQuery !== current) setSearchParams(params, { replace: true });
        }, 200);
        return () => clearTimeout(t);
    }, [searchQuery, propertyType, priceRange, searchParams, setSearchParams]);

    const filteredProperties = properties.filter(property => {
        const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = propertyType === 'wszystkie' || property.type === propertyType;
        const matchesStatus = propertyStatus === 'wszystkie' || property.status === propertyStatus;
        const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];

        return matchesSearch && matchesType && matchesStatus && matchesPrice;
    });



    return (
        <div style={{ background: 'var(--color-bg-light)', minHeight: '100vh', paddingTop: '96px' }}>
            <div className="container" style={{ paddingTop: '1rem' }}>
                <Breadcrumbs items={[{ label: t('properties.breadcrumb') }]} />
            </div>
            {/* Hero Section */}
            <section style={{
                background: 'white',
                padding: '2.5rem 0 3rem',
                color: 'var(--color-text-main)'
            }}>
                <div className="container">
                    <h1 style={{
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                        fontWeight: '800',
                        marginBottom: '0.5rem',
                        textAlign: 'center'
                    }}>
                        {t('properties.title')}
                    </h1>
                    <p style={{
                        textAlign: 'center',
                        opacity: 0.8,
                        marginBottom: '2rem',
                        maxWidth: '600px',
                        margin: '0 auto 2rem'
                    }}>
                        {t('properties.subtitle')}
                    </p>

                    {/* Search Bar */}
                    <div className="properties-search-bar" style={{
                        maxWidth: '700px',
                        margin: '0 auto',
                        display: 'flex',
                        gap: '0.5rem'
                    }}>
                        <div className="properties-search-input-wrap" style={{
                            flex: 1,
                            position: 'relative'
                        }}>
                            <Search size={20} style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)'
                            }} />
                            <input
                                type="text"
                                placeholder={t('properties.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    borderRadius: '999px',
                                    border: '1px solid var(--color-border)',
                                    background: 'white',
                                    color: 'var(--color-text-main)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            />
                        </div>
                        <button
                            className="properties-filter-button"
                            onClick={() => {
                                const nextState = !showFilters;
                                setShowFilters(nextState);
                                trackEvent('properties_filters_toggle', { open: nextState });
                            }}
                            style={{
                                padding: '0 1.25rem',
                                borderRadius: '999px',
                                border: '1px solid var(--color-border)',
                                background: showFilters ? 'var(--color-text-main)' : 'white',
                                color: showFilters ? 'white' : 'var(--color-text-main)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '500'
                            }}
                        >
                            <SlidersHorizontal size={20} />
                            {t('properties.filters')}
                        </button>
                    </div>
                </div>
            </section>

            {showFilters && (
                <section style={{ padding: '1rem 0' }}>
                    <div className="container">
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{
                                display: 'flex',
                                gap: '2rem',
                                flexWrap: 'wrap',
                                alignItems: 'flex-end'
                            }}>
                                {/* Type Filter */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-muted)',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {t('properties.typeLabel')}
                                    </label>
                                    <select
                                        value={propertyType}
                                        onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                                        style={{
                                            padding: '0.625rem 1rem',
                                            borderRadius: '999px',
                                            border: '1px solid var(--color-border)',
                                            background: 'white',
                                            color: 'var(--color-text-main)',
                                            fontSize: '0.95rem',
                                            minWidth: '150px'
                                        }}
                                    >
                                        <option value="wszystkie">{t('common.all')}</option>
                                        <option value="dom">{t('common.houses')}</option>
                                        <option value="mieszkanie">{t('common.apartments')}</option>
                                        <option value="dzialka">{t('common.plots')}</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-muted)',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {t('properties.status')}
                                    </label>
                                    <select
                                        value={propertyStatus}
                                        onChange={(e) => setPropertyStatus(e.target.value as PropertyStatus)}
                                        style={{
                                            padding: '0.625rem 1rem',
                                            borderRadius: '999px',
                                            border: '1px solid var(--color-border)',
                                            fontSize: '0.95rem',
                                            minWidth: '150px'
                                        }}
                                    >
                                        <option value="wszystkie">{t('common.all')}</option>
                                        <option value="sprzedaz">{t('properties.forSale')}</option>
                                        <option value="wynajem">{t('properties.forRent')}</option>
                                    </select>
                                </div>

                                {/* Price Range */}
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-muted)',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {t('properties.priceTo')}: {priceRange[1].toLocaleString(language === 'en' ? 'en-US' : 'pl-PL')} zł
                                    </label>
                                    <input
                                        type="range"
                                        min="50000"
                                        max="2000000"
                                        step="50000"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                                        style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                                    />
                                </div>

                                {/* Clear Filters */}
                                <button
                                    onClick={() => {
                                        setPropertyType('wszystkie');
                                        setPropertyStatus('wszystkie');
                                        setPriceRange([0, 2000000]);
                                        setSearchQuery('');
                                        trackEvent('properties_filters_cleared', { source: 'filters_panel' });
                                    }}
                                    style={{
                                        padding: '0.625rem 1rem',
                                        borderRadius: '999px',
                                        border: '1px solid var(--color-border)',
                                        background: 'white',
                                        color: 'var(--color-text-dim)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <X size={16} />
                                    {t('properties.clear')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Results Section */}
            <section style={{ padding: '2rem 0 4rem' }}>
                <div className="container">
                    {/* Results Header */}
                    <div className="properties-results-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                            {t('properties.foundPrefix')} <strong style={{ color: 'var(--color-text-main)' }}>{filteredProperties.length}</strong> {t('properties.foundSuffix')}
                        </p>

                        <div className="properties-view-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => {
                                    setViewMode('grid');
                                    trackEvent('properties_view_mode_change', { mode: 'grid' });
                                }}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)',
                                    background: viewMode === 'grid' ? 'var(--color-text-main)' : 'rgba(0,0,0,0.03)',
                                    color: viewMode === 'grid' ? 'white' : 'var(--color-text-dim)',
                                    cursor: 'pointer'
                                }}
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('list');
                                    trackEvent('properties_view_mode_change', { mode: 'list' });
                                }}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)',
                                    background: viewMode === 'list' ? 'var(--color-text-main)' : 'white',
                                    color: viewMode === 'list' ? 'white' : 'var(--color-text-dim)',
                                    cursor: 'pointer'
                                }}
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Properties Grid/List */}
                    {loading ? (
                        <div className="properties-loading-state">
                            <div>
                                <h3>{t('properties.loadingTitle')}</h3>
                                <p>{t('properties.loadingDesc')}</p>
                            </div>
                            <div className="properties-skeleton-grid">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <PropertyCardSkeleton key={index} />
                                ))}
                            </div>
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="glass-panel" style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            marginTop: '2rem'
                        }}>
                            <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5, color: '#9ca3af' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('properties.emptyTitle')}</h3>
                            <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
                                {t('properties.emptyDesc')}
                            </p>
                            <button
                                onClick={() => {
                                    setPropertyType('wszystkie');
                                    setPropertyStatus('wszystkie');
                                    setPriceRange([0, 2000000]);
                                    setSearchQuery('');
                                    trackEvent('properties_filters_cleared', { source: 'empty_state' });
                                }}
                                className="btn-primary"
                                style={{ marginTop: '1.5rem' }}
                            >
                                {t('properties.clearFilters')}
                            </button>
                        </div>
                    ) : (
                        <div className="properties-results-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: viewMode === 'grid'
                                ? 'repeat(auto-fill, minmax(320px, 1fr))'
                                : '1fr', // For list view, show 1 column
                            gap: '1.5rem',
                            marginTop: '2rem'
                        }}>
                            {filteredProperties.map((property) => (
                                <PropertyCard key={property.id} {...property} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
