{{-- IMAGE SOURCE : marqueurs d'origine (style Pantone) + pipette zoomée --}}
<div class="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5 items-start">

    <div>
        <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-4 pb-3 border-b border-ink-alt/12 flex justify-between items-baseline flex-wrap gap-1">
            <span>Image source</span>
            <span class="font-body normal-case tracking-normal text-[12px] text-ink-alt">survole un point · pipette pour piocher</span>
        </div>

        <div class="relative rounded-2xl overflow-hidden border border-ink-alt/12 select-none"
            :class="pickMode ? 'cursor-none ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''"
            @mousemove="onImageMove($event)"
            @mouseleave="loupe.show = false"
            @click="onImageClick($event)">

            <img x-ref="srcImg" :src="thumbUrl" class="w-full block pointer-events-none" alt="Image source de la palette">

            {{-- Bouton pipette flottant --}}
            <button @click.stop="togglePick()"
                class="absolute top-3 right-3 z-20 flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,.18)] transition-all border"
                :class="pickMode ? 'bg-accent text-white border-accent' : 'bg-white/90 text-ink border-white/60 hover:bg-white'">
                <span class="w-6 h-6 rounded-full flex items-center justify-center" :class="pickMode ? 'bg-white/25' : 'bg-accent/12'">
                    <svg class="icon w-[15px] h-[15px]" :class="pickMode ? 'stroke-white' : 'stroke-accent'" viewBox="0 0 24 24"><path d="M19 3a2.8 2.8 0 0 0-4 0l-2 2 4 4 2-2a2.8 2.8 0 0 0 0-4z"/><path d="M13 7L4 16v4h4l9-9"/></svg>
                </span>
                <span class="text-[13px] font-semibold" x-text="pickMode ? 'Active' : 'Pipette'"></span>
            </button>

            {{-- Marqueurs Pantone des couleurs extraites --}}
            <template x-for="(c, i) in colors" :key="'mk' + i">
                <div x-show="c.x !== null"
                    class="group absolute -translate-x-1/2 -translate-y-1/2 z-10 hover:z-[60]"
                    :class="pickMode ? 'pointer-events-none' : ''"
                    :style="{ left: (c.x * 100) + '%', top: (c.y * 100) + '%' }">
                    <span class="block w-5 h-5 rounded-full border-2 border-white shadow-[0_1px_5px_rgba(0,0,0,.45)] transition-transform duration-150 group-hover:scale-125 cursor-pointer"
                        :style="{ background: c.hex }"
                        @click.stop="copy(c.hex, 'mk' + i)"></span>

                    {{-- Vignette Pantone --}}
                    <div class="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+10px)] w-[108px] rounded-lg overflow-hidden bg-white shadow-[0_8px_24px_rgba(0,0,0,.22)] opacity-0 scale-95 origin-bottom pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:scale-100">
                        <div class="h-14" :style="{ background: c.hex }"></div>
                        <div class="px-2.5 py-2">
                            <div class="font-mono text-[12px] font-semibold text-ink" x-text="copied === ('mk' + i) ? 'Copié !' : c.hex"></div>
                            <div class="text-[10px] uppercase tracking-[1px] text-ink-alt mt-0.5" x-text="c.role"></div>
                        </div>
                        <span class="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white rotate-45"></span>
                    </div>
                </div>
            </template>

            {{-- Loupe pipette : centrée sur le curseur, réticule = pixel piqué --}}
            <div x-show="loupe.show && pickMode" x-cloak
                class="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex flex-col items-center"
                :style="{ left: loupe.x + 'px', top: loupe.y + 'px' }">
                <canvas x-ref="loupe" width="132" height="132"
                    class="w-[110px] h-[110px] rounded-full border-[3px] border-white shadow-[0_4px_18px_rgba(0,0,0,.4)] bg-white"
                    style="image-rendering: pixelated;"></canvas>
                <span class="mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold text-white bg-ink/85 shadow-sm" x-text="loupe.hex"></span>
            </div>
        </div>

        <p class="text-[12px] text-ink-alt mt-3 flex items-center gap-1.5" x-show="pickMode" x-transition>
            <svg class="icon w-3.5 h-3.5 stroke-accent" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
            Survole pour zoomer, clique pour ajouter la couleur à ta palette.
        </p>
    </div>

    {{-- Harmonie : dégradé + swatches Pantone --}}
    <div>
        <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-4 pb-3 border-b border-ink-alt/12 flex justify-between items-baseline">
            <span>Harmonie</span>
            <span class="font-body normal-case tracking-normal text-[12px] text-ink-alt">aperçu fondu de la palette</span>
        </div>
        <div class="h-[120px] rounded-2xl border border-ink-alt/12"
            :style="{ background: 'linear-gradient(120deg, ' + colors.map(c => c.hex).join(', ') + ')' }"></div>
        <div class="flex gap-1.5 mt-2.5">
            <template x-for="(c, i) in colors" :key="'sw' + i">
                <div class="group relative flex-1 z-0 hover:z-30">
                    <div class="h-9 rounded-lg cursor-pointer transition-transform group-hover:-translate-y-0.5" :style="{ background: c.hex }" @click="copy(c.hex, 'sw' + i)"></div>
                    <div class="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] w-[100px] rounded-lg overflow-hidden bg-white shadow-[0_8px_24px_rgba(0,0,0,.22)] opacity-0 scale-95 origin-bottom pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-20">
                        <div class="h-10" :style="{ background: c.hex }"></div>
                        <div class="px-2 py-1.5 text-center">
                            <div class="font-mono text-[11px] font-semibold text-ink" x-text="copied === ('sw' + i) ? 'Copié !' : c.hex"></div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</div>
