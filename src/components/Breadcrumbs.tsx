import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

type Crumb = { label: string; path?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
    const { t } = useLanguage();

    return (
        <nav className="breadcrumbs" aria-label={t('footer.navigation')}>
            <Link to="/" className="breadcrumb-link">{t('nav.home')}</Link>
            {items.map((item, i) => (
                <span key={i} className="breadcrumb-item">
                    <ChevronRight size={14} className="breadcrumb-sep" />
                    {item.path ? (
                        <Link to={item.path} className="breadcrumb-link">{item.label}</Link>
                    ) : (
                        <span className="breadcrumb-current">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
