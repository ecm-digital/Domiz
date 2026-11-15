type AdminTabId = 'dashboard' | 'offers' | 'leads' | 'acquisition' | 'estates' | 'presentation' | 'proposals' | 'agreements' | 'clientAccounts' | 'videos' | 'settings';

interface AdminTabBarProps {
    activeTab: AdminTabId;
    presentationMode: string;
    counts: { offers: number; leads: number; acquisition: number; proposals: number; agreements: number };
    ownerLeadCount: number;
    moreOpen: boolean;
    onToggleMore: () => void;
    onTab: (tab: AdminTabId) => void;
    onPresentation: (mode: 'agency' | 'audit') => void;
}

const pressed = (on: boolean) => on;

export const AdminTabBar = ({ activeTab, presentationMode, counts, ownerLeadCount, moreOpen, onToggleMore, onTab, onPresentation }: AdminTabBarProps) => {
    const moreGroups = [
        {
            label: 'Sprzedaż i klienci',
            items: [
                { key: 'presentation', label: 'Prezentacje', onClick: () => onPresentation('agency'), pressed: activeTab === 'presentation' && presentationMode !== 'audit' },
                { key: 'proposals', label: `Proposale (${counts.proposals})`, onClick: () => onTab('proposals'), pressed: activeTab === 'proposals' },
                { key: 'agreements', label: `Umowy (${counts.agreements})`, onClick: () => onTab('agreements'), pressed: activeTab === 'agreements' },
                { key: 'clients', label: 'Konta klientów', onClick: () => onTab('clientAccounts'), pressed: activeTab === 'clientAccounts' },
            ],
        },
        {
            label: 'Rynek i pozysk',
            items: [
                { key: 'estates', label: 'Osiedla', onClick: () => onTab('estates'), pressed: activeTab === 'estates' },
                { key: 'audits', label: 'Audyty', onClick: () => onPresentation('audit'), pressed: activeTab === 'presentation' && presentationMode === 'audit' },
            ],
            links: [
                { key: 'kawalerki', href: '/admin/kawalerki', label: 'Mieszkania z ogródkiem – Warszawa' },
                { key: 'wlasciciele', href: '/admin/wlasciciele', label: `Właściciele do kontaktu${ownerLeadCount === 0 ? '' : ` (${ownerLeadCount})`}` },
            ],
        },
        {
            label: 'Marketing i system',
            items: [
                { key: 'videos', label: 'Studio filmów AI', onClick: () => onTab('videos'), pressed: activeTab === 'videos' },
                { key: 'settings', label: 'Ustawienia SEO & AI', onClick: () => onTab('settings'), pressed: activeTab === 'settings' },
            ],
        },
    ];
    const hasActiveInMore = ['estates', 'presentation', 'proposals', 'agreements', 'clientAccounts', 'videos', 'settings'].includes(activeTab);

    return (
        <nav className="admin-tabs" aria-label="Workflow agenta nieruchomości">
            <button type="button" aria-pressed={pressed(activeTab === 'dashboard')} onClick={() => onTab('dashboard')}>Start · Wyniki</button>
            <button type="button" aria-pressed={pressed(activeTab === 'acquisition')} onClick={() => onTab('acquisition')}>Pozyskiwanie ({counts.acquisition})</button>
            <button type="button" aria-pressed={pressed(activeTab === 'leads')} onClick={() => onTab('leads')}>Zgłoszenia ({counts.leads})</button>
            <button type="button" aria-pressed={pressed(activeTab === 'offers')} onClick={() => onTab('offers')}>Oferty ({counts.offers})</button>
            <a href="/admin/zgody">Zgody</a>
            {ownerLeadCount > 0 && <a href="/admin/wlasciciele">Właściciele ({ownerLeadCount})</a>}
            <button type="button" className="admin-more__toggle" aria-expanded={moreOpen} aria-pressed={hasActiveInMore} onClick={onToggleMore}>Więcej ▾</button>
            {moreOpen && (
                <div className="admin-more__panel">
                    {moreGroups.map((group) => (
                        <div key={group.label} className="admin-more__group">
                            <span className="admin-more__label">{group.label}</span>
                            <div className="admin-more__items">
                                {group.items.map((item) => (
                                    <button key={item.key} type="button" aria-pressed={item.pressed} onClick={item.onClick}>{item.label}</button>
                                ))}
                                {group.links?.map((link) => (
                                    <a key={link.key} href={link.href}>{link.label}</a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </nav>
    );
};
