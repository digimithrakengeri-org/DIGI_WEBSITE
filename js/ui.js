/* DigiMithra — UI interactions (no dependencies) */
(() => {
  // Put the business WhatsApp number here (country code, digits only), e.g. "919876543210".
  // Left empty, the form opens WhatsApp's share picker with the message pre-filled.
  const WHATSAPP_NUMBER = "";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- loader ---------- */
  document.body.classList.add("loading");
  const hideLoader = () => {
    $("#loader")?.classList.add("done");
    document.body.classList.remove("loading");
  };
  window.addEventListener("load", () => setTimeout(hideLoader, 500));
  setTimeout(hideLoader, 4000); // never block on slow CDNs

  $("#year").textContent = new Date().getFullYear();

  /* ---------- nav ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = $("#menuToggle");
  const links = $("#navLinks");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- cursor glow ---------- */
  const glow = $(".cursor-glow");
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, { passive: true });
  }

  /* ---------- typed text ---------- */
  const words = ["website builds", "SEO rankings", "Meta Business ads", "Instagram posting", "lead follow-ups", "one-click optimization"];
  const typed = $("#typed");
  let wi = 0, ci = 0, del = false;
  const type = () => {
    const w = words[wi];
    typed.textContent = w.slice(0, ci);
    if (!del && ci === w.length) { del = true; return setTimeout(type, 1500); }
    if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; }
    ci += del ? -1 : 1;
    setTimeout(type, del ? 35 : 75);
  };
  type();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const siblings = $$(".reveal", el.parentElement);
      el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 80 + "ms";
      el.classList.add("in");
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- 3D tilt cards ---------- */
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.transform = `rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 14}deg) translateZ(0)`;
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
      });
      card.addEventListener("pointerleave", () => {
        card.style.transition = "transform .6s ease, border-color .3s, box-shadow .3s";
        card.style.transform = "";
        setTimeout(() => (card.style.transition = ""), 600);
      });
    });
  }

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = +el.dataset.count;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / 1600, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (el.dataset.suffix || "");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- automation pipeline + console ---------- */
  const nodes = $$("#pipeline .node");
  const pulse = $("#pipeline .pulse");
  const log = $("#consoleLog");
  const script = [
    ["Attract", "New visitor from Google → keyword <span class='hl'>\"digital marketing near me\"</span>"],
    ["Attract", "Meta ad #A12 delivered to 2,480 people · CTR 3.9%"],
    ["Convert", "Landing page loaded in <span class='hl'>0.8s</span> · lead form submitted"],
    ["Automate", "WhatsApp auto-reply sent to lead · CRM record created"],
    ["Automate", "Welcome email sequence started (3 steps)"],
    ["Engage", "Reel scheduled → Instagram + Facebook @ 7:30 PM"],
    ["Engage", "Retargeting audience updated · 1,120 warm users"],
    ["Grow", "Weekly report generated · leads <span class='hl'>+46%</span> vs last week"],
    ["Grow", "One-Click Optimize applied 7 fixes · score 94 → 98"],
  ];
  const stepIndex = { Attract: 0, Convert: 1, Automate: 2, Engage: 3, Grow: 4 };
  const lines = [];
  let li = 0, running = false;
  const isVertical = () => window.matchMedia("(max-width: 860px)").matches;
  const tick = () => {
    const [stage, msg] = script[li % script.length];
    const idx = stepIndex[stage];
    nodes.forEach((n, i) => n.classList.toggle("active", i === idx));
    const pct = (idx / (nodes.length - 1)) * 100 + "%";
    if (isVertical()) { pulse.style.height = pct; pulse.style.width = ""; }
    else { pulse.style.width = pct; pulse.style.height = ""; }
    const t = new Date().toLocaleTimeString([], { hour12: false });
    lines.push(`<span class="t">[${t}]</span> <span class="ok">✔ ${stage.toUpperCase()}</span>  ${msg}`);
    if (lines.length > 9) lines.shift();
    log.innerHTML = lines.join("\n");
    li++;
  };
  const pipeIO = new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running) {
      running = true;
      tick();
      setInterval(tick, 1800);
    }
  }, { threshold: 0.3 });
  pipeIO.observe($("#automation"));

  /* ---------- one-click optimize demo ---------- */
  const CIRC = 2 * Math.PI * 86;
  const arc = $("#gaugeArc");
  const num = $("#gaugeNum");
  const setGauge = (v) => {
    arc.style.strokeDashoffset = CIRC * (1 - v / 100);
    arc.style.stroke = v < 50 ? "#e0584f" : v < 80 ? "#e3b341" : "";
    num.textContent = Math.round(v);
  };
  setGauge(42);

  const checks = $$("#checks li");
  let optimizing = false;
  $("#optForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (optimizing) return;
    optimizing = true;
    const btn = $("#optBtn");
    btn.textContent = "Scanning…";
    const before = 30 + Math.random() * 25;
    setGauge(before);
    checks.forEach((li) => {
      li.className = "";
      li.querySelector(".bar i").style.width = "0";
      li.querySelector(".st").textContent = "—";
    });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let score = before;
    for (const li of checks) {
      li.classList.add("scan");
      li.querySelector(".st").textContent = "scan";
      await wait(450);
      const fixed = 88 + Math.floor(Math.random() * 12);
      li.querySelector(".bar i").style.width = fixed + "%";
      li.querySelector(".st").textContent = fixed + "%";
      li.classList.replace("scan", "done");
      const target = score + (96 - before) / checks.length;
      const from = score;
      const t0 = performance.now();
      await new Promise((res) => {
        const anim = (now) => {
          const p = Math.min((now - t0) / 500, 1);
          setGauge(from + (target - from) * p);
          p < 1 ? requestAnimationFrame(anim) : res();
        };
        requestAnimationFrame(anim);
      });
      score = target;
    }
    btn.textContent = "✔ Optimized";
    setTimeout(() => { btn.textContent = "⚡ Optimize"; optimizing = false; }, 2500);
  });

  /* ---------- contact form → WhatsApp ---------- */
  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const svcs = fd.getAll("svc").join(", ") || "Not specified";
    const text = [
      "Hi DigiMithra! I'd like to grow my brand.",
      `Name: ${fd.get("name")}`,
      `Phone: ${fd.get("phone")}`,
      fd.get("business") && `Business: ${fd.get("business")}`,
      `Interested in: ${svcs}`,
      fd.get("message") && `Message: ${fd.get("message")}`,
    ].filter(Boolean).join("\n");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
    $("#formMsg").textContent = "Opening WhatsApp… we'll get back to you within 24 hours!";
    e.target.reset();
  });
})();
