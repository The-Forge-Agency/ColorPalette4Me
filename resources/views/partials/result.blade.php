{{-- ÉCRAN RÉSULTAT --}}
<section x-show="screen === 'result'" x-transition.opacity style="display:none">

    {{-- CHOIX DE LA VARIANTE --}}
    <div class="max-w-[1180px] mx-auto px-5 sm:px-2 mt-2">
        <div class="flex items-center gap-2 mb-2.5">
            <span class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px]">Choisis ton style</span>
            <span class="text-[12px] text-ink-alt">— 3 façons de lire la même image</span>
        </div>
        <div class="grid grid-cols-3 gap-2.5">
            @php
                $variantList = [
                    ['dominant', 'Dominantes', 'Les plus présentes'],
                    ['balanced', 'Équilibré', 'Base + accents'],
                    ['vibrant', 'Vibrant', 'Max de diversité'],
                ];
            @endphp
            @foreach ($variantList as [$val, $label, $hint])
                <button @click="selectVariant('{{ $val }}')"
                    class="rounded-2xl border p-3 text-left transition-all"
                    :class="activeMode === '{{ $val }}' ? 'border-accent bg-accent/6 shadow-[0_2px_12px_rgba(109,91,255,.12)]' : 'border-ink-alt/15 bg-white hover:border-accent/40'">
                    <div class="flex h-7 rounded-lg overflow-hidden mb-2">
                        <template x-for="(c, i) in variants['{{ $val }}']" :key="i">
                            <div class="flex-1" :style="{ background: c.hex }"></div>
                        </template>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>
                            <span class="block font-title text-[13px] font-semibold leading-tight" :class="activeMode === '{{ $val }}' ? 'text-accent' : 'text-ink'">{{ $label }}</span>
                            <span class="hidden sm:block text-[11px] text-ink-alt">{{ $hint }}</span>
                        </span>
                        <span x-show="activeMode === '{{ $val }}'" class="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <svg class="icon w-2.5 h-2.5 stroke-white" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg>
                        </span>
                    </div>
                </button>
            @endforeach
        </div>
    </div>

    {{-- BARRES STYLE COOLORS --}}
    <div class="flex h-[260px] sm:h-[300px] max-w-[1180px] mx-auto mt-3 sm:rounded-[18px] overflow-hidden shadow-[0_4px_24px_rgba(28,28,30,0.06)]">
        <template x-for="(c, i) in colors" :key="c.role + i">
            <div
                class="flex-1 flex flex-col items-center justify-end pb-5 relative transition-[flex] group"
                :style="{ background: c.hex, color: fg(c.hex) }"
                draggable="true"
                @dragstart="onBarDragStart(i)"
                @dragover.prevent
                @drop.prevent="onBarDrop(i)">

                <span class="absolute top-3 left-0 right-0 text-center text-[13px] tracking-[1px] opacity-50 cursor-grab select-none">⠿</span>

                <button @click="toggleLock(i)" class="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-opacity"
                    :style="{ background: 'color-mix(in srgb, ' + fg(c.hex) + ' 15%, transparent)' }"
                    :aria-label="c.locked ? 'Déverrouiller' : 'Verrouiller'">
                    <template x-if="c.locked">
                        <svg class="icon w-[15px] h-[15px]" :style="{ stroke: fg(c.hex) }" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                    </template>
                    <template x-if="!c.locked">
                        <svg class="icon w-[15px] h-[15px] opacity-55 group-hover:opacity-100" :style="{ stroke: fg(c.hex) }" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 4-4 4 4 0 0 1 3.5 2"/></svg>
                    </template>
                </button>

                <span class="font-title text-[15px] sm:text-[17px] font-semibold tracking-[0.5px] cursor-pointer"
                    @click="copy(c.hex, 'bar-' + i)"
                    x-text="copied === ('bar-' + i) ? 'Copié !' : c.hex.replace('#','')"></span>
                <span class="text-[11px] mt-1 opacity-70 uppercase tracking-[1px]" x-text="c.role"></span>

                <div class="flex gap-2 mt-3.5">
                    <button @click="copy(c.hex, 'bar-' + i)" class="w-7 h-7 rounded-lg flex items-center justify-center" :style="{ background: 'color-mix(in srgb, ' + fg(c.hex) + ' 15%, transparent)' }" aria-label="Copier">
                        <svg class="icon w-[15px] h-[15px]" :style="{ stroke: fg(c.hex) }" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>
                    </button>
                    <button x-show="colors.length > 3" @click="removeColor(i)" class="w-7 h-7 rounded-lg flex items-center justify-center" :style="{ background: 'color-mix(in srgb, ' + fg(c.hex) + ' 15%, transparent)' }" aria-label="Retirer">
                        <svg class="icon w-[15px] h-[15px]" :style="{ stroke: fg(c.hex) }" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
                    </button>
                </div>
            </div>
        </template>

        <button x-show="colors.length < 10" @click="addColor()"
            class="w-12 sm:w-14 flex items-center justify-center bg-bg-alt hover:bg-accent/10 transition-colors border-l border-ink-alt/10" aria-label="Ajouter une couleur">
            <svg class="icon w-5 h-5 stroke-ink-alt" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
    </div>

    {{-- TOOLBAR --}}
    <div class="max-w-[1180px] mx-auto mt-5 px-5 sm:px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
            <img :src="thumbUrl" class="w-[46px] h-[46px] rounded-[10px] object-cover border border-ink-alt/15" alt="">
            <div class="text-[13px]">
                <strong class="font-title font-semibold" x-text="fileName"></strong>
                <small class="block text-ink-alt mt-0.5"><span x-text="colors.length"></span> couleurs · OKLCH · <kbd class="font-mono text-[11px]">espace</kbd> régénère · glisse pour réordonner</small>
            </div>
        </div>
        <div class="flex flex-wrap gap-2.5">
            <button class="btn" @click="addColor()" x-show="colors.length < 10">
                <svg class="icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Ajouter
            </button>
            <button class="btn" @click="reroll()">
                <svg class="icon" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg> Régénérer
            </button>
            <button class="btn" @click="reset()">
                <svg class="icon" viewBox="0 0 24 24"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg> Nouvelle image
            </button>
            <button class="btn primary" @click="downloadAll()">
                <svg class="icon" viewBox="0 0 24 24"><path d="M12 4v12M8 12l4 4 4-4"/><path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/></svg> Tout télécharger
            </button>
        </div>
    </div>

    <div class="max-w-[1180px] mx-auto px-5 sm:px-2 pt-8 pb-16">

        @include('partials.source')

        {{-- CARDS DÉTAIL --}}
        <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-4">Valeurs par couleur · copie au clic</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <template x-for="(c, i) in colors" :key="'card' + c.role + i">
                <div class="bg-white border border-ink-alt/10 rounded-2xl overflow-hidden">
                    <div class="h-16" :style="{ background: c.hex }"></div>
                    <div class="px-4 pt-3.5 pb-4">
                        <div class="flex items-center justify-between mb-3">
                            <b class="font-title text-[14px] font-semibold" x-text="c.role"></b>
                            <span class="w-3 h-3 rounded-full border border-black/5" :style="{ background: c.hex }"></span>
                        </div>
                        <div class="flex flex-col gap-[7px]">
                            <template x-for="row in [['HEX', c.desc.hex],['RGB', c.desc.rgb],['HSL', c.desc.hsl],['OKLCH', c.desc.oklch]]" :key="row[0]">
                                <div class="flex items-center justify-between">
                                    <span class="text-ink-alt text-[11px] uppercase tracking-[0.5px]" x-text="row[0]"></span>
                                    <span class="flex items-center gap-2 font-mono text-[12.5px]">
                                        <span x-text="row[1]"></span>
                                        <button @click="copy(row[1], 'val' + i + row[0])" class="cursor-pointer" :aria-label="'Copier ' + row[0]">
                                            <template x-if="copied === ('val' + i + row[0])">
                                                <svg class="icon w-[13px] h-[13px] stroke-accent" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10"/></svg>
                                            </template>
                                            <template x-if="copied !== ('val' + i + row[0])">
                                                <svg class="icon w-[13px] h-[13px] stroke-ink-alt" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>
                                            </template>
                                        </button>
                                    </span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        {{-- RAMPES --}}
        <div class="mt-12">
            <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-4 pb-3 border-b border-ink-alt/12 flex justify-between items-baseline flex-wrap gap-1">
                <span>Rampe complète 50 → 950</span>
                <span class="font-body normal-case tracking-normal text-[12px] text-ink-alt">calibrée façon Tailwind · 11 nuances par couleur</span>
            </div>
            <template x-for="(c, i) in colors" :key="'ramp' + c.role + i">
                <div class="mb-4">
                    <div class="flex items-center gap-2 mb-1.5">
                        <b class="font-title text-[14px] font-semibold" x-text="c.role"></b>
                        <span class="font-mono text-[11px] text-ink-alt">base 500 · <span x-text="c.hex"></span></span>
                    </div>
                    <div class="flex gap-1">
                        <template x-for="[step, hex] in Object.entries(c.ramp)" :key="step">
                            <div class="flex-1 cursor-pointer" @click="copy(hex, 'ramp' + i + step)">
                                <div class="h-11 rounded-lg" :style="{ background: hex }"></div>
                                <div class="font-mono text-[10.5px] text-center mt-1.5" :class="step === '500' ? 'text-accent font-semibold' : 'text-ink-alt'" x-text="copied === ('ramp' + i + step) ? '✓' : step"></div>
                            </div>
                        </template>
                    </div>
                </div>
            </template>
        </div>

        {{-- DESIGN SYSTEM LIVE + CONTRASTE --}}
        <div class="mt-12 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5 items-start">

            @include('partials.preview')

            <div>
                <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-4 pb-3 border-b border-ink-alt/12 flex justify-between items-baseline">
                    <span>Contraste WCAG</span>
                    <span class="font-body normal-case tracking-normal text-[12px] text-ink-alt">ratio + niveau</span>
                </div>
                <div class="bg-white border border-ink-alt/10 rounded-2xl px-5 py-2">
                    <template x-for="(row, i) in contrastRows" :key="'c' + i">
                        <div class="flex items-center justify-between py-3 border-b border-ink-alt/8 last:border-0">
                            <div class="flex items-center gap-3">
                                <div class="w-[46px] h-8 rounded-lg flex items-center justify-center font-title text-[13px] font-bold border border-black/5" :style="{ background: row.bg, color: row.text }">Aa</div>
                                <div class="text-[13px]">
                                    <span x-text="row.label + ' sur ' + row.role"></span>
                                    <small class="block text-ink-alt font-mono text-[11px] mt-px"><span x-text="row.text === '#FFFFFF' ? '#FFF' : '#1C1C1E'"></span> / <span x-text="row.bg"></span></small>
                                </div>
                            </div>
                            <div class="flex items-center gap-2.5">
                                <span class="font-mono text-[13px]" x-text="row.ratio + ':1'"></span>
                                <span class="text-[11px] font-bold px-2 py-1 rounded-md tracking-[0.3px]"
                                    :class="{
                                        'bg-[#2fb8a4]/15 text-[#1f8d7e]': row.level === 'AAA',
                                        'bg-accent/12 text-[#5546d6]': row.level === 'AA',
                                        'bg-[#e2a86d]/18 text-[#a9701f]': row.level === 'AA-large',
                                        'bg-[#e26d9a]/16 text-[#c44676]': row.level === 'fail'
                                    }"
                                    x-text="row.level === 'fail' ? 'Échoue' : (row.level === 'AA-large' ? 'AA large' : row.level)"></span>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        {{-- EXPORTS --}}
        @include('partials.exports')

        {{-- BOTTOM CTA --}}
        <div class="mt-14 text-center pt-8 border-t border-ink-alt/12">
            <button class="btn primary mx-auto" @click="downloadAll()">
                <svg class="icon" viewBox="0 0 24 24"><path d="M12 4v12M8 12l4 4 4-4"/><path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/></svg> Tout télécharger (.zip)
            </button>
            <p class="text-[13px] text-ink-alt mt-3.5">Généré par <span class="text-accent">ColorPalette4Me</span> — Projet #07/52 · Sprint Factory</p>
        </div>
    </div>

</section>
