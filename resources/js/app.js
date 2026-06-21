import Alpine from 'alpinejs';
import {
    extractPalette,
    buildRamp,
    describe,
    bestTextOn,
    contrastRatio,
    wcagLevel,
    hexToOklch,
    oklchToHex,
    rgbToHex,
} from './color-engine.js';
import {
    toTailwind,
    toCssVars,
    toScss,
    toBootstrap,
    toTokensJson,
    toAse,
    toZip,
} from './exporters.js';

// Empêche le navigateur d'ouvrir une image déposée hors de la dropzone.
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

const ROLES = ['Primary', 'Secondary', 'Accent', 'Support', 'Surface', 'Ink', 'Muted', 'Tint', 'Shade', 'Extra'];
const keyOf = (role) => role.toLowerCase();
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function downloadBlob(filename, data, mime) {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

Alpine.data('paletteApp', () => ({
    screen: 'upload',
    count: 6,
    activeMode: 'balanced',
    variants: { dominant: [], balanced: [], vibrant: [] },
    fileName: '',
    thumbUrl: '',
    loading: false,
    error: '',
    dragOver: false,
    colors: [],
    exportTab: 'tailwind',
    copied: '',
    dragIndex: null,
    showSource: true,
    pickMode: false,
    loupe: { show: false, x: 0, y: 0, bg: '0% 0%', hex: '#000000' },

    _imageData: null,
    _imgW: 0,
    _imgH: 0,

    init() {
        window.addEventListener('keydown', (e) => {
            if (this.screen !== 'result') return;
            const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
            if (e.code === 'Space' && !typing) {
                e.preventDefault();
                this.reroll();
            }
        });
    },

    // --- Upload ---
    openPicker() {
        this.$refs.fileInput.click();
    },
    onFileChange(e) {
        const file = e.target.files?.[0];
        if (file) this.handleFile(file);
    },
    onDrop(e) {
        this.dragOver = false;
        const file = e.dataTransfer?.files?.[0];
        if (file) this.handleFile(file);
    },

    handleFile(file) {
        this.error = '';
        if (!ACCEPTED.includes(file.type)) {
            this.error = 'Format non supporté — utilise un PNG, JPG ou WEBP.';
            return;
        }
        if (file.size > MAX_BYTES) {
            this.error = 'Image trop lourde — 8 MB maximum.';
            return;
        }

        this.loading = true;
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            try {
                const max = 360;
                const scale = Math.min(1, max / Math.max(img.width, img.height));
                const w = Math.max(1, Math.round(img.width * scale));
                const h = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, w, h);
                this._imageData = ctx.getImageData(0, 0, w, h).data;
                this._imgW = w;
                this._imgH = h;

                if (this.thumbUrl) URL.revokeObjectURL(this.thumbUrl);
                this.thumbUrl = url;
                this.fileName = file.name;

                this.buildFromImage();
                this.screen = 'result';
            } catch (err) {
                this.error = 'Impossible de lire cette image — essaie-en une autre.';
                URL.revokeObjectURL(url);
            } finally {
                this.loading = false;
            }
        };

        img.onerror = () => {
            this.error = 'Image illisible — essaie-en une autre.';
            this.loading = false;
            URL.revokeObjectURL(url);
        };

        img.src = url;
    },

    // Calcule les 3 variantes d'un coup, puis charge la variante active.
    buildFromImage() {
        for (const m of ['dominant', 'balanced', 'vibrant']) {
            this.variants[m] = extractPalette(this._imageData, this.count, this._imgW, m);
        }
        this.loadVariant(this.activeMode);
    },

    loadVariant(m) {
        this.activeMode = m;
        this.colors = this.variants[m].map((f, i) => this.makeColor(f.hex, i, f));
    },

    selectVariant(m) {
        if (this.activeMode === m) return;
        this.loadVariant(m);
    },

    makeColor(hex, i, pos = null) {
        return {
            hex,
            role: ROLES[i],
            key: keyOf(ROLES[i]),
            ramp: buildRamp(hex),
            desc: describe(hex),
            locked: false,
            x: pos?.x ?? null,
            y: pos?.y ?? null,
        };
    },

    replaceColor(i, hex, pos = null) {
        const c = this.colors[i];
        c.hex = hex;
        c.ramp = buildRamp(hex);
        c.desc = describe(hex);
        c.x = pos?.x ?? null;
        c.y = pos?.y ?? null;
    },

    relabel() {
        this.colors.forEach((c, idx) => {
            c.role = ROLES[idx];
            c.key = keyOf(ROLES[idx]);
        });
    },

    // --- Nombre de couleurs ---
    changeCount(delta) {
        const next = Math.min(10, Math.max(3, this.count + delta));
        if (next === this.count) return;
        this.count = next;
        if (this._imageData) this.buildFromImage();
    },

    // --- Ajout d'une couleur (harmonieuse, façon Coolors) ---
    addColor() {
        if (this.colors.length >= 10) return;
        const hex = this.harmoniousHex();
        this.colors.push(this.makeColor(hex, this.colors.length));
        this.count = this.colors.length;
    },

    harmoniousHex() {
        const list = this.colors.map((c) => hexToOklch(c.hex));
        if (!list.length) {
            return oklchToHex({ L: 0.62, C: 0.15, h: Math.random() * 360 });
        }
        const hues = list.map((o) => o.h).sort((a, b) => a - b);
        let bestGap = -1;
        let bestHue = Math.random() * 360;
        for (let i = 0; i < hues.length; i++) {
            const isLast = i + 1 === hues.length;
            const next = hues[(i + 1) % hues.length] + (isLast ? 360 : 0);
            const gap = next - hues[i];
            if (gap > bestGap) {
                bestGap = gap;
                bestHue = (hues[i] + gap / 2) % 360;
            }
        }
        const avgL = list.reduce((s, o) => s + o.L, 0) / list.length;
        const avgC = list.reduce((s, o) => s + o.C, 0) / list.length;
        const jitter = Math.random() - 0.5;
        return oklchToHex({
            L: clamp(avgL + jitter * 0.08, 0.45, 0.78),
            C: Math.max(0.05, avgC * (0.85 + Math.random() * 0.4)),
            h: (bestHue + jitter * 14 + 360) % 360,
        });
    },

    removeColor(i) {
        if (this.colors.length <= 3) return;
        this.colors.splice(i, 1);
        this.count = this.colors.length;
        this.relabel();
    },

    toggleLock(i) {
        this.colors[i].locked = !this.colors[i].locked;
    },

    // --- Régénération (spacebar) : re-roll des couleurs non verrouillées ---
    reroll() {
        if (this._imageData) {
            const candidates = extractPalette(this._imageData, Math.min(12, this.colors.length + 5), this._imgW, this.activeMode);
            if (candidates.length) {
                this.colors.forEach((c, i) => {
                    if (c.locked) return;
                    const pick = candidates[Math.floor(Math.random() * candidates.length)];
                    if (pick) this.replaceColor(i, pick.hex, pick);
                });
                return;
            }
        }
        this.colors.forEach((c, i) => {
            if (!c.locked) this.replaceColor(i, this.harmoniousHex());
        });
    },

    // --- Pipette zoomée sur l'image source ---
    togglePick() {
        this.pickMode = !this.pickMode;
        if (!this.pickMode) this.loupe.show = false;
    },

    // Lit la couleur d'un pixel à des coordonnées normalisées (0→1).
    pixelAt(fx, fy) {
        const px = Math.min(this._imgW - 1, Math.max(0, Math.round(fx * this._imgW)));
        const py = Math.min(this._imgH - 1, Math.max(0, Math.round(fy * this._imgH)));
        const o = (py * this._imgW + px) * 4;
        const d = this._imageData;
        return rgbToHex({ r: d[o], g: d[o + 1], b: d[o + 2] });
    },

    onImageMove(e) {
        if (!this.pickMode || !this._imageData) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;
        if (fx < 0 || fx > 1 || fy < 0 || fy > 1) {
            this.loupe.show = false;
            return;
        }
        this.loupe.show = true;
        this.loupe.x = e.clientX - rect.left;
        this.loupe.y = e.clientY - rect.top;
        this.loupe.bg = `${fx * 100}% ${fy * 100}%`;
        this.loupe.hex = this.pixelAt(fx, fy);
    },

    onImageClick(e) {
        if (!this.pickMode || !this._imageData) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;
        const hex = this.pixelAt(fx, fy);
        if (this.colors.length < 10) {
            this.colors.push(this.makeColor(hex, this.colors.length, { x: fx, y: fy }));
            this.count = this.colors.length;
        } else {
            // Palette pleine : on remplace la dernière couleur non verrouillée.
            const idx = [...this.colors].reverse().findIndex((c) => !c.locked);
            if (idx !== -1) this.replaceColor(this.colors.length - 1 - idx, hex, { x: fx, y: fy });
        }
        // Un pick = une couleur ; on désactive la pipette ensuite.
        this.pickMode = false;
        this.loupe.show = false;
    },

    reset() {
        this.screen = 'upload';
        this.colors = [];
        this._imageData = null;
        this.error = '';
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },

    // --- Réordonnancement par glisser ---
    onBarDragStart(i) {
        this.dragIndex = i;
    },
    onBarDrop(i) {
        if (this.dragIndex === null || this.dragIndex === i) {
            this.dragIndex = null;
            return;
        }
        const [moved] = this.colors.splice(this.dragIndex, 1);
        this.colors.splice(i, 0, moved);
        this.relabel();
        this.dragIndex = null;
    },

    // Couleur de texte lisible sur un fond donné (pour les barres).
    fg(hex) {
        return bestTextOn(hex).text;
    },

    // --- Copie ---
    copy(text, token) {
        navigator.clipboard.writeText(text).then(() => {
            this.copied = token;
            setTimeout(() => {
                if (this.copied === token) this.copied = '';
            }, 1400);
        });
    },

    // --- Contraste WCAG ---
    get contrastRows() {
        return this.colors.map((c) => {
            const t = bestTextOn(c.hex);
            const ratio = contrastRatio(c.hex, t.text);
            return {
                role: c.role,
                bg: c.hex,
                text: t.text,
                label: t.label,
                ratio: ratio.toFixed(2),
                level: wcagLevel(ratio),
            };
        });
    },

    // --- Design system live : variables CSS dérivées de la palette ---
    get previewVars() {
        const c = this.colors;
        if (!c.length) return {};
        const find = (role) => c.find((x) => x.role === role) || c[0];
        const ramp = (role, step) => find(role).ramp[step];

        const byLight = [...c].sort(
            (a, b) => contrastRatio(b.hex, '#000') - contrastRatio(a.hex, '#000')
        );
        const lightest = byLight[byLight.length - 1].hex;
        const darkest = byLight[0].hex;

        const primary = c[0].hex;
        const secondary = (c[1] || c[0]).hex;
        const accent = (c[2] || c[0]).hex;
        const support = (c[3] || c[1] || c[0]).hex;

        return {
            '--pv-primary': primary,
            '--pv-primary-fg': bestTextOn(primary).text,
            '--pv-primary-soft': c[0].ramp[50],
            '--pv-primary-softfg': c[0].ramp[700],
            '--pv-primary-hover': c[0].ramp[600],
            '--pv-secondary': secondary,
            '--pv-secondary-fg': bestTextOn(secondary).text,
            '--pv-accent': accent,
            '--pv-accent-fg': bestTextOn(accent).text,
            '--pv-support': support,
            '--pv-support-fg': bestTextOn(support).text,
            '--pv-surface': lightest,
            '--pv-card': '#ffffff',
            '--pv-ink': darkest,
            '--pv-muted': ramp('Primary', 600) === darkest ? '#6b6b73' : c[0].ramp[700],
            '--pv-border': c[0].ramp[100],
            '--pv-ring': c[0].ramp[200],
        };
    },

    // --- Exports ---
    get exportCode() {
        switch (this.exportTab) {
            case 'tailwind': return toTailwind(this.colors);
            case 'css': return toCssVars(this.colors);
            case 'scss': return toScss(this.colors);
            case 'bootstrap': return toBootstrap(this.colors);
            case 'json': return toTokensJson(this.colors);
            case 'ase': return '// palette.ase — format binaire Adobe Swatch Exchange.\n// Clique « Télécharger » pour récupérer le fichier.';
            default: return '';
        }
    },

    copyExport() {
        if (this.exportTab === 'ase') {
            this.downloadAse();
            return;
        }
        this.copy(this.exportCode, 'export');
    },

    downloadTailwind() { downloadBlob('tailwind.config.js', toTailwind(this.colors), 'text/javascript'); },
    downloadCss() { downloadBlob('variables.css', toCssVars(this.colors), 'text/css'); },
    downloadScss() { downloadBlob('variables.scss', toScss(this.colors), 'text/x-scss'); },
    downloadBootstrap() { downloadBlob('_bootstrap-overrides.scss', toBootstrap(this.colors), 'text/x-scss'); },
    downloadJson() { downloadBlob('tokens.json', toTokensJson(this.colors), 'application/json'); },
    downloadAse() { downloadBlob('palette.ase', toAse(this.colors), 'application/octet-stream'); },

    downloadAll() {
        const files = [
            { name: 'tailwind.config.js', data: toTailwind(this.colors) },
            { name: 'variables.css', data: toCssVars(this.colors) },
            { name: 'variables.scss', data: toScss(this.colors) },
            { name: '_bootstrap-overrides.scss', data: toBootstrap(this.colors) },
            { name: 'tokens.json', data: toTokensJson(this.colors) },
            { name: 'palette.ase', data: toAse(this.colors) },
            { name: 'README.txt', data: 'Palette générée avec ColorPalette4Me — Projet #07/52 · Sprint Factory\nUne image entre, ta palette sort.\n' },
        ];
        downloadBlob('colorpalette4me.zip', toZip(files), 'application/zip');
    },
}));

window.Alpine = Alpine;
Alpine.start();
