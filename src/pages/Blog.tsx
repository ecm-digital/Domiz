import { useState } from 'react';
import { Calendar, Clock, ArrowRight, Tag, User, TrendingUp, Home, Wrench, Lightbulb, BookOpen } from 'lucide-react';

const CATEGORIES = [
    { name: 'Wszystkie', icon: <BookOpen size={16} /> },
    { name: 'Rynek', icon: <TrendingUp size={16} /> },
    { name: 'Porady', icon: <Lightbulb size={16} /> },
    { name: 'Inwestycje', icon: <Home size={16} /> },
    { name: 'Remonty', icon: <Wrench size={16} /> },
];

const ARTICLES = [
    {
        id: 1,
        title: "Rynek nieruchomości w 2026 – co czeka kupujących?",
        excerpt: "Analiza trendów cenowych na rynku nieruchomości w Polsce. Czy ceny będą rosnąć, a może nadchodzi korekta? Sprawdzamy prognozy ekspertów i dane GUS.",
        category: "Rynek",
        author: "Anna Nowak",
        date: "2026-02-05",
        readTime: "8 min",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2673&auto=format&fit=crop",
        featured: true
    },
    {
        id: 2,
        title: "10 rzeczy, które musisz sprawdzić przed zakupem domu",
        excerpt: "Kompletna checklista dla kupujących dom. Od stanu prawnego po instalacje – nie daj się zaskoczyć ukrytymi wadami nieruchomości.",
        category: "Porady",
        author: "Piotr Kowalski",
        date: "2026-01-28",
        readTime: "12 min",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop",
        featured: false
    },
    {
        id: 3,
        title: "Smart Home – inteligentny dom od podstaw",
        excerpt: "Jak zaplanować i wdrożyć system smart home w nowym domu? Porównujemy popularne ekosystemy i podpowiadamy, od czego zacząć automatyzację.",
        category: "Porady",
        author: "Marek Wiśniewski",
        date: "2026-01-20",
        readTime: "10 min",
        image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=2670&auto=format&fit=crop",
        featured: false
    },
    {
        id: 4,
        title: "Inwestycja w mieszkanie na wynajem – czy to się opłaca?",
        excerpt: "Kalkulacja rentowności inwestycji w mieszkanie pod wynajem w Tłuszczu i okolicach. Ile można zarobić i jakie są ryzyka?",
        category: "Inwestycje",
        author: "Anna Nowak",
        date: "2026-01-15",
        readTime: "7 min",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2672&auto=format&fit=crop",
        featured: false
    },
    {
        id: 5,
        title: "Remont kuchni – nowoczesne trendy na 2026 rok",
        excerpt: "Od minimalistycznych szafek po ukryte AGD – poznaj najgorętsze trendy w projektowaniu kuchni. Inspiracje i praktyczne porady od architektów wnętrz.",
        category: "Remonty",
        author: "Piotr Kowalski",
        date: "2026-01-10",
        readTime: "6 min",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=2670&auto=format&fit=crop",
        featured: false
    },
    {
        id: 6,
        title: "Kredyt hipoteczny 2026 – nowe zasady i lepsze warunki",
        excerpt: "Zmiany w przepisach dotyczących kredytów hipotecznych. Większy wkład własny czy łatwiejsza dostępność? Rozwiewamy wątpliwości.",
        category: "Rynek",
        author: "Marek Wiśniewski",
        date: "2026-01-05",
        readTime: "9 min",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2670&auto=format&fit=crop",
        featured: false
    },
];

