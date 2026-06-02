import { Home, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage';

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="site-footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div>
                        <Link to="/" className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Home style={{ color: '#10b981' }} /> Domiz Homes
                        </Link>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {t('footer.desc')}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 style={{ color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '1.5rem' }}>{t('footer.navigation')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/">{t('nav.home')}</Link></li>
                            <li><Link to="/oferty">{t('footer.allOffers')}</Link></li>
                            <li><Link to="/oferty?type=dom">{t('footer.housesForSale')}</Link></li>
                            <li><Link to="/oferty?search=tłuszcz">{t('footer.offersTluszcz')}</Link></li>
                            <li><Link to="/ulubione">{t('nav.favorites')}</Link></li>
                            <li><Link to="/kalkulatory">{t('nav.calculators')}</Link></li>
                            <li><Link to="/blog">{t('nav.blog')}</Link></li>
                            <li><Link to="/smart-home">{t('nav.smartHome')}</Link></li>
                            <li><Link to="/osiedle-tluszcz#kontakt">{t('footer.contact')}</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 style={{ color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '1.5rem' }}>{t('footer.services')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/oferty">{t('footer.buyProperty')}</Link></li>
                            <li><Link to="/dodaj-nieruchomosc">{t('footer.sellProperty')}</Link></li>
                            <li><Link to="/kalkulatory">{t('footer.financing')}</Link></li>
                            <li><Link to="/osiedle-tluszcz">{t('nav.osiedle')}</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 style={{ color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '1.5rem' }}>{t('footer.contact')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/osiedle-tluszcz#kontakt">{t('footer.contactForm')}</Link></li>
                            <li style={{ display: 'flex', gap: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                <MapPin size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                <span>ul. Prosta 20,<br />00-838 Warszawa</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                <Phone size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                <span>+48 517 303 400</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                <Mail size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                <span>hello@domizhomes.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '4rem', paddingTop: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <p>&copy; {new Date().getFullYear()} Domiz Homes. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    );
}
