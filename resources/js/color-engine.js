// Moteur couleur 100% client-side : conversions, quantification perceptuelle
// (median cut en OKLab), contraste WCAG et génération de rampes 50→950.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// --- sRGB <-> linéaire ---
function srgbToLinear(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// --- HEX <-> RGB ---
export function hexToRgb(hex) {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) {
        h = h.split('').map((x) => x + x).join('');
    }
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
export function rgbToHex({ r, g, b }) {
    const to = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    return ('#' + to(r) + to(g) + to(b)).toUpperCase();
}

// --- RGB [0-255] <-> OKLab ---
// Matrices de Björn Ottosson (OKLab).
export function rgbToOklab({ r, g, b }) {
    const lr = srgbToLinear(r / 255);
    const lg = srgbToLinear(g / 255);
    const lb = srgbToLinear(b / 255);

    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    return {
        L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
        a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
        b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
    };
}

export function oklabToRgb({ L, a, b }) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

    return {
        r: linearToSrgb(lr) * 255,
        g: linearToSrgb(lg) * 255,
        b: linearToSrgb(lb) * 255,
    };
}

// --- OKLab <-> OKLCH ---
export function oklabToOklch({ L, a, b }) {
    const C = Math.sqrt(a * a + b * b);
    let h = (Math.atan2(b, a) * 180) / Math.PI;
    if (h < 0) h += 360;
    return { L, C, h };
}
export function oklchToOklab({ L, C, h }) {
    const rad = (h * Math.PI) / 180;
    return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
}

// --- RGB -> HSL ---
export function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    const l = (max + min) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// --- Vérifie qu'une couleur sRGB est dans le gamut ---
function inGamut({ r, g, b }) {
    const eps = 0.4;
    return r >= -eps && r <= 255 + eps && g >= -eps && g <= 255 + eps && b >= -eps && b <= 255 + eps;
}

// Ramène une OKLCH hors-gamut dans le gamut en réduisant le chroma (recherche dichotomique).
function gamutClampOklch({ L, C, h }) {
    let rgb = oklabToRgb(oklchToOklab({ L, C, h }));
    if (inGamut(rgb)) return rgb;
    let lo = 0, hi = C;
    for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        rgb = oklabToRgb(oklchToOklab({ L, C: mid, h }));
        if (inGamut(rgb)) lo = mid; else hi = mid;
    }
    return oklabToRgb(oklchToOklab({ L, C: lo, h }));
}

// --- Représentations multiples d'une couleur ---
export function describe(hex) {
    const rgb = hexToRgb(hex);
    const lch = oklabToOklch(rgbToOklab(rgb));
    const hsl = rgbToHsl(rgb);
    return {
        hex: hex.toUpperCase(),
        rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
        hsl: `${hsl.h}, ${hsl.s}%, ${hsl.l}%`,
        oklch: `${lch.L.toFixed(2)} ${lch.C.toFixed(2)} ${Math.round(lch.h)}`,
    };
}

