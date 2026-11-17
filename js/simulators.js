// ============================================================================
// VertigoLab — Bilingual Visual Simulators, Multi-Maneuver BPPV Suite & Exams
// Supports Bahasa Melayu (ms) & English (en), Calm Mode, Audio Mute & HiDPI
// ============================================================================

(function () {
  "use strict";

  if (typeof window.__vertigoCalmMode !== "boolean") window.__vertigoCalmMode = false;
  if (typeof window.__vertigoAudioMuted !== "boolean") window.__vertigoAudioMuted = false;

  const refreshHooks = [];
  const canvasWakeCallbacks = [];
  const activeOscillators = new Set();

  function isEn() {
    return window.currentLang === "en";
  }

  function isCalmMode() {
    return Boolean(
      window.__vertigoCalmMode ||
        (document.documentElement && document.documentElement.classList.contains("calm-motion")) ||
        (document.body && document.body.classList.contains("calm-motion"))
    );
  }

  function isLightTheme() {
    return Boolean(document.body && document.body.classList.contains("light-theme"));
  }

  // Polyfill roundRect for maximum browser compatibility
  if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const radius = Math.min(r || 0, w / 2, h / 2);
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      this.closePath();
      return this;
    };
  }

  function setupHiDPICanvas(canvas, logicalWidth, logicalHeight) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(logicalWidth * dpr) || canvas.height !== Math.round(logicalHeight * dpr)) {
      canvas.width = Math.round(logicalWidth * dpr);
      canvas.height = Math.round(logicalHeight * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  // Auto-fit text within maxWidth so BM/EN pills & captions never clip or overflow
  function drawFittedText(ctx, text, x, y, maxWidth, minFontPx) {
    if (text === null || text === undefined || text === "") return;
    const str = String(text);
    if (!maxWidth || maxWidth <= 0) {
      ctx.fillText(str, x, y);
      return;
    }
    const measured = ctx.measureText(str).width;
    if (measured <= maxWidth) {
      ctx.fillText(str, x, y);
      return;
    }
    ctx.save();
    const fontStr = ctx.font || "";
    const match = fontStr.match(/(\d+(?:\.\d+)?)px/);
    if (match) {
      const origPx = parseFloat(match[1]);
      const floorPx = minFontPx || 9;
      const scaledPx = Math.max(floorPx, Math.floor(origPx * (maxWidth / measured) * 10) / 10);
      ctx.font = fontStr.replace(/(\d+(?:\.\d+)?)px/, scaledPx + "px");
    }
    ctx.fillText(str, x, y, maxWidth);
    ctx.restore();
  }

  // Crisp dark clinical monitor frame (WCAG AAA internal contrast across Dark & Light themes)
  function drawClinicalMonitorBg(ctx, W, H, showGrid) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // Subtle header band for clinical monitor polish
    ctx.fillStyle = "rgba(30, 41, 59, 0.52)";
    ctx.fillRect(0, 0, W, 34);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 34.5);
    ctx.lineTo(W, 34.5);
    ctx.stroke();

    if (showGrid) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.07)";
      ctx.lineWidth = 1;
      for (let x = 28; x < W; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 35);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 56; y < H; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    // Subtle inner bezel tint in Light Theme so monitor edges stay razor-sharp
    if (isLightTheme()) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);
    }
  }

  // Viewport + Tab Visibility + Calm-Mode aware animation controller
  function createManagedCanvasLoop(canvas, logicalW, logicalH, renderFrameFn) {
    let ctx = setupHiDPICanvas(canvas, logicalW, logicalH);
    let inViewport = true;
    let rafId = null;

    function cancelLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function step(now) {
      rafId = null;
      if (document.hidden || !inViewport) return;
      const keepAnimating = renderFrameFn(ctx, now);
      if (keepAnimating === true && !document.hidden && inViewport) {
        rafId = requestAnimationFrame(step);
      }
    }

    function wake(forceImmediate) {
      ctx = setupHiDPICanvas(canvas, logicalW, logicalH);
      if (document.hidden) {
        cancelLoop();
        return;
      }
      if (forceImmediate) {
        cancelLoop();
        const keepAnimating = renderFrameFn(ctx, performance.now());
        if (keepAnimating === true && inViewport) {
          rafId = requestAnimationFrame(step);
        }
        return;
      }
      if (!inViewport) return;
      if (rafId === null) {
        rafId = requestAnimationFrame(step);
      }
    }

    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target !== canvas) return;
            inViewport = entry.isIntersecting;
            if (inViewport) {
              wake(false);
            } else {
              cancelLoop();
            }
          });
        },
        { rootMargin: "80px 0px", threshold: 0.01 }
      );
      io.observe(canvas);
    }

    canvasWakeCallbacks.push(() => wake(true));
    return { wake, cancel: cancelLoop };
  }

  function wakeAllCanvases() {
    canvasWakeCallbacks.forEach((fn) => {
      try {
        fn();
      } catch (_) {}
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      wakeAllCanvases();
    }
  });

  window.addEventListener("resize", () => {
    wakeAllCanvases();
  });

  if (typeof MutationObserver !== "undefined") {
    const classObserver = new MutationObserver(() => {
      wakeAllCanvases();
    });
    if (document.documentElement) {
      classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }
    if (document.body) {
      classObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
  }

  // --------------------------------------------------------------------------
  // AUDIO ENGINE WITH MUTE & IMMEDIATE SILENCE SUPPORT
  // --------------------------------------------------------------------------
  window.stopActiveVertigoAudio = function () {
    activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (_) {}
    });
    activeOscillators.clear();
    if (window.__vertigoAudioCtx && window.__vertigoAudioCtx.state === "running") {
      try {
        window.__vertigoAudioCtx.suspend();
      } catch (_) {}
    }
  };

  function playGentleTone(freq, durationMs) {
    if (window.__vertigoAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window.__vertigoAudioCtx) {
        window.__vertigoAudioCtx = new AudioCtx();
      }
      const ctx = window.__vertigoAudioCtx;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const durSec = (durationMs || 220) / 1000;
      osc.type = "sine";
      osc.frequency.value = freq || 587.33;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      activeOscillators.add(osc);
      osc.onended = function () {
        activeOscillators.delete(osc);
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };
      osc.start();
      osc.stop(ctx.currentTime + durSec);
    } catch (_) {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  }

  // --------------------------------------------------------------------------
  // 1. SIMULATOR KONFLIK 3 SENSOR & NYSTAGMUS MATA
  // --------------------------------------------------------------------------
  function initSensorySimulator() {
    const canvas = document.getElementById("sensoryCanvas");
    if (!canvas) return;

    const W = 560;
    const H = 280;

    let currentPresetKey = "acuteVertigo";
    const startTime = performance.now();
    let fixationActive = false;
    let loop = null;

    const fixBtn = document.getElementById("btnVisualFixation");

    function updateFixBtnLabel() {
      if (!fixBtn) return;
      fixBtn.classList.toggle("active", fixationActive);
      fixBtn.setAttribute("aria-pressed", String(fixationActive));
      if (isEn()) {
        fixBtn.textContent = fixationActive
          ? "🎯 Visual Fixation Target: ON (Click to Turn Off)"
          : "🎯 Try Visual Fixation on One Still Point (First-Aid)";
      } else {
        fixBtn.textContent = fixationActive
          ? "🎯 Fokus Titik Pegun: AKTIF (Klik Matikan)"
          : "🎯 Cuba Fokus Satu Titik Pegun (Pertolongan Pertama)";
      }
    }

    if (fixBtn) {
      fixBtn.addEventListener("click", () => {
        fixationActive = !fixationActive;
        updateFixBtnLabel();
        if (loop) loop.wake(true);
      });
    }

    function setPreset(key) {
      if (!window.VERTIGO_DATA || !window.VERTIGO_DATA.sensorPresets || !window.VERTIGO_DATA.sensorPresets[key]) {
        return;
      }
      currentPresetKey = key;
      const preset = window.VERTIGO_DATA.sensorPresets[key];

      const vestEl = document.getElementById("sensorVestVal");
      const visEl = document.getElementById("sensorVisVal");
      const propEl = document.getElementById("sensorPropVal");
      const conflictEl = document.getElementById("conflictMeterFill");
      const conflictNumEl = document.getElementById("conflictMeterPct");
      const nauseaEl = document.getElementById("sensorNauseaBadge");
      const summaryEl = document.getElementById("sensorSummaryText");

      if (vestEl) vestEl.textContent = preset.vestibular;
      if (visEl) visEl.textContent = preset.visual;
      if (propEl) propEl.textContent = preset.proprioception;
      if (conflictEl) {
        conflictEl.style.width = preset.conflictLevel + "%";
        conflictEl.style.background =
          preset.conflictLevel >= 80
            ? "linear-gradient(90deg, #f59e0b, #ef4444)"
            : preset.conflictLevel >= 30
            ? "#f59e0b"
            : "#10b981";
      }
      if (conflictNumEl) conflictNumEl.textContent = preset.conflictLevel + "%";
      if (nauseaEl) {
        nauseaEl.textContent = (isEn() ? "Nausea Reflex: " : "Refleks Loya: ") + preset.nausea;
        nauseaEl.className =
          "pill-badge " +
          (preset.conflictLevel >= 80 ? "pill-danger" : preset.conflictLevel >= 20 ? "pill-warn" : "pill-ok");
      }
      if (summaryEl) summaryEl.textContent = preset.summary;

      document.querySelectorAll("[data-sensor-preset]").forEach((btn) => {
        const isCurrent = btn.getAttribute("data-sensor-preset") === key;
        btn.classList.toggle("active", isCurrent);
        btn.setAttribute("aria-pressed", String(isCurrent));
      });

      if (loop) loop.wake(true);
    }

    document.querySelectorAll("[data-sensor-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setPreset(btn.getAttribute("data-sensor-preset"));
        if (window.markModuleExplored) window.markModuleExplored("sensory");
      });
    });

    refreshHooks.push(() => {
      updateFixBtnLabel();
      setPreset(currentPresetKey);
    });

    function drawEye(ctx, cx, cy, offsetX, offsetY, dimVision) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - 58, cy);
      ctx.quadraticCurveTo(cx, cy - 38, cx + 58, cy);
      ctx.quadraticCurveTo(cx, cy + 38, cx - 58, cy);
      ctx.closePath();
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#475569";
      ctx.stroke();
      ctx.clip();

      const scleraGrad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 58);
      scleraGrad.addColorStop(0, "rgba(255,255,255,0)");
      scleraGrad.addColorStop(1, "rgba(148,163,184,0.35)");
      ctx.fillStyle = scleraGrad;
      ctx.fillRect(cx - 60, cy - 40, 120, 80);

      const ix = cx + offsetX;
      const iy = cy + offsetY;
      const irisGrad = ctx.createRadialGradient(ix - 3, iy - 3, 4, ix, iy, 21);
      irisGrad.addColorStop(0, "#38bdf8");
      irisGrad.addColorStop(0.65, "#0284c7");
      irisGrad.addColorStop(1, "#0f172a");
      ctx.beginPath();
      ctx.arc(ix, iy, 21, 0, Math.PI * 2);
      ctx.fillStyle = irisGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ix, iy, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#020617";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ix - 6, iy - 6, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();

      if (dimVision > 0) {
        ctx.fillStyle = "rgba(2, 6, 23, " + dimVision + ")";
        ctx.fillRect(cx - 60, cy - 40, 120, 80);
      }
      ctx.restore();

      if (fixationActive) {
        ctx.save();
        ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawCalmDirectionBadge(ctx, text, borderColor) {
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 118, 42, 236, 22, 11);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = borderColor;
      ctx.font = "700 10.5px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(ctx, text, W / 2, 57, 220, 8.5);
      ctx.restore();
    }

    function render(ctx, now) {
      if (!window.VERTIGO_DATA || !window.VERTIGO_DATA.sensorPresets) return false;
      const en = isEn();
      const calm = isCalmMode();
      const t = calm ? 0 : (now - startTime) / 1000;
      const preset = window.VERTIGO_DATA.sensorPresets[currentPresetKey];

      drawClinicalMonitorBg(ctx, W, H, true);

      let ox = 0;
      let oy = 0;
      let dimVision = 0;
      let statusLabel = en ? "Stable Eyes (No Nystagmus)" : "Bebola Mata Stabil (Tiada Nystagmus)";
      let statusColor = "#34d399";
      let calmArrowBadge = "";

      if (calm) {
        if (preset.nystagmus === "horizontal-jerk") {
          ox = fixationActive ? 2 : 7;
          statusColor = fixationActive ? "#34d399" : "#fbbf24";
          calmArrowBadge = fixationActive
            ? en
              ? "🧘 Static Vector: → Slow | ⇐ Suppressed (~75%)"
              : "🧘 Vektor Statik: → Perlahan | ⇐ Ditekan (~75%)"
            : en
            ? "🧘 Static Vector: → Slow Drift | ⇐ Fast Snap (1-Way)"
            : "🧘 Vektor Statik: → Hanyut | ⇐ Sentak Pantas (1 Arah)";
          statusLabel = fixationActive
            ? en
              ? "🧘 Calm Diagram: Fixation Suppresses Peripheral Nystagmus (~75%)"
              : "🧘 Mod Tenang: Fokus Titik Menekan Nystagmus Periferi (~75%)"
            : en
            ? "🧘 Calm Diagram: Unidirectional Peripheral Nystagmus (Motion Paused)"
            : "🧘 Mod Tenang: Nystagmus Periferi Satu Arah (Animasi Dijeda)";
        } else if (preset.nystagmus === "vertical-bidirectional") {
          oy = -5;
          statusColor = "#f87171";
          calmArrowBadge = en
            ? "🧘 Static Vector: ⇅ Vertical / ⇄ Direction-Changing"
            : "🧘 Vektor Statik: ⇅ Menegak / ⇄ Bertukar Arah";
          statusLabel = fixationActive
            ? en
              ? "🧘 Calm Diagram: CENTRAL RED FLAG — Fixation Fails to Suppress!"
              : "🧘 Mod Tenang: AMARAN SENTRAL — Fokus Gagal Menekan Nystagmus!"
            : en
            ? "🧘 Calm Diagram: Central Vertical / Bidirectional Nystagmus"
            : "🧘 Mod Tenang: Nystagmus Sentral Menegak / Dua Arah";
        } else if (preset.nystagmus === "physiologic") {
          ox = -5;
          statusColor = "#38bdf8";
          calmArrowBadge = en ? "🧘 Static Vector: ⇄ Intact VOR Reflex" : "🧘 Vektor Statik: ⇄ Refleks VOR Normal";
          statusLabel = en
            ? "🧘 Calm Diagram: Physiologic VOR Stabilizes Gaze During Spin"
            : "🧘 Mod Tenang: Refleks VOR Fisiologi Menstabilkan Fokus";
        } else if (currentPresetKey === "presyncope") {
          dimVision = 0.38;
          statusColor = "#a78bfa";
          calmArrowBadge = en
            ? "🧘 Static View: Dimmed Sclera (No Nystagmus)"
            : "🧘 Paparan Statik: Pandangan Redup (Tiada Nystagmus)";
          statusLabel = en
            ? "🧘 Calm Diagram: Transient Visual Dimming (Presyncope — Not Vertigo!)"
            : "🧘 Mod Tenang: Pandangan Gelap Sementara (Bukan Vertigo!)";
        } else {
          statusColor = "#34d399";
          calmArrowBadge = en
            ? "🧘 Static View: Steady Gaze (Zero Conflict)"
            : "🧘 Paparan Statik: Mata Tenang (Tiada Konflik)";
          statusLabel = en
            ? "🧘 Calm Diagram: Stable Eyes — Balanced 3-Sensor Input"
            : "🧘 Mod Tenang: Bebola Mata Stabil — 3 Sensor Seimbang";
        }
      } else if (preset.nystagmus === "horizontal-jerk") {
        const cycle = (t * 1.9) % 1;
        const rawAmp = fixationActive ? 3.5 : 14;
        if (cycle < 0.82) {
          ox = rawAmp - (cycle / 0.82) * (rawAmp * 2);
        } else {
          ox = -rawAmp + ((cycle - 0.82) / 0.18) * (rawAmp * 2);
        }
        if (en) {
          statusLabel = fixationActive
            ? "✅ Visual Fixation Suppresses Peripheral Nystagmus (~75% Calmer!)"
            : "Unidirectional Peripheral Nystagmus (Slow Drift + Fast Snap)";
        } else {
          statusLabel = fixationActive
            ? "✅ Fokus Titik Pegun Menekan Nystagmus Periferi (~75% Lebih Tenang!)"
            : "Nystagmus Periferi Satu Arah (Fasa Perlahan + Sentakan Pantas)";
        }
        statusColor = fixationActive ? "#34d399" : "#fbbf24";
      } else if (preset.nystagmus === "vertical-bidirectional") {
        const subMode = Math.floor(t / 2.5) % 2;
        if (subMode === 0) {
          const cycle = (t * 2.2) % 1;
          oy = cycle < 0.8 ? -11 + (cycle / 0.8) * 22 : 11 - ((cycle - 0.8) / 0.2) * 22;
          if (en) {
            statusLabel = fixationActive
              ? "⚠️ CENTRAL RED FLAG: Visual Fixation FAILS to Suppress Vertical Nystagmus!"
              : "CENTRAL RED FLAG: Pure Vertical Nystagmus";
          } else {
            statusLabel = fixationActive
              ? "⚠️ AMARAN SENTRAL: Fokus Titik TIDAK Menekan Nystagmus Menegak!"
              : "AMARAN SENTRAL: Vertical Nystagmus (Menegak Tulen)";
          }
        } else {
          ox = Math.sin(t * 6.5) * 15;
          if (en) {
            statusLabel = fixationActive
              ? "⚠️ CENTRAL RED FLAG: Nystagmus Persists Despite Visual Fixation!"
              : "CENTRAL RED FLAG: Direction-Changing Nystagmus";
          } else {
            statusLabel = fixationActive
              ? "⚠️ AMARAN SENTRAL: Nystagmus Kekal Kuat Walaupun Fokus Satu Titik!"
              : "AMARAN SENTRAL: Nystagmus Bertukar Arah";
          }
        }
        statusColor = "#f87171";
      } else if (preset.nystagmus === "physiologic") {
        ox = Math.sin(t * 2.5) * 12;
        statusLabel = en
          ? "Physiologic VOR Reflex (Stabilizing Vision During True Spin)"
          : "Refleks VOR Fisiologi (Menstabilkan Fokus Semasa Pusing)";
        statusColor = "#38bdf8";
      } else if (currentPresetKey === "presyncope") {
        dimVision = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.2));
        statusLabel = en
          ? "No Nystagmus — Transient Visual Dimming (Presyncope, Not Vertigo!)"
          : "Tiada Nystagmus — Pandangan Gelap Sementara (Bukan Vertigo!)";
        statusColor = "#a78bfa";
      }

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11.5px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(
        ctx,
        en
          ? "REAL-TIME PATIENT EYE SIMULATION (CLINICAL OBSERVATION)"
          : "SIMULASI MASA NYATA BEBOLA MATA PESAKIT (PEMERHATIAN KLINIKAL)",
        W / 2,
        22,
        W - 36,
        9.5
      );

      const eyeY = calm ? 112 : 102;
      drawEye(ctx, W / 2 - 92, eyeY, ox, oy, dimVision);
      drawEye(ctx, W / 2 + 92, eyeY, ox, oy, dimVision);

      if (calm && calmArrowBadge) {
        drawCalmDirectionBadge(ctx, calmArrowBadge, statusColor);
      }

      // Nose bridge contour
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 8, eyeY - 7);
      ctx.quadraticCurveTo(W / 2, eyeY + 28, W / 2 - 12, eyeY + 46);
      ctx.stroke();

      // Status pill
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(24, 166, W - 48, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = statusColor;
      ctx.font = "600 12px system-ui, -apple-system, sans-serif";
      drawFittedText(ctx, statusLabel, W / 2, 186, W - 72, 9.5);

      const nodes = [
        {
          label: en ? "Vestibular (Inner Ear)" : "Vestibular (Telinga)",
          x: 105,
          alert: preset.conflictLevel >= 80
        },
        {
          label: en ? "Brainstem (Central Hub)" : "Batang Otak (Pusat)",
          x: W / 2,
          alert: preset.conflictLevel >= 80,
          hub: true
        },
        {
          label: en ? "Vision & Proprioception" : "Visual & Propriosepsi",
          x: W - 105,
          alert: currentPresetKey === "centralStroke"
        }
      ];

      ctx.strokeStyle = preset.conflictLevel >= 80 ? "rgba(248, 113, 113, 0.55)" : "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, 236);
      ctx.lineTo(nodes[1].x, 236);
      ctx.lineTo(nodes[2].x, 236);
      ctx.stroke();

      const pulsePos1 = calm ? 0.5 : (t * (preset.conflictLevel >= 80 ? 2.4 : 0.9)) % 1;
      const pulsePos2 = calm ? 0.5 : (t * 0.9) % 1;
      const p1x = nodes[0].x + (nodes[1].x - nodes[0].x) * pulsePos1;
      const p2x = nodes[2].x - (nodes[2].x - nodes[1].x) * pulsePos2;

      ctx.beginPath();
      ctx.arc(p1x, 236, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = preset.conflictLevel >= 80 ? "#ef4444" : "#38bdf8";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p2x, 236, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#34d399";
      ctx.fill();

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.roundRect(n.x - 74, 220, 148, 34, 8);
        ctx.fillStyle = n.hub
          ? preset.conflictLevel >= 80
            ? "rgba(127, 29, 29, 0.9)"
            : "rgba(15, 118, 110, 0.85)"
          : "#1e293b";
        ctx.fill();
        ctx.strokeStyle = n.alert ? "#f87171" : "#334155";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#f1f5f9";
        ctx.font = "600 11px system-ui, -apple-system, sans-serif";
        drawFittedText(ctx, n.label, n.x, 241, 136, 9);
      });

      return !calm;
    }

    loop = createManagedCanvasLoop(canvas, W, H, render);
    updateFixBtnLabel();
    setPreset("acuteVertigo");
    loop.wake(true);
  }

  // --------------------------------------------------------------------------
  // 2. SIMULATOR ANATOMI TELINGA DALAM & FIZIK OTOLITH / STEREOCILIA
  // --------------------------------------------------------------------------
  function initAnatomySimulator() {
    const canvas = document.getElementById("anatomyCanvas");
    if (!canvas) return;

    const W = 560;
    const H = 330;

    let activeZone = "utricle";
    let currentPartId = "utricle-saccule";
    let headTiltDeg = 0;
    let bppvLooseMode = false;
    let looseAngle = 0.35;
    let looseVel = 0;
    let loop = null;

    const tiltSlider = document.getElementById("headTiltSlider");
    const tiltValLabel = document.getElementById("headTiltVal");
    const bppvToggleBtn = document.getElementById("toggleBppvCrystalBtn");

    function updateBppvBtnText() {
      if (!bppvToggleBtn) return;
      bppvToggleBtn.classList.toggle("btn-danger-active", bppvLooseMode);
      bppvToggleBtn.setAttribute("aria-pressed", String(bppvLooseMode));
      if (isEn()) {
        bppvToggleBtn.textContent = bppvLooseMode
          ? "⚠️ BPPV Mode ON: Loose Crystals! (Click to Restore)"
          : "🔬 Simulate Detached Crystals (BPPV)";
      } else {
        bppvToggleBtn.textContent = bppvLooseMode
          ? "⚠️ Mod BPPV Aktif: Kristal Tersesat! (Klik Pulihkan)"
          : "🔬 Simulasikan Kristal Tanggal (BPPV)";
      }
    }

    if (tiltSlider) {
      tiltSlider.addEventListener("input", () => {
        headTiltDeg = parseFloat(tiltSlider.value) || 0;
        if (tiltValLabel) tiltValLabel.textContent = (headTiltDeg > 0 ? "+" : "") + headTiltDeg + "°";
        if (loop) loop.wake(false);
        if (window.markModuleExplored) window.markModuleExplored("anatomy");
      });
    }

    if (bppvToggleBtn) {
      bppvToggleBtn.addEventListener("click", () => {
        bppvLooseMode = !bppvLooseMode;
        updateBppvBtnText();
        if (bppvLooseMode) {
          activeZone = "bppv";
          selectAnatomyCard("bppv-trigger");
        } else if (loop) {
          loop.wake(true);
        }
        if (window.markModuleExplored) window.markModuleExplored("anatomy");
      });
    }

    function getSemanticPillClassForPart(part) {
      if (!part) return "pill-badge pill-info";
      if (part.id === "bppv-trigger" || part.highlightZone === "bppv") return "pill-badge pill-danger";
      if (part.id === "otoliths" || part.highlightZone === "otoliths") return "pill-badge pill-warn";
      return "pill-badge pill-info";
    }

    function selectAnatomyCard(partId) {
      if (!window.VERTIGO_DATA || !window.VERTIGO_DATA.anatomyParts) return;
      const part = window.VERTIGO_DATA.anatomyParts.find((p) => p.id === partId);
      if (!part) return;
      currentPartId = partId;
      activeZone = part.highlightZone;
      if (part.id === "bppv-trigger" && !bppvLooseMode && bppvToggleBtn) {
        bppvLooseMode = true;
        updateBppvBtnText();
      }

      document.querySelectorAll("[data-anatomy-id]").forEach((el) => {
        const isCurrent = el.getAttribute("data-anatomy-id") === partId;
        el.classList.toggle("active", isCurrent);
        el.setAttribute("aria-pressed", String(isCurrent));
      });

      const titleEl = document.getElementById("anatomyDetailTitle");
      const badgeEl = document.getElementById("anatomyDetailBadge");
      const textEl = document.getElementById("anatomyDetailText");
      const isLayman = document.body.classList.contains("mode-layman");

      if (titleEl) titleEl.textContent = part.title;
      if (badgeEl) {
        badgeEl.textContent = part.badge;
        // WCAG AA safe semantic badge class (never inline hex colors that fail Light Mode)
        badgeEl.style.color = "";
        badgeEl.style.borderColor = "";
        badgeEl.className = getSemanticPillClassForPart(part);
      }
      if (textEl) {
        textEl.textContent = isLayman ? part.layman : part.clinical;
        textEl.setAttribute("data-part-id", partId);
      }

      if (loop) loop.wake(true);
    }

    window.refreshAnatomyAudienceText = function () {
      selectAnatomyCard(currentPartId);
    };

    refreshHooks.push(() => {
      updateBppvBtnText();
      selectAnatomyCard(currentPartId);
    });

    document.querySelectorAll("[data-anatomy-id]").forEach((el) => {
      el.addEventListener("click", () => {
        selectAnatomyCard(el.getAttribute("data-anatomy-id"));
        if (window.markModuleExplored) window.markModuleExplored("anatomy");
      });
    });

    function renderAnatomy(ctx) {
      const en = isEn();
      const calm = isCalmMode();
      drawClinicalMonitorBg(ctx, W, H, false);

      let stillMoving = false;

      ctx.save();
      ctx.translate(168, 175);
      ctx.rotate((headTiltDeg * Math.PI) / 180);

      // Anterior Canal
      ctx.strokeStyle = activeZone === "canals" ? "#a78bfa" : "rgba(139, 92, 246, 0.48)";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(-18, -48, 56, Math.PI * 0.85, Math.PI * 2.05);
      ctx.stroke();

      // Lateral Canal
      ctx.strokeStyle = activeZone === "canals" ? "#c084fc" : "rgba(168, 85, 247, 0.42)";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.ellipse(-42, 4, 48, 22, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Posterior Canal
      const postRadius = 64;
      const postCx = 18;
      const postCy = 8;
      ctx.strokeStyle =
        activeZone === "bppv" || bppvLooseMode
          ? "#f87171"
          : activeZone === "canals"
          ? "#a78bfa"
          : "rgba(148, 163, 184, 0.55)";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(postCx, postCy, postRadius, -Math.PI * 0.45, Math.PI * 0.92);
      ctx.stroke();

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(postCx, postCy, postRadius, -Math.PI * 0.45, Math.PI * 0.92);
      ctx.stroke();

      // Ampulla bulb
      ctx.beginPath();
      ctx.arc(postCx - 34, postCy + 54, 13, 0, Math.PI * 2);
      ctx.fillStyle = activeZone === "canals" || bppvLooseMode ? "#f59e0b" : "#475569";
      ctx.fill();

      // Utricle & Saccule Sacs
      ctx.beginPath();
      ctx.ellipse(-12, 16, 32, 24, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = activeZone === "utricle" ? "#0284c7" : "#1e3a5f";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-6, 52, 20, 16, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = activeZone === "utricle" ? "#0369a1" : "#172554";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 10.5px system-ui, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(ctx, "Utricle", -12, 20, 52, 8.5);
      drawFittedText(ctx, "Saccule", -6, 55, 34, 8.5);

      if (bppvLooseMode) {
        const rawGravAngle = Math.PI * 0.5 - (headTiltDeg * Math.PI) / 180;
        const clampedTarget = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.82, rawGravAngle));

        if (calm) {
          looseVel = 0;
          looseAngle = clampedTarget;
        } else {
          const torque = Math.sin(rawGravAngle - looseAngle) * 0.018;
          looseVel = (looseVel + torque) * 0.93;
          looseAngle += looseVel;
          if (looseAngle < -Math.PI * 0.35) {
            looseAngle = -Math.PI * 0.35;
            looseVel = 0;
          }
          if (looseAngle > Math.PI * 0.82) {
            looseAngle = Math.PI * 0.82;
            looseVel = 0;
          }
          if (Math.abs(looseVel) > 0.00025 || Math.abs(clampedTarget - looseAngle) > 0.003) {
            stillMoving = true;
          }
        }

        for (let i = -1; i <= 1; i++) {
          const a = looseAngle + i * 0.09;
          const ox = postCx + Math.cos(a) * postRadius;
          const oy = postCy + Math.sin(a) * postRadius;
          ctx.beginPath();
          ctx.arc(ox, oy, 3.6, 0, Math.PI * 2);
          ctx.fillStyle = "#fde047";
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(318, 35);
      ctx.lineTo(318, H - 18);
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11.2px system-ui, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(ctx, en ? "INNER EAR (MACROSCOPIC)" : "TELINGA DALAM (MAKRO)", 159, 22, 294, 9);
      drawFittedText(
        ctx,
        en ? "MICROSCOPIC: OTOLITHS & HAIR CELLS" : "MIKROSKOPIK: OTOLITH & SEL RAMBUT",
        439,
        22,
        226,
        9
      );

      const shear = (headTiltDeg / 60) * 26;

      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = activeZone === "otoliths" ? "#f59e0b" : "#334155";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(344, 215, 190, 56, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px system-ui, sans-serif";
      drawFittedText(
        ctx,
        en ? "Hair Cells → Vestibular Nerve" : "Sel Rambut → Saraf Vestibular",
        439,
        248,
        176,
        9
      );

      ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.beginPath();
      ctx.roundRect(346 + shear * 0.7, 132, 186, 48, 12);
      ctx.fill();
      ctx.stroke();

      for (let h = 0; h < 5; h++) {
        const baseX = 372 + h * 34;
        for (let s = -1; s <= 1; s++) {
          const sx = baseX + s * 5;
          const heightOffset = (s + 2) * 7;
          ctx.strokeStyle = activeZone === "otoliths" ? "#fbbf24" : "#38bdf8";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(sx, 215);
          ctx.quadraticCurveTo(sx + shear * 0.35, 185, sx + shear * 0.85, 178 - heightOffset);
          ctx.stroke();
        }
      }

      const crystalCount = bppvLooseMode ? 5 : 8;
      for (let c = 0; c < crystalCount; c++) {
        const cx = 362 + c * 22 + shear * 0.78;
        const cy = 126 + (c % 2) * 5;
        ctx.fillStyle = "#fde047";
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy);
        ctx.lineTo(cx, cy - 6);
        ctx.lineTo(cx + 7, cy);
        ctx.lineTo(cx + 4, cy + 5);
        ctx.lineTo(cx - 4, cy + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      const firingPct = Math.min(
        100,
        Math.max(10, Math.round(50 + headTiltDeg * 0.75 + (bppvLooseMode ? Math.abs(looseVel) * 900 : 0)))
      );
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 11px system-ui, sans-serif";
      drawFittedText(
        ctx,
        en ? "Vestibular Nerve Firing: " + firingPct + "%" : "Isyarat Saraf Vestibular: " + firingPct + "%",
        439,
        298,
        220,
        9
      );

      ctx.fillStyle = bppvLooseMode ? "#fca5a5" : "#7dd3fc";
      drawFittedText(
        ctx,
        bppvLooseMode
          ? en
            ? "⚠️ Crystals stirring semicircular canal fluid!"
            : "⚠️ Kristal mengocak kanal separuh bulat!"
          : en
          ? "Head Tilt: " + headTiltDeg + "°"
          : "Condong Kepala: " + headTiltDeg + "°",
        159,
        298,
        294,
        9
      );

      return !calm && stillMoving;
    }

    loop = createManagedCanvasLoop(canvas, W, H, renderAnatomy);
    updateBppvBtnText();
    selectAnatomyCard("utricle-saccule");
    loop.wake(true);
  }

  // --------------------------------------------------------------------------
  // 3. SIMULATOR SARINGAN STROK HINTS (HEAD IMPULSE, NYSTAGMUS, TEST OF SKEW)
  // --------------------------------------------------------------------------
  function initHintsSimulator() {
    const canvas = document.getElementById("hintsCanvas");
    if (!canvas) return;

    const W = 560;
    const H = 265;

    let caseMode = "central";
    let activeStep = "hi";
    let impulseStart = -10;
    let hiTriggeredCalm = false;
    let gazeDir = 0;
    let coveredEye = "none";
    let coverSwitchTime = -10;
    let loop = null;

    function updateHintsExplanation() {
      const verdictEl = document.getElementById("hintsClinicalVerdict");
      const detailEl = document.getElementById("hintsStepDetail");
      if (!verdictEl || !detailEl) return;
      const en = isEn();

      if (caseMode === "central") {
        verdictEl.className = "alert-banner alert-critical";
        verdictEl.innerHTML = en
          ? "<strong>🚨 HINTS PLUS VERDICT: SUSPECT CENTRAL STROKE (POSTERIOR INFARCTION)!</strong> Any SINGLE central finding in <em>Acute Vestibular Syndrome</em> (continuous vertigo + nystagmus) mandates an immediate emergency stroke workup (~99% sensitivity vs ~80–85% for early MRI)."
          : "<strong>🚨 KEPUTUSAN HINTS PLUS: SUSPEK STROK SENTRAL (INFARKSI POSTERIOR)!</strong> Mana-mana SATU tanda sentral pada pesakit <em>Acute Vestibular Syndrome</em> (vertigo berterusan + nystagmus) mewajibkan protokol strok kecemasan segera (~99% sensitiviti berbanding MRI awal ~80–85%).";
      } else {
        verdictEl.className = "alert-banner alert-safe";
        verdictEl.innerHTML = en
          ? "<strong>✅ PERIPHERAL HINTS PLUS PATTERN (e.g., Vestibular Neuritis):</strong> All 3 ocular motor signs match an inner-ear cause — ONLY valid if <strong>hearing remains intact</strong> (no new unilateral deafness / AICA stroke), <strong>no 5D signs</strong>, and the patient <strong>can stand unassisted</strong>."
          : "<strong>✅ CORAK HINTS PLUS PERIFERI (cth: Vestibular Neuritis):</strong> Ketiga-tiga ujian selari punca telinga dalam — dengan syarat wajib: <strong>pendengaran kekal normal</strong> (tiada pekak mendadak AICA), <strong>tiada tanda 5D</strong>, dan pesakit <strong>boleh berdiri sendiri</strong>.";
      }

      const descriptionsMs = {
        hi:
          caseMode === "central"
            ? "HEAD IMPULSE (Kes Strok): Apabila kepala dipusingkan pantas, mata KEKAL TERPAKU SEMPURNA pada hidung pemeriksa tanpa tersentak (Impulse Normal). Dalam vertigo akut berterusan, ujian yang 'nampak normal' ini justru membuktikan laluan VOR telinga tidak rosak—sebaliknya strok berlaku di batang otak/serebelum!"
            : "HEAD IMPULSE (Kes Periferi): Apabila kepala dipusingkan pantas ke sisi telinga meradang, mata ikut hanyut ke tepi seketika kemudian TERSENTAK balik (corrective saccade) ke hidung pemeriksa. Ini mengesahkan kelemahan saraf vestibular telinga dalam.",
        nystagmus:
          caseMode === "central"
            ? "NYSTAGMUS (Kes Strok): Cuba gerakkan sasaran lirikan di bawah! Nystagmus BERTUKAR ARAH mengikut lirikan kiri-kanan atau bergerak MENEGAK TULEN (vertical nystagmus)—tanda klasik keabnormalan batang otak/serebelum."
            : "NYSTAGMUS (Kes Periferi): Cuba gerakkan sasaran lirikan! Sentakan pantas nystagmus KEKAL SATU ARAH yang sama walaupun pesakit melirik ke kiri atau ke kanan (mengikut Hukum Alexander).",
        skew:
          caseMode === "central"
            ? "TEST OF SKEW (Kes Strok): Klik tutup-buka mata secara berselang-seli! Sebelah mata yang baru dibuka dilihat BERGERAK MENEGAK (atas/bawah) untuk membetulkan fokus—menandakan ketidakseimbangan batang otak."
            : "TEST OF SKEW (Kes Periferi): Klik tutup-buka mata secara berselang-seli! Kedua-dua mata kekal sejajar secara menegak tanpa anjakan atas-bawah apabila penutup dialihkan."
      };

      const descriptionsEn = {
        hi:
          caseMode === "central"
            ? "HEAD IMPULSE (Stroke Case): When the head is briskly turned, the eyes STAY PERFECTLY LOCKED on the examiner's nose without a catch-up saccade (Normal Impulse). In continuous acute vertigo with nystagmus, this 'normal-looking' reflex proves the ear VOR is intact—pointing to a brainstem or cerebellar stroke!"
            : "HEAD IMPULSE (Peripheral Case): When the head is briskly turned toward the affected ear, the eyes drag briefly with the head and then SNAP BACK (corrective catch-up saccade) to the examiner's nose—confirming peripheral vestibular nerve weakness.",
        nystagmus:
          caseMode === "central"
            ? "NYSTAGMUS (Stroke Case): Click the gaze buttons below! Nystagmus CHANGES DIRECTION with left vs right gaze, or beats PURELY VERTICALLY—a classic sign of brainstem/cerebellar pathology."
            : "NYSTAGMUS (Peripheral Case): Click the gaze buttons below! The fast phase beats in ONE FIXED DIRECTION regardless of whether the patient looks left or right (obeying Alexander's Law).",
        skew:
          caseMode === "central"
            ? "TEST OF SKEW (Stroke Case): Alternate covering the left and right eye! The newly uncovered eye shifts VERTICALLY (up/down) to re-align—indicating central brainstem otolith pathway imbalance."
            : "TEST OF SKEW (Peripheral Case): Alternate covering the left and right eye! Both eyes stay vertically aligned with zero vertical refixation shift."
      };

      detailEl.textContent = (en ? descriptionsEn : descriptionsMs)[activeStep];

      const hiCtrl = document.getElementById("hintsCtrlHi");
      const nysCtrl = document.getElementById("hintsCtrlNys");
      const skewCtrl = document.getElementById("hintsCtrlSkew");
      if (hiCtrl) hiCtrl.style.display = activeStep === "hi" ? "flex" : "none";
      if (nysCtrl) nysCtrl.style.display = activeStep === "nystagmus" ? "flex" : "none";
      if (skewCtrl) skewCtrl.style.display = activeStep === "skew" ? "flex" : "none";

      if (loop) loop.wake(true);
    }

    refreshHooks.push(updateHintsExplanation);

    document.querySelectorAll("[data-hints-case]").forEach((btn) => {
      btn.addEventListener("click", () => {
        caseMode = btn.getAttribute("data-hints-case");
        document.querySelectorAll("[data-hints-case]").forEach((b) => {
          const isCurrent = b === btn;
          b.classList.toggle("active", isCurrent);
          b.setAttribute("aria-pressed", String(isCurrent));
        });
        updateHintsExplanation();
        if (window.markModuleExplored) window.markModuleExplored("hints");
      });
    });

    document.querySelectorAll("[data-hints-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeStep = btn.getAttribute("data-hints-step");
        coveredEye = "none";
        document.querySelectorAll("[data-hints-step]").forEach((b) => {
          const isCurrent = b === btn;
          b.classList.toggle("active", isCurrent);
          b.setAttribute("aria-pressed", String(isCurrent));
        });
        updateHintsExplanation();
        if (window.markModuleExplored) window.markModuleExplored("hints");
      });
    });

    const triggerHiBtn = document.getElementById("btnTriggerHeadImpulse");
    if (triggerHiBtn) {
      triggerHiBtn.addEventListener("click", () => {
        impulseStart = performance.now() / 1000;
        hiTriggeredCalm = true;
        playGentleTone(caseMode === "central" ? 330 : 520, 180);
        if (loop) loop.wake(true);
        if (window.markModuleExplored) window.markModuleExplored("hints");
      });
    }

    document.querySelectorAll("[data-gaze-dir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gazeDir = parseInt(btn.getAttribute("data-gaze-dir"), 10) || 0;
        document.querySelectorAll("[data-gaze-dir]").forEach((b) => {
          const isCurrent = b === btn;
          b.classList.toggle("active", isCurrent);
          b.setAttribute("aria-pressed", String(isCurrent));
        });
        if (loop) loop.wake(true);
      });
    });

    document.querySelectorAll("[data-skew-cover]").forEach((btn) => {
      btn.addEventListener("click", () => {
        coveredEye = btn.getAttribute("data-skew-cover");
        coverSwitchTime = performance.now() / 1000;
        document.querySelectorAll("[data-skew-cover]").forEach((b) => {
          const isCurrent = b === btn;
          b.classList.toggle("active", isCurrent);
          b.setAttribute("aria-pressed", String(isCurrent));
        });
        if (loop) loop.wake(true);
      });
    });

    function drawHintsFrame(ctx, nowMs) {
      const en = isEn();
      const calm = isCalmMode();
      const now = nowMs / 1000;

      drawClinicalMonitorBg(ctx, W, H, false);

      let headShiftX = 0;
      let leftIrisX = 0;
      let leftIrisY = 0;
      let rightIrisX = 0;
      let rightIrisY = 0;
      let caption = "";
      let showPeripheralGhostDrag = false;
      let calmVectorTag = "";
      let keepAnimating = false;

      if (activeStep === "hi") {
        if (calm) {
          // Calm Mode: skip fast 34px head-thrust and render static post-impulse eye outcome cleanly
          headShiftX = 22;
          leftIrisX = -headShiftX * 0.48;
          rightIrisX = -headShiftX * 0.48;
          if (caseMode === "central") {
            calmVectorTag = en ? "🧘 Post-Impulse: Locked Gaze (No Saccade)" : "🧘 Pasca-Impuls: Mata Terpaku (Tiada Saccade)";
            caption = en
              ? "⚠️ NORMAL IMPULSE (Static): Eyes stayed locked → CENTRAL STROKE RED FLAG!"
              : "⚠️ IMPULSE NORMAL (Statik): Mata kekal terpaku → AMARAN STROK SENTRAL!";
          } else {
            showPeripheralGhostDrag = true;
            calmVectorTag = en ? "🧘 Post-Impulse: ↶ Corrective Catch-Up Saccade" : "🧘 Pasca-Impuls: ↶ Saccade Pembetulan";
            caption = hiTriggeredCalm
              ? en
                ? "✅ CORRECTIVE SACCADE (Static): Eyes dragged then snapped back (Peripheral Sign)"
                : "✅ SACCADE PEMBETULAN (Statik): Mata hanyut lalu tersentak balik (Tanda Periferi)"
              : en
              ? "✅ STATIC POST-IMPULSE: Catch-up saccade back to nose (Peripheral Sign)"
              : "✅ HASIL PASCA-IMPULS STATIK: Saccade pembetulan ke hidung (Tanda Periferi)";
          }
        } else {
          const dt = now - impulseStart;
          if (dt >= 0 && dt < 1.35) {
            keepAnimating = true;
            if (dt < 0.18) {
              headShiftX = (dt / 0.18) * 34;
            } else if (dt < 0.85) {
              headShiftX = 34;
            } else {
              headShiftX = Math.max(0, 34 * (1 - (dt - 0.85) / 0.45));
            }

            if (caseMode === "central") {
              leftIrisX = -headShiftX * 0.48;
              rightIrisX = -headShiftX * 0.48;
              caption = en
                ? "⚠️ NORMAL IMPULSE: Eyes stay locked with no saccade → CENTRAL STROKE RED FLAG!"
                : "⚠️ IMPULSE NORMAL: Mata kekal terpaku sempurna tanpa tersentak → AMARAN STROK SENTRAL!";
            } else {
              if (dt < 0.28) {
                leftIrisX = 4;
                rightIrisX = 4;
                caption = en ? "Eyes drag briefly with head turn..." : "Mata hanyut ikut pusingan kepala...";
              } else {
                const snap = Math.min(1, (dt - 0.28) / 0.08);
                leftIrisX = 4 + (-headShiftX * 0.48 - 4) * snap;
                rightIrisX = leftIrisX;
                caption = en
                  ? "✅ CORRECTIVE SACCADE: Eyes snap back to examiner's nose (Peripheral Sign)"
                  : "✅ SACCADE PEMBETULAN: Mata tersentak balik ke hidung pemeriksa (Tanda Periferi)";
              }
            }
          } else {
            caption = en
              ? "Click 'Test Fast Head Impulse!' below to perform the Head Impulse Test"
              : "Klik butang 'Uji Pusing Kepala Pantas!' di bawah untuk melakukan Head Impulse Test";
          }
        }
      } else if (activeStep === "nystagmus") {
        const baseX = gazeDir === 2 ? 0 : gazeDir * 14;
        const baseY = gazeDir === 2 ? -10 : 0;
        const cycle = calm ? 0.5 : (now * 2.1) % 1;
        const saw = calm ? 0 : cycle < 0.8 ? (cycle / 0.8) * 10 - 5 : 5 - ((cycle - 0.8) / 0.2) * 10;
        keepAnimating = !calm;

        if (caseMode === "central") {
          if (gazeDir === 2) {
            leftIrisX = baseX;
            rightIrisX = baseX;
            leftIrisY = baseY + saw * 1.3;
            rightIrisY = leftIrisY;
            if (calm) calmVectorTag = en ? "🧘 Static Vector: ⇅ Pure Vertical Beats" : "🧘 Vektor Statik: ⇅ Menegak Tulen";
            caption = en
              ? "⚠️ PURE VERTICAL NYSTAGMUS → Central Sign!"
              : "⚠️ VERTICAL NYSTAGMUS (Menegak Tulen) → Tanda Sentral!";
          } else {
            const dirSign = gazeDir === 0 ? 1 : gazeDir;
            leftIrisX = baseX + saw * dirSign * 1.3;
            rightIrisX = leftIrisX;
            if (calm) {
              calmVectorTag =
                dirSign < 0
                  ? en
                    ? "🧘 Static Vector: ⇐ Fast Beat Flips LEFT"
                    : "🧘 Vektor Statik: ⇐ Sentakan Tukar KIRI"
                  : en
                  ? "🧘 Static Vector: Fast Beat Flips RIGHT ⇒"
                  : "🧘 Vektor Statik: Sentakan Tukar KANAN ⇒";
            }
            caption = en
              ? "⚠️ DIRECTION-CHANGING NYSTAGMUS with gaze → Central Sign!"
              : "⚠️ NYSTAGMUS BERTUKAR ARAH mengikut lirikan → Tanda Sentral!";
          }
        } else {
          const amp = gazeDir === -1 ? 1.4 : gazeDir === 1 ? 0.5 : 0.95;
          leftIrisX = baseX - saw * amp;
          rightIrisX = leftIrisX;
          leftIrisY = baseY;
          rightIrisY = baseY;
          if (calm) {
            calmVectorTag = en
              ? "🧘 Static Vector: ⇐ Fixed One-Way Fast Phase"
              : "🧘 Vektor Statik: ⇐ Sentakan Kekal Satu Arah";
          }
          caption = en
            ? "✅ UNIDIRECTIONAL NYSTAGMUS across gaze positions (Peripheral Pattern)"
            : "✅ NYSTAGMUS KEKAL SATU ARAH walaupun lirikan berubah (Corak Periferi)";
        }
      } else if (activeStep === "skew") {
        const dt = now - coverSwitchTime;
        if (!calm && dt >= 0 && dt < 0.42) keepAnimating = true;

        if (caseMode === "central") {
          if (coveredEye === "left") {
            const settle = calm ? 0.35 : Math.min(1, Math.max(0, dt / 0.35));
            rightIrisY = -10 * (1 - settle);
            leftIrisY = 9;
            if (calm) calmVectorTag = en ? "🧘 Static Skew: ↕ Vertical Shift Detected" : "🧘 Skew Statik: ↕ Anjakan Menegak";
            caption = en
              ? "⚠️ POSITIVE SKEW: Right eye shifts vertically upon uncovering → Brainstem Sign!"
              : "⚠️ SKEW POSITIF: Mata kanan bergerak menegak sebaik penutup dialih → Keabnormalan Batang Otak!";
          } else if (coveredEye === "right") {
            const settle = calm ? 0.35 : Math.min(1, Math.max(0, dt / 0.35));
            leftIrisY = 10 * (1 - settle);
            rightIrisY = -9;
            if (calm) calmVectorTag = en ? "🧘 Static Skew: ↕ Vertical Shift Detected" : "🧘 Skew Statik: ↕ Anjakan Menegak";
            caption = en
              ? "⚠️ POSITIVE SKEW: Left eye shifts vertically upon uncovering → Brainstem Sign!"
              : "⚠️ SKEW POSITIF: Mata kiri bergerak menegak sebaik penutup dialih → Keabnormalan Batang Otak!";
          } else {
            leftIrisY = 4;
            rightIrisY = -4;
            caption = en
              ? "Click Cover Left / Cover Right alternately to test Skew Deviation"
              : "Klik Tutup Kiri / Tutup Kanan berselang-seli untuk menguji Skew Deviation";
          }
        } else {
          caption = en
            ? "✅ NO SKEW: Both eyes remain vertically aligned on alternate cover testing"
            : "✅ TIADA SKEW: Kedua-dua mata kekal sejajar secara menegak apabila ditutup-buka";
        }
      }

      // Header bar label
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11.2px system-ui, sans-serif";
      ctx.textAlign = "center";
      if (activeStep === "hi") {
        ctx.fillStyle = "#fde047";
        drawFittedText(
          ctx,
          en ? "▼ Examiner Nose Target (Centerline)" : "▼ Sasaran Hidung Pemeriksa (Garis Tengah)",
          W / 2,
          22,
          W - 40,
          9
        );
      } else {
        drawFittedText(
          ctx,
          en ? "HINTS PLUS OCULOMOTOR EXAMINATION MONITOR" : "MONITOR PEMERIKSAAN MATA HINTS PLUS",
          W / 2,
          22,
          W - 40,
          9
        );
      }

      const hcx = W / 2 + headShiftX;
      const hcy = 122;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(hcx, hcy, 156, 72, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = caseMode === "central" ? "rgba(248,113,113,0.6)" : "rgba(52,211,153,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      [-74, 74].forEach((dx, idx) => {
        const ex = hcx + dx;
        const ey = hcy - 2;
        const ix = idx === 0 ? leftIrisX : rightIrisX;
        const iy = idx === 0 ? leftIrisY : rightIrisY;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ex - 46, ey);
        ctx.quadraticCurveTo(ex, ey - 30, ex + 46, ey);
        ctx.quadraticCurveTo(ex, ey + 30, ex - 46, ey);
        ctx.closePath();
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.clip();

        // In Calm Mode peripheral HI, show faint dashed dragged position + crisp snapped-back iris
        if (showPeripheralGhostDrag) {
          ctx.beginPath();
          ctx.arc(ex + 9, ey, 16, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
          ctx.lineWidth = 1.6;
          ctx.setLineDash([3, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.arc(ex + ix, ey + iy, 17, 0, Math.PI * 2);
        ctx.fillStyle = "#0284c7";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ex + ix, ey + iy, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = "#020617";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ex + ix - 5, ey + iy - 5, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();

        if (
          activeStep === "skew" &&
          ((idx === 0 && coveredEye === "left") || (idx === 1 && coveredEye === "right"))
        ) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ex, ey, 43, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#94a3b8";
          ctx.font = "600 10px system-ui, sans-serif";
          ctx.textAlign = "center";
          drawFittedText(ctx, en ? "COVERED" : "DITUTUP", ex, ey + 4, 72, 8.5);
        }
      });
      ctx.restore();

      if (activeStep === "hi") {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.72)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(W / 2, 35);
        ctx.lineTo(W / 2, 204);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (calm && calmVectorTag) {
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.strokeStyle = caseMode === "central" ? "#f87171" : "#34d399";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(W / 2 - 126, 38, 252, 20, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = caseMode === "central" ? "#fca5a5" : "#6ee7b7";
        ctx.font = "600 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        drawFittedText(ctx, calmVectorTag, W / 2, 52, 236, 8.5);
        ctx.restore();
      }

      ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(18, 212, W - 36, 38, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f1f5f9";
      ctx.font = "600 11.6px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(ctx, caption, W / 2, 235, W - 56, 9.5);

      return keepAnimating;
    }

    loop = createManagedCanvasLoop(canvas, W, H, drawHintsFrame);
    updateHintsExplanation();
    loop.wake(true);
  }

  // --------------------------------------------------------------------------
  // 4. MULTI-MANEUVER BPPV SUITE (EPLEY | BBQ ROLL | GUFONI + TIMER MACHINE)
  // --------------------------------------------------------------------------
  const FALLBACK_HORIZONTAL_STEPS = {
    bbq: {
      left: [
        {
          step: 1,
          title: "Lie Supine & Turn Head 90° Left (Affected Ear)",
          timerSec: 45,
          headAngle: -90,
          bodyState: "supine-flat",
          canalProgress: 0.15,
          instruction: "Lie flat on your back with a pillow under your head and turn your head 90° toward your LEFT (affected) ear.",
          mechanism: "Positions loose crystals at the starting segment of the left horizontal semicircular canal.",
          holdHint: "Hold 30–60s until spinning stops"
        },
        {
          step: 2,
          title: "Roll Head to Center (Nose Straight Up)",
          timerSec: 45,
          headAngle: 0,
          bodyState: "supine-flat",
          canalProgress: 0.38,
          instruction: "Rotate your head 90° back to center so your nose points straight up toward the ceiling.",
          mechanism: "Gravity guides crystals away from the lateral ampulla along the smooth posterior arm.",
          holdHint: "Hold 30–60s"
        },
        {
          step: 3,
          title: "Turn Head 90° Right (Unaffected Ear Down)",
          timerSec: 45,
          headAngle: 90,
          bodyState: "supine-flat",
          canalProgress: 0.62,
          instruction: "Rotate your head 90° to the RIGHT (unaffected side). Roll onto your right side if your neck is stiff.",
          mechanism: "Crystals advance past the midpoint of the horizontal canal toward the utricular exit.",
          holdHint: "Hold 30–60s"
        },
        {
          step: 4,
          title: "Roll Prone onto Elbows (Nose Straight Down)",
          timerSec: 45,
          headAngle: 180,
          bodyState: "prone-elbows",
          canalProgress: 0.86,
          instruction: "Roll your body face-down onto your elbows/forearms so your nose points straight DOWN toward the mattress.",
          mechanism: "Crystals reach the horizontal canal exit opening directly into the utricle.",
          holdHint: "Hold 30–60s"
        },
        {
          step: 5,
          title: "Complete Roll & Sit Up Slowly (Rest 10–15m)",
          timerSec: 60,
          headAngle: 0,
          bodyState: "sitting-recovery",
          canalProgress: 1.0,
          instruction: "Turn onto your left shoulder while rising smoothly to sit upright at the edge of the bed. Rest 10–15 minutes.",
          mechanism: "Crystals settle back inside the utricle (safe zone), completing the 360° Lempert BBQ Roll.",
          holdHint: "Rest upright 10–15 minutes"
        }
      ],
      right: [
        {
          step: 1,
          title: "Lie Supine & Turn Head 90° Right (Affected Ear)",
          timerSec: 45,
          headAngle: 90,
          bodyState: "supine-flat",
          canalProgress: 0.15,
          instruction: "Lie flat on your back with a pillow under your head and turn your head 90° toward your RIGHT (affected) ear.",
          mechanism: "Positions loose crystals at the starting segment of the right horizontal semicircular canal.",
          holdHint: "Hold 30–60s until spinning stops"
        },
        {
          step: 2,
          title: "Roll Head to Center (Nose Straight Up)",
          timerSec: 45,
          headAngle: 0,
          bodyState: "supine-flat",
          canalProgress: 0.38,
          instruction: "Rotate your head 90° back to center so your nose points straight up toward the ceiling.",
          mechanism: "Gravity guides crystals away from the lateral ampulla along the smooth posterior arm.",
          holdHint: "Hold 30–60s"
        },
        {
          step: 3,
          title: "Turn Head 90° Left (Unaffected Ear Down)",
          timerSec: 45,
          headAngle: -90,
          bodyState: "supine-flat",
          canalProgress: 0.62,
          instruction: "Rotate your head 90° to the LEFT (unaffected side). Roll onto your left side if your neck is stiff.",
          mechanism: "Crystals advance past the midpoint of the horizontal canal toward the utricular exit.",
          holdHint: "Hold 30–60s"
        },
        {
          step: 4,
          title: "Roll Prone onto Elbows (Nose Straight Down)",
          timerSec: 45,
          headAngle: -180,
          bodyState: "prone-elbows",
          canalProgress: 0.86,
          instruction: "Roll your body face-down onto your elbows/forearms so your nose points straight DOWN toward the mattress.",
          mechanism: "Crystals reach the horizontal canal exit opening directly into the utricle.",
          holdHint: "Hold 30–60s"
        },
        {
          step: 5,
          title: "Complete Roll & Sit Up Slowly (Rest 10–15m)",
          timerSec: 60,
          headAngle: 0,
          bodyState: "sitting-recovery",
          canalProgress: 1.0,
          instruction: "Turn onto your right shoulder while rising smoothly to sit upright at the edge of the bed. Rest 10–15 minutes.",
          mechanism: "Crystals settle back inside the utricle (safe zone), completing the 360° Lempert BBQ Roll.",
          holdHint: "Rest upright 10–15 minutes"
        }
      ]
    },
    gufoni: {
      left: [
        {
          step: 1,
          title: "Sit Upright Facing Straight Ahead",
          timerSec: 15,
          headAngle: 0,
          bodyState: "sitting",
          canalProgress: 0.12,
          instruction: "Sit upright on the edge of the bed facing straight ahead with space to lie onto your RIGHT (unaffected) side.",
          mechanism: "Neutral starting posture for Geotropic Left Horizontal Canal BPPV.",
          holdHint: "Prepare for brisk side-lying"
        },
        {
          step: 2,
          title: "Lie Briskly onto RIGHT (Unaffected) Side",
          timerSec: 90,
          headAngle: 90,
          bodyState: "side-lying",
          canalProgress: 0.5,
          instruction: "Lie down briskly onto your RIGHT (unaffected) side keeping your head straight in line with your body for 60–120 seconds.",
          mechanism: "Sudden deceleration and gravity sweep crystals away from the left lateral ampulla toward the canal exit.",
          holdHint: "Hold 60–120s"
        },
        {
          step: 3,
          title: "Turn Nose 45° DOWN Toward Mattress",
          timerSec: 120,
          headAngle: 135,
          bodyState: "side-lying",
          canalProgress: 0.86,
          instruction: "Quickly turn your head 45° downward so your nose faces into the mattress. Hold still for 120 seconds (2 minutes).",
          mechanism: "Empties remaining crystals out of the horizontal canal arm directly into the utricle.",
          holdHint: "Hold 120s (2 minutes)"
        },
        {
          step: 4,
          title: "Sit Back Up Keeping Head Turned & Rest 10m",
          timerSec: 60,
          headAngle: 0,
          bodyState: "sitting-recovery",
          canalProgress: 1.0,
          instruction: "Sit back up smoothly while keeping your head turned toward your right shoulder, then face forward and rest 10 minutes.",
          mechanism: "Crystals remain safely settled inside the utricle.",
          holdHint: "Rest upright 10 minutes"
        }
      ],
      right: [
        {
          step: 1,
          title: "Sit Upright Facing Straight Ahead",
          timerSec: 15,
          headAngle: 0,
          bodyState: "sitting",
          canalProgress: 0.12,
          instruction: "Sit upright on the edge of the bed facing straight ahead with space to lie onto your LEFT (unaffected) side.",
          mechanism: "Neutral starting posture for Geotropic Right Horizontal Canal BPPV.",
          holdHint: "Prepare for brisk side-lying"
        },
        {
          step: 2,
          title: "Lie Briskly onto LEFT (Unaffected) Side",
          timerSec: 90,
          headAngle: -90,
          bodyState: "side-lying",
          canalProgress: 0.5,
          instruction: "Lie down briskly onto your LEFT (unaffected) side keeping your head straight in line with your body for 60–120 seconds.",
          mechanism: "Sudden deceleration and gravity sweep crystals away from the right lateral ampulla toward the canal exit.",
          holdHint: "Hold 60–120s"
        },
        {
          step: 3,
          title: "Turn Nose 45° DOWN Toward Mattress",
          timerSec: 120,
          headAngle: -135,
          bodyState: "side-lying",
          canalProgress: 0.86,
          instruction: "Quickly turn your head 45° downward so your nose faces into the mattress. Hold still for 120 seconds (2 minutes).",
          mechanism: "Empties remaining crystals out of the horizontal canal arm directly into the utricle.",
          holdHint: "Hold 120s (2 minutes)"
        },
        {
          step: 4,
          title: "Sit Back Up Keeping Head Turned & Rest 10m",
          timerSec: 60,
          headAngle: 0,
          bodyState: "sitting-recovery",
          canalProgress: 1.0,
          instruction: "Sit back up smoothly while keeping your head turned toward your left shoulder, then face forward and rest 10 minutes.",
          mechanism: "Crystals remain safely settled inside the utricle.",
          holdHint: "Rest upright 10 minutes"
        }
      ]
    }
  };

  function initEpleySimulator() {
    const canvas = document.getElementById("epleyCanvas");
    if (!canvas) return;

    const W = 600;
    const H = 310;

    let maneuverType = "epley"; // "epley" | "bbq" | "gufoni"
    let affectedEar = "left"; // "left" | "right"
    let currentStepIdx = 0;
    let animProgress = 0.1;
    let animHeadAngle = -45;
    let timerRemaining = 15;
    let timerState = "idle"; // "idle" | "running" | "completed"
    let timerInterval = null;
    let loop = null;

    const prevBtn = document.getElementById("epleyPrevBtn");
    const nextBtn = document.getElementById("epleyNextBtn");
    const timerBtn = document.getElementById("epleyTimerToggleBtn");

    function getSteps() {
      const data = window.VERTIGO_DATA || {};
      const ear = affectedEar === "right" ? "right" : "left";
      if (maneuverType === "bbq") {
        return (data.bbqSteps && data.bbqSteps[ear]) || FALLBACK_HORIZONTAL_STEPS.bbq[ear];
      }
      if (maneuverType === "gufoni") {
        return (data.gufoniSteps && data.gufoniSteps[ear]) || FALLBACK_HORIZONTAL_STEPS.gufoni[ear];
      }
      return (data.epleySteps && data.epleySteps[ear]) || [];
    }

    function getManeuverDisplayName(en) {
      if (maneuverType === "bbq") {
        return en ? "Lempert BBQ Roll (Horizontal Canal)" : "BBQ Roll 360° (Kanal Mendatar)";
      }
      if (maneuverType === "gufoni") {
        return en ? "Gufoni Maneuver (Horizontal Canal)" : "Manuver Gufoni (Kanal Mendatar)";
      }
      return en ? "Epley Maneuver (Posterior Canal)" : "Manuver Epley (Kanal Posterior)";
    }

    function getManeuverShortCompleteText(en) {
      if (maneuverType === "bbq") {
        return en ? "🎉 BBQ Roll Complete! (Click to Restart)" : "🎉 Manuver BBQ Roll Lengkap! (Klik Ulang)";
      }
      if (maneuverType === "gufoni") {
        return en ? "🎉 Gufoni Maneuver Complete! (Click to Restart)" : "🎉 Manuver Gufoni Lengkap! (Klik Ulang)";
      }
      return en ? "🎉 Epley Maneuver Complete! (Click to Restart)" : "🎉 Manuver Epley Lengkap! (Klik Ulang)";
    }

    function clearTimerHandle() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    function updateTimerButtonLabel() {
      if (!timerBtn) return;
      const en = isEn();
      const steps = getSteps();
      const currentStep = steps[currentStepIdx];

      if (timerState === "running") {
        timerBtn.textContent = en ? "⏸️ Pause Step Timer" : "⏸️ Jeda Pemasa";
      } else if (timerState === "completed") {
        if (currentStepIdx < steps.length - 1) {
          timerBtn.textContent = en ? "✅ Done! Click Next Step →" : "✅ Selesai! Klik Langkah Seterusnya →";
        } else {
          timerBtn.textContent = getManeuverShortCompleteText(en);
        }
      } else {
        const isPausedMidway = currentStep && timerRemaining > 0 && timerRemaining < currentStep.timerSec;
        if (isPausedMidway) {
          timerBtn.textContent = en ? "▶️ Resume Step Timer" : "▶️ Sambung Pemasa";
        } else {
          timerBtn.textContent = en ? "⏱️ Start Timer for This Step" : "⏱️ Mulakan Pemasa Langkah Ini";
        }
      }
    }

    function pauseTimerToIdle() {
      clearTimerHandle();
      timerState = "idle";
      updateTimerButtonLabel();
    }

    function updateTimerUI() {
      const timerDisplay = document.getElementById("epleyTimerDisplay");
      if (timerDisplay) {
        const mins = Math.floor(timerRemaining / 60);
        const secs = timerRemaining % 60;
        timerDisplay.textContent = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
      }
    }

    function syncControlButtons() {
      const steps = getSteps();
      const en = isEn();

      document.querySelectorAll("[data-bppv-maneuver]").forEach((btn) => {
        const isCurrent = btn.getAttribute("data-bppv-maneuver") === maneuverType;
        btn.classList.toggle("active", isCurrent);
        btn.setAttribute("aria-pressed", String(isCurrent));
      });

      document.querySelectorAll("[data-epley-ear]").forEach((btn) => {
        const isCurrent = btn.getAttribute("data-epley-ear") === affectedEar;
        btn.classList.toggle("active", isCurrent);
        btn.setAttribute("aria-pressed", String(isCurrent));
      });

      document.querySelectorAll("[data-epley-step]").forEach((btn) => {
        const bIdx = parseInt(btn.getAttribute("data-epley-step"), 10);
        const withinRange = bIdx >= 0 && bIdx < steps.length;
        btn.hidden = !withinRange;
        btn.style.display = withinRange ? "" : "none";
        if (withinRange) {
          const isCurrent = bIdx === currentStepIdx;
          btn.classList.toggle("active", isCurrent);
          btn.classList.toggle("completed", bIdx < currentStepIdx);
          btn.setAttribute("aria-pressed", String(isCurrent));
          btn.textContent = en ? "Step " + (bIdx + 1) : "Langkah " + (bIdx + 1);
        }
      });

      if (prevBtn) {
        prevBtn.disabled = currentStepIdx <= 0;
      }
      if (nextBtn) {
        nextBtn.disabled = currentStepIdx >= steps.length - 1;
      }
    }

    function renderStepTexts() {
      const steps = getSteps();
      if (!steps.length) return;
      const s = steps[currentStepIdx];
      const en = isEn();

      const titleEl = document.getElementById("epleyStepTitle");
      const instrEl = document.getElementById("epleyStepInstruction");
      const mechEl = document.getElementById("epleyStepMechanism");
      const holdHintEl = document.getElementById("epleyHoldHint");
      const badgeEl = document.getElementById("epleyEarBadge");

      if (titleEl) {
        titleEl.textContent = en
          ? "Step " + s.step + "/" + steps.length + ": " + s.title
          : "Langkah " + s.step + "/" + steps.length + ": " + s.title;
      }
      if (instrEl) instrEl.textContent = s.instruction;
      if (mechEl) mechEl.textContent = s.mechanism;
      if (holdHintEl) {
        const fallbackHint = en
          ? "Recommended hold: " + s.timerSec + "s"
          : "Cadangan kekal posisi: " + s.timerSec + "s";
        holdHintEl.textContent = s.holdHint || fallbackHint;
      }
      if (badgeEl) {
        badgeEl.style.color = "";
        badgeEl.style.borderColor = "";
        badgeEl.className = "pill-badge pill-info";
        const earText = en
          ? affectedEar === "left"
            ? "Left Ear Affected"
            : "Right Ear Affected"
          : affectedEar === "left"
          ? "Telinga Kiri Terjejas"
          : "Telinga Kanan Terjejas";
        badgeEl.textContent = getManeuverDisplayName(en) + " • " + earText;
      }

      syncControlButtons();
    }

    function applyStep(idx, silent) {
      clearTimerHandle();
      timerState = "idle";
      const steps = getSteps();
      if (!steps.length) return;
      currentStepIdx = Math.max(0, Math.min(steps.length - 1, idx));
      const s = steps[currentStepIdx];
      timerRemaining = s.timerSec;
      updateTimerUI();
      renderStepTexts();
      updateTimerButtonLabel();

      if (isCalmMode()) {
        animProgress = s.canalProgress;
        animHeadAngle = s.headAngle;
      }

      if (loop) loop.wake(true);

      if (!silent) {
        playGentleTone(440 + currentStepIdx * 55, 160);
        if (window.markModuleExplored) window.markModuleExplored("epley");
      }
    }

    refreshHooks.push(() => {
      renderStepTexts();
      updateTimerButtonLabel();
      if (loop) loop.wake(true);
    });

    // Event delegation on section container supports both static and dynamically rendered buttons
    const epleySection = canvas.closest("section") || document;
    epleySection.addEventListener("click", (e) => {
      const maneuverBtn = e.target.closest("[data-bppv-maneuver]");
      if (maneuverBtn) {
        const nextManeuver = maneuverBtn.getAttribute("data-bppv-maneuver");
        if (nextManeuver === "epley" || nextManeuver === "bbq" || nextManeuver === "gufoni") {
          maneuverType = nextManeuver;
          applyStep(0, false);
        }
        return;
      }

      const earBtn = e.target.closest("[data-epley-ear]");
      if (earBtn) {
        const nextEar = earBtn.getAttribute("data-epley-ear");
        if (nextEar === "left" || nextEar === "right") {
          affectedEar = nextEar;
          applyStep(0, false);
        }
        return;
      }

      const stepBtn = e.target.closest("[data-epley-step]");
      if (stepBtn && !stepBtn.hidden) {
        applyStep(parseInt(stepBtn.getAttribute("data-epley-step"), 10), false);
      }
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentStepIdx > 0) applyStep(currentStepIdx - 1, false);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const steps = getSteps();
        if (currentStepIdx < steps.length - 1) applyStep(currentStepIdx + 1, false);
      });
    }

    if (timerBtn) {
      timerBtn.addEventListener("click", () => {
        if (timerState === "running") {
          pauseTimerToIdle();
          return;
        }
        const steps = getSteps();
        const currentStep = steps[currentStepIdx];
        if (!currentStep) return;

        // Fix deadlock: if completed or at 0, reset to current step's full duration and start fresh
        if (timerState === "completed" || timerRemaining <= 0) {
          timerRemaining = currentStep.timerSec;
          updateTimerUI();
        }

        timerState = "running";
        updateTimerButtonLabel();
        if (window.markModuleExplored) window.markModuleExplored("epley");

        clearTimerHandle();
        timerInterval = setInterval(() => {
          if (timerRemaining > 0) {
            timerRemaining--;
            updateTimerUI();
            if (timerRemaining <= 0) {
              clearTimerHandle();
              timerState = "completed";
              playGentleTone(784, 380);
              updateTimerButtonLabel();
            }
          }
        }, 1000);
      });
    }

    // Exposed API for Side-Finder in app.js
    window.setBppvManeuverSelection = function (type, ear) {
      if (type === "epley" || type === "bbq" || type === "gufoni") {
        maneuverType = type;
      }
      if (ear === "left" || ear === "right") {
        affectedEar = ear;
      }
      syncControlButtons();
      applyStep(0, true);
      if (window.markModuleExplored) {
        window.markModuleExplored("sidefinder");
        window.markModuleExplored("epley");
      }
      const scrollTarget = document.getElementById("epleyCanvas") || canvas;
      if (scrollTarget && typeof scrollTarget.scrollIntoView === "function") {
        scrollTarget.scrollIntoView({
          behavior: isCalmMode() ? "auto" : "smooth",
          block: "center"
        });
      }
    };

    function drawPosteriorCanalDiagram(ctx, en) {
      const cx = 152;
      const cy = 160;
      const r = 74;

      // Canal type pill
      ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 104, 42, 208, 20, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(
        ctx,
        en ? "Posterior Vertical Canal (85–90% BPPV)" : "Kanal Posterior Menegak (85–90% BPPV)",
        cx,
        56,
        194,
        8.5
      );

      // Utricle Safe Zone
      ctx.beginPath();
      ctx.ellipse(cx - 52, cy - 28, 33, 40, -0.25, 0, Math.PI * 2);
      ctx.fillStyle = animProgress > 0.94 ? "rgba(16, 185, 129, 0.28)" : "#1e3a5f";
      ctx.fill();
      ctx.strokeStyle = animProgress > 0.94 ? "#10b981" : "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 10.8px system-ui, sans-serif";
      drawFittedText(ctx, "UTRICLE", cx - 52, cy - 30, 58, 8.5);
      ctx.font = "500 9.5px system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      drawFittedText(ctx, en ? "(Safe Zone)" : "(Zon Selamat)", cx - 52, cy - 16, 62, 8);

      const startAng = Math.PI * 0.65;
      const endAng = -Math.PI * 0.72;

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 22;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx + 12, cy + 8, r, -Math.PI * 0.72, Math.PI * 0.68);
      ctx.stroke();

      ctx.strokeStyle = "#0b1120";
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.arc(cx + 12, cy + 8, r, -Math.PI * 0.72, Math.PI * 0.68);
      ctx.stroke();

      const ampX = cx + 12 + Math.cos(Math.PI * 0.68) * r;
      const ampY = cy + 8 + Math.sin(Math.PI * 0.68) * r;
      ctx.beginPath();
      ctx.arc(ampX, ampY, 13, 0, Math.PI * 2);
      ctx.fillStyle = "#7f1d1d";
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fecaca";
      ctx.font = "600 9.5px system-ui, sans-serif";
      drawFittedText(ctx, "Ampulla", ampX - 24, ampY + 23, 56, 8);

      let ox, oy;
      if (animProgress <= 0.88) {
        const norm = animProgress / 0.88;
        const ang = startAng + (endAng - startAng) * norm;
        ox = cx + 12 + Math.cos(ang) * r;
        oy = cy + 8 + Math.sin(ang) * r;
      } else {
        const uNorm = (animProgress - 0.88) / 0.12;
        const exitX = cx + 12 + Math.cos(endAng) * r;
        const exitY = cy + 8 + Math.sin(endAng) * r;
        ox = exitX + (cx - 52 - exitX) * uNorm;
        oy = exitY + (cy - 8 - exitY) * uNorm;
      }

      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.arc(ox + k * 4.5, oy + (k % 2) * 3.5, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = animProgress > 0.94 ? "#34d399" : "#fde047";
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function drawHorizontalCanalDiagram(ctx, en) {
      const cx = 152;
      const cy = 166;
      const rx = 78;
      const ry = 48;

      // Canal type pill
      ctx.fillStyle = "rgba(245, 158, 11, 0.14)";
      ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 116, 42, 232, 20, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fde047";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      const subTag =
        maneuverType === "gufoni"
          ? en
            ? "Horizontal Canal • Gufoni Sidelying"
            : "Kanal Mendatar • Gufoni Mengiring"
          : en
          ? "Horizontal Canal • 360° BBQ Roll"
          : "Kanal Mendatar • 360° BBQ Roll";
      drawFittedText(ctx, subTag, cx, 56, 218, 8.5);

      // Utricle Safe Zone on left of horizontal ring
      const utricleX = cx - 72;
      const utricleY = cy + 4;
      ctx.beginPath();
      ctx.ellipse(utricleX, utricleY, 34, 38, 0.1, 0, Math.PI * 2);
      ctx.fillStyle = animProgress > 0.94 ? "rgba(16, 185, 129, 0.28)" : "#1e3a5f";
      ctx.fill();
      ctx.strokeStyle = animProgress > 0.94 ? "#10b981" : "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 10.5px system-ui, sans-serif";
      drawFittedText(ctx, "UTRICLE", utricleX, utricleY - 4, 58, 8.5);
      ctx.font = "500 9.2px system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      drawFittedText(ctx, en ? "(Safe Zone)" : "(Zon Selamat)", utricleX, utricleY + 10, 62, 8);

      // Horizontal (lateral) semicircular canal elliptical loop
      const loopCx = cx + 22;
      const loopCy = cy + 4;
      const arcStart = -Math.PI * 0.78;
      const arcEnd = Math.PI * 0.78;

      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 21;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.ellipse(loopCx, loopCy, rx, ry, 0, arcStart, arcEnd);
      ctx.stroke();

      ctx.strokeStyle = "#0b1120";
      ctx.lineWidth = 12.5;
      ctx.beginPath();
      ctx.ellipse(loopCx, loopCy, rx, ry, 0, arcStart, arcEnd);
      ctx.stroke();

      // Lateral Ampulla at anterior/upper limb (arcStart)
      const ampX = loopCx + Math.cos(arcStart) * rx;
      const ampY = loopCy + Math.sin(arcStart) * ry;
      ctx.beginPath();
      ctx.arc(ampX, ampY, 12.5, 0, Math.PI * 2);
      ctx.fillStyle = "#7f1d1d";
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fecaca";
      ctx.font = "600 9.2px system-ui, sans-serif";
      drawFittedText(ctx, "Ampulla", ampX + 6, ampY - 17, 56, 8);

      // Ampullofugal directional flow hint arrow along posterior smooth arm
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.ellipse(loopCx, loopCy, rx + 15, ry + 13, 0, -Math.PI * 0.3, Math.PI * 0.55);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crystal path: migrates away from ampulla around lateral circumference into utricle
      const crystalStart = -Math.PI * 0.52;
      const crystalExit = Math.PI * 0.78;
      let ox, oy;
      if (animProgress <= 0.88) {
        const norm = animProgress / 0.88;
        const ang = crystalStart + (crystalExit - crystalStart) * norm;
        ox = loopCx + Math.cos(ang) * rx;
        oy = loopCy + Math.sin(ang) * ry;
      } else {
        const uNorm = (animProgress - 0.88) / 0.12;
        const exitX = loopCx + Math.cos(crystalExit) * rx;
        const exitY = loopCy + Math.sin(crystalExit) * ry;
        ox = exitX + (utricleX + 6 - exitX) * uNorm;
        oy = exitY + (utricleY + 6 - exitY) * uNorm;
      }

      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.arc(ox + k * 4.5, oy + (k % 2) * 3.5, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = animProgress > 0.94 ? "#34d399" : "#fde047";
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function drawBedAndPatientPosture(ctx, targetStep, en) {
      const bx = 342;
      const by = 216;
      const bedW = 224;
      const bodyState = targetStep.bodyState || "sitting";

      // Bed mattress
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bedW, 20, 6);
      ctx.fill();
      ctx.stroke();

      let postureCaption = "";

      if (bodyState === "sitting") {
        if (maneuverType === "epley") {
          // Pillow positioned behind shoulders
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.ellipse(bx + 70, by - 5, 20, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          postureCaption = en
            ? "Sit upright • Pillow placed behind shoulders"
            : "Duduk tegak • Bantal sedia untuk bawah bahu";
        } else if (maneuverType === "bbq") {
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.ellipse(bx + 36, by - 5, 20, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          postureCaption = en
            ? "Sit upright • Pillow at head of bed"
            : "Duduk tegak • Bantal di bahagian kepala";
        } else {
          postureCaption = en
            ? "Sit upright at bed edge facing straight"
            : "Duduk tegak di tepi katil pandang depan";
        }

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(bx + 124, by - 4);
        ctx.lineTo(bx + 186, by - 4);
        ctx.moveTo(bx + 124, by - 4);
        ctx.lineTo(bx + 124, by - 50);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx + 124, by - 63, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
      } else if (bodyState === "sitting-recovery") {
        // Sitting at edge of bed with legs hanging down over side + emerald calm halo
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(bx + 128, by - 4);
        ctx.lineTo(bx + 156, by - 4);
        ctx.lineTo(bx + 156, by + 22);
        ctx.moveTo(bx + 128, by - 4);
        ctx.lineTo(bx + 128, by - 50);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx + 128, by - 63, 15, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bx + 128, by - 63, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#34d399";
        ctx.fill();

        postureCaption = en
          ? "Sit upright at bed edge • Rest 10–15 mins"
          : "Duduk di tepi katil • Rehat tenang 10–15 min";
      } else if (bodyState === "supine-flat" || bodyState === "supine") {
        // BBQ Roll: Pillow under HEAD (0-20° flexion, torso flat on mattress)
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.ellipse(bx + 36, by - 6, 22, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(bx + 196, by - 5);
        ctx.lineTo(bx + 68, by - 5);
        ctx.lineTo(bx + 44, by - 12);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx + 35, by - 17, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();

        postureCaption = en
          ? "Supine flat • Head on pillow (0–20° flexion)"
          : "Telentang rata • Kepala atas bantal (fleksi 0–20°)";
      } else if (bodyState === "prone-elbows" || bodyState === "prone") {
        // BBQ Step 4: Prone propped on elbows, nose pointing straight DOWN toward mattress
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(bx + 196, by - 5);
        ctx.lineTo(bx + 128, by - 7);
        ctx.lineTo(bx + 68, by - 23);
        ctx.stroke();

        // Forearm & elbow prop on mattress
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(bx + 70, by - 22);
        ctx.lineTo(bx + 64, by - 3);
        ctx.lineTo(bx + 44, by - 3);
        ctx.stroke();

        // Head facing straight down
        ctx.beginPath();
        ctx.arc(bx + 46, by - 21, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();

        // Downward nose cone toward mattress
        ctx.beginPath();
        ctx.moveTo(bx + 41, by - 10);
        ctx.lineTo(bx + 46, by - 2);
        ctx.lineTo(bx + 51, by - 10);
        ctx.closePath();
        ctx.fillStyle = "#fde047";
        ctx.fill();

        postureCaption = en
          ? "Prone on elbows • Face & nose pointing down"
          : "Menengkup atas siku • Hidung menghala tilam";
      } else if (bodyState === "side-lying" || bodyState === "lateral") {
        // Side-lying posture (Epley Step 4 & Gufoni Steps 2–3)
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.ellipse(bx + 38, by - 5, 20, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bent knees + lateral torso silhouette
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(bx + 194, by - 6);
        ctx.lineTo(bx + 154, by - 15);
        ctx.lineTo(bx + 122, by - 9);
        ctx.stroke();

        // Side-lying shoulder/ribcage capsule
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.roundRect(bx + 60, by - 19, 64, 14, 7);
        ctx.fill();

        // Head in side-lying
        const noseDown45 =
          Math.abs(targetStep.headAngle) >= 110 || (maneuverType === "gufoni" && currentStepIdx >= 2);
        ctx.beginPath();
        ctx.arc(bx + 40, by - 15, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();

        if (noseDown45) {
          // 45° downward nose pointer toward mattress
          ctx.beginPath();
          ctx.moveTo(bx + 31, by - 8);
          ctx.lineTo(bx + 25, by - 1);
          ctx.lineTo(bx + 36, by - 4);
          ctx.closePath();
          ctx.fillStyle = "#fde047";
          ctx.fill();
        }

        if (maneuverType === "gufoni") {
          postureCaption = noseDown45
            ? en
              ? "Side-lying • Nose turned 45° DOWN to mattress"
              : "Mengiring • Hidung pusing 45° KE BAWAH tilam"
            : en
            ? "Brisk side-lying on UNAFFECTED side"
            : "Mengiring pantas ke SISI TELINGA SIHAT";
        } else {
          postureCaption = en
            ? "Side-lying posture • Nose angled 45° down"
            : "Badan mengiring • Hidung serong 45° ke tilam";
        }
      } else {
        // Default: "supine-extended" (Epley Steps 2–3: pillow under shoulders, neck extended 20–30°)
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.ellipse(bx + 70, by - 6, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(bx + 196, by - 6);
        ctx.lineTo(bx + 70, by - 13);
        ctx.lineTo(bx + 36, by + 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx + 26, by + 6, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();

        postureCaption = en
          ? "Pillow under shoulders • Neck extended 20–30°"
          : "Bantal bawah bahu • Leher mendongak 20–30°";
      }

      ctx.fillStyle = "#7dd3fc";
      ctx.font = "600 10.2px system-ui, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(ctx, postureCaption, bx + bedW / 2, by + 40, 266, 8.5);
    }

    function renderEpley(ctx) {
      const steps = getSteps();
      if (!steps.length) return false;
      const en = isEn();
      const calm = isCalmMode();
      const targetStep = steps[currentStepIdx];

      let stillAnimating = false;
      if (calm) {
        animProgress = targetStep.canalProgress;
        animHeadAngle = targetStep.headAngle;
      } else {
        const dProg = targetStep.canalProgress - animProgress;
        const dAng = targetStep.headAngle - animHeadAngle;
        if (Math.abs(dProg) > 0.0015 || Math.abs(dAng) > 0.08) {
          animProgress += dProg * 0.09;
          animHeadAngle += dAng * 0.11;
          stillAnimating = true;
        } else {
          animProgress = targetStep.canalProgress;
          animHeadAngle = targetStep.headAngle;
        }
      }

      drawClinicalMonitorBg(ctx, W, H, false);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      const leftHeader =
        maneuverType === "epley"
          ? en
            ? "POSTERIOR CANAL — CRYSTAL PATH"
            : "KANAL POSTERIOR — LALUAN KRISTAL"
          : en
          ? "HORIZONTAL (LATERAL) CANAL — PATH"
          : "KANAL MENDATAR (LATERAL) — KRISTAL";

      drawFittedText(ctx, leftHeader, 154, 22, 288, 9);
      drawFittedText(
        ctx,
        en ? "HEAD COMPASS & BED POSTURE" : "KOMPAS KEPALA & POSISI DI KATIL",
        454,
        22,
        272,
        9
      );

      // Left half: Canal & crystal repositioning path
      if (maneuverType === "epley") {
        drawPosteriorCanalDiagram(ctx, en);
      } else {
        drawHorizontalCanalDiagram(ctx, en);
      }

      ctx.fillStyle = animProgress > 0.94 ? "#34d399" : "#fde047";
      ctx.font = "600 11.2px system-ui, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(
        ctx,
        animProgress > 0.94
          ? en
            ? "✅ Crystals Safely Returned to Utricle!"
            : "✅ Kristal Selamat Kembali ke Utricle!"
          : en
          ? "Crystal Repositioning Progress: " + Math.round(animProgress * 100) + "%"
          : "Kemajuan Reposisi Kristal: " + Math.round(animProgress * 100) + "%",
        154,
        290,
        286,
        9
      );

      // Center divider
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(308, 35);
      ctx.lineTo(308, H - 16);
      ctx.stroke();

      // Right half top: Top-Down Nose Rotation Compass
      const compX = 454;
      const compY = 78;
      const compR = 32;

      ctx.beginPath();
      ctx.arc(compX, compY, compR, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Cardinal compass ticks (0°, ±90°, 180°)
      ctx.fillStyle = "#64748b";
      ctx.font = "600 8.5px system-ui, sans-serif";
      ctx.fillText("0°", compX, compY - compR - 4);
      ctx.fillText("L", compX - compR - 7, compY + 3);
      ctx.fillText("R", compX + compR + 7, compY + 3);

      ctx.save();
      ctx.translate(compX, compY);
      ctx.rotate((animHeadAngle * Math.PI) / 180);

      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 21, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#334155";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      const earSide = affectedEar === "left" ? -18 : 18;
      ctx.beginPath();
      ctx.arc(earSide, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();

      // Nose pointer
      ctx.beginPath();
      ctx.moveTo(-5.5, -19);
      ctx.lineTo(0, -30);
      ctx.lineTo(5.5, -19);
      ctx.closePath();
      ctx.fillStyle = "#fde047";
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 10.8px system-ui, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(
        ctx,
        en
          ? "Nose Rotation Angle: " + Math.round(animHeadAngle) + "°"
          : "Sudut Putaran Hidung: " + Math.round(animHeadAngle) + "°",
        compX,
        compY + 46,
        266,
        9
      );

      // Right half bottom: Bed & patient posture
      drawBedAndPatientPosture(ctx, targetStep, en);

      ctx.fillStyle = "#fca5a5";
      ctx.font = "500 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      drawFittedText(
        ctx,
        en
          ? "● Red Dot = Affected Ear   ▲ Yellow = Nose"
          : "● Titik Merah = Telinga Terjejas   ▲ Kuning = Hidung",
        454,
        290,
        270,
        8.5
      );

      return stillAnimating;
    }

    loop = createManagedCanvasLoop(canvas, W, H, renderEpley);
    applyStep(0, true);
    loop.wake(true);
  }

  // --------------------------------------------------------------------------
  // 5. GRAF PERANGKAP UBAT (≤72 JAM) & JURULATIH VRT GAZE STABILIZATION
  // --------------------------------------------------------------------------
  function initRecoveryAndVrt() {
    const chartCanvas = document.getElementById("compensationCanvas");
    let chartLoop = null;

    if (chartCanvas) {
      const W = 520;
      const H = 230;
      let mode = "compare";

      function drawChart(ctx) {
        const en = isEn();
        drawClinicalMonitorBg(ctx, W, H, false);

        const padL = 52;
        const padR = 22;
        const padT = 40;
        const padB = 36;
        const gw = W - padL - padR;
        const gh = H - padT - padB;

        // Monitor header
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "600 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        drawFittedText(
          ctx,
          en
            ? "CENTRAL VESTIBULAR COMPENSATION TRAJECTORY"
            : "TRAJEKTORI PAMPASAN KESEIMBANGAN OTAK (CENTRAL COMPENSATION)",
          W / 2,
          22,
          W - 32,
          9
        );

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padL, padT);
        ctx.lineTo(padL, H - padB);
        ctx.lineTo(W - padR, H - padB);
        ctx.stroke();

        const x72 = padL + gw * 0.14;
        ctx.fillStyle = "rgba(245, 158, 11, 0.14)";
        ctx.fillRect(padL, padT, x72 - padL, gh);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x72, padT);
        ctx.lineTo(x72, H - padB);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#fbbf24";
        ctx.font = "600 9.8px system-ui, sans-serif";
        ctx.textAlign = "left";
        drawFittedText(
          ctx,
          en ? "≤72h Acute Med Limit" : "Had ≤72j Ubat Akut",
          x72 + 5,
          padT + 11,
          128,
          8.5
        );

        if (mode === "optimal" || mode === "compare") {
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 50; i++) {
            const p = i / 50;
            const val = 1 - Math.exp(-4.2 * p);
            const x = padL + p * gw;
            const y = H - padB - val * (gh - 12);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        if (mode === "trap" || mode === "compare") {
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 50; i++) {
            const p = i / 50;
            const val = 0.34 * (1 - Math.exp(-2.1 * p));
            const x = padL + p * gw;
            const y = H - padB - val * (gh - 12);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        ctx.fillStyle = "#94a3b8";
        ctx.font = "500 10.5px system-ui, sans-serif";
        ctx.textAlign = "center";
        drawFittedText(ctx, en ? "Day 1" : "Hari 1", padL + 16, H - 13, 60, 8.5);
        drawFittedText(ctx, en ? "Week 1" : "Minggu 1", padL + gw * 0.33, H - 13, 80, 8.5);
        drawFittedText(ctx, en ? "Week 2" : "Minggu 2", padL + gw * 0.66, H - 13, 80, 8.5);
        drawFittedText(ctx, en ? "Week 4+" : "Minggu 4+", W - padR - 22, H - 13, 80, 8.5);

        ctx.save();
        ctx.translate(16, padT + gh / 2);
        ctx.rotate(-Math.PI / 2);
        drawFittedText(ctx, en ? "Brain Compensation (%)" : "Pampasan Otak (%)", 0, 0, gh + 10, 8.5);
        ctx.restore();

        const legendMaxW = W - padR - (x72 + 138);
        ctx.textAlign = "right";
        ctx.fillStyle = "#34d399";
        ctx.font = "600 10.5px system-ui, sans-serif";
        drawFittedText(
          ctx,
          en
            ? "● Stop Pills ≤72h + VRT Exercises (~95% Recovery)"
            : "● Henti Pil ≤72j + Latihan VRT (Pulih ~95%)",
          W - padR,
          padT + 12,
          Math.max(220, legendMaxW),
          8.5
        );
        ctx.fillStyle = "#f87171";
        drawFittedText(
          ctx,
          en
            ? "● Daily Suppressants for Months (Uncompensated)"
            : "● Makan Pil Tahan Pening Berbulan-bulan (Otak Malas)",
          W - padR,
          padT + 29,
          Math.max(220, legendMaxW),
          8.5
        );

        return false; // Static chart — single crisp frame per state change
      }

      chartLoop = createManagedCanvasLoop(chartCanvas, W, H, drawChart);

      document.querySelectorAll("[data-comp-mode]").forEach((btn) => {
        btn.addEventListener("click", () => {
          mode = btn.getAttribute("data-comp-mode");
          document.querySelectorAll("[data-comp-mode]").forEach((b) => {
            const isCurrent = b === btn;
            b.classList.toggle("active", isCurrent);
            b.setAttribute("aria-pressed", String(isCurrent));
          });
          if (chartLoop) chartLoop.wake(true);
          if (window.markModuleExplored) window.markModuleExplored("rehab");
        });
      });

      chartLoop.wake(true);
    }

    // VRT Gaze Stabilization Trainer State Machine ("idle" | "running" | "completed")
    const vrtToggleBtn = document.getElementById("vrtStartBtn");
    const vrtSpeedSlider = document.getElementById("vrtBpmSlider");
    const vrtBpmLabel = document.getElementById("vrtBpmVal");
    const vrtHeadGuide = document.getElementById("vrtHeadArrow");
    const vrtTimerEl = document.getElementById("vrtSessionTimer");

    let vrtState = "idle"; // "idle" | "running" | "completed"
    let vrtBpm = 80;
    let vrtTimerSec = 30;
    let vrtBeatInterval = null;
    let vrtCountdown = null;
    let beatSide = 1;

    function getBeatTurnPrompt(en, side) {
      if (en) {
        return side > 0
          ? "⬅️ Turn Head Slightly LEFT (Keep Eyes on X!)"
          : "Turn Head Slightly RIGHT (Keep Eyes on X!) ➡️";
      }
      return side > 0
        ? "⬅️ Pusing Kepala Sedikit ke KIRI (Mata Kekal pada X!)"
        : "Pusing Kepala Sedikit ke KANAN (Mata Kekal pada X!) ➡️";
    }

    function updateVrtLabels() {
      const en = isEn();
      if (vrtBpmLabel) vrtBpmLabel.textContent = vrtBpm + (en ? " beats/min" : " rentak/min");

      if (vrtState === "running") {
        if (vrtToggleBtn) {
          vrtToggleBtn.textContent = en ? "⏹️ Stop Practice" : "⏹️ Berhenti Latihan";
          vrtToggleBtn.setAttribute("aria-pressed", "true");
        }
        if (vrtHeadGuide) {
          vrtHeadGuide.textContent = getBeatTurnPrompt(en, beatSide);
        }
      } else if (vrtState === "completed") {
        if (vrtToggleBtn) {
          vrtToggleBtn.textContent = en
            ? "▶️ Start Gaze Stabilization Practice (30s)"
            : "▶️ Mulakan Latihan Gaze Stabilization (30s)";
          vrtToggleBtn.setAttribute("aria-pressed", "false");
        }
        if (vrtHeadGuide) {
          vrtHeadGuide.textContent = en
            ? "✅ 30-second session complete! Rest briefly before repeating."
            : "✅ Sesi 30 saat selesai! Rehat sebentar sebelum ulang.";
        }
      } else {
        if (vrtToggleBtn) {
          vrtToggleBtn.textContent = en
            ? "▶️ Start Gaze Stabilization Practice (30s)"
            : "▶️ Mulakan Latihan Gaze Stabilization (30s)";
          vrtToggleBtn.setAttribute("aria-pressed", "false");
        }
        if (vrtHeadGuide) {
          vrtHeadGuide.textContent = en
            ? "Keep eyes locked on 'X' & get ready for small left-right head turns"
            : "Renung huruf 'X' & sedia gerakkan kepala kecil kiri-kanan";
        }
      }
    }

    function clearVrtTimers() {
      if (vrtBeatInterval) clearInterval(vrtBeatInterval);
      if (vrtCountdown) clearInterval(vrtCountdown);
      vrtBeatInterval = null;
      vrtCountdown = null;
    }

    function stopVrt(nextState) {
      clearVrtTimers();
      vrtState = nextState || "idle";
      if (vrtState === "idle" && vrtTimerEl) {
        vrtTimerSec = 30;
        vrtTimerEl.textContent = "30s";
      }
      updateVrtLabels();
    }

    function startBeatLoop() {
      if (vrtBeatInterval) clearInterval(vrtBeatInterval);
      const ms = Math.round(60000 / vrtBpm);
      vrtBeatInterval = setInterval(() => {
        beatSide *= -1;
        playGentleTone(beatSide > 0 ? 660 : 528, 70);
        if (vrtHeadGuide && vrtState === "running") {
          vrtHeadGuide.textContent = getBeatTurnPrompt(isEn(), beatSide);
        }
      }, ms);
    }

    if (vrtSpeedSlider) {
      vrtSpeedSlider.addEventListener("input", () => {
        vrtBpm = parseInt(vrtSpeedSlider.value, 10) || 80;
        if (vrtBpmLabel) vrtBpmLabel.textContent = vrtBpm + (isEn() ? " beats/min" : " rentak/min");
        if (vrtState === "running") startBeatLoop();
      });
    }

    if (vrtToggleBtn) {
      vrtToggleBtn.addEventListener("click", () => {
        if (vrtState === "running") {
          stopVrt("idle");
        } else {
          clearVrtTimers();
          vrtState = "running";
          vrtTimerSec = 30;
          beatSide = 1;
          if (vrtTimerEl) vrtTimerEl.textContent = "30s";
          updateVrtLabels();
          playGentleTone(660, 70);
          startBeatLoop();
          if (window.markModuleExplored) window.markModuleExplored("rehab");

          vrtCountdown = setInterval(() => {
            vrtTimerSec--;
            if (vrtTimerEl) vrtTimerEl.textContent = Math.max(0, vrtTimerSec) + "s";
            if (vrtTimerSec <= 0) {
              playGentleTone(880, 320);
              stopVrt("completed");
            }
          }, 1000);
        }
      });
    }

    refreshHooks.push(() => {
      if (chartLoop) chartLoop.wake(true);
      updateVrtLabels();
    });

    updateVrtLabels();
  }

  // --------------------------------------------------------------------------
  // GLOBAL HOOKS FOR APP CONTROLLER
  // --------------------------------------------------------------------------
  window.refreshSimulatorsLang = function () {
    refreshHooks.forEach((fn) => {
      try {
        fn();
      } catch (_) {}
    });
    wakeAllCanvases();
  };

  window.initAllSimulators = function () {
    initSensorySimulator();
    initAnatomySimulator();
    initHintsSimulator();
    initEpleySimulator();
    initRecoveryAndVrt();
  };
})();
