/* ═══════════════════════════════════════════════════════════════════════════
   Spanish Founders Platform — Main JavaScript
   Slideshow · Navigation · Scroll Reveal · Mobile Menu · Contact Form
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ─── Hero Slideshow ─────────────────────────────────────────────────── */
  const slides   = qsa('.hero-slide');
  const dots     = qsa('.hero-dot');
  const INTERVAL = 7000;
  let   current  = 0;
  let   timer    = null;

  function showSlide(n) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => showSlide(current + 1), INTERVAL);
  }

  if (slides.length > 0) {
    dots.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); startTimer(); }));
    startTimer();
  }

  /* ─── Hero Text Reveal on Load ───────────────────────────────────────── */
  function triggerHeroReveal() { document.body.classList.add('loaded'); }

  if (document.readyState === 'complete') {
    setTimeout(triggerHeroReveal, 80);
  } else {
    window.addEventListener('load', () => setTimeout(triggerHeroReveal, 80));
  }

  /* ─── Navigation — Scroll Effect ────────────────────────────────────── */
  const nav = qs('#nav');

  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 50); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── Mobile Menu ────────────────────────────────────────────────────── */
  const hamburger = qs('#hamburger');
  const navLinks  = qs('#navLinks');
  const navCta    = qs('.nav-cta');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      navLinks.classList.toggle('is-open', open);
      if (open) nav.classList.add('scrolled');
      else if (window.scrollY <= 50) nav.classList.remove('scrolled');
    });

    qsa('a', navLinks).forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('is-open');
      });
    });

    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('is-open');
      }
    });
  }

  /* ─── Scroll Reveal ──────────────────────────────────────────────────── */
  const revealEls = qsa('.reveal');

  if ('IntersectionObserver' in window && revealEls.length > 0) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ─── Stagger children in grid containers ────────────────────────────── */
  ['.pillars-grid', '.opportunity-grid', '.team-grid', '.stats-grid'].forEach(sel => {
    const container = qs(sel);
    if (!container) return;
    qsa('.reveal', container).forEach((child, i) => child.classList.add(`stagger-${(i % 4) + 1}`));
  });

  /* ─── Portfolio Carousel ─────────────────────────────────────────────── */
  const pfTrack = qs('#portfolioTrack');

  if (pfTrack) {
    const pfSlides = qsa('.portfolio-slide', pfTrack);
    const pfPrev   = qs('#portfolioPrev');
    const pfNext   = qs('#portfolioNext');
    const pfDots   = qs('#portfolioDots');
    let   pfIndex  = 0;

    const dotEls = pfSlides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.className = 'portfolio-dot';
      dot.setAttribute('aria-label', `Go to ${slide.getAttribute('aria-label')}`);
      dot.addEventListener('click', () => goToSlide(i));
      pfDots.appendChild(dot);
      return dot;
    });

    function goToSlide(i) {
      const count = pfSlides.length;
      const n     = (i + count) % count;
      const wraps = i < 0 || i >= count;

      if (!wraps) {
        pfTrack.scrollTo({ left: n * pfTrack.clientWidth, behavior: 'smooth' });
        return;
      }

      /* Wrapping past either end: fade out, jump, fade back in instead of scrolling across every slide */
      pfTrack.style.transition = 'opacity .2s';
      pfTrack.style.opacity    = '0';
      setTimeout(() => {
        pfTrack.scrollTo({ left: n * pfTrack.clientWidth, behavior: 'instant' });
        pfTrack.style.opacity = '1';
      }, 200);
    }

    function updateCarousel() {
      pfIndex = Math.round(pfTrack.scrollLeft / pfTrack.clientWidth);
      dotEls.forEach((d, i) => d.classList.toggle('active', i === pfIndex));
    }

    pfPrev.addEventListener('click', () => goToSlide(pfIndex - 1));
    pfNext.addEventListener('click', () => goToSlide(pfIndex + 1));
    pfTrack.addEventListener('scroll', updateCarousel, { passive: true });
    pfTrack.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goToSlide(pfIndex - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(pfIndex + 1); }
    });
    window.addEventListener('resize', () => pfTrack.scrollTo({ left: pfIndex * pfTrack.clientWidth, behavior: 'instant' }));
    updateCarousel();

    /* Auto-advance until the user interacts with the carousel */
    const PF_INTERVAL = 6000;
    const pfRoot      = qs('#portfolioCarousel');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let   pfTimer     = null;
    let   pfVisible   = false;

    function stopAutoplay() {
      clearInterval(pfTimer);
      pfTimer = null;
      pfObserver.disconnect();
      ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach(ev => pfRoot.removeEventListener(ev, stopAutoplay));
    }

    function autoAdvance() {
      if (!pfVisible) return;
      goToSlide(pfIndex + 1);
    }

    const pfObserver = new IntersectionObserver(entries => { pfVisible = entries[0].isIntersecting; });

    if (!reduceMotion) {
      pfObserver.observe(pfRoot);
      ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach(ev => pfRoot.addEventListener(ev, stopAutoplay, { passive: true }));
      pfTimer = setInterval(autoAdvance, PF_INTERVAL);
    }
  }

  /* ─── Contact Form ───────────────────────────────────────────────────── */
  const contactForm = qs('.contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const btn    = qs('.contact-form-submit', contactForm);
      const status = qs('.contact-form-status', contactForm);

      status.className = 'contact-form-status';

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      btn.disabled       = true;
      btn.textContent    = 'Sending…';
      status.textContent = '';
      status.className   = 'contact-form-status';

      try {
        const res = await fetch(contactForm.action, {
          method:  'POST',
          headers: { 'Accept': 'application/json' },
          body:    new FormData(contactForm),
        });

        if (res.ok) {
          status.textContent = 'Message sent. We\'ll be in touch shortly.';
          status.classList.add('contact-form-status--ok');
          contactForm.reset();
          btn.textContent = 'Send Message';
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.errors?.map(err => err.message).join(', ') || 'server');
        }
      } catch {
        status.textContent = 'Something went wrong. Please try again or email us directly.';
        status.classList.add('contact-form-status--err');
        btn.textContent = 'Send Message';
      }

      btn.disabled = false;
    });
  }

  /* ─── Smooth Scroll for Anchor Links ─────────────────────────────────── */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = qs(id);
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '80', 10);
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  });

  /* ─── Active nav link highlight on scroll ───────────────────────────── */
  const sections   = qsa('section[id]');
  const navAnchors = qsa('.nav-link[href^="#"]');

  function updateActiveLink() {
    let closest = null, minDist = Infinity;
    sections.forEach(sec => {
      const dist = Math.abs(sec.getBoundingClientRect().top - 100);
      if (dist < minDist) { minDist = dist; closest = sec.id; }
    });
    navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${closest}`));
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

})();