// --- Contraste WCAG ---
function relLuminance({ r, g, b }) {
    const R = srgbToLinear(r / 255);
    const G = srgbToLinear(g / 255);
    const B = srgbToLinear(b / 255);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
export function contrastRatio(hexA, hexB) {
    const la = relLuminance(hexToRgb(hexA));
    const lb = relLuminance(hexToRgb(hexB));
    const light = Math.max(la, lb);
    const dark = Math.min(la, lb);
    return (light + 0.05) / (dark + 0.05);
}
export function wcagLevel(ratio) {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'AA-large';
    return 'fail';
}

// Choisit la couleur de texte (blanc ou encre) la plus lisible sur un fond donné.
export function bestTextOn(hexBg) {
    const ink = '#1C1C1E';
    const white = '#FFFFFF';
    const cInk = contrastRatio(hexBg, ink);
    const cWhite = contrastRatio(hexBg, white);
    return cWhite >= cInk
        ? { text: white, label: 'Blanc', ratio: cWhite }
        : { text: ink, label: 'Encre', ratio: cInk };
}

// --- Génération de la rampe 50→950 (façon Tailwind, en OKLCH) ---
// La base est ancrée sur le 500 ; les autres nuances interpolent sa luminosité
// vers un extrême clair / foncé pour rester monotones et toujours distinctes.
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LIGHT_END = 0.975;
const DARK_END = 0.205;
// Fraction du chemin parcouru depuis la base vers l'extrême, par nuance.
const L_FRAC = {
    50: 0.96, 100: 0.84, 200: 0.64, 300: 0.43, 400: 0.2,
    600: 0.16, 700: 0.36, 800: 0.55, 900: 0.73, 950: 0.9,
};
// Facteur de chroma relatif à la base (pic au centre, atténué aux extrêmes).
const C_FRAC = {
    50: 0.2, 100: 0.34, 200: 0.58, 300: 0.8, 400: 0.94,
    500: 1, 600: 1, 700: 0.92, 800: 0.78, 900: 0.64, 950: 0.5,
};

// Conversions directes hex <-> OKLCH (pratiques pour générer des couleurs).
export function hexToOklch(hex) {
    return oklabToOklch(rgbToOklab(hexToRgb(hex)));
}
export function oklchToHex({ L, C, h }) {
    return rgbToHex(gamutClampOklch({ L, C, h }));
}

export function buildRamp(baseHex) {
    const base = oklabToOklch(rgbToOklab(hexToRgb(baseHex)));
    const ramp = {};
    for (const step of STEPS) {
        if (step === 500) {
            ramp[step] = baseHex.toUpperCase();
            continue;
        }
        const end = step < 500 ? LIGHT_END : DARK_END;
        const L = base.L + (end - base.L) * L_FRAC[step];
        const C = base.C * C_FRAC[step];
        ramp[step] = rgbToHex(gamutClampOklch({ L, C, h: base.h }));
    }
    return ramp;
}

export { STEPS };

// --- Quantification : variante MMCQ (Modified Median Cut) en OKLab ---
// Les premiers découpages privilégient la POPULATION (teintes dominantes),
// les suivants la population × VOLUME pour récupérer aussi les accents rares
// mais distincts. On obtient ainsi un éventail complet des couleurs de l'image.
function makeBox(pts) {
    let minL = Infinity, maxL = -Infinity;
    let minA = Infinity, maxA = -Infinity;
    let minB = Infinity, maxB = -Infinity;
    for (const p of pts) {
        if (p.L < minL) minL = p.L; if (p.L > maxL) maxL = p.L;
        if (p.a < minA) minA = p.a; if (p.a > maxA) maxA = p.a;
        if (p.b < minB) minB = p.b; if (p.b > maxB) maxB = p.b;
    }
    const rL = maxL - minL, rA = maxA - minA, rB = maxB - minB;
    return {
        pts,
        weight: pts.length,
        ranges: { L: rL, a: rA, b: rB },
        axis: rL >= rA && rL >= rB ? 'L' : rA >= rB ? 'a' : 'b',
        volume: (rL + 1e-4) * (rA + 1e-4) * (rB + 1e-4),
    };
}

function medianCut(points, count) {
    let boxes = [makeBox(points)];

    while (boxes.length < count) {
        const volumePhase = boxes.length >= Math.max(1, Math.ceil(count * 0.6));
        let target = -1, score = -1;
        for (let i = 0; i < boxes.length; i++) {
            const b = boxes[i];
            if (b.pts.length < 2) continue;
            const s = volumePhase ? b.weight * b.volume : b.weight;
            if (s > score) { score = s; target = i; }
        }
        if (target === -1) break;

        const b = boxes[target];
        b.pts.sort((p, q) => p[b.axis] - q[b.axis]);
        const mid = Math.floor(b.pts.length / 2);
        boxes.splice(target, 1, makeBox(b.pts.slice(0, mid)), makeBox(b.pts.slice(mid)));
    }

    return boxes
        .filter((b) => b.pts.length)
        .map((box) => {
            let L = 0, a = 0, b = 0;
            for (const p of box.pts) { L += p.L; a += p.a; b += p.b; }
            const n = box.pts.length;
            const mean = { L: L / n, a: a / n, b: b / n };
            // Pixel le plus représentatif (le plus proche de la moyenne) → marqueur.
            let rep = box.pts[0], best = Infinity;
            for (const p of box.pts) {
                const d = (p.L - mean.L) ** 2 + (p.a - mean.a) ** 2 + (p.b - mean.b) ** 2;
                if (d < best) { best = d; rep = p; }
            }
            return { lab: mean, weight: n, x: rep.x, y: rep.y };
        });
}

// Distance perceptuelle entre deux couleurs (OKLab), pour dédoublonner finement.
function labDistance(hexA, hexB) {
    const a = rgbToOklab(hexToRgb(hexA));
    const b = rgbToOklab(hexToRgb(hexB));
    return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

/**
 * Extrait `count` couleurs dominantes depuis les pixels d'un canvas.
 * @param {Uint8ClampedArray} data - sortie de ctx.getImageData().data
 * @param {number} count
 * @param {number} width - largeur de l'imageData (pour situer les marqueurs)
 * @returns {{hex: string, x: number, y: number}[]} couleurs triées par dominance,
 *          avec coordonnées normalisées (0→1) du pixel d'origine.
 */
export function extractPalette(data, count, width = 0, mode = 'balanced') {
    const points = [];
    const total = data.length / 4;
    // On échantillonne pour rester rapide même sur de grandes images.
    const stride = Math.max(1, Math.floor(total / 14000));
    for (let i = 0; i < total; i += stride) {
        const o = i * 4;
        const alpha = data[o + 3];
        if (alpha < 125) continue;
        const p = rgbToOklab({ r: data[o], g: data[o + 1], b: data[o + 2] });
        if (width > 0) {
            const height = total / width;
            p.x = (i % width) / width;
            p.y = Math.floor(i / width) / height;
        }
        points.push(p);
    }
    if (!points.length) return [];

    // 1) Quantification fine : beaucoup plus de clusters que demandé, pour que
    //    les teintes vives mais minoritaires (un jaune, un bleu) aient leur boîte.
    const fine = Math.min(points.length, Math.max(count * 6, 32));
    let clusters = medianCut(points, fine).map((c) => {
        const rgb = oklabToRgb(c.lab);
        return {
            hex: rgbToHex({
                r: clamp(rgb.r, 0, 255),
                g: clamp(rgb.g, 0, 255),
                b: clamp(rgb.b, 0, 255),
            }),
            lab: c.lab,
            weight: c.weight,
            chroma: Math.sqrt(c.lab.a * c.lab.a + c.lab.b * c.lab.b),
            x: c.x ?? null,
            y: c.y ?? null,
        };
    });

    // 2) Fusionne les teintes quasi identiques (garde la plus présente).
    clusters.sort((p, q) => q.weight - p.weight);
    const merged = [];
    for (const c of clusters) {
        if (!merged.some((m) => labDistance(m.hex, c.hex) < 0.03)) merged.push(c);
    }

    // 3) Écarte le bruit : on ne garde que les clusters suffisamment présents.
    const totalW = merged.reduce((s, c) => s + c.weight, 0);
    let pool = merged.filter((c) => c.weight >= totalW * 0.004);
    if (pool.length < count) pool = merged;

    // 4) Noyau dominant trié par présence. Sa taille dépend du mode choisi :
    //    - dominant : tout le noyau (palette la plus fidèle / harmonieuse)
    //    - balanced : 4 dominantes harmonieuses, le reste en diversité
    //    - vibrant  : on part d'une seule dominante puis on maximise la variété
    const coreSize = mode === 'dominant' ? count : mode === 'vibrant' ? 1 : Math.min(4, count);
    const chromaWeight = mode === 'vibrant' ? 1.5 : 1;
    const chromaBase = mode === 'vibrant' ? 0.2 : 0.35;
    const selected = pool.slice(0, coreSize);

    // 5) Diversité pour les slots restants : teinte la plus distincte × vivace.
    const dist = (a, b) =>
        Math.sqrt((a.lab.L - b.lab.L) ** 2 + (a.lab.a - b.lab.a) ** 2 + (a.lab.b - b.lab.b) ** 2);
    while (selected.length < count && selected.length < pool.length) {
        let best = null, bestScore = -1;
        for (const c of pool) {
            if (selected.includes(c)) continue;
            let minD = Infinity;
            for (const s of selected) minD = Math.min(minD, dist(c, s));
            const score = minD * (chromaBase + c.chroma * chromaWeight);
            if (score > bestScore) { bestScore = score; best = c; }
        }
        if (!best) break;
        selected.push(best);
    }

    return selected.map((c) => ({ hex: c.hex, x: c.x, y: c.y }));
}
