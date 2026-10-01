"use client";

import { useEffect, useRef } from "react";

export type TileSketchStep = { number: string; title: string; description: string };

/* Scroll-scrubbed story of a tile being made: a pencil sketches a tile on
   paper, construction lines set out the geometry, an eight-pointed star
   pattern is inked line by line, glaze colours flood in, and the finished
   tile lifts off the page and repeats into a floor.

   The section is several screens tall and pins a stage while it scrolls past.
   Scroll position maps to a progress value p in [0, 1]; every animated SVG
   element declares the slice of p it reacts to via data attributes:
     data-draw="s e"  stroke is drawn from 0 to 100% between s and e
     data-in="s e"    opacity fades 0 → 1 between s and e
     data-out="s e"   opacity fades 1 → 0 between s and e
   Strokes use pathLength=1, so a dash offset of 1 − t draws a fraction t. */

// ---------------------------------------------------------------------------
// Geometry — a 600×600 drawing space with a 400×400 tile in the middle.

const C = 300;
const T0 = 100;
const T1 = 500;

const round = (n: number) => Math.round(n * 100) / 100;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))];
}

/** Vertices of an eight-pointed star (tips on multiples of 45°) from one
    angle to another, stepping 22.5° and alternating tip and notch. */
function starPoints(cx: number, cy: number, ro: number, ri: number, from: number, to: number) {
  const pts: [number, number][] = [];
  for (let a = from; a <= to + 0.01; a += 22.5) {
    pts.push(polar(cx, cy, Math.round(a / 22.5) % 2 === 0 ? ro : ri, a));
  }
  return pts;
}

const poly = (pts: [number, number][], close = false) =>
  `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}${close ? "Z" : ""}`;

