import { extractElementStyles } from "./extractor.js";

let isArmed = false;
let currentFormat = 'TAILWIND';
let hoveredElement = null;

// mount an isolated shadow DOM host so page CSS never affects the HUD.
const host = document.createElement('div');
host.id = 'divburglar-hud-host';
host.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
document.documentElement.appendChild(host);

const shadow = host.attachShadow({ mode: 'open' });

//build hud w/inline css to bypass strict CSPs
const reticle = document.createElement('div');
reticle.style.cssText = `
    position: fixed;
    border: 1px solid #ffffff;
    background-color: rgba(255, 255, 255, 0.04);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.12), inset 0 0 8px rgba(255, 255, 255, 0.05);
    pointer-events: none;
    transition: top 0.05s ease-out, left 0.05s ease-out, width 0.05s ease-out, height 0.05s ease-out;
    display: none;
    z-index: 2147483647;
`;

const hudCard = document.createElement('div');
hudCard.style.cssText = `
    position: fixed;
    background-color: #000000;
    border: 1px solid #2a2a2a;
    color: #999999;
    font-family: 'Roboto', system-ui, -apple-system, sans-serif;
    padding: 8px 12px;
    min-width: 220px;
    pointer-events: none;
    display: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.85);
    z-index: 2147483647;

`;

hudCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 14px; border-bottom: 1px solid #2a2a2a; padding-bottom: 4px; margin-bottom: 5px;">
        <span id="db-tag-readout" style="color: #ffffff; font-weight: 400; font-size: 12px; letter-spacing: 1.5px;">DIV</span>
        <span id="db-dims-readout" style="color: #999999; font-size: 11px; letter-spacing: 1px; font-family: monospace;">0 × 0</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 10px; color: #666666; letter-spacing: 1.8px; text-transform: uppercase;">
        <span id="db-layout-readout">DISPLAY // BLOCK</span>
        <span id="db-mode-readout" style="color: #ffffff;">TAILWIND</span>
    </div>
`;

//post capture modal
const modalOverlay = document.createElement('div');
modalOverlay.style.cssText = `
position: fixed; top: 0; width: 100vw; height: 100vh;
background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(3px);
display: none; justify-content: center; align-items: center; z-index: 2147483647; pointer-events: auto;
`;

modalOverlay.innerHTML = `
    <div style="background: #000000; border: 1px solid #2a2a2a; width: 600px; max-width: 90vw; padding: 24px; box-shadow: 0 24px 48px rgba(0,0,0,0.9); display: flex; flex-direction: column; gap: 16px; font-family: 'Roboto', sans-serif;">

        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #2a2a2a; padding-bottom: 10px;>
            <span style="color: #ffffff; font-size: 14px; letter-spacing: 3px; font-weight: 300;">SUCCESSFUL HEIST</span>
            <span id="db-modal-close" style="color: #666666; font-size: 11px; cursor: pointer; letter-spacing: 2px; transition: color 0.2s;">[ ESC TO CLOSE ]</span>
        </div>
    
        <div style="display: flex; gap: 8px;" id="db-modal-tabs">
        <span style="color: #ffffff; border: 1px solid #ffffff; padding: 6px 14px; font-size: 10px; letter-spacing: 2px;">TAILWIND</span>
        <span style="color: #666666; border: 1px solid #2a2a2a; padding: 6px 14px; font-size: 10px; letter-spacing: 2px;">REACT JSX</span>
        <span style="color: #666666; border: 1px solid #2a2a2a; padding: 6px 14px; font-size: 10px; letter-spacing: 2px;">RAW CSS</span>
        </div>

        <textarea id="db-modal-code" readonly style="width: 100%; height: 280px; background: #050505; border: 1px solid #1a1a1a; color: #999999; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; padding: 16px; resize: none; outline: none;"></textarea>

        <button id="db-modal-copy" style="background: transparent; border: 1px solid #ffffff; color: #ffffff; padding: 14px; font-size: 12px; letter-spacing: 4px; cursor: pointer; transition: all 0.2s ease;">
        [ COPY TO CLIPBOARD ]
        </button>
    </div>
