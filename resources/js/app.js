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
    toSvg,
    toHtml,
    toPdf,
    toPrompt,
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

// Éléments lourds gardés hors de l'état réactif Alpine.
let srcCanvas = null;   // canvas de la zone recadrée (échantillonnage + loupe)
let srcImage = null;    // image originale chargée (pour ré-appliquer rotation/flip)
let baseCanvas = null;  // image après rotation/flip, avant recadrage

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
    loupe: { show: false, x: 0, y: 0, hex: '#000000' },
    editorUrl: '',
    rot: 0,
    flipH: false,
    crop: { x: 0, y: 0, w: 1, h: 1 },

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
                srcImage = img;
                this.fileName = file.name;
                this.rot = 0;
                this.flipH = false;
                this.renderBase();
                this.screen = 'edit';
            } catch (err) {
                this.error = 'Impossible de lire cette image — essaie-en une autre.';
            } finally {
                this.loading = false;
                URL.revokeObjectURL(url);
            }
        };

        img.onerror = () => {
            this.error = 'Image illisible — essaie-en une autre.';
            this.loading = false;
            URL.revokeObjectURL(url);
        };

        img.src = url;
    },

    // --- Éditeur image (rotation / flip / recadrage) ---
    renderBase() {
        if (!srcImage) return;
        const cap = 1400;
        const scale = Math.min(1, cap / Math.max(srcImage.naturalWidth, srcImage.naturalHeight));
        const iw = Math.max(1, Math.round(srcImage.naturalWidth * scale));
        const ih = Math.max(1, Math.round(srcImage.naturalHeight * scale));
        const rotated = this.rot % 2 === 1;
        const cw = rotated ? ih : iw;
        const ch = rotated ? iw : ih;
        const cv = document.createElement('canvas');
        cv.width = cw;
        cv.height = ch;
        const ctx = cv.getContext('2d');
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((this.rot * Math.PI) / 2);
        if (this.flipH) ctx.scale(-1, 1);
        ctx.drawImage(srcImage, -iw / 2, -ih / 2, iw, ih);
        ctx.restore();
        baseCanvas = cv;
        this.editorUrl = cv.toDataURL('image/png');
        this.resetCrop();
    },

    rotate(dir) {
        this.rot = (this.rot + dir + 4) % 4;
        this.renderBase();
    },
    flip() {
        this.flipH = !this.flipH;
        this.renderBase();
    },
    resetCrop() {
        this.crop = { x: 0, y: 0, w: 1, h: 1 };
    },

    startCrop(e, mode) {
        const sx = (e.touches ? e.touches[0] : e).clientX;
        const sy = (e.touches ? e.touches[0] : e).clientY;
        const rect = this.$refs.editorImg.getBoundingClientRect();
        const orig = { ...this.crop };
        const min = 0.06;
        const move = (ev) => {
            const cx = (ev.touches ? ev.touches[0] : ev).clientX;
            const cy = (ev.touches ? ev.touches[0] : ev).clientY;
            const dx = (cx - sx) / rect.width;
            const dy = (cy - sy) / rect.height;
            let { x, y, w, h } = orig;
            if (mode === 'move') {
                x = clamp(x + dx, 0, 1 - w);
                y = clamp(y + dy, 0, 1 - h);
            } else {
                if (mode.includes('w')) { const nx = clamp(x + dx, 0, x + w - min); w += x - nx; x = nx; }
                if (mode.includes('e')) { w = clamp(w + dx, min, 1 - x); }
                if (mode.includes('n')) { const ny = clamp(y + dy, 0, y + h - min); h += y - ny; y = ny; }
                if (mode.includes('s')) { h = clamp(h + dy, min, 1 - y); }
            }
            this.crop = { x, y, w, h };
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    },

    // Valide l'édition : recadre, échantillonne, lance l'extraction.
    confirmEdit() {
        if (!baseCanvas) return;
        this.loading = true;
        const bw = baseCanvas.width, bh = baseCanvas.height;
        const cx = clamp(Math.round(this.crop.x * bw), 0, bw - 1);
        const cy = clamp(Math.round(this.crop.y * bh), 0, bh - 1);
        const cw = clamp(Math.round(this.crop.w * bw), 1, bw - cx);
        const ch = clamp(Math.round(this.crop.h * bh), 1, bh - cy);
        const max = 700;
        const s = Math.min(1, max / Math.max(cw, ch));
        const w = Math.max(1, Math.round(cw * s));
        const h = Math.max(1, Math.round(ch * s));
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(baseCanvas, cx, cy, cw, ch, 0, 0, w, h);
        this._imageData = ctx.getImageData(0, 0, w, h).data;
        this._imgW = w;
        this._imgH = h;
        srcCanvas = cv;
        this.thumbUrl = cv.toDataURL('image/png');
        this.buildFromImage();
        this.loading = false;
        this.screen = 'result';
    },

    editAgain() {
        this.screen = 'edit';
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

    // Coordonnées normalisées du curseur dans l'image (rect réel de l'<img>).
    cursorFraction(e) {
        const rect = this.$refs.srcImg.getBoundingClientRect();
        return {
            fx: (e.clientX - rect.left) / rect.width,
            fy: (e.clientY - rect.top) / rect.height,
            cx: e.clientX - rect.left,
            cy: e.clientY - rect.top,
        };
    },

    onImageMove(e) {
        if (!this.pickMode || !this._imageData) return;
        const { fx, fy, cx, cy } = this.cursorFraction(e);
        if (fx < 0 || fx > 1 || fy < 0 || fy > 1) {
            this.loupe.show = false;
            return;
        }
        this.loupe.show = true;
        this.loupe.x = cx;
        this.loupe.y = cy;
        this.loupe.hex = this.pixelAt(fx, fy);
        this.drawLoupe(fx, fy);
    },

    // Dessine la loupe sur un canvas : zoom pixel-perfect, la cellule centrale
    // entourée = exactement le pixel sous le curseur (la source de vérité).
    drawLoupe(fx, fy) {
        const lc = this.$refs.loupe;
        if (!lc || !srcCanvas) return;
        const w = this._imgW, h = this._imgH;
        const px = clamp(Math.round(fx * w), 0, w - 1);
        const py = clamp(Math.round(fy * h), 0, h - 1);
        const cells = 11;
        const half = (cells - 1) / 2;
        const sx = clamp(px - half, 0, Math.max(0, w - cells));
        const sy = clamp(py - half, 0, Math.max(0, h - cells));
        const ctx = lc.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, lc.width, lc.height);
        ctx.drawImage(srcCanvas, sx, sy, cells, cells, 0, 0, lc.width, lc.height);
        const cell = lc.width / cells;
        const rx = (px - sx) * cell;
        const ry = (py - sy) * cell;
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,.55)';
        ctx.strokeRect(rx + 0.5, ry + 0.5, cell - 1, cell - 1);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(rx + 1.5, ry + 1.5, cell - 3, cell - 3);
    },

    onImageClick(e) {
        if (!this.pickMode || !this._imageData) return;
        const { fx, fy } = this.cursorFraction(e);
        if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
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
    downloadSvg() { downloadBlob('palette.svg', toSvg(this.colors), 'image/svg+xml'); },
    downloadHtml() { downloadBlob('palette.html', toHtml(this.colors), 'text/html'); },
    downloadPdf() { downloadBlob('palette.pdf', toPdf(this.colors), 'application/pdf'); },

    // Poster PNG partageable (rendu canvas).
    async downloadPng() {
        const c = this.colors;
        if (!c.length) return;
        if (document.fonts?.ready) { try { await document.fonts.ready; } catch (e) { /* fallback police système */ } }
        const W = 1200, headH = 116, barsH = 600, footH = 84, H = headH + barsH + footH;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FAFAF7';
        ctx.fillRect(0, 0, W, H);
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#1C1C1E';
        ctx.font = '600 36px "Space Grotesk", sans-serif';
        ctx.fillText('ColorPalette4Me', 48, 70);
        ctx.fillStyle = '#6B6B73';
        ctx.font = '400 16px Inter, sans-serif';
        ctx.fillText(`${c.length} couleurs · rampe 50→950 · une image, une palette`, 48, 96);

        const bw = W / c.length;
        c.forEach((col, i) => {
            const x = i * bw;
            ctx.fillStyle = col.hex;
            ctx.fillRect(x, headH, Math.ceil(bw), barsH);
            ctx.fillStyle = this.fg(col.hex);
            ctx.font = '600 22px "Space Grotesk", sans-serif';
            ctx.fillText(col.hex, x + 20, headH + barsH - 56);
            ctx.font = '500 12px Inter, sans-serif';
            ctx.globalAlpha = 0.75;
            ctx.fillText(col.role.toUpperCase(), x + 20, headH + barsH - 34);
            ctx.globalAlpha = 1;
        });

        ctx.fillStyle = '#6B6B73';
        ctx.font = '400 14px Inter, sans-serif';
        ctx.fillText('Généré par ColorPalette4Me — Projet #07/52 · Sprint Factory', 48, H - 32);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'palette.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
    },

    // --- Assistant IA : ouvre la charte dans ChatGPT / Claude ---
    get aiPrompt() {
        return toPrompt(this.colors);
    },
    openInChatGPT() {
        window.open('https://chatgpt.com/?q=' + encodeURIComponent(this.aiPrompt), '_blank');
    },
    openInClaude() {
        window.open('https://claude.ai/new?q=' + encodeURIComponent(this.aiPrompt), '_blank');
    },
    copyPrompt() {
        this.copy(this.aiPrompt, 'prompt');
    },

    // Liste de HEX brute — universelle (Canva Brand Kit, Notion, n'importe quel outil).
    copyHexList() {
        this.copy(this.colors.map((c) => c.hex).join('  '), 'hexlist');
    },

    downloadAll() {
        const files = [
            { name: 'tailwind.config.js', data: toTailwind(this.colors) },
            { name: 'variables.css', data: toCssVars(this.colors) },
            { name: 'variables.scss', data: toScss(this.colors) },
            { name: '_bootstrap-overrides.scss', data: toBootstrap(this.colors) },
            { name: 'tokens.json', data: toTokensJson(this.colors) },
            { name: 'palette.ase', data: toAse(this.colors) },
            { name: 'palette.svg', data: toSvg(this.colors) },
            { name: 'palette.html', data: toHtml(this.colors) },
            { name: 'palette.pdf', data: toPdf(this.colors) },
            { name: 'README.txt', data: 'Palette générée avec ColorPalette4Me — Projet #07/52 · Sprint Factory\nUne image entre, ta palette sort.\n' },
        ];
        downloadBlob('colorpalette4me.zip', toZip(files), 'application/zip');
    },
}));

window.Alpine = Alpine;
Alpine.start();
