import { MapPin, Bed, Bath, Square, ArrowRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Property } from '../data/properties';
import { createSlug } from '../utils/slugify';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/useLanguage';
import { trackEvent } from '../utils/analytics';

const PHOTO_FALLBACK = '/properties/gwiazdy/salon.jpg';

export function PropertyCard(property: Property) {
  const navigate = useNavigate();
  const { toggle, isFavorite } = useFavorites();
  const { language, t } = useLanguage();
  const fav = isFavorite(property.id);
  // Tworzymy slug SEO: np. "piekny-dom-w-tychach-123456"
  const slug = `${createSlug(property.title)}-${property.id}`;

  const formattedPrice = property.status === 'wynajem'
    ? `${property.price.toLocaleString(language === 'en' ? 'en-US' : 'pl-PL')} zł/${t('common.month')}`
    : `${property.price.toLocaleString(language === 'en' ? 'en-US' : 'pl-PL')} zł`;
  const cardImage = property.image.toLowerCase().includes('.png') ? PHOTO_FALLBACK : property.image;

  const openDetails = () => {
    trackEvent('property_open', {
      property_id: property.id,
      property_type: property.type,
      property_status: property.status,
      source: 'property_card',
    });
    navigate(`/oferty/${slug}`);
  };

  return (
    <div
      className="glass-panel property-card"
      onClick={openDetails}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-image-wrapper">
        <img
          src={cardImage}
          alt={property.title}
          className="card-image"
          loading="lazy"
          style={{ objectPosition: 'center center' }}
          onError={(e) => {
            e.currentTarget.src = PHOTO_FALLBACK;
          }}
        />
        <button
          style={{
            position: 'absolute', top: '1rem', left: '1rem',
            background: fav ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${fav ? '#ef4444' : 'var(--color-border)'}`,
            borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: fav ? '#ef4444' : 'var(--color-text-secondary)', transition: 'all 0.2s',
            zIndex: 10
          }}
          onClick={(e) => {
            e.stopPropagation();
            trackEvent('favorites_toggle', {
              property_id: property.id,
              action: fav ? 'remove' : 'add',
              source: 'property_card',
            });
            toggle(property.id);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = fav ? 'rgba(239, 68, 68, 0.3)' : 'white';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = fav ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.color = fav ? '#ef4444' : 'var(--color-text-secondary)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label={fav ? t('common.removeFavorite') : t('common.addFavorite')}
        >
          <Heart size={18} fill={fav ? '#ef4444' : 'none'} />
        </button>
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          display: 'flex', gap: '0.5rem'
        }}>
          <div style={{
            background: property.status === 'sprzedaz'
              ? 'rgba(34, 34, 34, 0.86)'
              : 'rgba(255, 56, 92, 0.95)',
            color: 'white',
            padding: '0.375rem 0.875rem', borderRadius: '9999px',
            fontSize: '0.75rem', fontWeight: '600',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {property.status === 'sprzedaz' ? t('common.forSale') : t('common.forRent')}
          </div>
          {property.featured && (
            <div style={{
              background: 'white',
              color: '#222222',
              padding: '0.375rem 0.875rem', borderRadius: '9999px',
              fontSize: '0.75rem', fontWeight: '600',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {t('common.featured')}
            </div>
          )}
        </div>
      </div>

      <div className="card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text-main)', margin: 0 }}>{property.title}</h3>
          <span style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '1rem', whiteSpace: 'nowrap' }}>{formattedPrice}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          <MapPin size={15} style={{ marginRight: '0.375rem', color: 'var(--color-text-muted)' }} />
          {property.location}
        </div>

        <div className="card-stats">
          <div>
            <Bed size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>{property.beds}</span>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)' }}>
            <Bath size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>{property.baths}</span>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)' }}>
            <Square size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>{property.sqft} m²</span>
          </div>
        </div>

        <button className="btn-secondary" style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem'
        }}
          onClick={(e) => {
            e.stopPropagation();
            openDetails();
          }}
        >
          {t('common.details')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
