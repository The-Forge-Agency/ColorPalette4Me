{{-- EXPORTS --}}
<div class="mt-12">
    <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-4 pb-3 border-b border-ink-alt/12 flex justify-between items-baseline flex-wrap gap-1">
        <span>Exports prêts à coller</span>
        <span class="font-body normal-case tracking-normal text-[12px] text-ink-alt">généré côté client · zéro upload</span>
    </div>

    @php
        $tabs = [
            'tailwind' => 'tailwind.config.js',
            'css' => 'variables.css',
            'scss' => 'variables.scss',
            'bootstrap' => '_bootstrap-overrides.scss',
            'json' => 'tokens.json',
            'ase' => 'palette.ase',
        ];
    @endphp

    <div class="flex gap-2 mb-3.5 flex-wrap">
        @foreach ($tabs as $key => $label)
            <button @click="exportTab = '{{ $key }}'"
                class="text-[13px] font-mono px-3.5 py-2 rounded-[9px] border transition-colors"
                :class="exportTab === '{{ $key }}' ? 'bg-ink text-bg border-ink' : 'bg-white text-ink-alt border-ink-alt/18 hover:border-ink-alt/40'">{{ $label }}</button>
        @endforeach
    </div>

    <div class="relative">
        <button @click="copyExport()" class="absolute top-3.5 right-3.5 text-[12px] text-white bg-accent/85 hover:bg-accent px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors z-10">
            <svg class="icon w-[13px] h-[13px] stroke-white" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>
            <span x-text="copied === 'export' ? 'Copié !' : (exportTab === 'ase' ? 'Télécharger' : 'Copier')"></span>
        </button>
        <pre class="bg-ink rounded-[14px] p-5 pr-28 font-mono text-[12.5px] leading-[1.7] text-[#c9c7d1] overflow-x-auto max-h-[420px] no-scrollbar"><code x-text="exportCode"></code></pre>
    </div>

    <div class="flex gap-2.5 flex-wrap mt-4">
        @php
            $chips = [
                ['downloadTailwind()', 'tailwind.config.js', 'rampes 50→950'],
                ['downloadCss()', 'variables.css', ':root custom properties'],
                ['downloadScss()', 'variables.scss', '$vars + map SCSS'],
                ['downloadBootstrap()', '_bootstrap-overrides.scss', '$theme-colors Bootstrap 5'],
                ['downloadJson()', 'tokens.json', 'W3C / compatible Figma'],
                ['downloadAse()', 'palette.ase', 'Adobe Swatch Exchange'],
            ];
        @endphp
        @foreach ($chips as [$action, $name, $desc])
            <button @click="{{ $action }}" class="bg-white border border-ink-alt/14 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 hover:border-accent/40 transition-colors text-left">
                <span class="w-[30px] h-[30px] rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <svg class="icon w-[15px] h-[15px] stroke-accent" viewBox="0 0 24 24"><path d="M12 4v11M8 11l4 4 4-4"/><path d="M5 19h14"/></svg>
                </span>
                <span>
                    <b class="font-title font-semibold text-[13px] block">{{ $name }}</b>
                    <small class="block text-ink-alt text-[11px]">{{ $desc }}</small>
                </span>
            </button>
        @endforeach
    </div>

    {{-- VISUELS & PARTAGE --}}
    <div class="mt-7">
        <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-3">Visuels &amp; partage</div>
        <div class="flex gap-2.5 flex-wrap">
            @php
                $visuals = [
                    ['downloadPng()', 'palette.png', 'Poster partageable', '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/>'],
                    ['downloadSvg()', 'palette.svg', 'Vecteur → Figma / Illustrator', '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><circle cx="12" cy="12" r="3"/>'],
                    ['downloadHtml()', 'palette.html', 'Styleguide autonome', '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>'],
                    ['downloadPdf()', 'palette.pdf', 'Fiche imprimable', '<path d="M6 2h9l5 5v15a0 0 0 0 1 0 0H6a0 0 0 0 1 0 0z"/><path d="M15 2v5h5"/>'],
                ];
            @endphp
            @foreach ($visuals as [$action, $name, $desc, $icon])
                <button @click="{{ $action }}" class="bg-white border border-ink-alt/14 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 hover:border-accent/40 transition-colors text-left">
                    <span class="w-[30px] h-[30px] rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <svg class="icon w-[15px] h-[15px] stroke-accent" viewBox="0 0 24 24">{!! $icon !!}</svg>
                    </span>
                    <span>
                        <b class="font-title font-semibold text-[13px] block">{{ $name }}</b>
                        <small class="block text-ink-alt text-[11px]">{{ $desc }}</small>
                    </span>
                </button>
            @endforeach
        </div>
        <div class="mt-3.5 bg-bg-alt rounded-xl px-4 py-3.5">
            <div class="flex items-center justify-between gap-3 flex-wrap mb-2.5">
                <span class="text-[12.5px] font-semibold">Charte prête pour tes outils</span>
                <button @click="copyHexList()" class="text-[12px] font-medium text-accent flex items-center gap-1.5">
                    <svg class="icon w-3.5 h-3.5 stroke-accent" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>
                    <span x-text="copied === 'hexlist' ? 'HEX copiés !' : 'Copier les HEX'"></span>
                </button>
            </div>
            <ul class="text-[12px] text-ink-alt space-y-1">
                <li><b class="text-ink font-medium">Figma</b> — <code class="font-mono">tokens.json</code> via le plugin Tokens Studio (vraies variables), ou glisse <code class="font-mono">palette.svg</code> dans le fichier.</li>
                <li><b class="text-ink font-medium">Adobe</b> (Illustrator / Photoshop / InDesign) — ouvre <code class="font-mono">palette.ase</code>.</li>
                <li><b class="text-ink font-medium">Canva</b> — pas d'import auto : ajoute les couleurs au Brand Kit en collant les HEX (bouton ci-dessus).</li>
                <li><b class="text-ink font-medium">Code</b> — Tailwind, CSS, SCSS ou Bootstrap selon ta stack.</li>
            </ul>
        </div>
    </div>

    {{-- ASSISTANT IA --}}
    <div class="mt-7">
        <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-3">Continuer avec une IA</div>
        <div class="bg-white border border-ink-alt/12 rounded-2xl p-4">
            <p class="text-[13px] text-ink-alt mb-3">Envoie ta charte (rôles, hex, rampes + consignes d'accessibilité) directement à un assistant pour générer ton thème ou tes composants.</p>
            <div class="flex flex-wrap gap-2.5">
                <button @click="openInClaude()" class="btn primary">
                    <svg class="icon" viewBox="0 0 24 24"><path d="M12 3l2.5 6L21 9l-5 4 2 7-6-4-6 4 2-7-5-4 6.5 0z"/></svg> Ouvrir dans Claude
                </button>
                <button @click="openInChatGPT()" class="btn">
                    <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg> Ouvrir dans ChatGPT
                </button>
                <button @click="copyPrompt()" class="btn">
                    <svg class="icon" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>
                    <span x-text="copied === 'prompt' ? 'Copié !' : 'Copier le prompt'"></span>
                </button>
            </div>
            <pre class="mt-3 bg-bg-alt rounded-xl p-3.5 font-mono text-[11.5px] leading-[1.6] text-ink-alt max-h-[140px] overflow-y-auto no-scrollbar whitespace-pre-wrap" x-text="aiPrompt"></pre>
        </div>
    </div>
</div>
