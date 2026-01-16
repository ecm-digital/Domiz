import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, ArrowRight, Search, SlidersHorizontal, Grid, List, Heart, X } from 'lucide-react';

const PROPERTIES = [
    {
        id: 1,
        title: "Nowoczesna Willa z Basenem",
        price: 1250000,
        location: "Tłuszcz, Aleja Lipowa",
        beds: 4,
        baths: 3,
        sqft: 220,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop",
        featured: true,
        description: "Luksusowa willa z basenem, ogrodem i garażem na 2 samochody. Wysoki standard wykończenia."
    },
    {
        id: 2,
        title: "Apartament w Centrum",
        price: 450000,
        location: "Tłuszcz, ul. Warszawska",
        beds: 2,
        baths: 1,
        sqft: 65,
        type: "mieszkanie",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop",
        featured: false,
        description: "Nowoczesny apartament w centrum miasta z balkonem i miejscem parkingowym."
    },
    {
        id: 3,
        title: "Dom Rodzinny na Przedmieściach",
        price: 890000,
        location: "Jasienica, ul. Centralna",
        beds: 5,
        baths: 2,
        sqft: 180,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop",
        featured: true,
        description: "Przestronny dom rodzinny z dużym ogrodem, idealny dla rodziny z dziećmi."
    },
    {
        id: 4,
        title: "Kawalerka do Wynajęcia",
        price: 2200,
        location: "Tłuszcz, ul. Kolejowa",
        beds: 1,
        baths: 1,
        sqft: 32,
        type: "mieszkanie",
        status: "wynajem",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2680&auto=format&fit=crop",
        featured: false,
        description: "Przytulna kawalerka blisko stacji PKP, idealna dla singla lub pary."
    },
    {
        id: 5,
        title: "Działka Budowlana 1000m²",
        price: 180000,
        location: "Postoliska, ul. Polna",
        beds: 0,
        baths: 0,
        sqft: 1000,
        type: "dzialka",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2532&auto=format&fit=crop",
        featured: false,
        description: "Działka budowlana z mediami przy granicy, gotowa pod budowę domu jednorodzinnego."
    },
    {
        id: 6,
        title: "Bliźniak z Ogrodem",
        price: 720000,
        location: "Tłuszcz, ul. Ogrodowa",
        beds: 4,
        baths: 2,
        sqft: 145,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop",
        featured: true,
        description: "Nowoczesny bliźniak z ogrodem i tarasem, energia A+, pompa ciepła."
    },
    {
        id: 7,
        title: "Mieszkanie 3-pokojowe",
        price: 3500,
        location: "Tłuszcz, ul. Sportowa",
        beds: 3,
        baths: 1,
        sqft: 72,
        type: "mieszkanie",
        status: "wynajem",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2670&auto=format&fit=crop",
        featured: false,
        description: "Przestronne mieszkanie 3-pokojowe z balkonem, umeblowane, gotowe do zamieszkania."
    },
    {
        id: 8,
        title: "Dom Ekologiczny",
        price: 1150000,
        location: "Mokra Wieś, ul. Słoneczna",
        beds: 4,
        baths: 2,
        sqft: 160,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2670&auto=format&fit=crop",
        featured: false,
        description: "Pasywny dom z panelami fotowoltaicznymi, pompą ciepła i rekuperacją."
    },
];

type PropertyType = 'wszystkie' | 'dom' | 'mieszkanie' | 'dzialka';
type PropertyStatus = 'wszystkie' | 'sprzedaz' | 'wynajem';

