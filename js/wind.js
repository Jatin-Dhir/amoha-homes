/* =========================================================
   ERA RESIDENCE — WebGL wind for the bougainvillea cut-outs
   One shared WebGL context renders each flower texture on a
   displaced grid (slow whole-branch sway + leaf ripple + petal
   flutter, anchored at the edge the branch enters from), then
   blits into a small 2D canvas laid over the <img>. The image
   stays as the poster and as the fallback when WebGL is missing
   or reduced motion is requested. Renders only while in view.
   ========================================================= */
(function (ERA) {
  'use strict';
  const arr = ERA.arr;
  const GRID = 64, GL_SIZE = 1024, PAD = 0.92;       // quad inset leaves room for displaced tips

  const VS = [
    'attribute vec2 aPos;',
    'uniform float uTime, uPhase, uAmp, uAspect, uPetal;',
    'uniform vec2 uAnchor;',
    'uniform sampler2D uTex;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }',
    'void main(){',
    '  vUv = aPos;',
    '  float d = clamp(dot(aPos - (0.5 - 0.5 * uAnchor), uAnchor), 0.0, 1.0);',   // 0 at the anchor edge, 1 at the far edge
    '  float w = smoothstep(0.04, 1.0, d);',
    '  float t = uTime;',
    '  float gust = 0.55 + 0.45 * sin(t * 0.21 + uPhase) * sin(t * 0.083 + uPhase * 1.7);',
    '  vec2 perp = vec2(uAnchor.y, -uAnchor.x);',
    '  float sway = sin(t * 0.9 + uPhase + d * 2.2) * 0.55 + sin(t * 0.37 + uPhase * 0.6) * 0.45;',
    '  vec2 disp = perp * sway * 0.6 * w * w + uAnchor * sway * 0.12 * w * w;',
    '  vec2 n1 = vec2(noise(aPos * 3.0 + vec2(t * 0.35, uPhase)), noise(aPos * 3.0 + vec2(uPhase, t * 0.3))) - 0.5;',
    '  disp += n1 * 0.5 * w;',
    '  vec4 c = texture2D(uTex, aPos);',
    '  float a = max(c.a, 0.001); vec3 rgb = c.rgb / a;',
    '  float sat = max(rgb.r, max(rgb.g, rgb.b)) - min(rgb.r, min(rgb.g, rgb.b));',
    '  float petal = mix(0.6, smoothstep(0.2, 0.55, sat) * step(0.3, c.a) + 0.35, uPetal);',
    '  vec2 n2 = vec2(noise(aPos * 9.0 + vec2(t * 1.7, uPhase)), noise(aPos * 9.0 + vec2(uPhase * 2.0, t * 1.5))) - 0.5;',
    '  disp += n2 * 0.28 * w * petal;',
    '  disp *= uAmp * gust;',
    '  if (uAspect > 1.0) disp.x /= uAspect; else disp.y *= uAspect;',
    '  vec2 p = 0.5 + (aPos + disp - 0.5) * ' + PAD.toFixed(2) + ';',
    '  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);',
    '}'
  ].join('\n');
  const FS = 'precision mediump float; uniform sampler2D uTex; varying vec2 vUv; void main(){ gl_FragColor = texture2D(uTex, vUv); }';

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('wind shader:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  // which edge does the branch enter from? the edge band holding the most opaque pixels
  function detectAnchor(img) {
    const S = 48, c = document.createElement('canvas'); c.width = S; c.height = S;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, S, S);
    const px = ctx.getImageData(0, 0, S, S).data, band = 8, sums = { top: 0, bottom: 0, left: 0, right: 0 };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const a = px[(y * S + x) * 4 + 3];
      if (y < band) sums.top += a; if (y >= S - band) sums.bottom += a;
      if (x < band) sums.left += a; if (x >= S - band) sums.right += a;
    }
    const best = Object.keys(sums).sort((p, q) => sums[q] - sums[p])[0];
    return { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] }[best];
  }

  /* ---------- real footage: a transparent clip over its poster, playing only in view ---------- */
  ERA.initFlowerVideos = function () {
    const done = Promise.resolve();
    if (ERA.reduced) return done;
    // WebKit plays the HEVC-with-alpha .mov twins; everything else the VP9 .webm. WebKit also
    // reports VP9 WebM as playable but drops its alpha, so it is never offered the .webm
    const probe = document.createElement('video');
    const webkit = /apple/i.test(navigator.vendor || '');
    const kind = webkit ? 'mov' : (probe.canPlayType('video/webm; codecs="vp9"') ? 'webm' : null);
    if (!kind) return done;                                              // neither: keep the WebGL wind
    const srcOf = (wrap) => (kind === 'mov' ? wrap.dataset.video.replace(/\.webm$/, '.mov') : wrap.dataset.video);
    const wraps = arr('.flower[data-video]'); if (!wraps.length) return done;
    const exists = {};
    const check = (src) => exists[src] || (exists[src] = fetch(src, { method: 'HEAD' }).then((r) => r.ok, () => false));
    // only wrappers whose clip is actually present become videos; the others go straight to the wind
    return Promise.all(wraps.map((wrap) => check(srcOf(wrap)).then((ok) => { if (ok) attach(wrap, srcOf(wrap)); }))).then(() => {});
    function attach(wrap, src) {
      const img = wrap.querySelector('img'); if (!src) return;
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = ERA.isMobile() ? 'metadata' : 'auto'; v.className = 'flower__video'; v.setAttribute('aria-hidden', 'true');
      v.disablePictureInPicture = true;
      const s = document.createElement('source'); s.src = src; s.type = kind === 'mov' ? 'video/mp4' : 'video/webm'; v.appendChild(s);
      let failed = false;
      const fail = () => { if (failed) return; failed = true; wrap.classList.remove('is-video'); v.remove(); if (img) img.style.opacity = ''; wrap.dispatchEvent(new CustomEvent('flower:fallback')); };
      v.addEventListener('error', fail); s.addEventListener('error', fail);
      v.addEventListener('playing', () => { if (img) img.style.opacity = '0'; });
      v.addEventListener('pause', () => { if (img) img.style.opacity = ''; });      // poster back while parked out of view
      wrap.appendChild(v); wrap.classList.add('is-video');
      // in-view gating only (browsers already throttle media in background tabs; some
      // embedded webviews report the document as hidden permanently)
      new IntersectionObserver((entries) => {
        const inView = entries[entries.length - 1].isIntersecting;
        if (inView) { if (v.paused) v.play().catch(() => {}); }
        else if (!v.paused) v.pause();
      }, { rootMargin: '30%' }).observe(wrap);
    }
  };

  ERA.initWind = function () {
    if (ERA.reduced) return false;
    const imgs = arr('.flower:not(.is-video) img'); if (!imgs.length) return false;
    const glCanvas = document.createElement('canvas'); glCanvas.width = glCanvas.height = GL_SIZE;
    const gl = glCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return false;
    const vs = compile(gl, gl.VERTEX_SHADER, VS), fs = compile(gl, gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return false;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('wind program:', gl.getProgramInfoLog(prog)); return false; }
    gl.useProgram(prog);
    const U = {}; ['uTime', 'uPhase', 'uAmp', 'uAspect', 'uPetal', 'uAnchor', 'uTex'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    const petalOk = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;

    // grid mesh
    const verts = [], idx = [];
    for (let y = 0; y <= GRID; y++) for (let x = 0; x <= GRID; x++) verts.push(x / GRID, y / GRID);
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) { const i = y * (GRID + 1) + x; idx.push(i, i + 1, i + GRID + 1, i + 1, i + GRID + 2, i + GRID + 1); }
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.uniform1i(U.uTex, 0); gl.uniform1f(U.uPetal, petalOk ? 1 : 0);

    const state = { amp: parseFloat((location.search.match(/wind=([\d.]+)/) || [])[1]) || 0.034, flowers: [], hidden: false };
    ERA.wind = state; ERA.windActive = true;
    const dprCap = ERA.isMobile() ? 1 : 1.5;

    const setup = (img, i) => {
      const wrap = img.closest('.flower'); if (!wrap) return;
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); } catch (e) { return; }
      const canvas = document.createElement('canvas'); canvas.className = 'flower__gl'; canvas.setAttribute('aria-hidden', 'true');
      wrap.appendChild(canvas);
      const f = { img, wrap, canvas, ctx: canvas.getContext('2d'), tex, phase: i * 1.7 + 0.4, anchor: detectAnchor(img), aspect: img.naturalWidth / img.naturalHeight, visible: false, w: 0, h: 0 };
      const size = () => {
        // layout size, not the transformed bounding box (wrappers are rotated / flipped)
        const cw = canvas.offsetWidth, ch = canvas.offsetHeight; if (!cw || !ch) return;
        const dpr = Math.min(dprCap, window.devicePixelRatio || 1);
        let w = Math.round(cw * dpr), h = Math.round(ch * dpr);
        if (w > GL_SIZE || h > GL_SIZE) { const s = GL_SIZE / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
        if (w !== f.w || h !== f.h) { f.w = canvas.width = w; f.h = canvas.height = h; }
      };
      size(); new ResizeObserver(size).observe(img);
      new IntersectionObserver((entries) => { f.visible = entries[entries.length - 1].isIntersecting; }, { rootMargin: '25%' }).observe(wrap);
      wrap.classList.add('is-gl'); state.flowers.push(f);
    };
    const boot = (img, i) => { const go = () => setup(img, i); (img.complete && img.naturalWidth) ? go() : (img.decode ? img.decode().then(go, () => {}) : img.addEventListener('load', go, { once: true })); };
    imgs.forEach(boot);
    // a clip that fails to load hands its flower over to the wind
    arr('.flower.is-video').forEach((wrap, i) => wrap.addEventListener('flower:fallback', () => { const img = wrap.querySelector('img'); img && boot(img, imgs.length + i); }, { once: true }));

    document.addEventListener('visibilitychange', () => { state.hidden = document.hidden; });
    glCanvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); state.flowers.forEach((f) => { f.wrap.classList.remove('is-gl'); f.canvas.remove(); }); state.flowers = []; gsap.ticker.remove(render); ERA.windActive = false; });

    function render(time) {
      if (state.hidden) return;
      for (const f of state.flowers) {
        if (!f.visible || !f.w || !f.h) continue;
        let vw = f.w, vh = f.h; if (vw > GL_SIZE || vh > GL_SIZE) { const s = GL_SIZE / Math.max(vw, vh); vw = Math.round(vw * s); vh = Math.round(vh * s); }
        gl.viewport(0, 0, vw, vh); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, vw, vh); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindTexture(gl.TEXTURE_2D, f.tex);
        gl.uniform1f(U.uTime, time); gl.uniform1f(U.uPhase, f.phase); gl.uniform1f(U.uAmp, state.amp); gl.uniform1f(U.uAspect, f.aspect);
        gl.uniform2f(U.uAnchor, f.anchor[0], f.anchor[1]);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
        f.ctx.clearRect(0, 0, f.w, f.h);
        f.ctx.drawImage(glCanvas, 0, GL_SIZE - vh, vw, vh, 0, 0, f.w, f.h);
      }
    }
    gsap.ticker.add(render);
    ERA.destroyWind = () => { gsap.ticker.remove(render); state.flowers.forEach((f) => { gl.deleteTexture(f.tex); f.canvas.remove(); f.wrap.classList.remove('is-gl'); }); gl.deleteBuffer(vbo); gl.deleteBuffer(ibo); gl.deleteProgram(prog); const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); ERA.windActive = false; };
    return true;
  };
})(window.ERA);
