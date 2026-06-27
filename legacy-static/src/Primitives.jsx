// ===== Shared primitives =====

const Icon = ({ name, size = 20, style }) => (
  <span className="material-icons" style={{ fontSize: size, lineHeight: 1, ...style }}>{name}</span>
);

const Chip = ({ children, tone = "default", style }) => {
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

const Overline = ({ children, style }) => (
  <div style={{
    fontFamily: "var(--font-mono)",
    fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase",
    color: "var(--fg3)", fontWeight: 500, ...style,
  }}>{children}</div>
);

const Btn = ({ children, variant = "primary", onClick, size = "md", style, leading, trailing }) => {
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
const FlowCanvas = ({ palette = "green", density = 80, speed = 1.0 }) => {
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
const MeshThumb = ({ variant = 0, style }) => {
  const seeds = [
    { shape: "cylinder", color: "var(--tu-petrol-500)" },
    { shape: "bubble", color: "var(--tu-green-500)" },
    { shape: "particle", color: "var(--tu-orange-500)" },
    { shape: "channel", color: "var(--tu-petrol-400)" },
  ];
  const s = seeds[variant % seeds.length];
  return (
    <svg viewBox="0 0 240 160" style={{ width: "100%", height: "100%", ...style }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id={`mesh-${variant}`} x="0" y="0" width="16" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 14 L8 0 L16 14 Z" fill="none" stroke="var(--divider)" strokeWidth="0.5" />
          <path d="M0 0 L8 14 L16 0" fill="none" stroke="var(--divider)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="240" height="160" fill="var(--surface-alt)" />
      <rect width="240" height="160" fill={`url(#mesh-${variant})`} opacity="0.6" />
      {s.shape === "cylinder" && (
        <>
          <circle cx="80" cy="80" r="24" fill="var(--surface)" stroke={s.color} strokeWidth="1.5" />
          {Array.from({ length: 22 }).map((_, i) => (
            <path key={i} d={`M${110 + i * 6} ${60 + Math.sin(i * 0.5) * 12}
                              C${130 + i * 6} ${70 + Math.sin(i * 0.5 + 0.3) * 10}
                              ${150 + i * 6} ${80 + Math.sin(i * 0.5 + 0.8) * 12}
                              ${160 + i * 6} ${90 + Math.sin(i * 0.5 + 1.2) * 6}`}
              fill="none" stroke={s.color} strokeWidth="0.6" opacity="0.55" />
          ))}
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

Object.assign(window, { Icon, Chip, Overline, Btn, FlowCanvas, MeshThumb });