export function Properties() {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

    useEffect(() => {
        const query = searchParams.get('search');
        if (query !== null) {
            setSearchQuery(query);
        }
    }, [searchParams]);
    const [propertyType, setPropertyType] = useState<PropertyType>('wszystkie');
    const [propertyStatus, setPropertyStatus] = useState<PropertyStatus>('wszystkie');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [favorites, setFavorites] = useState<number[]>([]);

    const toggleFavorite = (id: number) => {
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const filteredProperties = PROPERTIES.filter(property => {
        const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = propertyType === 'wszystkie' || property.type === propertyType;
        const matchesStatus = propertyStatus === 'wszystkie' || property.status === propertyStatus;
        const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];

        return matchesSearch && matchesType && matchesStatus && matchesPrice;
    });

    const formatPrice = (price: number, status: string) => {
        if (status === 'wynajem') {
            return `${price.toLocaleString('pl-PL')} zł/mies.`;
        }
        return `${price.toLocaleString('pl-PL')} zł`;
    };

    return (
        <div style={{ background: '#f8faf9', minHeight: '100vh', paddingTop: '100px' }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
                padding: '3rem 0',
                color: 'white'
            }}>
                <div className="container">
                    <h1 style={{
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                        fontWeight: '800',
                        marginBottom: '0.5rem',
                        textAlign: 'center'
                    }}>
                        Oferty Nieruchomości
                    </h1>
                    <p style={{
                        textAlign: 'center',
                        opacity: 0.8,
                        marginBottom: '2rem',
                        maxWidth: '600px',
                        margin: '0 auto 2rem'
                    }}>
                        Znajdź swój wymarzony dom lub mieszkanie w Tłuszczu i okolicach
                    </p>

                    {/* Search Bar */}
                    <div style={{
                        maxWidth: '700px',
                        margin: '0 auto',
                        display: 'flex',
                        gap: '0.5rem'
                    }}>
                        <div style={{
                            flex: 1,
                            position: 'relative'
                        }}>
                            <Search size={20} style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#6b7280'
                            }} />
                            <input
                                type="text"
                                placeholder="Szukaj po nazwie lub lokalizacji..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                padding: '0 1.25rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                background: showFilters ? '#10b981' : 'white',
                                color: showFilters ? 'white' : '#1f2937',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '500'
                            }}
                        >
                            <SlidersHorizontal size={20} />
                            Filtry
                        </button>
                    </div>
                </div>
            </section>

            {/* Filters Panel */}
            {showFilters && (
                <section style={{
                    background: 'white',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '1.5rem 0'
                }}>
                    <div className="container">
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
                                    color: '#6b7280',
                                    marginBottom: '0.5rem'
                                }}>
                                    Typ nieruchomości
                                </label>
                                <select
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                                    style={{
                                        padding: '0.625rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.95rem',
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="wszystkie">Wszystkie</option>
                                    <option value="dom">Domy</option>
                                    <option value="mieszkanie">Mieszkania</option>
                                    <option value="dzialka">Działki</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    marginBottom: '0.5rem'
                                }}>
                                    Status
                                </label>
                                <select
                                    value={propertyStatus}
                                    onChange={(e) => setPropertyStatus(e.target.value as PropertyStatus)}
                                    style={{
                                        padding: '0.625rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.95rem',
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="wszystkie">Wszystkie</option>
                                    <option value="sprzedaz">Na sprzedaż</option>
                                    <option value="wynajem">Do wynajęcia</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    marginBottom: '0.5rem'
                                }}>
                                    Cena do: {priceRange[1].toLocaleString('pl-PL')} zł
                                </label>
                                <input
                                    type="range"
                                    min="50000"
                                    max="2000000"
                                    step="50000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                            </div>

                            {/* Clear Filters */}
                            <button
                                onClick={() => {
                                    setPropertyType('wszystkie');
                                    setPropertyStatus('wszystkie');
                                    setPriceRange([0, 2000000]);
                                    setSearchQuery('');
                                }}
                                style={{
                                    padding: '0.625rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb',
                                    background: 'white',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <X size={16} />
                                Wyczyść
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Results Section */}
            <section style={{ padding: '2rem 0 4rem' }}>
                <div className="container">
                    {/* Results Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <p style={{ color: '#6b7280', margin: 0 }}>
                            Znaleziono <strong style={{ color: '#1f2937' }}>{filteredProperties.length}</strong> ofert
                        </p>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb',
                                    background: viewMode === 'grid' ? '#10b981' : 'white',
                                    color: viewMode === 'grid' ? 'white' : '#6b7280',
                                    cursor: 'pointer'
                                }}
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb',
                                    background: viewMode === 'list' ? '#10b981' : 'white',
                                    color: viewMode === 'list' ? 'white' : '#6b7280',
                                    cursor: 'pointer'
                                }}
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Properties Grid/List */}
                    {filteredProperties.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            background: 'white',
                            borderRadius: '1rem'
                        }}>
                            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                                Nie znaleziono ofert spełniających kryteria wyszukiwania.
                            </p>
                            <button
                                onClick={() => {
                                    setPropertyType('wszystkie');
                                    setPropertyStatus('wszystkie');
                                    setPriceRange([0, 2000000]);
                                    setSearchQuery('');
                                }}
                                className="btn-primary"
                                style={{ marginTop: '1rem' }}
                            >
                                Wyczyść filtry
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: viewMode === 'grid'
                                ? 'repeat(auto-fill, minmax(320px, 1fr))'
                                : '1fr',
                            gap: '1.5rem'
                        }}>
                            {filteredProperties.map((property) => (
                                <div
                                    key={property.id}
                                    style={{
                                        background: 'white',
                                        borderRadius: '1rem',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        display: viewMode === 'list' ? 'flex' : 'block',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                                    }}
                                >
                                    {/* Image */}
                                    <div style={{
                                        position: 'relative',
                                        width: viewMode === 'list' ? '280px' : '100%',
                                        height: viewMode === 'list' ? '200px' : '220px',
                                        flexShrink: 0
                                    }}>
                                        <img
                                            src={property.image}
                                            alt={property.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />

                                        {/* Badges */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            left: '1rem',
                                            display: 'flex',
                                            gap: '0.5rem'
                                        }}>
                                            <span style={{
                                                background: property.status === 'sprzedaz'
                                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                color: 'white',
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {property.status === 'sprzedaz' ? 'Na Sprzedaż' : 'Wynajem'}
                                            </span>
                                            {property.featured && (
                                                <span style={{
                                                    background: '#fbbf24',
                                                    color: '#1f2937',
                                                    padding: '0.375rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    Wyróżniona
                                                </span>
                                            )}
                                        </div>

                                        {/* Favorite Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(property.id);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '1rem',
                                                right: '1rem',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: 'white',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            <Heart
                                                size={18}
                                                fill={favorites.includes(property.id) ? '#ef4444' : 'none'}
                                                color={favorites.includes(property.id) ? '#ef4444' : '#6b7280'}
                                            />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '1.25rem', flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '0.5rem',
                                            gap: '1rem'
                                        }}>
                                            <h3 style={{
                                                fontSize: '1.125rem',
                                                fontWeight: '600',
                                                color: '#1f2937',
                                                margin: 0
                                            }}>
                                                {property.title}
                                            </h3>
                                            <span style={{
                                                color: '#10b981',
                                                fontWeight: '700',
                                                fontSize: '1.125rem',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {formatPrice(property.price, property.status)}
                                            </span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#6b7280',
                                            fontSize: '0.875rem',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <MapPin size={15} style={{ marginRight: '0.375rem' }} />
                                            {property.location}
                                        </div>

                                        {viewMode === 'list' && (
                                            <p style={{
                                                color: '#6b7280',
                                                fontSize: '0.875rem',
                                                marginBottom: '1rem',
                                                lineHeight: '1.6'
                                            }}>
                                                {property.description}
                                            </p>
                                        )}

                                        {/* Stats */}
                                        {property.type !== 'dzialka' && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '1.5rem',
                                                paddingTop: '0.75rem',
                                                borderTop: '1px solid #f3f4f6'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#6b7280' }}>
                                                    <Bed size={16} />
                                                    <span style={{ fontSize: '0.875rem' }}>{property.beds}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#6b7280' }}>
                                                    <Bath size={16} />
                                                    <span style={{ fontSize: '0.875rem' }}>{property.baths}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#6b7280' }}>
                                                    <Square size={16} />
                                                    <span style={{ fontSize: '0.875rem' }}>{property.sqft} m²</span>
                                                </div>
                                            </div>
                                        )}

                                        {property.type === 'dzialka' && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.375rem',
                                                color: '#6b7280',
                                                paddingTop: '0.75rem',
                                                borderTop: '1px solid #f3f4f6'
                                            }}>
                                                <Square size={16} />
                                                <span style={{ fontSize: '0.875rem' }}>Powierzchnia: {property.sqft} m²</span>
                                            </div>
                                        )}

                                        {viewMode === 'list' && (
                                            <button
                                                className="btn-primary"
                                                style={{
                                                    marginTop: '1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                Zobacz szczegóły <ArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
