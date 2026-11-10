import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useLanguage } from '../context/useLanguage';
import { 
    Train, Car, GraduationCap, ShoppingBag, Trees, 
    ArrowRight, ShieldCheck, Compass 
} from 'lucide-react';

const PAGE_TEXTS = {
    pl: {
        breadcrumb: 'O Tłuszczu',
        badge: 'Przewodnik lokalny',
        title: 'Tłuszcz – Twoje miejsce pod Warszawą',
        desc: 'Poznaj zielone, spokojne miasto z doskonałym połączeniem kolejowym z Warszawą. To idealna lokalizacja na Twój nowy dom pod Warszawą w Tłuszczu, łącząca ciszę z pełną infrastrukturą miejską.',
        ctaBrowse: 'Zobacz oferty w Tłuszczu',
        ctaContact: 'Porozmawiaj z agentem',
        
        statCommuteVal: '38 min',
        statCommuteLbl: 'PKP do Warszawy Wileńskiej',
        statNatureVal: '30%',
        statNatureLbl: 'Lasy i tereny zielone',
        statPriceVal: 'nawet -40%',
        statPriceLbl: 'Tańsze działki niż w Warszawie',
        statInfrastructureVal: 'Pełna',
        statInfrastructureLbl: 'Infrastruktura na miejscu',
        
        commuteTitle: 'Szybki dojazd do Warszawy',
        commuteDesc: 'Tłuszcz to doskonały wybór na dom pod Warszawą. Miasto jest jednym z najlepiej skomunikowanych punktów w powiecie wołomińskim. Pociągi Kolei Mazowieckich kursują niezwykle często, zapewniając komfortowy i szybki dojazd do stolicy bez stania w korkach.',
        trainTitle: 'Szybki Pociąg (PKP)',
        trainDesc: 'Regularne i szybkie połączenia do stacji Warszawa Wileńska (przesiadka na II linię metra w zaledwie 38 minut) oraz bezpośrednie składy do stacji Warszawa Gdańska i Warszawa Zachodnia.',
        carTitle: 'Samochód i Trasa S8',
        carDesc: 'Dojazd drogą wojewódzką nr 634 lub szybką trasą S8 (węzeł w Radzyminie lub Wołominie). Czas dojazdu do granicy Warszawy to około 30-40 minut.',
        
        infraTitle: 'Wszystko, czego potrzebujesz na co dzień',
        infraDesc: 'Mimo kameralnego charakteru, Tłuszcz oferuje pełną infrastrukturę miejską. Szkoły, przedszkola, sklepy i ośrodki zdrowia są na wyciągnięcie ręki.',
        tabEducation: 'Edukacja i Żłobki',
        tabEducationDesc: 'W Tłuszczu funkcjonują nowoczesne przedszkola, żłobki oraz dobrze oceniane szkoły podstawowe i średnie. Jeśli wybierasz mieszkanie dla rodziny w Tłuszczu, Twoje dzieci będą miały zapewnioną doskonałą opiekę i edukację na miejscu, bez konieczności codziennych dalekich dojazdów do większych miast.',
        tabShopping: 'Zakupy i Usługi',
        tabShoppingDesc: 'Na miejscu znajdziesz popularne markety (Lidl, Biedronka, Dino, Polo Market), lokalne sklepy ze zdrową żywnością, piekarnie, banki, apteki oraz cotygodniowy tradycyjny targ z produktami od lokalnych rolników.',
        tabRecreation: 'Sport i Rekreacja',
        tabRecreationDesc: 'Dla aktywnych mieszkańców dostępna jest nowoczesna hala sportowa, boiska, korty tenisowe oraz prężnie działający Dom Kultury. Okoliczne lasy i ścieżki rowerowe sprzyjają pieszym wędrówkom i wycieczkom.',
        
        marketTitle: 'Dlaczego warto zamieszkać w Tłuszczu?',
        marketDesc: 'Ceny nieruchomości w Warszawie osiągają rekordowe poziomy. Tłuszcz to doskonała alternatywa – płacisz znacznie mniej za metr kwadratowy, zyskując własny ogród, przestrzeń i czyste powietrze.',
        marketCard1Title: 'Większa przestrzeń dla rodziny',
        marketCard1Desc: 'W cenie małego, 2-pokojowego mieszkania w Warszawie możesz u nas kupić nowoczesny, energooszczędny dom bliźniaczy z własnym ogrodem i garażem.',
        marketCard2Title: 'Bezpieczna i pewna inwestycja',
        marketCard2Desc: 'Wartość działek i domów w powiecie wołomińskim stale rośnie ze względu na ciągły rozwój infrastruktury komunikacyjnej i bliskość stolicy.',
        marketCard3Title: 'Zdrowe otoczenie i natura',
        marketCard3Desc: 'Otoczenie lasów, brak dużego przemysłu i kameralna, niska zabudowa jednorodzinna sprzyjają zdrowemu stylowi życia i odpoczynkowi po pracy.',
        
        ctaTitle: 'Szukasz swojego miejsca w Tłuszczu?',
        ctaDesc: 'Pomożemy Ci znaleźć idealną działkę, dom tradycyjny lub nowoczesne osiedle. Skorzystaj z naszej lokalnej wiedzy i znajdź swój wymarzony dom.',
        ctaButton: 'Napisz do nas',
    },
    en: {
        breadcrumb: 'About Tłuszcz',
        badge: 'Local Guide',
        title: 'Tłuszcz – Your Place Near Warsaw',
        desc: 'Discover a green, peaceful town with excellent rail connection to Warsaw. The perfect location for your new home.',
        ctaBrowse: 'View Listings in Tłuszcz',
        ctaContact: 'Talk to an Agent',
        
        statCommuteVal: '38 min',
        statCommuteLbl: 'Train to Warsaw Wilenska',
        statNatureVal: '30%',
        statNatureLbl: 'Forests and green areas',
        statPriceVal: 'up to -40%',
        statPriceLbl: 'Cheaper plots than in Warsaw',
        statInfrastructureVal: 'Full',
        statInfrastructureLbl: 'Infrastructure on site',
        
        commuteTitle: 'Fast Commute to Warsaw',
        commuteDesc: 'Tłuszcz is one of the best-connected towns in the Wołomin county. Koleje Mazowieckie trains run very frequently, ensuring a comfortable commute to the capital without traffic.',
        trainTitle: 'Fast Train (PKP)',
        trainDesc: 'Regular and fast connections to Warsaw Wileńska station (transfer to Metro Line 2 in just 38 minutes) as well as direct trains to Warsaw Gdańska and Warsaw Zachodnia.',
        carTitle: 'Car & S8 Expressway',
        carDesc: 'Access via regional road 634 or the fast S8 expressway (junction in Radzymin or Wołomin). Driving time to Warsaw border is about 30-40 minutes.',
        
        infraTitle: 'Everything you need daily',
        infraDesc: 'Despite its cozy character, Tłuszcz offers full urban infrastructure. Schools, kindergartens, shops, and health centers are within easy reach.',
        tabEducation: 'Education & Daycare',
        tabEducationDesc: 'Tłuszcz features modern kindergartens, nurseries, well-rated primary schools, and the K.K. Baczyński secondary school complex. Children are provided with excellent care and education locally.',
        tabShopping: 'Shopping & Services',
        tabShoppingDesc: 'Locally you will find popular supermarkets (Lidl, Biedronka, Dino, Polo Market), local organic food shops, bakeries, banks, pharmacies, and a weekly traditional open market with local farm products.',
        tabRecreation: 'Sport & Recreation',
        tabRecreationDesc: 'For active residents, there is a modern sports hall, sports fields, tennis courts, and an active Cultural Center. Surrounding forests and cycling paths are perfect for hikes and family trips.',
        
        marketTitle: 'Why settle in Tłuszcz?',
        marketDesc: 'Property prices in Warsaw are reaching record highs. Tłuszcz is a great alternative – you pay significantly less per square meter, gaining your own garden, space, and clean air.',
        marketCard1Title: 'More space for the family',
        marketCard1Desc: 'For the price of a small 2-room apartment in Warsaw, you can buy a modern, energy-efficient semi-detached house with your own garden and garage here.',
        marketCard2Title: 'Safe & solid investment',
        marketCard2Desc: 'The value of land and houses in Wołomin county is steadily growing due to continuous development of transport links and proximity to the capital.',
        marketCard3Title: 'Healthy environment & nature',
        marketCard3Desc: 'Forest surroundings, lack of heavy industry, and low-density single-family housing support a healthy lifestyle and relaxation after work.',
        
        ctaTitle: 'Looking for your home in Tłuszcz?',
        ctaDesc: 'We will help you find the perfect plot, traditional house, or modern estate. Benefit from our local expertise and find your dream home.',
        ctaButton: 'Write to us',
    }
};

