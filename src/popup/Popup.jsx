import './popup.css';

export default function Popup() {
    return (
        <div className="popup-container">
            <header className="popup-header">
                <h1>DivBurglar</h1>
                <span className="badge">v1.0</span>
            </header>
            <p className='subtitle'>Ready to snatch some DOM nodes.</p>
            <button className='primary-btn'>
                Activate Snatcher
            </button>
        </div>
    );
}