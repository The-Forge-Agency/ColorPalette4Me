{{-- ÉCRAN UPLOAD --}}
<section x-show="screen === 'upload'" x-transition.opacity>

    <div class="text-center px-6 pt-12 pb-6 sm:pt-16 max-w-[760px] mx-auto">
        <span class="inline-block text-[13px] font-medium text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full mb-6">
            100% dans ton navigateur · rien n'est uploadé
        </span>
        <h1 class="font-title text-[36px] sm:text-[54px] font-bold leading-[1.08] tracking-[-1.5px] mb-4">
            Une image entre,<br>ta <span class="text-accent">palette</span> sort.
        </h1>
        <p class="text-[16px] sm:text-[18px] text-ink-alt leading-relaxed max-w-[540px] mx-auto">
            Dépose un visuel, récupère une palette propre : rampe 50→950, contrastes WCAG, design system live et exports prêts à coller dans ton code.
        </p>
    </div>

    <div class="max-w-[600px] mx-auto px-6 mt-6">
        <input type="file" x-ref="fileInput" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFileChange($event)">

        <div
            @click="openPicker()"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop($event)"
            :class="dragOver ? 'border-accent bg-accent/5' : 'border-accent/35'"
            class="border-2 border-dashed rounded-[22px] py-12 px-8 text-center bg-white cursor-pointer transition-all shadow-[0_1px_2px_rgba(28,28,30,0.03)] hover:border-accent">

            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
                <template x-if="!loading">
                    <svg class="icon w-[30px] h-[30px] stroke-accent" viewBox="0 0 24 24"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                </template>
                <template x-if="loading">
                    <svg class="icon w-[30px] h-[30px] stroke-accent animate-spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/></svg>
                </template>
            </div>
            <h3 class="font-title text-[21px] font-semibold mb-2" x-text="loading ? 'Extraction en cours…' : 'Glisse ton image ici'"></h3>
            <p class="text-ink-alt text-[14px]">ou clique pour choisir — PNG, JPG ou WEBP · max 8 MB</p>
        </div>

        <div x-show="error" x-transition class="mt-3 text-[13px] text-center text-[#c44676] bg-[#c44676]/8 border border-[#c44676]/20 rounded-xl px-4 py-3" x-text="error"></div>

        <div class="flex items-center justify-center gap-2 mt-4 text-[13px] text-ink-alt">
            <svg class="icon w-[15px] h-[15px] stroke-accent" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
            Lecture en mémoire navigateur — ton image ne quitte jamais ta machine.
        </div>

        <div class="flex items-center justify-between mt-6 bg-bg-alt rounded-2xl px-5 py-4">
            <div class="text-[14px] font-medium">Nombre de couleurs
                <small class="block text-ink-alt font-normal text-[12.5px] mt-0.5">Quantification perceptuelle (OKLCH) · ajustable ensuite</small>
            </div>
            <div class="flex items-center gap-3.5">
                <button @click="changeCount(-1)" class="w-8 h-8 rounded-[9px] border border-ink-alt/20 bg-white text-[18px] leading-none hover:border-accent transition-colors" aria-label="Moins">−</button>
                <span class="font-title text-[20px] font-semibold min-w-6 text-center text-accent" x-text="count"></span>
                <button @click="changeCount(1)" class="w-8 h-8 rounded-[9px] border border-ink-alt/20 bg-white text-[18px] leading-none hover:border-accent transition-colors" aria-label="Plus">+</button>
            </div>
        </div>
    </div>

    {{-- FEATURES --}}
    <div class="max-w-[940px] mx-auto px-6 mt-20">
        <h2 class="font-title text-[13px] font-medium text-ink-alt text-center uppercase tracking-[2px] mb-7">De l'inspiration au code, sans copier-coller à la main</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            @php
                $features = [
                    ['Couleurs dominantes', 'Median Cut + clustering OKLCH, de 3 à 10 couleurs.', '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18 3 3 0 0 0 0-6 1.5 1.5 0 0 1 0-3 3 3 0 0 0 0-6z"/>'],
                    ['Rampe 50→950', 'Onze nuances par couleur, calibrées façon Tailwind.', '<path d="M4 6h16M4 12h16M4 18h10"/>'],
                    ['Contraste WCAG', 'Badge AA / AAA et ratio sur chaque paire texte/fond.', '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>'],
                    ['Exports prêts', 'Tailwind, CSS, SCSS, Bootstrap, tokens JSON, .ase.', '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>'],
                ];
            @endphp
            @foreach ($features as [$title, $desc, $icon])
                <div class="bg-white border border-ink-alt/10 rounded-2xl p-6 hover:border-accent/30 transition-colors">
                    <div class="w-10 h-10 rounded-[11px] bg-accent/10 flex items-center justify-center mb-3.5">
                        <svg class="icon w-5 h-5 stroke-accent" viewBox="0 0 24 24">{!! $icon !!}</svg>
                    </div>
                    <h3 class="font-title text-[15px] font-semibold mb-1.5">{{ $title }}</h3>
                    <p class="text-[13px] text-ink-alt leading-snug">{{ $desc }}</p>
                </div>
            @endforeach
        </div>
    </div>

</section>
