import { useNavigate } from 'react-router-dom';
import { HomeHero } from '../components/home/HomeHero';
import { OsiedlePromo } from '../components/home/OsiedlePromo';
import { PropertyCard } from '../components/PropertyCard';
import { ArrowRight, Star, Shield, Clock, Loader2, FileCheck, MessageSquare, Building2, Globe2, Handshake } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useLanguage } from '../context/useLanguage';
import agentPhoto from '../assets/tomaszgnat.jpeg';

export function Home() {
    const navigate = useNavigate();
    const { properties, loading } = useProperties();
    const { t, language } = useLanguage();
    const isEnglish = language === 'en';
    const markedProperties = properties.filter(p => p.featured);
    const featuredProperties = (markedProperties.length ? markedProperties : properties).slice(0, 3);
    
    const features = [
        {
            icon: <Star size={26} strokeWidth={2} />,
            title: t('home.feature1Title'),
            desc: t('home.feature1Desc'),
            accent: "rgba(16, 185, 129, 0.15)",
        },
        {
            icon: <Shield size={26} strokeWidth={2} />,
            title: t('home.feature2Title'),
            desc: t('home.feature2Desc'),
            accent: "rgba(5, 150, 105, 0.12)",
        },
        {
            icon: <Clock size={26} strokeWidth={2} />,
            title: t('home.feature3Title'),
            desc: t('home.feature3Desc'),
            accent: "rgba(16, 185, 129, 0.1)",
        },
    ];

    return (
        <div className="home-page">
            {/* 1. Dynamic Hero Slideshow & Glassmorphic Search */}
            <HomeHero />

            {/* 2. Core markets */}
            <section className="home-section local-info-section" style={{ background: 'var(--color-bg-light)' }}>
                <div className="container">
                    <div className="home-section-header" style={{ marginBottom: '2rem' }}>
                        <span className="section-label">{isEnglish ? 'Three markets, one service' : 'Trzy rynki, jedna opieka'}</span>
                        <h2>{isEnglish ? 'Real estate in ' : 'Sprzedajemy nieruchomości na '}<span className="text-gradient">{isEnglish ? 'Silesia, Mazovia and Dubai' : 'Śląsku, Mazowszu i w Dubaju'}</span></h2>
                        <p className="home-section-desc">
                            {isEnglish ? 'We curate listings, lead negotiations and support a secure purchase — from the first conversation to completion.' : 'Wybieramy oferty, prowadzimy negocjacje i wspieramy w bezpiecznym zakupie — od pierwszego kontaktu do finalizacji transakcji.'}
                        </p>
                    </div>
                    <div className="features-bento">
                        {[
                            [isEnglish ? 'Silesia' : 'Śląsk', isEnglish ? 'Apartments and houses in Katowice, Chorzów, Sosnowiec and across the metropolitan area.' : 'Mieszkania i domy w Katowicach, Chorzowie, Sosnowcu oraz całej aglomeracji.'],
                            [isEnglish ? 'Mazovia' : 'Mazowsze', isEnglish ? 'Homes and developments near Warsaw, including Wołomin County.' : 'Domy i inwestycje pod Warszawą, w tym w powiecie wołomińskim.'],
                            ['Dubai', isEnglish ? 'Selected premium projects and brokerage support in Dubai.' : 'Wybrane projekty premium i wsparcie brokerskie na rynku dubajskim.'],
                        ].map(([title, desc], idx) => (
                            <div key={title} className="feature-card-bento" style={{ animationDelay: `${idx * 0.1}s` }}>
                                <div className="feature-card-icon" style={{ background: features[idx].accent }}>
                                    <span style={{ color: 'var(--color-primary-dark)' }}>{features[idx].icon}</span>
                                </div>
                                <h3>{title}</h3>
                                <p>{desc}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <button className="btn-primary" onClick={() => navigate('/oferty')}>
                            {isEnglish ? 'View our listings' : 'Zobacz nasze oferty'} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* 3. Featured properties */}
            <section className="home-section home-properties">
                <div className="container">
                    <div className="section-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ maxWidth: '700px' }}>
                            <span className="section-label">{t('home.offerLabel')}</span>
                            <h2 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>{t('home.featuredProperties')}</h2>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
                                {isEnglish ? 'Current properties selected for their location, condition and investment potential.' : 'Aktualne nieruchomości wybrane ze względu na lokalizację, stan i potencjał inwestycyjny.'}
                            </p>
                        </div>
                        <button className="home-link-btn" onClick={() => navigate('/oferty')} style={{ alignSelf: 'flex-end' }}>
                            {t('home.seeAll')} <ArrowRight size={20} strokeWidth={2} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="home-loading"><Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                    ) : (
                        <div className="properties-grid home-properties-grid">
                            {featuredProperties.map((prop) => <PropertyCard key={prop.id} {...prop} />)}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Dubai brokerage partnership */}
            <section className="home-section dubai-partnership-section">
                <div className="container">
                    <div className="dubai-partnership-card">
                        <div className="dubai-partnership-copy">
                            <span className="section-label dubai-partnership-label">{isEnglish ? 'International investments' : 'Inwestycje zagraniczne'}</span>
                            <h2>{isEnglish ? 'Growing our brokerage partnership ' : 'Rozwijamy współpracę brokerską '}<span>{isEnglish ? 'in the Dubai market' : 'na rynku Dubaju'}</span></h2>
                            <p>
                                {isEnglish ? 'Domiz Homes is partnering with Nestwood Realty to support clients interested in luxury property in Dubai, including Sobha Realty projects.' : 'Domiz Homes nawiązuje współpracę z Nestwood Realty przy obsłudze klientów zainteresowanych luksusowymi nieruchomościami w Dubaju, w tym projektami Sobha Realty.'}
                            </p>
                            <p>
                                {isEnglish ? 'We help you explore selected developments, navigate the buying process and make an informed investment decision with dedicated broker support.' : 'Pomagamy poznać wybrane inwestycje, przejść przez proces zakupu i podjąć świadomą decyzję inwestycyjną — indywidualnie, po polsku i z pełnym wsparciem brokera.'}
                            </p>
                            <a
                                className="btn-primary dubai-partnership-cta"
                                href="https://sobharealty.com/pl/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {isEnglish ? 'Visit Sobha Realty' : 'Zobacz stronę Sobha Realty'} <ArrowRight size={18} />
                            </a>
                        </div>
                        <div className="dubai-partnership-details" aria-label={isEnglish ? 'Scope of brokerage partnership' : 'Zakres współpracy brokerskiej'}>
                            <div className="dubai-partnership-mark" aria-hidden="true">
                                <Globe2 size={30} />
                                <span>Dubai</span>
                            </div>
                            <div className="dubai-partnership-line" />
                            <div className="dubai-partnership-item">
                                <Building2 size={22} />
                                <div>
                                    <strong>{isEnglish ? 'Selected premium projects' : 'Wybrane projekty premium'}</strong>
                                    <span>{isEnglish ? 'Listings presented in partnership with Nestwood Realty' : 'Oferty prezentowane we współpracy z Nestwood Realty'}</span>
                                </div>
                            </div>
                            <div className="dubai-partnership-item">
                                <Handshake size={22} />
                                <div>
                                    <strong>{isEnglish ? 'Personal consultations' : 'Indywidualne konsultacje'}</strong>
                                    <span>{isEnglish ? 'Broker support from the first conversation through to purchase' : 'Wsparcie brokera od pierwszej rozmowy do zakupu'}</span>
                                </div>
                            </div>
                            <div className="dubai-partnership-note">
                                Sobha Realty · Nestwood Realty · Domiz Homes
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Flagship investment */}
            <OsiedlePromo />

            {/* 6. Why Domiz Homes */}
            <section className="home-section home-features">
                <div className="home-section-bg" />
                <div className="container">
                    <div className="home-section-header">
                        <span className="section-label">{t('home.whyLabel')}</span>
                        <h2>{t('home.whyTitlePrefix')} <span className="text-gradient">Domiz Homes</span>?</h2>
                        <p className="home-section-desc">{t('home.whyDesc')}</p>
                    </div>
                    <div className="features-bento">
                        {features.map((f, idx) => (
                            <div key={idx} className="feature-card-bento" style={{ animationDelay: `${idx * 0.1}s` }}>
                                <div className="feature-card-icon" style={{ background: f.accent }}>
                                    <span style={{ color: 'var(--color-primary-dark)' }}>{f.icon}</span>
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Team */}
            <section className="home-section" style={{ background: 'var(--color-bg-light)' }}>
                <div className="container">
                    <div className="agents-section" style={{ marginTop: 0 }}>
                        <div className="agents-section__intro">
                            <span className="agents-section__eyebrow">DOMIZ HOMES</span>
                            <h2>{isEnglish ? 'Our agent' : 'Nasi agenci'}</h2>
                            <p>{isEnglish ? 'Meet the person who will guide you smoothly through buying or selling a property.' : 'Poznaj osoby, które pomogą Ci sprawnie przejść przez zakup lub sprzedaż nieruchomości.'}</p>
                        </div>
                        <div className="agents-section__grid">
                            <article className="agent-card">
                                <img className="agent-card__photo" src={agentPhoto} alt="Tomasz Gnat" />
                                <div className="agent-card__content">
                                    <p className="agent-card__role">{isEnglish ? 'Real estate agent' : 'Agent nieruchomości'}</p>
                                    <h3>Tomasz Gnat</h3>
                                    <a href="tel:+48517303400" className="agent-card__link">+48 517 303 400</a>
                                </div>
                            </article>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. Process Steps ("Jak pracujemy") */}
            <section className="home-section home-process">
                <div className="container">
                    <div className="home-section-header">
                        <span className="section-label">{t('home.processLabel')}</span>
                        <h2>{t('home.processTitlePrefix')} <span className="text-gradient">{t('home.processTitleHighlight')}</span>?</h2>
                    </div>
                    <div className="home-process-steps">
                        {[
                            { num: '01', title: t('home.step1Title'), desc: t('home.step1Desc'), icon: <MessageSquare size={22} /> },
                            { num: '02', title: t('home.step2Title'), desc: t('home.step2Desc'), icon: <FileCheck size={22} /> },
                            { num: '03', title: t('home.step3Title'), desc: t('home.step3Desc'), icon: <Clock size={22} /> },
                            { num: '04', title: t('home.step4Title'), desc: t('home.step4Desc'), icon: <Shield size={22} /> },
                        ].map((step, i) => (
                            <div key={i} className="home-process-step">
                                <div className="home-process-step-num">{step.num}</div>
                                <h4>{step.title}</h4>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 9. Call to Action */}
            <section className="home-section home-cta">
                <div className="home-cta-bg" />
                <div className="container">
                    <div className="home-cta-card">
                        <h2 className="home-cta-title">{t('home.ctaTitle')}</h2>
                        <p className="home-cta-desc">
                            {t('home.ctaDesc')}
                        </p>
                        <div className="home-cta-actions">
                            <a className="btn-primary" href="mailto:hello@domizhomes.com">{isEnglish ? 'Book a consultation' : 'Umów konsultację'}</a>
                            <button className="btn-secondary" onClick={() => navigate('/oferty')}>{isEnglish ? 'View listings' : 'Zobacz oferty'}</button>
                        </div>
                        <div className="home-cta-trust">
                            <span>✓ {t('home.trust1')}</span>
                            <span>✓ {t('home.trust2')}</span>
                            <span>✓ {t('home.trust3')}</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
