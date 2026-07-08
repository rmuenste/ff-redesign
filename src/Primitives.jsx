import React from "react";

// ===== Shared primitives =====

export const Icon = ({ name, size = 20, style }) => (
  <span className="material-icons" style={{ fontSize: size, lineHeight: 1, ...style }}>{name}</span>
);

export const Chip = ({ children, tone = "default", style }) => {
  const tones = {
    default: { background: "var(--surface-alt)", color: "var(--fg2)", borderColor: "var(--divider)" },
    solid:   { background: "var(--primary)",     color: "var(--on-primary)", borderColor: "transparent" },
    ghost:   { background: "transparent",        color: "var(--fg2)", borderColor: "var(--divider)" },
    accent:  { background: "rgba(255,87,34,.14)", color: "var(--tu-orange-500)", borderColor: "transparent" },
  };
  const t = tones[tone] || tones.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999, fontSize: 10,
      fontFamily: "var(--font-mono)", letterSpacing: ".08em",
      textTransform: "uppercase", lineHeight: 1.6,
      border: "1px solid",
      ...t, ...style,
    }}>{children}</span>
  );
};

export const Overline = ({ children, style }) => (
  <div style={{
    fontFamily: "var(--font-mono)",
    fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase",
    color: "var(--fg3)", fontWeight: 500, ...style,
  }}>{children}</div>
);

export const Btn = ({ children, variant = "primary", onClick, size = "md", style, leading, trailing }) => {
  const base = {
    fontFamily: "inherit", fontWeight: 500, letterSpacing: ".01em",
    border: 0, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 8,
    transition: "background 160ms var(--ease-std), box-shadow 160ms var(--ease-std), color 160ms",
    borderRadius: 4,
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "10px 18px", fontSize: 13 },
    lg: { padding: "14px 24px", fontSize: 14 },
  };
  const variants = {
    primary: { background: "var(--primary)", color: "var(--on-primary)" },
    stroked: { background: "transparent", color: "var(--fg1)", boxShadow: "inset 0 0 0 1px var(--divider)" },
    ghost: { background: "transparent", color: "var(--fg1)" },
    accent: { background: "var(--accent)", color: "var(--on-accent)" },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (variant === "primary") e.currentTarget.style.background = "var(--primary-hover)";
        if (variant === "stroked") e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--fg2)";
        if (variant === "ghost") e.currentTarget.style.background = "var(--surface-alt)";
      }}
      onMouseLeave={e => {
        if (variant === "primary") e.currentTarget.style.background = "var(--primary)";
        if (variant === "stroked") e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--divider)";
        if (variant === "ghost") e.currentTarget.style.background = "transparent";
      }}>
      {leading}{children}{trailing}
    </button>
  );
};

// Animated flow-field streamline background (used in the hero)
// Uses canvas for fluidity; streamlines drift based on a static vector field.
export const FlowCanvas = ({ palette = "green", density = 80, speed = 1.0 }) => {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = canvas.clientWidth, h = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const onResize = () => { canvas.width = 0; canvas.height = 0; ctx.setTransform(1,0,0,1,0,0); resize(); };
    window.addEventListener("resize", onResize);

    // vector field — think flow around a cylinder
    const field = (x, y) => {
      const cx = w * 0.35, cy = h * 0.55, r = Math.min(w, h) * 0.18;
      const dx = x - cx, dy = y - cy;
      const d2 = dx*dx + dy*dy;
      const r2 = r*r;
      // uniform flow + dipole (potential flow past a cylinder)
      const U = 1.0;
      const fx = U * (1 - r2 * (dx*dx - dy*dy) / (d2*d2 + 1e-6));
      const fy = U * (-r2 * 2 * dx * dy / (d2*d2 + 1e-6));
      // add a gentle downward swirl in the lower half
      const sw = Math.sin((x + y*0.6) * 0.003) * 0.35;
      return [fx + sw, fy - sw * 0.5];
    };

    const palettes = {
      green: ["rgba(132,184,24,", "rgba(147,204,40,", "rgba(87,128,5,"],
      petrol: ["rgba(61,126,152,", "rgba(90,145,167,", "rgba(38,84,104,"],
      mixed: ["rgba(132,184,24,", "rgba(61,126,152,", "rgba(255,87,34,"],
    };
    const colors = palettes[palette] || palettes.green;

    const N = density;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      life: Math.random() * 200,
      hue: Math.floor(Math.random() * colors.length),
      alpha: 0.1 + Math.random() * 0.5,
    }));

    const step = () => {
      // fade with a transparent wash
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        const [fx, fy] = field(p.x, p.y);
        const nx = p.x + fx * 0.9 * speed;
        const ny = p.y + fy * 0.9 * speed;
        ctx.strokeStyle = colors[p.hue] + p.alpha + ")";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        p.x = nx; p.y = ny;
        p.life += 1;
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || p.life > 220) {
          p.x = -20 + Math.random() * 40;   // respawn from left
          p.y = Math.random() * h;
          p.life = 0;
          p.alpha = 0.1 + Math.random() * 0.5;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    step();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [palette, density, speed]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
};

