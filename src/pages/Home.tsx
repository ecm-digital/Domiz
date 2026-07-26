import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { PropertyCard } from '../components/PropertyCard';
import { ArrowRight, Star, Shield, Clock, FileCheck, MessageSquare, Check, Building2 } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { useLanguage } from '../context/useLanguage';
import './Home.css';

function PropertyCardSkeleton() {
    return (
        <div className="property-card-skeleton" aria-hidden="true">
            <div className="skeleton-block skeleton-image" />
            <div className="skeleton-line skeleton-line-title" />
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-stats">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}

function initials(name: string) {
    return name
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export function Home() {
    const navigate = useNavigate();
    const { properties, loading } = useProperties();
    const { t } = useLanguage();
    const pageRef = useRef<HTMLDivElement>(null);

    const featuredProperties = properties.filter((p) => p.featured);
    // Gdy żadna oferta nie jest wyróżniona, pokazujemy zwykłe oferty zamiast pustej sekcji.
    const showcaseProperties = (featuredProperties.length > 0 ? featuredProperties : properties).slice(0, 3);

    useRevealOnScroll(pageRef, [loading, showcaseProperties.length]);

    const features = [
        { icon: <Star size={24} strokeWidth={2} />, title: t('home.feature1Title'), desc: t('home.feature1Desc') },
        { icon: <Shield size={24} strokeWidth={2} />, title: t('home.feature2Title'), desc: t('home.feature2Desc') },
        { icon: <Clock size={24} strokeWidth={2} />, title: t('home.feature3Title'), desc: t('home.feature3Desc') },
    ];

    const steps = [
        { num: '01', icon: <MessageSquare size={22} strokeWidth={2} />, title: t('home.step1Title'), desc: t('home.step1Desc') },
        { num: '02', icon: <FileCheck size={22} strokeWidth={2} />, title: t('home.step2Title'), desc: t('home.step2Desc') },
        { num: '03', icon: <Clock size={22} strokeWidth={2} />, title: t('home.step3Title'), desc: t('home.step3Desc') },
        { num: '04', icon: <Shield size={22} strokeWidth={2} />, title: t('home.step4Title'), desc: t('home.step4Desc') },
    ];

    const testimonials = [
        { name: 'Anna K.', text: t('home.testimonial1'), rating: 5 },
        { name: 'Piotr M.', text: t('home.testimonial2'), rating: 5 },
        { name: 'Magdalena S.', text: t('home.testimonial3'), rating: 5 },
    ];

    const trustItems = [t('home.trust1'), t('home.trust2'), t('home.trust3')];

    return (
        <div className="home-page" ref={pageRef}>
            <Hero />

            {/* Wyróżnione oferty */}
            <section className="home-section">
                <div className="container">
                    <div className="home-section-head home-section-head--row" data-reveal>
                        <div>
                            <span className="home-eyebrow">{t('home.offerLabel')}</span>
                            <h2 className="home-section-title">{t('home.featuredProperties')}</h2>
                            <p className="home-section-desc">{t('home.offerDesc')}</p>
                        </div>
                        <button className="home-section-link" onClick={() => navigate('/oferty')}>
                            {t('home.seeAll')}
                            <ArrowRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="home-offers-skeletons">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <PropertyCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : showcaseProperties.length > 0 ? (
                        <div className="properties-grid" data-reveal>
                            {showcaseProperties.map((prop) => (
                                <PropertyCard key={prop.id} {...prop} />
                            ))}
                        </div>
                    ) : (
                        <div className="home-offers-empty" data-reveal>
                            <span className="home-offers-empty-icon">
                                <Building2 size={26} strokeWidth={2} />
                            </span>
                            <h3>{t('home.offersEmptyTitle')}</h3>
                            <p>{t('home.offersEmptyDesc')}</p>
                            <button className="btn-primary" onClick={() => navigate('/oferty')}>
                                {t('home.seeAll')}
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Dlaczego my */}
            <section className="home-section home-section--soft">
                <div className="container">
                    <div className="home-section-head" data-reveal>
                        <span className="home-eyebrow">{t('home.whyLabel')}</span>
                        <h2 className="home-section-title">
                            {t('home.whyTitlePrefix')} <span className="home-accent">Domiz Homes</span>?
                        </h2>
                        <p className="home-section-desc">{t('home.whyDesc')}</p>
                    </div>

                    <div className="home-features">
                        {features.map((feature, idx) => (
                            <article
                                key={feature.title}
                                className="home-card"
                                data-reveal
                                style={{ transitionDelay: `${idx * 80}ms` }}
                            >
                                <span className="home-card-icon">{feature.icon}</span>
                                <h3 className="home-card-title">{feature.title}</h3>
                                <p className="home-card-desc">{feature.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Jak pracujemy */}
            <section className="home-section">
                <div className="container">
                    <div className="home-section-head" data-reveal>
                        <span className="home-eyebrow">{t('home.processLabel')}</span>
                        <h2 className="home-section-title">
                            {t('home.processTitlePrefix')} <span className="home-accent">{t('home.processTitleHighlight')}</span>?
                        </h2>
                        <p className="home-section-desc">{t('home.processDesc')}</p>
                    </div>

                    <div className="home-steps">
                        {steps.map((step, idx) => (
                            <article
                                key={step.num}
                                className="home-card home-step"
                                data-reveal
                                style={{ transitionDelay: `${idx * 80}ms` }}
                            >
                                <div className="home-step-head">
                                    <span className="home-card-icon">{step.icon}</span>
                                    <span className="home-step-num">{step.num}</span>
                                </div>
                                <h3 className="home-card-title">{step.title}</h3>
                                <p className="home-card-desc">{step.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Opinie */}
            <section className="home-section home-section--soft">
                <div className="container">
                    <div className="home-section-head" data-reveal>
                        <span className="home-eyebrow">{t('home.reviewsLabel')}</span>
                        <h2 className="home-section-title">
                            {t('home.reviewsTitle')} <span className="home-accent">{t('home.reviewsHighlight')}</span> {t('home.reviewsSuffix')}
                        </h2>
                    </div>

                    <div className="home-testimonials">
                        {testimonials.map((testimonial, idx) => (
                            <figure
                                key={testimonial.name}
                                className="home-card home-testimonial"
                                data-reveal
                                style={{ transitionDelay: `${idx * 80}ms` }}
                            >
                                <div className="home-testimonial-stars" role="img" aria-label={`${testimonial.rating}/5`}>
                                    {Array.from({ length: testimonial.rating }).map((_, star) => (
                                        <Star key={star} size={15} fill="currentColor" strokeWidth={0} />
                                    ))}
                                </div>
                                <blockquote className="home-testimonial-text">{testimonial.text}</blockquote>
                                <figcaption className="home-testimonial-author">
                                    <span className="home-testimonial-avatar" aria-hidden="true">{initials(testimonial.name)}</span>
                                    <span>
                                        <span className="home-testimonial-name">{testimonial.name}</span>
                                        <span className="home-testimonial-role">{t('home.clientLabel')}</span>
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="home-section">
                <div className="container">
                    <div className="home-cta-card" data-reveal>
                        <h2 className="home-cta-title">{t('home.ctaTitle')}</h2>
                        <p className="home-cta-desc">{t('home.ctaDesc')}</p>
                        <div className="home-cta-actions">
                            <button className="btn-primary" onClick={() => navigate('/osiedle-tluszcz#kontakt')}>
                                {t('home.contactUs')}
                            </button>
                            <button className="btn-secondary" onClick={() => navigate('/kalkulatory')}>
                                {t('home.seeCalculators')}
                            </button>
                        </div>
                        <div className="home-cta-trust">
                            {trustItems.map((item) => (
                                <span key={item} className="home-cta-trust-item">
                                    <Check size={18} strokeWidth={3} />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
