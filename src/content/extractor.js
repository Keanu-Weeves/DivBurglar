/**
 * Resolves true painted background color by climbing dom tree
 * 
 */

export function resolveEffectiveBackground(el) {
    let current = el;
    while (current && current !== document.documentElement) {
        const bg = window.getComputedStyle(current).backgroundColor;
        //check if background is set and not transparent
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return bg;
        }
        current = current.parentElement;
    }
    return 'rgb(255, 255, 255)';
}

/**
 * creates a virgin element in a hidden iframe to get browser defaults
 * uses caching to only generate an iframe once per tag type, if deep DOM trees exist it wont crash with loads of iframes
 */

const defaultStylesCache = {};

function getDefaultStyles(tagName) {

    if (defaultStylesCache[tagName]) return defaultStylesCache[tagName];

    let defaultStyles = {};
    let dummy;

    const svgTags = ['svg', 'path', 'circle', 'rect', 'line', 'polygon', 'g'];
    const isSvg = svgTags.includes(tagName);

    try {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position: absolute; width: 0; height: 0; border: 0; visibility: hidden; pointer-events: none;';
        document.body.appendChild(iframe);

        dummy = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', tagName) : document.createElement(tagName);
        iframe.contentDocument.body.appendChild(dummy);

        const computed = iframe.contentWindow.getComputedStyle(dummy);
        if (computed) {
            for (let i = 0; i < computed.length; i++) {
                const prop = computed[i];
                defaultStyles[prop] = computed .getPropertyValue(prop);
            }
        }
        document.body.removeChild(iframe);
    } catch (e) {
        console.warn(`[DivBurglar] Iframe blocked by CSP. Using local DOM fallback for <${tagName}>`, "Error: ", e);
        dummy = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', tagName) : document.createElement(tagName);
        dummy.style.cssText = 'position: absolute; width: 0; height: 0; visibility: hidden; pointer-events: none;';
        document.body.appendChild(dummy);

        const computed = window.getComputedStyle(dummy);
        if (computed) {
            for (let i = 0; i < computed.length; i++) {
                const prop = computed[i];
                defaultStyles[prop] = computed.getPropertyValue(prop);
            }
        }
        document.body.removeChild(dummy);
    }

    defaultStylesCache[tagName] = defaultStyles;
    return defaultStyles;
}

// recursively extract custome styles and text for an element and its children
export function extractElementStyles(el, depth = 0) {
    //prevent infinite recursions and max call stack crashes
    if (depth > 25) return null;

    const tagName = el.tagName ? el.tagName.toLowerCase() : '';
    if (!tagName) return null;

    const ignoredTags = ['script', 'style', 'noscript', 'meta', 'head', 'link', 'title'];
    if (ignoredTags.includes(tagName)) return null;


    const computed = window.getComputedStyle(el);
    if (!computed) return null; //in case nodes are detached

    const defaultStyles = getDefaultStyles(tagName);

    const nodeData = {
        type: 'element',
        tag: tagName,
        css: {},
        children: []
    };

    const uselessColors = [
        'caret-color', 'column-rule-color', 'text-decoration-color', 'text-emphasis-color', 'outline-color',
        'color-scheme', 'text-size-adjust'
    ];

    const logicalProps = ['-block-', '-inline-', '-start-', '-ends-'];

    //map properties
    for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        const targetValue = computed.getPropertyValue(prop);
        const defaultValue = defaultStyles[prop];
        //ignore variables and prefixes
        if (prop.startsWith('--') || prop.startsWith('-')) continue;
        //ignore physical layout artifacts caused by the 0x0 dummy element
        if (prop.includes('origin') || prop.includes('block-size') || prop.includes('inline-size')) continue;
        //ignore scanner cursor
        if (prop === 'cursor' && targetValue === 'crosshair') continue;
        //ignore useless default colors that mirror the text color
        if (uselessColors.includes(prop)) continue;
        //block redundant css logical properties to prevent layout duplication, except for grid
        if (!prop.startsWith('grid-') && logicalProps.some(lp => prop.includes(lp))) continue;
        //ignore border colors if theres no rendered border
        if (prop.includes('border') && prop.includes('color')) {
            const borderStyle = computed.getPropertyValue('border-style');
            if (borderStyle === 'none' || borderStyle === '') continue;
        }

        //ignore properties that match browser default (only keep whats changed)
        if (defaultValue !== undefined && targetValue !== defaultValue) {
            nodeData.css[prop] = targetValue;
        }
    }

    //set explicit bg color for the root clicked
    if (depth === 0) {
        if (!nodeData.css['background-color'] || nodeData.css['background-color'] === 'rgba(0, 0, 0, 0)') {
            nodeData.css['background-color'] = resolveEffectiveBackground(el);
        }
    } else {
        if (nodeData.css['background-color'] === 'rgba(0, 0, 0, 0)' || nodeData.css['background-color'] === 'transparent') {
            delete nodeData.css['background-color'];
        }
    }

    //loop through the kids
    for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent.trim();
            if (text) {
                nodeData.children.push({ type: 'text', content: text });
            }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            //ignore injected HUD overlay
            if (child.id === 'divburglar-hud-host') continue;

            const childData = extractElementStyles(child, depth + 1);
            if (childData) {
                nodeData.children.push(childData);
            }
        }
    }

    return nodeData;
}