export function AboutTL() {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'edu' | 'shop' | 'rec'>('edu');

    const text = PAGE_TEXTS[language] || PAGE_TEXTS.pl;

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', background: 'var(--color-bg-light)' }}>
            <div className="container" style={{ paddingTop: '1rem' }}>
                <Breadcrumbs items={[{ label: text.breadcrumb }]} />
            </div>

            {/* Hero Section */}
            <section style={{ padding: '4rem 0 3rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', top: '10%', right: '-5%',
                    width: '600px', height: '600px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: '50%', filter: 'blur(120px)',
                    pointerEvents: 'none'
                }} />
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                        <div>
                            <span className="section-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Compass size={14} /> {text.badge}
                            </span>
                            <h1 style={{ marginTop: '0.5rem', marginBottom: '1.25rem', fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', lineHeight: '1.15' }}>
                                {text.title}
                            </h1>
                            <p style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: '1.125rem', lineHeight: '1.75',
                                marginBottom: '2.25rem'
                            }}>
                                {text.desc}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button className="btn-primary" onClick={() => navigate('/oferty?search=tłuszcz')}>
                                    {text.ctaBrowse} <ArrowRight size={18} />
                                </button>
                                <button className="btn-secondary" onClick={() => navigate('/osiedle-tluszcz#kontakt')}>
                                    {text.ctaContact}
                                </button>
                            </div>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div className="glass-panel" style={{
                                borderRadius: '1.5rem', overflow: 'hidden', padding: '0.5rem',
                                border: '1px solid rgba(16, 185, 129, 0.15)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
                            }}>
                                <img 
                                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop" 
                                    alt="Modern house in Tłuszcz area" 
                                    style={{ width: '100%', height: 'auto', borderRadius: '1rem', display: 'block', objectFit: 'cover', maxHeight: '400px' }}
                                />
                            </div>
                            <div className="glass-panel hero-floating-card" style={{
                                position: 'absolute', bottom: '-20px', left: '-20px',
                                padding: '1rem 1.5rem', borderRadius: '1rem',
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                background: 'rgba(255, 255, 255, 0.85)',
                                backdropFilter: 'blur(12px)',
                            }}>
                                <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} />
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{language === 'en' ? 'Local experts' : 'Lokalni eksperci'}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{language === 'en' ? 'We know every street in Tłuszcz' : 'Znamy każdą ulicę w Tłuszczu'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Row */}
            <section style={{ padding: '2rem 0 4rem' }}>
                <div className="container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {[
                            { val: text.statCommuteVal, lbl: text.statCommuteLbl },
                            { val: text.statNatureVal, lbl: text.statNatureLbl },
                            { val: text.statPriceVal, lbl: text.statPriceLbl },
                            { val: text.statInfrastructureVal, lbl: text.statInfrastructureLbl }
                        ].map((stat, i) => (
                            <div key={i} className="glass-panel" style={{
                                padding: '2rem 1.5rem', borderRadius: '1.25rem', textAlign: 'center',
                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                transition: 'transform 0.3s ease'
                            }}>
                                <p style={{
                                    fontSize: '2.25rem', fontWeight: 850, margin: '0 0 0.5rem',
                                    background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    {stat.val}
                                </p>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: '1.4' }}>
                                    {stat.lbl}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Commute Connection Section */}
            <section className="section-padding" style={{ background: 'var(--color-bg-light-alt)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                        <div>
                            <div className="glass-panel" style={{
                                borderRadius: '1.5rem', overflow: 'hidden', padding: '0.5rem',
                                border: '1px solid var(--color-border)',
                                boxShadow: '0 15px 35px rgba(0,0,0,0.05)'
                            }}>
                                <img 
                                    src="https://images.unsplash.com/photo-1541417904950-b855846fe074?q=80&w=1200&auto=format&fit=crop" 
                                    alt="Train connection PKP Tłuszcz" 
                                    style={{ width: '100%', height: 'auto', borderRadius: '1rem', display: 'block', objectFit: 'cover', maxHeight: '350px' }}
                                />
                            </div>
                        </div>
                        <div>
                            <span className="section-label">{t('nav.more')}</span>
                            <h2 style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                                {text.commuteTitle}
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.75', marginBottom: '2rem' }}>
                                {text.commuteDesc}
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--color-primary)', flexShrink: 0
                                    }}>
                                        <Train size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-main)' }}>
                                            {text.trainTitle}
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                                            {text.trainDesc}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#3b82f6', flexShrink: 0
                                    }}>
                                        <Car size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-main)' }}>
                                            {text.carTitle}
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                                            {text.carDesc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Infrastructure Interactive Section */}
            <section className="section-padding">
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        <span className="section-label">Udogodnienia</span>
                        <h2 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                            {text.infraTitle}
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
                            {text.infraDesc}
                        </p>
                    </div>

                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {/* Tab Buttons */}
                        <div style={{
                            display: 'flex', gap: '0.75rem', justifyContent: 'center',
                            marginBottom: '2rem', flexWrap: 'wrap'
                        }}>
                            {[
                                { id: 'edu', label: text.tabEducation, icon: <GraduationCap size={18} /> },
                                { id: 'shop', label: text.tabShopping, icon: <ShoppingBag size={18} /> },
                                { id: 'rec', label: text.tabRecreation, icon: <Trees size={18} /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.75rem 1.5rem', borderRadius: '0.875rem',
                                        border: `1px solid ${activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.08)' : 'white',
                                        color: activeTab === tab.id ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                                        fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: activeTab === tab.id ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none'
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content Panel */}
                        <div className="glass-panel animate-fadeIn" style={{
                            padding: '2.5rem', borderRadius: '1.5rem',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            background: 'white',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                        }}>
                            {activeTab === 'edu' && (
                                <div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                                        <GraduationCap size={22} style={{ color: 'var(--color-primary)' }} /> {text.tabEducation}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', fontSize: '1rem', margin: 0 }}>
                                        {text.tabEducationDesc}
                                    </p>
                                </div>
                            )}
                            {activeTab === 'shop' && (
                                <div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                                        <ShoppingBag size={22} style={{ color: 'var(--color-primary)' }} /> {text.tabShopping}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', fontSize: '1rem', margin: 0 }}>
                                        {text.tabShoppingDesc}
                                    </p>
                                </div>
                            )}
                            {activeTab === 'rec' && (
                                <div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                                        <Trees size={22} style={{ color: 'var(--color-primary)' }} /> {text.tabRecreation}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', fontSize: '1rem', margin: 0 }}>
                                        {text.tabRecreationDesc}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Tłuszcz Market Section */}
            <section className="section-padding" style={{ background: 'var(--color-bg-light-alt)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        <span className="section-label">{language === 'en' ? 'Property market' : 'Rynek nieruchomości'}</span>
                        <h2 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                            {text.marketTitle}
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            {text.marketDesc}
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            { icon: <Compass size={24} />, title: text.marketCard1Title, desc: text.marketCard1Desc },
                            { icon: <ShieldCheck size={24} />, title: text.marketCard2Title, desc: text.marketCard2Desc },
                            { icon: <Trees size={24} />, title: text.marketCard3Title, desc: text.marketCard3Desc }
                        ].map((card, i) => (
                            <div key={i} className="glass-panel" style={{
                                padding: '2.25rem 2rem', borderRadius: '1.25rem',
                                display: 'flex', flexDirection: 'column', gap: '1rem',
                                background: 'white', border: '1px solid var(--color-border)',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '0.75rem',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--color-primary)', flexShrink: 0
                                }}>
                                    {card.icon}
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-main)', margin: '0.25rem 0 0' }}>
                                    {card.title}
                                </h3>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                                    {card.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section-padding" style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
                    pointerEvents: 'none'
                }} />
                <div className="container">
                    <div className="glass-panel" style={{
                        padding: '4rem 3rem', textAlign: 'center',
                        maxWidth: '800px', margin: '0 auto',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                        <h2 style={{ marginBottom: '1rem' }}>
                            {text.ctaTitle}
                        </h2>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '1.125rem', maxWidth: '500px',
                            margin: '0 auto 2.25rem'
                        }}>
                            {text.ctaDesc}
                        </p>
                        <button className="btn-primary" onClick={() => navigate('/osiedle-tluszcz#kontakt')} style={{ padding: '0.875rem 2.25rem' }}>
                            {text.ctaButton} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
