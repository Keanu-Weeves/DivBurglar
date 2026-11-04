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

const standardBrowserDefaults = {
  'accent-color': 'auto', 'align-content': 'normal', 'align-items': 'normal', 'align-self': 'auto',
  'animation-delay': '0s', 'animation-direction': 'normal', 'animation-duration': '0s',
  'animation-fill-mode': 'none', 'animation-iteration-count': '1', 'animation-name': 'none',
  'animation-play-state': 'running', 'backdrop-filter': 'none', 'backface-visibility': 'visible',
  'background-attachment': 'scroll', 'background-blend-mode': 'normal', 'background-clip': 'border-box',
  'background-image': 'none', 'background-position': '0% 0%', 'background-repeat': 'repeat',
  'background-size': 'auto', 'border-bottom-left-radius': '0px', 'border-bottom-right-radius': '0px',
  'border-bottom-style': 'none', 'border-bottom-width': '0px', 'border-collapse': 'separate',
  'border-image-outset': '0', 'border-image-repeat': 'stretch', 'border-image-slice': '100%',
  'border-image-source': 'none', 'border-image-width': '1', 'border-left-style': 'none',
  'border-left-width': '0px', 'border-right-style': 'none', 'border-right-width': '0px',
  'border-top-left-radius': '0px', 'border-top-right-radius': '0px', 'border-top-style': 'none',
  'border-top-width': '0px', 'bottom': 'auto', 'box-shadow': 'none', 'box-sizing': 'content-box',
  'caption-side': 'top', 'clear': 'none', 'clip': 'auto', 'clip-path': 'none', 'clip-rule': 'nonzero',
  'column-count': 'auto', 'column-fill': 'balance', 'column-gap': 'normal', 'column-rule-style': 'none',
  'column-rule-width': '0px', 'column-span': 'none', 'column-width': 'auto', 'contain': 'none',
  'content': 'normal', 'counter-increment': 'none', 'counter-reset': 'none', 'cursor': 'auto',
  'direction': 'ltr', 'empty-cells': 'show', 'filter': 'none', 'flex-basis': 'auto',
  'flex-grow': '0', 'flex-shrink': '1', 'float': 'none', 'font-style': 'normal',
  'font-variant': 'normal', 'font-weight': '400', 'grid-auto-columns': 'auto', 'grid-auto-flow': 'row',
  'grid-auto-rows': 'auto', 'grid-template-areas': 'none', 'grid-template-columns': 'none',
  'grid-template-rows': 'none', 'hyphens': 'manual', 'image-rendering': 'auto', 'isolation': 'auto',
  'justify-content': 'normal', 'justify-items': 'normal', 'justify-self': 'auto', 'left': 'auto',
  'letter-spacing': 'normal', 'line-break': 'auto', 'list-style-image': 'none', 'list-style-position': 'outside',
  'list-style-type': 'disc', 'margin-bottom': '0px', 'margin-left': '0px', 'margin-right': '0px',
  'margin-top': '0px', 'mask-image': 'none', 'mask-position': '0% 0%', 'mask-repeat': 'repeat',
  'mask-size': 'auto', 'max-height': 'none', 'max-width': 'none', 'min-height': '0px',
  'min-width': '0px', 'mix-blend-mode': 'normal', 'object-fit': 'fill', 'object-position': '50% 50%',
  'opacity': '1', 'order': '0', 'orphans': '2', 'outline-color': 'invert', 'outline-offset': '0px',
  'outline-style': 'none', 'outline-width': '0px', 'overflow-wrap': 'normal', 'overflow-x': 'visible',
  'overflow-y': 'visible', 'padding-bottom': '0px', 'padding-left': '0px', 'padding-right': '0px',
  'padding-top': '0px', 'page-break-after': 'auto', 'page-break-before': 'auto', 'page-break-inside': 'auto',
  'perspective': 'none', 'perspective-origin': '50% 50%', 'pointer-events': 'auto', 'position': 'static',
  'resize': 'none', 'right': 'auto', 'row-gap': 'normal', 'scroll-behavior': 'auto',
  'stroke-dasharray': 'none', 'stroke-dashoffset': '0px', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter',
  'stroke-miterlimit': '4', 'stroke-opacity': '1', 'stroke-width': '1px', 'table-layout': 'auto',
  'text-align': 'start', 'text-align-last': 'auto', 'text-decoration-color': 'currentColor',
  'text-decoration-line': 'none', 'text-decoration-style': 'solid', 'text-indent': '0px',
  'text-justify': 'auto', 'text-overflow': 'clip', 'text-shadow': 'none', 'text-transform': 'none',
  'top': 'auto', 'touch-action': 'auto', 'transform': 'none', 'transform-origin': '50% 50%',
  'transform-style': 'flat', 'transition-delay': '0s', 'transition-duration': '0s',
  'transition-property': 'all', 'transition-timing-function': 'ease', 'unicode-bidi': 'normal',
  'vertical-align': 'baseline', 'visibility': 'visible', 'white-space': 'normal', 'widows': '2',
  'word-break': 'normal', 'word-spacing': '0px', 'writing-mode': 'horizontal-tb', 'z-index': 'auto', 'zoom': '1'
};

const defaultStylesCache = {};

function getDefaultStyles(tagName) {

    if (defaultStylesCache[tagName]) return defaultStylesCache[tagName];

    let defaultStyles = { ...standardBrowserDefaults };
    try {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position: absolute; width: 0; height: 0; border: 0; visibility: hidden; pointer-events: none;';
        document.body.appendChild(iframe);

        let dummy;
        try {
            dummy = document.createElement(tagName);
        } catch (e) {
            dummy = document.createElement('div');
            console.warn(`Failed to grab element:  ${tagName}"`, e);
        }

            //fallback div if encountering weird SVG tags that fail HTML creation

        iframe.contentDocument.body.appendChild(dummy);
        const computed = iframe.contentWindow.getComputedStyle(dummy);
        if (computed) {
            for (let i = 0; i < computed.length; i++) {
                const prop = computed[i];
                defaultStyles[prop] = computed.getPropertyValue(prop);
            }
        }
        document.body.removeChild(iframe);
    } catch (e) {
        console.warn('[DivBurglar] Failed to extract default styles for:', tagName, 'Error: ', e);
    }
    defaultStylesCache[tagName] = defaultStyles;
    return defaultStyles;
}

// recursively extract custome styles and text for an element and its children
export function extractElementStyles(el, depth = 0) {
    //prevent infinite recursions and max call stack crashes
    if (depth > 25) return null;

    const tagName = el.tagName.toLowerCase();

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