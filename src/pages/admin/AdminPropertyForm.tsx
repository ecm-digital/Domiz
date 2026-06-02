
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadImage } from '../../utils/uploadImage';
// import { useAuth } from '../../context/AuthContext'; // Protected route handles auth check
import { Loader2, ArrowLeft, Upload } from 'lucide-react';

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

    const isEditMode = Boolean(id);

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
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem', maxWidth: '800px' }}>
            <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <ArrowLeft size={20} /> Wróć do listy
            </button>

            <h1 style={{ marginBottom: '2rem' }}>{isEditMode ? 'Edytuj Ofertę' : 'Dodaj Nową Ofertę'}</h1>

            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

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