// Mesh thumbnail — SVG abstraction of a triangulated mesh, cool and technical
/**
 * Steady flow around a cylinder at Re 20 (pre-shedding regime): streamlines from
 * the potential-flow stream function psi = Y(1 - a^2/r^2), traced once at module
 * load. Powers the Flow Around Cylinder thumbnail. Increasing streamline spacing
 * toward the walls nods to the parabolic channel inlet profile.
 */
const FAC = (() => {
  const cx = 84, cy = 84, a = 18, xL = 8, xR = 232, wallTop = 26, wallBot = 138;
  const solveY = (X, C) => {
    const a2 = a * a;
    let Y = Math.abs(C) < 0.5 ? (C >= 0 ? 0.5 : -0.5) : C;
    for (let i = 0; i < 80; i++) {
      const r2 = X * X + Y * Y;
      const step = (Y * (1 - a2 / r2) - C) / (1 - a2 * (X * X - Y * Y) / (r2 * r2));
      Y -= step;
      if (Math.abs(step) < 1e-6) break;
    }
    return Y;
  };
  const trace = C => {
    const pts = [];
    for (let x = xL; x <= xR; x += 1.6) {
      const X = x - cx;
      const Y = solveY(X, C);
      if (!isFinite(Y) || X * X + Y * Y < a * a * 1.001) continue; // never inside cylinder
      const y = cy + Y;
      if (y < wallTop + 1 || y > wallBot - 1) continue;
      pts.push(x.toFixed(1) + " " + y.toFixed(1));
    }
    return pts.length < 2 ? "" : "M" + pts.join(" L");
  };
  const lines = [];
  for (const C of [4, 9, 15, 23, 33, 46]) {
    const op = (0.8 - Math.min(C, 46) / 92).toFixed(2);
    const w = C <= 9 ? 0.9 : 0.7;
    lines.push({ d: trace(C), w, op }, { d: trace(-C), w, op });
  }
  return { cx, cy, a, xL, xR, wallTop, wallBot, lines: lines.filter(l => l.d) };
})();

/**
 * RB2 case-2 final bubble interface (MooNMD level 1), taken from real benchmark
 * data: public/benchmark-assets/rb2/plots/case-2/shape/moonmd-l1.json. The 1550-point
 * closed polyline was fitted to the 240x160 viewBox (y flipped), Douglas-Peucker
 * simplified, then closed-centripetal-Catmull-Rom smoothed into this curve. Shows the
 * characteristic skirted shape: dome cap, concave underside, two thin trailing filaments.
 */
