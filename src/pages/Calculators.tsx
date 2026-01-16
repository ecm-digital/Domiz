import { useState } from 'react';
import { Calculator, Home, CreditCard, Info, Check, AlertCircle } from 'lucide-react';

// Building cost rates per m2
const COST_RATES = {
    shell: 3500, // stan surowy
    developer: 4800, // deweloperski
    turnkey: 6200, // pod klucz
    premium: 7500, // premium
};

const BUILDING_STEPS = [
    { step: 1, title: 'Przygotuj dokumenty', desc: 'Zbierz dokumenty niezbędne do złożenia wniosku: dowód osobisty, zaświadczenie o zarobkach, PIT za ostatni rok.' },
    { step: 2, title: 'Złóż wniosek', desc: 'Wypełnij wniosek kredytowy online lub w placówce banku. Nasi eksperci pomogą Ci w procesie.' },
    { step: 3, title: 'Odbierz decyzję', desc: 'Po pozytywnej weryfikacji otrzymasz decyzję kredytową i możesz podpisać umowę z deweloperem.' },
];

export function Calculators() {
    // Building calculator state
    const [houseArea, setHouseArea] = useState(120);
    const [plotArea, setPlotArea] = useState(500);
    const [floors, setFloors] = useState(2);
    const [finishLevel, setFinishLevel] = useState<'shell' | 'developer' | 'turnkey' | 'premium'>('developer');

    // Mortgage calculator state
    const [loanAmount, setLoanAmount] = useState(500000);
    const [downPayment, setDownPayment] = useState(100000);
    const [interestRate, setInterestRate] = useState(7.5);
    const [loanTerm, setLoanTerm] = useState(25);

    // Building cost calculations
    const baseBuildCost = houseArea * COST_RATES[finishLevel];
    const plotCost = plotArea * 200; // 200 PLN per m2 for plot
    const foundationCost = houseArea * 350;
    const totalBuildCost = baseBuildCost + plotCost + foundationCost;

    // Mortgage calculations
    const principal = loanAmount - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;
    const ltvRatio = ((loanAmount - downPayment) / loanAmount * 100).toFixed(1);

    const formatPrice = (num: number) => {
        return Math.round(num).toLocaleString('pl-PL');
    };

    return (
        <div style={{ background: '#f8faf9', minHeight: '100vh', paddingTop: '100px' }}>
            {/* Hero Section */}
            <section style={{ textAlign: 'center', padding: '2rem 0 3rem' }}>
                <div className="container">
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <Calculator size={20} style={{ color: '#10b981' }} />
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                        fontWeight: '800',
                        color: '#1f2937',
                        marginBottom: '1rem'
                    }}>
                        Kalkulatory - Kredyt i Budowa
                    </h1>
                    <p style={{ color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
                        Oblicz koszty budowy domu oraz miesięczną ratę kredytu hipotecznego. Firma wyręczy Twojego projektanta w Tłuszczu.
                    </p>
                </div>
            </section>

            {/* Info Banner */}
            <section style={{ padding: '0 0 3rem' }}>
                <div className="container">
                    <div style={{
                        background: '#1e3a5f',
                        borderRadius: '1rem',
                        padding: '2rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
                                Kredyt hipoteczny na budowę domu - kompleksowy poradnik
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Wszystko, co musisz wiedzieć o finansowaniu budowy domu w Tłuszczu.
                            </p>
                        </div>
                        <div>
                            <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                                Finansowanie budowy - krok po kroku
                            </h3>
                            <ul style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                                <li>Oblicz koszt budowy - użyj naszego kalkulatora</li>
                                <li>Przygotuj wkład własny - min. 10-20% wartości</li>
                                <li>Wybierz ratę kredytu - sprawdź różne okresy</li>
                                <li>Skonsultuj się z bankiem - pomożemy Ci z formalnościami</li>
                                <li>Zacznij budować - po otrzymaniu transz kredytu</li>
                            </ul>
                        </div>
                        <div style={{
                            borderRadius: '0.75rem',
                            overflow: 'hidden',
                            height: '180px'
                        }}>
                            <img
                                src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2670"
                                alt="Dom w budowie"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Building Cost Calculator */}
            <section style={{ padding: '3rem 0', background: 'white' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '2rem'
                    }}>
                        Kalkulator Kosztów Budowy
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '2rem'
                    }}>
                        {/* Left - Inputs */}
                        <div style={{
                            background: '#f8faf9',
                            padding: '2rem',
                            borderRadius: '1rem'
                        }}>
                            <h3 style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '1.5rem'
                            }}>
                                <Home size={20} style={{ color: '#10b981' }} />
                                Parametry budowy
                            </h3>

                            {/* House Area Slider */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ color: '#4b5563', fontSize: '0.875rem' }}>Metraż domu</label>
                                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{houseArea} m²</span>
                                </div>
                                <input
                                    type="range"
                                    min="60"
                                    max="300"
                                    value={houseArea}
                                    onChange={(e) => setHouseArea(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                            </div>

                            {/* Plot Area Slider */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ color: '#4b5563', fontSize: '0.875rem' }}>Działka (m²)</label>
                                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{plotArea} m²</span>
                                </div>
                                <input
                                    type="range"
                                    min="200"
                                    max="2000"
                                    step="50"
                                    value={plotArea}
                                    onChange={(e) => setPlotArea(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                            </div>

                            {/* Finish Level Select */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#4b5563', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                                    Stan wykończenia
                                </label>
                                <select
                                    value={finishLevel}
                                    onChange={(e) => setFinishLevel(e.target.value as any)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        background: 'white',
                                        fontSize: '0.95rem',
                                        color: '#1f2937'
                                    }}
                                >
                                    <option value="shell">Stan surowy zamknięty</option>
                                    <option value="developer">Deweloperski (+ instalacje)</option>
                                    <option value="turnkey">Pod klucz</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </div>

                            {/* Floors Select */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ color: '#4b5563', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                                    Liczba pięter
                                </label>
                                <select
                                    value={floors}
                                    onChange={(e) => setFloors(Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        background: 'white',
                                        fontSize: '0.95rem',
                                        color: '#1f2937'
                                    }}
                                >
                                    <option value={1}>Parterowy</option>
                                    <option value={2}>Piętrowy (2 kondygnacje)</option>
                                </select>
                            </div>
                        </div>

                        {/* Right - Results */}
                        <div>
                            {/* Total Cost Card */}
                            <div style={{
                                background: '#1e3a5f',
                                color: 'white',
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                                    Całkowity koszt budowy
                                </p>
                                <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                                    {formatPrice(totalBuildCost)} zł
                                </p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                    {formatPrice(totalBuildCost / houseArea)} zł/m²
                                </p>
                            </div>

                            {/* Breakdown */}
                            <div style={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                padding: '1.5rem',
                                borderRadius: '1rem'
                            }}>
                                <h4 style={{
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    marginBottom: '1rem'
                                }}>
                                    Szczegółowy rozkład kosztów
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Budowa ({houseArea} m² × {formatPrice(COST_RATES[finishLevel])} zł)</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{formatPrice(baseBuildCost)} zł</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Działka ({plotArea} m²)</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{formatPrice(plotCost)} zł</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Fundamenty</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{formatPrice(foundationCost)} zł</span>
                                    </div>
                                    <div style={{
                                        borderTop: '1px solid #e5e7eb',
                                        paddingTop: '0.75rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginTop: '0.5rem'
                                    }}>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>Razem</span>
                                        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '1.125rem' }}>{formatPrice(totalBuildCost)} zł</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div style={{
                                background: '#fef3c7',
                                border: '1px solid #fcd34d',
                                borderRadius: '0.75rem',
                                padding: '1rem',
                                marginTop: '1rem',
                                display: 'flex',
                                gap: '0.75rem'
                            }}>
                                <AlertCircle size={20} style={{ color: '#b45309', flexShrink: 0 }} />
                                <div style={{ fontSize: '0.8rem', color: '#92400e' }}>
                                    <strong>Pamiętaj:</strong> Kalkulacja ma charakter poglądowy. Rzeczywiste koszty mogą się różnić w zależności od lokalizacji, materiałów i wykonawcy.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mortgage Calculator */}
            <section style={{ padding: '3rem 0', background: '#f8faf9' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '2rem'
                    }}>
                        Kalkulator Kredytu Hipotecznego
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '2rem'
                    }}>
                        {/* Left - Inputs */}
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '1rem',
                            border: '1px solid #e5e7eb'
                        }}>
                            <h3 style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '1.5rem'
                            }}>
                                <CreditCard size={20} style={{ color: '#10b981' }} />
                                Dane kredytu
                            </h3>

                            {/* Loan Amount */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ color: '#4b5563', fontSize: '0.875rem' }}>Kwota kredytu</label>
                                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{formatPrice(loanAmount)} zł</span>
                                </div>
                                <input
                                    type="range"
                                    min="100000"
                                    max="2000000"
                                    step="10000"
                                    value={loanAmount}
                                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                            </div>

                            {/* Down Payment */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ color: '#4b5563', fontSize: '0.875rem' }}>Wkład własny</label>
                                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{formatPrice(downPayment)} zł</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={loanAmount * 0.5}
                                    step="5000"
                                    value={downPayment}
                                    onChange={(e) => setDownPayment(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                            </div>

                            {/* Interest Rate */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ color: '#4b5563', fontSize: '0.875rem' }}>Oprocentowanie (%)</label>
                                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{interestRate.toFixed(2)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max="12"
                                    step="0.1"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                            </div>

                            {/* Loan Term */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ color: '#4b5563', fontSize: '0.875rem' }}>Okres kredytowania</label>
                                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{loanTerm} lat</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="35"
                                    value={loanTerm}
                                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#10b981' }}
                                />
                            </div>
                        </div>

                        {/* Right - Results */}
                        <div>
                            {/* Monthly Payment Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                                    Miesięczna rata
                                </p>
                                <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                                    {formatPrice(monthlyPayment)} zł
                                </p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
                                    Raty równe (annuitet) przy założonym oprocentowaniu stałym
                                </p>
                            </div>

                            {/* Details */}
                            <div style={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                padding: '1.5rem',
                                borderRadius: '1rem'
                            }}>
                                <h4 style={{
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    marginBottom: '1rem'
                                }}>
                                    Szczegóły kredytu
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Kwota kredytu</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{formatPrice(principal)} zł</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Całkowity koszt odsetek</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{formatPrice(totalInterest)} zł</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Całkowity koszt kredytu</span>
                                        <span style={{ color: '#ef4444', fontWeight: '600' }}>{formatPrice(totalPayment)} zł</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>LTV</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{ltvRatio}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Liczba rat</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{numberOfPayments} mies.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div style={{
                                background: '#e0f2fe',
                                border: '1px solid #7dd3fc',
                                borderRadius: '0.75rem',
                                padding: '1rem',
                                marginTop: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <Info size={20} style={{ color: '#0284c7', flexShrink: 0 }} />
                                    <div style={{ fontSize: '0.8rem', color: '#0369a1' }}>
                                        <strong>Ważne informacje:</strong>
                                        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem' }}>
                                            <li>Obliczenia mają charakter orientacyjny</li>
                                            <li>Rzeczywista oferta zależy od banku</li>
                                            <li>Nie uwzględnia dodatkowych kosztów</li>
                                            <li>Sprawdź zdolność kredytową w banku</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button className="btn-primary" style={{
                                width: '100%',
                                marginTop: '1rem',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            }}>
                                Skontaktuj się z nami
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* How to get mortgage section */}
            <section style={{ padding: '4rem 0', background: 'white' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '3rem'
                    }}>
                        Jak uzyskać kredyt hipoteczny?
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '2rem'
                    }}>
                        {BUILDING_STEPS.map((step) => (
                            <div key={step.step} style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: '#10b981',
                                    color: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    margin: '0 auto 1rem'
                                }}>
                                    {step.step}
                                </div>
                                <h3 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    marginBottom: '0.5rem'
                                }}>
                                    {step.title}
                                </h3>
                                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
