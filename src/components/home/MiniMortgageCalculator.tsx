import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Calculator, ArrowRight } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

export function MiniMortgageCalculator() {
    const navigate = useNavigate();
    const [price, setPrice] = useState(600000);
    const [downPayment, setDownPayment] = useState(120000);
    const [interestRate, setInterestRate] = useState(7.2);
    const [term, setTerm] = useState(25);

    const principal = Math.max(0, price - downPayment);
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = term * 12;

    let monthlyPayment = 0;
    if (principal > 0 && monthlyRate > 0 && totalPayments > 0) {
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }

    const formatPrice = (val: number) => {
        return Math.round(val).toLocaleString('pl-PL') + ' zł';
    };

    const handlePriceChange = (val: number) => {
        setPrice(val);
        // Adjust down payment to maintain a sensible limit (max 90% of price)
        if (downPayment > val * 0.9) {
            setDownPayment(Math.round(val * 0.2));
        }
    };

    const handleConsultation = () => {
        trackEvent('mini_calculator_consult', {
            price,
            down_payment: downPayment,
            term,
            interest_rate: interestRate,
            calculated_payment: Math.round(monthlyPayment)
        });
        navigate('/kalkulatory');
    };

    return (
        <section className="home-section mini-calc-section">
            <div className="home-section-bg" />
            <div className="container">
                <div className="home-section-header">
                    <span className="section-label">Finansowanie</span>
                    <h2>Planujesz <span className="text-gradient">zakup na kredyt</span>?</h2>
                    <p className="home-section-desc">
                        Sprawdź szybko szacowaną ratę miesięczną. Dopasuj parametry i przekonaj się, na jaki dom możesz sobie pozwolić.
                    </p>
                </div>

                <div className="mini-calc-container glass-panel">
                    <div className="mini-calc-grid">
                        {/* Sliders Area */}
                        <div className="mini-calc-inputs">
                            <h3 className="mini-calc-subtitle">
                                <Calculator size={20} className="text-primary" />
                                Ustawienia kalkulatora
                            </h3>

                            {/* Property Price */}
                            <div className="calc-slider-group">
                                <div className="calc-slider-header">
                                    <label>Cena nieruchomości</label>
                                    <span className="calc-val-badge">{formatPrice(price)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="150000"
                                    max="2000000"
                                    step="10000"
                                    value={price}
                                    onChange={(e) => handlePriceChange(Number(e.target.value))}
                                    className="calc-range-slider"
                                />
                                <div className="calc-slider-labels">
                                    <span>150 tys. zł</span>
                                    <span>2 mln zł</span>
                                </div>
                            </div>

                            {/* Down Payment */}
                            <div className="calc-slider-group">
                                <div className="calc-slider-header">
                                    <label>Wkład własny (min. 10%)</label>
                                    <span className="calc-val-badge">{formatPrice(downPayment)} ({Math.round((downPayment / price) * 100)}%)</span>
                                </div>
                                <input
                                    type="range"
                                    min={Math.round(price * 0.1)}
                                    max={Math.round(price * 0.8)}
                                    step="5000"
                                    value={downPayment}
                                    onChange={(e) => setDownPayment(Number(e.target.value))}
                                    className="calc-range-slider"
                                />
                                <div className="calc-slider-labels">
                                    <span>{formatPrice(price * 0.1)}</span>
                                    <span>{formatPrice(price * 0.8)}</span>
                                </div>
                            </div>

                            {/* Two Column details: Rate & Term */}
                            <div className="calc-twin-inputs">
                                <div className="calc-slider-group">
                                    <div className="calc-slider-header">
                                        <label>Oprocentowanie</label>
                                        <span className="calc-val-text">{interestRate}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="4.0"
                                        max="11.0"
                                        step="0.1"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="calc-range-slider"
                                    />
                                </div>

                                <div className="calc-slider-group">
                                    <div className="calc-slider-header">
                                        <label>Okres spłaty</label>
                                        <span className="calc-val-text">{term} lat</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="35"
                                        step="1"
                                        value={term}
                                        onChange={(e) => setTerm(Number(e.target.value))}
                                        className="calc-range-slider"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Result Area */}
                        <div className="mini-calc-results">
                            <div className="result-card-glow">
                                <div className="result-label">Szacowana rata miesięczna</div>
                                <div className="result-value-big">
                                    {Math.round(monthlyPayment).toLocaleString('pl-PL')} <span className="result-currency">zł / mies.</span>
                                </div>
                                <div className="result-divider" />

                                <div className="result-details">
                                    <div className="detail-row">
                                        <span>Kwota kredytu:</span>
                                        <strong>{formatPrice(principal)}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Wskaźnik LTV:</span>
                                        <strong>{((principal / price) * 100).toFixed(1)}%</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="calc-info-alert">
                                <Info size={16} className="info-icon" />
                                <p>Rata obliczona przy stałym oprocentowaniu. Rzeczywiste warunki zależą od oceny zdolności kredytowej przez bank.</p>
                            </div>

                            <button onClick={handleConsultation} className="btn-primary calc-action-btn">
                                Oblicz pełne koszty i sprawdź banki
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
