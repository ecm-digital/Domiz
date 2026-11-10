import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowRight, Building, MapPin } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';
import { useLanguage } from '../../context/useLanguage';

const PLANS = [
    {
        level: 'Parter',
        title: 'Strefa dzienna z garażem i jasną kuchnią',
        image: '/osiedle-tluszcz/sasanka-xl-parter.webp',
        rooms: [
            { no: '1', name: 'Wiatrołap', area: '3,74 m²' },
            { no: '2', name: 'Łazienka', area: '5,40 m²' },
            { no: '3', name: 'Salon z jadalnią', area: '22,47 m²' },
            { no: '4', name: 'Kuchnia z oknem', area: '7,79 m²' },
            { no: '5', name: 'Schowek', area: '0,73 m²' },
            { no: '6', name: 'Garaż w bryle', area: '18,09 m²' },
        ]
    },
    {
        level: 'Piętro',
        title: 'Trzy sypialnie, duża łazienka i garderoba',
        image: '/osiedle-tluszcz/sasanka-xl-pietro.webp',
        rooms: [
            { no: '1', name: 'Schody i przedpokój', area: '9,11 m²' },
            { no: '2', name: 'Łazienka z wanną', area: '6,83 m²' },
            { no: '3', name: 'Sypialnia główna', area: '9,11 m²' },
            { no: '4', name: 'Pokój dziecięcy 1', area: '9,11 m²' },
            { no: '5', name: 'Pokój dziecięcy 2', area: '6,70 m²' },
            { no: '6', name: 'Prywatna garderoba', area: '2,01 m²' },
        ]
    }
];

const AVAILABILITY = [
    { name: 'Bliźniak A / lok. 1', type: 'Sasanka XL z garażem', status: 'Zapytaj o dostępność', accent: 'var(--color-primary)' },
    { name: 'Bliźniak A / lok. 2', type: 'Sasanka XL z garażem', status: 'Zapytaj o dostępność', accent: 'var(--color-primary)' },
    { name: 'Bliźniak B / lok. 1', type: 'Sasanka XL z garażem', status: 'Zapytaj o dostępność', accent: 'var(--color-primary)' },
    { name: 'Bliźniak B / lok. 2', type: 'Sasanka XL z garażem', status: 'Zapytaj o dostępność', accent: 'var(--color-primary)' },
    { name: 'Dom wolnostojący', type: 'Sasanka XL z garażem', status: 'Największa prywatność', accent: '#0284c7' },
];

