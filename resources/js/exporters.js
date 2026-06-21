// Génération des fichiers d'export 100% côté client.
// `colors` = [{ role, key, hex, ramp: {50..950} }]

import { hexToRgb } from './color-engine.js';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// --- tailwind.config.js ---
export function toTailwind(colors) {
    const lines = ['/** @type {import("tailwindcss").Config} */', 'module.exports = {', '  theme: {', '    extend: {', '      colors: {'];
    for (const c of colors) {
        lines.push(`        ${c.key}: {`);
        const rows = STEPS.map((s) => `          ${s}: '${c.ramp[s]}',`);
        lines.push(...rows);
        lines.push('        },');
    }
    lines.push('      },', '    },', '  },', '};', '');
    return lines.join('\n');
}

// --- variables.css (:root) ---
export function toCssVars(colors) {
    const lines = [':root {'];
    for (const c of colors) {
        lines.push(`  /* ${c.role} */`);
        for (const s of STEPS) {
            lines.push(`  --color-${c.key}-${s}: ${c.ramp[s]};`);
        }
    }
    lines.push('}', '');
    return lines.join('\n');
}

// --- tokens.json (format W3C Design Tokens, compatible Figma) ---
export function toTokensJson(colors) {
    const tokens = { color: {} };
    for (const c of colors) {
        tokens.color[c.key] = {};
        for (const s of STEPS) {
            tokens.color[c.key][s] = { $value: c.ramp[s], $type: 'color' };
        }
    }
    return JSON.stringify(tokens, null, 2) + '\n';
}

// --- variables.scss ---
export function toScss(colors) {
    const lines = ['// Variables SCSS — ColorPalette4Me'];
    for (const c of colors) {
        lines.push('', `// ${c.role}`);
        for (const s of STEPS) {
            lines.push(`$${c.key}-${s}: ${c.ramp[s]};`);
        }
        lines.push(`$${c.key}: $${c.key}-500;`);
    }
    lines.push('', '$palette: (');
    for (const c of colors) {
        const entries = STEPS.map((s) => `"${s}": $${c.key}-${s}`).join(', ');
        lines.push(`  "${c.key}": (${entries}),`);
    }
    lines.push(');', '');
    return lines.join('\n');
}

// --- _bootstrap-overrides.scss (Bootstrap 5) ---
const BS_MAP = [
    ['primary', 'primary'],
    ['secondary', 'secondary'],
    ['accent', 'info'],
    ['support', 'success'],
    ['surface', 'light'],
    ['ink', 'dark'],
];
export function toBootstrap(colors) {
    const byKey = Object.fromEntries(colors.map((c) => [c.key, c]));
    const lines = [
        '// Bootstrap 5 overrides — ColorPalette4Me',
        '// À importer AVANT "bootstrap/scss/bootstrap".',
        '',
    ];
    const themeColors = [];
    for (const [role, bsName] of BS_MAP) {
        const c = byKey[role];
        if (!c) continue;
        lines.push(`$${bsName}: ${c.ramp[500]};`);
        themeColors.push(`  "${bsName}": $${bsName},`);
    }
    // Couleurs supplémentaires gardées telles quelles dans la map de thème.
    for (const c of colors) {
        if (BS_MAP.some(([r]) => r === c.key)) continue;
        lines.push(`$${c.key}: ${c.ramp[500]};`);
        themeColors.push(`  "${c.key}": $${c.key},`);
    }
    lines.push('', '$theme-colors: (', ...themeColors, ');', '');
    return lines.join('\n');
}

