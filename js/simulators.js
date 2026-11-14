// ============================================================================
// VertigoLab — Enjin Simulasi Visual, Fizik Otolith & Pemeriksaan Klinikal
// ============================================================================

(function () {
  "use strict";

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
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function playGentleTone(freq, durationMs) {
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
      osc.type = "sine";
      osc.frequency.value = freq || 587.33;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (durationMs || 220) / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (durationMs || 220) / 1000);
    } catch (_) {
      // Ignore audio errors if blocked by browser policy
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
    const ctx = setupHiDPICanvas(canvas, W, H);

    let currentPresetKey = "acuteVertigo";
    let startTime = performance.now();

    function setPreset(key) {
      if (!window.VERTIGO_DATA.sensorPresets[key]) return;
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
        nauseaEl.textContent = "Refleks Loya: " + preset.nausea;
        nauseaEl.className =
          "pill-badge " +
          (preset.conflictLevel >= 80 ? "pill-danger" : preset.conflictLevel >= 20 ? "pill-warn" : "pill-ok");
      }
      if (summaryEl) summaryEl.textContent = preset.summary;

      document.querySelectorAll("[data-sensor-preset]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-sensor-preset") === key);
      });
    }

    document.querySelectorAll("[data-sensor-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setPreset(btn.getAttribute("data-sensor-preset"));
        if (window.markModuleExplored) window.markModuleExplored("sensory");
      });
    });

    function drawEye(cx, cy, offsetX, offsetY, dimVision) {
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

      // Sclera subtle shadow
      const scleraGrad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 58);
      scleraGrad.addColorStop(0, "rgba(255,255,255,0)");
      scleraGrad.addColorStop(1, "rgba(148,163,184,0.35)");
      ctx.fillStyle = scleraGrad;
      ctx.fillRect(cx - 60, cy - 40, 120, 80);

      // Iris
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

      // Pupil
      ctx.beginPath();
      ctx.arc(ix, iy, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#020617";
      ctx.fill();

      // Corneal light reflex
      ctx.beginPath();
      ctx.arc(ix - 6, iy - 6, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();

      if (dimVision > 0) {
        ctx.fillStyle = `rgba(2, 6, 23, ${dimVision})`;
        ctx.fillRect(cx - 60, cy - 40, 120, 80);
      }
      ctx.restore();
    }

    function render(now) {
      const t = (now - startTime) / 1000;
      const preset = window.VERTIGO_DATA.sensorPresets[currentPresetKey];

      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Compute eye nystagmus offset
      let ox = 0;
      let oy = 0;
      let dimVision = 0;
      let statusLabel = "Bebola Mata Stabil (Tiada Nystagmus)";
      let statusColor = "#34d399";

      if (preset.nystagmus === "horizontal-jerk") {
        // Sawtooth wave: slow drift left, fast saccade snap right!
        const cycle = (t * 1.9) % 1;
        if (cycle < 0.82) {
          ox = 14 - (cycle / 0.82) * 28; // Slow phase
        } else {
          ox = -14 + ((cycle - 0.82) / 0.18) * 28; // Fast phase (saccade)
        }
        statusLabel = "Nystagmus Mendatar Satu Arah (Fasa Perlahan + Sentakan Pantas)";
        statusColor = "#fbbf24";
      } else if (preset.nystagmus === "vertical-bidirectional") {
        // Vertical + direction-changing central nystagmus
        const subMode = Math.floor(t / 2.5) % 2;
        if (subMode === 0) {
          const cycle = (t * 2.2) % 1;
          oy = cycle < 0.8 ? -11 + (cycle / 0.8) * 22 : 11 - ((cycle - 0.8) / 0.2) * 22;
          statusLabel = "AMARAN SENTRAL: Vertical Nystagmus (Menegak Tulen)";
        } else {
          ox = Math.sin(t * 6.5) * 15;
          statusLabel = "AMARAN SENTRAL: Nystagmus Bertukar Arah";
        }
        statusColor = "#f87171";
      } else if (preset.nystagmus === "physiologic") {
        ox = Math.sin(t * 2.5) * 12;
        statusLabel = "Refleks VOR Fisiologi (Menstabilkan Fokus Semasa Pusing)";
        statusColor = "#38bdf8";
      } else if (currentPresetKey === "presyncope") {
        dimVision = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.2));
        statusLabel = "Tiada Nystagmus — Pandangan Gelap Sementara (Bukan Vertigo!)";
        statusColor = "#a78bfa";
      }

      // Header label inside canvas
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 12px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SIMULASI MASA NYATA BEBOLA MATA PESAKIT (PEMERHATIAN KLINIKAL)", W / 2, 26);

      // Draw pair of eyes
      drawEye(W / 2 - 92, 102, ox, oy, dimVision);
      drawEye(W / 2 + 92, 102, ox, oy, dimVision);

      // Draw Nose Bridge hint
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 8, 95);
      ctx.quadraticCurveTo(W / 2, 130, W / 2 - 12, 148);
      ctx.stroke();

      // Status Pill
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(40, 166, W - 80, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = statusColor;
      ctx.font = "600 12.5px system-ui, -apple-system, sans-serif";
      ctx.fillText(statusLabel, W / 2, 186);

      // Bottom 3-sensor telemetry bars
      const nodes = [
        { label: "Vestibular (Telinga)", x: 105, alert: preset.conflictLevel >= 80 },
        { label: "Batang Otak (Pusat)", x: W / 2, alert: preset.conflictLevel >= 80, hub: true },
        { label: "Visual & Propriosepsi", x: W - 105, alert: currentPresetKey === "centralStroke" }
      ];

      // Connecting pulse lines
      ctx.strokeStyle = preset.conflictLevel >= 80 ? "rgba(248, 113, 113, 0.55)" : "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, 236);
      ctx.lineTo(nodes[1].x, 236);
      ctx.lineTo(nodes[2].x, 236);
      ctx.stroke();

      // Animated pulse dots
      const pulsePos = (t * (preset.conflictLevel >= 80 ? 2.4 : 0.9)) % 1;
      const p1x = nodes[0].x + (nodes[1].x - nodes[0].x) * pulsePos;
      const p2x = nodes[2].x - (nodes[2].x - nodes[1].x) * ((t * 0.9) % 1);

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
        ctx.roundRect(n.x - 72, 220, 144, 34, 8);
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
        ctx.font = "600 11.5px system-ui, -apple-system, sans-serif";
        ctx.fillText(n.label, n.x, 241);
      });

      requestAnimationFrame(render);
    }

    setPreset("acuteVertigo");
    requestAnimationFrame(render);
  }

  // --------------------------------------------------------------------------
  // 2. SIMULATOR ANATOMI TELINGA DALAM & FIZIK OTOLITH / STEREOCILIA
  // --------------------------------------------------------------------------
  function initAnatomySimulator() {
    const canvas = document.getElementById("anatomyCanvas");
    if (!canvas) return;

    const W = 560;
    const H = 330;
    const ctx = setupHiDPICanvas(canvas, W, H);

    let activeZone = "utricle";
    let headTiltDeg = 0;
    let bppvLooseMode = false;
    let looseAngle = 0.35;
    let looseVel = 0;

    const tiltSlider = document.getElementById("headTiltSlider");
    const tiltValLabel = document.getElementById("headTiltVal");
    const bppvToggleBtn = document.getElementById("toggleBppvCrystalBtn");

    if (tiltSlider) {
      tiltSlider.addEventListener("input", () => {
        headTiltDeg = parseFloat(tiltSlider.value);
        if (tiltValLabel) tiltValLabel.textContent = (headTiltDeg > 0 ? "+" : "") + headTiltDeg + "°";
        if (window.markModuleExplored) window.markModuleExplored("anatomy");
      });
    }

    if (bppvToggleBtn) {
      bppvToggleBtn.addEventListener("click", () => {
        bppvLooseMode = !bppvLooseMode;
        bppvToggleBtn.classList.toggle("btn-danger-active", bppvLooseMode);
        bppvToggleBtn.textContent = bppvLooseMode
          ? "⚠️ Mod BPPV Aktif: Kristal Tersesat! (Klik Pulihkan)"
          : "🔬 Simulasikan Kristal Tanggal (BPPV)";
        if (bppvLooseMode) {
          activeZone = "bppv";
          selectAnatomyCard("bppv-trigger");
        }
        if (window.markModuleExplored) window.markModuleExplored("anatomy");
      });
    }

    function selectAnatomyCard(partId) {
      const part = window.VERTIGO_DATA.anatomyParts.find((p) => p.id === partId);
      if (!part) return;
      activeZone = part.highlightZone;
      if (part.id === "bppv-trigger" && !bppvLooseMode && bppvToggleBtn) {
        bppvLooseMode = true;
        bppvToggleBtn.classList.add("btn-danger-active");
        bppvToggleBtn.textContent = "⚠️ Mod BPPV Aktif: Kristal Tersesat! (Klik Pulihkan)";
      }

      document.querySelectorAll("[data-anatomy-id]").forEach((el) => {
        el.classList.toggle("active", el.getAttribute("data-anatomy-id") === partId);
      });

      const titleEl = document.getElementById("anatomyDetailTitle");
      const badgeEl = document.getElementById("anatomyDetailBadge");
      const textEl = document.getElementById("anatomyDetailText");
      const isLayman = document.body.classList.contains("mode-layman");

      if (titleEl) titleEl.textContent = part.title;
      if (badgeEl) {
        badgeEl.textContent = part.badge;
        badgeEl.style.borderColor = part.color;
        badgeEl.style.color = part.color;
      }
      if (textEl) {
        textEl.textContent = isLayman ? part.layman : part.clinical;
        textEl.setAttribute("data-part-id", partId);
      }
    }

    window.refreshAnatomyAudienceText = function () {
      const textEl = document.getElementById("anatomyDetailText");
      if (!textEl) return;
      const partId = textEl.getAttribute("data-part-id") || "utricle-saccule";
      selectAnatomyCard(partId);
    };

    document.querySelectorAll("[data-anatomy-id]").forEach((el) => {
      el.addEventListener("click", () => {
        selectAnatomyCard(el.getAttribute("data-anatomy-id"));
        if (window.markModuleExplored) window.markModuleExplored("anatomy");
      });
    });

    function animate() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);

      // Left Panel: Vestibular Labyrinth (Canals + Utricle/Saccule)
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

      // Posterior Canal (Main BPPV target)
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

      // Inner fluid channel of Posterior Canal
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
      ctx.fillText("Utricle", -12, 20);
      ctx.fillText("Saccule", -6, 55);

      // Loose BPPV Otolith Crystal Physics inside Posterior Canal
      if (bppvLooseMode) {
        const gravAngle = Math.PI * 0.5 - (headTiltDeg * Math.PI) / 180;
        const torque = Math.sin(gravAngle - looseAngle) * 0.018;
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

      // Divider
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(318, 24);
      ctx.lineTo(318, H - 24);
      ctx.stroke();

      // Right Panel: Microscopic Zoom of Otolithic Membrane & Hair Cells (Stereocilia)
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 11.5px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TELINGA DALAM (MAKRO)", 160, 24);
      ctx.fillText("MIKROSKOPIK: OTOLITH & HAIR CELLS", 438, 24);

      const shear = (headTiltDeg / 60) * 26;

      // Base Sensory Epithelium
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = activeZone === "otoliths" ? "#f59e0b" : "#334155";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(344, 215, 190, 56, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillText("Hair Cells → Vestibular Nerve", 439, 250);

      // Gel layer (Otolithic Membrane)
      ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.beginPath();
      ctx.roundRect(346 + shear * 0.7, 132, 186, 48, 12);
      ctx.fill();
      ctx.stroke();

      // Stereocilia (Bending hairs!)
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

      // Calcium carbonate Otolith crystals on top of membrane
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

      // Firing Rate Indicator
      const firingPct = Math.min(100, Math.max(10, Math.round(50 + headTiltDeg * 0.75 + (bppvLooseMode ? Math.abs(looseVel) * 900 : 0))));
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 11px system-ui, sans-serif";
      ctx.fillText(`Isyarat Saraf Vestibular: ${firingPct}%`, 439, 296);

      ctx.fillStyle = bppvLooseMode ? "#fca5a5" : "#7dd3fc";
      ctx.fillText(
        bppvLooseMode ? "⚠️ Kristal mengocak kanal separuh bulat!" : `Condong Kepala: ${headTiltDeg}°`,
        160,
        296
      );

      requestAnimationFrame(animate);
    }

    selectAnatomyCard("utricle-saccule");
    requestAnimationFrame(animate);
  }

  // --------------------------------------------------------------------------
  // 3. SIMULATOR SARINGAN STROK HINTS (HEAD IMPULSE, NYSTAGMUS, TEST OF SKEW)
  // --------------------------------------------------------------------------
  function initHintsSimulator() {
    const canvas = document.getElementById("hintsCanvas");
    if (!canvas) return;

    const W = 560;
    const H = 265;
    const ctx = setupHiDPICanvas(canvas, W, H);

    let caseMode = "central"; // 'peripheral' | 'central'
    let activeStep = "hi"; // 'hi' | 'nystagmus' | 'skew'
    let impulseStart = -10;
    let gazeDir = 0; // -1 left, 0 center, +1 right, 2 up
    let coveredEye = "none"; // 'none' | 'left' | 'right'
    let coverSwitchTime = -10;

    function updateHintsExplanation() {
      const verdictEl = document.getElementById("hintsClinicalVerdict");
      const detailEl = document.getElementById("hintsStepDetail");
      if (!verdictEl || !detailEl) return;

      if (caseMode === "central") {
        verdictEl.className = "alert-banner alert-critical";
        verdictEl.innerHTML =
          "<strong>🚨 KEPUTUSAN HINTS: SUSPEK STROK SENTRAL (INFARKSI POSTERIOR)!</strong> Rujuk Jabatan Kecemasan segera. Ingat: HINTS lebih sensitif daripada MRI dalam 24 jam pertama!";
      } else {
        verdictEl.className = "alert-banner alert-safe";
        verdictEl.innerHTML =
          "<strong>✅ CORAK HINTS PERIFERI (cth: Vestibular Neuritis):</strong> Ketiga-tiga komponen konsisten dengan punca telinga dalam (pastikan TIADA tanda 5D & pesakit boleh berdiri).";
      }

      const descriptions = {
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

      detailEl.textContent = descriptions[activeStep];

      // Toggle sub-controls visibility
      const hiCtrl = document.getElementById("hintsCtrlHi");
      const nysCtrl = document.getElementById("hintsCtrlNys");
      const skewCtrl = document.getElementById("hintsCtrlSkew");
      if (hiCtrl) hiCtrl.style.display = activeStep === "hi" ? "flex" : "none";
      if (nysCtrl) nysCtrl.style.display = activeStep === "nystagmus" ? "flex" : "none";
      if (skewCtrl) skewCtrl.style.display = activeStep === "skew" ? "flex" : "none";
    }

    document.querySelectorAll("[data-hints-case]").forEach((btn) => {
      btn.addEventListener("click", () => {
        caseMode = btn.getAttribute("data-hints-case");
        document.querySelectorAll("[data-hints-case]").forEach((b) => b.classList.toggle("active", b === btn));
        updateHintsExplanation();
        if (window.markModuleExplored) window.markModuleExplored("hints");
      });
    });

    document.querySelectorAll("[data-hints-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeStep = btn.getAttribute("data-hints-step");
        coveredEye = "none";
        document.querySelectorAll("[data-hints-step]").forEach((b) => b.classList.toggle("active", b === btn));
        updateHintsExplanation();
        if (window.markModuleExplored) window.markModuleExplored("hints");
      });
    });

    const triggerHiBtn = document.getElementById("btnTriggerHeadImpulse");
    if (triggerHiBtn) {
      triggerHiBtn.addEventListener("click", () => {
        impulseStart = performance.now() / 1000;
        playGentleTone(caseMode === "central" ? 330 : 520, 180);
        if (window.markModuleExplored) window.markModuleExplored("hints");
      });
    }

    document.querySelectorAll("[data-gaze-dir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        gazeDir = parseInt(btn.getAttribute("data-gaze-dir"), 10);
        document.querySelectorAll("[data-gaze-dir]").forEach((b) => b.classList.toggle("active", b === btn));
      });
    });

    document.querySelectorAll("[data-skew-cover]").forEach((btn) => {
      btn.addEventListener("click", () => {
        coveredEye = btn.getAttribute("data-skew-cover");
        coverSwitchTime = performance.now() / 1000;
        document.querySelectorAll("[data-skew-cover]").forEach((b) => b.classList.toggle("active", b === btn));
      });
    });

    function drawHintsFrame(nowMs) {
      const now = nowMs / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);

      let headShiftX = 0;
      let leftIrisX = 0;
      let leftIrisY = 0;
      let rightIrisX = 0;
      let rightIrisY = 0;
      let caption = "";

      if (activeStep === "hi") {
        const dt = now - impulseStart;
        if (dt >= 0 && dt < 1.3) {
          // Fast thrust between 0..0.18s, hold until 0.85s, return smoothly
          if (dt < 0.18) {
            headShiftX = (dt / 0.18) * 34;
          } else if (dt < 0.85) {
            headShiftX = 34;
          } else {
            headShiftX = 34 * (1 - (dt - 0.85) / 0.45);
          }

          if (caseMode === "central") {
            // Eyes remain counter-rotated perfectly locked onto center target!
            leftIrisX = -headShiftX * 0.48;
            rightIrisX = -headShiftX * 0.48;
            caption = "⚠️ IMPULSE NORMAL: Mata kekal terpaku sempurna tanpa tersentak → AMARAN STROK SENTRAL!";
          } else {
            // Peripheral: eyes drag WITH head first, then snap back (corrective catch-up saccade at dt=0.28s)
            if (dt < 0.28) {
              leftIrisX = 4;
              rightIrisX = 4;
              caption = "Mata hanyut ikut pusingan kepala...";
            } else {
              const snap = Math.min(1, (dt - 0.28) / 0.08);
              leftIrisX = 4 + (-headShiftX * 0.48 - 4) * snap;
              rightIrisX = leftIrisX;
              caption = "✅ SACCADE PEMBETULAN: Mata tersentak balik ke hidung pemeriksa (Tanda Periferi)";
            }
          }
        } else {
          caption = "Klik butang 'Pusing Kepala Pantas' di bawah untuk melakukan Head Impulse Test";
        }
      } else if (activeStep === "nystagmus") {
        const baseX = gazeDir === 2 ? 0 : gazeDir * 14;
        const baseY = gazeDir === 2 ? -10 : 0;
        const cycle = (now * 2.1) % 1;
        const saw = cycle < 0.8 ? (cycle / 0.8) * 10 - 5 : 5 - ((cycle - 0.8) / 0.2) * 10;

        if (caseMode === "central") {
          if (gazeDir === 2) {
            leftIrisX = baseX;
            rightIrisX = baseX;
            leftIrisY = baseY + saw * 1.3;
            rightIrisY = leftIrisY;
            caption = "⚠️ VERTICAL NYSTAGMUS (Menegak Tulen) → Tanda Sentral!";
          } else {
            const dirSign = gazeDir === 0 ? 1 : gazeDir;
            leftIrisX = baseX + saw * dirSign * 1.3;
            rightIrisX = leftIrisX;
            caption = "⚠️ NYSTAGMUS BERTUKAR ARAH mengikut lirikan → Tanda Sentral!";
          }
        } else {
          // Peripheral always beats same direction (e.g., fast phase left)
          const amp = gazeDir === -1 ? 1.4 : gazeDir === 1 ? 0.5 : 0.95;
          leftIrisX = baseX - saw * amp;
          rightIrisX = leftIrisX;
          leftIrisY = baseY;
          rightIrisY = baseY;
          caption = "✅ NYSTAGMUS KEKAL SATU ARAH walaupun lirikan berubah (Corak Periferi)";
        }
      } else if (activeStep === "skew") {
        const dt = now - coverSwitchTime;
        if (caseMode === "central") {
          // Uncovered eye makes vertical corrective shift!
          if (coveredEye === "left") {
            // Right eye was just uncovered -> drops from +9 to 0
            const settle = Math.min(1, Math.max(0, dt / 0.35));
            rightIrisY = -10 * (1 - settle);
            leftIrisY = 9; // drifted under cover
            caption = "⚠️ SKEW POSITIF: Mata kanan bergerak menegak sebaik penutup dialih → Keabnormalan Batang Otak!";
          } else if (coveredEye === "right") {
            const settle = Math.min(1, Math.max(0, dt / 0.35));
            leftIrisY = 10 * (1 - settle);
            rightIrisY = -9;
            caption = "⚠️ SKEW POSITIF: Mata kiri bergerak menegak sebaik penutup dialih → Keabnormalan Batang Otak!";
          } else {
            leftIrisY = 4;
            rightIrisY = -4;
            caption = "Klik Tutup Kiri / Tutup Kanan berselang-seli untuk menguji Skew Deviation";
          }
        } else {
          caption = "✅ TIADA SKEW: Kedua-dua mata kekal sejajar secara menegak apabila ditutup-buka";
        }
      }

      // Draw Patient Head Outline
      const hcx = W / 2 + headShiftX;
      const hcy = 112;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(hcx, hcy, 158, 78, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = caseMode === "central" ? "rgba(248,113,113,0.55)" : "rgba(52,211,153,0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Both Eyes inside Head
      [-74, 74].forEach((dx, idx) => {
        const ex = hcx + dx;
        const ey = hcy - 4;
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

        // Occluder Paddle if covered in Test of Skew
        if (
          activeStep === "skew" &&
          ((idx === 0 && coveredEye === "left") || (idx === 1 && coveredEye === "right"))
        ) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.93)";
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ex, ey, 44, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#94a3b8";
          ctx.font = "600 10px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("DITUTUP", ex, ey + 4);
        }
      });
      ctx.restore();

      // Examiner Nose Fixation Crosshair (Fixed in room center for HI)
      if (activeStep === "hi") {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.75)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(W / 2, 20);
        ctx.lineTo(W / 2, 195);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#fde047";
        ctx.font = "600 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Sasaran Hidung Pemeriksa", W / 2, 18);
      }

      // Caption bar
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(22, 212, W - 44, 38, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f1f5f9";
      ctx.font = "600 12px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(caption, W / 2, 235);

      requestAnimationFrame(drawHintsFrame);
    }

    updateHintsExplanation();
    requestAnimationFrame(drawHintsFrame);
  }

  // --------------------------------------------------------------------------
  // 4. SIMULATOR FIZIKAL DIX-HALLPIKE & EPLEY MANEUVER (5 LANGKAH + PEMASA)
  // --------------------------------------------------------------------------
  function initEpleySimulator() {
    const canvas = document.getElementById("epleyCanvas");
    if (!canvas) return;

    const W = 600;
    const H = 310;
    const ctx = setupHiDPICanvas(canvas, W, H);

    let affectedEar = "left"; // 'left' | 'right'
    let currentStepIdx = 0; // 0..4
    let animProgress = 0.1;
    let animHeadAngle = -45;
    let timerRemaining = 15;
    let timerInterval = null;

    function getSteps() {
      return window.VERTIGO_DATA.epleySteps[affectedEar];
    }

    function stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      const startBtn = document.getElementById("epleyTimerToggleBtn");
      if (startBtn) startBtn.textContent = "⏱️ Mulakan Pemasa Langkah Ini";
    }

    function updateTimerUI() {
      const timerDisplay = document.getElementById("epleyTimerDisplay");
      if (timerDisplay) {
        const mins = Math.floor(timerRemaining / 60);
        const secs = timerRemaining % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }
    }

    function applyStep(idx) {
      stopTimer();
      const steps = getSteps();
      currentStepIdx = Math.max(0, Math.min(steps.length - 1, idx));
      const s = steps[currentStepIdx];
      timerRemaining = s.timerSec;
      updateTimerUI();

      const titleEl = document.getElementById("epleyStepTitle");
      const instrEl = document.getElementById("epleyStepInstruction");
      const mechEl = document.getElementById("epleyStepMechanism");
      const badgeEl = document.getElementById("epleyEarBadge");

      if (titleEl) titleEl.textContent = `Langkah ${s.step}/5: ${s.title}`;
      if (instrEl) instrEl.textContent = s.instruction;
      if (mechEl) mechEl.textContent = s.mechanism;
      if (badgeEl) {
        badgeEl.textContent =
          affectedEar === "left" ? "Telinga Kiri Terjejas (Urutan Playbook)" : "Telinga Kanan Terjejas (Arah Terbalik)";
      }

      document.querySelectorAll("[data-epley-step]").forEach((btn) => {
        const bIdx = parseInt(btn.getAttribute("data-epley-step"), 10);
        btn.classList.toggle("active", bIdx === currentStepIdx);
        btn.classList.toggle("completed", bIdx < currentStepIdx);
      });

      playGentleTone(440 + currentStepIdx * 55, 160);
      if (window.markModuleExplored) window.markModuleExplored("epley");
    }

    document.querySelectorAll("[data-epley-ear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        affectedEar = btn.getAttribute("data-epley-ear");
        document.querySelectorAll("[data-epley-ear]").forEach((b) => b.classList.toggle("active", b === btn));
        applyStep(0);
      });
    });

    document.querySelectorAll("[data-epley-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyStep(parseInt(btn.getAttribute("data-epley-step"), 10));
      });
    });

    const prevBtn = document.getElementById("epleyPrevBtn");
    const nextBtn = document.getElementById("epleyNextBtn");
    const timerBtn = document.getElementById("epleyTimerToggleBtn");

    if (prevBtn) prevBtn.addEventListener("click", () => applyStep(currentStepIdx - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => applyStep(currentStepIdx + 1));

    if (timerBtn) {
      timerBtn.addEventListener("click", () => {
        if (timerInterval) {
          stopTimer();
        } else {
          timerBtn.textContent = "⏸️ Jeda Pemasa";
          timerInterval = setInterval(() => {
            if (timerRemaining > 0) {
              timerRemaining--;
              updateTimerUI();
              if (timerRemaining === 0) {
                playGentleTone(784, 380);
                stopTimer();
                if (currentStepIdx < 4) {
                  timerBtn.textContent = "✅ Selesai! Klik Langkah Seterusnya →";
                } else {
                  timerBtn.textContent = "🎉 Manuver Epley Lengkap!";
                }
              }
            }
          }, 1000);
        }
      });
    }

    function renderEpley() {
      const targetStep = getSteps()[currentStepIdx];
      animProgress += (targetStep.canalProgress - animProgress) * 0.08;
      animHeadAngle += (targetStep.headAngle - animHeadAngle) * 0.1;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);

      // LEFT HALF: Posterior Semicircular Canal + Utricle Otolith Path
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 11.5px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PERGERAKAN HABLUR OTOLITH DALAM KANAL", 155, 24);
      ctx.fillText("POSISI KEPALA & BADAN PESAKIT DI KATIL", 450, 24);

      const cx = 155;
      const cy = 160;
      const r = 78;

      // Utricle chamber
      ctx.beginPath();
      ctx.ellipse(cx - 52, cy - 32, 34, 42, -0.25, 0, Math.PI * 2);
      ctx.fillStyle = animProgress > 0.94 ? "rgba(16, 185, 129, 0.28)" : "#1e3a5f";
      ctx.fill();
      ctx.strokeStyle = animProgress > 0.94 ? "#10b981" : "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillText("UTRICLE", cx - 52, cy - 34);
      ctx.font = "500 9.5px system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("(Zon Selamat)", cx - 52, cy - 20);

      // Posterior Canal Ring
      const startAng = Math.PI * 0.65;
      const endAng = -Math.PI * 0.72;

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 22;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx + 12, cy + 6, r, -Math.PI * 0.72, Math.PI * 0.68);
      ctx.stroke();

      ctx.strokeStyle = "#0b1120";
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.arc(cx + 12, cy + 6, r, -Math.PI * 0.72, Math.PI * 0.68);
      ctx.stroke();

      // Ampulla (start danger zone)
      const ampX = cx + 12 + Math.cos(Math.PI * 0.68) * r;
      const ampY = cy + 6 + Math.sin(Math.PI * 0.68) * r;
      ctx.beginPath();
      ctx.arc(ampX, ampY, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#7f1d1d";
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fecaca";
      ctx.font = "600 9.5px system-ui, sans-serif";
      ctx.fillText("Ampulla", ampX - 24, ampY + 24);

      // Compute Otolith coordinates along arc -> utricle
      let ox, oy;
      if (animProgress <= 0.88) {
        const norm = animProgress / 0.88;
        const ang = startAng + (endAng - startAng) * norm;
        ox = cx + 12 + Math.cos(ang) * r;
        oy = cy + 6 + Math.sin(ang) * r;
      } else {
        const uNorm = (animProgress - 0.88) / 0.12;
        const exitX = cx + 12 + Math.cos(endAng) * r;
        const exitY = cy + 6 + Math.sin(endAng) * r;
        ox = exitX + (cx - 52 - exitX) * uNorm;
        oy = exitY + (cy - 10 - exitY) * uNorm;
      }

      // Draw glowing cluster of Otolith crystals
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.arc(ox + k * 4.5, oy + (k % 2) * 3.5, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = animProgress > 0.94 ? "#34d399" : "#fde047";
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = animProgress > 0.94 ? "#34d399" : "#fde047";
      ctx.font = "600 11.5px system-ui, sans-serif";
      ctx.fillText(
        animProgress > 0.94
          ? "✅ Kristal Selamat Kembali ke Utricle!"
          : `Kemajuan Reposisi Kristal: ${Math.round(animProgress * 100)}%`,
        155,
        286
      );

      // Divider
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(308, 26);
      ctx.lineTo(308, H - 20);
      ctx.stroke();

      // RIGHT HALF: Bed + Pillow + Patient Posture & Head Compass
      const bx = 340;
      const by = 195;
      // Bed mattress
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, 224, 24, 6);
      ctx.fill();
      ctx.stroke();

      // Shoulder Pillow (Crucial clinical detail from PDF!)
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.ellipse(bx + 68, by - 6, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "500 9.5px system-ui, sans-serif";
      ctx.fillText("Bantal di bawah bahu", bx + 68, by + 38);

      // Side-view silhouette depending on bodyState
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      if (targetStep.bodyState === "sitting" || targetStep.bodyState === "sitting-recovery") {
        // Sitting upright on bed
        ctx.beginPath();
        ctx.moveTo(bx + 125, by - 4); // hips
        ctx.lineTo(bx + 185, by - 4); // legs
        ctx.moveTo(bx + 125, by - 4);
        ctx.lineTo(bx + 125, by - 58); // torso upright
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx + 125, by - 74, 13, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
      } else {
        // Supine with shoulders on pillow & head extended 25 deg below horizontal!
        ctx.beginPath();
        ctx.moveTo(bx + 195, by - 6); // feet
        ctx.lineTo(bx + 68, by - 12); // torso to pillow
        ctx.lineTo(bx + 36, by + 2); // neck extended 20-30 deg!
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx + 26, by + 6, 13, 0, Math.PI * 2);
        ctx.fillStyle = targetStep.bodyState === "side-lying" ? "#fbbf24" : "#f8fafc";
        ctx.fill();
      }

      // Head Rotation Compass (Top-Down Nose Indicator)
      const compX = 452;
      const compY = 92;
      ctx.beginPath();
      ctx.arc(compX, compY, 38, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(compX, compY);
      ctx.rotate((animHeadAngle * Math.PI) / 180);

      // Head oval
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 24, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#334155";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Affected ear marker
      const earSide = affectedEar === "left" ? -21 : 21;
      ctx.beginPath();
      ctx.arc(earSide, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();

      // Nose pointer
      ctx.beginPath();
      ctx.moveTo(-6, -22);
      ctx.lineTo(0, -34);
      ctx.lineTo(6, -22);
      ctx.closePath();
      ctx.fillStyle = "#fde047";
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillText(`Sudut Putaran Hidung: ${Math.round(animHeadAngle)}°`, compX, compY + 54);

      ctx.fillStyle = "#fca5a5";
      ctx.font = "500 10px system-ui, sans-serif";
      ctx.fillText("Titik Merah = Telinga Terjejas", 452, 286);

      requestAnimationFrame(renderEpley);
    }

    applyStep(0);
    requestAnimationFrame(renderEpley);
  }

  // --------------------------------------------------------------------------
  // 5. GRAF PERANGKAP UBAT (<72 JAM) & JURULATIH VRT GAZE STABILIZATION
  // --------------------------------------------------------------------------
  function initRecoveryAndVrt() {
    // Part A: Central Compensation Chart
    const chartCanvas = document.getElementById("compensationCanvas");
    if (chartCanvas) {
      const W = 520;
      const H = 230;
      const ctx = setupHiDPICanvas(chartCanvas, W, H);
      let mode = "compare"; // 'optimal' | 'trap' | 'compare'

      function drawChart() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);

        const padL = 52;
        const padR = 24;
        const padT = 28;
        const padB = 38;
        const gw = W - padL - padR;
        const gh = H - padT - padB;

        // Axes
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padL, padT);
        ctx.lineTo(padL, H - padB);
        ctx.lineTo(W - padR, H - padB);
        ctx.stroke();

        // 72-hour acute window highlight
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
        ctx.font = "600 10px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Had 72 Jam Ubat Akut", x72 + 5, padT + 12);

        // Optimal Curve (Stop meds <72h + VRT)
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

        // Medication Trap Curve (Months of Vestibular Suppressants)
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

        // Labels
        ctx.fillStyle = "#94a3b8";
        ctx.font = "500 10.5px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Hari 1", padL + 14, H - 14);
        ctx.fillText("Minggu 1", padL + gw * 0.33, H - 14);
        ctx.fillText("Minggu 2", padL + gw * 0.66, H - 14);
        ctx.fillText("Minggu 4+", W - padR - 18, H - 14);

        ctx.save();
        ctx.translate(16, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Pampasan Otak (%)", 0, 0);
        ctx.restore();

        // Legend
        ctx.textAlign = "right";
        ctx.fillStyle = "#34d399";
        ctx.font = "600 11px system-ui, sans-serif";
        ctx.fillText("● Henti Pil <72j + Latihan VRT (Pulih ~95%)", W - padR, padT + 16);
        ctx.fillStyle = "#f87171";
        ctx.fillText("● Makan Pil Tahan Pening Berbulan-bulan (Otak Malas)", W - padR, padT + 34);
      }

      document.querySelectorAll("[data-comp-mode]").forEach((btn) => {
        btn.addEventListener("click", () => {
          mode = btn.getAttribute("data-comp-mode");
          document.querySelectorAll("[data-comp-mode]").forEach((b) => b.classList.toggle("active", b === btn));
          drawChart();
        });
      });

      drawChart();
    }

    // Part B: Interactive VRT Gaze Stabilization Metronome (VOR x1)
    const vrtToggleBtn = document.getElementById("vrtStartBtn");
    const vrtSpeedSlider = document.getElementById("vrtBpmSlider");
    const vrtBpmLabel = document.getElementById("vrtBpmVal");
    const vrtHeadGuide = document.getElementById("vrtHeadArrow");
    const vrtTimerEl = document.getElementById("vrtSessionTimer");

    let vrtRunning = false;
    let vrtBpm = 80;
    let vrtTimerSec = 30;
    let vrtBeatInterval = null;
    let vrtCountdown = null;
    let beatSide = 1;

    function stopVrt() {
      vrtRunning = false;
      if (vrtBeatInterval) clearInterval(vrtBeatInterval);
      if (vrtCountdown) clearInterval(vrtCountdown);
      vrtBeatInterval = null;
      vrtCountdown = null;
      if (vrtToggleBtn) vrtToggleBtn.textContent = "▶️ Mulakan Latihan Gaze Stabilization (30s)";
      if (vrtHeadGuide) vrtHeadGuide.textContent = "Renung huruf 'X' & sedia gerakkan kepala kecil kiri-kanan";
    }

    function startBeatLoop() {
      if (vrtBeatInterval) clearInterval(vrtBeatInterval);
      const ms = Math.round(60000 / vrtBpm);
      vrtBeatInterval = setInterval(() => {
        beatSide *= -1;
        playGentleTone(beatSide > 0 ? 660 : 528, 70);
        if (vrtHeadGuide) {
          vrtHeadGuide.textContent =
            beatSide > 0
              ? "⬅️ Pusing Kepala Sedikit ke KIRI (Mata Kekal pada X!)"
              : "Pusing Kepala Sedikit ke KANAN (Mata Kekal pada X!) ➡️";
        }
      }, ms);
    }

    if (vrtSpeedSlider) {
      vrtSpeedSlider.addEventListener("input", () => {
        vrtBpm = parseInt(vrtSpeedSlider.value, 10);
        if (vrtBpmLabel) vrtBpmLabel.textContent = vrtBpm + " rentak/min";
        if (vrtRunning) startBeatLoop();
      });
    }

    if (vrtToggleBtn) {
      vrtToggleBtn.addEventListener("click", () => {
        if (vrtRunning) {
          stopVrt();
        } else {
          vrtRunning = true;
          vrtTimerSec = 30;
          if (vrtTimerEl) vrtTimerEl.textContent = "30s";
          vrtToggleBtn.textContent = "⏹️ Berhenti Latihan";
          startBeatLoop();
          if (window.markModuleExplored) window.markModuleExplored("rehab");

          vrtCountdown = setInterval(() => {
            vrtTimerSec--;
            if (vrtTimerEl) vrtTimerEl.textContent = vrtTimerSec + "s";
            if (vrtTimerSec <= 0) {
              playGentleTone(880, 320);
              stopVrt();
              if (vrtHeadGuide) vrtHeadGuide.textContent = "✅ Sesi 30 saat selesai! Rehat sebentar sebelum ulang.";
            }
          }, 1000);
        }
      });
    }
  }

  window.initAllSimulators = function () {
    initSensorySimulator();
    initAnatomySimulator();
    initHintsSimulator();
    initEpleySimulator();
    initRecoveryAndVrt();
  };
})();
