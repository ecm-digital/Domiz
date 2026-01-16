import { Facebook, Instagram, Linkedin, Home, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div>
                        <Link to="/" className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Home style={{ color: '#10b981' }} /> Domiz Homes
                        </Link>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            Tworzymy przyszłość nieruchomości. Nowoczesne podejście do sprzedaży, kupna i wynajmu Twojego wymarzonego domu.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="social-icon">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '1.5rem' }}>Nawigacja</h3>
                        <ul className="footer-links">
                            {['Strona główna', 'Kalkulatory', 'Blog', 'Usługi', 'O Nas'].map((item) => (
                                <li key={item}>
                                    <Link to="/">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '1.5rem' }}>Usługi</h3>
                        <ul className="footer-links">
                            {['Kupno Nieruchomości', 'Sprzedaż', 'Wynajem', 'Konsultacje', 'Wycena'].map((item) => (
                                <li key={item}>
                                    <Link to="/uslugi">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '1.5rem' }}>Kontakt</h3>
                        <ul className="footer-links">
                            <li style={{ display: 'flex', gap: '0.75rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                                <MapPin size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                <span>ul. Warszawska 123,<br />05-240 Tłuszcz</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.75rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                                <Phone size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                <span>+48 123 456 789</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.75rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                                <Mail size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                <span>kontakt@domizhomes.pl</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #1f2937', marginTop: '4rem', paddingTop: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                    <p>&copy; {new Date().getFullYear()} Domiz Homes. Wszelkie prawa zastrzeżone.</p>
                </div>
            </div>
        </footer>
    );
}
