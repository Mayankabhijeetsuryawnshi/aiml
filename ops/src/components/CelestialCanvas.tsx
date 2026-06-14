import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  baseX: number;
  baseY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

interface MatrixDrop {
  x: number;
  y: number;
  speed: number;
  size: number;
  chars: string[];
}

interface Attractor {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
}

interface CelestialCanvasProps {
  isProMode?: boolean;
  fpsCap?: number;
  trailWidth?: number;
  trailLength?: number;
  latticeDist?: number;
  particleCount?: number;
  shaderMode?: string; // "path-traced" | "ambient"
  physicsFriction?: number; // 0.90 - 0.99
  aberration?: number; // 0 - 15 (pixel split)
  bloomGlow?: number; // volumetric width
  colorPreset?: string; // "stellar-orbit" | "aurora-emerald" | "hyper-cyan" | "solar-flare" | "monochrome"
  soundEnabled?: boolean;
}

// Client-side Browser Synthesized Sound Engine
class CosmicSynth {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    try {
      const stored = localStorage.getItem("mai_vfx_sound_enabled");
      this.soundEnabled = stored !== "false"; // default to true
    } catch (e) {
      this.soundEnabled = true;
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem("mai_vfx_sound_enabled", String(enabled));
    } catch (e) {}
  }

  getSoundEnabled() {
    return this.soundEnabled;
  }

  private init() {
    if (!this.soundEnabled) return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  playWarp() {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(260, now);
    osc1.frequency.exponentialRampToValueAtTime(520, now + 0.65);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(130, now);
    osc2.frequency.exponentialRampToValueAtTime(390, now + 0.65);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.65);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.66);
    osc2.stop(now + 0.66);
  }

  playChime() {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
    const pitch = pentatonic[Math.floor(Math.random() * pentatonic.length)];

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const delay = this.ctx.createDelay();
    const feedback = this.ctx.createGain();

    osc.type = "sine";
    subOsc.type = "sine";

    osc.frequency.setValueAtTime(pitch, now);
    subOsc.frequency.setValueAtTime(pitch * 1.5, now); // perfect fifth overtone

    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.03, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    delay.delayTime.setValueAtTime(0.18, now);
    feedback.gain.setValueAtTime(0.28, now);

    osc.connect(gainNode);
    subOsc.connect(gainNode);
    
    gainNode.connect(this.ctx.destination);
    gainNode.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.8);
    subOsc.stop(now + 0.8);
  }

  playSingularitySweep() {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(45, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 1.0);
    osc.frequency.exponentialRampToValueAtTime(35, now + 2.5);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(110, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.7);
    filter.frequency.exponentialRampToValueAtTime(75, now + 2.5);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.25);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.5);
  }
}

