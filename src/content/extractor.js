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
 */

function getDefaultStyles(tagName) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const dummy = document.createElement(tagName);
    iframe.contentDocument.body.appendChild(dummy);

    const defaultStyles = {};
    const computed = iframe.contentWindow.getComputedStyle(dummy);

    for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        defaultStyles[prop] = computed.getPropertyValue(prop);
    }

    document.body.removeChild(iframe);
    return defaultStyles;
}
export function extractElementStyles(el) {
    const computed = window.getComputedStyle(el);
    const tagName = el.tagName.toLowerCase();
    const defaultStyles = getDefaultStyles(tagName);

    const customStyles = {
        tag: tagName,
        text: el.children.length === 0 ? el.textContent?.trim() || '' : '',
        hasChildren: el.children.length > 0,
        css: {}
    };

    const uselessColors = [
        'caret-color', 'column-rule-color', 'text-decoration-color', 'text-emphasis-color', 'outline-color'
    ];

    //loop through all properties and keep only what has been changed
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
        if (targetValue !== defaultValue) {
            customStyles.css[prop] = targetValue;
        }
    }

    //override transparent backgrouns with traced ghost container color
    if (!customStyles.css['background-color'] || customStyles.css['backgroun-color'] === 'rgba(0, 0, 0, 0)') {
        customStyles.css['background-color'] = resolveEffectiveBackground(el);
    }

    return customStyles;

}