export function Blog() {
    const [activeCategory, setActiveCategory] = useState('Wszystkie');

    const filteredArticles = activeCategory === 'Wszystkie'
        ? ARTICLES
        : ARTICLES.filter(a => a.category === activeCategory);

    const featuredArticle = ARTICLES.find(a => a.featured);
    const regularArticles = filteredArticles.filter(a => !a.featured || activeCategory !== 'Wszystkie');

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
            {/* Hero */}
            <section style={{
                padding: '5rem 0 3rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '20%', left: '10%',
                    width: '600px', height: '600px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    borderRadius: '50%', filter: 'blur(100px)',
                    pointerEvents: 'none'
                }} />
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
                        <span className="section-label">Blog & Aktualności</span>
                        <h1 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                            Wiedza o <span className="text-gradient">Nieruchomościach</span>
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', lineHeight: '1.7' }}>
                            Artykuły, porady i analizy rynku. Bądź na bieżąco z trendami i podejmuj świadome decyzje.
                        </p>
                    </div>
                </div>
            </section>

            {/* Featured Article */}
            {activeCategory === 'Wszystkie' && featuredArticle && (
                <section style={{ paddingBottom: '3rem' }}>
                    <div className="container">
                        <div className="glass-panel" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            overflow: 'hidden',
                            borderRadius: '1.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                                <div style={{
                                    height: '100%', minHeight: '300px',
                                    backgroundImage: `url(${featuredArticle.image})`,
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                }} />
                                <div style={{ padding: '2.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        <span style={{
                                            background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)',
                                            padding: '0.375rem 0.875rem', borderRadius: '999px',
                                            fontSize: '0.8rem', fontWeight: 600
                                        }}>
                                            ⭐ Wyróżniony
                                        </span>
                                        <span style={{
                                            background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-primary-dark)',
                                            padding: '0.375rem 0.875rem', borderRadius: '999px',
                                            fontSize: '0.8rem', fontWeight: 500
                                        }}>
                                            {featuredArticle.category}
                                        </span>
                                    </div>
                                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', lineHeight: '1.3' }}>
                                        {featuredArticle.title}
                                    </h2>
                                    <p style={{
                                        color: 'var(--color-text-secondary)',
                                        lineHeight: '1.7', fontSize: '1rem', marginBottom: '1.5rem'
                                    }}>
                                        {featuredArticle.excerpt}
                                    </p>
                                    <div style={{
                                        display: 'flex', gap: '1.5rem',
                                        color: 'var(--color-text-dim)', fontSize: '0.875rem',
                                        alignItems: 'center', flexWrap: 'wrap'
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <User size={14} /> {featuredArticle.author}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Calendar size={14} /> {formatDate(featuredArticle.date)}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Clock size={14} /> {featuredArticle.readTime}
                                        </span>
                                    </div>
                                    <button className="btn-primary" style={{ marginTop: '1.5rem' }}>
                                        Czytaj artykuł <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Categories */}
            <section style={{ paddingBottom: '1rem' }}>
                <div className="container">
                    <div style={{
                        display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
                        justifyContent: 'center', padding: '1rem 0'
                    }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.625rem 1.25rem',
                                    borderRadius: '999px',
                                    border: `1px solid ${activeCategory === cat.name ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: activeCategory === cat.name
                                        ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
                                        : 'white',
                                    color: activeCategory === cat.name ? 'white' : 'var(--color-text-secondary)',
                                    fontWeight: 500, fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="section-padding" style={{ paddingTop: '2rem' }}>
                <div className="container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '2rem'
                    }}>
                        {regularArticles.map(article => (
                            <article key={article.id} className="glass-panel" style={{
                                overflow: 'hidden', borderRadius: '1rem',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column'
                            }}>
                                <div style={{
                                    height: '200px', overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        style={{
                                            width: '100%', height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s ease'
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    />
                                    <span style={{
                                        position: 'absolute', top: '1rem', left: '1rem',
                                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                                        background: 'rgba(255,255,255,0.95)',
                                        padding: '0.375rem 0.75rem', borderRadius: '999px',
                                        fontSize: '0.8rem', fontWeight: 600,
                                        color: 'var(--color-primary-dark)',
                                        backdropFilter: 'blur(8px)'
                                    }}>
                                        <Tag size={12} /> {article.category}
                                    </span>
                                </div>
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <h3 style={{
                                        fontSize: '1.2rem', fontWeight: 600,
                                        marginBottom: '0.75rem', lineHeight: '1.4',
                                        color: 'var(--color-text-main)'
                                    }}>
                                        {article.title}
                                    </h3>
                                    <p style={{
                                        color: 'var(--color-text-secondary)',
                                        fontSize: '0.95rem', lineHeight: '1.6',
                                        marginBottom: '1.25rem', flexGrow: 1
                                    }}>
                                        {article.excerpt}
                                    </p>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', paddingTop: '1rem',
                                        borderTop: '1px solid var(--color-border)',
                                        fontSize: '0.8rem', color: 'var(--color-text-dim)'
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Calendar size={13} /> {formatDate(article.date)}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Clock size={13} /> {article.readTime}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="section-padding" style={{ background: 'var(--color-bg-light-alt)' }}>
                <div className="container">
                    <div className="glass-panel" style={{
                        maxWidth: '700px', margin: '0 auto',
                        padding: '3.5rem 3rem', textAlign: 'center',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-50px', right: '-50px',
                            width: '200px', height: '200px',
                            background: 'rgba(16, 185, 129, 0.06)',
                            borderRadius: '50%', filter: 'blur(40px)',
                            pointerEvents: 'none'
                        }} />
                        <h2 style={{ marginBottom: '0.75rem' }}>
                            Bądź na <span className="text-gradient">bieżąco</span>
                        </h2>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            marginBottom: '2rem', maxWidth: '450px', margin: '0 auto 2rem'
                        }}>
                            Zapisz się na nasz newsletter i otrzymuj najnowsze artykuły oraz porady prosto na swoją skrzynkę.
                        </p>
                        <form onSubmit={e => e.preventDefault()} style={{
                            display: 'flex', gap: '0.75rem',
                            maxWidth: '480px', margin: '0 auto',
                            flexWrap: 'wrap', justifyContent: 'center'
                        }}>
                            <input
                                type="email"
                                placeholder="Twój adres e-mail"
                                className="search-input"
                                style={{ flex: '1 1 250px', minWidth: '200px' }}
                            />
                            <button className="btn-primary" type="submit">
                                Subskrybuj
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
