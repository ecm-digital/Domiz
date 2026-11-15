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
    const moreItems = [
        { key: 'estates', label: 'Osiedla', onClick: () => onTab('estates'), pressed: activeTab === 'estates' },
        { key: 'presentation', label: 'Prezentacje', onClick: () => onPresentation('agency'), pressed: activeTab === 'presentation' && presentationMode !== 'audit' },
        { key: 'audits', label: 'Audyty', onClick: () => onPresentation('audit'), pressed: activeTab === 'presentation' && presentationMode === 'audit' },
        { key: 'proposals', label: `Proposale (${counts.proposals})`, onClick: () => onTab('proposals'), pressed: activeTab === 'proposals' },
        { key: 'agreements', label: `Umowy (${counts.agreements})`, onClick: () => onTab('agreements'), pressed: activeTab === 'agreements' },
        { key: 'clients', label: 'Konta klientów', onClick: () => onTab('clientAccounts'), pressed: activeTab === 'clientAccounts' },
        { key: 'settings', label: 'Ustawienia SEO & AI', onClick: () => onTab('settings'), pressed: activeTab === 'settings' },
        { key: 'videos', label: 'Studio filmów AI', onClick: () => onTab('videos'), pressed: activeTab === 'videos' },
    ];
    return (
        <div className="admin-tabs">
            <button type="button" aria-pressed={pressed(activeTab === 'dashboard')} onClick={() => onTab('dashboard')}>Wyniki</button>
            <button type="button" aria-pressed={pressed(activeTab === 'acquisition')} onClick={() => onTab('acquisition')}>Pozyskiwanie ofert ({counts.acquisition})</button>
            <button type="button" aria-pressed={pressed(activeTab === 'offers')} onClick={() => onTab('offers')}>Oferty ({counts.offers})</button>
            <a href="/admin/kawalerki">Mieszkania z ogródkiem – Warszawa</a>
            <a href="/admin/zgody">Zgody</a>
            <button type="button" aria-pressed={pressed(activeTab === 'leads')} onClick={() => onTab('leads')}>Zgłoszenia ({counts.leads})</button>
            {ownerLeadCount > 0 && <a href="/admin/wlasciciele">Właściciele do kontaktu ({ownerLeadCount})</a>}
            <button type="button" className="admin-more__toggle" aria-expanded={moreOpen} onClick={onToggleMore}>Więcej</button>
            {moreOpen && (
                <div className="admin-more__panel">
                    {moreItems.map((item) => (
                        <button key={item.key} type="button" aria-pressed={item.pressed} onClick={item.onClick}>{item.label}</button>
                    ))}
                    <a href="/admin/wlasciciele">Właściciele do kontaktu{ownerLeadCount === 0 ? '' : ` (${ownerLeadCount})`}</a>
                </div>
            )}
        </div>
    );
};