// --- palette.svg (feuille vectorielle — se glisse dans Figma / Illustrator) ---
export function toSvg(colors) {
    const pad = 32, rowH = 96, swW = 150, chipH = 30, headH = 92;
    const width = 960;
    const height = headH + colors.length * rowH + pad;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const parts = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Inter, sans-serif">`,
        `<rect width="${width}" height="${height}" fill="#FAFAF7"/>`,
        `<text x="${pad}" y="48" font-size="26" font-weight="700" fill="#1C1C1E" font-family="Space Grotesk, sans-serif">ColorPalette4Me</text>`,
        `<text x="${pad}" y="72" font-size="13" fill="#6B6B73">${colors.length} couleurs · rampe 50→950</text>`,
    ];
    colors.forEach((c, i) => {
        const y = headH + i * rowH;
        parts.push(`<rect x="${pad}" y="${y}" width="${swW}" height="64" rx="10" fill="${c.hex}"/>`);
        parts.push(`<text x="${pad + 12}" y="${y + 26}" font-size="14" font-weight="600" fill="#fff" font-family="Space Grotesk, sans-serif">${esc(c.role)}</text>`);
        parts.push(`<text x="${pad + 12}" y="${y + 46}" font-size="12" fill="#fff" font-family="monospace">${esc(c.hex)}</text>`);
        const rx0 = pad + swW + 18;
        const cw = (width - pad - rx0) / STEPS.length;
        STEPS.forEach((step, j) => {
            const x = rx0 + j * cw;
            parts.push(`<rect x="${x.toFixed(1)}" y="${y}" width="${(cw - 4).toFixed(1)}" height="${chipH}" rx="5" fill="${c.ramp[step]}"/>`);
            parts.push(`<text x="${(x + (cw - 4) / 2).toFixed(1)}" y="${y + chipH + 16}" font-size="9" fill="#6B6B73" text-anchor="middle" font-family="monospace">${step}</text>`);
        });
    });
    parts.push('</svg>');
    return parts.join('\n');
}