const RB2_SHAPE = "M120.0 20.0 C118.9 20.0 115.1 20.2 112.6 20.5 C110.0 20.9 107.3 21.5 104.7 22.3 C102.1 23.1 99.6 24.1 97.1 25.3 C94.7 26.5 92.4 27.9 90.2 29.4 C87.9 31.0 85.8 32.7 83.9 34.5 C81.9 36.4 80.1 38.3 78.3 40.5 C76.5 42.7 74.8 45.2 73.3 47.7 C71.8 50.2 70.4 52.9 69.2 55.5 C68.2 57.8 67.3 60.0 66.6 62.4 C65.8 64.7 65.1 67.1 64.5 69.5 C64.0 71.9 63.5 74.4 63.2 76.8 C62.9 79.0 62.7 80.3 62.6 83.4 C62.4 90.9 63.4 111.5 64.1 121.4 C64.6 127.8 65.1 134.0 65.7 137.1 C66.0 138.5 66.2 139.9 66.6 140.0 C66.9 140.0 67.3 139.2 67.5 138.6 C67.8 137.7 67.8 136.4 67.7 135.2 C67.7 134.0 67.5 132.8 67.1 131.2 C66.6 129.0 65.3 126.5 64.8 122.9 C63.8 116.8 63.8 102.7 64.0 97.4 C64.1 95.0 64.0 93.6 64.5 92.1 C64.9 90.7 65.6 89.6 66.4 88.6 C67.1 87.7 68.0 87.0 68.9 86.4 C69.8 85.7 70.5 85.3 71.8 84.8 C73.9 84.0 76.9 83.2 80.2 82.6 C84.8 81.8 91.0 81.5 96.9 81.2 C103.6 80.8 111.2 80.5 118.3 80.5 C125.5 80.5 132.8 80.7 139.8 81.0 C146.4 81.3 154.0 81.7 159.1 82.5 C162.5 83.0 165.5 83.8 167.5 84.5 C168.8 85.0 169.6 85.4 170.5 86.0 C171.5 86.6 172.4 87.2 173.1 88.0 C174.0 89.0 174.8 90.1 175.3 91.4 C175.8 92.8 175.9 93.8 176.0 96.0 C176.3 101.3 176.2 116.5 175.2 122.9 C174.7 126.5 173.4 128.9 172.9 131.2 C172.5 132.8 172.3 133.9 172.3 135.2 C172.2 136.5 172.3 138.4 172.6 139.2 C172.8 139.6 173.2 140.0 173.4 140.0 C173.5 140.0 173.6 139.8 173.7 139.6 C174.4 137.9 175.3 128.1 175.9 120.7 C176.7 110.4 177.6 90.9 177.4 83.5 C177.3 80.4 177.1 79.1 176.8 76.8 C176.5 74.4 176.0 71.9 175.5 69.6 C174.9 67.2 174.2 64.8 173.5 62.4 C172.7 60.1 171.8 57.8 170.8 55.5 C169.6 52.9 168.2 50.2 166.7 47.7 C165.3 45.3 163.8 43.1 162.1 41.0 C160.4 38.9 158.6 36.9 156.7 35.0 C154.7 33.2 152.6 31.4 150.4 29.8 C148.4 28.4 146.3 27.1 144.1 25.9 C141.7 24.7 139.2 23.6 136.6 22.8 C134.1 21.9 131.4 21.2 128.8 20.8 C126.1 20.3 121.9 20.1 120.7 20.0 C120.3 20.0 120.4 20.0 120.0 20.0 Z";

/**
 * Sedimentation motif: a settling sphere at the base with its induced wake plume
 * trailing upward — an outer wake envelope, a denser inner plume, and the sphere
 * nested in the splayed feet at the bottom. Stylized from a schematic blueprint.
 */
const SED = {
  outer: "M120 44 C130 58 139 82 144 104 C147 121 146 131 142 139 C140 144 136 146 133 142 C130 138 127 136 124 137 C122 138 121 139 120 141 C119 139 118 138 116 137 C113 136 110 138 107 142 C104 146 100 144 98 139 C94 131 93 121 96 104 C101 82 110 58 120 44 Z",
  inner: "M120 98 C127 110 131 123 130 132 C130 138 126 141 122 140 C121 140 119 140 118 140 C114 141 110 138 110 132 C109 123 113 110 120 98 Z",
  sphere: { cx: 120, cy: 146, r: 10 },
};

const MESH_SEEDS = {
  cylinder: { shape: "cylinder", color: "var(--tu-green-500)" },
  bubble: { shape: "bubble", color: "var(--tu-green-500)" },
  "bubble-2d": { shape: "bubble-2d", color: "var(--tu-green-500)" },
  particle: { shape: "particle", color: "var(--tu-orange-500)" },
  sediment: { shape: "sediment", color: "var(--tu-green-500)" },
  channel: { shape: "channel", color: "var(--tu-petrol-400)" },
};
const MESH_ORDER = ["cylinder", "bubble", "particle", "channel"];

