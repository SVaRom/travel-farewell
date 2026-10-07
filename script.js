(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const SVG = "http://www.w3.org/2000/svg";
  const modoEditar = new URLSearchParams(location.search).has("editar");
  if (modoEditar) document.body.classList.add("editar");

  document.querySelectorAll("[data-evento]").forEach((el) => {
    el.textContent = EVENTO[el.dataset.evento] ?? "";
  });
  $("#btn-mapa").href = EVENTO.mapa;

  const inicio = new Date(EVENTO.fecha);

  const cuenta = $("#cuenta");
  const celdas = { d: $("[data-c=d]"), h: $("[data-c=h]"), m: $("[data-c=m]"), s: $("[data-c=s]") };
  function tic() {
    const ms = inicio - Date.now();
    if (ms <= 0) {
      cuenta.classList.add("ya");
      cuenta.textContent = "¡Es hoy! 🎉";
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
      if (celdas[k].textContent !== txt) {
        celdas[k].textContent = txt;
        celdas[k].classList.remove("tick");
        void celdas[k].offsetWidth;
        celdas[k].classList.add("tick");
      }
    }
    setTimeout(tic, 1000 - (Date.now() % 1000));
  }
  if (!isNaN(inicio)) tic();

  const rotaciones = [-2.5, 1.8, -1.2, 2.6, -2, 1.4];
  let nFoto = 0;

  function crearPolaroid(foto) {
    const fig = document.createElement("figure");
    fig.className = "polaroid";
    fig.style.setProperty("--rot", `${rotaciones[nFoto++ % rotaciones.length]}deg`);

    const marco = document.createElement("div");
    marco.className = "marco";
    const img = document.createElement("img");
    img.src = foto.src;
    img.alt = foto.texto;
    img.loading = "lazy";
    marco.append(img);

    const svg = document.createElementNS(SVG, "svg");
    svg.classList.add("flechas");
    marco.append(svg);

    const etiquetas = foto.flechas.map((f, i) => {
      const et = document.createElement("span");
      et.className = `etiqueta c-${f.nombre}`;
      et.textContent = f.nombre;
      et.style.left = `${f.lx}%`;
      et.style.top = `${f.ly}%`;
      et.style.setProperty("--fd", `${0.5 + i * 0.4}s`);
      marco.append(et);
      return et;
    });

    const cap = document.createElement("figcaption");
    cap.textContent = foto.texto;
    fig.append(marco, cap);

    const dibujar = () => dibujarFlechas(svg, img, foto.flechas, etiquetas);
    img.addEventListener("load", dibujar);
    new ResizeObserver(dibujar).observe(img);

    if (modoEditar) {
      img.addEventListener("click", (e) => {
        const r = img.getBoundingClientRect();
        const x = (((e.clientX - r.left) / r.width) * 100).toFixed(0);
        const y = (((e.clientY - r.top) / r.height) * 100).toFixed(0);
        const txt = `x: ${x}, y: ${y}`;
        navigator.clipboard?.writeText(txt).catch(() => {});
        toast(`${foto.src.split("/").pop()} → ${txt} (copiado)`);
      });
    }
    return fig;
  }

  function dibujarFlechas(svg, img, flechas, etiquetas) {
    const w = img.clientWidth, h = img.clientHeight;
    if (!w || !h) return;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.replaceChildren();

    flechas.forEach((f, i) => {
      const P = { x: (f.x / 100) * w, y: (f.y / 100) * h };
      const et = etiquetas[i];
      const ew = et.offsetWidth, eh = et.offsetHeight;
      const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
      const L = {
        x: limitar((f.lx / 100) * w, ew / 2 + 4, w - ew / 2 - 4),
        y: limitar((f.ly / 100) * h, eh / 2 + 4, h - eh / 2 - 4),
      };
      et.style.left = `${L.x}px`;
      et.style.top = `${L.y}px`;

      const dx = P.x - L.x, dy = P.y - L.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;

      const salida = Math.min(
        Math.abs(ux) > 1e-3 ? ew / 2 / Math.abs(ux) : Infinity,
        Math.abs(uy) > 1e-3 ? eh / 2 / Math.abs(uy) : Infinity
      ) + 5;
      let hueco = ((f.r ?? 8) / 100) * w + 4;
      const minimo = 18;
      if (dist - salida - hueco < minimo) hueco = Math.max(2, dist - salida - minimo);
      if (dist - salida - hueco < 10) return;
      const S = { x: L.x + ux * salida, y: L.y + uy * salida };
      const E = { x: P.x - ux * hueco, y: P.y - uy * hueco };

      const lado = i % 2 ? -1 : 1;
      const curva = Math.hypot(E.x - S.x, E.y - S.y) * 0.28 * lado;
      const C = { x: (S.x + E.x) / 2 - uy * curva, y: (S.y + E.y) / 2 + ux * curva };

      const linea = document.createElementNS(SVG, "path");
      linea.setAttribute("d", `M${S.x},${S.y} Q${C.x},${C.y} ${E.x},${E.y}`);
      linea.setAttribute("pathLength", "1");

      const ang = Math.atan2(E.y - C.y, E.x - C.x);
      const largo = Math.max(10, Math.min(16, w * 0.035));
      const a1 = ang + Math.PI - 0.5, a2 = ang + Math.PI + 0.5;
      const punta = document.createElementNS(SVG, "path");
      punta.classList.add("punta");
      punta.setAttribute(
        "d",
        `M${E.x + Math.cos(a1) * largo},${E.y + Math.sin(a1) * largo} L${E.x},${E.y} L${E.x + Math.cos(a2) * largo},${E.y + Math.sin(a2) * largo}`
      );
      punta.setAttribute("pathLength", "1");

      const fd = `${0.5 + i * 0.4}s`;
      linea.style.setProperty("--fd", fd);
      punta.style.setProperty("--fd", fd);
      svg.append(linea, punta);
    });
  }

  $("#foto-familia").append(crearPolaroid(FOTO_FAMILIA));
  FOTOS_GEMELOS.forEach((f) => $("#galeria-gemelos").append(crearPolaroid(f)));
  FOTOS_RECUERDOS.forEach((f) => $("#galeria-recuerdos").append(crearPolaroid(f)));

  const io = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        io.unobserve(e.target);
        if (e.target.id === "btn-confeti") setTimeout(() => confeti(120), 400);
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal, .polaroid").forEach((el) => io.observe(el));

  const audio = $("#musica");
  const btnMusica = $("#btn-musica");
  let audioOk = true;
  audio.addEventListener("error", () => { audioOk = false; btnMusica.hidden = true; });

  function fadeIn() {
    audio.volume = 0;
    const paso = () => {
      audio.volume = Math.min(0.6, audio.volume + 0.03);
      if (audio.volume < 0.6) setTimeout(paso, 120);
    };
    paso();
  }
  function tocar() {
    if (!audioOk) return;
    audio.play().then(() => {
      btnMusica.hidden = false;
      btnMusica.classList.remove("pausado");
      btnMusica.setAttribute("aria-label", "Pausar música");
    }).catch(() => {});
  }
  btnMusica.addEventListener("click", () => {
    if (audio.paused) tocar();
    else {
      audio.pause();
      btnMusica.classList.add("pausado");
      btnMusica.setAttribute("aria-label", "Reproducir música");
    }
  });
  let sonabaAntes = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { sonabaAntes = !audio.paused; audio.pause(); }
    else if (sonabaAntes) audio.play().catch(() => {});
  });

  const sobre = $("#sobre");
  function abrir() {
    if (sobre.classList.contains("abierto")) return;
    sobre.classList.add("abierto");
    tocar();
    fadeIn();
    setTimeout(() => {
      document.body.classList.remove("cerrado");
      document.body.classList.add("listo");
      confeti(90);
    }, 1500);
    setTimeout(() => sobre.remove(), 2000);
  }
  sobre.addEventListener("click", abrir);
  sobre.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); }
  });

  const lienzo = $("#confeti");
  const ctx = lienzo.getContext("2d");
  const colores = ["#c9a14a", "#e9cf8f", "#2c4a6e", "#8fb1d4", "#6b7f5a", "#ffffff", "#e8a0a8"];
  let piezas = [];
  let corriendo = false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function ajustar() {
    lienzo.width = innerWidth * dpr;
    lienzo.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  ajustar();
  addEventListener("resize", ajustar);

  function confeti(n = 100) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const W = innerWidth, H = innerHeight;
    for (let i = 0; i < n; i++) {
      const izq = i % 2 === 0;
      const ang = (izq ? -60 : -120) + (Math.random() * 30 - 15);
      const vel = 9 + Math.random() * 8;
      piezas.push({
        x: izq ? -10 : W + 10,
        y: H * 0.75,
        vx: Math.cos((ang * Math.PI) / 180) * vel,
        vy: Math.sin((ang * Math.PI) / 180) * vel * 1.4,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: colores[(Math.random() * colores.length) | 0],
        circulo: Math.random() < 0.25,
        vida: 0,
      });
    }
    if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); }
  }
  function cuadro() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    piezas = piezas.filter((p) => p.y < innerHeight + 40 && p.vida < 400);
    for (const p of piezas) {
      p.vida++;
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
      if (p.circulo) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.vida / 8)), p.w, p.h * Math.abs(Math.cos(p.vida / 8)) + 1);
      ctx.restore();
    }
    if (piezas.length) requestAnimationFrame(cuadro);
    else { corriendo = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  $("#btn-confeti").addEventListener("click", () => confeti(160));

  let tt;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove("show"), 3500);
  }
})();
