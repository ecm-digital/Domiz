import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { PropertyCard } from '../components/PropertyCard';
import { ArrowRight, Star, Shield, Clock, Loader2, FileCheck, MessageSquare, Quote } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useLanguage } from '../context/useLanguage';

export function Home() {
    const navigate = useNavigate();
    const { properties, loading } = useProperties();
    const { t } = useLanguage();
    const featuredProperties = properties.filter(p => p.featured).slice(0, 3);
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
            <Hero />

            {/* Features - Bento style */}
            <section className="home-section home-features">
                <div className="home-section-bg" />
                <div className="container">
                    <div className="home-section-header">
                        <span className="section-label">{t('home.whyLabel')}</span>
                        <h2>{t('home.whyTitlePrefix')} <span className="text-gradient">Domiz Homes</span>?</h2>
                        <p className="home-section-desc">
                            {t('home.whyDesc')}
                        </p>
                    </div>

                    <div className="features-bento">
                        {features.map((f, idx) => (
                            <div
                                key={idx}
                                className="feature-card-bento"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div
                                    className="feature-card-icon"
                                    style={{ background: f.accent }}
                                >
                                    <span style={{ color: 'var(--color-primary-dark)' }}>{f.icon}</span>
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Jak pracujemy */}
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

            {/* Testimoniale */}
            <section className="home-section home-testimonials">
                <div className="home-section-bg" />
                <div className="container">
                    <div className="home-section-header">
                        <span className="section-label">{t('home.reviewsLabel')}</span>
                        <h2>{t('home.reviewsTitle')} <span className="text-gradient">{t('home.reviewsHighlight')}</span> {t('home.reviewsSuffix')}</h2>
                    </div>
                    <div className="home-testimonials-grid">
                        {[
                            { name: 'Anna K.', text: t('home.testimonial1'), rating: 5 },
                            { name: 'Piotr M.', text: t('home.testimonial2'), rating: 5 },
                            { name: 'Magdalena S.', text: t('home.testimonial3'), rating: 5 },
                        ].map((t, i) => (
                            <div key={i} className="home-testimonial-card">
                                <Quote size={28} className="home-testimonial-quote" />
                                <p className="home-testimonial-text">"{t.text}"</p>
                                <div className="home-testimonial-stars">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />
                                    ))}
                                </div>
                                <span className="home-testimonial-name">{t.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="home-section home-properties">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <span className="section-label">{t('home.offerLabel')}</span>
                            <h2 style={{ marginTop: '0.5rem' }}>{t('home.featuredProperties')}</h2>
                        </div>
                        <button
                            className="home-link-btn"
                            onClick={() => navigate('/oferty')}
                        >
                            {t('home.seeAll')} <ArrowRight size={20} strokeWidth={2} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="home-loading">
                            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                        </div>
                    ) : (
                        <div className="properties-grid home-properties-grid">
                            {featuredProperties.map((prop) => (
                                <PropertyCard key={prop.id} {...prop} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="home-section home-cta">
                <div className="home-cta-bg" />
                <div className="container">
                    <div className="home-cta-card">
                        <h2 className="home-cta-title">{t('home.ctaTitle')}</h2>
                        <p className="home-cta-desc">
                            {t('home.ctaDesc')}
                        </p>
                        <div className="home-cta-actions">
                            <button className="btn-primary" onClick={() => navigate('/osiedle-tluszcz#kontakt')}>
                                {t('home.contactUs')}
                            </button>
                            <button className="btn-secondary" onClick={() => navigate('/kalkulatory')}>
                                {t('home.seeCalculators')}
                            </button>
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
