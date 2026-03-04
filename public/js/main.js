/**
 * public/js/main.js
 * Client-side interactions for the public Qraynix pages.
 * Handles rune background, scroll animations, mobile nav, scroll-to-top.
 */

// ── Elder Futhark rune characters used for decorations ──
const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';

// ── Rune Background Decoration ──
(function initRuneBackground() {
    const container = document.getElementById('rune-bg');
    if (!container) return;

    const COUNT = 8;
    for (let i = 0; i < COUNT; i++) {
        const span = document.createElement('span');
        span.className = 'rune-char';
        span.textContent = RUNES[Math.floor(Math.random() * RUNES.length)];
        span.style.cssText = [
            `left: ${Math.random() * 90}%`,
            `top: ${Math.random() * 90}%`,
            `font-size: ${8 + Math.random() * 12}rem`,
            `opacity: ${0.03 + Math.random() * 0.06}`,
            `animation-delay: ${Math.random() * 5}s`,
            `animation-duration: ${15 + Math.random() * 20}s`,
        ].join('; ');
        container.appendChild(span);
    }
})();

// ── Scroll-Triggered Animations (Intersection Observer) ──
(function initScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
})();

// ── Scroll-to-Top Button ──
(function initScrollToTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ── Mobile Navigation Toggle ──
(function initMobileNav() {
    const toggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        const isOpen = navLinks.style.display === 'flex';
        navLinks.style.display = isOpen ? 'none' : 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'rgba(10, 9, 7, 0.95)';
        navLinks.style.padding = '1rem 2rem';
        navLinks.style.borderBottom = '1px solid #2e2820';
        if (isOpen) navLinks.removeAttribute('style');
    });
})();

// ── Active Nav Highlighting ──
(function initActiveNav() {
    const links = document.querySelectorAll('.nav-links a');
    const path = window.location.pathname;

    links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === path || (href !== '/' && path.startsWith(href))) {
            link.classList.add('active');
        }
    });
})();
