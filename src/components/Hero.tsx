import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/oferty?search=${encodeURIComponent(searchQuery)}`);
    };

    return (
        <section className="hero-section">
            <div className="hero-bg-overlay" />

            <div className="container hero-grid">
                <div className="hero-content">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', width: 'fit-content' }}>
                        <span className="relative flex h-2 w-2">
                            <span style={{
                                position: 'absolute', display: 'inline-flex', height: '100%', width: '100%',
                                borderRadius: '50%', background: '#34d399', opacity: 0.75, animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
                            }}></span>
                            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '0.5rem', width: '0.5rem', background: '#10b981' }}></span>
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, marginLeft: '0.5rem' }}>Nowoczesne Nieruchomości</span>
                    </div>

                    <h1>
                        Znajdź Swoje <br />
                        <span className="text-gradient">Wymarzone Miejsce</span>
                    </h1>

                    <p style={{ color: '#9ca3af', fontSize: '1.25rem', maxWidth: '600px', marginBottom: '2rem', lineHeight: '1.6' }}>
                        Odkryj wyselekcjonowane oferty domów i mieszkań w Tłuszczu i okolicach.
                        Łączymy technologię z pasją do nieruchomości.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button className="btn-primary" onClick={() => navigate('/oferty')}>
                            Przeglądaj Oferty
                            <ArrowRight size={20} />
                        </button>
                        <button style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #374151', color: 'white', background: 'transparent', cursor: 'pointer', fontWeight: '500' }} onClick={() => navigate('/dodaj-nieruchomosc')}>
                            Sprzedaj Nieruchomość
                        </button>
                    </div>

                    <div className="hero-stats">
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>150+</p>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', margin: 0 }}>Ofert</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>85+</p>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', margin: 0 }}>Sprzedanych</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>12+</p>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', margin: 0 }}>Lat Doświadczenia</p>
                        </div>
                    </div>
                </div>

                {/* Search Card */}
                <div style={{ position: 'relative' }} className="md:block">
                    <form onSubmit={handleSearch} className="search-card">
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', marginTop: 0 }}>Szybkie Wyszukiwanie</h3>

                        <div className="search-input-group">
                            <label style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Lokalizacja lub nazwa</label>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Wpisz miasto, ulicę..."
                                    className="search-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Typ</label>
                                <select className="search-input">
                                    <option>Wszystkie</option>
                                    <option>Dom</option>
                                    <option>Mieszkanie</option>
                                    <option>Działka</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Cena do</label>
                                <select className="search-input">
                                    <option>Dowolna</option>
                                    <option>500 000 PLN</option>
                                    <option>1 000 000 PLN</option>
                                    <option>2 000 000 PLN</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>
                            Szukaj
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
