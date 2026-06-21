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
