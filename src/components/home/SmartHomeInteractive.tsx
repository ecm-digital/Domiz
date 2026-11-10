import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Lightbulb, Thermometer, Shield, ShieldAlert, Music, Play, Pause,
    Plus, Minus, Power, Smartphone, Sparkles, ArrowRight
} from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

export function SmartHomeInteractive() {
    const navigate = useNavigate();
    const [lights, setLights] = useState(true);
    const [lightColor, setLightColor] = useState('warm'); // warm, cool, neon
    const [temp, setTemp] = useState(21.5);
    const [alarmArmed, setAlarmArmed] = useState(true);
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [currentSong] = useState('Lofi Chill Beats');

    const handleTempChange = (change: number) => {
        const nextTemp = Math.min(30, Math.max(16, parseFloat((temp + change).toFixed(1))));
        setTemp(nextTemp);
        trackEvent('smarthome_temp_change', { new_temp: nextTemp });
    };

    const toggleAlarm = () => {
        const nextState = !alarmArmed;
        setAlarmArmed(nextState);
        trackEvent('smarthome_alarm_toggle', { armed: nextState });
    };

    const toggleMusic = () => {
        const nextState = !musicPlaying;
        setMusicPlaying(nextState);
        trackEvent('smarthome_music_toggle', { playing: nextState });
    };

    return (
        <section className="home-section smarthome-section">
            <div className="home-section-bg" />
            <div className="container">
                <div className="home-section-header">
                    <span className="section-label">Nowoczesność</span>
                    <h2>Domy, które <span className="text-gradient">reagują na Ciebie</span></h2>
                    <p className="home-section-desc">
                        Nowoczesne nieruchomości na Śląsku i w powiecie wołomińskim coraz częściej korzystają z automatyki domowej. Przetestuj sterowanie ogrzewaniem, oświetleniem i alarmem z poziomu telefonu.
                    </p>
                </div>

                <div className="smarthome-interactive-container">
                    {/* Simulated Wall Panel Controls */}
                    <div className="smarthome-panel glass-panel">
                        <div className="smarthome-panel-header">
                            <div className="panel-title">
                                <Smartphone size={18} className="text-primary" />
                                <span>Domiz Smart Dashboard</span>
                            </div>
                            <div className="panel-status">
                                <span className={`status-dot ${alarmArmed ? 'armed' : 'disarmed'}`} />
                                <span className="status-text">{alarmArmed ? 'System zabezpieczony' : 'Rozbrojony'}</span>
                            </div>
                        </div>

                        <div className="panel-controls">
                            {/* Lighting Group */}
                            <div className="control-card">
                                <div className="control-card-header">
                                    <div className="control-icon-wrapper text-yellow">
                                        <Lightbulb size={20} />
                                    </div>
                                    <span className="control-label">Oświetlenie</span>
                                    <button
                                        onClick={() => setLights(!lights)}
                                        className={`panel-switch ${lights ? 'active' : ''}`}
                                    >
                                        <Power size={14} />
                                    </button>
                                </div>
                                {lights && (
                                    <div className="control-suboptions animate-fade-in">
                                        <button
                                            onClick={() => setLightColor('warm')}
                                            className={`color-btn warm ${lightColor === 'warm' ? 'active' : ''}`}
                                        >
                                            Ciepłe
                                        </button>
                                        <button
                                            onClick={() => setLightColor('cool')}
                                            className={`color-btn cool ${lightColor === 'cool' ? 'active' : ''}`}
                                        >
                                            Zimne
                                        </button>
                                        <button
                                            onClick={() => setLightColor('neon')}
                                            className={`color-btn neon ${lightColor === 'neon' ? 'active' : ''}`}
                                        >
                                            Relaks
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Climate Group */}
                            <div className="control-card">
                                <div className="control-card-header">
                                    <div className="control-icon-wrapper text-red">
                                        <Thermometer size={20} />
                                    </div>
                                    <span className="control-label">Klimatyzacja</span>
                                    <div className="temp-controls">
                                        <button onClick={() => handleTempChange(-0.5)} className="temp-btn">
                                            <Minus size={14} />
                                        </button>
                                        <span className="temp-display-val">{temp.toFixed(1)}°C</span>
                                        <button onClick={() => handleTempChange(0.5)} className="temp-btn">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Security Group */}
                            <div className="control-card">
                                <div className="control-card-header">
                                    <div className={`control-icon-wrapper ${alarmArmed ? 'text-green' : 'text-red-alert'}`}>
                                        {alarmArmed ? <Shield size={20} /> : <ShieldAlert size={20} />}
                                    </div>
                                    <span className="control-label">Alarm & Zamki</span>
                                    <button
                                        onClick={toggleAlarm}
                                        className={`btn-panel-action ${alarmArmed ? 'armed' : 'disarmed'}`}
                                    >
                                        {alarmArmed ? 'Uzbrój' : 'Rozbrój'}
                                    </button>
                                </div>
                            </div>

                            {/* Music Group */}
                            <div className="control-card">
                                <div className="control-card-header">
                                    <div className="control-icon-wrapper text-purple">
                                        <Music size={20} />
                                    </div>
                                    <div className="music-label-wrap">
                                        <span className="control-label">Multiroom Audio</span>
                                        <span className="music-now-playing">{musicPlaying ? currentSong : 'Muzyka wstrzymana'}</span>
                                    </div>
                                    <button
                                        onClick={toggleMusic}
                                        className={`panel-switch-play ${musicPlaying ? 'playing' : ''}`}
                                    >
                                        {musicPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Blueprint Mockup */}
                    <div className="smarthome-blueprint-wrapper glass-panel">
                        <div className="blueprint-visual">
                            {/* Blueprint background grid */}
                            <div className="blueprint-grid-lines" />

                            {/* Rooms layout */}
                            <div className={`room salon ${lights ? `lights-${lightColor}` : 'lights-off'}`}>
                                <span className="room-label">Salon</span>
                                {musicPlaying && (
                                    <div className="equalizer-waves">
                                        <div className="eq-bar" />
                                        <div className="eq-bar" />
                                        <div className="eq-bar" />
                                        <div className="eq-bar" />
                                    </div>
                                )}
                            </div>

                            <div className={`room kuchnia ${lights ? `lights-${lightColor}` : 'lights-off'}`}>
                                <span className="room-label">Kuchnia</span>
                            </div>

                            <div className={`room sypialnia ${lights ? `lights-${lightColor}` : 'lights-off'}`}>
                                <span className="room-label">Sypialnia</span>
                                <span className="room-temp">{temp.toFixed(1)}°C</span>
                            </div>

                            <div className={`room przedpokoj ${lights ? `lights-${lightColor}` : 'lights-off'}`}>
                                <span className="room-label">Wiatrołap</span>
                                {alarmArmed && (
                                    <div className="armed-lock-indicator">
                                        <Shield size={12} />
                                        <span>Zaryglowane</span>
                                    </div>
                                )}
                            </div>

                            {/* Visual effect overlays */}
                            {alarmArmed && <div className="blueprint-secure-border" />}
                        </div>

                        <div className="blueprint-legend">
                            <div className="legend-item">
                                <Sparkles size={14} className="text-primary" />
                                <span>Ciepło i bezpieczeństwo w standardzie</span>
                            </div>
                            <button onClick={() => navigate('/smart-home')} className="home-link-btn">
                                Przeczytaj o Smart Home <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