// --- palette.html (styleguide autonome, s'ouvre dans le navigateur) ---
export function toHtml(colors) {
    const card = (c) => `
    <section class="ramp">
      <header><span class="dot" style="background:${c.hex}"></span><b>${c.role}</b><code>${c.hex}</code></header>
      <div class="strip">${STEPS.map((s) => `<div class="chip"><span style="background:${c.ramp[s]}"></span><small>${s}</small><em>${c.ramp[s]}</em></div>`).join('')}</div>
    </section>`;
    return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Palette — ColorPalette4Me</title>
<style>
:root{--bg:#FAFAF7;--ink:#1C1C1E;--alt:#6B6B73;--accent:#6D5BFF}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--ink);font-family:Inter,system-ui,sans-serif;padding:40px 24px;max-width:1100px;margin:0 auto}
h1{font-size:30px;letter-spacing:-1px}h1 span{color:var(--accent)}p.sub{color:var(--alt);margin:6px 0 28px}
.ramp{background:#fff;border:1px solid #6b6b7322;border-radius:16px;padding:18px;margin-bottom:14px}
.ramp header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.ramp .dot{width:14px;height:14px;border-radius:50%}.ramp b{font-size:15px}.ramp code{margin-left:auto;color:var(--alt);font-family:monospace;font-size:13px}
.strip{display:grid;grid-template-columns:repeat(11,1fr);gap:6px}
.chip span{display:block;height:46px;border-radius:8px}.chip small{display:block;text-align:center;color:var(--alt);font-size:10px;margin-top:5px}
.chip em{display:block;text-align:center;color:var(--alt);font-family:monospace;font-size:9px;font-style:normal}
footer{color:var(--alt);font-size:12px;text-align:center;margin-top:28px}
</style></head>
<body>
<h1>Ta <span>palette</span></h1>
<p class="sub">${colors.length} couleurs · rampe 50→950 · généré par ColorPalette4Me</p>
${colors.map(card).join('')}
<footer>Généré par ColorPalette4Me — Projet #07/52 · Sprint Factory</footer>
</body></html>
`;
}

// --- palette.pdf (fiche imprimable, PDF vectoriel écrit à la main) ---
function pdfStr(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function pdfRect(hex, x, y, w, h) {
    const { r, g, b } = hexToRgb(hex);
    const f = (n) => (n / 255).toFixed(3);
    return `${f(r)} ${f(g)} ${f(b)} rg ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`;
}
export function toPdf(colors) {
    const W = 595, H = 842, M = 42;
    const ops = [];
    ops.push(`0.98 0.98 0.969 rg 0 0 ${W} ${H} re f`);
    ops.push(`0.11 0.11 0.118 rg BT /F1 22 Tf ${M} ${H - M - 6} Td (ColorPalette4Me) Tj ET`);
    ops.push(`0.42 0.42 0.45 rg BT /F1 11 Tf ${M} ${H - M - 26} Td (Palette generee - ${colors.length} couleurs - rampe 50 a 950) Tj ET`);
    const swW = 120, rowH = 78;
    let y = H - M - 64;
    for (const c of colors) {
        ops.push(pdfRect(c.hex, M, y - 46, swW, 46));
        ops.push(`0.11 0.11 0.118 rg BT /F1 12 Tf ${M} ${y - 62} Td (${pdfStr(c.role)}  ${pdfStr(c.hex)}) Tj ET`);
        const rx0 = M + swW + 16;
        const cw = (W - M - rx0) / STEPS.length;
        STEPS.forEach((step, j) => ops.push(pdfRect(c.ramp[step], rx0 + j * cw, y - 46, cw - 3, 46)));
        y -= rowH;
    }
    ops.push(`0.42 0.42 0.45 rg BT /F1 9 Tf ${M} ${M} Td (Genere par ColorPalette4Me - Projet #07/52 - Sprint Factory) Tj ET`);
    const content = ops.join('\n');

    const objs = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objs.forEach((body, i) => {
        offsets.push(pdf.length);
        pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((o) => { pdf += String(o).padStart(10, '0') + ' 00000 n \n'; });
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return new TextEncoder().encode(pdf);
}

// --- Prompt IA (résumé de la charte, prêt pour ChatGPT / Claude) ---
export function toPrompt(colors) {
    const lines = [
        'Voici une charte graphique que je viens de générer à partir d\'une image avec ColorPalette4Me.',
        '',
        'Palette (rôle · HEX) :',
    ];
    for (const c of colors) {
        lines.push(`- ${c.role} · ${c.hex}`);
    }
    lines.push('', 'Rampes (50 → 950) :');
    for (const c of colors) {
        lines.push(`- ${c.key}: ${STEPS.map((s) => `${s} ${c.ramp[s]}`).join(', ')}`);
    }
    lines.push(
        '',
        'Utilise cette palette pour m\'aider à concevoir mon interface. Respecte les rôles :',
        'Primary = action principale / liens, Accent = mises en avant, Support = succès/secondaire,',
        'Surface = fonds clairs, Ink = texte. Garde des contrastes accessibles (WCAG AA minimum).',
        '',
        'Pour commencer, propose-moi un thème cohérent (tokens + exemples de composants : boutons,',
        'cartes, formulaire, badges) en utilisant ces couleurs.'
    );
    return lines.join('\n');
}

// --- Écriture binaire utilitaire ---
class ByteBuffer {
    constructor() { this.bytes = []; }
    u8(v) { this.bytes.push(v & 0xff); }
    u16be(v) { this.u8(v >> 8); this.u8(v); }
    u32be(v) { this.u8(v >>> 24); this.u8(v >>> 16); this.u8(v >>> 8); this.u8(v); }
    u16le(v) { this.u8(v); this.u8(v >> 8); }
    u32le(v) { this.u8(v); this.u8(v >> 8); this.u8(v >> 16); this.u8(v >>> 24); }
    f32be(v) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setFloat32(0, v, false);
        const u = new Uint8Array(buf);
        for (let i = 0; i < 4; i++) this.u8(u[i]);
    }
    strUtf16be(str) {
        for (let i = 0; i < str.length; i++) this.u16be(str.charCodeAt(i));
    }
    raw(arr) { for (const v of arr) this.u8(v); }
    toUint8Array() { return new Uint8Array(this.bytes); }
}

// --- palette.ase (Adobe Swatch Exchange) ---
export function toAse(colors) {
    const buf = new ByteBuffer();
    buf.raw([0x41, 0x53, 0x45, 0x46]); // "ASEF"
    buf.u16be(1); // version major
    buf.u16be(0); // version minor

    let blockCount = 0;
    for (const c of colors) blockCount += 2 + STEPS.length; // group start + entries + group end

    buf.u32be(blockCount);

    const writeName = (b, name) => {
        const len = name.length + 1; // + null terminator (en code units)
        b.u16be(len);
        b.strUtf16be(name);
        b.u16be(0);
    };

    for (const c of colors) {
        // Bloc "group start" (0xc001)
        const g = new ByteBuffer();
        writeName(g, c.role);
        const gd = g.toUint8Array();
        buf.u16be(0xc001);
        buf.u32be(gd.length);
        buf.raw(gd);

        // Entrées couleur (0x0001)
        for (const s of STEPS) {
            const e = new ByteBuffer();
            writeName(e, `${c.key}-${s}`);
            e.raw([0x52, 0x47, 0x42, 0x20]); // "RGB "
            const { r, g: gg, b } = hexToRgb(c.ramp[s]);
            e.f32be(r / 255);
            e.f32be(gg / 255);
            e.f32be(b / 255);
            e.u16be(0); // type global
            const ed = e.toUint8Array();
            buf.u16be(0x0001);
            buf.u32be(ed.length);
            buf.raw(ed);
        }

        // Bloc "group end" (0xc002), sans données
        buf.u16be(0xc002);
        buf.u32be(0);
    }

    return buf.toUint8Array();
}

// --- ZIP (méthode "store", sans compression) ---
const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function toBytes(data) {
    return typeof data === 'string' ? new TextEncoder().encode(data) : data;
}

/**
 * @param {{name: string, data: string|Uint8Array}[]} files
 * @returns {Uint8Array}
 */
export function toZip(files) {
    const central = new ByteBuffer();
    const local = new ByteBuffer();
    const enc = new TextEncoder();
    let offset = 0;
    let entries = 0;

    for (const file of files) {
        const nameBytes = enc.encode(file.name);
        const data = toBytes(file.data);
        const crc = crc32(data);

        // En-tête local
        local.u32le(0x04034b50);
        local.u16le(20);
        local.u16le(0);
        local.u16le(0); // store
        local.u16le(0); // time
        local.u16le(0); // date
        local.u32le(crc);
        local.u32le(data.length);
        local.u32le(data.length);
        local.u16le(nameBytes.length);
        local.u16le(0);
        local.raw(nameBytes);
        local.raw(data);

        // Entrée du répertoire central
        central.u32le(0x02014b50);
        central.u16le(20);
        central.u16le(20);
        central.u16le(0);
        central.u16le(0);
        central.u16le(0);
        central.u16le(0);
        central.u32le(crc);
        central.u32le(data.length);
        central.u32le(data.length);
        central.u16le(nameBytes.length);
        central.u16le(0);
        central.u16le(0);
        central.u16le(0);
        central.u16le(0);
        central.u32le(0);
        central.u32le(offset);
        central.raw(nameBytes);

        offset += 30 + nameBytes.length + data.length;
        entries++;
    }

    const localBytes = local.toUint8Array();
    const centralBytes = central.toUint8Array();

    const end = new ByteBuffer();
    end.u32le(0x06054b50);
    end.u16le(0);
    end.u16le(0);
    end.u16le(entries);
    end.u16le(entries);
    end.u32le(centralBytes.length);
    end.u32le(localBytes.length);
    end.u16le(0);

    const endBytes = end.toUint8Array();
    const out = new Uint8Array(localBytes.length + centralBytes.length + endBytes.length);
    out.set(localBytes, 0);
    out.set(centralBytes, localBytes.length);
    out.set(endBytes, localBytes.length + centralBytes.length);
    return out;
}
