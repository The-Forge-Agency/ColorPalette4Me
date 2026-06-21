{{-- DESIGN SYSTEM LIVE : la palette appliquée à une vraie UI --}}
<div>
    <div class="font-title text-[13px] font-medium text-ink-alt uppercase tracking-[2px] mb-4 pb-3 border-b border-ink-alt/12 flex justify-between items-baseline">
        <span>Design system live</span>
        <span class="font-body normal-case tracking-normal text-[12px] text-ink-alt">ta palette appliquée pour de vrai</span>
    </div>

    <div class="rounded-[18px] p-6 border border-ink-alt/12 space-y-5"
        :style="previewVars"
        style="background: var(--pv-surface); color: var(--pv-ink);">

        {{-- Header / typo --}}
        <div>
            <div class="flex items-center gap-2.5 mb-3">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center font-title font-bold text-[13px]" style="background: var(--pv-primary); color: var(--pv-primary-fg);">P</span>
                <span class="font-title font-semibold text-[15px]">Acme Studio</span>
                <span class="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full" style="background: var(--pv-primary-soft); color: var(--pv-primary-softfg);">v2.0</span>
            </div>
            <h3 class="font-title text-[22px] font-bold leading-tight mb-1.5">Lance ton produit en beauté</h3>
            <p class="text-[13.5px] leading-relaxed" style="color: var(--pv-muted);">
                Voici à quoi ressemble ta palette une fois posée sur une vraie interface — titres, corps,
                <a href="#" class="font-semibold underline" style="color: var(--pv-primary);" @click.prevent>un lien</a>, boutons, formulaires et alertes.
            </p>
        </div>

        {{-- Boutons --}}
        <div class="flex flex-wrap gap-2.5">
            <button class="text-[14px] font-semibold px-5 py-2.5 rounded-xl" style="background: var(--pv-primary); color: var(--pv-primary-fg);">Commencer</button>
            <button class="text-[14px] font-semibold px-5 py-2.5 rounded-xl" style="background: var(--pv-accent); color: var(--pv-accent-fg);">Accent</button>
            <button class="text-[14px] font-semibold px-5 py-2.5 rounded-xl border-[1.5px] bg-transparent" style="border-color: var(--pv-secondary); color: var(--pv-secondary);">Contour</button>
            <button class="text-[14px] font-semibold px-5 py-2.5 rounded-xl" style="background: var(--pv-primary-soft); color: var(--pv-primary-softfg);">Doux</button>
        </div>

        {{-- Carte produit + progression --}}
        <div class="rounded-2xl p-4" style="background: var(--pv-card); box-shadow: 0 2px 12px rgba(0,0,0,.06);">
            <div class="flex items-start justify-between">
                <div>
                    <h4 class="font-title text-[15px] font-semibold mb-1" style="color: var(--pv-ink);">Plan Pro</h4>
                    <p class="text-[12.5px] leading-snug" style="color: var(--pv-muted);">Tout l'illimité, exports inclus, support prioritaire.</p>
                </div>
                <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style="background: var(--pv-support); color: var(--pv-support-fg);">Disponible</span>
            </div>
            <div class="mt-3.5">
                <div class="flex justify-between text-[11px] mb-1.5" style="color: var(--pv-muted);"><span>Quota</span><span>72%</span></div>
                <div class="h-2 rounded-full overflow-hidden" style="background: var(--pv-border);">
                    <div class="h-full rounded-full" style="width: 72%; background: var(--pv-primary);"></div>
                </div>
            </div>
        </div>

        {{-- Champ + toggle --}}
        <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div class="flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5" style="background: var(--pv-card); border: 1.5px solid var(--pv-ring);">
                <svg class="icon w-4 h-4" style="stroke: var(--pv-primary);" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                <input type="text" placeholder="Rechercher…" class="bg-transparent outline-none text-[13px] w-full" style="color: var(--pv-ink);">
            </div>
            <div class="flex items-center gap-2.5">
                <span class="text-[13px]" style="color: var(--pv-muted);">Notifs</span>
                <span class="w-11 h-6 rounded-full p-0.5 flex items-center" style="background: var(--pv-primary);">
                    <span class="w-5 h-5 rounded-full bg-white ml-auto"></span>
                </span>
            </div>
        </div>

        {{-- Alerte / badges --}}
        <div class="flex items-center gap-3 rounded-xl px-4 py-3" style="background: var(--pv-primary-soft);">
            <svg class="icon w-5 h-5 shrink-0" style="stroke: var(--pv-primary);" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
            <p class="text-[12.5px]" style="color: var(--pv-primary-softfg);">Astuce : verrouille une couleur puis appuie sur <b>espace</b> pour régénérer le reste.</p>
        </div>

        <div class="flex flex-wrap gap-2">
            <span class="text-[11px] font-semibold px-2.5 py-1 rounded-md" style="background: var(--pv-primary); color: var(--pv-primary-fg);">Primary</span>
            <span class="text-[11px] font-semibold px-2.5 py-1 rounded-md" style="background: var(--pv-secondary); color: var(--pv-secondary-fg);">Secondary</span>
            <span class="text-[11px] font-semibold px-2.5 py-1 rounded-md" style="background: var(--pv-accent); color: var(--pv-accent-fg);">Accent</span>
            <span class="text-[11px] font-semibold px-2.5 py-1 rounded-md" style="background: var(--pv-support); color: var(--pv-support-fg);">Support</span>
        </div>
    </div>
</div>
