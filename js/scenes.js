/*!
 * Amoha Group website — scroll-driven scenes
 * Designed and developed by Jatin Dhir <jatindhir.dev@gmail.com>
 */
(function(AMOHA) {
  'use strict';
  const D = AMOHA.D, arr = AMOHA.arr;
  const allowed = el => {
    const mob = AMOHA.isMobile();
    return !(mob && el.dataset.mob === 'off' || !mob && el.dataset.desk === 'off');
  };
  /* ---------- parallax ---------- */  AMOHA.initParallax = function() {
    if (AMOHA.reduced) return;
    arr('[data-parallax="img"]').forEach(img => {
      const w = img.closest('[data-parallax="w"]');
      if (!w || !allowed(w)) return;
      gsap.fromTo(img, {
        yPercent: -15
      }, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: w,
          start: 'top bottom',
          scrub: .5
        }
      });
    });
    arr('[data-parallax="img-out"]').forEach(img => {
      const w = img.closest('[data-parallax="w"]');
      if (!w || !allowed(w)) return;
      gsap.fromTo(img, {
        yPercent: 0
      }, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: w,
          start: 'bottom bottom',
          end: 'bottom top',
          scrub: .5
        }
      });
    });
    arr('[data-parallax="img-in"]').forEach(img => {
      const w = img.closest('[data-parallax="w"]');
      if (!w || !allowed(w)) return;
      gsap.fromTo(img, {
        yPercent: -20
      }, {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: w,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true
        }
      });
    });
    arr('[data-parallax="ctn-down"]').forEach(el => {
      if (!allowed(el)) return;
      gsap.fromTo(el, {
        yPercent: -10
      }, {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 125%',
          end: 'bottom -25%',
          scrub: .5
        }
      });
    });
    arr('[data-parallax="ctn-up"]').forEach(el => {
      if (!allowed(el)) return;
      gsap.fromTo(el, {
        yPercent: 10
      }, {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 125%',
          end: 'bottom -25%',
          scrub: .5
        }
      });
    });
  };
  AMOHA.initScenes = function() {
    if (AMOHA.reduced) {
      document.querySelectorAll('[data-part], [data-text]').forEach(el => {
        el.style.visibility = 'visible';
      });
      return;
    }
    const mob = AMOHA.isMobile();
    const heroArea = document.querySelector('[data-hero] .hero__area');
    if (heroArea) {
      const content = heroArea.querySelector('[data-hero-content]'), bg = heroArea.querySelector('[data-hero-bg]');
      const drift = heroArea.closest('[data-hero]').dataset.hero === 'parallax';
      const build = () => {
        const bgH = bg.offsetHeight, vh = window.innerHeight;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroArea,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true
          }
        });
        if (drift) {
          tl.fromTo(content, {
            y: 0
          }, {
            y: () => -(1.15 * window.innerHeight),
            ease: 'amohaEase',
            duration: .6
          }, 0);
          if (mob) tl.to(content, {
            autoAlpha: 0,
            ease: 'none',
            duration: .08
          }, .015);
          const tagline = bg.querySelector('.hero__tagline');
          if (tagline) {
            if (mob) tl.to(tagline, {
              autoAlpha: 0,
              ease: 'none',
              duration: .08
            }, .015); else tl.fromTo(tagline, {
              y: 0
            }, {
              y: () => -(1.15 * window.innerHeight),
              ease: 'amohaEase',
              duration: .6
            }, 0);
          }
          bg.querySelectorAll('[data-hero-layer]').forEach(layer => {
            const depth = parseFloat(layer.dataset.heroLayer) || .3;
            tl.fromTo(layer, {
              y: 0
            }, {
              y: () => -(depth * window.innerHeight),
              ease: 'amohaEase',
              duration: .6
            }, 0);
          });
          const glow = bg.querySelector('[data-hero-glow]');
          if (glow) tl.fromTo(glow, {
            opacity: .55
          }, {
            opacity: 1,
            ease: 'none',
            duration: .6
          }, 0);
          const reveal = bg.querySelectorAll('[data-hero-reveal]');
          if (reveal.length) {
            const laid = () => Array.prototype.find.call(reveal, r => r.offsetHeight > 0);
            const travel = () => {
              const el = laid(), f = el && el.closest('.img-w');
              return f ? -100 * (1 - f.offsetHeight / el.offsetHeight) : -41.2;
            };
            tl.fromTo(reveal, {
              yPercent: 0
            }, {
              yPercent: travel,
              ease: 'none',
              duration: document.querySelector('.benefits.arch') ? mob ? .45 : .27 : .5
            }, 0);
          }
          const nameEl = content.querySelector('.hero__name');
          if (nameEl && !AMOHA.lite && !nameEl.classList.contains('is-logo')) tl.fromTo(nameEl, {
            '--nm-wght': 500,
            '--nm-soft': 50
          }, {
            '--nm-wght': 330,
            '--nm-soft': 100,
            ease: 'none',
            duration: .6
          }, 0);
          const drifter = bg.querySelector('[data-hero-drift]');
          if (drifter) {
            gsap.set(drifter, {
              scale: 1.14,
              transformOrigin: '50% 50%'
            });
            tl.fromTo(drifter, {
              yPercent: -5
            }, {
              yPercent: 6,
              ease: 'none',
              duration: .6
            }, 0);
          }
        } else {
          if (!mob) tl.fromTo(content, {
            y: 0
          }, {
            y: () => -(1.25 * bg.offsetHeight - window.innerHeight),
            ease: 'amohaEase',
            duration: .6
          }).fromTo(bg, {
            y: 0
          }, {
            y: () => -(bg.offsetHeight - window.innerHeight),
            ease: 'amohaEase',
            duration: .6
          }, '<');
          tl.fromTo(bg, {
            scale: 1,
            transformOrigin: '50% 75%'
          }, {
            scale: 2,
            ease: 'amohaIn',
            duration: .6
          }, mob ? '>' : '-=0.2');
        }
        void bgH;
        void vh;
      };
      const img = bg.querySelector('img');
      if (img && !img.complete) {
        img.addEventListener('load', build, {
          once: true
        });
        img.addEventListener('error', build, {
          once: true
        });
      } else build();
    }
    const ringText = document.querySelector('[data-circle-text]');
    if (ringText) gsap.fromTo(ringText, {
      wordSpacing: '0px'
    }, {
      wordSpacing: '160px',
      ease: 'none',
      scrollTrigger: {
        trigger: ringText.closest('.intro'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
    const concept = document.querySelector('[data-scene="concept"]');
    if (concept) {
      const box = concept.querySelector('[data-scene-box]'), p = concept.querySelectorAll('[data-part="p"]'), ctn = concept.querySelectorAll('[data-part="ctn"]');
      AMOHA.animP(p, 'initial');
      AMOHA.animCtn(ctn, 'initial');
      const bounds = mob ? {
        start: 'top 85%',
        end: 'top 40%'
      } : {
        start: 'top 30%',
        end: 'bottom bottom'
      };
      gsap.timeline({
        scrollTrigger: {
          trigger: concept,
          start: bounds.start,
          end: bounds.end,
          scrub: .5,
          onEnter: () => {
            AMOHA.animP(p, 'reveal', .1);
            AMOHA.animCtn(ctn, 'reveal', .1);
          },
          onLeaveBack: () => {
            AMOHA.animP(p, 'hide', 0);
            AMOHA.animCtn(ctn, 'hide', 0);
          }
        }
      }).fromTo(box, {
        opacity: 0,
        scale: .75
      }, {
        opacity: 1,
        scale: 1,
        ease: 'none'
      }, 0);
    }
    if (mob) {
      gsap.utils.toArray('.benefits .slide').forEach(panel => {
        gsap.fromTo(panel, {
          y: 26,
          opacity: .6
        }, {
          y: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            start: 'top 92%',
            end: 'top 52%',
            scrub: .6
          }
        });
      });
    }
    (mob ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-horizontal]'))).forEach(area => {
      const track = area.querySelector('[data-horizontal-track]');
      const setHeight = () => {
        area.style.height = track.scrollWidth + 'px';
      };
      setHeight();
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - area.offsetWidth),
        ease: 'amohaHor',
        scrollTrigger: {
          trigger: area,
          start: '2.5% top',
          end: '97.5% bottom',
          scrub: .25,
          invalidateOnRefresh: true
        }
      });
      area._tween = tween;
      ScrollTrigger.addEventListener('refreshInit', setHeight);
      if (area.querySelector('.loc-intro')) ScrollTrigger.create({
        trigger: area,
        start: 'top bottom',
        end: 'bottom bottom',
        onToggle: st => document.documentElement.classList.toggle('is-sideways', st.isActive)
      });
      const lines = area.querySelectorAll('[data-line]');
      if (lines.length) gsap.fromTo(lines, {
        xPercent: gsap.utils.wrap([ -3, 8, -5 ])
      }, {
        xPercent: gsap.utils.wrap([ 3, -8, 5 ]),
        ease: 'none',
        scrollTrigger: {
          trigger: area,
          start: 'top top',
          end: 'bottom bottom',
          scrub: .25
        }
      });
      const fi = area.querySelector('[data-flower-intro]');
      fi && gsap.fromTo(fi, {
        xPercent: 0
      }, {
        xPercent: -25,
        ease: 'none',
        scrollTrigger: {
          trigger: area,
          start: 'top top',
          end: 'bottom bottom',
          scrub: .25
        }
      });
      const fp = area.querySelector('[data-flower-path]');
      fp && gsap.fromTo(fp, {
        yPercent: 0
      }, {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: {
          trigger: area,
          start: 'bottom bottom',
          end: 'bottom top',
          scrub: .25
        }
      });
    });
    const route = document.querySelector('[data-route]');
    if (route) {
      const horiz = route.closest('[data-horizontal]');
      const ca = horiz && horiz._tween ? horiz._tween : undefined;
      const labels = route.querySelector('[data-route-labels]');
      const at = f => () => {
        const track = horiz.querySelector('[data-horizontal-track]'), D = track.scrollWidth - horiz.offsetWidth;
        const l0 = track.offsetParent.getBoundingClientRect().left + track.offsetLeft + route.getBoundingClientRect().left - track.getBoundingClientRect().left;
        const e = gsap.utils.clamp(0, 1, (l0 - f * horiz.offsetWidth) / D), ease = gsap.parseEase(ca.vars.ease);
        let lo = 0, hi = 1;
        for (let i = 0; i < 24; i++) {
          const m = (lo + hi) / 2;
          if (ease(m) < e) lo = m; else hi = m;
        }
        return 'left ' + (l0 - lo * D) + 'px';
      };
      const rt = gsap.timeline({
        scrollTrigger: {
          trigger: route,
          containerAnimation: ca,
          start: ca ? at(.72) : 'top bottom',
          end: ca ? at(.18) : 'bottom bottom',
          scrub: 1
        }
      });
      const wipeFrom = AMOHA.isMobile() ? 'inset(0% 0% 100% 0%)' : 'inset(0% 100% 0% 0%)';
      rt.fromTo(route, {
        clipPath: wipeFrom
      }, {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none',
        duration: .8
      });
      labels && rt.fromTo(labels, {
        opacity: 0,
        y: 8
      }, {
        opacity: 1,
        y: 0,
        ease: 'none',
        duration: .35
      }, .62);
    }
    const mapBg = document.querySelector('[data-map-bg]');
    if (mapBg) gsap.from(mapBg, {
      scale: 1.15,
      transformOrigin: 'center bottom',
      ease: 'amohaEase',
      scrollTrigger: {
        trigger: mapBg.closest('.map__w'),
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: .25
      }
    });
    const amen = document.querySelector('[data-amen]');
    if (amen) {
      const slides = amen.querySelector('[data-amen-slides]'), stage = amen.querySelector('[data-amen-stage]');
      gsap.timeline({
        scrollTrigger: {
          trigger: amen,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true
        }
      }).fromTo(slides, {
        scale: 1
      }, {
        scale: 2,
        ease: 'amohaIn'
      }).fromTo(stage, {
        opacity: 1
      }, {
        opacity: 0,
        ease: 'amohaIn'
      }, '<');
    }
    const archArea = document.querySelector('[data-arch]');
    if (archArea && !mob) {
      const intro = archArea.querySelector('[data-arch-intro]'), L = archArea.querySelector('[data-arch-bg="l"]'), R = archArea.querySelector('[data-arch-bg="r"]');
      const fl = archArea.querySelector('[data-arch-flower="l"]'), fr = archArea.querySelector('[data-arch-flower="r"]');
      const w = archArea.querySelector('[data-arch-w]'), img = w.querySelector('[data-arch-img]');
      const h = w.querySelector('[data-text="h"]'), p = w.querySelector('[data-text="p"]');
      const hole = (x1, x2, y1, y2) => 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, ' + x1 + '% 100%, ' + x1 + '% ' + y1 + '%, ' + x2 + '% ' + y1 + '%, ' + x2 + '% ' + y2 + '%, ' + x1 + '% ' + y2 + '%, ' + x1 + '% 100%, 0% 100%)';
      gsap.timeline({
        scrollTrigger: {
          trigger: intro,
          start: 'top bottom',
          end: '200% top',
          scrub: true
        }
      }).fromTo(L, {
        clipPath: hole(44.4, 98.9, 36.1, 99.1)
      }, {
        clipPath: hole(44.4, 98.9, 18.5, 81.5),
        ease: 'none',
        duration: .5
      }).fromTo(R, {
        clipPath: hole(1.1, 55.6, .9, 63.9)
      }, {
        clipPath: hole(1.1, 55.6, 18.5, 81.5),
        ease: 'none',
        duration: .5
      }, '<').to(L, {
        clipPath: hole(44.4, 100, 18.5, 81.5),
        ease: 'none',
        duration: .1
      }).to(R, {
        clipPath: hole(0, 55.6, 18.5, 81.5),
        ease: 'none',
        duration: .1
      }, '<').fromTo(intro, {
        scale: 1
      }, {
        scale: 1.84,
        ease: 'amohaInOut',
        duration: .4
      }).to(fl, {
        scale: 1.84,
        xPercent: -50,
        ease: 'amohaInOut',
        duration: .4
      }, '<').to(fr, {
        scale: 1.84,
        xPercent: 50,
        ease: 'amohaInOut',
        duration: .4
      }, '<').fromTo(w, {
        scale: .75,
        transformOrigin: 'center top'
      }, {
        scale: 1,
        ease: 'amohaInOut',
        duration: .4
      }, '<');
      AMOHA.animH(h, 'initial');
      AMOHA.animP(p, 'initial');
      ScrollTrigger.create({
        trigger: archArea,
        start: '30% top',
        onEnter: () => {
          AMOHA.animH(h, 'reveal', 0);
          AMOHA.animP(p, 'reveal', D.s);
        },
        onLeaveBack: () => {
          AMOHA.animH(h, 'hide', 0);
          AMOHA.animP(p, 'hide', 0);
        }
      });
      img && gsap.to(img, {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: {
          trigger: archArea,
          start: '55% top',
          end: 'bottom top',
          scrub: true
        }
      });
    } else if (archArea) {
      archArea.querySelectorAll('[data-text]').forEach(el => {
        el.style.visibility = 'visible';
      });
    }
    arr('[data-arch] [data-part]').forEach(el => {
      const type = el.dataset.part;
      AMOHA.anim[type] && AMOHA.anim[type](el, 'initial');
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        once: true,
        onEnter: () => AMOHA.anim[type](el, 'reveal')
      });
    });
    const footer = document.querySelector('[data-footer]');
    if (footer) {
      const clip = document.querySelector('[data-footer-clip]'), s = footer.querySelector('[data-footer-s]');
      const h = footer.querySelectorAll('[data-text="h"]'), p = footer.querySelectorAll('[data-text="p"]'), ctn = footer.querySelectorAll('[data-text="ctn"]');
      AMOHA.animH(h, 'initial');
      AMOHA.animP(p, 'initial');
      AMOHA.animCtn(ctn, 'initial');
      const sq = mob ? [ 4, 32 ] : [ 8, 22 ], k = {
        v: 0
      };
      const paint = () => {
        const y = Math.round(clip.offsetHeight * sq[0] / 100 * k.v), x = Math.round(clip.offsetWidth * sq[1] / 100 * k.v);
        clip.style.clipPath = 'inset(' + y + 'px ' + x + 'px)';
      };
      gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: 'top 30%',
          end: 'bottom bottom',
          scrub: .5
        }
      }).fromTo(k, {
        v: 0
      }, {
        v: 1,
        ease: 'none',
        onUpdate: paint
      }, 0);
      ScrollTrigger.addEventListener('refresh', paint);
      gsap.fromTo(s, {
        opacity: 0,
        scale: mob ? .9 : .75
      }, {
        opacity: 1,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          end: 'top 45%',
          scrub: .5
        }
      });
      ScrollTrigger.create({
        trigger: footer,
        start: 'top 60%',
        onEnter: () => {
          AMOHA.animH(h, 'reveal', .1);
          AMOHA.animP(p, 'reveal', .1);
          AMOHA.animCtn(ctn, 'reveal', .1);
        },
        onLeaveBack: () => {
          AMOHA.animH(h, 'hide', 0);
          AMOHA.animP(p, 'hide', 0);
          AMOHA.animCtn(ctn, 'hide', 0);
        }
      });
      const cue = document.querySelector('[data-scroll-cue]');
      cue && gsap.to(cue, {
        opacity: 0,
        ease: 'amohaInOut',
        scrollTrigger: {
          trigger: footer,
          start: 'top bottom',
          end: 'center bottom',
          scrub: true
        }
      });
    }
  };
})(window.AMOHA);
