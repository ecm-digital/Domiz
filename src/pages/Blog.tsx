import { useState } from 'react';
import { Calendar, Clock, ArrowRight, Tag, User, TrendingUp, Home, Wrench, Lightbulb, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

const ENGLISH_ARTICLES = [
    ['Property market in 2026: what buyers should expect', 'A practical look at price trends, local factors and the decisions that matter before buying.', 'Market'],
    ['10 things to check before buying a house', 'A buyer’s checklist covering legal status, condition, installations and the surrounding area.', 'Guides'],
    ['Smart Home: building an intelligent home from scratch', 'How to plan automation, wiring and useful features before work begins.', 'Guides'],
    ['Is a rental apartment a worthwhile investment?', 'How to compare purchase price, costs, rent and risk across locations.', 'Investing'],
    ['Kitchen renovation: modern trends for 2026', 'Useful design ideas and practical choices for a functional kitchen.', 'Renovation'],
    ['Mortgage in 2026: how to prepare', 'Key steps to take before comparing financing options for a property purchase.', 'Market'],
];

function EnglishBlog() {
    return <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
        <section style={{ padding: '5rem 0 3rem' }}><div className="container" style={{ textAlign: 'center', maxWidth: 720 }}><span className="section-label">Blog & news</span><h1>Real estate <span className="text-gradient">insights</span></h1><p style={{ color: 'var(--color-text-secondary)' }}>Articles, guides and market perspectives to help you make informed property decisions.</p></div></section>
        <section className="section-padding" style={{ paddingTop: 0 }}><div className="container"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>{ENGLISH_ARTICLES.map(([title, excerpt, category], index) => <article key={title} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}><span style={{ color: 'var(--color-primary)', fontSize: '.85rem' }}>{category}</span><h2 style={{ fontSize: '1.25rem' }}>{title}</h2><p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{excerpt}</p><div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-dim)', fontSize: '.85rem' }}><span><Clock size={14} /> {6 + index} min read</span></div></article>)}</div></div></section>
        <section className="section-padding" style={{ background: 'var(--color-bg-light-alt)' }}><div className="container"><div className="glass-panel" style={{ maxWidth: 700, margin: '0 auto', padding: '3rem', textAlign: 'center', borderRadius: '1.5rem' }}><h2>Stay <span className="text-gradient">up to date</span></h2><p style={{ color: 'var(--color-text-secondary)' }}>Subscribe for new articles and practical real estate insights.</p><form onSubmit={e => e.preventDefault()} style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}><input type="email" placeholder="Your email address" className="search-input" /><button className="btn-primary">Subscribe</button></form></div></div></section>
    </div>;
}

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
        content: `
            <h2>Rynek nieruchomości na Śląsku i w powiecie wołomińskim</h2>
            <p>Rynek nieruchomości jest silnie lokalny. W aglomeracji śląskiej kupujący porównują mieszkania w Katowicach, Chorzowie, Sosnowcu i miastach sąsiednich, zwracając uwagę na komunikację, stan budynku i koszty utrzymania.</p>
            <p>W powiecie wołomińskim ważną rolę odgrywają domy z ogrodem, dostęp do kolei i możliwość wygodnego dojazdu do Warszawy. Tłuszcz i okoliczne miejscowości pozostają interesującą alternatywą dla droższych lokalizacji bliżej stolicy.</p>
            <p>W naszej <a href="/oferty" style="color: var(--color-primary); font-weight: 600; text-decoration: underline;">bazie ofert</a> zestawiamy nieruchomości z obu regionów, dzięki czemu możesz porównać różne typy lokalizacji, metraże i poziomy cen.</p>
        `,
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
        content: `
            <h2>Checklista przed zakupem nieruchomości</h2>
            <p>Zakup domu lub mieszkania to jedna z najważniejszych decyzji finansowych w życiu. Niezależnie od tego, czy wybierasz lokal na Śląsku, czy dom w powiecie wołomińskim, dokładnie zweryfikuj stan prawny i techniczny nieruchomości.</p>
            <p>Po pierwsze, sprawdź Księgę Wieczystą – to w niej znajdują się informacje o ewentualnych obciążeniach hipotecznych lub służebnościach. Po drugie, zwróć uwagę na stan techniczny instalacji, dachu oraz izolacji termicznej. Warto również zweryfikować plany zagospodarzenia przestrzennego dla sąsiadujących działek.</p>
            <p>Sprawdź także komunikację publiczną, planowane inwestycje w sąsiedztwie, wysokość opłat oraz realny czas dojazdu. Te czynniki wpływają na wygodę życia i przyszłą wartość nieruchomości.</p>
        `,
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
        content: `
            <h2>Automatyzacja i inteligentne rozwiązania w nieruchomościach</h2>
            <p>Systemy Smart Home przestają być luksusem dostępnym tylko dla nielicznych, stając się standardem w nowoczesnym budownictwie jednorodzinnym. Inteligentne sterowanie ogrzewaniem, oświetleniem, alarmem czy klimatyzacją to rozwiązania, które podnoszą komfort życia i pozwalają na realne oszczędności finansowe na ogrzewaniu i energii elektrycznej.</p>
            <p>Budując dom lub remontując mieszkanie na Śląsku albo w powiecie wołomińskim, warto zaplanować okablowanie i rozmieszczenie czujników przed rozpoczęciem prac wykończeniowych.</p>
            <p>Zapraszamy do naszego przewodnika <a href="/smart-home" style="color: var(--color-primary); font-weight: 600; text-decoration: underline;">Smart Home</a> i interaktywnego panelu prezentującego najważniejsze funkcje automatyki.</p>
        `,
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
        excerpt: "Jak ocenić rentowność mieszkania pod wynajem na Śląsku i w powiecie wołomińskim? Sprawdzamy najważniejsze koszty i ryzyka.",
        content: `
            <h2>Rentowność najmu w różnych lokalizacjach</h2>
            <p>Na Śląsku znaczenie ma dostęp do miejsc pracy, uczelni i komunikacji między miastami aglomeracji. W powiecie wołomińskim popyt może budować bliskość kolei oraz niższy koszt zakupu niż w Warszawie.</p>
            <p>Przed zakupem policz cenę wejścia, koszty remontu, opłaty stałe, możliwe okresy pustostanu i realny czynsz. Dopiero pełny rachunek pozwala porównać zwrot z różnych ofert.</p>
            <p>Sprawdź nasze <a href="/oferty?type=mieszkanie" style="color: var(--color-primary); font-weight: 600; text-decoration: underline;">mieszkania na sprzedaż</a> i porównaj lokalizacje pod kątem inwestycyjnym.</p>
        `,
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
        content: `
            <h2>Nowoczesna i funkcjonalna kuchnia w Twoim domu</h2>
            <p>Projektowanie kuchni w 2026 roku skupia się na maksymalnej ergonomii, ukrytych systemach przechowywania oraz minimalistycznej estetyce. Coraz chętniej rezygnujemy z wiszących szafek na rzecz dużych przeszkleń otwierających przestrzeń na salon lub ogród.</p>
            <p>Warto pamiętać, że kuchnia jest sercem każdego domu. Odpowiednie rozplanowanie trójkąta roboczego (lodówka, zlew, płyta grzewcza) to klucz do wygodnego gotowania. W Domiz Homes pomagamy klientom nie tylko w wyszukiwaniu nieruchomości, ale również w doradztwie aranżacyjnym i remontowym.</p>
            <p>Przed zakupem warto ocenić koszt wykończenia lub odświeżenia wnętrza i uwzględnić go w całkowitym budżecie nieruchomości.</p>
        `,
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
        content: `
            <h2>Jak sfinansować zakup nieruchomości?</h2>
            <p>Rok 2026 przynosi istotne zmiany w procedurach kredytowych, które mogą ułatwić zakup wymarzonego M. Nowe programy rządowe oraz złagodzenie kryteriów oceny zdolności kredytowej przez KNF sprawiają, że zakup domu staje się bardziej realny.</p>
            <p>Przed złożeniem wniosku warto przeanalizować historię w BIK, zgromadzić wymagany wkład własny i porównać całkowity koszt kredytu. Cena nieruchomości różni się między miastami Śląska i miejscowościami powiatu wołomińskiego, dlatego budżet należy liczyć dla konkretnej oferty.</p>
            <p>Skorzystaj z naszych darmowych <a href="/kalkulatory" style="color: var(--color-primary); font-weight: 600; text-decoration: underline;">kalkulatorów kredytowych</a> online, aby wstępnie wyliczyć swoją ratę lub skontaktuj się z naszym doradcą finansowym, który bezpłatnie porówna dla Ciebie oferty kilkunastu banków.</p>
        `,
        category: "Rynek",
        author: "Marek Wiśniewski",
        date: "2026-01-05",
        readTime: "9 min",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2670&auto=format&fit=crop",
        featured: false
    },
];