export const MeshThumb = ({ variant = 0, shape, style }) => {
  const key = shape && MESH_SEEDS[shape] ? shape : MESH_ORDER[variant % MESH_ORDER.length];
  const s = MESH_SEEDS[key];
  const uid = key + "-" + variant;
  return (
    <svg viewBox="0 0 240 160" style={{ width: "100%", height: "100%", ...style }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id={`mesh-${uid}`} x="0" y="0" width="16" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 14 L8 0 L16 14 Z" fill="none" stroke="var(--divider)" strokeWidth="0.5" />
          <path d="M0 0 L8 14 L16 0" fill="none" stroke="var(--divider)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="240" height="160" fill="var(--surface-alt)" />
      <rect width="240" height="160" fill={`url(#mesh-${uid})`} opacity="0.6" />
      {s.shape === "cylinder" && (
        <>
          <line x1={FAC.xL} y1={FAC.wallTop} x2={FAC.xR} y2={FAC.wallTop} stroke="var(--fg3)" strokeWidth="1" />
          <line x1={FAC.xL} y1={FAC.wallBot} x2={FAC.xR} y2={FAC.wallBot} stroke="var(--fg3)" strokeWidth="1" />
          <g fill="none" stroke="var(--tu-green-400)" strokeLinecap="round">
            {FAC.lines.map((l, i) => (
              <path key={i} d={l.d} strokeWidth={l.w} opacity={l.op} />
            ))}
          </g>
          <line x1={FAC.xL} y1={FAC.cy} x2={FAC.cx - FAC.a} y2={FAC.cy} stroke="var(--tu-green-300)" strokeWidth="0.9" opacity="0.8" />
          <circle cx={FAC.cx} cy={FAC.cy} r={FAC.a} fill="var(--surface)" stroke={s.color} strokeWidth="1.6" />
        </>
      )}
      {s.shape === "bubble-2d" && (
        <>
          <line x1="120" y1="150" x2="120" y2="14" stroke="var(--tu-green-300)" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
          <path d={RB2_SHAPE} fill={s.color} fillOpacity="0.16" stroke="var(--tu-green-400)" strokeWidth="1.4" strokeLinejoin="round" />
        </>
      )}
      {s.shape === "sediment" && (
        <>
          <path d={SED.outer} fill={s.color} fillOpacity="0.10" stroke="var(--tu-green-400)" strokeWidth="1.2" strokeLinejoin="round" />
          <path d={SED.inner} fill={s.color} fillOpacity="0.22" stroke="var(--tu-green-400)" strokeWidth="1" strokeLinejoin="round" />
          <circle cx={SED.sphere.cx} cy={SED.sphere.cy} r={SED.sphere.r} fill="var(--surface)" stroke={s.color} strokeWidth="1.6" />
        </>
      )}
      {s.shape === "bubble" && (
        <>
          <ellipse cx="120" cy="90" rx="26" ry="32" fill={s.color} opacity="0.15" stroke={s.color} strokeWidth="1.5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <ellipse key={i} cx="120" cy="90" rx={26 - i * 4} ry={32 - i * 5}
              fill="none" stroke={s.color} strokeWidth="0.5" opacity={0.5 - i * 0.09} />
          ))}
          <path d="M120 58 C120 40 122 30 124 20" fill="none" stroke={s.color} strokeWidth="0.8" opacity="0.5" strokeDasharray="2 2" />
        </>
      )}
      {s.shape === "particle" && (
        <>
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 40 + (i % 7) * 24;
            const y = 50 + Math.floor(i / 7) * 40;
            return <circle key={i} cx={x} cy={y} r="5" fill={s.color} opacity={0.4 + (i % 5) * 0.1} />;
          })}
          {Array.from({ length: 7 }).map((_, i) => (
            <path key={i} d={`M${30 + i * 30} 20 Q${40 + i * 30} 80 ${30 + i * 30} 140`}
              fill="none" stroke="var(--fg3)" strokeWidth="0.4" opacity="0.4" />
          ))}
        </>
      )}
      {s.shape === "channel" && (
        <>
          <rect x="20" y="30" width="200" height="100" fill="none" stroke={s.color} strokeWidth="1" />
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={i} d={`M20 ${35 + i * 8} Q120 ${35 + i * 8 + Math.sin(i) * 6} 220 ${35 + i * 8}`}
              fill="none" stroke={s.color} strokeWidth="0.5" opacity="0.5" />
          ))}
        </>
      )}
    </svg>
  );
};
