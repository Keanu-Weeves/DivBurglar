//color normalizer
function rgbToHex(rgb) {
    const match = rgb.match(/^rgba?\((\d+), \s*(\d+), \s*(\d+)(?:,\s*([\d.]))?\)$/);
    if (!match) return rgb; //return original if parsing fails

    const hex = (x) => ("0" + parseInt(x).toString(16)).slice(-2);
    const r = hex(match[1]);
    const g = hex(match[2]);
    const b = hex(match[3]);
    const a = match[4] ? Math.round(parseFloat(match[4]) * 255).toString(16).padStart(2, '0') : '';

    return `#${r}${g}${b}${a}`;
}

//group top/right/bottom/left into shorthand Tailwind
function condenseBoxModel(css, baseProp, twPrefix) {
    const classes = [];
    const t = css[`${baseProp}-top`];
    const r = css[`${baseProp}-right`];
    const b = css[`${baseProp}-bottom`];
    const l = css[`${baseProp}-left`];

    if (t && t === r && t === b && t === l) {
        classes.push(`${twPrefix}-[${t}]`);
        delete css[`${baseProp}-top`]; delete css[`${baseProp}-right`];
        delete css[`${baseProp}-bottom`]; delete css[`${baseProp}-left`];
    } else {
        if (t && t === b) { classes.push(`${twPrefix}y-[${t}]`); delete css[`$baseProp}-top`]; delete css[`${baseProp}-bottom`]; }
        if ( r && r === l) { classes.push(`${twPrefix}x-[${r}]`); delete css[`${baseProp}-right`]; delete css[`${baseProp}-left`]; }

        if (css[`${baseProp}-top`]) { classes.push(`${twPrefix}t-[${t}]`); delete css[`${baseProp}-top`]; }
        if (css[`${baseProp}-right`]) { classes.push(`${twPrefix}r-[${r}]`); delete css[`${baseProp}-right`]; }
        if (css[`${baseProp}-bottom`]) { classes.push(`${twPrefix}b-[${b}]`); delete css[`${baseProp}-bottom`]; }
        if (css[`${baseProp}-left`]) { classes.push(`${twPrefix}l-[${l}]`); delete css[`${baseProp}-left`]; }
    }
    return classes;
}

//map standard css properties to their Tailwinf prefixes
const exactUtilities = {
   'display: flex': 'flex',
   'display: grid': 'grid',
   'display: block': 'block',
   'display: inline-block': 'inline-block',
   'display: none': 'hidden',
   'flex-direction: column': 'flex-col',
   'flex-direction: row': 'flex-row',
   'align-items: center': 'items-center',
   'align-items: flex-start': 'items-start',
   'align-items: flex-end': 'items-end',
   'justify-content: center': 'justify-center',
   'justify-content: space-between': 'justify-between',
   'justify-content: flex-start': 'justify-start',
   'justify-content: flex-end': 'justify-end',
   'text-align: center': 'text-center',
   'text-align: left': 'text-left',
   'text-align: right': 'text-right',
   'box-sizing: border-box': 'box-border',
   'list-style-type: none': 'list-none'
};

const numericPrefixes = {
    'background-color': 'bg',
    'color': 'text',
    'font-size': 'text',
    'line-height': 'leading',
    'width': 'w',
    'height': 'h',
    'min-width': 'min-w',
    'min-height': 'min-h',
    'max-width': 'max-w',
    'max-height': 'max-h',
    'border-radius': 'rounded',
    'gap': 'gap',
    'z-index': 'z',
    'opacity': 'opacatiy'
};

export function compileToTailwind(rawStyles) {
    //clone the css object to delete properties as they are condensed
    const css = { ...rawStyles.css };
    const classes = [];

    //condense the margins and paddings
    classes.push(...condenseBoxModel(css, 'padding', 'p'));
    classes.push(...condenseBoxModel(css, 'margin', 'm'));
    classes.push(...condenseBoxModel(css, 'border-width', 'border'));

    //process remaining properties
    for (const [prop, value] of Object.entries(css)) {
        //check
        const exactMatch = exactUtilities[`${prop}: ${value}`];
        if (exactMatch) {
            classes.push(exactMatch);
            continue;
        }

        //color normalization
        let finalValue = value;
        if (finalValue.includes('rgb')) {
            finalValue = finalValue.replace(/rgba?\([^)]+\)/g, (match) => rgbToHex(match));
        }

        //swap double quotes for single so html attribute doesnt break
        let safeValue = finalValue.replace(/"/g, "'");

        //removes spaces after commas in functions
        safeValue = safeValue.replace(/, \s+/g, ',');

        //convert remaining structural spaces to underscoresd for JIT
        const jitValue = safeValue.replace(/\s+/g, '_');

        //prefix matcher vs catch-all
        if (numericPrefixes[prop]) {
            classes.push(`${numericPrefixes[prop]}-[${jitValue}]`);
        } else {
            classes.push(`[${prop}:${jitValue}]`);
        }

    }

    //deduplicate and return formatted string
    return Array.from(new Set(classes)).join(' ');
}