`

shadow.appendChild(reticle);
shadow.appendChild(hudCard);
shadow.appendChild(modalOverlay);

const tagReadout = shadow.getElementById('db-tag-readout');
const dimsReadout = shadow.getElementById('db-dims-readout');
const layoutReadout = shadow.getElementById('db-layout-readout');
const modeReadout = shadow.getElementById('db-mode-readout');

const modalClose = shadow.getElementById('db-modal-close');
const modalCode = shadow.getElementById('db-modal-code');
const modalCopy = shadow.getElementById('db-modal-copy');

//modal logic
modalClose.addEventListener('click', () => { modalOverlay.style.display = 'none'; });
modalClose.addEventListener('mouseenter', () => { modalClose.style.color = '#ffffff'; });
modalClose.addEventListener('mouseleave', () => { modalClose.style.color = '#666666'; });

modalCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(modalCode.value);
    modalCopy.textContent = '[ COPIED TO CLIPBOARD! ]';
    modalCopy.style.backgroundColor = '#ffffff';
    modalCopy.style.color = '#000000';

    setTimeout(() => {
        modalCopy.textContent = '[ COPY TO CLIPBOARD ]';
        modalCopy.style.backgroundColor = 'transparent';
        modalCopy.style.color = '#ffffff';
    }, 1500);
});

//helper to format element tag + primary class for the hud header
function formatElementLabel(el) {
    const tag = el.tagName.toLowerCase();
    if (el.id) return `${tag}#${el.id.slice(0, 16)}`;
    if (typeof el.className === 'string' && el.className.trim()) {
        const firstClass = el.className.trim().split(/\s+/)[0];
        return `${tag}.${firstClass.slice(0, 18)}`;
    }
    return tag;
}

//update HUD coordinates & telemetry on mouse move
function updateHighlight(el) {
    if (!el || el === document.documentElement || el === document.body) {
        reticle.style.display = 'none';
        hudCard.style.display = 'none';
        return;
    }

    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);

    reticle.style.display = 'block';
    reticle.style.top = `${rect.top}px`;
    reticle.style.left = `${rect.left}px`;
    reticle.style.width = `${rect.width}px`;
    reticle.style.height = `${rect.height}px`;

    //update telemetry text
    tagReadout.textContent = formatElementLabel(el);
    dimsReadout.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
    layoutReadout.textContent = `DISPLAY // ${computed.display.toUpperCase()}`;
    modeReadout.textContent = currentFormat;

    //position hud card above element (or flip below if near top of viewport)
    hudCard.style.display = 'block';
    const cardHeight = 54;
    const topPos = rect.top > cardHeight + 12 ? rect.top - cardHeight - 8 : rect.bottom + 8;
    const leftPos = Math.min(Math.max(8, rect.left), window.innerWidth - 240);

    hudCard.style.top = `${topPos}px`;
    hudCard.style.left = `${leftPos}`;
}

function handleMouseMove(event) {
    if (!isArmed) return;
    hoveredElement = event.target;
    updateHighlight(hoveredElement);
}

function handleScroll() {
    if (!isArmed || !hoveredElement) return;
    updateHighlight(hoveredElement);
}

function handleClick(event) {
    if (!isArmed) return;
    event.preventDefault();
    event.stopPropagation();

    const target = event.target;

    const rawStyles = extractElementStyles(target);

    reticle.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
    reticle.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.6)';
    modeReadout.textContent = 'EXTRACTED // PARSING';
    //temporary until tailwind mapper is built
    modalCode.value = JSON.stringify(rawStyles, null, 2);

    setTimeout(() => {
        reticle.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
        reticle.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.12), inset 0 0 8px rgba(255, 255, 255, 0.05)';
        modalOverlay.style.display = 'flex';
        setScannerState(false);
    }, 350);
}

function handleKeyDown(event) {
    if (isArmed && event.key === 'Escape') {
        setScannerState(false);
    }
}

function setScannerState(armed) {
    isArmed = armed;
    if (isArmed) {
        document.addEventListener('mousemove', handleMouseMove, true);
        window.addEventListener('scroll', handleScroll, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyDown, true);
        document.body.style.cursor = 'crosshair';
    } else {
        document.removeEventListener('mousemove', handleMouseMove, true);
        window.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('keydown', handleKeyDown, true);
        document.body.style.cursor = '';
        reticle.style.display = 'none';
        hudCard.style.display = 'none';
        hoveredElement = null;
    }
}

//global escape listener to close modal even when disarmed
document.addEventListener('keydown', handleKeyDown);

//listen for popup.jsx
window.chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_STATUS') {
        sendResponse({ isArmed, format: currentFormat });
    } else if (message.type === 'TOGGLE_SCANNER') {
        currentFormat = message.format || currentFormat;
        setScannerState(Boolean(message.isArmed));
        sendResponse({ ok: true, isArmed });
    } else if (message.type === 'SET_FORMAT') {
        currentFormat = message.format;
        modeReadout.textContent = currentFormat;
        sendResponse({ ok: true });
    }
    return true;
});