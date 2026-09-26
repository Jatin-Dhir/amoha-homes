/* =========================================================
   ERA RESIDENCE — boot sequence
   ========================================================= */
(function (ERA) {
  'use strict';
  function boot() {
    // ?wrapper: scroll inside a fixed container instead of the window (debug aid for
    // screenshot tools that only capture document coordinates; behaviour is identical)
    if (/wrapper/.test(location.search)) {
      const main = document.querySelector('main.page');
      const wrap = document.createElement('div');
      wrap.className = 'scroll-wrapper';
      wrap.style.cssText = 'position:fixed;inset:0;overflow:auto;';
      main.parentNode.insertBefore(wrap, main);
      wrap.appendChild(main);
      ERA.wrapper = wrap; ERA.content = main;
    }
    ERA.initClouds();
    ERA.initLenis();
    ERA.initCookies();
    // Amoha's first screen is bound to these three rather than to a fixed timeline, so a warm
    // cache walks straight through instead of watching a bar play out. Each one resolves rather
    // than rejects — a missing hero must read as "arrived", never hang the door shut.
    let builtDone; const built = new Promise((r) => { builtDone = r; });
    const heroImg = document.querySelector('[data-hero-zoom] img, .hero__photo img');
    const hero = new Promise((res) => {
      if (!heroImg) return res();
      if (heroImg.complete && heroImg.naturalWidth) { (heroImg.decode ? heroImg.decode() : Promise.resolve()).then(res, res); return; }
      heroImg.addEventListener('load', res, { once: true });
      heroImg.addEventListener('error', res, { once: true });
      setTimeout(res, 6000);
    });
    ERA.milestones = { fonts: fonts, hero: hero, built: built };
    ERA.initPageTransition();      // must run first: it decides whether the door plays at all
    ERA.initPreloader(function () {
      ERA.initParallax();
      // real transparent clips where the files exist (skipped on Safari); the rest get the
      // WebGL wind on their cut-outs, and the CSS sway only if WebGL is unavailable
      ERA.initFlowerVideos().then(() => { ERA.initWind(); ERA.initFlowers(); });
      // Fit the display lines before anything measures or splits them. Run last, a CTA headline
      // sat at its unfitted size while the scenes, reveals and theme sensors laid out: on a phone
      // 'neighbourhood' widened the document, so SplitText broke lines for the wrong column and
      // the nav fell outside every theme sensor.
      ERA.initFitText();
      ERA.initScenes();          // creates the horizontal tween the reveals depend on
      ERA.initReveals();
      ERA.initThemes();
      ERA.initSnap();
      ERA.initScrollbar();
      ERA.initLogoRing();
      ERA.initHeroTabs();
      ERA.initHeroVideo();
      ERA.initNavBar();
      ERA.initPins();
      ERA.initTips();
      ERA.initSliders();
      ERA.initTabs();
      ERA.initLayers();
      ERA.initAccordions();
      ERA.initMagnetic();
      ERA.initCircleButtons();
      ERA.initLinkHover();
      ERA.initNavHover();
      ERA.initModals();
      ERA.initForm();
      ERA.initRouteArt();
      ERA.initMisc();
      ScrollTrigger.refresh();
      builtDone();                 // the last milestone the first screen waits on
    });
  }
  // wait for the web fonts so the split text measures right, but never longer than 3 s:
  // a slow font CDN must not hold the whole page back
  const fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  // some embedded browsers report innerWidth 0 for the first frames after a navigation; every
  // isMobile() decision taken then would send a desktop layout down the phone branch (no horizontal
  // chapter, no snap), and the reveals split their text into lines at that width — one word a line,
  // which stays when the frame opens ("Where / every / address / becomes / a legacy." at 799x455).
  // Wait for a real width, however long: a no-op in normal browsers, and a page with no width shows
  // nothing to wait on. The old ~1.5 s cap booted a hidden preview pane at width 0. Resize is the
  // signal; the lazy poll covers embedders that reveal the frame without firing one.
  const sized = () => new Promise((r) => {
    if (window.innerWidth > 0) return r();
    let timer = 0;
    const check = () => {
      clearTimeout(timer);
      if (window.innerWidth > 0) { window.removeEventListener('resize', check); r(); }
      else timer = setTimeout(check, 250);
    };
    window.addEventListener('resize', check);
    timer = setTimeout(check, 16);
  });
  const start = () => Promise.race([fonts, new Promise((r) => setTimeout(r, 3000))]).then(sized).then(boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('load', () => ScrollTrigger.refresh());
})(window.ERA);
