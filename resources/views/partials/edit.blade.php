{{-- ÉCRAN ÉDITEUR : rotation, flip, recadrage avant extraction --}}
<section x-show="screen === 'edit'" x-transition.opacity style="display:none" class="max-w-[760px] mx-auto px-6 pt-8 pb-16">

    <div class="text-center mb-6">
        <h1 class="font-title text-[26px] sm:text-[32px] font-bold tracking-[-0.8px] mb-1.5">Ajuste ton image</h1>
        <p class="text-[14px] text-ink-alt">Recadre sur la zone qui t'intéresse, tourne si besoin — puis extrais la palette.</p>
    </div>

    {{-- Zone d'édition avec recadrage --}}
    <div class="relative rounded-2xl overflow-hidden border border-ink-alt/12 bg-bg-alt select-none" style="touch-action: none;">
        <img x-ref="editorImg" :src="editorUrl" class="w-full block pointer-events-none" alt="Image à éditer">

        {{-- Rectangle de recadrage (l'extérieur est assombri via box-shadow) --}}
        <div class="absolute border-2 border-white cursor-move"
            :style="{
                left: (crop.x * 100) + '%',
                top: (crop.y * 100) + '%',
                width: (crop.w * 100) + '%',
                height: (crop.h * 100) + '%',
                boxShadow: '0 0 0 9999px rgba(0,0,0,.5)'
            }"
            @pointerdown.stop.prevent="startCrop($event, 'move')">

            {{-- Grille des tiers --}}
            <div class="absolute inset-0 pointer-events-none opacity-60">
                <div class="absolute top-1/3 inset-x-0 border-t border-white/40"></div>
                <div class="absolute top-2/3 inset-x-0 border-t border-white/40"></div>
                <div class="absolute left-1/3 inset-y-0 border-l border-white/40"></div>
                <div class="absolute left-2/3 inset-y-0 border-l border-white/40"></div>
            </div>

            {{-- Poignées de coin --}}
            <span class="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-sm shadow cursor-nwse-resize" @pointerdown.stop.prevent="startCrop($event, 'nw')"></span>
            <span class="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-sm shadow cursor-nesw-resize" @pointerdown.stop.prevent="startCrop($event, 'ne')"></span>
            <span class="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-sm shadow cursor-nesw-resize" @pointerdown.stop.prevent="startCrop($event, 'sw')"></span>
            <span class="absolute -bottom-2 -right-2 w-4 h-4 bg-white rounded-sm shadow cursor-nwse-resize" @pointerdown.stop.prevent="startCrop($event, 'se')"></span>
        </div>
    </div>

    {{-- Outils --}}
    <div class="flex flex-wrap items-center justify-center gap-2.5 mt-4">
        <button class="btn" @click="rotate(-1)" title="Tourner à gauche">
            <svg class="icon" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg> Gauche
        </button>
        <button class="btn" @click="rotate(1)" title="Tourner à droite">
            <svg class="icon" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg> Droite
        </button>
        <button class="btn" @click="flip()" title="Miroir horizontal">
            <svg class="icon" viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M8 7l-4 5 4 5z"/><path d="M16 7l4 5-4 5z"/></svg> Miroir
        </button>
        <button class="btn" @click="resetCrop()" title="Réinitialiser le cadrage">
            <svg class="icon" viewBox="0 0 24 24"><path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3"/></svg> Plein cadre
        </button>
    </div>

    {{-- Actions --}}
    <div class="flex flex-col sm:flex-row gap-2.5 mt-5">
        <button class="btn flex-1" @click="reset()">
            <svg class="icon" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Changer d'image
        </button>
        <button class="btn primary flex-1" @click="confirmEdit()">
            <svg class="icon" viewBox="0 0 24 24"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
            <span x-text="loading ? 'Extraction…' : 'Extraire la palette'"></span>
        </button>
    </div>

</section>
