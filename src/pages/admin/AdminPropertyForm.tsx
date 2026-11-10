
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadImage } from '../../utils/uploadImage';
// import { useAuth } from '../../context/AuthContext'; // Protected route handles auth check
import { Loader2, ArrowLeft, Upload } from 'lucide-react';
import './admin-theme.css';

const TYPES = ['dom', 'mieszkanie', 'dzialka'];
const STATUSES = ['sprzedaz', 'wynajem'];

const INITIAL_STATE = {
    title: '',
    price: 0,
    location: '',
    beds: 0,
    baths: 0,
    sqft: 0,
    type: 'dom',
    status: 'sprzedaz',
    description: '',
    features: [] as string[],
    image: '',
    images: [] as string[],
    featured: false,
    published: true,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoSlug: '',
    agent: {
        name: 'Tomasz Gnat',
        phone: '+48 517 303 400',
        email: 'tomasz.gnat@domiz.pl',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=2574'
    }
};

export const AdminPropertyForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // ProtectedRoute handles redirection if not logged in

    const [formData, setFormData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Otodom Importer states
    const [otodomUrl, setOtodomUrl] = useState('');
    const [otodomHtml, setOtodomHtml] = useState('');
    const [showHtmlInput, setShowHtmlInput] = useState(false);
    const [importing, setImporting] = useState(false);

    // AI SEO states
    const [generatingSeo, setGeneratingSeo] = useState(false);

    const handleAiSeoGenerate = async () => {
        if (!formData.title) {
            alert("Najpierw wpisz tytuł oferty!");
            return;
        }
        setGeneratingSeo(true);
        try {
            // 1. Get Gemini API Key from configs
            const docRef = doc(db, "configs", "seo");
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists() || !docSnap.data().geminiApiKey) {
                alert("Najpierw musisz skonfigurować Klucz API Google Gemini w Ustawieniach panelu administratora!");
                return;
            }
            
            const apiKey = docSnap.data().geminiApiKey;
            
            const prompt = `Jesteś ekspertem SEO dla polskiego biura nieruchomości Domiz Homes, prezentującego oferty na Śląsku, Mazowszu i w Dubaju.
Zoptymalizuj poniższą ofertę pod kątem wyszukiwarki Google.
Wygeneruj:
1. Przyciągający, konkretny i sformatowany opis według standardu Domiz Homes. Zacznij od 1–2 zdań z najsilniejszą, potwierdzoną cechą oferty oraz lokalizacją. Następnie stosuj dokładnie cztery krótkie sekcje: „ATUTY NIERUCHOMOŚCI”, „UKŁAD I STANDARD”, „LOKALIZACJA”, „DLA KOGO”. Na końcu dodaj: „ZAPRASZAMY NA PREZENTACJĘ” i jedno neutralne zdanie zachęcające do kontaktu. Używaj prostego, aktywnego języka, konkretnych parametrów i list z punktorami. Nie używaj pustych superlatywów (np. „wyjątkowa”, „idealna”, „godna uwagi”), nie twórz presji zakupowej i nie dopisuj żadnych cech, odległości, stanu prawnego, standardu ani udogodnień, których nie ma w danych. Dobierz lokalne słowa kluczowe wyłącznie do potwierdzonej miejscowości i dzielnicy.
2. SEO Meta Title (do 60 znaków, np. "Mieszkanie 55 m² | Katowice Zadole").
3. SEO Meta Description (do 160 znaków, zachęcający do kliknięcia).
4. Słowa kluczowe (oddzielone przecinkami, 5-8 słów).
5. Przyjazny URL slug uwzględniający rzeczywistą miejscowość.

Dane wejściowe oferty:
Tytuł: ${formData.title}
Cena: ${formData.price} zł
Lokalizacja: ${formData.location}
Typ: ${formData.type}
Status: ${formData.status}
Metraż: ${formData.sqft} m²
Pokoje: ${formData.beds}
Łazienki: ${formData.baths}
Udogodnienia: ${formData.features.join(', ')}
Opis bazowy: ${formData.description}`;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                description: { type: "STRING" },
                                seoTitle: { type: "STRING" },
                                seoDescription: { type: "STRING" },
                                seoKeywords: { type: "STRING" },
                                seoSlug: { type: "STRING" }
                            },
                            required: ["description", "seoTitle", "seoDescription", "seoKeywords", "seoSlug"]
                        }
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error("Gemini API Error: " + errText);
            }

            const resData = await response.json();
            const jsonText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonText) {
                throw new Error("Pusta odpowiedź z modelu AI.");
            }

            const aiSeo = JSON.parse(jsonText);
            
            setFormData(prev => ({
                ...prev,
                description: aiSeo.description || prev.description,
                seoTitle: aiSeo.seoTitle || prev.seoTitle,
                seoDescription: aiSeo.seoDescription || prev.seoDescription,
                seoKeywords: aiSeo.seoKeywords || prev.seoKeywords,
                seoSlug: aiSeo.seoSlug || prev.seoSlug,
            }));
            
            alert("Opis i meta tagi SEO zostały pomyślnie wygenerowane przez Gemini AI!");
        } catch (error: any) {
            console.error("AI Generation Error:", error);
            alert("Błąd podczas generowania SEO: " + error.message);
        } finally {
            setGeneratingSeo(false);
        }
    };

    const isEditMode = Boolean(id);

    const handleUrlImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otodomUrl.trim()) return;

        setImporting(true);
        try {
            let html = '';
            
            // Try Proxy 1: corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(otodomUrl.trim())}`;
                const res = await fetch(proxyUrl);
                if (res.ok) {
                    html = await res.text();
                }
            } catch (err) {
                console.warn("Proxy 1 failed, trying proxy 2...", err);
            }

            // Try Proxy 2: allorigins if Proxy 1 failed
            if (!html || (!html.includes('__NEXT_DATA__') && !html.includes('application/ld+json'))) {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(otodomUrl.trim())}`;
                const res = await fetch(proxyUrl);
                if (res.ok) {
                    const data = await res.json();
                    html = data.contents || '';
                }
            }

            if (!html || (!html.includes('__NEXT_DATA__') && !html.includes('application/ld+json'))) {
                throw new Error("Could not bypass anti-bot protection.");
            }

            const parsedData = parseOtodomHtml(html);
            applyImportedData(parsedData);
            alert("Dane zostały zaimportowane pomyślnie!");
        } catch (error) {
            console.error(error);
            setShowHtmlInput(true);
            alert("Nie udało się pobrać danych automatycznie (zabezpieczenie Cloudflare). Proszę użyć metody wklejenia kodu źródłowego (instrukcja poniżej).");
        } finally {
            setImporting(false);
        }
    };

    const handleHtmlImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!otodomHtml.trim()) return;

        try {
            const parsedData = parseOtodomHtml(otodomHtml);
            applyImportedData(parsedData);
            alert("Dane zostały zaimportowane z kodu źródłowego!");
            setOtodomHtml('');
            setShowHtmlInput(false);
        } catch (error) {
            console.error(error);
            alert("Błąd podczas przetwarzania kodu źródłowego. Upewnij się, że skopiowałeś całą treść strony.");
        }
    };

    const applyImportedData = (data: ReturnType<typeof parseOtodomHtml>) => {
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            price: data.price || prev.price,
            location: data.location || prev.location,
            beds: data.beds || prev.beds,
            baths: data.baths || prev.baths,
            sqft: data.sqft || prev.sqft,
            description: data.description || prev.description,
            image: data.image || prev.image,
            images: data.images.length > 0 ? data.images : prev.images,
            features: data.features.length > 0 ? data.features : prev.features,
            type: data.type || prev.type,
            status: data.status || prev.status,
        }));
    };

    useEffect(() => {
        if (isEditMode && id) {
            setLoading(true);
            const fetchProperty = async () => {
                try {
                    const docRef = doc(db, "properties", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setFormData({ ...INITIAL_STATE, ...docSnap.data() } as any);
                    } else {
                        alert("Nie znaleziono oferty!");
                        navigate('/admin');
                    }
                } catch (error) {
                    console.error("Błąd pobierania oferty:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProperty();
        }
    }, [id, isEditMode, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleFeaturesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const featuresArray = e.target.value.split(',').map(f => f.trim()).filter(f => f);
        setFormData(prev => ({ ...prev, features: featuresArray }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        try {
            const files = Array.from(e.target.files);
            const urls = await Promise.all(files.map(file => uploadImage(file, 'properties')));

            if (isMain) {
                setFormData(prev => ({ ...prev, image: urls[0] }));
            } else {
                setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
            }
        } catch (error) {
            console.error("Błąd wysyłania zdjęcia:", error);
            alert("Nie udało się wgrać zdjęcia.");
        } finally {
            setUploading(false);
        }
    };

    const removeGalleryImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const propertyId = isEditMode && id ? Number(id) : Date.now();

            const propertyData = {
                ...formData,
                id: propertyId
            };

            await setDoc(doc(db, "properties", propertyId.toString()), propertyData);

            alert(isEditMode ? "Zaktualizowano ofertę!" : "Dodano nową ofertę!");
            navigate('/admin');
        } catch (error: any) {
            console.error(error);
            alert("Błąd zapisu: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) return <div className="loader-container"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container admin-property-form-page" style={{ paddingTop: '120px', paddingBottom: '4rem', maxWidth: '800px' }}>
            <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <ArrowLeft size={20} /> Wróć do listy
            </button>

             <h1 style={{ marginBottom: '2rem' }}>{isEditMode ? 'Edytuj Ofertę' : 'Dodaj Nową Ofertę'}</h1>
 
            {/* Widżet importu z Otodom */}
            {!isEditMode && (
                <div className="glass-panel admin-property-importer" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.75rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Otodom</span> Importer
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', marginTop: 0 }}>
                        Wklej link do oferty na Otodom, aby automatycznie uzupełnić wszystkie pola formularza i załadować galerię zdjęć.
                    </p>

                    <form onSubmit={handleUrlImport} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="url"
                            placeholder="https://www.otodom.pl/pl/oferta/..."
                            value={otodomUrl}
                            onChange={(e) => setOtodomUrl(e.target.value)}
                            className="form-input"
                            style={{ margin: 0, flexGrow: 1 }}
                            disabled={importing}
                        />
                        <button type="submit" className="btn-primary" disabled={importing || !otodomUrl.trim()} style={{ whiteSpace: 'nowrap' }}>
                            {importing ? <Loader2 className="animate-spin" size={18} /> : 'Importuj'}
                        </button>
                    </form>

                    {showHtmlInput ? (
                        <form onSubmit={handleHtmlImport} style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', marginTop: 0 }}>
                                💡 <strong>Metoda alternatywna:</strong> Zabezpieczenia Otodom uniemożliwiły pobranie linku bezpośrednio. Aby zaimportować, wykonaj te proste kroki:
                                <ol style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', marginBottom: '0.5rem' }}>
                                    <li>Otwórz ofertę w nowej karcie przeglądarki</li>
                                    <li>Kliknij prawym przyciskiem myszy i wybierz <strong>Wyświetl źródło strony</strong> (lub skrót <code>Ctrl+U</code> / <code>Cmd+U</code>)</li>
                                    <li>Zaznacz całą treść (<code>Ctrl+A</code> / <code>Cmd+A</code>), skopiuj i wklej ją w poniższe pole:</li>
                                </ol>
                            </p>
                            <textarea
                                placeholder="Wklej tutaj kod źródłowy strony Otodom..."
                                value={otodomHtml}
                                onChange={(e) => setOtodomHtml(e.target.value)}
                                rows={4}
                                className="form-input"
                                style={{ width: '100%', marginBottom: '0.75rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="btn-primary" disabled={!otodomHtml.trim()}>
                                    Importuj z kodu źródłowego
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowHtmlInput(false)}>
                                    Anuluj
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                            <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => setShowHtmlInput(true)}
                            >
                                Importuj za pomocą wklejenia kodu źródłowego HTML
                            </button>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-panel admin-property-form" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Podstawowe dane */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label>Tytuł</label>
                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="form-input" />
                    </div>
                    <div>
                        <label>Cena (PLN)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="form-input" />
                    </div>
                </div>

                <div>
                    <label>Lokalizacja</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} required className="form-input" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label>Pokoje (Beds)</label>
                        <input type="number" name="beds" value={formData.beds} onChange={handleInputChange} required className="form-input" />
                    </div>
                    <div>
                        <label>Łazienki</label>
                        <input type="number" name="baths" value={formData.baths} onChange={handleInputChange} required className="form-input" />
                    </div>
                    <div>
                        <label>Powierzchnia (m²)</label>
                        <input type="number" name="sqft" value={formData.sqft} onChange={handleInputChange} required className="form-input" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label>Typ</label>
                        <select name="type" value={formData.type} onChange={handleInputChange} className="form-input">
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleInputChange} className="form-input">
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label>Opis</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={6} className="form-input" required />
                </div>

                <div>
                    <label>Udogodnienia (oddzielone przecinkami)</label>
                    <input
                        type="text"
                        placeholder="Np. Garaż, Balkon, Winda"
                        value={formData.features.join(', ')}
                        onChange={handleFeaturesChange}
                        className="form-input"
                    />
                </div>

                {/* Sekcja Zdjęć */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <h3>Zdjęcia</h3>

                    {/* Główne zdjęcie */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Zdjęcie Główne (Main Image)</label>
                        {formData.image && (
                            <div style={{ marginBottom: '1rem' }}>
                                <img src={formData.image} alt="Main" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                            </div>
                        )}
                        <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <Upload size={18} />
                            {uploading ? 'Wgrywanie...' : 'Wybierz zdjęcie główne'}
                            <input type="file" onChange={(e) => handleImageUpload(e, true)} style={{ display: 'none' }} accept="image/*" disabled={uploading} />
                        </label>
                    </div>

                    {/* Galeria */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Galeria (Dodatkowe zdjęcia)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            {formData.images.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative' }}>
                                    <img src={img} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(idx)}
                                        style={{
                                            position: 'absolute', top: '5px', right: '5px',
                                            background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%',
                                            width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                        <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <Upload size={18} />
                            {uploading ? 'Wgrywanie...' : 'Dodaj do galerii'}
                            <input type="file" onChange={(e) => handleImageUpload(e, false)} style={{ display: 'none' }} accept="image/*" multiple disabled={uploading} />
                        </label>
                    </div>
                </div>

                {/* Ustawienia SEO */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Ustawienia SEO & Generowanie AI</h3>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => void handleAiSeoGenerate()}
                            disabled={generatingSeo || !formData.title}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
                        >
                            {generatingSeo ? <Loader2 className="animate-spin" size={16} /> : 'Generuj z AI (Gemini)'}
                        </button>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
                        Sztuczna inteligencja zoptymalizuje opis nieruchomości pod kątem pozycjonowania lokalnego oraz automatycznie uzupełni meta tagi SEO.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                        <div>
                            <label>Tytuł SEO (Meta Title)</label>
                            <input
                                type="text"
                                name="seoTitle"
                                value={formData.seoTitle || ''}
                                onChange={handleInputChange}
                                placeholder="Np. Mieszkanie 55 m² | Katowice Zadole"
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label>Przyjazny URL (Slug)</label>
                            <input
                                type="text"
                                name="seoSlug"
                                value={formData.seoSlug || ''}
                                onChange={handleInputChange}
                                placeholder="Np. mieszkanie-55m2-katowice-zadole"
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label>Opis SEO (Meta Description)</label>
                        <textarea
                            name="seoDescription"
                            value={formData.seoDescription || ''}
                            onChange={handleInputChange}
                            placeholder="Zwięzły opis do wyników wyszukiwania (do 160 znaków)..."
                            rows={3}
                            className="form-input"
                        />
                    </div>

                    <div>
                        <label>Słowa Kluczowe SEO (Keywords, oddzielone przecinkami)</label>
                        <input
                            type="text"
                            name="seoKeywords"
                            value={formData.seoKeywords || ''}
                            onChange={handleInputChange}
                            placeholder="Np. mieszkania Katowice, nieruchomości Śląsk, domy Tłuszcz"
                            className="form-input"
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                        id="featured-check"
                    />
                    <label htmlFor="featured-check">Wyróżnij tę ofertę (Featured)</label>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '1rem', border: formData.published ? '1px solid #86efac' : '1px solid #fde68a', borderRadius: '0.75rem', background: formData.published ? '#f0fdf4' : '#fffbeb' }}>
                    <input
                        type="checkbox"
                        name="published"
                        checked={formData.published}
                        onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                        id="published-check"
                        style={{ marginTop: '0.2rem' }}
                    />
                    <label htmlFor="published-check" style={{ cursor: 'pointer' }}><strong>{formData.published ? 'Oferta opublikowana na stronie' : 'Wersja robocza — niewidoczna na stronie'}</strong><span style={{ display: 'block', marginTop: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{formData.published ? 'Klienci mogą znaleźć i otworzyć tę ofertę.' : 'Uzupełnij dane i zdjęcia, a następnie zaznacz to pole, aby opublikować ofertę.'}</span></label>
                </div>

                <button type="submit" className="btn-primary" disabled={loading || uploading} style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}>
                    {loading ? <Loader2 className="animate-spin" /> : (isEditMode ? 'Zapisz Zmiany' : 'Dodaj Ofertę')}
                </button>
            </form>

            <style>{`
                .form-input {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    border: 1px solid var(--color-border);
                    margin-top: 0.5rem;
                    font-size: 1rem;
                }
                .loader-container {
                    display: flex;
                    justifyContent: center;
                    alignItems: center;
                    height: 100vh;
                }
            `}</style>
        </div>
    );
};

function parseOtodomHtml(htmlOrJson: string) {
    let adData: any = null;

    if (htmlOrJson.trim().startsWith('{') && htmlOrJson.trim().endsWith('}')) {
        try {
            const parsed = JSON.parse(htmlOrJson);
            const pageProps = parsed?.props?.pageProps || {};
            adData = pageProps.ad || pageProps.advert || pageProps.adData || pageProps.initialProps?.ad || parsed;
        } catch (e) {
            console.error("Failed to parse raw JSON:", e);
        }
    }

    if (!adData) {
        const nextDataMatch = htmlOrJson.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json"\s*>(.*?)<\/script>/s);
        if (nextDataMatch) {
            try {
                const nextDataParsed = JSON.parse(nextDataMatch[1]);
                const pageProps = nextDataParsed?.props?.pageProps || {};
                adData = pageProps.ad || pageProps.advert || pageProps.adData || pageProps.initialProps?.ad;
            } catch (e) {
                console.error("Failed to parse __NEXT_DATA__ script:", e);
            }
        }
    }

    if (!adData) {
        const jsonLdMatches = [...htmlOrJson.matchAll(/<script\s+type="application\/ld\+json"\s*>(.*?)<\/script>/gs)];
        for (const match of jsonLdMatches) {
            try {
                const parsed = JSON.parse(match[1]);
                const objects = Array.isArray(parsed) ? parsed : [parsed];
                for (const obj of objects) {
                    if (obj['@type'] === 'Product' || obj['@type'] === 'SingleFamilyResidence' || obj['offers']) {
                        adData = obj;
                        break;
                    }
                }
            } catch (e) {
                // Ignore script parsing errors
            }
        }
    }

    let title = "";
    let price = 0;
    let location = "";
    let beds = 0;
    let baths = 0;
    let sqft = 0;
    let description = "";
    let image = "";
    let images: string[] = [];
    let features: string[] = [];
    let type: 'dom' | 'mieszkanie' | 'dzialka' = 'dom';
    let status: 'sprzedaz' | 'wynajem' = 'sprzedaz';

    if (!adData) {
        const titleMatch = htmlOrJson.match(/<title>(.*?)<\/title>/);
        title = titleMatch ? titleMatch[1].replace(" - Otodom.pl", "").trim() : "";
        return { title, price, location, beds, baths, sqft, description, image, images, features, type, status };
    }

    if (adData['@context'] || adData['@type']) {
        title = adData.name || "";
        description = adData.description || "";
        
        if (adData.offers) {
            const offers = Array.isArray(adData.offers) ? adData.offers[0] : adData.offers;
            price = Number(offers.price) || Number(offers.lowPrice) || 0;
        }
        
        if (adData.image) {
            images = Array.isArray(adData.image) ? adData.image : [adData.image];
            image = images[0] || "";
        }
        
        if (adData.address) {
            const addr = adData.address;
            location = [addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ");
        }
    } else {
        title = adData.title || adData.heading || "";
        description = adData.description || "";
        price = adData.price?.value || adData.price?.amount || 0;
        
        if (adData.location?.address) {
            const locObj = adData.location.address;
            const street = locObj.street?.name || locObj.street;
            const city = locObj.city?.name || locObj.city;
            const province = locObj.province?.name || locObj.province;
            location = [street, city, province].filter(Boolean).join(", ");
        } else if (adData.location?.reverseGeocoding?.cityName) {
            location = adData.location.reverseGeocoding.cityName;
        }

        const targetType = adData.target?.transaction || '';
        if (targetType.includes('rent') || targetType.includes('wynajem')) {
            status = 'wynajem';
        } else {
            status = 'sprzedaz';
        }

        const category = adData.target?.category || '';
        if (category.includes('apartment') || category.includes('flat') || category.includes('mieszkanie')) {
            type = 'mieszkanie';
        } else if (category.includes('land') || category.includes('dzialka') || category.includes('plot')) {
            type = 'dzialka';
        } else {
            type = 'dom';
        }

        // Characteristics
        if (Array.isArray(adData.characteristics)) {
            adData.characteristics.forEach((char: any) => {
                const key = char.key;
                const value = char.value;
                const label = char.label;

                if (key === 'm') {
                    sqft = Math.round(parseFloat(value)) || 0;
                } else if (key === 'rooms_num' || key === 'rooms') {
                    beds = parseInt(value, 10) || 0;
                } else if (key === 'bathrooms') {
                    baths = parseInt(value, 10) || 0;
                }

                if (label && value) {
                    features.push(`${label}: ${value}`);
                }
            });
        } else if (adData.characteristics && typeof adData.characteristics === 'object') {
            const char = adData.characteristics;
            const sqftVal = char.m || char.surface || adData.surface || adData.area;
            if (sqftVal) sqft = Math.round(parseFloat(sqftVal)) || 0;

            const roomsVal = char.rooms_num || char.rooms || adData.rooms;
            if (roomsVal) beds = parseInt(roomsVal, 10) || 0;

            const bathsVal = char.bathrooms || char.baths;
            if (bathsVal) baths = parseInt(bathsVal, 10) || 0;

            Object.entries(char).forEach(([key, val]: [string, any]) => {
                if (typeof val === 'string' || typeof val === 'number') {
                    features.push(`${key}: ${val}`);
                }
            });
        }

        // Gallery
        if (Array.isArray(adData.images)) {
            images = adData.images.map((img: any) => {
                if (typeof img === 'string') return img;
                return img.large || img.medium || img.url || img.thumbnail;
            }).filter(Boolean);
            image = images[0] || "";
        }
    }

    return { title, price, location, beds, baths, sqft, description, image, images, features, type, status };
}
