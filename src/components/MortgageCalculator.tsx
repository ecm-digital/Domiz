import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Info } from 'lucide-react';

interface MortgageCalculatorProps {
    initialPrice?: number;
}

export function MortgageCalculator({ initialPrice }: MortgageCalculatorProps) {
    const navigate = useNavigate();
    const [loanAmount, setLoanAmount] = useState(initialPrice || 500000);
    const [downPayment, setDownPayment] = useState(initialPrice ? initialPrice * 0.2 : 100000); // Default 20% down payment
    const [interestRate, setInterestRate] = useState(7.5);
    const [loanTerm, setLoanTerm] = useState(25);

    useEffect(() => {
        if (initialPrice) {
            setLoanAmount(initialPrice);
            setDownPayment(initialPrice * 0.2);
        }
    }, [initialPrice]);

    const principal = loanAmount - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Check for division by zero or invalid inputs
    let monthlyPayment = 0;
    if (principal > 0 && monthlyRate > 0 && numberOfPayments > 0) {
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;
    const ltvRatio = loanAmount > 0 ? ((loanAmount - downPayment) / loanAmount * 100).toFixed(1) : "0.0";

    const formatPrice = (num: number) => {
        return Math.round(num).toLocaleString('pl-PL');
    };

    return (
        <section style={{ padding: '3rem 0', background: 'var(--color-bg-light)' }}>
            <div className="container">
                <h2 style={{
                    textAlign: 'center',
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
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
                    <div className="glass-panel" style={{
                        padding: '2rem',
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
                                <label style={{ color: '#4b5563', fontSize: '0.875rem' }}>Cena nieruchomości</label>
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
                                max={loanAmount * 0.9} // Max 90% down payment
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
                            marginBottom: '1rem',
                            boxShadow: 'var(--shadow-md)'
                        }}>
                            <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                                Miesięczna rata
                            </p>
                            <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                                {formatPrice(monthlyPayment)} zł
                            </p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
                                Raty równe (annuitet)
                            </p>
                        </div>

                        {/* Details */}
                        <div className="glass-panel" style={{
                            padding: '1.5rem',
                            marginBottom: '1rem'
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
                                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>LTV (Loan to Value)</span>
                                    <span style={{ color: '#1f2937', fontWeight: '600' }}>{ltvRatio}%</span>
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
                                        <li>Nie uwzględnia dodatkowych kosztów okołokredytowych</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-primary"
                            style={{
                                width: '100%',
                                marginTop: '1rem',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                display: 'flex'
                            }}
                            onClick={() => navigate('/osiedle-tluszcz#kontakt')}
                        >
                            Zapytaj o finansowanie
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
