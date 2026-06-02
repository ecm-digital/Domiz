import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Loader2 } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useFavorites } from '../context/FavoritesContext';
import { PropertyCard } from '../components/PropertyCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useLanguage } from '../context/useLanguage';

export function Favorites() {
    const navigate = useNavigate();
    const { properties, loading } = useProperties();
    const { favorites } = useFavorites();
    const { t } = useLanguage();

    const favoriteProperties = properties.filter((p) => favorites.includes(p.id));

    if (loading) {
        return (
            <div style={{ paddingTop: 'var(--header-height)', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', background: 'var(--color-bg-light)' }}>
            <section style={{ padding: '2rem 0 4rem' }}>
                <div className="container">
                    <Breadcrumbs items={[{ label: t('nav.favorites') }]} />
                    <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: '800', marginBottom: '0.5rem' }}>
                        {t('favorites.title')}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                        {favoriteProperties.length === 0
                            ? t('favorites.emptyLead')
                            : favoriteProperties.length === 1
                                ? t('favorites.countSingle')
                                : `${t('favorites.countManyPrefix')} ${favoriteProperties.length} ${t('favorites.countManySuffix')}`}
                    </p>

                    {favoriteProperties.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <Heart size={48} style={{ color: 'var(--color-text-dim)', marginBottom: '1rem', opacity: 0.5 }} />
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                {t('favorites.emptyDesc')}
                            </p>
                            <button className="btn-primary" onClick={() => navigate('/oferty')}>
                                {t('favorites.browse')} <ArrowRight size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="properties-grid">
                            {favoriteProperties.map((prop) => (
                                <PropertyCard key={prop.id} {...prop} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