export default function CelestialCanvas({
  isProMode = true,
  fpsCap = 120,
  trailWidth = 7,
  trailLength = 20,
  latticeDist = 120,
  particleCount = 40,
  shaderMode = "path-traced",
  physicsFriction = 0.96,
  aberration = 3,
  bloomGlow = 15,
  colorPreset = "stellar-orbit",
  soundEnabled = true
}: CelestialCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });
  const trailHistoryRef = useRef<{ x: number; y: number }[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const matrixDropsRef = useRef<MatrixDrop[]>([]);
  const attractorsRef = useRef<Attractor[]>([]);
  const lastClickTimeRef = useRef<number>(0);
  const synthRef = useRef<CosmicSynth | null>(null);
  const isInitialRef = useRef(true);

  // Lazy instantiate the synthesizer
  useEffect(() => {
    synthRef.current = new CosmicSynth();
  }, []);

  // Synchronize external prop with internal synth state
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.setSoundEnabled(soundEnabled);
    }
  }, [soundEnabled]);

  // Soft sound warp chime whenever PRO mode transitions
  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    if (synthRef.current) {
      synthRef.current.playWarp();
    }
  }, [isProMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let particles: Particle[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Get color list by current selection preset or automated fallback
    const getPresetColors = () => {
      const modePreset = colorPreset || (isProMode ? "stellar-orbit" : "aurora-emerald");
      
      switch (modePreset) {
        case "aurora-emerald":
          return [
            "rgba(16, 185, 129, ",  // Emerald
            "rgba(6, 182, 212, ",   // Cyan
            "rgba(20, 184, 166, ",  // Teal
            "rgba(132, 204, 22, ",  // Lime
            "rgba(52, 211, 153, ",  // Mint
            "rgba(34, 197, 94, ",   // Green
            "rgba(255, 255, 255, "  // Starwhite
          ];
        case "hyper-cyan":
          return [
            "rgba(6, 182, 212, ",   // Cyan
            "rgba(14, 165, 233, ",  // Light blue
            "rgba(56, 189, 248, ",  // Sky blue
            "rgba(59, 130, 246, ",  // Blue-faded
            "rgba(34, 211, 238, ",  // Bright cyan
            "rgba(103, 232, 249, ", // Pale ice cyan
            "rgba(255, 255, 255, "  // Starwhite
          ];
        case "solar-flare":
          return [
            "rgba(249, 115, 22, ",  // Amber-orange
            "rgba(239, 68, 68, ",   // Crimson-red
            "rgba(245, 158, 11, ",  // Bright gold
            "rgba(234, 179, 8, ",   // Yellow
            "rgba(251, 146, 60, ",  // Peach orange
            "rgba(252, 211, 77, ",  // Light yellow glow
            "rgba(255, 255, 255, "  // Starwhite
          ];
        case "monochrome":
          return [
            "rgba(226, 232, 240, ", // Silver Slate
            "rgba(241, 245, 249, ", // Light grey
            "rgba(203, 213, 225, ", // Medium grey
            "rgba(148, 163, 184, ", // Slate
            "rgba(255, 255, 255, ", // Pure starlight
            "rgba(248, 250, 252, ", // White-gray
            "rgba(100, 116, 139, "  // Darker silver
          ];
        case "stellar-orbit":
        default:
          return [
            "rgba(168, 85, 247, ",  // Purple
            "rgba(217, 70, 239, ",  // Fuchsia
            "rgba(192, 132, 252, ", // Violet-light
            "rgba(139, 92, 246, ",  // Indigo-purple
            "rgba(6, 182, 212, ",   // Cyan
            "rgba(244, 63, 94, ",   // Rose
            "rgba(255, 255, 255, "  // Starwhite
          ];
      }
    };

    const cosmicColors = getPresetColors();

    const generateStars = (currCount: number) => {
      stars = [];
      for (let i = 0; i < currCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.8 + 0.4;
        const twinkleSpeed = (0.01 + Math.random() * 0.03);
        const twinklePhase = Math.random() * Math.PI * 2;
        const color = cosmicColors[Math.floor(Math.random() * cosmicColors.length)];

        // Orbit properties for cosmic stardust rotation
        const orbitRadius = Math.random() > 0.85 ? Math.random() * 80 + 30 : 0;
        const orbitSpeed = (Math.random() * 0.01 + 0.002) * (Math.random() > 0.5 ? 1 : -1);

        stars.push({
          x,
          y,
          size,
          twinkleSpeed,
          twinklePhase,
          color,
          angle: Math.random() * Math.PI * 2,
          orbitRadius,
          orbitSpeed,
          baseX: x,
          baseY: y,
        });
      }
    };

    // Instantiate Matrix columns
    const generateMatrixDrops = () => {
      const colWidth = 26;
      const colCount = Math.floor(width / colWidth) + 1;
      const list = ["λ", "∫", "∂", "0", "1", "x", "y", "[]", "{}", "*", "+", "ψ", "Δ", "∇", "Ω", "α", "β", "γ", "ø"];
      const drops: MatrixDrop[] = [];
      for (let i = 0; i < colCount; i++) {
        drops.push({
          x: i * colWidth + Math.random() * 6,
          y: Math.random() * -height - 100,
          speed: Math.random() * 2.2 + 0.9,
          size: Math.random() * 3 + 8, // tiny details 8px - 11px
          chars: Array.from({ length: 14 }, () => list[Math.floor(Math.random() * list.length)])
        });
      }
      matrixDropsRef.current = drops;
    };

    // Initialize stars & codespaces based on viewport scale
    const count = Math.min(Math.floor((width * height) / 8000), 160);
    generateStars(count);
    generateMatrixDrops();

    // Mouse updates
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        mouseRef.current.targetX = e.touches[0].clientX;
        mouseRef.current.targetY = e.touches[0].clientY;
        mouseRef.current.active = true;
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;

      const nowTime = performance.now();
      const isDoubleClick = nowTime - lastClickTimeRef.current < 320;
      lastClickTimeRef.current = nowTime;

      if (isProMode && isDoubleClick) {
        // Play elegant deeper quantum black hole/singularity collapse sound sweep
        if (synthRef.current) {
          synthRef.current.playSingularitySweep();
        }

        // Spawn a Singular Gravity Vortex Attractor
        attractorsRef.current.push({
          id: Math.random(),
          x: clickX,
          y: clickY,
          life: 360, // about 6 seconds
          maxLife: 360,
          size: 70
        });

        // Spawn a massive burst of spiraling particle dust
        const spiralCount = Math.max(30, Math.min(particleCount * 2, 150));
        for (let i = 0; i < spiralCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 60 + 15;
          const pSpeed = Math.random() * 2.2 + 0.8;
          const color = cosmicColors[Math.floor(Math.random() * cosmicColors.length)];

          particles.push({
            x: clickX + Math.cos(angle) * dist,
            y: clickY + Math.sin(angle) * dist,
            vx: -Math.sin(angle) * pSpeed * 2.4, // orbital tangent speed vector
            vy: Math.cos(angle) * pSpeed * 2.4,
            size: Math.random() * 2.2 + 0.6,
            alpha: 1.0,
            color,
            life: 180,
            maxLife: 180,
          });
        }
        return;
      }

      // Play elegant pentatonic synth bell chime
      if (synthRef.current) {
        synthRef.current.playChime();
      }

      // Add a dynamic gravity ripple shockwave
      shockwavesRef.current.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.max(160, Math.min(particleCount * 3.8, 320)),
        alpha: 1.0,
        speed: 7.2
      });

      // Spawn concentric cosmic ring particles based on supervisor config
      const ringCount = Math.max(10, Math.min(particleCount, 120));
      for (let i = 0; i < ringCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.8 + 1.5;
        const size = Math.random() * 2.8 + 1.0;
        const maxLife = Math.random() * 60 + 40;
        const color = cosmicColors[Math.floor(Math.random() * cosmicColors.length)];

        particles.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size,
          alpha: 1.0,
          color,
          life: maxLife,
          maxLife,
        });
      }

      // Special bright central star white bursts
      for (let j = 0; j < 12; j++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.8 + 0.6;
        const color = "rgba(255, 255, 255, ";

        particles.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.5,
          alpha: 1.0,
          color,
          life: 80,
          maxLife: 80,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchstart", handleTouchMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("click", handleMouseClick);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = canvas.width = entry.contentRect.width || window.innerWidth;
        height = canvas.height = entry.contentRect.height || window.innerHeight;
        const starCount = Math.min(Math.floor((width * height) / 8000), 160);
        generateStars(starCount);
        generateMatrixDrops();
      }
    });
    resizeObserver.observe(document.body);

    // Delta-timed game-loop frame throttling variables
    let lastRenderTime = performance.now();

    // Render loop
    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const currentTime = performance.now();
      const elapsed = currentTime - lastRenderTime;
      const targetInterval = 1000 / fpsCap;

      if (elapsed < targetInterval) {
        return; // skip this render to throttle FPS cap correctly
      }

      // Reset timer with allowance for remainder jitter
      lastRenderTime = currentTime - (elapsed % targetInterval);

      // Celestial dark clean transparent clearing
      ctx.fillStyle = isProMode ? "rgba(4, 1, 10, 0.22)" : "rgba(7, 9, 14, 0.22)";
      ctx.fillRect(0, 0, width, height);

      // 0. Update and render active Gravity Singularity Attractors (Innovative Pro Mode Upgrade)
      const attractors = attractorsRef.current;
      for (let i = attractors.length - 1; i >= 0; i--) {
        const at = attractors[i];
        at.life--;
        if (at.life <= 0) {
          attractors.splice(i, 1);
          continue;
        }

        const lifeRatio = at.life / at.maxLife;
        const pulse = Math.sin(performance.now() * 0.006) * 4;
        const radius = (at.size + pulse) * lifeRatio;

        // Draw multiple nested glowing gravity rings (accretion disk)
        const grd = ctx.createRadialGradient(at.x, at.y, 2, at.x, at.y, radius * 2.5);
        grd.addColorStop(0, "rgba(9, 3, 16, 0.95)"); // black core of the event horizon
        grd.addColorStop(0.12, "rgba(147, 51, 234, 0.85)"); // glowing violet boundary
        grd.addColorStop(0.35, "rgba(236, 72, 153, 0.28)"); // pink swirling matter
        grd.addColorStop(0.7, "rgba(6, 182, 212, 0.06)"); // blue lensed halo
        grd.addColorStop(1.0, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(at.x, at.y, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Accretion orbit light rings
        ctx.strokeStyle = `rgba(236, 72, 153, ${lifeRatio * 0.4})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(at.x, at.y, radius * 0.9, performance.now() * 0.002, performance.now() * 0.002 + Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = `rgba(6, 182, 212, ${lifeRatio * 0.5})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(at.x, at.y, radius * 1.25, -performance.now() * 0.003, -performance.now() * 0.003 + Math.PI * 1.25);
        ctx.stroke();

        // Glowing white core center
        ctx.fillStyle = `rgba(255, 255, 255, ${lifeRatio * 0.95})`;
        ctx.beginPath();
        ctx.arc(at.x, at.y, Math.max(1, radius * 0.15), 0, Math.PI * 2);
        ctx.fill();
      }

      // Keyboard/Mouse interpolation
      const mouse = mouseRef.current;
      if (mouse.active) {
        if (mouse.x === -1000) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.12;
          mouse.y += (mouse.targetY - mouse.y) * 0.12;
        }

        // Tapered ribbon tracking coordinates size
        const trail = trailHistoryRef.current;
        trail.push({ x: mouse.x, y: mouse.y });
        const limit = Math.max(3, Math.min(trailLength, 80));
        while (trail.length > limit) {
          trail.shift();
        }
      } else {
        mouse.x += (-1000 - mouse.x) * 0.1;
        mouse.y += (-1000 - mouse.y) * 0.1;

        const trail = trailHistoryRef.current;
        if (trail.length > 0) {
          trail.shift();
        }
      }

      // Draw custom cyber grid lines under central layout if path-traced shader mode
      if (shaderMode === "path-traced") {
        ctx.strokeStyle = isProMode ? "rgba(168, 85, 247, 0.015)" : "rgba(16, 185, 129, 0.012)";
        ctx.lineWidth = 1.0;
        const gridGap = 65;
        // Horizontal grid
        for (let y = 0; y < height; y += gridGap) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        // Vertical grid
        for (let x = 0; x < width; x += gridGap) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }

      // 1. Quantum Falling Matrix Drops (Innovative Background Animation in PRO mode)
      if (isProMode) {
        ctx.font = "bold 9px monospace";
        const drops = matrixDropsRef.current;
        const list = ["λ", "∫", "∂", "0", "1", "x", "y", "[]", "{}", "*", "+", "ψ", "Δ", "∇", "Ω", "α", "β", "γ", "ø"];
        
        for (const d of drops) {
          d.y += d.speed;
          if (d.y > height) {
            d.y = Math.random() * -120 - 40;
            d.speed = Math.random() * 2.2 + 0.9;
          }

          for (let i = 0; i < d.chars.length; i++) {
            const charY = d.y - (i * d.size * 1.3);
            if (charY < 0 || charY > height) continue;

            const alphaRatio = (d.chars.length - i) / d.chars.length;
            const alpha = alphaRatio * 0.16 * (d.speed / 2.5);

            if (i === 0) {
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 2.4})`; // White lead glow head
            } else if (i < 4) {
              ctx.fillStyle = `rgba(217, 70, 239, ${alpha})`; // Fuchsia glow
            } else {
              ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`; // Elegant dark purple drift
            }

            let renderX = d.x;
            let renderY = charY;

            // Apply gravitational lens path bending of code raindrops near singularities
            for (const at of attractorsRef.current) {
              const dx = at.x - renderX;
              const dy = at.y - renderY;
              const dist = Math.hypot(dx, dy);
              if (dist < 240 && dist > 2) {
                const lensRatio = (240 - dist) / 240;
                const pushX = (dx / dist) * lensRatio * 64 * (at.life / at.maxLife);
                const pushY = (dy / dist) * lensRatio * 18 * (at.life / at.maxLife);
                renderX += pushX;
                renderY += pushY;
              }
            }

            ctx.font = `italic ${d.size}px monospace`;
            ctx.fillText(d.chars[i], renderX, renderY);

            // Mutate character values for cyber coding dynamic streams
            if (Math.random() > 0.985) {
              d.chars[i] = list[Math.floor(Math.random() * list.length)];
            }
          }
        }
      }

      // 1.5. Nebula mouse visual glow pass
      if (mouse.active) {
        const glowRad = Math.max(50, Math.min(bloomGlow * 15, 600));
        const radGrd = ctx.createRadialGradient(
          mouse.x, mouse.y, 5,
          mouse.x, mouse.y, glowRad
        );
        if (isProMode) {
          radGrd.addColorStop(0, "rgba(147, 51, 234, 0.15)");
          radGrd.addColorStop(0.5, "rgba(236, 72, 153, 0.05)");
        } else {
          radGrd.addColorStop(0, "rgba(16, 185, 129, 0.12)");
          radGrd.addColorStop(0.5, "rgba(6, 182, 212, 0.04)");
        }
        radGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = radGrd;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, glowRad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle permanent backdrop cosmic galaxy
      const centerGrd = ctx.createRadialGradient(
        width / 2, height / 2, 80,
        width / 2, height / 2, 500
      );
      if (isProMode) {
        centerGrd.addColorStop(0, "rgba(109, 40, 217, 0.04)");
        centerGrd.addColorStop(0.5, "rgba(168, 85, 247, 0.015)");
      } else {
        centerGrd.addColorStop(0, "rgba(16, 185, 129, 0.035)");
        centerGrd.addColorStop(0.5, "rgba(6, 182, 212, 0.01)");
      }
      centerGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = centerGrd;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 500, 0, Math.PI * 2);
      ctx.fill();

      // Render physical shockwaves
      const shockwaves = shockwavesRef.current;
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += sw.speed;
        sw.alpha = 1 - (sw.radius / sw.maxRadius);
        if (sw.alpha <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = isProMode
          ? `rgba(168, 85, 247, ${sw.alpha * 0.4})`
          : `rgba(16, 185, 129, ${sw.alpha * 0.4})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = isProMode
          ? `rgba(217, 70, 239, ${sw.alpha * 0.16})`
          : `rgba(6, 182, 212, ${sw.alpha * 0.16})`;
        ctx.lineWidth = 4.0;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, Math.max(0, sw.radius - 8), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Helper function to draw trails with an offset for Chromatic Aberration Simulation split passes
      const drawCursorTrail = (offsetX: number, offsetY: number, colorShift: "none" | "red" | "blue" | "green") => {
        const trail = trailHistoryRef.current;
        if (trail.length <= 1) return;

        ctx.beginPath();
        ctx.moveTo(trail[0].x + offsetX, trail[0].y + offsetY);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x + offsetX, trail[i].y + offsetY);
        }

        let strokeColorStyle = "";
        const maxThickness = Math.max(1, Math.min(trailWidth, 30));

        if (colorShift === "red") {
          strokeColorStyle = isProMode ? "rgba(225, 29, 72, " : "rgba(239, 68, 68, ";
        } else if (colorShift === "blue") {
          strokeColorStyle = isProMode ? "rgba(6, 182, 212, " : "rgba(59, 130, 246, ";
        } else if (colorShift === "green") {
          strokeColorStyle = "rgba(16, 185, 129, ";
        } else {
          strokeColorStyle = isProMode ? "rgba(168, 85, 247, " : "rgba(16, 185, 129, ";
        }

        ctx.strokeStyle = strokeColorStyle + "0.32)";
        ctx.lineWidth = maxThickness;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      };

      // 2. Cursor Trail ribbon pass (with dual chromatic color splits on demand)
      if (aberration > 0 && mouse.active) {
        // Red chromatic offset split channel
        ctx.globalCompositeOperation = "screen";
        drawCursorTrail(-aberration, -aberration, "red");
        // Cyan / Blue offset split channel
        drawCursorTrail(aberration, aberration, "blue");
        ctx.globalCompositeOperation = "source-over";
      }

      // Draw counter oscillating double-helix wave ribbon (Outstanding PRO Animation Upgrade)
      const trail = trailHistoryRef.current;
      if (trail.length > 1) {
        if (isProMode) {
          // Double-coiling quantum oscilloscope wave line 1
          ctx.beginPath();
          for (let i = 0; i < trail.length; i++) {
            const pt = trail[i];
            const ratio = i / trail.length;
            let ox = 0;
            let oy = 0;
            if (i > 0) {
              const prev = trail[i - 1];
              const dx = pt.x - prev.x;
              const dy = pt.y - prev.y;
              const len = Math.hypot(dx, dy);
              if (len > 0) {
                const nx = -dy / len;
                const ny = dx / len;
                const travelWave = Math.sin(i * 0.45 - (performance.now() * 0.015)) * 6 * ratio;
                ox = nx * travelWave;
                oy = ny * travelWave;
              }
            }
            if (i === 0) {
              ctx.moveTo(pt.x + ox, pt.y + oy);
            } else {
              ctx.lineTo(pt.x + ox, pt.y + oy);
            }
          }
          ctx.strokeStyle = `rgba(168, 85, 247, 0.40)`;
          ctx.lineWidth = trailWidth;
          ctx.lineCap = "round";
          ctx.stroke();

          // Counter-oscillating coil line 2
          ctx.beginPath();
          for (let i = 0; i < trail.length; i++) {
            const pt = trail[i];
            const ratio = i / trail.length;
            let ox = 0;
            let oy = 0;
            if (i > 0) {
              const prev = trail[i - 1];
              const dx = pt.x - prev.x;
              const dy = pt.y - prev.y;
              const len = Math.hypot(dx, dy);
              if (len > 0) {
                const nx = -dy / len;
                const ny = dx / len;
                const travelWave = Math.sin(i * 0.45 + (performance.now() * 0.02) + Math.PI) * 6 * ratio;
                ox = nx * travelWave;
                oy = ny * travelWave;
              }
            }
            if (i === 0) {
              ctx.moveTo(pt.x + ox, pt.y + oy);
            } else {
              ctx.lineTo(pt.x + ox, pt.y + oy);
            }
          }
          ctx.strokeStyle = `rgba(217, 70, 239, 0.70)`;
          ctx.lineWidth = trailWidth * 0.45;
          ctx.stroke();

          // Clean electrical spine line
          ctx.beginPath();
          ctx.moveTo(trail[0].x, trail[0].y);
          for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
          }
          ctx.strokeStyle = `rgba(255, 255, 255, 0.65)`;
          ctx.lineWidth = 1.0;
          ctx.stroke();

        } else {
          // Standard linear trail layer
          for (let i = 1; i < trail.length; i++) {
            const pt1 = trail[i - 1];
            const pt2 = trail[i];
            const ratio = i / trail.length;
            
            // Outer dust halo
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${ratio * 0.40})`;
            ctx.lineWidth = ratio * trailWidth;
            ctx.lineCap = "round";
            ctx.stroke();

            // Core neon thread glow
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${ratio * 0.65})`;
            ctx.lineWidth = ratio * (trailWidth * 0.5);
            ctx.stroke();

            // Electric center spine line
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${ratio * 0.90})`;
            ctx.lineWidth = ratio * 1.0;
            ctx.stroke();
          }
        }
      }

      // 3. Render Stars with custom physics & gravitational fields
      for (const star of stars) {
        star.twinklePhase += star.twinkleSpeed;
        const twinkleAlpha = 0.2 + (Math.sin(star.twinklePhase) + 1) * 0.4;

        if (star.orbitRadius > 0) {
          star.angle += star.orbitSpeed;
          star.x = star.baseX + Math.cos(star.angle) * star.orbitRadius;
          star.y = star.baseY + Math.sin(star.angle) * star.orbitRadius;
        }

        let renderX = star.x;
        let renderY = star.y;

        // Gravity attraction pull and orbit twist (Innovative black hole vortex swirl)
        for (const at of attractorsRef.current) {
          const dx = at.x - renderX;
          const dy = at.y - renderY;
          const dist = Math.hypot(dx, dy);
          if (dist < 320 && dist > 2) {
            const forceRatio = (320 - dist) / 320;
            const pullForce = forceRatio * forceRatio * 4.5 * (at.life / at.maxLife);
            
            // Vector pull inward
            renderX += (dx / dist) * pullForce;
            renderY += (dy / dist) * pullForce;

            // Orbital swirl twist (perpendicular vector motion)
            const swirlRads = (performance.now() * 0.0008) + (dist * 0.015);
            const swirlX = -Math.sin(swirlRads) * pullForce * 4.0;
            const swirlY = Math.cos(swirlRads) * pullForce * 4.0;
            renderX += swirlX;
            renderY += swirlY;
            
            // Draw a beautiful thin stardust connector stream line to the singularity
            if (dist < 110 && Math.random() > 0.92) {
              ctx.strokeStyle = `rgba(236, 72, 153, ${forceRatio * 0.12})`;
              ctx.lineWidth = 0.35;
              ctx.beginPath();
              ctx.moveTo(renderX, renderY);
              ctx.lineTo(at.x, at.y);
              ctx.stroke();
            }
          }
        }

        // Apply physical impact deflection from active shockwaves
        for (const sw of shockwaves) {
          const dx = renderX - sw.x;
          const dy = renderY - sw.y;
          const dist = Math.hypot(dx, dy);
          const diff = dist - sw.radius;
          if (Math.abs(diff) < 40 && dist > 0) {
            const pushForce = (1 - Math.abs(diff) / 40) * sw.alpha * 15;
            renderX += (dx / dist) * pushForce;
            renderY += (dy / dist) * pushForce;
          }
        }

        if (mouse.active) {
          const dx = mouse.x - star.x;
          const dy = mouse.y - star.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 200) {
            const force = (200 - distance) / 200;
            // Gravity pulls star inwards slightly
            renderX += (dx / distance) * force * 15;
            renderY += (dy / distance) * force * 15;

            // Connected constellation starmap link
            if (distance < latticeDist) {
              ctx.strokeStyle = isProMode
                ? `rgba(168, 85, 247, ${(latticeDist - distance) / latticeDist * 0.2})`
                : `rgba(16, 185, 129, ${(latticeDist - distance) / latticeDist * 0.2})`;
              ctx.lineWidth = 0.55;
              ctx.beginPath();
              ctx.moveTo(renderX, renderY);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
            }
          }
        }

        ctx.fillStyle = star.color + twinkleAlpha + ")";
        ctx.beginPath();
        if (star.size > 1.6) {
          // Drawing custom vectors representing diamond shaped stars
          ctx.moveTo(renderX, renderY - star.size * 1.5);
          ctx.lineTo(renderX + star.size * 0.7, renderY);
          ctx.lineTo(renderX, renderY + star.size * 1.5);
          ctx.lineTo(renderX - star.size * 0.7, renderY);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.arc(renderX, renderY, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Connect neighboring stars with cybernetic lattice links
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const s1 = stars[i];
          const s2 = stars[j];
          const dx = s1.x - s2.x;
          const dy = s1.y - s2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < latticeDist) {
            if (s1.orbitRadius === 0 && s2.orbitRadius === 0) {
              const alphaRatio = (latticeDist - dist) / latticeDist;
              let baseAlpha = alphaRatio * 0.035;

              if (mouse.active) {
                const mouseDist1 = Math.hypot(mouse.x - s1.x, mouse.y - s1.y);
                const mouseDist2 = Math.hypot(mouse.x - s2.x, mouse.y - s2.y);
                if (mouseDist1 < 180 || mouseDist2 < 180) {
                  baseAlpha += 0.08 * (1 - Math.min(mouseDist1, mouseDist2) / 180);
                }
              }

              ctx.strokeStyle = isProMode
                ? `rgba(147, 51, 234, ${baseAlpha})`
                : `rgba(16, 185, 129, ${baseAlpha})`;
              ctx.lineWidth = 0.45;
              ctx.beginPath();
              ctx.moveTo(s1.x, s1.y);
              ctx.lineTo(s2.x, s2.y);
              ctx.stroke();
            }
          }
        }
      }

      // 5. Click burst rocket/stardust particle physical system
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Apply singularity attractor physics
        for (const at of attractorsRef.current) {
          const dx = at.x - p.x;
          const dy = at.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 320 && dist > 1) {
            const pullForce = ((320 - dist) / 320) * 0.95 * (at.life / at.maxLife);
            // Pull vector velocity
            p.vx += (dx / dist) * pullForce * 0.85;
            p.vy += (dy / dist) * pullForce * 0.85;

            // Spiral swirl twist velocity
            p.vx += (-dy / dist) * pullForce * 1.6;
            p.vy += (dx / dist) * pullForce * 1.6;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Apply adjustable physical drag coefficient
        p.vx *= physicsFriction;
        p.vy *= physicsFriction;

        // Minimal drift upward mimicking zero-gravity heat convection
        p.vy -= 0.015;

        p.life--;
        p.alpha = Math.max(0, p.life / p.maxLife);

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.size > 2.0 && p.alpha > 0.4) {
          ctx.fillStyle = p.color + (p.alpha * 0.1) + ")";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("click", handleMouseClick);
      resizeObserver.disconnect();
    };
  }, [
    isProMode,
    fpsCap,
    trailWidth,
    trailLength,
    latticeDist,
    particleCount,
    shaderMode,
    physicsFriction,
    aberration,
    bloomGlow,
    colorPreset
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
