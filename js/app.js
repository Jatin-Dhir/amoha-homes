/*!
 * Amoha Group website — start-up: boots every part of the page
 * Designed and developed by Jatin Dhir <jatindhir.dev@gmail.com>
 */
(function(AMOHA) {
  'use strict';
  function boot() {
    if (/wrapper/.test(location.search)) {
      const main = document.querySelector('main.page');
      const wrap = document.createElement('div');
      wrap.className = 'scroll-wrapper';
      wrap.style.cssText = 'position:fixed;inset:0;overflow:auto;';
      main.parentNode.insertBefore(wrap, main);
      wrap.appendChild(main);
      AMOHA.wrapper = wrap;
      AMOHA.content = main;
    }
    AMOHA.initClouds();
    AMOHA.initLenis();
    AMOHA.initCookies();
    let builtDone;
    const built = new Promise(r => {
      builtDone = r;
    });
    const heroImg = document.querySelector('[data-hero-zoom] img, .hero__photo img');
    const hero = new Promise(res => {
      if (!heroImg) return res();
      if (heroImg.complete && heroImg.naturalWidth) {
        (heroImg.decode ? heroImg.decode() : Promise.resolve()).then(res, res);
        return;
      }
      heroImg.addEventListener('load', res, {
        once: true
      });
      heroImg.addEventListener('error', res, {
        once: true
      });
      setTimeout(res, 6e3);
    });
    AMOHA.milestones = {
      fonts: fonts,
      hero: hero,
      built: built
    };
    AMOHA.initPageTransition();
    const rest = () => new Promise(r => window.scheduler && scheduler.yield ? scheduler.yield().then(r) : setTimeout(r, 0));
    AMOHA.initPreloader(async function() {
      AMOHA.initParallax();
      AMOHA.initFitText();
      await rest();
      AMOHA.initScenes();
      await rest();
      AMOHA.initReveals();
      AMOHA.initThemes();
      await rest();
      AMOHA.initSnap();
      AMOHA.initScrollbar();
      AMOHA.initLogoRing();
      AMOHA.initHeroTabs();
      AMOHA.initHeroVideo();
      AMOHA.initNavBar();
      await rest();
      AMOHA.initPins();
      AMOHA.initTips();
      AMOHA.initSliders();
      AMOHA.initTabs();
      AMOHA.initLayers();
      AMOHA.initAccordions();
      await rest();
      AMOHA.initMagnetic();
      AMOHA.initCircleButtons();
      AMOHA.initLinkHover();
      AMOHA.initNavHover();
      AMOHA.initModals();
      AMOHA.initForm();
      AMOHA.initRouteArt();
      AMOHA.initMisc();
      ScrollTrigger.refresh();
      builtDone();
      (AMOHA.revealed || Promise.resolve()).then(() => AMOHA.initFlowerVideos().then(() => {
        AMOHA.initWind();
        AMOHA.initFlowers();
      }));
    });
  }
  const faces = [ '1em Fraunces', 'italic 1em Fraunces', '1em Aboreto', '1em Manrope' ];
  const fonts = document.fonts ? Promise.all(faces.map(f => document.fonts.load(f))).then(() => document.fonts.ready, () => {}) : Promise.resolve();
  const sized = () => new Promise(r => {
    if (window.innerWidth > 0) return r();
    let timer = 0;
    const check = () => {
      clearTimeout(timer);
      if (window.innerWidth > 0) {
        window.removeEventListener('resize', check);
        r();
      } else timer = setTimeout(check, 250);
    };
    window.addEventListener('resize', check);
    timer = setTimeout(check, 16);
  });
  const start = () => Promise.race([ fonts, new Promise(r => setTimeout(r, 3e3)) ]).then(sized).then(boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('load', () => ScrollTrigger.refresh());
})(window.AMOHA);
