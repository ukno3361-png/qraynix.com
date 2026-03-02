/**
 * ============================================
 * Qraynix — Client-Side JavaScript
 * ============================================
 * Handles UI interactions on the main site:
 *   - Mobile navigation toggle
 *   - Scroll-aware header styling
 *   - Scroll-triggered animations
 *   - Smooth scroll for anchor links
 *   - Contact form handling
 *
 * All functions are self-contained IIFEs or
 * pure functions with no global pollution.
 */

// ============================================
// Mobile Navigation Toggle
// ============================================
(function initMobileNav() {
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.getElementById('nav-links');

    if (!hamburger || !navLinks) return;

    /**
     * toggleNav — opens/closes the mobile navigation menu
     * and updates the ARIA state for accessibility.
     */
    const toggleNav = () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', String(isOpen));
    };

    hamburger.addEventListener('click', toggleNav);

    // Close the menu when a link is clicked
    navLinks.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
})();

// ============================================
// Scroll-Aware Header
// ============================================
(function initScrollHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const SCROLL_THRESHOLD = 50;

    /**
     * handleScroll — adds/removes the 'scrolled' class
     * on the header based on the current scroll position.
     */
    const handleScroll = () => {
        if (window.scrollY > SCROLL_THRESHOLD) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    // Throttle with requestAnimationFrame for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Run on initial load
    handleScroll();
})();

// ============================================
// Scroll-Triggered Animations
// ============================================
(function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    if (animatedElements.length === 0) return;

    /**
     * IntersectionObserver watches for elements entering
     * the viewport and adds the 'visible' class to
     * trigger CSS transitions.
     */
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        },
        {
            threshold: 0.15,    // Trigger when 15% visible
            rootMargin: '0px 0px -50px 0px', // Slight offset from bottom
        }
    );

    animatedElements.forEach((el) => observer.observe(el));
})();

// ============================================
// Smooth Scroll for Anchor Links
// ============================================
(function initSmoothScroll() {
    /**
     * handleAnchorClick — scrolls smoothly to the target
     * section when an anchor link is clicked.
     * @param {Event} e - The click event
     */
    const handleAnchorClick = (e) => {
        const href = e.currentTarget.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', handleAnchorClick);
    });
})();

// ============================================
// Contact Form Handler
// ============================================
(function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    /**
     * handleSubmit — handles the contact/CTA form submission.
     * In a real app, this would POST to an API endpoint.
     * @param {Event} e - The submit event
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('contact-email');
        const btn = form.querySelector('.btn-primary');

        if (!emailInput || !btn) return;

        // Visual success feedback
        const originalText = btn.textContent;
        btn.textContent = '✓ Thank You!';
        btn.style.background = 'linear-gradient(135deg, #00c853, #00e676)';

        // Reset after 3 seconds
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            form.reset();
        }, 3000);
    };

    form.addEventListener('submit', handleSubmit);
})();

// ============================================
// Active Nav Link Highlighter
// ============================================
(function initActiveNavHighlight() {
    const sections = document.querySelectorAll('.section[id], .hero[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach((link) => {
                        const href = link.getAttribute('href');
                        const isMatch = href === `#${id}` || (href === '/' && id === 'hero');
                        link.classList.toggle('active', isMatch);
                    });
                }
            });
        },
        {
            threshold: 0.3,
            rootMargin: `-${72}px 0px 0px 0px`, // Account for fixed header
        }
    );

    sections.forEach((section) => observer.observe(section));
})();
