import { ArrowRight, BadgeCheck, Lightbulb, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

export function SmartHome() {
    const { t } = useLanguage();
    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
            <section className="section-padding" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
                <div className="container">
                    <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
                        <span className="section-label">Smart Home</span>
                        <h1 style={{ margin: '0.6rem 0 1.25rem' }}>
                            {t('smartHome.title')} <span className="text-gradient">Loxone</span>
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', lineHeight: '1.75', margin: '0 auto 2.25rem', maxWidth: '680px' }}>
                            {t('smartHome.description')}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', textAlign: 'left', marginBottom: '2.25rem' }}>
                            {[
                                [<Lightbulb size={24} />, t('smartHome.comfortTitle'), t('smartHome.comfortDesc')],
                                [<Smartphone size={24} />, t('smartHome.controlTitle'), t('smartHome.controlDesc')],
                                [<BadgeCheck size={24} />, t('smartHome.supportTitle'), t('smartHome.supportDesc')],
                            ].map(([icon, title, text]) => (
                                <div key={String(title)} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                                    <div style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>{icon}</div>
                                    <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h2>
                                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{text}</p>
                                </div>
                            ))}
                        </div>

                        <a className="btn-primary" href="mailto:hello@domizhomes.com?subject=Smart%20Home%20Loxone">
                            {t('smartHome.cta')} <ArrowRight size={18} />
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
