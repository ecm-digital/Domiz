import { useProperties } from '../../hooks/useProperties';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2, Trash2, Edit, Plus, LogOut, Phone, Mail, MessageSquare, RefreshCw } from 'lucide-react';

type LeadStatus = 'new' | 'contacted' | 'closed';

interface Inquiry {
    id: string;
    type?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    source?: string;
    createdAt?: string;
    leadStatus?: LeadStatus;
    adminNote?: string;
    owner?: string;
    followUpDate?: string;
    payload?: {
        title?: string;
        location?: string;
        type?: string;
        status?: string;
        [key: string]: unknown;
    };
}

interface LeadDraft {
    owner: string;
    followUpDate: string;
    adminNote: string;
}

export const AdminDashboard = () => {
    const { properties, loading } = useProperties();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState<number | null>(null);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [inquiriesLoading, setInquiriesLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'offers' | 'leads'>('offers');
    const [leadFilter, setLeadFilter] = useState<'all' | LeadStatus>('all');
    const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
    const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
    const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
    const [leadDrafts, setLeadDrafts] = useState<Record<string, LeadDraft>>({});

    const handleDelete = async (id: number) => {
        if (!window.confirm("Czy na pewno chcesz usunąć tę ofertę? Operacji nie można cofnąć.")) return;
        setDeleting(id);
        try {
            await deleteDoc(doc(db, "properties", id.toString()));
            // Proste odświeżenie strony po usunięciu
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            alert("Błąd usuwania: " + error.message);
        } finally {
            setDeleting(null);
        }
    };

    const loadInquiries = async () => {
        setInquiriesLoading(true);
        try {
            const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map((item) => {
                const data = item.data() as Omit<Inquiry, 'id'>;
                return {
                    id: item.id,
                    ...data,
                } as Inquiry;
            });
            setInquiries(items);
            const drafts: Record<string, LeadDraft> = {};
            items.forEach((lead) => {
                drafts[lead.id] = {
                    owner: lead.owner || '',
                    followUpDate: lead.followUpDate || '',
                    adminNote: lead.adminNote || '',
                };
            });
            setLeadDrafts(drafts);
        } catch (error) {
            console.error('Błąd pobierania leadów:', error);
        } finally {
            setInquiriesLoading(false);
        }
    };

    useEffect(() => {
        void loadInquiries();
    }, []);

    const setLeadStatus = async (leadId: string, status: LeadStatus) => {
        setUpdatingLeadId(leadId);
        try {
            await updateDoc(doc(db, 'inquiries', leadId), {
                leadStatus: status,
                updatedAt: new Date().toISOString(),
            });
            setInquiries((prev) =>
                prev.map((lead) =>
                    lead.id === leadId ? { ...lead, leadStatus: status } : lead
                )
            );
        } catch (error) {
            console.error('Błąd aktualizacji statusu leada:', error);
            alert('Nie udało się zaktualizować statusu leada.');
        } finally {
            setUpdatingLeadId(null);
        }
    };

    const deleteLead = async (leadId: string) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) return;
        setDeletingLeadId(leadId);
        try {
            await deleteDoc(doc(db, 'inquiries', leadId));
            setInquiries((prev) => prev.filter((lead) => lead.id !== leadId));
            setLeadDrafts((prev) => {
                const next = { ...prev };
                delete next[leadId];
                return next;
            });
        } catch (error) {
            console.error('Błąd usuwania zgłoszenia:', error);
            alert('Nie udało się usunąć zgłoszenia.');
        } finally {
            setDeletingLeadId(null);
        }
    };

    const filteredInquiries = useMemo(() => {
        if (leadFilter === 'all') return inquiries;
        return inquiries.filter((lead) => (lead.leadStatus || 'new') === leadFilter);
    }, [inquiries, leadFilter]);

    const leadStats = useMemo(() => {
        const stats = { all: inquiries.length, new: 0, contacted: 0, closed: 0 };
        inquiries.forEach((lead) => {
            const status = lead.leadStatus || 'new';
            stats[status] += 1;
        });
        return stats;
    }, [inquiries]);

    const formatDate = (value?: string) => {
        if (!value) return 'Brak daty';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Brak daty';
        return date.toLocaleString('pl-PL');
    };

    const displayStatus = (status?: LeadStatus) => status || 'new';

    const getStatusMeta = (status: LeadStatus) => {
        if (status === 'new') return { label: 'Nowy', bg: '#ecfeff', color: '#0e7490', border: '#67e8f9' };
        if (status === 'contacted') return { label: 'Skontaktowany', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
        return { label: 'Zamknięty', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    };

    const updateLeadDraft = (leadId: string, patch: Partial<LeadDraft>) => {
        setLeadDrafts((prev) => ({
            ...prev,
            [leadId]: {
                owner: prev[leadId]?.owner || '',
                followUpDate: prev[leadId]?.followUpDate || '',
                adminNote: prev[leadId]?.adminNote || '',
                ...patch,
            },
        }));
    };

    const saveLeadDetails = async (leadId: string) => {
        const draft = leadDrafts[leadId];
        if (!draft) return;
        setSavingLeadId(leadId);
        try {
            await updateDoc(doc(db, 'inquiries', leadId), {
                owner: draft.owner.trim(),
                followUpDate: draft.followUpDate || '',
                adminNote: draft.adminNote.trim(),
                updatedAt: new Date().toISOString(),
            });
            setInquiries((prev) =>
                prev.map((lead) =>
                    lead.id === leadId
                        ? { ...lead, owner: draft.owner.trim(), followUpDate: draft.followUpDate || '', adminNote: draft.adminNote.trim() }
                        : lead
                )
            );
        } catch (error) {
            console.error('Błąd zapisu notatki leada:', error);
            alert('Nie udało się zapisać notatki.');
        } finally {
            setSavingLeadId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Panel Administratora</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/admin/properties/new')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} /> Dodaj Ofertę
                    </button>
                    <button
                        onClick={() => void loadInquiries()}
                        style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--color-border)',
                            background: 'white',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <RefreshCw size={18} /> Odśwież leady
                    </button>
                    <button
                        onClick={() => logout().then(() => navigate('/admin/login'))}
                        style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #fee2e2',
                            background: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <LogOut size={20} /> Wyloguj
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                    onClick={() => setActiveTab('offers')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        border: activeTab === 'offers' ? '1px solid #10b981' : '1px solid var(--color-border)',
                        background: activeTab === 'offers' ? 'rgba(16,185,129,0.12)' : 'white',
                        color: activeTab === 'offers' ? '#047857' : 'var(--color-text-main)',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    Oferty ({properties.length})
                </button>
                <button
                    onClick={() => setActiveTab('leads')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '9999px',
                        border: activeTab === 'leads' ? '1px solid #3b82f6' : '1px solid var(--color-border)',
                        background: activeTab === 'leads' ? 'rgba(59,130,246,0.12)' : 'white',
                        color: activeTab === 'leads' ? '#1d4ed8' : 'var(--color-text-main)',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    Leady ({inquiries.length})
                </button>
            </div>

            {activeTab === 'offers' && (
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Zdjęcie</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Tytuł</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Cena</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Lokalizacja</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', textAlign: 'right' }}>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {properties.map((property) => (
                                <tr key={property.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <img
                                            src={property.image}
                                            alt={property.title}
                                            style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem' }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{property.title}</td>
                                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold' }}>
                                        {property.price.toLocaleString('pl-PL')} zł
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{property.location}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '0.375rem',
                                                    border: '1px solid var(--color-border)',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    color: '#3b82f6'
                                                }}
                                                title="Edytuj"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(property.id)}
                                                disabled={deleting === property.id}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '0.375rem',
                                                    border: '1px solid #fee2e2',
                                                    background: '#fef2f2',
                                                    cursor: 'pointer',
                                                    color: '#dc2626',
                                                    opacity: deleting === property.id ? 0.5 : 1
                                                }}
                                                title="Usuń"
                                            >
                                                {deleting === property.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {properties.length === 0 && (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Brak ofert w bazie. Dodaj pierwszą!
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'leads' && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '0.65rem', padding: '0.75rem' }}>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>Wszystkie</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{leadStats.all}</div>
                        </div>
                        <div style={{ background: '#ecfeff', border: '1px solid #67e8f9', borderRadius: '0.65rem', padding: '0.75rem' }}>
                            <div style={{ color: '#0e7490', fontSize: '0.78rem' }}>Nowe</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0e7490' }}>{leadStats.new}</div>
                        </div>
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.65rem', padding: '0.75rem' }}>
                            <div style={{ color: '#1d4ed8', fontSize: '0.78rem' }}>Skontaktowane</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1d4ed8' }}>{leadStats.contacted}</div>
                        </div>
                        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.65rem', padding: '0.75rem' }}>
                            <div style={{ color: '#047857', fontSize: '0.78rem' }}>Zamknięte</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#047857' }}>{leadStats.closed}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Leady i zapytania</h2>
                        <select
                            value={leadFilter}
                            onChange={(e) => setLeadFilter(e.target.value as 'all' | LeadStatus)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                        >
                            <option value="all">Wszystkie statusy</option>
                            <option value="new">Nowe</option>
                            <option value="contacted">Skontaktowane</option>
                            <option value="closed">Zamknięte</option>
                        </select>
                    </div>

                    {inquiriesLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : filteredInquiries.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Brak leadów dla wybranego filtra.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            {filteredInquiries.map((lead) => (
                                <div key={lead.id} style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                                                    {lead.name || lead.payload?.title || 'Lead bez nazwy'}
                                                </div>
                                                <span style={{
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    border: `1px solid ${getStatusMeta(displayStatus(lead.leadStatus)).border}`,
                                                    background: getStatusMeta(displayStatus(lead.leadStatus)).bg,
                                                    color: getStatusMeta(displayStatus(lead.leadStatus)).color,
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                }}>
                                                    {getStatusMeta(displayStatus(lead.leadStatus)).label}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                Źródło: {lead.source || 'nieznane'} • Typ: {lead.type || 'nieznany'} • {formatDate(lead.createdAt)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <select
                                                value={displayStatus(lead.leadStatus)}
                                                disabled={updatingLeadId === lead.id}
                                                onChange={(e) => void setLeadStatus(lead.id, e.target.value as LeadStatus)}
                                                style={{ padding: '0.45rem 0.6rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)' }}
                                            >
                                                <option value="new">Nowy</option>
                                                <option value="contacted">Skontaktowany</option>
                                                <option value="closed">Zamknięty</option>
                                            </select>
                                            <button
                                                onClick={() => void deleteLead(lead.id)}
                                                disabled={deletingLeadId === lead.id}
                                                style={{
                                                    padding: '0.45rem',
                                                    borderRadius: '0.45rem',
                                                    border: '1px solid #fee2e2',
                                                    background: '#fef2f2',
                                                    color: '#dc2626',
                                                    cursor: 'pointer',
                                                    opacity: deletingLeadId === lead.id ? 0.5 : 1,
                                                }}
                                                title="Usuń zgłoszenie"
                                            >
                                                {deletingLeadId === lead.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                                        {lead.phone && (
                                            <a href={`tel:${lead.phone}`} style={{ textDecoration: 'none', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Phone size={15} /> {lead.phone}
                                            </a>
                                        )}
                                        {lead.email && (
                                            <a href={`mailto:${lead.email}`} style={{ textDecoration: 'none', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Mail size={15} /> {lead.email}
                                            </a>
                                        )}
                                        {lead.payload?.location && (
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Lokalizacja: {lead.payload.location}</span>
                                        )}
                                    </div>

                                    {(lead.message || lead.payload?.title) && (
                                        <div style={{ marginTop: '0.75rem', background: 'var(--color-bg-light)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                <MessageSquare size={14} /> Szczegóły
                                            </div>
                                            <div style={{ color: 'var(--color-text-main)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                                                {lead.message || `Zgłoszenie sprzedaży: ${lead.payload?.title || 'bez tytułu oferty'}`}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Opiekun</label>
                                                <input
                                                    value={leadDrafts[lead.id]?.owner || ''}
                                                    onChange={(e) => updateLeadDraft(lead.id, { owner: e.target.value })}
                                                    placeholder="np. Tomasz"
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Follow-up</label>
                                                <input
                                                    type="date"
                                                    value={leadDrafts[lead.id]?.followUpDate || ''}
                                                    onChange={(e) => updateLeadDraft(lead.id, { followUpDate: e.target.value })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '0.6rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Notatka</label>
                                            <textarea
                                                value={leadDrafts[lead.id]?.adminNote || ''}
                                                onChange={(e) => updateLeadDraft(lead.id, { adminNote: e.target.value })}
                                                rows={3}
                                                placeholder="Co już zostało zrobione, co dalej?"
                                                style={{ width: '100%', padding: '0.55rem', borderRadius: '0.45rem', border: '1px solid var(--color-border)', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.55rem' }}>
                                            <button
                                                onClick={() => void saveLeadDetails(lead.id)}
                                                disabled={savingLeadId === lead.id}
                                                style={{
                                                    padding: '0.45rem 0.85rem',
                                                    borderRadius: '0.45rem',
                                                    border: '1px solid #86efac',
                                                    background: '#f0fdf4',
                                                    color: '#166534',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    opacity: savingLeadId === lead.id ? 0.6 : 1,
                                                }}
                                            >
                                                {savingLeadId === lead.id ? 'Zapisywanie...' : 'Zapisz notatkę'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