export function OsiedlePromo() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isEnglish = language === 'en';
    const [activePlan, setActivePlan] = useState(0);
    const displayPlans = isEnglish ? [
        { ...PLANS[0], level: 'Ground floor', title: 'Living area with a garage and bright kitchen', rooms: [{ no: '1', name: 'Entrance hall', area: '3.74 m²' }, { no: '2', name: 'Bathroom', area: '5.40 m²' }, { no: '3', name: 'Living and dining room', area: '22.47 m²' }, { no: '4', name: 'Kitchen with window', area: '7.79 m²' }, { no: '5', name: 'Storage', area: '0.73 m²' }, { no: '6', name: 'Integrated garage', area: '18.09 m²' }] },
        { ...PLANS[1], level: 'First floor', title: 'Three bedrooms, a large bathroom and walk-in wardrobe', rooms: [{ no: '1', name: 'Stairs and hallway', area: '9.11 m²' }, { no: '2', name: 'Bathroom with bathtub', area: '6.83 m²' }, { no: '3', name: 'Main bedroom', area: '9.11 m²' }, { no: '4', name: 'Children’s bedroom 1', area: '9.11 m²' }, { no: '5', name: 'Children’s bedroom 2', area: '6.70 m²' }, { no: '6', name: 'Private walk-in wardrobe', area: '2.01 m²' }] },
    ] : PLANS;

    const handlePlanToggle = (idx: number) => {
        setActivePlan(idx);
        trackEvent('promo_plan_toggle', { plan_level: PLANS[idx].level });
    };

    const handleUnitClick = (name: string) => {
        trackEvent('promo_unit_click', { unit_name: name });
        navigate('/osiedle-tluszcz#kontakt');
    };

    return (
        <section className="home-section osiedle-promo-section">
            <div className="container">
                <div className="home-section-header">
                    <span className="section-label">{isEnglish ? 'New development' : 'Nowa Inwestycja'}</span>
                    <h2>Osiedle Sasankowe Tłuszcz – <span className="text-gradient">{isEnglish ? 'Sasanka XL with a garage' : 'Sasanka XL z garażem'}</span></h2>
                    <p className="home-section-desc">
                        {isEnglish ? 'Our flagship development: a boutique estate of five modern homes on Zaściankowa Street, with convenient rail access to Warsaw. Every home combines an energy-efficient Sasanka XL design with a spacious garden and garage — ideal for families seeking peace, local amenities and a practical connection to the capital.' : 'Nasza flagowa realizacja deweloperska. Kameralny kompleks 5 nowoczesnych domów w cichej okolicy przy ul. Zaściankowej z dogodnym dojazdem PKP do Warszawy. Każdy nowy dom na sprzedaż w Tłuszczu w tej inwestycji łączy w sobie energooszczędność, nowoczesną architekturę typu Sasanka XL oraz przestronny ogród z garażem. To idealne miejsce dla osób poszukujących cichego bliźniaka w powiecie wołomińskim z pełnym zapleczem miejskim i sprawną komunikacją ze stolicą.'}
                    </p>
                </div>

                <div className="promo-grid">
                    {/* Left: Project Facts & Blueprint switcher */}
                    <div className="promo-content-left glass-panel">
                        <div className="promo-location">
                            <MapPin className="text-primary animate-pulse" size={20} />
                            <span>{isEnglish ? 'Zaściankowa Street, Tłuszcz (Wołomin County)' : 'ul. Zaściankowa, Tłuszcz (powiat wołomiński)'}</span>
                        </div>

                        <h3 className="promo-subtitle">
                            <Home size={18} className="text-primary" />
                            {isEnglish ? 'View the home layout' : 'Zobacz układ funkcjonalny domu'}
                        </h3>

                        {/* Plan Switch Buttons */}
                        <div className="plan-buttons">
                            {displayPlans.map((plan, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePlanToggle(idx)}
                                    className={`plan-tab-btn ${idx === activePlan ? 'active' : ''}`}
                                >
                                    {plan.level}
                                </button>
                            ))}
                        </div>

                        <p className="plan-title-text">{displayPlans[activePlan].title}</p>

                        {/* Rooms List */}
                        <div className="plan-rooms-table">
                            {displayPlans[activePlan].rooms.map((room) => (
                                <div key={room.no} className="room-table-row">
                                    <span className="room-no">{room.no}</span>
                                    <span className="room-name">{room.name}</span>
                                    <span className="room-area">{room.area}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/osiedle-tluszcz')}
                            className="btn-primary promo-cta-btn"
                        >
                            {isEnglish ? 'Development details and price lists' : 'Szczegóły inwestycji i cenniki'}
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* Right: Interactive Layout/Visual representation */}
                    <div className="promo-content-right glass-panel">
                        <div className="blueprint-img-wrap">
                            <img
                                src={displayPlans[activePlan].image}
                                alt={`${isEnglish ? '3D floor plan' : 'Rzut 3D'} - ${displayPlans[activePlan].level}`}
                                className="blueprint-img"
                                onError={(e) => {
                                    // Fallback if image doesn't exist
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            {/* Visual Fallback Card if blueprint image isn't fully loaded */}
                            <div className="blueprint-placeholder-card">
                                <span>{isEnglish ? '3D floor plan' : 'Rzut graficzny 3D'} ({displayPlans[activePlan].level})</span>
                            </div>
                        </div>

                        {/* Interactive Availability list */}
                        <div className="promo-availability">
                            <h4 className="availability-title">
                                <Building size={16} className="text-primary" />
                                {isEnglish ? 'Available homes:' : 'Lista dostępnych lokali:'}
                            </h4>
                            <div className="availability-grid">
                                {AVAILABILITY.map((unit) => (
                                    <div
                                        key={unit.name}
                                        onClick={() => handleUnitClick(unit.name)}
                                        className="availability-card-compact"
                                        style={{ '--accent-color': unit.accent } as React.CSSProperties}
                                    >
                                        <div className="availability-card-status">
                                            <span className="dot" />
                                            <span>{isEnglish ? (unit.status === 'Największa prywatność' ? 'Maximum privacy' : 'Ask about availability') : unit.status}</span>
                                        </div>
                                        <strong>{unit.name}</strong>
                                        <p>{isEnglish ? 'Sasanka XL with a garage' : unit.type}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
