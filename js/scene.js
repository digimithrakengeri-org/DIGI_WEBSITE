/* DigiMithra — 3D hero scene (Three.js)
 * The original DigiMithra "DM" growth-arrow logo, as a solid 3D badge at the center of an automation hub:
 * service satellites orbit the logo and stream data packets into it,
 * while a real Earth globe rides above the logo and a particle field drifts behind.
 */
import * as THREE from "three";

const canvas = document.getElementById("hero3d");
const hero = document.getElementById("home");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Phones and small tablets: draw at lower resolution and 30 fps to keep scrolling smooth and save battery.
const isSmallScreen = window.matchMedia("(max-width: 860px)").matches;

const GREEN = 0x8cd630;
const GREEN_LIGHT = 0xb6f45a;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmallScreen, alpha: true, powerPreference: "high-performance" });
} catch (err) {
  console.warn("WebGL unavailable — showing static hero.", err);
}

if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmallScreen ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050705, 0.045);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.6, 12);

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(GREEN, 40, 30);
  rim.position.set(-5, 2, -3);
  scene.add(rim);
  const under = new THREE.PointLight(GREEN_LIGHT, 25, 20);
  under.position.set(0, -4, 4);
  scene.add(under);

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- the DM logo (original artwork) ---------- */
  // A solid 3D DM: the logo's exact outline (assets/logo-shape.json, traced from logo-mark.png)
  // is extruded with bevelled edges. The original artwork is painted on the front and back faces,
  // and each side wall takes the colour of the logo just inside that edge (white D, green M).
  // "stack" holds the DM and the globe it sits on, so they bob together.
  const stack = new THREE.Group();
  world.add(stack);
  const logo = new THREE.Group();
  stack.add(logo);

  const LOGO_W = 4.6, LOGO_H = LOGO_W * (344 / 484), LOGO_DEPTH = 0.42;
  const LOGO_Y = 1.35;
  logo.position.y = LOGO_Y;
  Promise.all([
    fetch("assets/logo-shape.json").then((r) => r.json()),
    new THREE.TextureLoader().loadAsync("assets/logo-mark.png"),
  ]).then(([outline, tex]) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const { width: PW, height: PH } = outline;
    const toWorld = ([px, py]) => new THREE.Vector2((px / PW - 0.5) * LOGO_W, (0.5 - py / PH) * LOGO_H);
    const shapes = outline.polygons.map(([outer, ...holes]) => {
      const shape = new THREE.Shape(outer.map(toWorld));
      holes.forEach((h) => shape.holes.push(new THREE.Path(h.map(toWorld))));
      return shape;
    });
    const BEVEL = 0.05;
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: LOGO_DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: 0.03, bevelSegments: 3, curveSegments: 1,
    });
    geo.translate(0, 0, -LOGO_DEPTH / 2);

    // read the artwork's pixels so each side-wall vertex can take the colour just inside its edge
    const img = tex.image, cv = document.createElement("canvas");
    cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const imgData = cx.getImageData(0, 0, cv.width, cv.height), px = imgData.data;
    // The artwork's bottom rows pick up the glow line from the original poster (bright speckles);
    // repaint them with the clean colour just above so the base of the D and M is solid.
    const CLEAN_ROW = Math.round(cv.height * (318 / 344));
    for (let y = CLEAN_ROW + 1; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      const k = (y * cv.width + x) * 4, s0 = (CLEAN_ROW * cv.width + x) * 4;
      if (px[k + 3] > 0 && px[s0 + 3] > 100) { px[k] = px[s0]; px[k + 1] = px[s0 + 1]; px[k + 2] = px[s0 + 2]; }
    }
    cx.putImageData(imgData, 0, 0);
    const faceTex = new THREE.CanvasTexture(cv);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.anisotropy = tex.anisotropy;
    const pos = geo.attributes.position, nrm = geo.attributes.normal, uv = geo.attributes.uv;
    const colors = new Float32Array(pos.count * 3), col = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const u = x / LOGO_W + 0.5, v = y / LOGO_H + 0.5;
      uv.setXY(i, u, v); // planar mapping: the artwork lines up exactly with the outline
      let sx = u * cv.width - nrm.getX(i) * 5, sy = (1 - v) * cv.height + nrm.getY(i) * 5;
      sx = Math.min(cv.width - 1, Math.max(0, sx | 0)); sy = Math.min(cv.height - 1, Math.max(0, sy | 0));
      const k = (sy * cv.width + sx) * 4;
      if (px[k + 3] > 100) col.setRGB(px[k] / 255, px[k + 1] / 255, px[k + 2] / 255, THREE.SRGBColorSpace);
      else col.set(GREEN);
      col.multiplyScalar(0.8);
      colors.set([col.r, col.g, col.b], i * 3);
    }
    uv.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTex, emissiveMap: faceTex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.1, fog: false,
    });
    const sideMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.25, fog: false });
    logo.add(new THREE.Mesh(geo, [faceMat, sideMat]));
  });

  // The DigiMithra globe (from the brand's own globe artwork) spins under the DM, which sits on top.
  // assets/globe-earth.jpg: front = the brand globe image, back = NASA Blue Marble restyled to match.
  const GLOBE_R = 1.9;
  const GLOBE_FRONT = -0.61; // turns the Americas side of the artwork towards the camera at start
  const globeTilt = new THREE.Group();
  globeTilt.position.y = LOGO_Y - LOGO_H / 2 - GLOBE_R + 0.32; // DM's base rests on the top of the globe
  globeTilt.rotation.z = 0.18;
  stack.add(globeTilt);
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_R, isSmallScreen ? 48 : 72, isSmallScreen ? 32 : 48),
    new THREE.MeshBasicMaterial({ color: 0x0a1a3a, fog: false })
  );
  globe.rotation.y = GLOBE_FRONT;
  globeTilt.add(globe);
  new THREE.TextureLoader().load("assets/globe-earth.jpg", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    globe.material.map = tex;
    globe.material.color.set(0xffffff);
    globe.material.needsUpdate = true;
  });
  // blue atmosphere glow around the globe, like the artwork's glowing rim
  const atmosphere = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture("rgba(80,160,255,0.85)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }));
  atmosphere.scale.set(GLOBE_R * 3.4, GLOBE_R * 3.4, 1);
  atmosphere.position.set(0, globeTilt.position.y, -GLOBE_R - 0.2);
  stack.add(atmosphere);

  // halo behind the logo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture("rgba(140,214,48,0.55)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.scale.set(9, 9, 1);
  halo.position.z = -1.5;
  world.add(halo);

  /* ---------- orbit rings ---------- */
  const rings = new THREE.Group();
  world.add(rings);
  [3.4, 4.3].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.35 })
    );
    ring.rotation.x = Math.PI / 2 + (i ? -0.32 : 0.28);
    ring.rotation.y = i ? 0.25 : -0.2;
    rings.add(ring);
  });

  /* ---------- service satellites ---------- */
  // Each satellite carries the real logo of its main platform, and its label lists
  // the platforms that service covers (logo files from assets/brands, Simple Icons).
  const services = [
    { label: "WEB", logos: ["wordpress", "html5"] },
    { label: "SEO", logos: ["google", "googlemaps"] },
    { label: "META", logos: ["meta", "facebook"] },
    { label: "SOCIAL", logos: ["instagram", "youtube"] },
    { label: "ADS", logos: ["googleads", "whatsapp"] },
    { label: "1-CLICK", logos: ["pagespeedinsights"] },
  ];
  const satellites = services.map(({ label, logos }, i) => {
    const g = new THREE.Group();
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: logoBadgeTexture(logos[0]), transparent: true, depthWrite: false, fog: false }));
    core.scale.set(0.74, 0.74, 1);
    const cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.46, 0),
      new THREE.MeshBasicMaterial({ color: GREEN, wireframe: true, transparent: true, opacity: 0.45 })
    );
    const { tex: labelTex, aspect } = labelTexture(label, logos);
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false, fog: false }));
    tag.scale.set(0.36 * aspect, 0.36, 1);
    tag.position.y = 0.72;
    g.add(core, cage, tag);
    world.add(g);
    return {
      g, core, cage,
      radius: i % 2 ? 4.3 : 3.4,
      tilt: i % 2 ? -0.32 : 0.28,
      speed: 0.18 + (i % 3) * 0.04,
      phase: (i / services.length) * Math.PI * 2,
    };
  });

  /* ---------- data packets streaming into the logo ---------- */
  const packetGeo = new THREE.SphereGeometry(0.06, 10, 10);
  const packetMat = new THREE.MeshBasicMaterial({ color: GREEN_LIGHT });
  const packets = [];
  satellites.forEach((s, si) => {
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Mesh(packetGeo, packetMat);
      world.add(m);
      packets.push({ m, s, t: (k / 3 + si * 0.13) % 1, speed: 0.35 + Math.random() * 0.2 });
    }
  });
  const linkMat = new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.18 });
  const links = satellites.map((s) => {
    const geo = new THREE.BufferGeometry().setFromPoints(new Array(20).fill(0).map(() => new THREE.Vector3()));
    const line = new THREE.Line(geo, linkMat);
    world.add(line);
    return { line, s };
  });
  const tmpCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
  const setCurve = (s) => {
    tmpCurve.v0.copy(s.g.position);
    tmpCurve.v1.copy(s.g.position).multiplyScalar(0.45).setY(s.g.position.y + 1.4);
    tmpCurve.v2.set(0, 0, 0.3);
    return tmpCurve;
  };

  /* ---------- floor grid ---------- */
  const grid = new THREE.GridHelper(60, 60, GREEN, 0x1d2a16);
  grid.position.y = -2.85;
  grid.material.transparent = true;
  grid.material.opacity = 0.25;
  scene.add(grid);

  /* ---------- particle field ---------- */
  const P = window.innerWidth < 700 ? 700 : 1600;
  const pos = new Float32Array(P * 3);
  for (let i = 0; i < P; i++) {
    const r = 7 + Math.random() * 18;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.6;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 6;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.07, color: GREEN_LIGHT, map: radialTexture("rgba(255,255,255,1)"),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8,
  }));
  scene.add(particles);

  /* ---------- layout / resize ---------- */
  let baseX = 0, baseY = 0, baseScale = 1;
  const resize = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (w > 1024) { baseX = 4.4; baseY = 0.35; baseScale = 0.74; }
    else if (w > 700) { baseX = 2.8; baseY = 0.6; baseScale = 0.56; }
    else { baseX = 0; baseY = 3.3; baseScale = 0.37; }
  };
  window.addEventListener("resize", resize);
  resize();

  /* ---------- interaction ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollP = 0;
  window.addEventListener("scroll", () => {
    scrollP = Math.min(window.scrollY / hero.clientHeight, 1);
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const v = new THREE.Vector3();
  const intro = { t: 0 };

  const frameStep = isSmallScreen ? 1000 / 30 : 0;
  let lastFrame = 0;
  const frame = (now = 0) => {
    requestAnimationFrame(frame);
    if (!visible) { clock.getDelta(); return; }
    if (now - lastFrame < frameStep - 1) return;
    lastFrame = now;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime * (reduceMotion ? 0.2 : 1);
    intro.t = Math.min(intro.t + dt * 0.6, 1);
    const ease = 1 - Math.pow(1 - intro.t, 3);

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    world.position.set(baseX, baseY + scrollP * 2, 0);
    world.scale.setScalar(baseScale * (0.6 + 0.4 * ease));
    world.rotation.y = mouse.x * 0.35 + scrollP * 1.2;
    world.rotation.x = mouse.y * 0.15 + 0.08;

    // gentle sway (plus one spin on load) so the solid DM shows its depth but always reads correctly
    logo.rotation.y = Math.sin(t * 0.55) * 0.5 + (1 - ease) * Math.PI * 2;
    stack.position.y = Math.sin(t * 1.2) * 0.12;
    globe.rotation.y = GLOBE_FRONT + t * 0.22; // the globe spins under the DM
    halo.material.opacity = 0.75 + Math.sin(t * 2) * 0.2;
    rings.rotation.z = t * 0.05;

    satellites.forEach((s) => {
      const a = s.phase + t * s.speed;
      v.set(Math.cos(a) * s.radius, 0, Math.sin(a) * s.radius);
      v.applyAxisAngle(new THREE.Vector3(1, 0, 0), s.tilt);
      s.g.position.copy(v);
      s.cage.rotation.x = t * 0.8;
      s.cage.rotation.y = t * 0.6;
    });

    links.forEach(({ line, s }) => {
      const pts = setCurve(s).getPoints(19);
      const arr = line.geometry.attributes.position.array;
      pts.forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; });
      line.geometry.attributes.position.needsUpdate = true;
    });

    packets.forEach((p) => {
      p.t = (p.t + dt * p.speed) % 1;
      setCurve(p.s).getPoint(p.t, p.m.position);
      p.m.scale.setScalar(0.6 + Math.sin(p.t * Math.PI) * 0.9);
    });

    particles.rotation.y = t * 0.02;
    particles.rotation.x = Math.sin(t * 0.1) * 0.05;

    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.03;
    camera.lookAt(baseX * 0.35, 0, 0);

    renderer.render(scene, camera);
  };
  frame();
  document.documentElement.classList.add("webgl-ready");
}

/* ---------- helpers ---------- */

