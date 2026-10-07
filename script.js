(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const SVG = "http://www.w3.org/2000/svg";
  const editMode = new URLSearchParams(location.search).has("edit");
  if (editMode) document.body.classList.add("edit");

  document.querySelectorAll("[data-event]").forEach((el) => {
    el.textContent = EVENT[el.dataset.event] ?? "";
  });
  $("#map-btn").href = EVENT.mapUrl;

  const start = new Date(EVENT.date);

  const countdown = $("#countdown");
  const cells = { d: $("[data-c=d]"), h: $("[data-c=h]"), m: $("[data-c=m]"), s: $("[data-c=s]") };
  function tick() {
    const ms = start - Date.now();
    if (ms <= 0) {
      countdown.classList.add("done");
      countdown.textContent = "¡Es hoy! 🎉";
      return;
    }
    const v = {
      d: Math.floor(ms / 864e5),
      h: Math.floor(ms / 36e5) % 24,
      m: Math.floor(ms / 6e4) % 60,
      s: Math.floor(ms / 1e3) % 60,
    };
    for (const k in v) {
      const txt = String(v[k]).padStart(k === "d" ? 1 : 2, "0");
      if (cells[k].textContent !== txt) {
        cells[k].textContent = txt;
        cells[k].classList.remove("tick");
        void cells[k].offsetWidth;
        cells[k].classList.add("tick");
      }
    }
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  if (!isNaN(start)) tick();

  const rotations = [-2.5, 1.8, -1.2, 2.6, -2, 1.4];
  let photoCount = 0;

  function createPolaroid(photo) {
    const fig = document.createElement("figure");
    fig.className = "polaroid";
    fig.style.setProperty("--rot", `${rotations[photoCount++ % rotations.length]}deg`);

    const frame = document.createElement("div");
    frame.className = "frame";
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.caption;
    img.loading = "lazy";
    frame.append(img);

    const svg = document.createElementNS(SVG, "svg");
    svg.classList.add("arrows");
    frame.append(svg);

    const tags = photo.arrows.map((a, i) => {
      const tag = document.createElement("span");
      tag.className = `name-tag c-${a.name}`;
      tag.textContent = a.name;
      tag.style.left = `${a.lx}%`;
      tag.style.top = `${a.ly}%`;
      tag.style.setProperty("--fd", `${0.5 + i * 0.4}s`);
      frame.append(tag);
      return tag;
    });

    const cap = document.createElement("figcaption");
    cap.textContent = photo.caption;
    fig.append(frame, cap);

    const draw = () => drawArrows(svg, img, photo.arrows, tags);
    img.addEventListener("load", draw);
    new ResizeObserver(draw).observe(img);

    if (editMode) {
      img.addEventListener("click", (e) => {
        const r = img.getBoundingClientRect();
        const x = (((e.clientX - r.left) / r.width) * 100).toFixed(0);
        const y = (((e.clientY - r.top) / r.height) * 100).toFixed(0);
        const txt = `x: ${x}, y: ${y}`;
        navigator.clipboard?.writeText(txt).catch(() => {});
        toast(`${photo.src.split("/").pop()} → ${txt} (copiado)`);
      });
    }
    return fig;
  }

  function drawArrows(svg, img, arrows, tags) {
    const w = img.clientWidth, h = img.clientHeight;
    if (!w || !h) return;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.replaceChildren();

    arrows.forEach((a, i) => {
      const P = { x: (a.x / 100) * w, y: (a.y / 100) * h };
      const tag = tags[i];
      const tw = tag.offsetWidth, th = tag.offsetHeight;
      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
      const exitFrom = (vx, vy) => Math.min(
        Math.abs(vx) > 1e-3 ? tw / 2 / Math.abs(vx) : Infinity,
        Math.abs(vy) > 1e-3 ? th / 2 / Math.abs(vy) : Infinity
      ) + 5;
      let gap = ((a.r ?? 8) / 100) * w + 4;
      const minLength = Math.max(34, w * 0.12);

      const L = { x: (a.lx / 100) * w, y: (a.ly / 100) * h };
      let vx = L.x - P.x, vy = L.y - P.y;
      const d0 = Math.hypot(vx, vy) || 1;
      vx /= d0; vy /= d0;
      const needed = exitFrom(vx, vy) + gap + minLength;
      if (d0 < needed) {
        L.x = P.x + vx * needed;
        L.y = P.y + vy * needed;
      }
      L.x = clamp(L.x, tw / 2 + 4, w - tw / 2 - 4);
      L.y = clamp(L.y, th / 2 + 4, h - th / 2 - 4);
      tag.style.left = `${L.x}px`;
      tag.style.top = `${L.y}px`;

      const dx = P.x - L.x, dy = P.y - L.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;

      const exit = exitFrom(ux, uy);
      if (dist - exit - gap < minLength) gap = Math.max(2, dist - exit - minLength);
      if (dist - exit - gap < 12) return;
      const S = { x: L.x + ux * exit, y: L.y + uy * exit };
      const E = { x: P.x - ux * gap, y: P.y - uy * gap };

      const side = i % 2 ? -1 : 1;
      const bend = Math.hypot(E.x - S.x, E.y - S.y) * 0.28 * side;
      const C = { x: (S.x + E.x) / 2 - uy * bend, y: (S.y + E.y) / 2 + ux * bend };

      const line = document.createElementNS(SVG, "path");
      line.setAttribute("d", `M${S.x},${S.y} Q${C.x},${C.y} ${E.x},${E.y}`);
      line.setAttribute("pathLength", "1");

      const ang = Math.atan2(E.y - C.y, E.x - C.x);
      const headLength = Math.max(10, Math.min(16, w * 0.035));
      const a1 = ang + Math.PI - 0.5, a2 = ang + Math.PI + 0.5;
      const head = document.createElementNS(SVG, "path");
      head.classList.add("arrowhead");
      head.setAttribute(
        "d",
        `M${E.x + Math.cos(a1) * headLength},${E.y + Math.sin(a1) * headLength} L${E.x},${E.y} L${E.x + Math.cos(a2) * headLength},${E.y + Math.sin(a2) * headLength}`
      );
      head.setAttribute("pathLength", "1");

      const fd = `${0.5 + i * 0.4}s`;
      line.style.setProperty("--fd", fd);
      head.style.setProperty("--fd", fd);
      svg.append(line, head);
    });
  }

  $("#family-photo").append(createPolaroid(FAMILY_PHOTO));
  TWINS_PHOTOS.forEach((p) => $("#twins-gallery").append(createPolaroid(p)));
  MEMORY_PHOTOS.forEach((p) => $("#memories-gallery").append(createPolaroid(p)));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        io.unobserve(e.target);
        if (e.target.id === "confetti-btn") setTimeout(() => confetti(120), 400);
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal, .polaroid").forEach((el) => io.observe(el));

  const audio = $("#music");
  const musicBtn = $("#music-btn");
  let audioOk = true;
  audio.addEventListener("error", () => { audioOk = false; musicBtn.hidden = true; });

  function fadeIn() {
    audio.volume = 0;
    const step = () => {
      audio.volume = Math.min(0.6, audio.volume + 0.03);
      if (audio.volume < 0.6) setTimeout(step, 120);
    };
    step();
  }
  function play() {
    if (!audioOk) return;
    audio.play().then(() => {
      musicBtn.hidden = false;
      musicBtn.classList.remove("paused");
      musicBtn.setAttribute("aria-label", "Pausar música");
    }).catch(() => {});
  }
  musicBtn.addEventListener("click", () => {
    if (audio.paused) play();
    else {
      audio.pause();
      musicBtn.classList.add("paused");
      musicBtn.setAttribute("aria-label", "Reproducir música");
    }
  });
  let wasPlaying = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { wasPlaying = !audio.paused; audio.pause(); }
    else if (wasPlaying) audio.play().catch(() => {});
  });

  const intro = $("#intro");
  function open() {
    if (intro.classList.contains("open")) return;
    intro.classList.add("open");
    play();
    fadeIn();
    setTimeout(() => {
      document.body.classList.remove("locked");
      document.body.classList.add("ready");
      confetti(90);
    }, 1500);
    setTimeout(() => intro.remove(), 2000);
  }
  intro.addEventListener("click", open);
  intro.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });

  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  const colors = ["#c9a14a", "#e9cf8f", "#2c4a6e", "#8fb1d4", "#6b7f5a", "#ffffff", "#e8a0a8"];
  let pieces = [];
  let running = false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize);

  function confetti(n = 100) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const W = innerWidth, H = innerHeight;
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0;
      const ang = (left ? -60 : -120) + (Math.random() * 30 - 15);
      const speed = 9 + Math.random() * 8;
      pieces.push({
        x: left ? -10 : W + 10,
        y: H * 0.75,
        vx: Math.cos((ang * Math.PI) / 180) * speed,
        vy: Math.sin((ang * Math.PI) / 180) * speed * 1.4,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: colors[(Math.random() * colors.length) | 0],
        circle: Math.random() < 0.25,
        life: 0,
      });
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }
  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter((p) => p.y < innerHeight + 40 && p.life < 400);
    for (const p of pieces) {
      p.life++;
      p.vy += 0.28;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      if (p.circle) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.life / 8)), p.w, p.h * Math.abs(Math.cos(p.life / 8)) + 1);
      ctx.restore();
    }
    if (pieces.length) requestAnimationFrame(frame);
    else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  $("#confetti-btn").addEventListener("click", () => confetti(160));

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
  }
})();