export function Blog() {
    const { language } = useLanguage();
    const [activeCategory, setActiveCategory] = useState('Wszystkie');
    const [selectedArticle, setSelectedArticle] = useState<typeof ARTICLES[0] | null>(null);

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

    if (language === 'en') return <EnglishBlog />;

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
                        <div 
                            className="glass-panel" 
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                overflow: 'hidden',
                                borderRadius: '1.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                            onClick={() => setSelectedArticle(featuredArticle)}
                        >
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
                                    <button 
                                        className="btn-primary" 
                                        style={{ marginTop: '1.5rem' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedArticle(featuredArticle);
                                        }}
                                    >
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
                            <article 
                                key={article.id} 
                                className="glass-panel" 
                                style={{
                                    overflow: 'hidden', borderRadius: '1rem',
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column'
                                }}
                                onClick={() => setSelectedArticle(article)}
                            >
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

            {/* Full Article Reader Modal */}
            {selectedArticle && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1.5rem',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                    onClick={() => setSelectedArticle(null)}
                >
                    <div 
                        className="glass-panel"
                        style={{
                            maxWidth: '800px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            background: 'white',
                            borderRadius: '1.5rem',
                            padding: '2.5rem',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxSizing: 'border-box'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedArticle(null)}
                            style={{
                                position: 'absolute',
                                top: '1.5rem',
                                right: '1.5rem',
                                background: 'rgba(0,0,0,0.05)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                color: 'var(--color-text-secondary)',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        >
                            ✕
                        </button>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <span style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--color-primary-dark)',
                                padding: '0.375rem 0.875rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                {selectedArticle.category}
                            </span>
                            <span style={{
                                color: 'var(--color-text-dim)',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                <Clock size={14} /> {selectedArticle.readTime}
                            </span>
                        </div>

                        <h1 style={{ fontSize: '2.25rem', marginBottom: '1.5rem', lineHeight: '1.2', color: 'var(--color-text-main)' }}>
                            {selectedArticle.title}
                        </h1>

                        <div style={{ 
                            display: 'flex', gap: '1.5rem', 
                            color: 'var(--color-text-dim)', fontSize: '0.875rem',
                            borderBottom: '1px solid var(--color-border)',
                            paddingBottom: '1.5rem',
                            marginBottom: '1.5rem',
                            alignItems: 'center'
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <User size={14} /> {selectedArticle.author}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Calendar size={14} /> {formatDate(selectedArticle.date)}
                            </span>
                        </div>

                        {selectedArticle.image && (
                            <img 
                                src={selectedArticle.image} 
                                alt={selectedArticle.title}
                                style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '1rem', marginBottom: '2rem' }}
                            />
                        )}

                        <div 
                            className="blog-modal-rich-content"
                            dangerouslySetInnerHTML={{ __html: selectedArticle.content || selectedArticle.excerpt }}
                            style={{ 
                                fontSize: '1.05rem', 
                                lineHeight: '1.8', 
                                color: 'var(--color-text-secondary)',
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
