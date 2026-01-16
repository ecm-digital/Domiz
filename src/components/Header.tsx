import { Link } from 'react-router-dom';
import './Header.css';

const NAV_ITEMS = [
    { name: 'Strona główna', path: '/' },
    { name: 'Oferty', path: '/oferty' },
    { name: 'Kalkulatory', path: '/kalkulatory' },
    { name: 'Blog', path: '/blog' },
    { name: 'Usługi', path: '/uslugi' },
    { name: 'Osiedle Tłuszcz', path: '/osiedle-tluszcz' },
    { name: 'Smart Home', path: '/smart-home' },
];

export function Header() {
    return (
        <header className="site-header">
            <div className="container header-inner">
                <Link to="/" className="logo-text">
                    Domiz Homes
                </Link>

                <nav className="main-nav">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className="nav-item"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <Link
                    to="/dodaj-nieruchomosc"
                    className="btn-primary"
                >
                    Dodaj nieruchomość
                </Link>
            </div>
        </header>
    );
}
