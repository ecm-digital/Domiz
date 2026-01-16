import { Link } from 'react-router-dom';
import './Header.css';

export function Header() {
    return (
        <header className="site-header">
            <div className="container header-inner">
                <Link to="/" className="logo-text">
                    Domiz Homes
                </Link>

                <nav className="main-nav">
                    {['Strona główna', 'Kalkulatory', 'Blog', 'Usługi', 'Osiedle Tłuszcz', 'Smart Home'].map((item) => (
                        <Link
                            key={item}
                            to={item === 'Strona główna' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`}
                            className="nav-item"
                        >
                            {item}
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
