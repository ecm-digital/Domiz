import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, ChevronDown, Phone } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/useLanguage';
import { trackEvent } from '../utils/analytics';
import './Header.css';

const NAV_PRIMARY = [
    { key: 'nav.home', path: '/' },
    { key: 'nav.offers', path: '/oferty' },
    { key: 'nav.osiedle', path: '/osiedle-tluszcz' },
];

const NAV_MORE = [
    { key: 'nav.calculators', path: '/kalkulatory' },
    { key: 'nav.blog', path: '/blog' },
    { key: 'nav.smartHome', path: '/smart-home' },
];

export function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const { favorites } = useFavorites();
    const { language, setLanguage, t } = useLanguage();
    const favoritesCount = favorites.length;

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const onScroll = () => {
            const past = window.scrollY > 20;
            setScrolled(past);
            document.documentElement.classList.toggle('header-scrolled', past);
        };
        onScroll(); // init
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // prevent body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    return (
        <>
            <header className={`site-header ${scrolled ? 'header-scrolled' : ''}`}>
                <div className="container header-inner">
                    <Link to="/" className="logo-text">
                        Domiz Homes
                    </Link>

                    <nav className="main-nav">
                        {NAV_PRIMARY.map((item) => (
                            <Link
                                key={item.key}
                                to={item.path}
                                className={`nav-item ${location.pathname === item.path ? 'nav-active' : ''}`}
                            >
                                {t(item.key)}
                            </Link>
                        ))}
                        <div className="nav-dropdown" tabIndex={0}>
                            <span className={`nav-item nav-dropdown-trigger ${NAV_MORE.some(n => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path))) ? 'nav-active' : ''}`}>
                                {t('nav.more')} <ChevronDown size={14} />
                            </span>
                            <div className="nav-dropdown-menu">
                                {NAV_MORE.map((item) => (
                                    <Link key={item.key} to={item.path} className={`nav-dropdown-item ${location.pathname === item.path ? 'nav-active' : ''}`}>
                                        {t(item.key)}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </nav>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="language-switch" aria-label="Language selector">
                            <button className={language === 'pl' ? 'active' : ''} onClick={() => setLanguage('pl')}>PL</button>
                            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
                        </div>
                        <Link to="/ulubione" className="header-favorites" title={t('header.favoritesTitle')}>
                            <Heart size={20} />
                            {favoritesCount > 0 && <span className="header-favorites-badge">{favoritesCount}</span>}
                        </Link>
                        <Link
                            to="/dodaj-nieruchomosc"
                            className="btn-primary header-cta"
                            onClick={() => trackEvent('header_cta_click', { cta: 'add_property_desktop' })}
                        >
                            {t('nav.addProperty')}
                        </Link>
                    </div>

                    <button
                        className="mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={t('header.toggleMenu')}
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${mobileOpen ? 'mobile-overlay-active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Mobile Menu */}
            <div className={`mobile-menu ${mobileOpen ? 'mobile-menu-open' : ''}`} role="dialog" aria-modal="true" aria-label={t('header.mobileMenuLabel')}>
                <nav className="mobile-nav">
                    <div className="mobile-language-switch">
                        <button className={language === 'pl' ? 'active' : ''} onClick={() => setLanguage('pl')}>PL</button>
                        <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
                    </div>
                    <div className="mobile-nav-section">
                        {NAV_PRIMARY.map((item) => (
                            <Link key={item.key} to={item.path} className={`mobile-nav-item ${location.pathname === item.path ? 'mobile-nav-active' : ''}`} onClick={() => setMobileOpen(false)}>
                                {t(item.key)}
                            </Link>
                        ))}
                    </div>
                    <div className="mobile-nav-section">
                        <span className="mobile-nav-label">{t('nav.more')}</span>
                        {NAV_MORE.map((item) => (
                            <Link key={item.key} to={item.path} className={`mobile-nav-item mobile-nav-sub ${location.pathname === item.path ? 'mobile-nav-active' : ''}`} onClick={() => setMobileOpen(false)}>
                                {t(item.key)}
                            </Link>
                        ))}
                    </div>
                    <div className="mobile-nav-actions">
                        <Link to="/ulubione" className="mobile-nav-item mobile-nav-highlight" onClick={() => setMobileOpen(false)}>
                            <Heart size={18} /> {t('nav.favorites')} {favoritesCount > 0 && `(${favoritesCount})`}
                        </Link>
                        <a
                            href="tel:+48517303400"
                            className="mobile-nav-cta"
                            onClick={() => {
                                trackEvent('lead_contact_click', { type: 'phone', source: 'mobile_menu' });
                                setMobileOpen(false);
                            }}
                        >
                            <Phone size={18} /> {t('nav.call')}
                        </a>
                        <Link
                            to="/dodaj-nieruchomosc"
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => {
                                trackEvent('header_cta_click', { cta: 'add_property_mobile' });
                                setMobileOpen(false);
                            }}
                        >
                            {t('nav.addProperty')}
                        </Link>
                    </div>
                </nav>
            </div>
        </>
    );
}
