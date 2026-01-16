import { MapPin, Bed, Bath, Square, ArrowRight } from 'lucide-react';

interface PropertyProps {
  image: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
}

export function PropertyCard({ image, title, price, location, beds, baths, sqft }: PropertyProps) {
  return (
    <div className="glass-panel property-card">
      <div className="card-image-wrapper">
        <img
          src={image}
          alt={title}
          className="card-image"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop';
          }}
        />
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
          color: 'white',
          padding: '0.375rem 0.875rem', borderRadius: '9999px',
          fontSize: '0.8rem', fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          Na Sprzedaż
        </div>
      </div>

      <div className="card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', margin: 0 }}>{title}</h3>
          <span style={{ color: '#34d399', fontWeight: '700', fontSize: '1rem', whiteSpace: 'nowrap' }}>{price}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
          <MapPin size={15} style={{ marginRight: '0.375rem', color: '#6b7280' }} />
          {location}
        </div>

        <div className="card-stats">
          <div>
            <Bed size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db' }}>{beds} Bed</span>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <Bath size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db' }}>{baths} Bath</span>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <Square size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db' }}>{sqft} m²</span>
          </div>
        </div>

        <button className="btn-secondary" style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem'
        }}>
          Zobacz Szczegóły <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
