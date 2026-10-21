# DivBurglar

**Don't just inspect the DOM. Steal it.**

DivBurglar is a Manifest V3 Chrome Extension and developer utility that reverse-engineers live webpage components; or entire pages, into clean HTML, Tailwind CSS utility classes, strict React JSX, and Framer Motion components.

Instead of just copying static styles like a standard inspector, DivBurglar captures interactive psuedo-states (`:hover`, `:focus`), extracts CSS transition physics, and audits the page's design system to generate a complete `tailwind.config.js` theme file.

---

##  Features

### Core Extraction (Free Tier)
* **Single-Element Snatcher:** Hover and click any DOM node to instantly extract its HTML structure and computed styles mapped to Tailwind CSS utilities.
* **Ghost Container Detection:** Automatically traverses up the DOM tree when clicking transparent containers to capture the true rendered background color.
* **Arbitrary Value Fallback:** Maps standard design scales to native Tailwind utilities (`p-4`, `flex`, `bg-blue-600`) and gracefully falls back to JIT syntax (`p-[13px]`) for custom pixel values.

### Advanced Engineering (Pro Tier)
* **Multi-State & Dark Mode Capture:** Programmatically triggers `:hover`, `:focus`, `:active`, and `prefers-color-scheme` states to append interactive Tailwind modifiers automatically.
* **Framer Motion Converter:** Parses CSS `transition` and `transform` timings and translates them into configured `<motion.div>` React components with `initial`, `animate`, and `transition` props.
* **Full-Page Auto-Clone:** Uses the native `document.createTreeWalker()` API with asynchronous frame yielding (`requestAnimationFrame`) to clone thousands of DOM nodes without freezing the main thread, converting relative asset paths to absolute URLs.
* **Design System "DNA" Generator:** Aggregates color hex codes, typography, and border radii across the entire DOM using `.reduce()` frequency analysis to generate a ready-to-paste `tailwind.config.js` file.
* **Local File Exporter:** Generates and downloads `.jsx`, `.html`, and `.css` files directly in the browser using the `Blob` and `chrome.downloads` APIs—zero backend server required.

---

##  Tech Stack

* **Frontend (Popup UI):** React, Chakra UI
* **Bundler & HMR:** Vite + `@crxjs/vite-plugin` (Manifest V3)
* **Core Extraction Engine:** Vanilla JavaScript (ES6+), Browser Object Model (`window.getComputedStyle`, `TreeWalker`, `DOMRect`, `Blob`)
* **State & Storage:** `chrome.storage` API

---

##  Project Architecture

```text
tracekit-extension/
├── public/
│   └── icons/                 # Extension toolbar & store icons
├── src/
│   ├── background/
│   │   └── service-worker.js  # Background event listener & license state manager
│   ├── content/
│   │   ├── content.js         # Non-intrusive DOM hover overlay & click interceptor
│   │   └── extractor.js       # getComputedStyle() & TreeWalker DOM traversal
│   ├── engine/
│   │   ├── config-builder.js  # DOM frequency analyzer for tailwind.config.js
│   │   ├── jsx-converter.js   # HTML-to-JSX parser & Framer Motion compiler
│   │   └── tailwind-mapper.js # Raw CSS pixel-to-Tailwind utility mapping engine
│   └── popup/
│       ├── components/        # Reusable UI controls & export toggles
│       ├── Popup.jsx          # Main extension popup interface
│       └── popup.css          # Popup-specific styling
├── manifest.json              # Chrome Extension Manifest V3 configuration
└── vite.config.js             # Vite + CRXJS build pipeline


---------

Copyright © 2026 Cody Edwards. All rights reserved.