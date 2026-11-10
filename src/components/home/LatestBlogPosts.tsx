import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

const LATEST_ARTICLES = [
    {
        id: 1,
        title: "Rynek nieruchomości w 2026 – co czeka kupujących?",
        excerpt: "Analiza trendów cenowych na rynku nieruchomości w Polsce. Czy ceny będą rosnąć, a może nadchodzi korekta? Sprawdzamy prognozy ekspertów i dane GUS.",
        category: "Rynek",
        date: "2026-02-05",
        readTime: "8 min",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2673&auto=format&fit=crop",
    },
    {
        id: 2,
        title: "10 rzeczy, które musisz sprawdzić przed zakupem domu",
        excerpt: "Kompletna checklista dla kupujących dom. Od stanu prawnego po instalacje – nie daj się zaskoczyć ukrytymi wadami nieruchomości.",
        category: "Porady",
        date: "2026-01-28",
        readTime: "12 min",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop",
    },
    {
        id: 3,
        title: "Smart Home – inteligentny dom od podstaw",
        excerpt: "Jak zaplanować i wdrożyć system smart home w nowym domu? Porównujemy popularne ekosystemy i podpowiadamy, od czego zacząć automatyzację.",
        category: "Porady",
        date: "2026-01-20",
        readTime: "10 min",
        image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=2670&auto=format&fit=crop",
    }
];

export function LatestBlogPosts() {
    const navigate = useNavigate();

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleArticleClick = (id: number, title: string) => {
        trackEvent('blog_article_click', { article_id: id, article_title: title, source: 'homepage_feed' });
        navigate('/blog');
    };

    return (
        <section className="home-section latest-blog-section">
            <div className="container">
                <div className="section-header">
                    <div>
                        <span className="section-label">Baza Wiedzy</span>
                        <h2 style={{ marginTop: '0.5rem' }}>Najnowsze porady i analizy</h2>
                    </div>
                    <button
                        className="home-link-btn"
                        onClick={() => {
                            trackEvent('blog_see_all_click', { source: 'homepage' });
                            navigate('/blog');
                        }}
                    >
                        Zobacz cały blog <ArrowRight size={20} strokeWidth={2} />
                    </button>
                </div>

                <div className="blog-posts-grid">
                    {LATEST_ARTICLES.map((article) => (
                        <article
                            key={article.id}
                            className="blog-card-glass"
                            onClick={() => handleArticleClick(article.id, article.title)}
                        >
                            <div className="blog-card-image-wrap">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="blog-card-img"
                                />
                                <span className="blog-card-category">
                                    <Tag size={12} />
                                    {article.category}
                                </span>
                            </div>

                            <div className="blog-card-content">
                                <h3 className="blog-card-title">{article.title}</h3>
                                <p className="blog-card-excerpt">{article.excerpt}</p>

                                <div className="blog-card-footer">
                                    <span className="footer-meta">
                                        <Calendar size={13} />
                                        {formatDate(article.date)}
                                    </span>
                                    <span className="footer-meta">
                                        <Clock size={13} />
                                        {article.readTime}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