const circle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx} ${cy + r}A${r} ${r} 0 1 1 ${cx} ${cy - r}`;

// Notch radius for a star made of two overlapping squares ({8/2}) and for the
// sharper {8/3} rosette.
const K82 = Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);
const K83 = Math.cos((3 * Math.PI) / 8) / Math.cos(Math.PI / 8);

const BIG_STAR = poly(starPoints(C, C, 150, 150 * K82, 0, 337.5), true);
const ROSETTE = poly(starPoints(C, C, 70, 70 * K83, 0, 337.5), true);

// Half stars on each edge midpoint and quarter stars in each corner, so the
// pattern continues seamlessly onto neighbouring tiles.
const EDGE_STARS = [
  { x: T1, y: C, dir: 180 },
  { x: C, y: T1, dir: 270 },
  { x: T0, y: C, dir: 0 },
  { x: C, y: T0, dir: 90 },
].map(({ x, y, dir }) => {
  const pts = starPoints(x, y, 50, 50 * K82, dir - 90, dir + 90);
  return { stroke: poly(pts), fill: poly([[x, y], ...pts], true) };
});

const CORNERS = [
  { x: T1, y: T1, dir: 225 },
  { x: T0, y: T1, dir: 315 },
  { x: T0, y: T0, dir: 45 },
  { x: T1, y: T0, dir: 135 },
];

const CORNER_STARS = CORNERS.map(({ x, y, dir }) => {
  const pts = starPoints(x, y, 90, 90 * K82, dir - 45, dir + 45);
  return { stroke: poly(pts), fill: poly([[x, y], ...pts], true) };
});

// Lines joining the big star's diagonal tips to the corner stars.
const CONNECTORS = CORNERS.map(({ x, y, dir }) =>
  poly([polar(C, C, 150, dir + 180), polar(x, y, 90, dir)]),
);

// Small lozenges sitting between the big star's tips.
const LOZENGES = Array.from({ length: 8 }, (_, i) => {
  const a = 22.5 + i * 45;
  const [mx, my] = polar(C, C, 166, a);
  const rad = (a * Math.PI) / 180;
  const nx = -Math.sin(rad) * 9;
  const ny = Math.cos(rad) * 9;
  return poly(
    [
      polar(C, C, 150, a),
      [round(mx + nx), round(my + ny)],
      polar(C, C, 182, a),
      [round(mx - nx), round(my - ny)],
    ],
    true,
  );
});

const OUTLINE = `M${T0} ${T0}H${T1}V${T1}H${T0}Z`;

const CONSTRUCTION = [
  `M${T0} ${T0}L${T1} ${T1}`,
  `M${T1} ${T0}L${T0} ${T1}`,
  `M${T0} ${C}H${T1}`,
  `M${C} ${T0}V${T1}`,
  circle(C, C, 200),
  circle(C, C, 150),
];

const PATTERN = [
  BIG_STAR,
  ...EDGE_STARS.map((s) => s.stroke),
  ...CONNECTORS,
  ...CORNER_STARS.map((s) => s.stroke),
  circle(C, C, 82),
  ROSETTE,
  ...LOZENGES,
  circle(C, C, 9),
];

// The eight neighbours that appear when the tile is laid as a floor.
const GAP = 406;
const NEIGHBOURS = [
  [GAP, 0, 0.86],
  [0, GAP, 0.875],
  [-GAP, 0, 0.89],
  [0, -GAP, 0.905],
  [GAP, GAP, 0.9],
  [-GAP, GAP, 0.915],
  [-GAP, -GAP, 0.93],
  [GAP, -GAP, 0.945],
] as const;

// ---------------------------------------------------------------------------
// Timeline

/** Split [start, end] into n back-to-back windows, one per stroke. */
function sequence(start: number, end: number, n: number) {
  const len = (end - start) / n;
  return Array.from({ length: n }, (_, i) => `${round3(start + i * len)} ${round3(start + (i + 1) * len)}`);
}
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const CONSTRUCTION_WINDOWS = sequence(0.16, 0.3, CONSTRUCTION.length);
const PATTERN_WINDOWS = sequence(0.3, 0.55, PATTERN.length);

/** Where each caption step begins. */
const STEP_STARTS = [0, 0.16, 0.3, 0.56, 0.8];

const INK = "#2b2721";
const GRAPHITE = "#8f897d";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const seg = (p: number, s: number, e: number) => clamp01((p - s) / (e - s));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const parse = (v: string | undefined) => {
  if (!v) return null;
  const [s, e] = v.split(" ").map(Number);
  return { s, e };
};

// Initial (p = 0) styles so the server render matches the first frame.
const hiddenStroke = {
  strokeDasharray: "1 1",
  strokeDashoffset: 1,
  visibility: "hidden" as const,
};

export function TileSketchScroll({
  eyebrow,
  steps,
}: {
  eyebrow: string;
  steps: TileSketchStep[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boardRef = useRef<SVGGElement>(null);
  const liftRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGRectElement>(null);
  const sheenRef = useRef<SVGGElement>(null);
  const pencilRef = useRef<SVGGElement>(null);
  const captionsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const svg = svgRef.current;
    if (!section || !stage || !svg) return;

    const draws = Array.from(svg.querySelectorAll<SVGPathElement>("[data-draw]"))
      .map((el) => {
        const w = parse(el.dataset.draw)!;
        let len = 0;
        try {
          len = el.getTotalLength();
        } catch {
          /* not rendered yet */
        }
        return { el, ...w, len };
      })
      .sort((a, b) => a.s - b.s);

    const fades = Array.from(svg.querySelectorAll<SVGElement>("[data-in],[data-out]")).map((el) => ({
      el,
      in: parse(el.dataset.in),
      out: parse(el.dataset.out),
    }));

    const captions = Array.from(
      captionsRef.current?.querySelectorAll<HTMLElement>("[data-step]") ?? [],
    );

    let lastStep = -1;

    const apply = (p: number) => {
      for (const d of draws) {
        const t = seg(p, d.s, d.e);
        d.el.style.strokeDashoffset = String(1 - t);
        d.el.style.visibility = t > 0 ? "visible" : "hidden";
      }

      for (const f of fades) {
        const a = f.in ? seg(p, f.in.s, f.in.e) : 1;
        const b = f.out ? 1 - seg(p, f.out.s, f.out.e) : 1;
        f.el.style.opacity = String(a * b);
      }

      // Pencil rides the tip of whichever stroke is currently being drawn.
      const pencil = pencilRef.current;
      if (pencil && draws.length) {
        let active = draws[0];
        for (const d of draws) if (d.s <= p) active = d;
        const t = seg(p, active.s, active.e);
        try {
          const pt = active.el.getPointAtLength(t * (active.len || active.el.getTotalLength()));
          pencil.setAttribute("transform", `translate(${round(pt.x)} ${round(pt.y)})`);
        } catch {
          /* geometry unavailable while hidden */
        }
        pencil.style.opacity = String(seg(p, 0.005, 0.03) * (1 - seg(p, 0.55, 0.59)));
      }

      // Tile lifts off the paper during glazing, then settles into the floor.
      const lift = ease(seg(p, 0.7, 0.8)) * (1 - ease(seg(p, 0.84, 0.92)));
      liftRef.current?.setAttribute("transform", `translate(0 ${round(-10 * lift)})`);
      if (shadowRef.current) {
        shadowRef.current.style.opacity = String(round(0.32 * lift));
        shadowRef.current.setAttribute("transform", `translate(0 ${round(14 * lift)})`);
      }

      // A band of light sweeps across the fresh glaze.
      const sweep = seg(p, 0.72, 0.84);
      if (sheenRef.current) {
        sheenRef.current.setAttribute("transform", `translate(${round(-320 + 1000 * sweep)} 0)`);
        sheenRef.current.style.opacity = String(round(Math.sin(Math.PI * sweep)));
      }

      // Zoom out so the tile becomes one of many.
      const scale = 1 - 0.54 * ease(seg(p, 0.82, 0.96));
      boardRef.current?.setAttribute(
        "transform",
        `translate(${C} ${C}) scale(${round3(scale)}) translate(${-C} ${-C})`,
      );

      let step = 0;
      STEP_STARTS.forEach((s, i) => {
        if (p >= s) step = i;
      });
      if (step !== lastStep) {
        captions.forEach((el, i) => {
          el.dataset.active = String(i === step);
          el.setAttribute("aria-hidden", String(i !== step));
        });
        lastStep = step;
      }

      if (barRef.current) barRef.current.style.transform = `scaleX(${round3(p)})`;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(1);
      return;
    }

    // Scroll sets a target; a short ease towards it makes scrubbing feel
    // weighted rather than jittery.
    let target = 0;
    let current = 0;
    let raf = 0;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const distance = section.offsetHeight - stage.offsetHeight;
      target = distance > 0 ? clamp01((stickyTop - rect.top) / distance) : 0;
    };

    const tick = () => {
      current += (target - current) * 0.09;
      if (Math.abs(target - current) < 0.0005) current = target;
      apply(current);
      raf = current !== target ? requestAnimationFrame(tick) : 0;
    };

    const onScroll = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    measure();
    current = target;
    apply(current);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label={eyebrow}
      className="relative h-[640svh] border-b border-gray-200 bg-cream motion-reduce:h-auto"
    >
      <div
        ref={stageRef}
        className="sticky top-[var(--header-h)] h-[calc(100svh-var(--header-h))] min-h-[30rem] overflow-hidden"
      >
        <div className="mx-auto grid h-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] items-center gap-4 px-6 py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-1 md:gap-10 md:px-10 md:py-12">
          {/* Captions */}
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.25em] text-gray-500 sm:text-[13px]">
              {eyebrow}
            </h2>
            <div ref={captionsRef} className="relative mt-5 h-44 md:mt-8 md:h-60">
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  data-step={i}
                  data-active={i === 0}
                  aria-hidden={i !== 0}
                  className="absolute inset-x-0 top-0 translate-y-3 opacity-0 transition duration-700 ease-out data-[active=true]:translate-y-0 data-[active=true]:opacity-100"
                >
                  <span className="text-[13px] font-medium tabular-nums text-clay">
                    {step.number}
                  </span>
                  <h3 className="mt-2 text-3xl font-extralight tracking-tight text-ink md:mt-3 md:text-5xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm font-light leading-relaxed text-gray-500 md:mt-5 md:text-base">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2 hidden h-px w-full max-w-xs bg-gray-300 md:block">
              <div
                ref={barRef}
                className="h-full origin-left bg-ink rtl:origin-right"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
          </div>

          {/* Drawing */}
          <div className="h-full min-h-0">
            <svg
              ref={svgRef}
              viewBox="0 0 600 600"
              className="h-full w-full"
              aria-hidden
              focusable="false"
            >
              <defs>
                <pattern id="tile-sketch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0H0V20" fill="none" stroke="#ebe5d9" strokeWidth="0.6" />
                </pattern>
                <filter id="tile-sketch-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="12" />
                </filter>
                <filter id="tile-sketch-soft" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                <clipPath id="tile-sketch-clip">
                  <rect x={T0} y={T0} width="400" height="400" />
                </clipPath>
                <linearGradient id="tile-sketch-sheen" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="tile-sketch-gloss" cx="0.28" cy="0.22" r="0.85">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
                  <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Paper */}
              <g data-out="0.8 0.88">
                <rect x="34" y="40" width="536" height="536" fill="#171310" opacity="0.08" filter="url(#tile-sketch-soft)" />
                <rect
                  x="30"
                  y="30"
                  width="540"
                  height="540"
                  fill="#f7f2e9"
                  stroke="#e2dfd7"
                  transform="rotate(-3 300 300)"
                />
                <rect x="30" y="30" width="540" height="540" fill="#fffdf9" />
                <rect x="30" y="30" width="540" height="540" fill="url(#tile-sketch-grid)" />
              </g>

              <g ref={boardRef}>
                {NEIGHBOURS.map(([dx, dy, s]) => (
                  <use
                    key={`${dx},${dy}`}
                    href="#tile-sketch-art"
                    x={dx}
                    y={dy}
                    data-in={`${s} ${round3(s + 0.05)}`}
                    style={{ opacity: 0 }}
                  />
                ))}

                <rect
                  ref={shadowRef}
                  x={T0 + 10}
                  y={T0 + 16}
                  width="380"
                  height="380"
                  fill="#171310"
                  filter="url(#tile-sketch-blur)"
                  style={{ opacity: 0 }}
                />

                <g ref={liftRef}>
                  <g id="tile-sketch-art">
                    {/* Glaze colours */}
                    <rect x={T0} y={T0} width="400" height="400" fill="#f4ede3" data-in="0.57 0.63" style={{ opacity: 0 }} />
                    {CORNER_STARS.map((s, i) => (
                      <path key={`cf${i}`} d={s.fill} fill="#a1887f" data-in={`${0.6 + i * 0.008} ${0.65 + i * 0.008}`} style={{ opacity: 0 }} />
                    ))}
                    {EDGE_STARS.map((s, i) => (
                      <path key={`ef${i}`} d={s.fill} fill="#c7b5a8" data-in={`${0.61 + i * 0.008} ${0.66 + i * 0.008}`} style={{ opacity: 0 }} />
                    ))}
                    <path d={BIG_STAR} fill="#795548" data-in="0.63 0.69" style={{ opacity: 0 }} />
                    <path d={circle(C, C, 82)} fill="#e9e0da" data-in="0.66 0.71" style={{ opacity: 0 }} />
                    <path d={ROSETTE} fill="#5d4037" data-in="0.68 0.73" style={{ opacity: 0 }} />
                    <path d={circle(C, C, 9)} fill="#f4ede3" data-in="0.7 0.74" style={{ opacity: 0 }} />
                    {LOZENGES.map((d, i) => (
                      <path key={`lf${i}`} d={d} fill="#5d4037" data-in={`${0.69 + i * 0.004} ${0.72 + i * 0.004}`} style={{ opacity: 0 }} />
                    ))}
                    <rect x={T0} y={T0} width="400" height="400" fill="url(#tile-sketch-gloss)" data-in="0.72 0.8" style={{ opacity: 0 }} />

                    {/* Pencil outline and inked pattern */}
                    <path
                      d={OUTLINE}
                      pathLength={1}
                      fill="none"
                      stroke={GRAPHITE}
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                      data-draw="0.02 0.15"
                      style={hiddenStroke}
                    />
                    <g fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
                      {PATTERN.map((d, i) => (
                        <path key={i} d={d} pathLength={1} data-draw={PATTERN_WINDOWS[i]} style={hiddenStroke} />
                      ))}
                    </g>
                  </g>

                  {/* Light sweeping over the glaze */}
                  <g clipPath="url(#tile-sketch-clip)">
                    <g ref={sheenRef} style={{ opacity: 0 }}>
                      <rect x="0" y="-100" width="140" height="800" fill="url(#tile-sketch-sheen)" transform="rotate(18 70 300)" />
                    </g>
                  </g>

                  {/* Compass and ruler guides, erased once the glaze goes on */}
                  <g
                    fill="none"
                    stroke={GRAPHITE}
                    strokeWidth="0.9"
                    strokeOpacity="0.7"
                    data-out="0.58 0.66"
                  >
                    {CONSTRUCTION.map((d, i) => (
                      <path key={i} d={d} pathLength={1} data-draw={CONSTRUCTION_WINDOWS[i]} style={hiddenStroke} />
                    ))}
                  </g>

                  {/* Pencil — its tip sits at the group origin */}
                  <g ref={pencilRef} transform={`translate(${T0} ${T0})`} style={{ opacity: 0 }}>
                    <g transform="rotate(-38)">
                      <path d="M4 6L20 1H109V11H20Z" fill="#171310" opacity="0.1" />
                      <path d="M0 0L16 -5L16 5Z" fill="#e6c9a3" />
                      <path d="M0 0L5.5 -1.7L5.5 1.7Z" fill={INK} />
                      <rect x="16" y="-5" width="70" height="10" fill="#3a332c" />
                      <rect x="16" y="-5" width="70" height="3" fill="#5c564c" />
                      <rect x="86" y="-5" width="9" height="10" fill="#c9c5ba" />
                      <rect x="95" y="-5" width="10" height="10" rx="2" fill="#a1887f" />
                    </g>
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
