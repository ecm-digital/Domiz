import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowRight, Sliders, Send, ChevronLeft, ChevronRight, Eye, GitCompare, X, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';

const WIZARD_STEPS = [
    { id: 1, title: 'Model domu', short: 'Model' },
    { id: 2, title: 'Fundamenty i elewacja', short: 'Fundament' },
    { id: 3, title: 'Dach i taras', short: 'Dach' },
    { id: 4, title: 'Wnętrze', short: 'Wnętrze' },
    { id: 5, title: 'Dodatkowe opcje', short: 'Opcje' },
    { id: 6, title: 'Podsumowanie', short: 'Podsumowanie' },
] as const;
const TOTAL_STEPS = WIZARD_STEPS.length;

const COMPARE_STORAGE_KEY = 'domiz-configurator-compare';
const MAX_COMPARE = 3;

export type ConfigSnapshot = {
    id: string;
    name: string;
    timestamp: number;
    modelId: string;
    foundationId: string;
    facadeId: string;
    windowColorId: string;
    roofId: string;
    terraceId: string;
    interiorId: string;
    kitchenId: string;
    bathroomId: string;
    extras: string[];
    totalPrice: number;
    summaryRows: { label: string; value: number }[];
};

function formatPrice(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value) + ' zł';
}

// Orientacyjna rata miesięczna (80% LTV, 25 lat, 7.5% WIBOR)
function estimateMonthlyPayment(price: number): number {
    const loanPct = 0.8;
    const principal = price * loanPct;
    const monthlyRate = 7.5 / 100 / 12;
    const n = 25 * 12;
    if (principal <= 0 || n <= 0) return 0;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

function ConfiguratorInstallmentsPreview({ totalPrice }: { totalPrice: number }) {
    const monthly = estimateMonthlyPayment(totalPrice);
    return (
        <div className="configurator-installments-preview">
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Orientacyjna rata kredytu (80% LTV, 25 lat)
            </p>
            <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                ~{formatPrice(Math.round(monthly))}/mies.
            </p>
            <Link to="/kalkulatory" className="configurator-installments-link">
                <Calculator size={16} /> Dokładny kalkulator rat
            </Link>
        </div>
    );
}

// Zdjęcia: local (public/configurator/) lub placeholder z sieci przy błędzie
const CONFIGURATOR_BASE = '/configurator';
const PLACEHOLDER_BASE = 'https://placehold.co/120x90/e2e8f0/64748b';
const configuratorImg = (path: string, placeholderText?: string) => ({
    src: `${CONFIGURATOR_BASE}/${path}`,
    fallback: placeholderText ? `${PLACEHOLDER_BASE}?text=${encodeURIComponent(placeholderText)}` : PLACEHOLDER_BASE,
});

// Wybierz model (cena bazowa za gotowy dom w stanie deweloperskim)
const MODELS = [
    { id: 'm35', label: 'Domiz M35', desc: '35 m²', price: 135000, image: configuratorImg('model-m35.jpg', 'M35') },
    { id: 'm50', label: 'Domiz M50', desc: '50 m²', price: 154900, image: configuratorImg('model-m50.jpg', 'M50') },
    { id: 'm70', label: 'Domiz M70', desc: '70 m²', price: 174900, image: configuratorImg('model-m70.jpg', 'M70') },
    { id: 'm90', label: 'Domiz M90', desc: '90 m²', price: 209900, image: configuratorImg('model-m90.jpg', 'M90') },
    { id: 'm100', label: 'Domiz M100', desc: '100 m²', price: 239900, image: configuratorImg('model-m100.jpg', 'M100') },
] as const;

// Fundamenty
const FOUNDATIONS = [
    { id: 'slab', label: 'Fundament płytowy', price: 0, image: configuratorImg('foundation-slab.jpg', 'Płytowy') },
    { id: 'piles', label: 'Fundament na palach', price: 25000, image: configuratorImg('foundation-piles.jpg', 'Palowy') },
    { id: 'pillars', label: 'Słupy betonowe', price: 18000, image: configuratorImg('foundation-pillars.jpg', 'Słupy') },
] as const;

// Elewacja
const FACADES = [
    { id: 'board', label: 'Deska elewacyjna', price: 0, image: configuratorImg('facade-board.jpg', 'Deska') },
    { id: 'render', label: 'Tynk silikonowy', price: 12000, image: configuratorImg('facade-render.jpg', 'Tynk') },
    { id: 'hpl', label: 'Płyta HPL', price: 18000, image: configuratorImg('facade-hpl.jpg', 'HPL') },
] as const;

// Kolor stolarki okiennej
const WINDOW_COLORS = [
    { id: 'anthracite', label: 'Antracyt', price: 0, image: configuratorImg('window-anthracite.jpg', 'Antracyt') },
    { id: 'white', label: 'Biel', price: 2000, image: configuratorImg('window-white.jpg', 'Biel') },
    { id: 'black', label: 'Czerń', price: 2000, image: configuratorImg('window-black.jpg', 'Czerń') },
] as const;

// Dach
const ROOFS = [
    { id: 'flat', label: 'Dach płaski', price: 0, image: configuratorImg('roof-flat.jpg', 'Płaski') },
    { id: 'gable', label: 'Dach dwuspadowy', price: 25000, image: configuratorImg('roof-gable.jpg', 'Dwuspadowy') },
    { id: 'green', label: 'Zielony dach', price: 35000, image: configuratorImg('roof-green.jpg', 'Zielony') },
] as const;

// Taras
const TERRACES = [
    { id: 'none', label: 'Brak tarasu', price: 0, image: configuratorImg('terrace-none.jpg', 'Brak') },
    { id: 'wood', label: 'Taras drewniany 15 m²', price: 18000, image: configuratorImg('terrace-wood.jpg', 'Drewno') },
    { id: 'composite', label: 'Taras kompozytowy 15 m²', price: 22000, image: configuratorImg('terrace-composite.jpg', 'Kompozyt') },
    { id: 'pergola', label: 'Pergola 15 m²', price: 15000, image: configuratorImg('terrace-pergola.jpg', 'Pergola') },
] as const;

// Wykończenie wnętrza
const INTERIOR_FINISH = [
    { id: 'standard', label: 'Standard', price: 0, image: configuratorImg('interior-standard.jpg', 'Standard') },
    { id: 'premium', label: 'Premium', price: 35000, image: configuratorImg('interior-premium.jpg', 'Premium') },
] as const;

// Kuchnia
const KITCHENS = [
    { id: 'none', label: 'Brak kuchni', price: 0, image: configuratorImg('kitchen-none.jpg', 'Brak') },
    { id: 'standard', label: 'Aneks kuchenny standard', price: 15000, image: configuratorImg('kitchen-standard.jpg', 'Standard') },
    { id: 'premium', label: 'Aneks kuchenny premium', price: 28000, image: configuratorImg('kitchen-premium.jpg', 'Premium') },
] as const;

// Łazienka
const BATHROOMS = [
    { id: 'standard', label: 'Łazienka standard', price: 0, image: configuratorImg('bathroom-standard.jpg', 'Standard') },
    { id: 'premium', label: 'Łazienka premium', price: 22000, image: configuratorImg('bathroom-premium.jpg', 'Premium') },
] as const;

// Dodatkowe opcje (checkboxy)
const EXTRAS = [
    { id: 'smarthome', label: 'Smart Home', price: 0, image: configuratorImg('extra-smarthome.jpg', 'Smart') },
    { id: 'ac', label: 'Klimatyzacja', price: 18000, image: configuratorImg('extra-ac.jpg', 'AC') },
    { id: 'recovery', label: 'Rekuperacja', price: 25000, image: configuratorImg('extra-recovery.jpg', 'Rekup') },
    { id: 'heatpump', label: 'Pompa ciepła', price: 45000, image: configuratorImg('extra-heatpump.jpg', 'PC') },
    { id: 'pv3', label: 'Fotowoltaika 3 kWp', price: 18000, image: configuratorImg('extra-pv3.jpg', 'PV 3kW') },
    { id: 'pv5', label: 'Fotowoltaika 5 kWp', price: 28000, image: configuratorImg('extra-pv5.jpg', 'PV 5kW') },
] as const;

type OptionRow = { id: string; label: string; price: number; image?: { src: string; fallback: string } };

// Podgląd wizualny: obrazek zależny od model/dach/elewacja/taras (ścieżki w public/configurator/preview/)
function getPreviewUrl(modelId: string, roofId: string, facadeId: string, terraceId: string): { src: string; fallback: string } {
    const path = `preview/${modelId}-${roofId}-${facadeId}-${terraceId}.jpg`;
    const fallback = `https://placehold.co/640x400/e2e8f0/64748b?text=${encodeURIComponent([modelId, roofId, facadeId, terraceId].join(' + '))}`;
    return { src: `${CONFIGURATOR_BASE}/${path}`, fallback };
}

function ConfigRadioBlock({
    title,
    options,
    value,
    onChange,
    overBudget = false,
}: {
    title: string;
    options: readonly OptionRow[];
    value: string;
    onChange: (id: string) => void;
    overBudget?: boolean;
}) {
    return (
        <div className="glass-panel config-block">
            <h3 className="config-block-title">{title}</h3>
            <div className="config-radio-list">
                {options.map((o) => (
                    <label
                        key={o.id}
                        className={`config-radio-item ${value === o.id ? 'config-radio-item--selected' : ''} ${overBudget && o.price > 0 ? 'config-option--expensive' : ''}`}
                    >
                        <input
                            type="radio"
                            name={title}
                            value={o.id}
                            checked={value === o.id}
                            onChange={() => onChange(o.id)}
                        />
                        {o.image && (
                            <span className="config-option-thumb">
                                <img src={o.image.src} alt="" onError={(e) => { e.currentTarget.src = o.image!.fallback; }} />
                            </span>
                        )}
                        <span className="config-radio-label">{o.label}</span>
                        <span className="config-radio-price">{o.price === 0 ? '0 zł' : formatPrice(o.price)}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function ConfigCheckboxBlock({
    title,
    options,
    selected,
    onToggle,
    overBudget = false,
}: {
    title: string;
    options: readonly OptionRow[];
    selected: Set<string>;
    onToggle: (id: string) => void;
    overBudget?: boolean;
}) {
    return (
        <div className="glass-panel config-block">
            <h3 className="config-block-title">{title}</h3>
            <div className="config-checkbox-list">
                {options.map((o) => (
                    <label
                        key={o.id}
                        className={`config-checkbox-item ${selected.has(o.id) ? 'config-checkbox-item--selected' : ''} ${overBudget && o.price > 0 ? 'config-option--expensive' : ''}`}
                    >
                        <input
                            type="checkbox"
                            checked={selected.has(o.id)}
                            onChange={() => onToggle(o.id)}
                        />
                        {o.image && (
                            <span className="config-option-thumb">
                                <img src={o.image.src} alt="" onError={(e) => { e.currentTarget.src = o.image!.fallback; }} />
                            </span>
                        )}
                        <span className="config-checkbox-label">{o.label}</span>
                        <span className="config-checkbox-price">{o.price === 0 ? '0 zł' : '+' + formatPrice(o.price)}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function loadComparisons(): ConfigSnapshot[] {
    try {
        const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
    } catch {
        return [];
    }
}

function saveComparisons(list: ConfigSnapshot[]) {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_COMPARE)));
}

export function ModularHomeConfigurator() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [modelId, setModelId] = useState<string>('m35');
    const [foundationId, setFoundationId] = useState<string>('slab');
    const [facadeId, setFacadeId] = useState<string>('board');
    const [windowColorId, setWindowColorId] = useState<string>('anthracite');
    const [roofId, setRoofId] = useState<string>('flat');
    const [terraceId, setTerraceId] = useState<string>('none');
    const [interiorId, setInteriorId] = useState<string>('standard');
    const [kitchenId, setKitchenId] = useState<string>('none');
    const [bathroomId, setBathroomId] = useState<string>('standard');
    const [extras, setExtras] = useState<Set<string>>(new Set(['smarthome']));

    const [budget, setBudget] = useState<string>('');
    const [comparisons, setComparisons] = useState<ConfigSnapshot[]>(loadComparisons);
    const [compareOpen, setCompareOpen] = useState(false);

    const [inquirySent, setInquirySent] = useState(false);
    const [inquiryName, setInquiryName] = useState('');
    const [inquiryEmail, setInquiryEmail] = useState('');
    const [inquiryPhone, setInquiryPhone] = useState('');
    const [inquiryConsent, setInquiryConsent] = useState(false);

    useEffect(() => { saveComparisons(comparisons); }, [comparisons]);

    const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
    const foundation = FOUNDATIONS.find((f) => f.id === foundationId) ?? FOUNDATIONS[0];
    const facade = FACADES.find((f) => f.id === facadeId) ?? FACADES[0];
    const windowColor = WINDOW_COLORS.find((w) => w.id === windowColorId) ?? WINDOW_COLORS[0];
    const roof = ROOFS.find((r) => r.id === roofId) ?? ROOFS[0];
    const terrace = TERRACES.find((t) => t.id === terraceId) ?? TERRACES[0];
    const interior = INTERIOR_FINISH.find((i) => i.id === interiorId) ?? INTERIOR_FINISH[0];
    const kitchen = KITCHENS.find((k) => k.id === kitchenId) ?? KITCHENS[0];
    const bathroom = BATHROOMS.find((b) => b.id === bathroomId) ?? BATHROOMS[0];

    const basePrice = model.price;
    const optionsTotal =
        foundation.price +
        facade.price +
        windowColor.price +
        roof.price +
        terrace.price +
        interior.price +
        kitchen.price +
        bathroom.price;
    const extrasTotal = EXTRAS.filter((e) => extras.has(e.id)).reduce((sum, e) => sum + e.price, 0);
    const totalPrice = basePrice + optionsTotal + extrasTotal;

    const budgetNum = budget.trim() === '' ? null : Number(budget.replace(/\s/g, '')) || null;
    const isOverBudget = budgetNum != null && totalPrice > budgetNum;
    const preview = getPreviewUrl(modelId, roofId, facadeId, terraceId);

    function buildSnapshot(name: string): ConfigSnapshot {
        return {
            id: `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name,
            timestamp: Date.now(),
            modelId,
            foundationId,
            facadeId,
            windowColorId,
            roofId,
            terraceId,
            interiorId,
            kitchenId,
            bathroomId,
            extras: Array.from(extras),
            totalPrice,
            summaryRows,
        };
    }

    function addToCompare() {
        const name = `Wariant ${comparisons.length + 1}`;
        const next = [...comparisons, buildSnapshot(name)];
        if (next.length > MAX_COMPARE) next.shift();
        setComparisons(next);
        setCompareOpen(true);
    }

    function removeFromCompare(id: string) {
        setComparisons((prev) => prev.filter((c) => c.id !== id));
    }

    const toggleExtra = (id: string) => {
        setExtras((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const [inquirySubmitting, setInquirySubmitting] = useState(false);

    const handleSendInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquiryConsent || !inquiryName.trim() || !inquiryEmail.trim() || !inquiryPhone.trim()) return;
        setInquirySubmitting(true);
        try {
            await addDoc(collection(db, 'inquiries'), {
                type: 'configurator',
                name: inquiryName.trim(),
                email: inquiryEmail.trim(),
                phone: inquiryPhone.trim(),
                config: { modelId, foundationId, facadeId, roofId, terraceId, interiorId, kitchenId, bathroomId, extras: Array.from(extras), summaryRows, totalPrice },
                createdAt: new Date().toISOString(),
                source: 'konfigurator',
            });
            setInquirySent(true);
        } catch (err) {
            console.error(err);
            setInquirySent(true);
        } finally {
            setInquirySubmitting(false);
        }
    };

    const summaryRows: { label: string; value: number }[] = [
        { label: `Model ${model.label} (${model.desc})`, value: model.price },
        ...(foundation.price > 0 ? [{ label: foundation.label, value: foundation.price }] : []),
        ...(facade.price > 0 ? [{ label: facade.label, value: facade.price }] : []),
        ...(windowColor.price > 0 ? [{ label: windowColor.label, value: windowColor.price }] : []),
        ...(roof.price > 0 ? [{ label: roof.label, value: roof.price }] : []),
        ...(terrace.price > 0 ? [{ label: terrace.label, value: terrace.price }] : []),
        ...(interior.price > 0 ? [{ label: interior.label, value: interior.price }] : []),
        ...(kitchen.price > 0 ? [{ label: kitchen.label, value: kitchen.price }] : []),
        ...(bathroom.price > 0 ? [{ label: bathroom.label, value: bathroom.price }] : []),
        ...EXTRAS.filter((e) => extras.has(e.id) && e.price > 0).map((e) => ({ label: e.label, value: e.price })),
    ];

    return (
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
            <section style={{ padding: '2.5rem 0 3rem', position: 'relative' }}>
                <div className="container">
                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <Breadcrumbs items={[{ label: 'Domy modułowe', path: '/domy-modulowe' }, { label: 'Konfigurator' }]} />
                        <div className="configurator-top-bar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sliders size={20} style={{ color: 'var(--color-primary)' }} />
                                <span className="section-label">Konfigurator</span>
                            </div>
                            {comparisons.length > 0 && (
                                <button
                                    type="button"
                                    className="configurator-compare-badge"
                                    onClick={() => setCompareOpen(true)}
                                    aria-label="Porównaj warianty"
                                >
                                    <GitCompare size={16} /> Porównaj ({comparisons.length})
                                </button>
                            )}
                        </div>
                        <h1 style={{ marginBottom: '0.5rem' }}>
                            Skonfiguruj <span className="text-gradient">swój dom modułowy</span>
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                            Krok {step} z {TOTAL_STEPS}: {WIZARD_STEPS[step - 1].title}
                        </p>

                        {/* Pasek postępu */}
                        <div className="configurator-progress">
                            {WIZARD_STEPS.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`configurator-progress-dot ${step >= s.id ? 'active' : ''}`}
                                    onClick={() => setStep(s.id)}
                                    title={s.title}
                                    aria-label={s.title}
                                >
                                    <span className="configurator-progress-dot-num">{s.id}</span>
                                </button>
                            ))}
                        </div>

                        <div className="configurator-layout">
                            <div className="configurator-left">
                                {/* Podgląd wizualny – widoczny w krokach 1–5 */}
                                {step <= 5 && (
                                    <div className="configurator-preview-block">
                                        <h3 className="config-block-title"><Eye size={18} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} /> Podgląd</h3>
                                        <div className="configurator-preview-wrap">
                                            <img
                                                src={preview.src}
                                                alt="Podgląd konfiguracji"
                                                onError={(e) => { e.currentTarget.src = preview.fallback; }}
                                                className="configurator-preview-img"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Zawartość kroków */}
                                {step === 1 && (
                                    <ConfigRadioBlock title="Wybierz model" options={MODELS} value={modelId} onChange={setModelId} overBudget={isOverBudget} />
                                )}
                                {step === 2 && (
                                    <>
                                        <ConfigRadioBlock title="Fundamenty" options={FOUNDATIONS} value={foundationId} onChange={setFoundationId} overBudget={isOverBudget} />
                                        <ConfigRadioBlock title="Elewacja" options={FACADES} value={facadeId} onChange={setFacadeId} overBudget={isOverBudget} />
                                        <ConfigRadioBlock title="Kolor stolarki okiennej" options={WINDOW_COLORS} value={windowColorId} onChange={setWindowColorId} overBudget={isOverBudget} />
                                    </>
                                )}
                                {step === 3 && (
                                    <>
                                        <ConfigRadioBlock title="Dach" options={ROOFS} value={roofId} onChange={setRoofId} overBudget={isOverBudget} />
                                        <ConfigRadioBlock title="Taras" options={TERRACES} value={terraceId} onChange={setTerraceId} overBudget={isOverBudget} />
                                    </>
                                )}
                                {step === 4 && (
                                    <>
                                        <ConfigRadioBlock title="Wykończenie wnętrza" options={INTERIOR_FINISH} value={interiorId} onChange={setInteriorId} overBudget={isOverBudget} />
                                        <ConfigRadioBlock title="Kuchnia" options={KITCHENS} value={kitchenId} onChange={setKitchenId} overBudget={isOverBudget} />
                                        <ConfigRadioBlock title="Łazienka" options={BATHROOMS} value={bathroomId} onChange={setBathroomId} overBudget={isOverBudget} />
                                    </>
                                )}
                                {step === 5 && (
                                    <ConfigCheckboxBlock title="Dodatkowe opcje" options={EXTRAS} selected={extras} onToggle={toggleExtra} overBudget={isOverBudget} />
                                )}
                                {step === 6 && (
                                    <div className="glass-panel config-block config-inquiry">
                                        <h3 className="config-block-title">Zapytaj o ofertę</h3>
                                        {inquirySent ? (
                                            <p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                                Dziękujemy! Skontaktujemy się wkrótce z wyceną.
                                            </p>
                                        ) : (
                                            <form onSubmit={handleSendInquiry} className="config-inquiry-form">
                                                <input type="text" placeholder="Imię i nazwisko" value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} required className="config-inquiry-input" />
                                                <input type="email" placeholder="E-mail" value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} required className="config-inquiry-input" />
                                                <input type="tel" placeholder="Telefon" value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} required className="config-inquiry-input" />
                                                <label className="config-inquiry-consent">
                                                    <input type="checkbox" checked={inquiryConsent} onChange={(e) => setInquiryConsent(e.target.checked)} required />
                                                    <span>Wyrażam zgodę na kontakt w celu przedstawienia oferty i przetwarzanie danych zgodnie z polityką prywatności.</span>
                                                </label>
                                                <button type="submit" className="btn-primary config-inquiry-submit" disabled={inquirySubmitting}>
                                                    {inquirySubmitting ? 'Wysyłanie...' : <><Send size={18} /> Wyślij zapytanie</>}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {/* Nawigacja wizarda */}
                                {step < 6 && (
                                    <div className="configurator-wizard-nav">
                                        <button type="button" className="btn-secondary" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
                                            <ChevronLeft size={18} /> Wstecz
                                        </button>
                                        <button type="button" className="btn-primary" onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}>
                                            Dalej <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Panel boczny: podsumowanie + budżet + podgląd + porównanie */}
                            <div className="glass-panel configurator-summary">
                                <h3 className="configurator-summary-title">Cena projektu</h3>
                                <p className="configurator-summary-price">{formatPrice(totalPrice)}</p>

                                <label className="configurator-budget-label">
                                    Mój maksymalny budżet (zł)
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="np. 200 000"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 '))}
                                    className="configurator-budget-input"
                                />
                                {isOverBudget && (
                                    <p className="configurator-budget-warning" role="alert">
                                        Konfiguracja przekracza budżet o {formatPrice(totalPrice - budgetNum!)}. Rozważ tańsze opcje (zaznaczone na pomarańczowo).
                                    </p>
                                )}

                                <div className="configurator-summary-divider">
                                    {summaryRows.map((row, i) => (
                                        <div key={i} className="configurator-summary-row">
                                            <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                                            <span>{row.value === 0 ? '0 zł' : formatPrice(row.value)}</span>
                                        </div>
                                    ))}
                                </div>
                                <ConfiguratorInstallmentsPreview totalPrice={totalPrice} />
                                <p className="configurator-summary-disclaimer">
                                    Wycena orientacyjna. Ostateczna oferta po konsultacji i weryfikacji działki.
                                </p>
                                {comparisons.length < MAX_COMPARE && (
                                    <button type="button" className="btn-secondary configurator-summary-compare-btn" onClick={addToCompare} style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                        <GitCompare size={18} /> Dodaj do porównania
                                    </button>
                                )}
                                <button className="btn-primary configurator-summary-cta" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/osiedle-tluszcz#kontakt')}>
                                    Umów konsultację <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal porównania wariantów */}
            {compareOpen && (
                <div className="configurator-compare-overlay" onClick={() => setCompareOpen(false)} role="dialog" aria-modal="true" aria-label="Porównanie wariantów">
                    <div className="configurator-compare-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="configurator-compare-header">
                            <h2>Porównanie wariantów</h2>
                            <button type="button" className="configurator-compare-close" onClick={() => setCompareOpen(false)} aria-label="Zamknij"><X size={24} /></button>
                        </div>
                        <div className="configurator-compare-body">
                            {comparisons.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>Brak zapisanych wariantów. Dodaj konfigurację do porównania w panelu po prawej.</p>
                            ) : (
                                <div className="configurator-compare-grid">
                                    {comparisons.map((c) => (
                                        <div key={c.id} className="configurator-compare-card">
                                            <div className="configurator-compare-card-header">
                                                <strong>{c.name}</strong>
                                                <span className="configurator-compare-card-price">{formatPrice(c.totalPrice)}</span>
                                                <button type="button" className="configurator-compare-card-remove" onClick={() => removeFromCompare(c.id)} aria-label="Usuń z porównania"><X size={16} /></button>
                                            </div>
                                            <ul className="configurator-compare-card-list">
                                                {c.summaryRows.map((row, i) => (
                                                    <li key={i}><span>{row.label}</span><span>{row.value === 0 ? '0 zł' : formatPrice(row.value)}</span></li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