function radialTexture(inner) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Cache lives on the function: init() runs before module-level consts below are initialised.
function brandImage(slug) {
  const cache = (brandImage.cache ||= {});
  if (!cache[slug]) {
    const img = new Image();
    cache[slug] = new Promise((resolve) => {
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // a missing logo just leaves the badge blank
    });
    img.src = `assets/brands/${slug}.svg`;
  }
  return cache[slug];
}

// White disc with a glowing green rim and the platform logo in the middle.
function logoBadgeTexture(slug) {
  const S = 256, c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  ctx.shadowColor = "rgba(140,214,48,0.9)";
  ctx.shadowBlur = 26;
  ctx.fillStyle = "#f4f7f0";
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(140,214,48,0.95)";
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  brandImage(slug).then((img) => {
    if (!img) return;
    const L = 104;
    ctx.drawImage(img, (S - L) / 2, (S - L) / 2, L, L);
    tex.needsUpdate = true;
  });
  return tex;
}

// Dark pill: small logo tiles followed by the service name. Returns the texture and its aspect ratio.
function labelTexture(text, logos = []) {
  const H = 108, TILE = 72, GAP = 10, PAD = 18;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const font = "600 44px Poppins, sans-serif";
  ctx.font = font;
  const textW = Math.ceil(ctx.measureText(text).width);
  c.width = PAD + logos.length * (TILE + GAP) + textW + PAD + 12;
  c.height = H;
  const draw = (imgs) => {
    ctx.clearRect(0, 0, c.width, H);
    ctx.fillStyle = "rgba(10,16,8,0.88)";
    ctx.strokeStyle = "rgba(140,214,48,0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(4, 4, c.width - 8, H - 8, (H - 8) / 2);
    ctx.fill();
    ctx.stroke();
    logos.forEach((_, i) => {
      const x = PAD + i * (TILE + GAP), y = (H - TILE) / 2;
      ctx.fillStyle = "#f4f7f0";
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y + TILE / 2, TILE / 2, 0, Math.PI * 2);
      ctx.fill();
      if (imgs && imgs[i]) ctx.drawImage(imgs[i], x + 16, y + 16, TILE - 32, TILE - 32);
    });
    ctx.fillStyle = "#d8f7b0";
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, PAD + logos.length * (TILE + GAP) + 4, H / 2 + 3);
  };
  draw(null);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  Promise.all(logos.map(brandImage)).then((imgs) => { draw(imgs); tex.needsUpdate = true; });
  return { tex, aspect: c.width / H };
}
