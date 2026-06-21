<!DOCTYPE html>
<html lang="fr" class="bg-bg">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

    <title>ColorPalette4Me — Une image entre, ta palette sort.</title>
    <meta name="description" content="Dépose une image, récupère une palette propre : rampe 50→950, contrastes WCAG, design system live et exports prêts à coller (Tailwind, CSS, SCSS, Bootstrap, tokens JSON, .ase). 100% dans ton navigateur, zéro upload.">

    <link rel="icon" type="image/svg+xml" href="{{ asset('images/icon.svg') }}">
    <link rel="icon" type="image/png" href="{{ asset('images/favicon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('images/icon.png') }}">

    <meta property="og:title" content="ColorPalette4Me — Une image entre, ta palette sort.">
    <meta property="og:description" content="Une image, une palette, prête à coder. Rampe 50→950, WCAG, exports Tailwind/CSS/SCSS/Bootstrap. Gratuit, sans compte, zéro upload.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="{{ asset('images/og.png') }}">

    {{ \Illuminate\Support\Facades\Vite::fonts() }}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-dvh bg-bg text-ink font-body antialiased" x-data="paletteApp" x-cloak>

    {{-- NAV --}}
    <nav class="w-full max-w-[1180px] mx-auto flex items-center justify-between px-5 py-4 sm:px-10 sm:py-5">
        <a href="{{ route('home') }}" class="flex items-center gap-3">
            <span class="flex items-end gap-[3px] h-6" aria-hidden="true">
                <i class="block w-[5px] rounded-[2px] bg-accent h-[9px] opacity-35"></i>
                <i class="block w-[5px] rounded-[2px] bg-accent h-[14px] opacity-60"></i>
                <i class="block w-[5px] rounded-[2px] bg-accent h-[19px] opacity-80"></i>
                <i class="block w-[5px] rounded-[2px] bg-accent h-[24px]"></i>
            </span>
            <span class="font-title text-[20px] font-semibold tracking-[-0.3px]">ColorPalette<span class="text-accent">4Me</span></span>
        </a>
        <span class="text-[13px] text-ink-alt border border-ink-alt/20 px-3 py-1 rounded-full">#07/52</span>
    </nav>

    <main>
        @include('partials.upload')
        @include('partials.edit')
        @include('partials.result')
    </main>

    <footer class="text-center px-6 py-10 text-[13px] text-ink-alt">
        Projet <span class="text-accent">#07/52</span> — Sprint Factory · Gratuit, sans compte, zéro upload.
    </footer>

</body>
</html>
