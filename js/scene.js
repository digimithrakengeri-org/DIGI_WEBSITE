/* DigiMithra — 3D hero scene (Three.js)
 * An extruded "DM" growth-arrow logo at the center of an automation hub:
 * service satellites orbit the logo and stream data packets into it,
 * while a ring of growth bars pulses beneath and a particle field drifts behind.
 */
import * as THREE from "three";

const canvas = document.getElementById("hero3d");
const hero = document.getElementById("home");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const GREEN = 0x8cd630;
const GREEN_LIGHT = 0xb6f45a;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (err) {
  console.warn("WebGL unavailable — showing static hero.", err);
}

if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  /* ---------- the DM logo ---------- */
  const logo = new THREE.Group();
  world.add(logo);

  const extrude = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 32 };
  const greenMat = new THREE.MeshPhysicalMaterial({
    color: GREEN, emissive: 0x2c5a08, emissiveIntensity: 0.6,
    metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15,
  });
  const whiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f7f0, metalness: 0.1, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1,
  });

  // D bowl (white)
  const d = new THREE.Shape();
  d.moveTo(-0.55, 1.5);
  d.lineTo(0.15, 1.5);
  d.absarc(0.15, 0, 1.5, Math.PI / 2, -Math.PI / 2, true);
  d.lineTo(-0.55, -1.5);
  d.lineTo(-0.55, -1.08);
  d.lineTo(0.15, -1.08);
  d.absarc(0.15, 0, 1.08, -Math.PI / 2, Math.PI / 2, false);
  d.lineTo(-0.55, 1.08);
  d.closePath();
  const dMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(d, extrude), whiteMat);
  dMesh.position.z = -0.35;
  logo.add(dMesh);

  // M + growth arrow (green), built from a thick polyline
  const mPath = [[-0.8, -1.5], [-0.8, 1.25], [0.35, -0.25], [1.75, 1.45]];
  const mMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(thickPolyline(mPath, 0.46), extrude), greenMat);
  logo.add(mMesh);

  const [ax, ay] = mPath[mPath.length - 1];
  const [px, py] = mPath[mPath.length - 2];
  const dir = new THREE.Vector2(ax - px, ay - py).normalize();
  const perp = new THREE.Vector2(-dir.y, dir.x);
  const head = new THREE.Shape();
  head.moveTo(ax + dir.x * 0.75, ay + dir.y * 0.75);
  head.lineTo(ax + perp.x * 0.5 - dir.x * 0.05, ay + perp.y * 0.5 - dir.y * 0.05);
  head.lineTo(ax - perp.x * 0.5 - dir.x * 0.05, ay - perp.y * 0.5 - dir.y * 0.05);
  head.closePath();
  logo.add(new THREE.Mesh(new THREE.ExtrudeGeometry(head, extrude), greenMat));

  const stem = thickPolyline([[1.32, 0.55], [1.32, -1.5]], 0.46);
  logo.add(new THREE.Mesh(new THREE.ExtrudeGeometry(stem, extrude), greenMat));

  // center the logo geometry on its own pivot
  const box = new THREE.Box3().setFromObject(logo);
  const c = box.getCenter(new THREE.Vector3());
  logo.children.forEach((m) => m.position.sub(c));
  logo.scale.setScalar(0.95);

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
  const services = ["WEB", "SEO", "META", "SOCIAL", "ADS", "⚡ 1-CLICK"];
  const satellites = services.map((label, i) => {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.26, 1),
      new THREE.MeshStandardMaterial({ color: GREEN_LIGHT, emissive: GREEN, emissiveIntensity: 0.9, roughness: 0.3, flatShading: true })
    );
    const cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 0),
      new THREE.MeshBasicMaterial({ color: GREEN, wireframe: true, transparent: true, opacity: 0.55 })
    );
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(label), transparent: true, depthWrite: false }));
    tag.scale.set(1.1, 0.31, 1);
    tag.position.y = 0.62;
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

  /* ---------- growth bars ring ---------- */
  const bars = [];
  const barGroup = new THREE.Group();
  barGroup.position.y = -2.8;
  world.add(barGroup);
  const barGeo = new THREE.BoxGeometry(0.16, 1, 0.16);
  barGeo.translate(0, 0.5, 0);
  const BAR_COUNT = 36;
  for (let i = 0; i < BAR_COUNT; i++) {
    const a = (i / BAR_COUNT) * Math.PI * 2;
    const mat = new THREE.MeshStandardMaterial({ color: GREEN, emissive: GREEN, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 });
    const b = new THREE.Mesh(barGeo, mat);
    b.position.set(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6);
    barGroup.add(b);
    bars.push({ b, a });
  }
  const disc = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 3.0, 64),
    new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  barGroup.add(disc);

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
    if (w > 1024) { baseX = 4.4; baseY = 0.1; baseScale = 0.82; }
    else if (w > 700) { baseX = 2.8; baseY = 0.6; baseScale = 0.62; }
    else { baseX = 0; baseY = 2.9; baseScale = 0.46; }
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

  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible) { clock.getDelta(); return; }
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

    logo.rotation.y = Math.sin(t * 0.6) * 0.45 + (1 - ease) * Math.PI * 2;
    logo.position.y = Math.sin(t * 1.2) * 0.12;
    halo.material.opacity = 0.75 + Math.sin(t * 2) * 0.2;
    rings.rotation.z = t * 0.05;

    satellites.forEach((s) => {
      const a = s.phase + t * s.speed;
      v.set(Math.cos(a) * s.radius, 0, Math.sin(a) * s.radius);
      v.applyAxisAngle(new THREE.Vector3(1, 0, 0), s.tilt);
      s.g.position.copy(v);
      s.cage.rotation.x = t * 0.8;
      s.cage.rotation.y = t * 0.6;
      s.core.rotation.y = -t;
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

    bars.forEach(({ b, a }, i) => {
      const wave = Math.sin(t * 2 + i * 0.5) * 0.5 + 0.5;
      const growth = 0.25 + ((i % 12) / 12) * 1.1;
      b.scale.y = (0.15 + wave * growth) * ease;
      b.material.emissiveIntensity = 0.25 + wave * 0.8;
    });
    barGroup.rotation.y = -t * 0.15;

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

// Turn a centerline polyline into a solid Shape of the given width (mitered joins).
function thickPolyline(points, width) {
  const hw = width / 2;
  const P = points.map(([x, y]) => new THREE.Vector2(x, y));
  const normal = (a, b) => { const d = b.clone().sub(a).normalize(); return new THREE.Vector2(-d.y, d.x); };
  const left = [], right = [];
  for (let i = 0; i < P.length; i++) {
    const n1 = i > 0 ? normal(P[i - 1], P[i]) : null;
    const n2 = i < P.length - 1 ? normal(P[i], P[i + 1]) : null;
    let n, len = hw;
    if (n1 && n2) {
      n = n1.clone().add(n2).normalize();
      len = hw / Math.max(n.dot(n1), 0.3);
    } else n = n1 || n2;
    left.push(P[i].clone().addScaledVector(n, len));
    right.push(P[i].clone().addScaledVector(n, -len));
  }
  const s = new THREE.Shape();
  const outline = [...left, ...right.reverse()];
  s.moveTo(outline[0].x, outline[0].y);
  outline.slice(1).forEach((p) => s.lineTo(p.x, p.y));
  s.closePath();
  return s;
}

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

function labelTexture(text) {
  const c = document.createElement("canvas");
  c.width = 384; c.height = 108;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(10,16,8,0.85)";
  ctx.strokeStyle = "rgba(140,214,48,0.8)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(4, 4, 376, 100, 50);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d8f7b0";
  ctx.font = "600 44px Poppins, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 192, 57);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
