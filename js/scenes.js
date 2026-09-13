/* =========================================================
   ERA RESIDENCE — scroll scenes
   Parallax layers, hero departure, ring text, the horizontal
   location chapter, master-plan zoom, amenity zoom-out, the
   architecture frame reveal and the footer window.
   ========================================================= */
(function (ERA) {
  'use strict';
  const D = ERA.D, arr = ERA.arr;
  const allowed = (el) => { const mob = ERA.isMobile(); return !((mob && el.dataset.mob === 'off') || (!mob && el.dataset.desk === 'off')); };

  /* ---------- parallax families ---------- */
  ERA.initParallax = function () {
    if (ERA.reduced) return;
    arr('[data-parallax="img"]').forEach((img) => { const w = img.closest('[data-parallax="w"]'); if (!w || !allowed(w)) return;
      gsap.fromTo(img, { yPercent: -15 }, { yPercent: 15, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', scrub: 0.5 } }); });
    arr('[data-parallax="img-out"]').forEach((img) => { const w = img.closest('[data-parallax="w"]'); if (!w || !allowed(w)) return;
      gsap.fromTo(img, { yPercent: 0 }, { yPercent: 20, ease: 'none', scrollTrigger: { trigger: w, start: 'bottom bottom', end: 'bottom top', scrub: 0.5 } }); });
    arr('[data-parallax="img-in"]').forEach((img) => { const w = img.closest('[data-parallax="w"]'); if (!w || !allowed(w)) return;
      gsap.fromTo(img, { yPercent: -20 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom bottom', scrub: true } }); });
    arr('[data-parallax="ctn-down"]').forEach((el) => { if (!allowed(el)) return;
      gsap.fromTo(el, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: el, start: 'top 125%', end: 'bottom -25%', scrub: 0.5 } }); });
    arr('[data-parallax="ctn-up"]').forEach((el) => { if (!allowed(el)) return;
      gsap.fromTo(el, { yPercent: 10 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: el, start: 'top 125%', end: 'bottom -25%', scrub: 0.5 } }); });
  };

  ERA.initScenes = function () {
    if (ERA.reduced) { document.querySelectorAll('[data-part], [data-text]').forEach((el) => { el.style.visibility = 'visible'; }); return; }
    const mob = ERA.isMobile();

    /* hero: the composition leaves upward while the render dives in */
    const heroArea = document.querySelector('[data-hero] .hero__area');
    if (heroArea) {
      const content = heroArea.querySelector('[data-hero-content]'), bg = heroArea.querySelector('[data-hero-bg]');
      // data-hero="parallax": layered drift instead of the dive-zoom — used by the Amoha pages
      const drift = heroArea.closest('[data-hero]').dataset.hero === 'parallax';
      const build = () => {
        const bgH = bg.offsetHeight, vh = window.innerHeight;
        const tl = gsap.timeline({ scrollTrigger: { trigger: heroArea, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
        if (drift) {
          // the composition lifts out; each [data-hero-layer="depth"] in the field follows at its own rate (no zoom)
          tl.fromTo(content, { y: 0 }, { y: () => -(1.15 * window.innerHeight), ease: 'eraEase', duration: 0.6 }, 0);
          // Phones only: the logo and Menu sit in the band the lifted copy passes through, and the hero
          // paints no bar under them (is-hero, js/components.js). So the composition dissolves as it
          // lifts and is gone as the sub's first line reaches that band, which it does at 0.088-0.111
          // of this timeline (measured on home and the project template at 360, 390 and 820).
          if (mob) tl.to(content, { autoAlpha: 0, ease: 'none', duration: 0.08 }, 0.015);
          bg.querySelectorAll('[data-hero-layer]').forEach((layer) => {
            const depth = parseFloat(layer.dataset.heroLayer) || 0.3;
            tl.fromTo(layer, { y: 0 }, { y: () => -(depth * window.innerHeight), ease: 'eraEase', duration: 0.6 }, 0);
          });
          const glow = bg.querySelector('[data-hero-glow]');
          if (glow) tl.fromTo(glow, { opacity: 0.55 }, { opacity: 1, ease: 'none', duration: 0.6 }, 0);
          // The landing frame is square and taller than the window: the first screen is sky with
          // the wordmark on it, and scrolling walks the picture up until the building and the
          // street are in view. 170% tall means 70% of the window's height is held in reserve,
          // which is 41.2% of the picture's own height — that is the whole travel.
          const reveal = bg.querySelectorAll('[data-hero-reveal]');
          // 0.27 of the 0.6 timeline, so the picture finishes revealing at 45% of the hero scroll and
          // the building stands fully in view for a beat before the dome starts to rise over it.
          // A project page has no dome coming (no .benefits.arch), and there 0.27 froze the render for
          // a screen and a half of scroll; 0.5 keeps it moving for most of the run.
          // The travel is the picture's surplus over its frame, measured rather than assumed: 41.2 is
          // right for desktop's 170%, but the phone picture is 152% (css/amoha.css) and 41.2 lifted it
          // 78-125px too far, baring a flat green band under the building. The frame is the .img-w
          // (the <picture> is display:contents); the hidden dusk panel measures 0 and is skipped; and
          // invalidateOnRefresh re-measures after a resize or a rotate.
          if (reveal.length) {
            const laid = () => Array.prototype.find.call(reveal, (r) => r.offsetHeight > 0);
            const travel = () => { const el = laid(), f = el && el.closest('.img-w'); return f ? -100 * (1 - f.offsetHeight / el.offsetHeight) : -41.2; };
            tl.fromTo(reveal, { yPercent: 0 }, { yPercent: travel, ease: 'none', duration: document.querySelector('.benefits.arch') ? 0.27 : 0.5 }, 0);
          }
          // The wordmark relaxes on the typeface's own axes as it departs — lighter and softer,
          // which reads as distance rather than as a fade. Fraunces carries wght and SOFT, so this
          // is the type responding, not an effect laid over it.
          const nameEl = content.querySelector('.hero__name');
          if (nameEl && !ERA.lite) tl.fromTo(nameEl, { '--nm-wght': 500, '--nm-soft': 50 },
            { '--nm-wght': 330, '--nm-soft': 100, ease: 'none', duration: 0.6 }, 0);
          const drifter = bg.querySelector('[data-hero-drift]');
          if (drifter) {                                                          // a photograph: let it drift
            gsap.set(drifter, { scale: 1.14, transformOrigin: '50% 50%' });      // headroom for the drift, set once
            tl.fromTo(drifter, { yPercent: -5 }, { yPercent: 6, ease: 'none', duration: 0.6 }, 0);
          }
        } else {
          if (!mob) tl.fromTo(content, { y: 0 }, { y: () => -(1.25 * bg.offsetHeight - window.innerHeight), ease: 'eraEase', duration: 0.6 })
            .fromTo(bg, { y: 0 }, { y: () => -(bg.offsetHeight - window.innerHeight), ease: 'eraEase', duration: 0.6 }, '<');
          tl.fromTo(bg, { scale: 1, transformOrigin: '50% 75%' }, { scale: 2, ease: 'eraIn', duration: 0.6 }, mob ? '>' : '-=0.2');
        }
        void bgH; void vh;
      };
      const img = bg.querySelector('img');
      if (img && !img.complete) { img.addEventListener('load', build, { once: true }); img.addEventListener('error', build, { once: true }); }
      else build();
    }

    /* ring text spreads along the arch */
    const ringText = document.querySelector('[data-circle-text]');
    if (ringText) gsap.fromTo(ringText, { wordSpacing: '0px' }, { wordSpacing: '160px', ease: 'none', scrollTrigger: { trigger: ringText.closest('.intro'), start: 'top bottom', end: 'bottom top', scrub: true } });

    /* concept panel: scales in as the chapter arrives */
    const concept = document.querySelector('[data-scene="concept"]');
    if (concept) {
      const box = concept.querySelector('[data-scene-box]'), p = concept.querySelectorAll('[data-part="p"]'), ctn = concept.querySelectorAll('[data-part="ctn"]');
      ERA.animP(p, 'initial'); ERA.animCtn(ctn, 'initial');
      // 'top 30%' → 'bottom bottom' was written for the pinned desktop chapter, where the trigger is
      // several screens tall. Unpinned below 992 it is only ~751px, so the two bounds collapse into
      // a ~160px window and the block sat at opacity 0 while 81% of it was on screen.
      const bounds = mob ? { start: 'top 85%', end: 'top 40%' } : { start: 'top 30%', end: 'bottom bottom' };
      gsap.timeline({ scrollTrigger: { trigger: concept, start: bounds.start, end: bounds.end, scrub: 0.5,
        onEnter: () => { ERA.animP(p, 'reveal', 0.1); ERA.animCtn(ctn, 'reveal', 0.1); },
        onLeaveBack: () => { ERA.animP(p, 'hide', 0); ERA.animCtn(ctn, 'hide', 0); } } })
        .fromTo(box, { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, ease: 'none' }, 0);
    }

    /* Benefit panels, phones only. On desktop these are a pinned carousel that cross-fades; below
       992 they simply stack, so each one arrived already at rest and only its characters moved —
       the panel itself popped into place under a heading that was still drawing. A short
       scroll-linked lift underneath gives the whole panel somewhere to arrive from, so the type
       lands on something already in motion instead of on a static block. */
    if (mob) {
      gsap.utils.toArray('.benefits .slide').forEach((panel) => {
        gsap.fromTo(panel, { y: 26, opacity: 0.6 }, { y: 0, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: panel, start: 'top 92%', end: 'top 52%', scrub: 0.6 } });
      });
    }

    /* horizontal chapter (desktop): vertical scroll drives the track sideways */
    (mob ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-horizontal]'))).forEach((area) => {
      const track = area.querySelector('[data-horizontal-track]');
      const setHeight = () => { area.style.height = track.scrollWidth + 'px'; };
      setHeight();
      const tween = gsap.to(track, { x: () => -(track.scrollWidth - area.offsetWidth), ease: 'eraHor', scrollTrigger: { trigger: area, start: '2.5% top', end: '97.5% bottom', scrub: 0.25, invalidateOnRefresh: true } });
      area._tween = tween;
      ScrollTrigger.addEventListener('refreshInit', setHeight);
      // The Ring Road track carries its copy out past the fixed rail; the rail's counter and scroll
      // cue step back while it is pinned (css/amoha.css, html.is-sideways).
      if (area.querySelector('.loc-intro')) ScrollTrigger.create({ trigger: area, start: 'top top', end: 'bottom bottom',
        onToggle: (st) => document.documentElement.classList.toggle('is-sideways', st.isActive) });
      const lines = area.querySelectorAll('[data-line]');
      // A gentle drift, not Era's ±25%: the headline now ends where the photograph starts, and a
      // quarter of "Bathinda" sliding right would put it straight back on the render.
      if (lines.length) gsap.fromTo(lines, { xPercent: gsap.utils.wrap([-3, 8, -5]) }, { xPercent: gsap.utils.wrap([3, -8, 5]), ease: 'none', scrollTrigger: { trigger: area, start: 'top top', end: 'bottom bottom', scrub: 0.25 } });   // the principles track has no display lines
      const fi = area.querySelector('[data-flower-intro]'); fi && gsap.fromTo(fi, { xPercent: 0 }, { xPercent: -25, ease: 'none', scrollTrigger: { trigger: area, start: 'top top', end: 'bottom bottom', scrub: 0.25 } });
      const fp = area.querySelector('[data-flower-path]'); fp && gsap.fromTo(fp, { yPercent: 0 }, { yPercent: 25, ease: 'none', scrollTrigger: { trigger: area, start: 'bottom bottom', end: 'bottom top', scrub: 0.25 } });
    });
    /* route map draws itself once it enters */
    const route = document.querySelector('[data-route]');
    if (route) {
      const horiz = route.closest('[data-horizontal]');
      const ca = horiz && horiz._tween ? horiz._tween : undefined;
      const labels = route.querySelector('[data-route-labels]');
      // Draw the map left-to-right, SCRUBBED to the scroll, over the window where the panel is
      // actually on screen. (A timed reveal fires at 'left right' — the instant the panel peeks in
      // from the right — and finishes ~0.4 s later while the panel is still sliding in off-frame, so
      // it was never seen.) The clip wipes line, stops and labels in together; labels then settle.
      // Unpinned (the upright phone route, a project page's map) the bounds were 'top 82%' → 'top 32%',
      // keyed to the map's top edge alone, so on a short screen the whole map sat in view still half
      // drawn. It now draws from the moment it enters and has finished once all of it is on screen.
      const rt = gsap.timeline({ scrollTrigger: {
        trigger: route, containerAnimation: ca,
        start: ca ? 'left 72%' : 'top bottom',
        end: ca ? 'left 18%' : 'bottom 90%',
        scrub: 1 } });
      // Below 992px the container holds the UPRIGHT route instead (see tools/build-amoha.mjs), so
      // the wipe has to travel down it. A left-to-right inset over a tall drawing uncovers every
      // stop in the first few pixels of travel and then has nothing left to do.
      const wipeFrom = ERA.isMobile() ? 'inset(0% 0% 100% 0%)' : 'inset(0% 100% 0% 0%)';
      rt.fromTo(route, { clipPath: wipeFrom }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 0.8 });
      labels && rt.fromTo(labels, { opacity: 0, y: 8 }, { opacity: 1, y: 0, ease: 'none', duration: 0.35 }, 0.62);
    }

    /* master plan settles from a slight zoom */
    const mapBg = document.querySelector('[data-map-bg]');
    if (mapBg) gsap.from(mapBg, { scale: 1.15, transformOrigin: 'center bottom', ease: 'eraEase', scrollTrigger: { trigger: mapBg.closest('.map__w'), start: 'top bottom', end: 'bottom bottom', scrub: 0.25 } });

    /* amenities: the scene zooms past the viewer and fades */
    const amen = document.querySelector('[data-amen]');
    if (amen) {
      const slides = amen.querySelector('[data-amen-slides]'), stage = amen.querySelector('[data-amen-stage]');
      gsap.timeline({ scrollTrigger: { trigger: amen, start: 'top top', end: 'bottom bottom', scrub: true } })
        .fromTo(slides, { scale: 1 }, { scale: 2, ease: 'eraIn' })
        .fromTo(stage, { opacity: 1 }, { opacity: 0, ease: 'eraIn' }, '<');
    }

    /* architecture: two cream shutters open a window that then swallows the frame */
    const archArea = document.querySelector('[data-arch]');
    if (archArea && !mob) {
      const intro = archArea.querySelector('[data-arch-intro]'), L = archArea.querySelector('[data-arch-bg="l"]'), R = archArea.querySelector('[data-arch-bg="r"]');
      const fl = archArea.querySelector('[data-arch-flower="l"]'), fr = archArea.querySelector('[data-arch-flower="r"]');
      const w = archArea.querySelector('[data-arch-w]'), img = w.querySelector('[data-arch-img]');
      const h = w.querySelector('[data-text="h"]'), p = w.querySelector('[data-text="p"]');
      const hole = (x1, x2, y1, y2) => 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, ' + x1 + '% 100%, ' + x1 + '% ' + y1 + '%, ' + x2 + '% ' + y1 + '%, ' + x2 + '% ' + y2 + '%, ' + x1 + '% ' + y2 + '%, ' + x1 + '% 100%, 0% 100%)';
      gsap.timeline({ scrollTrigger: { trigger: intro, start: 'top bottom', end: '200% top', scrub: true } })
        .fromTo(L, { clipPath: hole(44.4, 98.9, 36.1, 99.1) }, { clipPath: hole(44.4, 98.9, 18.5, 81.5), ease: 'none', duration: 0.5 })
        .fromTo(R, { clipPath: hole(1.1, 55.6, 0.9, 63.9) }, { clipPath: hole(1.1, 55.6, 18.5, 81.5), ease: 'none', duration: 0.5 }, '<')
        .to(L, { clipPath: hole(44.4, 100, 18.5, 81.5), ease: 'none', duration: 0.1 })
        .to(R, { clipPath: hole(0, 55.6, 18.5, 81.5), ease: 'none', duration: 0.1 }, '<')
        .fromTo(intro, { scale: 1 }, { scale: 1.84, ease: 'eraInOut', duration: 0.4 })
        .to(fl, { scale: 1.84, xPercent: -50, ease: 'eraInOut', duration: 0.4 }, '<')
        .to(fr, { scale: 1.84, xPercent: 50, ease: 'eraInOut', duration: 0.4 }, '<')
        .fromTo(w, { scale: 0.75, transformOrigin: 'center top' }, { scale: 1, ease: 'eraInOut', duration: 0.4 }, '<');
      ERA.animH(h, 'initial'); ERA.animP(p, 'initial');
      ScrollTrigger.create({ trigger: archArea, start: '30% top', onEnter: () => { ERA.animH(h, 'reveal', 0); ERA.animP(p, 'reveal', D.s); }, onLeaveBack: () => { ERA.animH(h, 'hide', 0); ERA.animP(p, 'hide', 0); } });
      img && gsap.to(img, { yPercent: 25, ease: 'none', scrollTrigger: { trigger: archArea, start: '55% top', end: 'bottom top', scrub: true } });
    } else if (archArea) {
      archArea.querySelectorAll('[data-text]').forEach((el) => { el.style.visibility = 'visible'; });
    }
    /* quote block and architecture parts hidden until the frame settles */
    arr('[data-arch] [data-part]').forEach((el) => {
      const type = el.dataset.part; ERA.anim[type] && ERA.anim[type](el, 'initial');
      ScrollTrigger.create({ trigger: el, start: 'top bottom', once: true, onEnter: () => ERA.anim[type](el, 'reveal') });
    });

    /* footer: the sea view closes into a framed window as the footer scales in */
    const footer = document.querySelector('[data-footer]');
    if (footer) {
      const clip = document.querySelector('[data-footer-clip]'), s = footer.querySelector('[data-footer-s]');
      const h = footer.querySelectorAll('[data-text="h"]'), p = footer.querySelectorAll('[data-text="p"]'), ctn = footer.querySelectorAll('[data-text="ctn"]');
      ERA.animH(h, 'initial'); ERA.animP(p, 'initial'); ERA.animCtn(ctn, 'initial');
      const ftl = gsap.timeline({ scrollTrigger: { trigger: footer, start: 'top 30%', end: 'bottom bottom', scrub: 0.5,
        onEnter: () => { ERA.animH(h, 'reveal', 0.1); ERA.animP(p, 'reveal', 0.1); ERA.animCtn(ctn, 'reveal', 0.1); },
        onLeaveBack: () => { ERA.animH(h, 'hide', 0); ERA.animP(p, 'hide', 0); ERA.animCtn(ctn, 'hide', 0); } } })
        .fromTo(clip, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: mob ? 'inset(4% 32% 4% 32%)' : 'inset(8% 22% 8% 22%)', ease: 'none' }, 0);
      // Tied to that run, the content waited for the footer's top to reach 30%: on a phone the dark
      // ground came up through most of the screen with nothing on it. There the content has its own
      // earlier run, and is in place by the time the footer's top is at mid-screen.
      if (mob) gsap.fromTo(s, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: footer, start: 'top 90%', end: 'top 45%', scrub: 0.5 } });
      else ftl.fromTo(s, { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, ease: 'none' }, 0);
      const cue = document.querySelector('[data-scroll-cue]');
      cue && gsap.to(cue, { opacity: 0, ease: 'eraInOut', scrollTrigger: { trigger: footer, start: 'top bottom', end: 'center bottom', scrub: true } });
    }
  };
})(window.ERA);
