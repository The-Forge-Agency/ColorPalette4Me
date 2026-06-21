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
</div>
