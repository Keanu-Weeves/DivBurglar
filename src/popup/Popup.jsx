import { useState } from 'react';
import './popup.css';

export default function Popup() {
    const [isArmed, setIsArmed] = useState(false);
    const [format, setFormat] = useState('TAILWIND');

    return (
        <div className="hud-container">
            {/*Top HUD Header */}
            <header className="hud-header">
                <div>
                    <h1 className="brand-title">DivBurglar</h1>
                    <p className="brand-subtitle">DOM Extraction Telemetry</p>
                </div>
                <div className="status-readout">
                    <div className={`status-indicator ${isArmed ? 'armed' : ''}`}>
                        <span className="status-dot" />
                        {isArmed ? 'ARMED' : 'STANDBY'}
                    </div>
                    <div className="sys-version">SYS.V1.0</div>
                </div>
            </header>
            {/* Target Acquisition */}
            <section className="hud-module">
                <div className="module-header">
                    <span>Target Acquisition</span>
                    <span>MODE // SINGLE</span>
                </div>
                <button
                    className={`snatcher-btn ${isArmed ? 'armed' : ''}`}
                    onClick={() => setIsArmed(!isArmed)}
                >
                    {isArmed ? 'Disarm Scanner' : 'Engage DOM Scanner'}
                </button>
            </section>

            {/* Output Compiler */}
            <section className="hud-module">
                <div className="module-header">
                    <span>Output Compiler</span>
                    <span>{format}</span>
                </div>
                <div className="format-grid">
                  {['TAILWIND', 'REACT JSX', 'RAW CSS'].map((item) => (
                    <button
                        key={item}
                        className={`format-btn ${format === item ? 'active' : ''}`}
                        onClick={() => setFormat(item)}
                    >
                    {item}
                    </button>
                  ))}
                </div>
            </section>

            {/* Subsystem Telemetry (Free vs Pro) */}
            <section className="hud-module">
                <div className="module-header">
                    <span>Subsystems</span>
                    <span>TIER // FREE</span>
                </div>
                <div className="telemetry-list">
                    <div className="telemetry-row">
                        <span className="telemetry-label">Computed Style Engine</span>
                        <span className="telemetry-value">ONLINE</span>
                    </div>
                    <div className="telemetry-row">
                        <span className="telemetry-label">Ghost Container Trace</span>
                        <span className="telemetry-value">ONLINE</span>
                    </div>
                    <div className="telemetry-row locked">
                        <span className="telemetry-label">Multi-State (:hover / dark)</span>
                        <span className="telemetry-value">PRO // LOCKED</span>
                    </div>
                    <div className="telemetry-row locked">
                        <span className="telemetry-label">Framer Motion Physics</span>
                        <span className="telemetry-value">PRO // LOCKED</span>
                    </div>
                    <div className="telemetry-row locked">
                        <span className="telemetry-label">Full-Page TreeWalker</span>
                        <span className="telemetry-value">PRO // LOCKED</span>
                    </div>
                </div>
            </section>

            {/* Footer Pro Unlock */}
            <button className="pro-upgrade-btn">
                [ Unlock Pro Telemetry — $49 Lifetime ]
            </button>
        </div>
    );
}