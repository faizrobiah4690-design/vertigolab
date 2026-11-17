// ============================================================================
// VertigoLab — Bilingual Triage Engine, Side-Finder, Episode Diary, SOS & Quiz
// Zero-Build Vanilla JS • WCAG AA Accessible • Offline-Safe (HTTP & file://)
// ============================================================================

(function () {
  "use strict";

  const langRefreshCallbacks = [];

  // Canonical 11 interactive modules for mastery progress tracking
  const CANONICAL_MODULES = [
    "sensory",
    "anatomy",
    "matrix",
    "triage",
    "hints",
    "sidefinder",
    "epley",
    "rehab",
    "diary",
    "quiz",
    "quickhelp"
  ];

  function isEn() {
    return window.currentLang === "en";
  }

  // --------------------------------------------------------------------------
  // SAFE STORAGE, XSS ESCAPING & CLIPBOARD FALLBACK HELPERS
  // --------------------------------------------------------------------------
  function safeGetItem(key, fallback) {
    try {
      if (!window.localStorage) return fallback;
      const val = window.localStorage.getItem(key);
      return val === null ? fallback : val;
    } catch (_) {
      return fallback;
    }
  }

  function safeSetItem(key, value) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, String(value));
      }
    } catch (_) {}
  }

  function safeGetJSON(key, fallback) {
    const raw = safeGetItem(key, null);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function safeSetJSON(key, obj) {
    try {
      safeSetItem(key, JSON.stringify(obj));
    } catch (_) {}
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function copyTextWithFallback(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(text).then(
        () => true,
        () => fallbackExecCopy(text)
      );
    }
    return Promise.resolve(fallbackExecCopy(text));
  }

  function fallbackExecCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return Boolean(ok);
    } catch (_) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // SERVICE WORKER REGISTRATION (SAFE FOR CLOUDFLARE PAGES & FILE://)
  // --------------------------------------------------------------------------
  function registerOfflineServiceWorker() {
    if (
      "serviceWorker" in navigator &&
      window.location &&
      typeof window.location.protocol === "string" &&
      window.location.protocol.startsWith("http")
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      });
    }
  }

  // --------------------------------------------------------------------------
  // CANONICAL 11-MODULE MASTERY PROGRESS TRACKER
  // --------------------------------------------------------------------------
  const initialExploredRaw = safeGetJSON("vertigolab_explored", ["sensory"]);
  const exploredModules = new Set(
    Array.isArray(initialExploredRaw)
      ? initialExploredRaw.filter((id) => CANONICAL_MODULES.includes(id))
      : ["sensory"]
  );
  if (exploredModules.size === 0) exploredModules.add("sensory");

  window.markModuleExplored = function (moduleId) {
    if (!CANONICAL_MODULES.includes(moduleId)) return;
    if (!exploredModules.has(moduleId)) {
      exploredModules.add(moduleId);
      safeSetJSON("vertigolab_explored", Array.from(exploredModules));
    }
    updateMasteryProgress();
  };

  function updateMasteryProgress() {
    const validCount = Array.from(exploredModules).filter((id) =>
      CANONICAL_MODULES.includes(id)
    ).length;
    const pct = Math.min(100, Math.round((validCount / CANONICAL_MODULES.length) * 100));
    const fill = document.getElementById("masteryProgressFill");
    const label = document.getElementById("masteryProgressPct");
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = pct + "%";
  }

  // --------------------------------------------------------------------------
  // BILINGUAL (BM | EN) LANGUAGE & SCREEN-READER CONTROLLER
  // --------------------------------------------------------------------------
  function applyStaticDomTranslations(lang) {
    const en = lang === "en";
    document.documentElement.lang = en ? "en" : "ms";
    document.title = en
      ? "VertigoLab — Smart Interactive Vertigo Guide & Patient Helper"
      : "VertigoLab — Panduan Pintar, Interaktif & Bantuan Pesakit Vertigo";

    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset.ms === undefined) {
        el.dataset.ms = el.innerHTML;
      }
      el.innerHTML = en ? el.getAttribute("data-en") : el.dataset.ms;
    });

    document.querySelectorAll("[data-en-placeholder]").forEach((el) => {
      if (el.dataset.msPlaceholder === undefined) {
        el.dataset.msPlaceholder = el.getAttribute("placeholder") || "";
      }
      el.setAttribute(
        "placeholder",
        en ? el.getAttribute("data-en-placeholder") : el.dataset.msPlaceholder
      );
    });

    document.querySelectorAll("[data-en-aria]").forEach((el) => {
      if (el.dataset.msAria === undefined) {
        el.dataset.msAria = el.getAttribute("aria-label") || "";
      }
      el.setAttribute("aria-label", en ? el.getAttribute("data-en-aria") : el.dataset.msAria);
    });

    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      const isCurrent = btn.getAttribute("data-lang-switch") === (en ? "en" : "ms");
      btn.classList.toggle("active", isCurrent);
      btn.setAttribute("aria-pressed", String(isCurrent));
    });
  }

  window.setAppLanguage = function (lang) {
    const target = lang === "en" ? "en" : "ms";
    safeSetItem("vertigolab_lang", target);

    if (window.setVertigoLangData) {
      window.setVertigoLangData(target);
    } else {
      window.currentLang = target;
    }

    applyStaticDomTranslations(target);

    langRefreshCallbacks.forEach((fn) => {
      try {
        fn();
      } catch (_) {}
    });

    if (window.refreshSimulatorsLang) {
      window.refreshSimulatorsLang();
    }
  };

  // --------------------------------------------------------------------------
  // PERSISTED USER SETTINGS, ACCESSIBILITY TOGGLES & MOBILE NAVIGATION DRAWER
  // --------------------------------------------------------------------------
  let breathOrbSyncHook = null;

  function syncCalmModeUI() {
    const isCalm = Boolean(window.__vertigoCalmMode);
    const en = isEn();
    document.documentElement.classList.toggle("calm-motion", isCalm);
    document.body.classList.toggle("calm-motion", isCalm);

    ["calmModeToggleBtn", "modalCalmModeBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.toggle("active", isCalm);
        btn.setAttribute("aria-pressed", String(isCalm));
        if (en) {
          btn.textContent = isCalm
            ? "🧘 Calm Mode: ON (Motion Paused)"
            : "🧘 Dizzy-Friendly Mode (Pause Motion)";
        } else {
          btn.textContent = isCalm
            ? "🧘 Mod Tenang: AKTIF (Animasi Dijeda)"
            : "🧘 Mod Mesra Pening (Jeda Animasi)";
        }
      }
    });

    if (typeof breathOrbSyncHook === "function") {
      breathOrbSyncHook();
    }
  }

  function syncThemeUI() {
    const isLight = document.body.classList.contains("light-theme");
    const en = isEn();
    const metaTheme = document.getElementById("metaThemeColor");
    if (metaTheme) {
      metaTheme.setAttribute("content", isLight ? "#eef2f6" : "#070d19");
    }

    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.classList.toggle("active", isLight);
      themeBtn.setAttribute("aria-pressed", String(isLight));
      if (en) {
        themeBtn.textContent = isLight ? "🌙 Dark Mode" : "☀️ Light Mode";
      } else {
        themeBtn.textContent = isLight ? "🌙 Mod Gelap" : "☀️ Mod Cerah";
      }
    }
  }

  function syncTextSizeUI() {
    const isLarge = document.documentElement.classList.contains("text-large");
    const en = isEn();
    ["textSizeToggleBtn", "modalTextSizeBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.toggle("active", isLarge);
        btn.setAttribute("aria-pressed", String(isLarge));
        if (en) {
          btn.textContent = isLarge ? "🔠 A+ ON" : "🔠 A+ Text";
        } else {
          btn.textContent = isLarge ? "🔠 A+ Aktif" : "🔠 A+ Besar";
        }
      }
    });
  }

  function syncAudioMuteUI() {
    const isMuted = Boolean(window.__vertigoAudioMuted);
    const en = isEn();
    if (isMuted && typeof window.stopActiveVertigoAudio === "function") {
      window.stopActiveVertigoAudio();
    }
    ["audioMuteToggleBtn", "modalAudioMuteBtn", "vrtAudioMuteBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.toggle("active", isMuted);
        btn.setAttribute("aria-pressed", String(isMuted));
        if (en) {
          btn.textContent = isMuted ? "🔇 Muted" : "🔊 Audio";
        } else {
          btn.textContent = isMuted ? "🔇 Senyap" : "🔊 Bunyi";
        }
      }
    });
  }

  function syncAudienceModeUI(mode) {
    const isClinical = mode === "clinical";
    document.body.classList.toggle("mode-layman", !isClinical);
    document.body.classList.toggle("mode-clinical", isClinical);
    document.querySelectorAll("[data-audience-mode]").forEach((btn) => {
      const active = btn.getAttribute("data-audience-mode") === (isClinical ? "clinical" : "layman");
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    if (window.refreshAnatomyAudienceText) {
      window.refreshAnatomyAudienceText();
    }
  }

  function initTopControls() {
    // Restore persisted user preferences safely
    const savedTheme = safeGetItem("vertigolab_theme", "dark");
    document.body.classList.toggle("light-theme", savedTheme === "light");

    const savedTextSize = safeGetItem("vertigolab_text_size", "normal");
    document.documentElement.classList.toggle("text-large", savedTextSize === "large");

    const savedCalm = safeGetItem("vertigolab_calm", null);
    if (savedCalm !== null) {
      window.__vertigoCalmMode = savedCalm === "true";
    } else if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.__vertigoCalmMode = true;
    }

    const savedAudioMuted = safeGetItem("vertigolab_audio_muted", null);
    if (savedAudioMuted !== null) {
      window.__vertigoAudioMuted = savedAudioMuted === "true";
    }

    const savedAudience = safeGetItem("vertigolab_audience_mode", "layman");
    syncAudienceModeUI(savedAudience === "clinical" ? "clinical" : "layman");

    // Wire Language Buttons
    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.setAppLanguage(btn.getAttribute("data-lang-switch"));
      });
    });

    // Wire Audience Mode Buttons
    document.querySelectorAll("[data-audience-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-audience-mode") === "clinical" ? "clinical" : "layman";
        safeSetItem("vertigolab_audience_mode", mode);
        syncAudienceModeUI(mode);
      });
    });

    // Wire Theme Button
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const nextLight = !document.body.classList.contains("light-theme");
        document.body.classList.toggle("light-theme", nextLight);
        safeSetItem("vertigolab_theme", nextLight ? "light" : "dark");
        syncThemeUI();
      });
    }

    // Wire Calm Mode Buttons
    ["calmModeToggleBtn", "modalCalmModeBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          window.__vertigoCalmMode = !window.__vertigoCalmMode;
          safeSetItem("vertigolab_calm", window.__vertigoCalmMode ? "true" : "false");
          syncCalmModeUI();
        });
      }
    });

    // Wire Large Text (A+) Buttons
    ["textSizeToggleBtn", "modalTextSizeBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          const nextLarge = !document.documentElement.classList.contains("text-large");
          document.documentElement.classList.toggle("text-large", nextLarge);
          safeSetItem("vertigolab_text_size", nextLarge ? "large" : "normal");
          syncTextSizeUI();
        });
      }
    });

    // Wire Audio Mute Buttons
    ["audioMuteToggleBtn", "modalAudioMuteBtn", "vrtAudioMuteBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          window.__vertigoAudioMuted = !window.__vertigoAudioMuted;
          safeSetItem("vertigolab_audio_muted", window.__vertigoAudioMuted ? "true" : "false");
          syncAudioMuteUI();
        });
      }
    });

    // Wire Mobile Hamburger Drawer
    const topbar = document.getElementById("mainTopbar");
    const menuBtn = document.getElementById("mobileMenuToggleBtn");
    const menuIcon = document.getElementById("mobileMenuIcon");
    const collapsible = document.getElementById("topbarCollapsible");

    function setMobileMenuOpen(isOpen) {
      if (!topbar || !menuBtn || !collapsible) return;
      topbar.classList.toggle("menu-open", isOpen);
      collapsible.classList.toggle("is-open", isOpen);
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      if (menuIcon) menuIcon.textContent = isOpen ? "✕" : "☰";
    }

    if (menuBtn) {
      menuBtn.addEventListener("click", () => {
        const currentlyOpen = menuBtn.getAttribute("aria-expanded") === "true";
        setMobileMenuOpen(!currentlyOpen);
      });
    }

    if (collapsible) {
      collapsible.querySelectorAll("a[href^='#']").forEach((link) => {
        link.addEventListener("click", () => setMobileMenuOpen(false));
      });
    }

    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) {
        setMobileMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      const modal = document.getElementById("quickHelpModal");
      if (e.key === "Escape" && (!modal || modal.hidden)) {
        setMobileMenuOpen(false);
      }
    });

    syncCalmModeUI();
    syncThemeUI();
    syncTextSizeUI();
    syncAudioMuteUI();

    langRefreshCallbacks.push(() => {
      syncCalmModeUI();
      syncThemeUI();
      syncTextSizeUI();
      syncAudioMuteUI();
    });
  }

  // --------------------------------------------------------------------------
  // EPISODE DIARY DATA HELPERS (SHARED WITH DOCTOR SUMMARY GENERATOR)
  // --------------------------------------------------------------------------
  const DIARY_LABELS = {
    sensation: {
      ms: {
        spinning: "Berpusing (Vertigo)",
        lightheaded: "Gelap Mata / Hampir Pitam",
        swaying: "Terhuyung / Bergoyang"
      },
      en: {
        spinning: "Room Spinning (Vertigo)",
        lightheaded: "Lightheaded / Dim Vision",
        swaying: "Swaying / Unsteady"
      }
    },
    duration: {
      ms: {
        under1m: "< 1 minit (15–45s)",
        "1to20m": "1 – 20 minit",
        "20mTo12h": "20 minit – 12 jam",
        over24h: "Berterusan > 24 jam"
      },
      en: {
        under1m: "< 1 min (15–45s)",
        "1to20m": "1 – 20 mins",
        "20mTo12h": "20 mins – 12 hrs",
        over24h: "Continuous > 24 hrs"
      }
    },
    trigger: {
      ms: {
        positional: "Baring / mengiring / mendongak",
        standing: "Bangun berdiri cepat",
        sleepStressLight: "Kurang tidur / stres / silau",
        saltyFood: "Makanan masin / kafein",
        visualBusy: "Pasar raya / skrol skrin",
        spontaneous: "Spontan (semasa rehat)"
      },
      en: {
        positional: "Lying / rolling in bed / looking up",
        standing: "Standing up quickly",
        sleepStressLight: "Poor sleep / stress / bright glare",
        saltyFood: "High-salt meal / caffeine",
        visualBusy: "Busy aisle / scrolling screen",
        spontaneous: "Spontaneous (at rest)"
      }
    }
  };

  function getStoredDiaryEntries() {
    const arr = safeGetJSON("vertigolab_diary", []);
    if (!Array.isArray(arr)) return [];
    return arr.filter((item) => item && typeof item === "object");
  }

  function computeDiaryStats(entries, en) {
    const langKey = en ? "en" : "ms";
    if (!entries.length) {
      return {
        total: 0,
        topTriggerLabel: "—",
        avgSeverity: "—"
      };
    }
    const counts = {};
    let sevSum = 0;
    entries.forEach((item) => {
      const trig = item.trigger || "positional";
      counts[trig] = (counts[trig] || 0) + 1;
      const sev = Math.min(10, Math.max(1, parseInt(item.severity, 10) || 5));
      sevSum += sev;
    });

    let topTrigKey = Object.keys(counts)[0];
    Object.keys(counts).forEach((k) => {
      if (counts[k] > counts[topTrigKey]) topTrigKey = k;
    });

    const trigMap = DIARY_LABELS.trigger[langKey];
    const avg = (sevSum / entries.length).toFixed(1);
    return {
      total: entries.length,
      topTriggerLabel: trigMap[topTrigKey] || topTrigKey,
      avgSeverity: avg + " / 10"
    };
  }

  function formatDiaryDateTime(isoStr, en) {
    if (!isoStr) return en ? "Unspecified time" : "Masa tidak dinyatakan";
    const dt = new Date(isoStr);
    if (Number.isNaN(dt.getTime())) return String(isoStr);
    try {
      return dt.toLocaleString(en ? "en-GB" : "ms-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (_) {
      return String(isoStr).replace("T", " ");
    }
  }

  // --------------------------------------------------------------------------
  // QUICK-HELP MODAL (WCAG TABLIST, FOCUS TRAP, BREATH ORB FIXATION & DOC NOTE)
  // --------------------------------------------------------------------------
  function initQuickPatientHelper() {
    const modal = document.getElementById("quickHelpModal");
    if (!modal) return;

    let breathInterval = null;
    let breathSec = 0;
    let breathOrbFrozen = false;
    let activePatternKey = "bppv";
    let lastModalTrigger = null;

    const toggleBreathBtn = document.getElementById("toggleBreathMotionBtn");
    const breathCircle = document.getElementById("breathingPacerOrb");

    function isBreathOrbStationary() {
      return Boolean(breathOrbFrozen || window.__vertigoCalmMode);
    }

    function syncBreathMotionUI() {
      const stationary = isBreathOrbStationary();
      const en = isEn();
      if (breathCircle) {
        breathCircle.classList.toggle("static-dot", stationary);
        if (stationary) {
          breathCircle.classList.remove("inhale", "exhale");
        }
      }
      if (toggleBreathBtn) {
        toggleBreathBtn.classList.toggle("active", stationary);
        toggleBreathBtn.setAttribute("aria-pressed", String(stationary));
        if (window.__vertigoCalmMode) {
          toggleBreathBtn.textContent = en
            ? "🎯 Dot Frozen by Calm Mode (100% Still)"
            : "🎯 Titik Dibekukan oleh Mod Tenang (100% Pegun)";
        } else if (breathOrbFrozen) {
          toggleBreathBtn.textContent = en
            ? "🎯 Fixation Dot Frozen (Click to Resume Pulse)"
            : "🎯 Titik Fokus Pegun 100% (Klik Aktifkan Denyut)";
        } else {
          toggleBreathBtn.textContent = en
            ? "🎯 Freeze Fixation Dot (100% Stationary)"
            : "🎯 Bekukan Titik Fokus (100% Pegun)";
        }
      }
    }

    breathOrbSyncHook = syncBreathMotionUI;

    if (toggleBreathBtn) {
      toggleBreathBtn.addEventListener("click", () => {
        if (window.__vertigoCalmMode) {
          // If Calm Mode is on, toggle Calm Mode off only if user explicitly wants orb pulse, or toggle local freeze
          breathOrbFrozen = !breathOrbFrozen;
        } else {
          breathOrbFrozen = !breathOrbFrozen;
        }
        syncBreathMotionUI();
        renderBreathingTick();
      });
    }

    function renderBreathingTick() {
      const breathText = document.getElementById("breathingPhaseText");
      if (!breathText || !breathCircle) return;
      const stationary = isBreathOrbStationary();
      breathCircle.classList.toggle("static-dot", stationary);

      const cycleSec = breathSec % 10; // 4s inhale, 6s exhale
      if (cycleSec < 4) {
        breathText.textContent = isEn()
          ? `Inhale Slowly Through Nose... (${4 - cycleSec}s)`
          : `Tarik Nafas Perlahan Melalui Hidung... (${4 - cycleSec}s)`;
        if (!stationary) {
          breathCircle.classList.add("inhale");
          breathCircle.classList.remove("exhale");
        } else {
          breathCircle.classList.remove("inhale", "exhale");
        }
      } else {
        breathText.textContent = isEn()
          ? `Exhale Gently Through Mouth... (${10 - cycleSec}s)`
          : `Hembus Perlahan Melalui Mulut... (${10 - cycleSec}s)`;
        if (!stationary) {
          breathCircle.classList.add("exhale");
          breathCircle.classList.remove("inhale");
        } else {
          breathCircle.classList.remove("inhale", "exhale");
        }
      }
    }

    function startBreathingGuide() {
      if (breathInterval) clearInterval(breathInterval);
      breathSec = 0;
      syncBreathMotionUI();
      renderBreathingTick();
      breathInterval = setInterval(() => {
        breathSec++;
        renderBreathingTick();
      }, 1000);
    }

    function stopBreathingGuide() {
      if (breathInterval) {
        clearInterval(breathInterval);
        breathInterval = null;
      }
    }

    function setBackgroundInert(isInert) {
      ["mainTopbar", "quickSosBanner", "floatingSosBtn", "top"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if ("inert" in el) {
          el.inert = isInert;
        }
        if (isInert) {
          el.setAttribute("aria-hidden", "true");
        } else {
          el.removeAttribute("aria-hidden");
        }
      });
    }

    function getModalFocusableElements() {
      const selector =
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(modal.querySelectorAll(selector)).filter((el) => {
        if (el.closest("[hidden]")) return false;
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      });
    }

    function switchQuickTab(tabId, moveFocusToTab) {
      const tabs = Array.from(modal.querySelectorAll("[data-qh-tab]"));
      tabs.forEach((btn) => {
        const isSelected = btn.getAttribute("data-qh-tab") === tabId;
        btn.classList.toggle("active", isSelected);
        btn.setAttribute("aria-selected", String(isSelected));
        btn.setAttribute("tabindex", isSelected ? "0" : "-1");
        if (isSelected && moveFocusToTab) {
          btn.focus();
        }
      });
      modal.querySelectorAll("[data-qh-pane]").forEach((pane) => {
        pane.hidden = pane.getAttribute("data-qh-pane") !== tabId;
      });
      if (tabId === "step4") {
        updateDocPreview();
      }
    }

    function openModal(initialTab, triggerEl) {
      if (modal.hidden) {
        lastModalTrigger = triggerEl || document.activeElement;
      }
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      setBackgroundInert(true);
      window.markModuleExplored("quickhelp");
      const targetTab = initialTab || "step1";
      switchQuickTab(targetTab, false);
      startBreathingGuide();

      const activeTabBtn = modal.querySelector(`[data-qh-tab="${targetTab}"]`);
      const closeBtn = document.getElementById("qhCloseBtn");
      const focusTarget = activeTabBtn || closeBtn;
      if (focusTarget && typeof focusTarget.focus === "function") {
        setTimeout(() => focusTarget.focus(), 10);
      }
    }

    function closeModal() {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.style.overflow = "";
      setBackgroundInert(false);
      stopBreathingGuide();
      if (
        lastModalTrigger &&
        document.contains(lastModalTrigger) &&
        typeof lastModalTrigger.focus === "function"
      ) {
        lastModalTrigger.focus();
      }
    }

    window.openQuickHelpModal = openModal;

    document.querySelectorAll("[data-open-quickhelp]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const targetTab = trigger.getAttribute("data-open-quickhelp") || "step1";
        openModal(targetTab, trigger);
      });
    });

    modal.querySelectorAll("[data-close-quickhelp]").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Modal Escape + Focus Trap
    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key === "Tab") {
        const focusables = getModalFocusableElements();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !modal.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last || !modal.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // WCAG Tablist Click + ArrowLeft / ArrowRight / Home / End Navigation
    const tabButtons = Array.from(modal.querySelectorAll("[data-qh-tab]"));
    tabButtons.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        switchQuickTab(btn.getAttribute("data-qh-tab"), false);
      });

      btn.addEventListener("keydown", (e) => {
        let nextIdx = null;
        if (e.key === "ArrowRight") {
          nextIdx = (idx + 1) % tabButtons.length;
        } else if (e.key === "ArrowLeft") {
          nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
        } else if (e.key === "Home") {
          nextIdx = 0;
        } else if (e.key === "End") {
          nextIdx = tabButtons.length - 1;
        }
        if (nextIdx !== null) {
          e.preventDefault();
          switchQuickTab(tabButtons[nextIdx].getAttribute("data-qh-tab"), true);
        }
      });
    });

    modal.querySelectorAll("[data-qh-goto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        switchQuickTab(btn.getAttribute("data-qh-goto"), true);
      });
    });

    const jumpDiaryLink = document.getElementById("qhJumpToDiaryLink");
    if (jumpDiaryLink) {
      jumpDiaryLink.addEventListener("click", () => {
        lastModalTrigger = null;
        closeModal();
      });
    }

    // Tab 2: 30-Second Red Flag Emergency Checker inside Modal
    const qhRedChecks = modal.querySelectorAll(".qh-redflag-cb");
    const qhVerdict = document.getElementById("qhEmergencyVerdict");

    function evaluateQuickRedFlags() {
      if (!qhVerdict) return;
      const en = isEn();
      let count = 0;
      qhRedChecks.forEach((cb) => {
        if (cb.checked) count++;
      });

      if (count > 0) {
        qhVerdict.className = "alert-banner alert-critical";
        qhVerdict.innerHTML = en
          ? `
            <div style="font-size:1rem; font-weight:800; margin-bottom:6px;">
              🚨 EMERGENCY WARNING (${count} Red Flag${count > 1 ? "s" : ""} Checked) — DO NOT WAIT AT HOME!
            </div>
            <p style="margin:0 0 10px;">
              Dizziness/vertigo accompanied by neurological 5D signs, inability to stand unassisted, sudden unilateral hearing loss, acute neck pain, or chest pain/fainting requires <strong>immediate Hospital Emergency Department evaluation</strong> to rule out stroke, vertebral dissection, or cardiac causes. <strong>Do not drive yourself!</strong>
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a href="tel:999" class="btn-danger-solid">📞 Call Emergency (999 / 911)</a>
              <button type="button" class="btn-secondary" id="qhJumpDocSummaryFromAlert">📋 Prepare Emergency Doctor Note</button>
            </div>
          `
          : `
            <div style="font-size:1rem; font-weight:800; margin-bottom:6px;">
              🚨 AMARAN KECEMASAN (${count} Tanda Bahaya Dikesan) — JANGAN TUNGGU DI RUMAH!
            </div>
            <p style="margin:0 0 10px;">
              Pening/vertigo yang disertai tanda saraf (5D), kegagalan berdiri, pekak mendadak sebelah telinga, sakit leher akut, atau sakit dada/pitam memerlukan penilaian <strong>Jabatan Kecemasan Hospital dengan segera</strong> untuk menolak strok, diseksi arteri, atau masalah jantung akut. <strong>Jangan memandu sendiri!</strong>
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a href="tel:999" class="btn-danger-solid">📞 Hubungi Kecemasan 999</a>
              <button type="button" class="btn-secondary" id="qhJumpDocSummaryFromAlert">📋 Sediakan Nota Untuk Doktor Kecemasan</button>
            </div>
          `;
        const jumpBtn = document.getElementById("qhJumpDocSummaryFromAlert");
        if (jumpBtn) jumpBtn.addEventListener("click", () => switchQuickTab("step4", true));
      } else {
        qhVerdict.className = "alert-banner alert-safe";
        qhVerdict.innerHTML = en
          ? `
            <strong>✅ No Red-Flag Emergency Signs Checked So Far.</strong>
            <div style="margin-top:4px;">You may proceed to <strong>Step 3 (Identify My Dizziness Pattern)</strong> for tailored, safe self-care guidance.</div>
          `
          : `
            <strong>✅ Tiada Tanda Bahaya Merah Ditandakan Setakat Ini.</strong>
            <div style="margin-top:4px;">Anda boleh teruskan ke <strong>Langkah 3 (Kenal Pasti Corak Pening)</strong> untuk panduan penjagaan kendiri yang selamat dan tepat.</div>
          `;
      }
    }

    qhRedChecks.forEach((cb) => cb.addEventListener("change", evaluateQuickRedFlags));

    // Tab 3: Interactive Pattern Cards for Patients (Bilingual)
    const patternDetailsByLang = {
      ms: {
        bppv: {
          title: "🌀 Corak BPPV (Hablur Kristal Telinga Dalam)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Kristal kalsium halus tercabut dari tempat asal (utricle) lalu bergolek di dalam saluran pusingan setiap kali kepala baring, mengiring, atau mendongak.</li>
              <li><strong>Apa patut buat:</strong> Gunakan <strong>Penentu Sisi BPPV</strong> dan dapatkan rawatan <strong>Epley / BBQ Roll / Gufoni</strong> (berjaya 80%–90%). Bangun dari katil secara perlahan.</li>
              <li><strong>Apa JANGAN buat:</strong> Jangan bergantung pada pil tahan pening berbulan-bulan kerana ubat pil langsung tidak boleh mencairkan kristal kalsium!</li>
            </ul>
            <a href="#sec-epley" data-qh-jump-section class="btn-primary">🔄 Buka Penentu Sisi &amp; Simulator BPPV</a>
          `
        },
        orthostatic: {
          title: "⚡ Corak Gelap Mata / Pening Ortostatik (Bukan Vertigo!)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Tekanan darah turun mendadak seketika apabila bangun berdiri cepat dari duduk/baring/sujud (akibat kurang air, kesan ubat darah tinggi, anemia, atau gula rendah).</li>
              <li><strong>Apa patut buat:</strong> Amalkan bangun 2 peringkat (duduk di tepi katil 30 saat &amp; gerakkan pergelangan kaki sebelum berdiri), minum air mencukupi, dan minta doktor periksa <strong>tekanan darah semasa baring vs berdiri</strong>.</li>
              <li><strong>Apa JANGAN buat:</strong> Jangan makan ubat vertigo telinga tanpa nasihat doktor kerana ia boleh menyebabkan mengantuk dan risiko jatuh!</li>
            </ul>
          `
        },
        migraine: {
          title: "✨ Corak Vestibular Migraine (Pusing + Silau Cahaya / Sensitif Bunyi)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Kepekaan saraf keseimbangan dan deria otak (berlangsung 5 minit hingga 72 jam, malah <strong>30%–50% berlaku TANPA sakit kepala serentak!</strong>).</li>
              <li><strong>Apa patut buat:</strong> Rehat di bilik redup &amp; senyap, jaga waktu tidur tetap, minum air cukup, jangan biar perut lapar, dan jejak pencetus dalam <strong>Diari Serangan</strong>.</li>
            </ul>
            <a href="#sec-diari" data-qh-jump-section class="btn-primary">📓 Buka Diari Serangan &amp; Pencetus</a>
          `
        },
        meniere: {
          title: "🌊 Corak Penyakit Meniere (Pusing Berjam + Desing/Telinga Penuh)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Lebihan tekanan cecair <em>endolymph</em> pada sebelah telinga dalam (serangan 20 minit hingga 12 jam disertai tinnitus, telinga rasa penuh, dan kurang pendengaran).</li>
              <li><strong>Apa patut buat:</strong> Hadkan garam/natrium bawah 1,500–2,000 mg sehari secara sekata, kurangkan kafein, dan dapatkan ujian audiometri bersama Pakar ENT.</li>
            </ul>
            <a href="#sec-pemulihan" data-qh-jump-section class="btn-primary">🧂 Cuba Kalkulator Garam Harian</a>
          `
        },
        neuritis: {
          title: "🦠 Corak Vestibular Neuritis / Labyrinthitis (Berterusan Berhari-hari)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Keradangan saraf keseimbangan telinga dalam (lazimnya pasca-virus). Jika pendengaran turut menurun mendadak, wajib saring strok arteri AICA terlebih dahulu!</li>
              <li><strong>Apa patut buat:</strong> Wajib diperiksa doktor (<strong>HINTS Plus</strong>) untuk menolak strok. Ubat tahan muntah hanya ≤72 jam pertama; selepas itu mulakan <strong>senaman mata VRT</strong>!</li>
            </ul>
            <a href="#sec-pemulihan" data-qh-jump-section class="btn-primary">🎯 Buka Jurulatih VRT Gaze Stabilization</a>
          `
        },
        pppd: {
          title: "🛒 Corak PPPD (Terhuyung-hayang Kronik >3 Bulan & Sensitif Visual)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Sering bermula selepas episod vertigo terdahulu yang sudah sembuh secara fizikal, tetapi otak kekal sensitif apabila berdiri, berjalan, atau di pasar raya sibuk.</li>
              <li><strong>Apa patut buat:</strong> Jangan takut bergerak! Rawatan utama ialah latihan habituasi <strong>Rehabilitasi Vestibular (VRT)</strong> secara berperingkat tanpa pil penindas harian.</li>
            </ul>
          `
        }
      },
      en: {
        bppv: {
          title: "🌀 BPPV Pattern (Loose Inner-Ear Calcium Crystals)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Tiny calcium crystals detach from the utricle and roll inside your semicircular canal whenever you lie back, roll over in bed, or look up.</li>
              <li><strong>What to do:</strong> Use our <strong>BPPV Side-Finder</strong> and treat with <strong>Epley / BBQ Roll / Gufoni</strong> (80%–90% effective). Sit up from bed slowly.</li>
              <li><strong>What NOT to do:</strong> Do NOT rely on daily dizziness pills for weeks—oral pills cannot dissolve or move calcium crystals!</li>
            </ul>
            <a href="#sec-epley" data-qh-jump-section class="btn-primary">🔄 Open BPPV Side-Finder &amp; Simulator</a>
          `
        },
        orthostatic: {
          title: "⚡ Orthostatic Lightheadedness / Presyncope (Not Inner-Ear Vertigo!)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Temporary drop in blood pressure when standing up quickly from sitting/lying down (dehydration, blood pressure meds, anemia, or low blood sugar).</li>
              <li><strong>What to do:</strong> Practice 2-stage standing (sit on the bed edge for 30s &amp; pump ankles before standing), hydrate well, and ask your doctor to check <strong>lying vs standing blood pressure</strong>.</li>
              <li><strong>What NOT to do:</strong> Avoid taking sedating vertigo pills unnecessarily, as they raise fall risk!</li>
            </ul>
          `
        },
        migraine: {
          title: "✨ Vestibular Migraine Pattern (Spinning + Light/Sound Sensitivity)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Hypersensitivity of central balance and sensory pathways (episodes last 5 minutes to 72 hours, and <strong>30%–50% occur WITHOUT a concurrent headache!</strong>).</li>
              <li><strong>What to do:</strong> Rest in a dim, quiet room, keep regular sleep and meal schedules, hydrate well, and track triggers in the <strong>Attack Logbook</strong>.</li>
            </ul>
            <a href="#sec-diari" data-qh-jump-section class="btn-primary">📓 Open Attack Logbook / Diary</a>
          `
        },
        meniere: {
          title: "🌊 Meniere's Disease Pattern (Hours of Spinning + Ear Ringing/Fullness)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Excess <em>endolymph</em> fluid pressure in one inner ear (attacks last 20 minutes to 12 hours with unilateral roaring tinnitus, ear fullness, and muffled hearing).</li>
              <li><strong>What to do:</strong> Keep sodium evenly below 1,500–2,000 mg/day, limit caffeine/alcohol, and arrange formal audiometry with an ENT specialist.</li>
            </ul>
            <a href="#sec-pemulihan" data-qh-jump-section class="btn-primary">🧂 Try the Daily Sodium Calculator</a>
          `
        },
        neuritis: {
          title: "🦠 Vestibular Neuritis / Labyrinthitis Pattern (Continuous for Days)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Inflammation of the vestibular nerve (often post-viral). If hearing also drops suddenly, AICA stroke must be ruled out urgently!</li>
              <li><strong>What to do:</strong> Must be examined by a doctor first (<strong>HINTS Plus</strong>) to rule out stroke. Limit anti-nausea suppressants to ≤72 hours, then begin <strong>VRT eye-head exercises</strong>!</li>
            </ul>
            <a href="#sec-pemulihan" data-qh-jump-section class="btn-primary">🎯 Open VRT Gaze Stabilization Trainer</a>
          `
        },
        pppd: {
          title: "🛒 PPPD Pattern (Chronic Swaying >3 Months & Visual Motion Sensitivity)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Often triggered after a prior vertigo event has physically healed, leaving the brain over-reliant on visual cues when upright or in busy aisles.</li>
              <li><strong>What to do:</strong> Stay gently active! First-line care is graded <strong>Vestibular Rehabilitation Therapy (VRT)</strong> habituation without daily sedating pills.</li>
            </ul>
          `
        }
      }
    };

    const patternOut = document.getElementById("qhPatternAdviceBox");

    function renderActivePatternCard() {
      const langDict = patternDetailsByLang[isEn() ? "en" : "ms"];
      const detail = langDict[activePatternKey];
      if (patternOut && detail) {
        patternOut.innerHTML = `<h4 style="margin:0 0 8px;">${detail.title}</h4>${detail.body}`;
        patternOut.querySelectorAll("[data-qh-jump-section]").forEach((lnk) => {
          lnk.addEventListener("click", () => {
            lastModalTrigger = null;
            closeModal();
          });
        });
      }
    }

    modal.querySelectorAll("[data-qh-pattern]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activePatternKey = btn.getAttribute("data-qh-pattern") || "bppv";
        modal.querySelectorAll("[data-qh-pattern]").forEach((b) => {
          const isCurr = b === btn;
          b.classList.toggle("active", isCurr);
          b.setAttribute("aria-pressed", String(isCurr));
        });
        renderActivePatternCard();
      });
    });

    // Tab 4: Persisted Doctor Symptom Summary Generator + Unclipped Print Report
    const docSensationEl = document.getElementById("docSensation");
    const docDurationEl = document.getElementById("docDuration");
    const docTriggerEl = document.getElementById("docTrigger");
    const docAssocEl = document.getElementById("docAssoc");
    const docMedsEl = document.getElementById("docMeds");
    const docIncludeDiaryEl = document.getElementById("docIncludeDiaryCb");
    const docPreview = document.getElementById("docNotePreview");
    const copyDocBtn = document.getElementById("copyDocNoteBtn");
    const printDocBtn = document.getElementById("printDocNoteBtn");
    const printReportDiv = document.getElementById("printDoctorReport");

    function setSelectValueIfValid(selectEl, val) {
      if (!selectEl || !val) return;
      const exists = Array.from(selectEl.options).some((opt) => opt.value === val);
      if (exists) selectEl.value = val;
    }

    function loadSavedDocProfile() {
      const saved = safeGetJSON("vertigolab_doc_profile", null);
      if (!saved || typeof saved !== "object") return;
      setSelectValueIfValid(docSensationEl, saved.sensation);
      setSelectValueIfValid(docDurationEl, saved.duration);
      setSelectValueIfValid(docTriggerEl, saved.trigger);
      setSelectValueIfValid(docAssocEl, saved.assoc);
      if (docMedsEl && typeof saved.meds === "string") {
        docMedsEl.value = saved.meds;
      }
      if (docIncludeDiaryEl && typeof saved.includeDiary === "boolean") {
        docIncludeDiaryEl.checked = saved.includeDiary;
      }
    }

    function saveDocProfile() {
      safeSetJSON("vertigolab_doc_profile", {
        sensation: docSensationEl ? docSensationEl.value : "spinning",
        duration: docDurationEl ? docDurationEl.value : "under1m",
        trigger: docTriggerEl ? docTriggerEl.value : "positional",
        assoc: docAssocEl ? docAssocEl.value : "none",
        meds: docMedsEl ? docMedsEl.value : "",
        includeDiary: docIncludeDiaryEl ? Boolean(docIncludeDiaryEl.checked) : true
      });
    }

    function buildDoctorSummaryText() {
      const en = isEn();
      const langKey = en ? "en" : "ms";

      const getSelectOrInputText = (el) => {
        if (!el) return "";
        if (el.tagName === "SELECT" && el.options[el.selectedIndex]) {
          return el.options[el.selectedIndex].text.trim();
        }
        return el.value.trim();
      };

      const redChecked = [];
      qhRedChecks.forEach((cb) => {
        if (cb.checked) {
          redChecked.push(
            en
              ? cb.getAttribute("data-en-label") || cb.getAttribute("data-label")
              : cb.getAttribute("data-label")
          );
        }
      });

      const today = new Date().toLocaleDateString(en ? "en-GB" : "ms-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      const lines = en
        ? [
            `=== PATIENT DIZZINESS / VERTIGO SUMMARY FOR DOCTOR (${today}) ===`,
            `1. Primary Sensation: ${getSelectOrInputText(docSensationEl)}`,
            `2. Single Episode Duration: ${getSelectOrInputText(docDurationEl)}`,
            `3. Main Trigger: ${getSelectOrInputText(docTriggerEl)}`,
            `4. Ear / Associated Symptoms: ${getSelectOrInputText(docAssocEl)}`,
            `5. Current Medications / Medical History: ${getSelectOrInputText(docMedsEl) || "None stated"}`,
            `6. Red-Flag Screen (5Ds / Gait / Cardiac / Neck): ${
              redChecked.length
                ? "PRESENT (" + redChecked.join("; ") + ")"
                : "No emergency red-flag signs checked"
            }`
          ]
        : [
            `=== RINGKASAN SIMPTOM PENING / VERTIGO UNTUK DOKTOR (${today}) ===`,
            `1. Sifat Pening Utama: ${getSelectOrInputText(docSensationEl)}`,
            `2. Durasi Satu Episod: ${getSelectOrInputText(docDurationEl)}`,
            `3. Pencetus Serangan: ${getSelectOrInputText(docTriggerEl)}`,
            `4. Simptom Telinga / Iringan: ${getSelectOrInputText(docAssocEl)}`,
            `5. Ubat Sedang Diambil / Penyakit Sedia Ada: ${getSelectOrInputText(docMedsEl) || "Tiada dinyatakan"}`,
            `6. Saringan Tanda Bahaya (5D / Imbangan / Jantung / Leher): ${
              redChecked.length
                ? "ADA (" + redChecked.join("; ") + ")"
                : "Tiada tanda bahaya merah ditandakan"
            }`
          ];

      // Append Patient Attack Diary entries if enabled and populated
      if (!docIncludeDiaryEl || docIncludeDiaryEl.checked) {
        const diaryEntries = getStoredDiaryEntries();
        if (diaryEntries.length > 0) {
          const stats = computeDiaryStats(diaryEntries, en);
          lines.push(`--------------------------------------------------------------`);
          if (en) {
            lines.push(
              `PATIENT ATTACK LOGBOOK (${stats.total} logged | Top Trigger: ${stats.topTriggerLabel} | Avg Severity: ${stats.avgSeverity}):`
            );
          } else {
            lines.push(
              `REKOD DIARI SERANGAN PESAKIT (${stats.total} episod | Pencetus Utama: ${stats.topTriggerLabel} | Purata Teruk: ${stats.avgSeverity}):`
            );
          }
          diaryEntries.slice(0, 8).forEach((entry, i) => {
            const dtStr = formatDiaryDateTime(entry.datetime, en);
            const sensStr = DIARY_LABELS.sensation[langKey][entry.sensation] || entry.sensation;
            const durStr = DIARY_LABELS.duration[langKey][entry.duration] || entry.duration;
            const trigStr = DIARY_LABELS.trigger[langKey][entry.trigger] || entry.trigger;
            const notePart = entry.notes ? ` | ${en ? "Note" : "Nota"}: ${entry.notes}` : "";
            lines.push(
              `  ${i + 1}) [${dtStr}] ${sensStr} • ${durStr} • ${trigStr} • ${en ? "Severity" : "Teruk"}: ${entry.severity}/10${notePart}`
            );
          });
        }
      }

      lines.push(`--------------------------------------------------------------`);
      lines.push(
        en
          ? `Questions for Doctor: Could you help check whether this represents peripheral vertigo (e.g., BPPV for Dix-Hallpike / Supine Roll & Epley / BBQ Roll / Gufoni), Vestibular Migraine / Meniere's, orthostatic blood pressure drop, or requires a HINTS Plus exam?`
          : `Soalan untuk Doktor: Mohon semakan sama ada ini berpunca daripada vertigo periferi (cth: BPPV untuk ujian Dix-Hallpike / Supine Roll & Epley / BBQ Roll / Gufoni), Migrain Vestibular / Meniere, tekanan darah ortostatik, atau memerlukan pemeriksaan HINTS Plus.`
      );

      return lines.join("\n");
    }

    function updateDocPreview() {
      const txt = buildDoctorSummaryText();
      if (docPreview) docPreview.value = txt;
      if (printReportDiv) printReportDiv.textContent = txt;
    }

    window.refreshDoctorNotePreview = updateDocPreview;

    // Auto-populate Doctor Note from Smart Triage Form
    window.syncDoctorNoteFromTriage = function (triageState, triggerEl) {
      if (triageState) {
        setSelectValueIfValid(docSensationEl, triageState.sensation);

        const durMap = {
          under1m: "under1m",
          "1to20m": "1to20m",
          minsToHours: "minsToHours",
          hoursToDays: "hoursToDays",
          continuousAcute: "hoursToDays"
        };
        if (triageState.sensation === "swayingChronic") {
          setSelectValueIfValid(docDurationEl, "chronicMonths");
        } else if (durMap[triageState.duration]) {
          setSelectValueIfValid(docDurationEl, durMap[triageState.duration]);
        }

        const trigMap = {
          positional: "positional",
          postViral: "postViral",
          spontaneous: "spontaneous",
          sleepStressLight: "sleepStressLight",
          vascularRisk: "vascularNeck"
        };
        if (triageState.sensation === "lightheaded") {
          setSelectValueIfValid(docTriggerEl, "standing");
        } else if (trigMap[triageState.trigger]) {
          setSelectValueIfValid(docTriggerEl, trigMap[triageState.trigger]);
        }

        const earMap = {
          none: "none",
          meniereTriad: "meniereTriad",
          suddenDeafness: "suddenDeafness",
          photophobia: "photoPhonoAura"
        };
        if (triageState.redFlags && triageState.redFlags.has("syncopeCardiac")) {
          setSelectValueIfValid(docAssocEl, "cardiacSyncope");
        } else if (earMap[triageState.ear]) {
          setSelectValueIfValid(docAssocEl, earMap[triageState.ear]);
        }

        // Sync matching Quick-Help Red Flag checkboxes
        if (triageState.redFlags) {
          const rf = triageState.redFlags;
          const setRfCb = (key, cond) => {
            const cb = modal.querySelector(`.qh-redflag-cb[data-rf-key="${key}"]`);
            if (cb && cond) cb.checked = true;
          };
          setRfCb(
            "diplopiaSpeech",
            rf.has("diplopia") || rf.has("dysarthria") || rf.has("dysphagia")
          );
          setRfCb("numbnessDysmetria", rf.has("numbness") || rf.has("dysmetria"));
          setRfCb("ataxia", rf.has("ataxia"));
          setRfCb(
            "deafnessNeck",
            rf.has("neckDissection") || triageState.ear === "suddenDeafness"
          );
          setRfCb("cardiacSyncope", rf.has("syncopeCardiac"));
          setRfCb(
            "firstAvsVascular",
            triageState.duration === "continuousAcute" && triageState.trigger === "vascularRisk"
          );
          evaluateQuickRedFlags();
        }

        saveDocProfile();
        updateDocPreview();
      }
      openModal("step4", triggerEl);
    };

    [docSensationEl, docDurationEl, docTriggerEl, docAssocEl, docMedsEl, docIncludeDiaryEl].forEach(
      (el) => {
        if (!el) return;
        const onFieldChange = () => {
          saveDocProfile();
          updateDocPreview();
        };
        el.addEventListener("input", onFieldChange);
        el.addEventListener("change", onFieldChange);
      }
    );

    qhRedChecks.forEach((cb) => cb.addEventListener("change", updateDocPreview));

    if (copyDocBtn) {
      copyDocBtn.addEventListener("click", () => {
        const txt = buildDoctorSummaryText();
        copyTextWithFallback(txt).then((copied) => {
          copyDocBtn.textContent = copied
            ? isEn()
              ? "✅ Doctor Note Copied! (Paste in WhatsApp/Notes)"
              : "✅ Nota Doktor Disalin! (Tampal di WhatsApp/Nota)"
            : isEn()
            ? "✅ Select & Copy from Preview Box Above"
            : "✅ Sila Salin dari Kotak Pratonton Di Atas";
          setTimeout(() => {
            copyDocBtn.textContent = isEn()
              ? "📋 Copy Note for Doctor / WhatsApp"
              : "📋 Salin Nota Untuk Doktor / WhatsApp";
          }, 2600);
        });
      });
    }

    if (printDocBtn) {
      printDocBtn.addEventListener("click", () => {
        const txt = buildDoctorSummaryText();
        if (printReportDiv) {
          printReportDiv.textContent = txt;
        }
        document.body.classList.add("printing-doc-note");
        const cleanupPrint = () => {
          document.body.classList.remove("printing-doc-note");
          window.removeEventListener("afterprint", cleanupPrint);
        };
        window.addEventListener("afterprint", cleanupPrint);
        window.print();
        // Safe fallback cleanup for browsers that fire afterprint synchronously or skip it
        setTimeout(cleanupPrint, 1500);
      });
    }

    loadSavedDocProfile();
    syncBreathMotionUI();
    evaluateQuickRedFlags();
    renderActivePatternCard();
    updateDocPreview();

    langRefreshCallbacks.push(() => {
      syncBreathMotionUI();
      renderBreathingTick();
      evaluateQuickRedFlags();
      renderActivePatternCard();
      updateDocPreview();
    });
  }

  // --------------------------------------------------------------------------
  // MATRIKS PINTAR PUNCA UTAMA VERTIGO (KEYBOARD ACCESSIBLE + EMPTY STATE)
  // --------------------------------------------------------------------------
  function initCausesMatrix() {
    const tbody = document.getElementById("causesMatrixBody");
    const pearlBox = document.getElementById("matrixActivePearl");
    if (!tbody) return;

    let activeFilter = "all";
    let searchQuery = "";
    let selectedCauseId = null;

    function renderPearl() {
      if (!pearlBox) return;
      const en = isEn();
      if (selectedCauseId) {
        const item = window.VERTIGO_DATA.causesMatrix.find((c) => c.id === selectedCauseId);
        if (item) {
          pearlBox.innerHTML = en
            ? `<strong>💡 Audited Clinical Pearl (${escapeHtml(item.name)} — ${escapeHtml(item.prevalence)}):</strong> ${escapeHtml(item.pearl)}`
            : `<strong>💡 Fakta Klinikal Diaudit (${escapeHtml(item.name)} — ${escapeHtml(item.prevalence)}):</strong> ${escapeHtml(item.pearl)}`;
          return;
        }
      }
      pearlBox.innerHTML = en
        ? `<strong>💡 Click or Press Enter on Any Row Above:</strong> View full audited clinical pearls including the <em>AICA stroke</em> alert (sudden deafness + vertigo) and official <em>Bárány Society</em> criteria.`
        : `<strong>💡 Klik atau Tekan Enter Pada Mana-Mana Baris Di Atas:</strong> Lihat fakta klinikal penuh termasuk amaran <em>strok arteri AICA</em> (pekak mendadak + vertigo) dan kriteria rasmi <em>Bárány Society</em>.`;
    }

    function selectRow(causeId) {
      selectedCauseId = causeId;
      tbody.querySelectorAll("tr[data-cause-id]").forEach((r) => {
        const isSel = r.getAttribute("data-cause-id") === causeId;
        r.classList.toggle("selected-row", isSel);
        r.setAttribute("aria-selected", String(isSel));
      });
      renderPearl();
      window.markModuleExplored("matrix");
    }

    function renderRows() {
      const en = isEn();
      const list = window.VERTIGO_DATA.causesMatrix.filter((item) => {
        const matchesFilter = activeFilter === "all" || item.durationTag === activeFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.fullName.toLowerCase().includes(q) ||
          item.trigger.toLowerCase().includes(q) ||
          item.earSymptoms.toLowerCase().includes(q) ||
          item.treatment.toLowerCase().includes(q) ||
          item.pearl.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
      });

      tbody.innerHTML = "";

      if (list.length === 0) {
        const emptyTr = document.createElement("tr");
        emptyTr.innerHTML = `
          <td colspan="5">
            <div class="empty-state-box">
              ${
                en
                  ? `No matching diagnosis found for "<strong>${escapeHtml(searchQuery.trim())}</strong>" under the current filter. Try selecting "All Causes (6)" or clearing your search.`
                  : `Tiada diagnosis sepadan ditemui untuk "<strong>${escapeHtml(searchQuery.trim())}</strong>" pada penapis semasa. Cuba pilih "Semua Punca (6)" atau kosongkan kotak carian.`
              }
            </div>
          </td>
        `;
        tbody.appendChild(emptyTr);
        renderPearl();
        return;
      }

      list.forEach((item) => {
        const tr = document.createElement("tr");
        const isSelected = item.id === selectedCauseId;
        const classes = [];
        if (item.dangerLevel === "critical") classes.push("row-critical");
        if (isSelected) classes.push("selected-row");
        tr.className = classes.join(" ");
        tr.setAttribute("data-cause-id", item.id);
        tr.tabIndex = 0;
        tr.setAttribute("aria-selected", String(isSelected));

        const badgeClass =
          item.dangerLevel === "critical"
            ? "pill-danger"
            : item.dangerLevel === "moderate"
            ? "pill-warn"
            : "pill-ok";

        tr.innerHTML = `
          <td>
            <div class="cause-name-cell">
              <strong>${escapeHtml(item.name)}</strong>
              <span class="pill-badge ${badgeClass}">${escapeHtml(item.type)}</span>
            </div>
            <div class="cell-sub">${escapeHtml(item.fullName)}</div>
          </td>
          <td><strong>${escapeHtml(item.duration)}</strong></td>
          <td>${escapeHtml(item.trigger)}</td>
          <td>${escapeHtml(item.earSymptoms)}</td>
          <td><span class="treatment-highlight">${escapeHtml(item.treatment)}</span></td>
        `;

        tr.addEventListener("click", () => selectRow(item.id));
        tr.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectRow(item.id);
          }
        });

        tbody.appendChild(tr);
      });
      renderPearl();
    }

    document.querySelectorAll("[data-matrix-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.getAttribute("data-matrix-filter");
        document.querySelectorAll("[data-matrix-filter]").forEach((b) => {
          const isCurr = b === btn;
          b.classList.toggle("active", isCurr);
          b.setAttribute("aria-pressed", String(isCurr));
        });
        renderRows();
        window.markModuleExplored("matrix");
      });
    });

    const searchInput = document.getElementById("matrixSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value;
        renderRows();
      });
    }

    renderRows();
    langRefreshCallbacks.push(renderRows);
  }

  // --------------------------------------------------------------------------
  // ENJIN TRIAJ DIAGNOSTIK PINTAR (AUDITED SAFETY GATES & NORMALIZED 100%)
  // --------------------------------------------------------------------------
  function initIntelligentTriage() {
    const form = document.getElementById("triageForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
    });

    const state = {
      sensation: "spinning",
      duration: "under1m",
      trigger: "positional",
      ear: "none",
      redFlags: new Set()
    };

    const docBtn = document.getElementById("triageGenerateDocNoteBtn");
    if (docBtn) {
      docBtn.addEventListener("click", () => {
        if (typeof window.syncDoctorNoteFromTriage === "function") {
          window.syncDoctorNoteFromTriage(state, docBtn);
        }
      });
    }

    function normalizePercentages(items) {
      const totalScore = items.reduce((acc, it) => acc + it.rawScore, 0) || 1;
      const withExact = items.map((it, idx) => {
        const exact = (it.rawScore / totalScore) * 100;
        const floored = Math.floor(exact);
        return {
          ...it,
          idx,
          pct: floored,
          remainder: exact - floored
        };
      });

      let diff = 100 - withExact.reduce((acc, it) => acc + it.pct, 0);
      const byRemainder = [...withExact].sort((a, b) => b.remainder - a.remainder);
      let i = 0;
      while (diff > 0 && byRemainder.length > 0) {
        byRemainder[i % byRemainder.length].pct += 1;
        diff--;
        i++;
      }

      return withExact.sort((a, b) => b.pct - a.pct || b.rawScore - a.rawScore);
    }

    function computeAssessment() {
      const container = document.getElementById("triageResultsOutput");
      if (!container) return;
      const en = isEn();

      // CRITICAL SAFETY GATE: NEVER early-return benign Orthostatic or PPPD banners
      // when ANY red flag, sudden unilateral deafness, acute continuous onset, or vascular risk is selected!
      const hasHighRiskBypass =
        state.redFlags.size > 0 ||
        state.ear === "suddenDeafness" ||
        state.duration === "continuousAcute" ||
        state.trigger === "vascularRisk";

      if (state.sensation === "lightheaded" && !hasHighRiskBypass) {
        container.innerHTML = en
          ? `
            <div class="alert-banner alert-warn">
              <strong>⚠️ NOT TRUE INNER-EAR VERTIGO (Suspect Presyncope / Orthostatic Hypotension)</strong>
              <p style="margin:6px 0 0;">
                Feeling faint, lightheaded, or seeing your vision dim (especially when standing up quickly) usually stems from orthostatic blood pressure drops, dehydration, anemia, low blood sugar, or blood pressure/cardiac medication effects—<strong>not</strong> BPPV ear crystals.
              </p>
              <p style="margin:8px 0 0;">
                👉 <strong>Recommended Action:</strong> Hydrate well, stand up in 2 stages, and ask your doctor to check <strong>lying &amp; standing blood pressure</strong> plus pulse/ECG if accompanied by palpitations or fainting. Avoid inner-ear vertigo pills!
              </p>
            </div>
          `
          : `
            <div class="alert-banner alert-warn">
              <strong>⚠️ BUKAN VERTIGO TELINGA SEBENAR (Suspek Presyncope / Hipotensi Ortostatik)</strong>
              <p style="margin:6px 0 0;">
                Rasa gelap mata, kepala ringan, atau hampir pitam (terutamanya semasa bangun berdiri cepat) lazimnya berpunca daripada penurunan tekanan darah ortostatik, dehidrasi, kurang darah (anemia), gula rendah, atau kesan ubat darah tinggi/jantung—<strong>bukan</strong> hablur kristal BPPV.
              </p>
              <p style="margin:8px 0 0;">
                👉 <strong>Langkah Tepat:</strong> Minum air secukupnya, bangun secara berperingkat, dan minta doktor periksa <strong>tekanan darah baring &amp; berdiri</strong> serta nadi/ECG jika disertai berdebar atau pernah pengsan. Elakkan pil tahan pening telinga!
              </p>
            </div>
          `;
        return;
      }

      if (state.sensation === "swayingChronic" && !hasHighRiskBypass) {
        container.innerHTML = en
          ? `
            <div class="alert-banner alert-safe">
              <strong>🛒 PPPD PATTERN (Persistent Postural-Perceptual Dizziness) / Chronic Imbalance</strong>
              <p style="margin:6px 0 0;">
                Non-spinning swaying or rocking nearly every day (&gt;3 months) worsened by upright posture, walking, or busy visual environments (supermarket aisles, scrolling screens) aligns closely with Bárány Society criteria for <strong>PPPD</strong>.
              </p>
              <p style="margin:8px 0 0;">
                👉 <strong>Recommended Action:</strong> Stop daily vestibular suppressant pills, and consult a doctor or vestibular physiotherapist for graded <strong>Vestibular Rehabilitation Therapy (VRT)</strong> habituation.
              </p>
            </div>
          `
          : `
            <div class="alert-banner alert-safe">
              <strong>🛒 CORAK PPPD (Persistent Postural-Perceptual Dizziness) / Ketidakseimbangan Kronik</strong>
              <p style="margin:6px 0 0;">
                Rasa terhuyung-hayang atau melayang tanpa pusingan jelas hampir setiap hari (&gt;3 bulan) yang bertambah teruk semasa berdiri, berjalan, atau melihat persekitaran sibuk (pasar raya, skrol telefon) sangat bertepatan dengan kriteria Bárány bagi <strong>PPPD</strong>.
              </p>
              <p style="margin:8px 0 0;">
                👉 <strong>Langkah Tepat:</strong> Hentikan pergantungan pada pil tahan pening, dan bincang bersama doktor/fisioterapi untuk <strong>Latihan Habituasi Rehabilitasi Vestibular (VRT)</strong>.
              </p>
            </div>
          `;
        return;
      }

      const scores = {
        bppv: 6,
        neuritis: 6,
        meniere: 6,
        migraine: 6,
        stroke: 6
      };
      const reasons = [];

      // Red Flags Evaluation (including Cardiac Syncope & Vertebral Dissection)
      if (state.redFlags.size > 0) {
        scores.stroke += 92;
        scores.bppv = Math.max(2, scores.bppv - 5);
        reasons.push(
          en
            ? `🚨 <strong>Emergency Red Flags Detected (${state.redFlags.size} sign${state.redFlags.size > 1 ? "s" : ""}):</strong> Neurological 5D signs, truncal ataxia (unable to stand), fainting/chest pain, or acute neck pain require immediate emergency assessment.`
            : `🚨 <strong>Tanda Bahaya Merah Dikesan (${state.redFlags.size} tanda):</strong> Tanda saraf 5D, gagal berdiri sendiri, pitam/sakit dada, atau sakit leher akut memerlukan penilaian kecemasan segera.`
        );
        if (state.redFlags.has("neckDissection")) {
          scores.stroke += 25;
          reasons.push(
            en
              ? "🩸 <strong>Vertebral Artery Dissection Alert:</strong> Acute new neck pain or vertigo after neck trauma/massage/manipulation is a critical warning for posterior circulation stroke even in younger adults!"
              : "🩸 <strong>Amaran Diseksi Arteri Vertebra:</strong> Sakit leher baru mendadak atau vertigo selepas trauma/urut/manipulasi leher ialah amaran kritikal strok edaran posterior walaupun pada usia muda!"
          );
        }
        if (state.redFlags.has("syncopeCardiac")) {
          scores.stroke += 20;
          reasons.push(
            en
              ? "❤️ <strong>Cardiac / Syncope Emergency Alert:</strong> Actual fainting (loss of consciousness), chest pain, or racing palpitations points toward dangerous cardiac arrhythmia, structural heart disease, or neurovascular compromise—seek emergency ECG &amp; medical evaluation!"
              : "❤️ <strong>Amaran Kecemasan Jantung / Pitam:</strong> Pengsan sebenar, sakit dada, atau jantung berdebar laju menandakan risiko aritmia jantung berbahaya, masalah injap/jantung, atau gangguan vaskular—segera dapatkan pemeriksaan ECG &amp; doktor kecemasan!"
          );
        }
      }

      // Duration + Trigger Interaction (Fixes non-positional <1m BPPV over-scoring & adds 1-20m TIA/VM window)
      if (state.duration === "under1m") {
        if (state.trigger === "positional") {
          scores.bppv += 56;
          scores.meniere -= 4;
          scores.neuritis -= 4;
          reasons.push(
            en
              ? "⏱️ <strong>Duration &lt; 1 minute + Positional Trigger:</strong> Classic Bárány &amp; AAO-HNS signature of otoconia crystals settling inside a semicircular canal (BPPV)."
              : "⏱️ <strong>Durasi &lt; 1 minit + Pencetus Posisi Kepala:</strong> Ciri diagnostik klasik Bárány &amp; AAO-HNS bagi hablur kristal otoconia bergolek di dalam saluran separuh bulat (BPPV)."
          );
        } else {
          // Non-positional <1m attack: penalize BPPV, elevate Stroke/TIA & Migraine!
          scores.bppv -= 4;
          scores.stroke += 28;
          scores.migraine += 24;
          reasons.push(
            en
              ? "⚠️ <strong>Atypical Brief (&lt;1 min) Non-Positional Episode:</strong> True BPPV is triggered by head movement; brief spontaneous spinning at rest warrants evaluation for <strong>Vertebrobasilar TIA</strong>, Vestibular Migraine, or vestibular paroxysmia!"
              : "⚠️ <strong>Serangan Singkat (&lt;1 minit) Tanpa Pencetus Posisi:</strong> BPPV sebenar dicetuskan oleh gerakan kepala; pusing singkat secara spontan semasa diam memerlukan saringan <strong>TIA Vertebrobasilar</strong>, Migrain Vestibular, atau paroksisma vestibular!"
          );
        }
      } else if (state.duration === "1to20m") {
        scores.bppv -= 4;
        scores.migraine += 34;
        scores.stroke += 32;
        scores.meniere += 12;
        if (state.trigger === "positional") {
          scores.bppv += 10;
        }
        reasons.push(
          en
            ? "⏱️ <strong>Duration 1 to 20 minutes:</strong> Longer than typical canalithiasis BPPV (&lt;1 min) and shorter than Meniere's (&ge;20 min)—critically captures <strong>Vertebrobasilar TIA</strong> (transient posterior ischemia) and <strong>short Vestibular Migraine</strong>!"
            : "⏱️ <strong>Durasi 1 hingga 20 minit:</strong> Melebihi tempoh lazim BPPV (&lt;1 minit) dan lebih pendek daripada Meniere (&ge;20 minit)—julat kritikal untuk menyaring <strong>TIA Vertebrobasilar</strong> (iskemia sepintas batang otak) dan <strong>Migrain Vestibular pendek</strong>!"
        );
      } else if (state.duration === "minsToHours") {
        scores.meniere += 36;
        scores.migraine += 34;
        scores.bppv -= 4;
        reasons.push(
          en
            ? "⏱️ <strong>Duration 20 mins – 12 hours:</strong> Official Bárány diagnostic time window for Meniere's Disease and Vestibular Migraine."
            : "⏱️ <strong>Durasi 20 minit – 12 jam:</strong> Julat diagnostik rasmi Bárány bagi Penyakit Meniere dan Vestibular Migraine."
        );
      } else if (state.duration === "hoursToDays") {
        scores.neuritis += 38;
        scores.migraine += 26;
        scores.stroke += 20;
        scores.bppv -= 4;
        reasons.push(
          en
            ? "⏱️ <strong>Lasting Days:</strong> Typical of Vestibular Neuritis or prolonged Vestibular Migraine, though central posterior stroke screening remains mandatory."
            : "⏱️ <strong>Berterusan Berhari-hari:</strong> Lazim bagi Vestibular Neuritis atau Vestibular Migraine panjang, namun saringan strok sentral tetap wajib dilakukan."
        );
      } else if (state.duration === "continuousAcute") {
        scores.stroke += 42;
        scores.neuritis += 34;
        scores.bppv -= 5;
        reasons.push(
          en
            ? "⏱️ <strong>Acute Vestibular Syndrome (Sudden Continuous):</strong> Per GRACE-3 guidelines, posterior stroke MUST be screened urgently using the HINTS Plus protocol!"
            : "⏱️ <strong>Acute Vestibular Syndrome (Berterusan Mendadak):</strong> Mengikut garis panduan GRACE-3, wajib saring Strok Posterior segera menggunakan protokol HINTS Plus!"
        );
      }

      // Trigger Evaluation
      if (state.trigger === "positional") {
        if (state.duration === "under1m") {
          scores.bppv += 40;
        } else if (state.duration === "continuousAcute") {
          scores.stroke += 12;
          reasons.push(
            en
              ? "📌 <strong>GRACE-3 Pitfall Note:</strong> Ongoing continuous vertigo that merely <em>worsens</em> with head movement is NOT BPPV—both Vestibular Neuritis and Posterior Stroke feel worse when moving the head!"
              : "📌 <strong>Nota Perangkap GRACE-3:</strong> Vertigo berterusan yang sekadar <em>bertambah teruk</em> bila kepala bergerak BUKANLAH BPPV—kedua-dua Neuritis dan Strok Posterior memang terasa lebih loya apabila kepala digerakkan!"
          );
        } else {
          scores.bppv += 8;
          scores.migraine += 10;
        }
      } else if (state.trigger === "postViral") {
        scores.neuritis += 42;
        scores.bppv -= 3;
        reasons.push(
          en
            ? "🦠 <strong>Post-Viral Onset:</strong> Classic trigger for acute vestibular nerve inflammation (Vestibular Neuritis)."
            : "🦠 <strong>Pasca-Jangkitan Virus:</strong> Pencetus klasik keradangan saraf keseimbangan (Vestibular Neuritis)."
        );
      } else if (state.trigger === "spontaneous") {
        scores.bppv -= 5;
        scores.meniere += 22;
        scores.migraine += 20;
        scores.stroke += 24;
        scores.neuritis += 16;
      } else if (state.trigger === "sleepStressLight") {
        scores.bppv -= 3;
        scores.migraine += 44;
        reasons.push(
          en
            ? "💡 <strong>Poor Sleep / Stress / Bright Glare:</strong> Core neuro-sensory triggers for Vestibular Migraine."
            : "💡 <strong>Kurang Tidur / Stres / Silau:</strong> Pencetus neuro-sensori utama bagi Vestibular Migraine."
        );
      } else if (state.trigger === "vascularRisk") {
        scores.bppv -= 5;
        scores.stroke += 48;
        reasons.push(
          en
            ? "🩸 <strong>Vascular Risk Profile (Hypertension / Diabetes / Heart Disease / Acute Neck Pain):</strong> Significantly raises pretest probability of posterior circulation stroke or TIA."
            : "🩸 <strong>Profil Risiko Vaskular (Darah Tinggi / Diabetes / Sakit Jantung / Sakit Leher Akut):</strong> Meningkatkan kebarangkalian strok atau TIA edaran posterior dengan ketara."
        );
      }

      // Ear / Sensory Symptoms Evaluation
      if (state.ear === "none") {
        if (state.trigger === "positional" && state.duration === "under1m") {
          scores.bppv += 14;
        }
        scores.neuritis += 10;
      } else if (state.ear === "meniereTriad") {
        scores.meniere += 50;
        scores.bppv -= 4;
        reasons.push(
          en
            ? "👂 <strong>Unilateral Tinnitus + Aural Fullness + Fluctuating Hearing Loss:</strong> Classic Bárány Society triad for Meniere's Disease."
            : "👂 <strong>Tinnitus + Telinga Penuh + Kurang Pendengaran Sebelah:</strong> Triad diagnostik rasmi Bárány Society bagi Penyakit Meniere."
        );
      } else if (state.ear === "suddenDeafness") {
        scores.stroke += 44;
        scores.neuritis += 26;
        scores.bppv -= 5;
        reasons.push(
          en
            ? "🚨 <strong>HINTS PLUS ALERT (New Sudden Unilateral Deafness + Vertigo):</strong> May represent viral <em>Labyrinthitis</em> OR an <strong>AICA artery stroke</strong> supplying both the inner ear and brainstem—urgent hospital evaluation mandatory!"
            : "🚨 <strong>AMARAN HINTS PLUS (Pekak Mendadak Sebelah Telinga + Vertigo):</strong> Boleh menandakan <em>Labyrinthitis</em> ATAU <strong>strok arteri AICA</strong> yang membekalkan darah ke telinga dalam &amp; batang otak—wajib dinilai segera di hospital!"
        );
      } else if (state.ear === "photophobia") {
        scores.migraine += 44;
        scores.bppv -= 3;
        reasons.push(
          en
            ? "✨ <strong>Photophobia, Bilateral Phonophobia (Sound Sensitivity) &amp; Visual Aura:</strong> Key Bárány diagnostic features of Vestibular Migraine—even when throbbing headache is absent!"
            : "✨ <strong>Fotofobia (Silau), Fonofobia Dua Hala (Sensitif Bunyi) &amp; Aura Visual:</strong> Kriteria diagnostik utama Vestibular Migraine walaupun berlaku tanpa sakit kepala berdenyut!"
        );
      }

      const keys = Object.keys(scores);
      keys.forEach((k) => {
        if (scores[k] < 2) scores[k] = 2;
      });

      const labelMap = en
        ? {
            bppv: {
              title: "BPPV (Loose Inner-Ear Crystals)",
              action:
                "Confirm via Dix-Hallpike / Supine Roll & perform Epley, BBQ Roll, or Gufoni (avoid chronic dizziness pills)."
            },
            neuritis: {
              title:
                state.ear === "suddenDeafness"
                  ? "Labyrinthitis (Must Rule Out AICA Stroke First!)"
                  : "Vestibular Neuritis (Nerve Inflammation)",
              action:
                "Confirm peripheral HINTS Plus exam with a doctor, cap anti-nausea meds at ≤72h, then start VRT."
            },
            meniere: {
              title: "Meniere's Disease (Endolymphatic Hydrops)",
              action:
                "Limit sodium <1,500–2,000 mg/day, reduce caffeine, obtain audiometry & ENT specialist care."
            },
            migraine: {
              title: "Vestibular Migraine",
              action:
                "Stabilize sleep, meals & hydration, manage light/sound triggers, discuss migraine prophylaxis."
            },
            stroke: {
              title: "Posterior Stroke / Vascular TIA (Emergency!)",
              action:
                "GO IMMEDIATELY TO HOSPITAL EMERGENCY (Call 999 / 911)! Do not drive yourself."
            }
          }
        : {
            bppv: {
              title: "BPPV (Hablur Kristal Telinga)",
              action:
                "Sahkan melalui Dix-Hallpike / Supine Roll & lakukan Epley, BBQ Roll, atau Gufoni (elak pil tahan pening berpanjangan)."
            },
            neuritis: {
              title:
                state.ear === "suddenDeafness"
                  ? "Labyrinthitis (Wajib Tolak Strok AICA Dahulu!)"
                  : "Vestibular Neuritis (Keradangan Saraf)",
              action:
                "Sahkan HINTS Plus periferi oleh doktor, hadkan ubat muntah ≤72 jam, dan mulakan latihan VRT."
            },
            meniere: {
              title: "Penyakit Meniere (Hidrops Cecair)",
              action:
                "Hadkan natrium <1,500–2,000 mg/hari, kurangkan kafein, ujian audiometri & rujukan Pakar ENT."
            },
            migraine: {
              title: "Vestibular Migraine",
              action:
                "Stabilkan jadual tidur, waktu makan & hidrasi, urus silau/bunyi, bincang profilaksis bersama doktor."
            },
            stroke: {
              title: "Strok Posterior / TIA Vaskular (Kecemasan!)",
              action:
                "SEGERA KE JABATAN KECEMASAN HOSPITAL (999)! Jangan memandu sendiri."
            }
          };

      const ranked = normalizePercentages(
        keys.map((k) => ({
          key: k,
          rawScore: scores[k],
          title: labelMap[k].title,
          action: labelMap[k].action
        }))
      );

      const isEmergency =
        state.redFlags.size > 0 ||
        ranked[0].key === "stroke" ||
        state.ear === "suddenDeafness" ||
        state.trigger === "vascularRisk";

      let html = "";
      if (isEmergency) {
        html += en
          ? `
            <div class="alert-banner alert-critical" style="margin-bottom:14px;">
              <strong>🚑 RED-FLAG EMERGENCY ALERT: URGENT HOSPITAL ASSESSMENT REQUIRED!</strong>
              <div style="margin-top:4px;">This symptom profile carries elevated risk for a central vascular or cardiac cause (brainstem/cerebellar stroke, TIA, AICA stroke, vertebral dissection, or arrhythmia). Seek urgent emergency care (999 / 911) and do not attempt home head maneuvers.</div>
            </div>
          `
          : `
            <div class="alert-banner alert-critical" style="margin-bottom:14px;">
              <strong>🚑 AMARAN KECEMASAN MERAH: PERLU PENILAIAN HOSPITAL SEGERA!</strong>
              <div style="margin-top:4px;">Gabungan simptom ini membawa risiko punca vaskular sentral atau jantung (strok batang otak/serebelum, TIA, strok AICA, diseksi vertebra, atau aritmia). Dapatkan rawatan kecemasan segera (999) dan jangan cuba manuver kepala di rumah.</div>
            </div>
          `;
      }

      html += `<div class="prob-list">`;
      ranked.forEach((item, index) => {
        const isStroke = item.key === "stroke";
        const barColor = isStroke ? "#ef4444" : index === 0 ? "#0284c7" : "#64748b";
        const pctClass = isStroke
          ? "prob-pct text-status-danger"
          : index === 0
          ? "prob-pct text-status-info"
          : "prob-pct";

        html += `
          <div class="prob-item ${index === 0 ? "prob-top" : ""}">
            <div class="prob-row-head">
              <span><strong>${index + 1}. ${escapeHtml(item.title)}</strong></span>
              <span class="${pctClass}">${item.pct}%</span>
            </div>
            <div class="prob-bar-track">
              <div class="prob-bar-fill" style="width:${item.pct}%; background:${barColor};"></div>
            </div>
            ${
              index === 0
                ? `<div class="prob-action">👉 <strong>${
                    en ? "Recommended Next Step:" : "Cadangan Langkah Seterusnya:"
                  }</strong> ${escapeHtml(item.action)}</div>`
                : ""
            }
          </div>
        `;
      });
      html += `</div>`;

      if (reasons.length > 0) {
        html += `<div class="reasoning-box"><h4>${
          en ? "🧠 Audited Clinical Reasoning:" : "🧠 Analisis Fakta Perubatan:"
        }</h4><ul>${reasons.map((r) => `<li>${r}</li>`).join("")}</ul></div>`;
      }

      container.innerHTML = html;
    }

    form.querySelectorAll("select, input[type='radio']").forEach((el) => {
      el.addEventListener("change", () => {
        const name = el.getAttribute("name");
        if (name && Object.prototype.hasOwnProperty.call(state, name)) {
          state[name] = el.value;
          computeAssessment();
          window.markModuleExplored("triage");
        }
      });
    });

    form.querySelectorAll("input[data-red-flag]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const flag = cb.getAttribute("data-red-flag");
        if (cb.checked) state.redFlags.add(flag);
        else state.redFlags.delete(flag);
        computeAssessment();
        window.markModuleExplored("triage");
      });
    });

    computeAssessment();
    langRefreshCallbacks.push(computeAssessment);
  }

  // --------------------------------------------------------------------------
  // BPPV POSITIONAL SIDE-FINDER ("WHICH EAR & WHICH CANAL?")
  // --------------------------------------------------------------------------
  function initBppvSideFinder() {
    const container = document.getElementById("bppvSideFinder");
    const moveSel = document.getElementById("sfMovementSelect");
    const settleSel = document.getElementById("sfSettleSelect");
    const resultBox = document.getElementById("sfResultBox");
    if (!container || !moveSel || !settleSel || !resultBox) return;

    function renderSideFinder() {
      const en = isEn();
      const mv = moveSel.value;
      const st = settleSel.value;

      // Red-Flag Stopper if atypical/central or non-stop >60s
      if (mv === "central_redflag" || st === "no_nonstop") {
        resultBox.innerHTML = en
          ? `
            <div class="alert-banner alert-critical">
              <strong>🛑 STOP — DO NOT PERFORM HOME BPPV MANEUVERS!</strong>
              <p style="margin:6px 0 10px;">
                Typical canalithiasis BPPV has a brief 2–10 second delay and <strong>stops within 60 seconds</strong> when your head stays still. Spinning that starts instantaneously, persists non-stop (&gt;1–2 minutes) at rest, or comes with <strong>5D signs / new neck pain / sudden hearing loss</strong> may represent <strong>Central Positional Vertigo, Stroke/TIA, Vestibular Neuritis, Vestibular Migraine, or Cupulolithiasis</strong>.
              </p>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <a href="#sec-hints" class="btn-danger-solid">🚨 Check 5D &amp; HINTS Stroke Screen</a>
                <button type="button" class="btn-secondary" data-sf-open-sos>🆘 Open Emergency Helper</button>
              </div>
            </div>
          `
          : `
            <div class="alert-banner alert-critical">
              <strong>🛑 BERHENTI — JANGAN LAKUKAN MANUVER BPPV SENDIRI DI RUMAH!</strong>
              <p style="margin:6px 0 10px;">
                BPPV kanalitiasis lazimnya mempunyai sela masa 2–10 saat dan <strong>reda bawah 60 saat</strong> apabila kepala kekal pegun. Pusing yang tercetus serta-merta tanpa henti (&gt;1–2 minit) walaupun kepala diam, atau disertai <strong>tanda 5D / sakit leher baru / pekak mendadak</strong> boleh menandakan <strong>Vertigo Posisi Sentral, Strok/TIA, Vestibular Neuritis, Migrain Vestibular, atau Cupulolithiasis</strong>.
              </p>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <a href="#sec-hints" class="btn-danger-solid">🚨 Semak Saringan Strok 5D &amp; HINTS</a>
                <button type="button" class="btn-secondary" data-sf-open-sos>🆘 Buka Bantuan Kecemasan</button>
              </div>
            </div>
          `;
        const sosBtn = resultBox.querySelector("[data-sf-open-sos]");
        if (sosBtn) {
          sosBtn.addEventListener("click", () => {
            if (window.openQuickHelpModal) window.openQuickHelpModal("step2", sosBtn);
          });
        }
        return;
      }

      if (mv === "post_left" || mv === "post_right") {
        const ear = mv === "post_left" ? "left" : "right";
        const earName = en ? (ear === "left" ? "LEFT Ear" : "RIGHT Ear") : ear === "left" ? "Telinga KIRI" : "Telinga KANAN";
        resultBox.innerHTML = en
          ? `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
              <div style="flex:1; min-width:240px;">
                <strong class="text-status-ok">✅ Likely Match: Posterior Canal BPPV — ${earName}</strong>
                <p style="margin:4px 0 0; font-size:0.86rem; color:var(--text-secondary);">
                  Brief (&lt;60s) spinning provoked by lying back, looking up, or turning toward the ${ear} side matches the classic posterior canal pattern (85%–90% of BPPV). First-line maneuver: <strong>5-Step Epley (${earName})</strong>.
                </p>
              </div>
              <button type="button" class="btn-primary" data-sf-apply-maneuver="epley" data-sf-apply-ear="${ear}">
                🎯 Apply to Simulator Below (Epley • ${ear === "left" ? "Left" : "Right"})
              </button>
            </div>
          `
          : `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
              <div style="flex:1; min-width:240px;">
                <strong class="text-status-ok">✅ Padanan: BPPV Kanal Posterior — ${earName}</strong>
                <p style="margin:4px 0 0; font-size:0.86rem; color:var(--text-secondary);">
                  Pusing singkat (&lt;60s) apabila baring terlentang, mendongak, atau mengiring ke sisi ${ear === "left" ? "kiri" : "kanan"} sepadan dengan BPPV kanal posterior (85%–90% kes). Manuver utama: <strong>5 Langkah Epley (${earName})</strong>.
                </p>
              </div>
              <button type="button" class="btn-primary" data-sf-apply-maneuver="epley" data-sf-apply-ear="${ear}">
                🎯 Terapkan Pada Simulator Di Bawah (Epley • ${ear === "left" ? "Kiri" : "Kanan"})
              </button>
            </div>
          `;
      } else {
        // Horizontal Canal Geotropic (horiz_left | horiz_right)
        const ear = mv === "horiz_left" ? "left" : "right";
        const earName = en ? (ear === "left" ? "LEFT Ear" : "RIGHT Ear") : ear === "left" ? "Telinga KIRI" : "Telinga KANAN";
        resultBox.innerHTML = en
          ? `
            <div>
              <strong class="text-status-info">🌀 Likely Match: Geotropic Horizontal Canal BPPV — ${earName}</strong>
              <p style="margin:4px 0 10px; font-size:0.86rem; color:var(--text-secondary);">
                When rolling flat left and right on a pillow triggers brief (&lt;60s) spinning both ways, the side with <strong>stronger spinning (${earName})</strong> is typically the affected ear in geotropic horizontal BPPV. Choose either <strong>Lempert 360° BBQ Roll</strong> or the <strong>neck-friendly 4-Step Gufoni Maneuver</strong>:
              </p>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn-primary" data-sf-apply-maneuver="bbq" data-sf-apply-ear="${ear}">
                  🎯 Apply 360° BBQ Roll (${ear === "left" ? "Left" : "Right"} Ear)
                </button>
                <button type="button" class="btn-secondary" data-sf-apply-maneuver="gufoni" data-sf-apply-ear="${ear}">
                  🌿 Apply Neck-Friendly Gufoni (${ear === "left" ? "Left" : "Right"} Ear)
                </button>
              </div>
            </div>
          `
          : `
            <div>
              <strong class="text-status-info">🌀 Padanan: BPPV Kanal Mendatar (Geotropik) — ${earName}</strong>
              <p style="margin:4px 0 10px; font-size:0.86rem; color:var(--text-secondary);">
                Apabila pusing kepala rata kiri-kanan mencetuskan pusing singkat (&lt;60s) pada kedua-dua arah, sisi yang <strong>berpusing lebih kuat (${earName})</strong> lazimnya ialah telinga terlibat bagi BPPV mendatar geotropik. Pilih sama ada <strong>BBQ Roll 360°</strong> atau <strong>Manuver Gufoni 4 Langkah (Mesra Leher / Warga Emas)</strong>:
              </p>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn-primary" data-sf-apply-maneuver="bbq" data-sf-apply-ear="${ear}">
                  🎯 Terapkan BBQ Roll 360° (Telinga ${ear === "left" ? "Kiri" : "Kanan"})
                </button>
                <button type="button" class="btn-secondary" data-sf-apply-maneuver="gufoni" data-sf-apply-ear="${ear}">
                  🌿 Terapkan Gufoni Mesra Leher (Telinga ${ear === "left" ? "Kiri" : "Kanan"})
                </button>
              </div>
            </div>
          `;
      }

      resultBox.querySelectorAll("[data-sf-apply-maneuver]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const mType = btn.getAttribute("data-sf-apply-maneuver");
          const mEar = btn.getAttribute("data-sf-apply-ear");
          if (typeof window.setBppvManeuverSelection === "function") {
            window.setBppvManeuverSelection(mType, mEar);
          }
          window.markModuleExplored("sidefinder");
        });
      });
    }

    moveSel.addEventListener("change", () => {
      renderSideFinder();
      window.markModuleExplored("sidefinder");
    });
    settleSel.addEventListener("change", () => {
      renderSideFinder();
      window.markModuleExplored("sidefinder");
    });

    renderSideFinder();
    langRefreshCallbacks.push(renderSideFinder);
  }

  // --------------------------------------------------------------------------
  // PATIENT ATTACK LOGBOOK / EPISODE DIARY (#sec-diari)
  // --------------------------------------------------------------------------
  function initEpisodeDiary() {
    const form = document.getElementById("diaryForm");
    const dtInput = document.getElementById("diaryDatetime");
    const sensSelect = document.getElementById("diarySensation");
    const durSelect = document.getElementById("diaryDuration");
    const trigSelect = document.getElementById("diaryTrigger");
    const sevSlider = document.getElementById("diarySeverity");
    const sevValLabel = document.getElementById("diarySeverityVal");
    const notesInput = document.getElementById("diaryNotes");
    const submitBtn = document.getElementById("diarySubmitBtn");
    const openDocBtn = document.getElementById("diaryOpenDocNoteBtn");
    const clearAllBtn = document.getElementById("diaryClearAllBtn");
    const listContainer = document.getElementById("diaryEntriesList");
    const statusBanner = document.getElementById("diaryStatusBanner");
    const statTotalEl = document.getElementById("diaryStatTotal");
    const statTopTrigEl = document.getElementById("diaryStatTopTrigger");
    const statAvgSevEl = document.getElementById("diaryStatAvgSeverity");

    if (!form || !listContainer) return;

    function setDefaultNowDatetime() {
      if (!dtInput) return;
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const localIso =
        now.getFullYear() +
        "-" +
        pad(now.getMonth() + 1) +
        "-" +
        pad(now.getDate()) +
        "T" +
        pad(now.getHours()) +
        ":" +
        pad(now.getMinutes());
      dtInput.value = localIso;
    }

    setDefaultNowDatetime();

    if (sevSlider && sevValLabel) {
      sevSlider.addEventListener("input", () => {
        sevValLabel.textContent = sevSlider.value + " / 10";
      });
    }

    function showDiaryFeedback(msgMs, msgEn, toneClass) {
      if (!statusBanner) return;
      statusBanner.className = toneClass || "text-status-ok";
      statusBanner.textContent = isEn() ? msgEn : msgMs;
    }

    function renderDiary() {
      const en = isEn();
      const langKey = en ? "en" : "ms";
      const entries = getStoredDiaryEntries();
      const stats = computeDiaryStats(entries, en);

      if (statTotalEl) statTotalEl.textContent = String(stats.total);
      if (statTopTrigEl) statTopTrigEl.textContent = stats.topTriggerLabel;
      if (statAvgSevEl) statAvgSevEl.textContent = stats.avgSeverity;
      if (clearAllBtn) clearAllBtn.disabled = entries.length === 0;

      listContainer.innerHTML = "";
      if (entries.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "empty-state-box";
        emptyDiv.innerHTML = en
          ? `📓 <strong>No episodes logged yet.</strong> Record your dizziness attacks on the left so your doctor can spot exact duration and trigger patterns immediately.`
          : `📓 <strong>Belum ada episod direkodkan.</strong> Simpan butiran serangan pening di sebelah kiri supaya doktor dapat melihat corak durasi dan pencetus sebenar anda.`;
        listContainer.appendChild(emptyDiv);
        return;
      }

      entries.forEach((entry) => {
        const card = document.createElement("div");
        card.className = "diary-entry";

        const sev = Math.min(10, Math.max(1, parseInt(entry.severity, 10) || 5));
        const sevPillClass = sev >= 8 ? "pill-danger" : sev >= 5 ? "pill-warn" : "pill-ok";
        const dtFormatted = formatDiaryDateTime(entry.datetime, en);
        const sensText = DIARY_LABELS.sensation[langKey][entry.sensation] || entry.sensation;
        const durText = DIARY_LABELS.duration[langKey][entry.duration] || entry.duration;
        const trigText = DIARY_LABELS.trigger[langKey][entry.trigger] || entry.trigger;

        card.innerHTML = `
          <div class="diary-entry-head">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <strong>${escapeHtml(dtFormatted)}</strong>
              <span class="pill-badge ${sevPillClass}">${en ? "Severity" : "Teruk"}: ${sev}/10</span>
            </div>
            <button
              type="button"
              class="btn-secondary"
              data-delete-diary-id="${escapeHtml(entry.id)}"
              aria-label="${en ? "Delete this episode entry" : "Padam rekod episod ini"}"
              style="min-height:36px; padding:4px 10px; font-size:0.76rem;"
            >
              ✕ ${en ? "Delete" : "Padam"}
            </button>
          </div>
          <div class="diary-entry-meta">
            <span class="pill-badge pill-info">${escapeHtml(sensText)}</span>
            <span>⏱️ <strong>${escapeHtml(durText)}</strong></span>
            <span>• 🎯 ${escapeHtml(trigText)}</span>
          </div>
          ${
            entry.notes
              ? `<div style="font-size:0.82rem; color:var(--text-secondary); margin-top:2px;">📝 ${escapeHtml(entry.notes)}</div>`
              : ""
          }
        `;

        const delBtn = card.querySelector("[data-delete-diary-id]");
        if (delBtn) {
          delBtn.addEventListener("click", () => {
            const updated = getStoredDiaryEntries().filter((e) => e.id !== entry.id);
            safeSetJSON("vertigolab_diary", updated);
            renderDiary();
            if (window.refreshDoctorNotePreview) window.refreshDoctorNotePreview();
            showDiaryFeedback(
              "Rekod episod telah dipadam.",
              "Episode entry deleted.",
              "text-status-info"
            );
          });
        }

        listContainer.appendChild(card);
      });
    }

    function addDiaryEntry() {
      const entry = {
        id: "ep_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        datetime: dtInput && dtInput.value ? dtInput.value : new Date().toISOString(),
        sensation: sensSelect ? sensSelect.value : "spinning",
        duration: durSelect ? durSelect.value : "under1m",
        trigger: trigSelect ? trigSelect.value : "positional",
        severity: sevSlider ? Math.min(10, Math.max(1, parseInt(sevSlider.value, 10) || 5)) : 5,
        notes: notesInput ? notesInput.value.trim().slice(0, 240) : ""
      };

      const entries = getStoredDiaryEntries();
      entries.unshift(entry);
      // Sort newest first & cap at 100 entries
      entries.sort((a, b) => String(b.datetime).localeCompare(String(a.datetime)));
      safeSetJSON("vertigolab_diary", entries.slice(0, 100));

      if (notesInput) notesInput.value = "";
      setDefaultNowDatetime();
      renderDiary();
      window.markModuleExplored("diary");
      if (window.refreshDoctorNotePreview) window.refreshDoctorNotePreview();

      showDiaryFeedback(
        "✅ Episod berjaya disimpan & dilampirkan pada Nota Doktor!",
        "✅ Episode logged & attached to your Doctor Summary Note!",
        "text-status-ok"
      );
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      addDiaryEntry();
    });

    if (submitBtn) {
      submitBtn.addEventListener("click", addDiaryEntry);
    }

    if (openDocBtn) {
      openDocBtn.addEventListener("click", () => {
        const includeCb = document.getElementById("docIncludeDiaryCb");
        if (includeCb) includeCb.checked = true;
        if (window.refreshDoctorNotePreview) window.refreshDoctorNotePreview();
        if (window.openQuickHelpModal) window.openQuickHelpModal("step4", openDocBtn);
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", () => {
        const entries = getStoredDiaryEntries();
        if (!entries.length) return;
        const confirmed = window.confirm(
          isEn()
            ? "Clear all logged dizziness episodes from this browser?"
            : "Padam semua rekod diari serangan pening daripada pelayar ini?"
        );
        if (!confirmed) return;
        safeSetJSON("vertigolab_diary", []);
        renderDiary();
        if (window.refreshDoctorNotePreview) window.refreshDoctorNotePreview();
        showDiaryFeedback(
          "Semua rekod diari telah dikosongkan.",
          "All diary entries cleared.",
          "text-status-warn"
        );
      });
    }

    renderDiary();
    langRefreshCallbacks.push(renderDiary);
  }

  // --------------------------------------------------------------------------
  // SENARAI SEMAK KECEMASAN TANDA 5D (SEKSYEN 3)
  // --------------------------------------------------------------------------
  function initFiveDChecklist() {
    const boxes = document.querySelectorAll(".five-d-check");
    const statusBox = document.getElementById("fiveDStatusBox");
    if (!boxes.length || !statusBox) return;

    function update5D() {
      const en = isEn();
      let checkedCount = 0;
      boxes.forEach((b) => {
        if (b.checked) checkedCount++;
      });

      if (checkedCount > 0) {
        statusBox.className = "alert-banner alert-critical";
        statusBox.innerHTML = en
          ? `<strong>🚨 ${checkedCount} DANGER SIGN${checkedCount > 1 ? "S" : ""} DETECTED!</strong> Call <strong>999 / 911</strong> or go to the nearest Hospital Emergency Department immediately—these signs point strongly toward <strong>Brainstem / Cerebellar Stroke</strong>.`
          : `<strong>🚨 ${checkedCount} TANDA BAHAYA DIKESAN!</strong> Segera hubungi <strong>999</strong> atau ke Jabatan Kecemasan Hospital terdekat—tanda ini merujuk kepada kemungkinan tinggi <strong>Strok Batang Otak / Serebelum</strong>.`;
      } else {
        statusBox.className = "alert-banner alert-safe";
        statusBox.innerHTML = en
          ? `<strong>ℹ️ No 5D Signs Checked:</strong> Remember—roughly half of early cerebellar/posterior strokes present <em>without</em> obvious 5D signs, which is why emergency clinicians must perform the <strong>HINTS Plus</strong> exam for acute continuous vertigo!`
          : `<strong>ℹ️ Tiada Tanda 5D Ditanda:</strong> Ingat—sekitar separuh kes strok serebelum/batang otak awal hadir <em>tanpa</em> tanda 5D yang ketara, sebab itulah doktor kecemasan wajib melakukan ujian <strong>HINTS Plus</strong> bagi semua kes vertigo berterusan akut!`;
      }
    }

    boxes.forEach((b) =>
      b.addEventListener("change", () => {
        update5D();
        window.markModuleExplored("hints");
      })
    );
    update5D();
    langRefreshCallbacks.push(update5D);
  }

  // --------------------------------------------------------------------------
  // KALKULATOR NATRIUM HARIAN (WCAG AA SEMANTIC STATUS COLORS)
  // --------------------------------------------------------------------------
  function initSodiumCalculator() {
    const foodContainer = document.getElementById("sodiumFoodList");
    const totalEl = document.getElementById("sodiumTotalVal");
    const barEl = document.getElementById("sodiumProgressFill");
    const msgEl = document.getElementById("sodiumAdviceMsg");
    const rehabChecklist = document.getElementById("rehabChecklistWrap");
    if (!foodContainer) return;

    const selected = new Set(["nasi-lemak", "home-rice"]);

    function renderFoods() {
      const en = isEn();
      foodContainer.innerHTML = "";
      let sum = 0;

      window.VERTIGO_DATA.sodiumFoods.forEach((food) => {
        const isChecked = selected.has(food.id);
        if (isChecked) sum += food.mg;

        const label = document.createElement("label");
        label.className = "food-chip" + (isChecked ? " active" : "");
        label.innerHTML = `
          <input type="checkbox" ${isChecked ? "checked" : ""} />
          <span>${escapeHtml(food.name)}</span>
          <strong>${food.mg} mg</strong>
        `;
        label.querySelector("input").addEventListener("change", (e) => {
          if (e.target.checked) selected.add(food.id);
          else selected.delete(food.id);
          renderFoods();
          window.markModuleExplored("rehab");
        });
        foodContainer.appendChild(label);
      });

      if (totalEl) totalEl.textContent = `${sum.toLocaleString()} mg / 2,000 mg`;
      const pct = Math.min(100, Math.round((sum / 2000) * 100));
      if (barEl) {
        barEl.style.width = pct + "%";
        barEl.style.background = sum > 2000 ? "#ef4444" : sum > 1500 ? "#f59e0b" : "#10b981";
      }
      if (msgEl) {
        msgEl.style.color = "";
        if (sum > 2000) {
          msgEl.className = "text-status-danger";
          msgEl.textContent = en
            ? "⚠️ Exceeds 2,000 mg target! Sudden salt spikes can raise inner-ear endolymph pressure and trigger Meniere's attacks."
            : "⚠️ Melebihi sasaran 2,000 mg! Lonjakan garam mendadak boleh memicu tekanan cecair endolymph dan serangan Meniere.";
        } else if (sum >= 1500) {
          msgEl.className = "text-status-warn";
          msgEl.textContent = en
            ? "⚡ Borderline range (1,500–2,000 mg). Space sodium evenly across meals & avoid extra salty snacks."
            : "⚡ Dalam julat sempadan (1,500–2,000 mg). Agihkan pengambilan garam secara sekata sepanjang hari & elakkan makanan masin tambahan.";
        } else {
          msgEl.className = "text-status-ok";
          msgEl.textContent = en
            ? "✅ Well controlled (<1,500 mg/day)! Drink plenty of plain water (never restrict water!) & limit caffeine."
            : "✅ Terkawal (<1,500 mg/hari)! Pastikan minum air kosong mencukupi (jangan sekat air!) & kurangkan kafein.";
        }
      }
    }

    if (rehabChecklist) {
      rehabChecklist.querySelectorAll("input[type='checkbox']").forEach((cb) => {
        cb.addEventListener("change", () => window.markModuleExplored("rehab"));
      });
    }

    renderFoods();
    langRefreshCallbacks.push(renderFoods);
  }

  // --------------------------------------------------------------------------
  // KAD ANALOGI KOMUNIKASI EDUKATIF (PRESERVES OPEN <DETAILS> ACROSS BM/EN)
  // --------------------------------------------------------------------------
  function initAnalogies() {
    const grid = document.getElementById("analogiesGrid");
    if (!grid) return;

    const openAnalogyIds = new Set();

    function renderAnalogies() {
      const en = isEn();
      grid.innerHTML = "";
      window.VERTIGO_DATA.analogies.forEach((item) => {
        const card = document.createElement("div");
        card.className = "analogy-card";
        const isOpen = openAnalogyIds.has(item.id);
        card.innerHTML = `
          <div class="analogy-icon" aria-hidden="true">${escapeHtml(item.icon)}</div>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="analogy-use">${escapeHtml(item.targetUse)}</div>
          <p class="analogy-summary">${escapeHtml(item.summary)}</p>
          <details class="script-drawer" ${isOpen ? "open" : ""}>
            <summary>${
              en
                ? "🎬 View Patient Explanation / Video Script"
                : "🎬 Lihat Skrip Penerangan Pesakit / Video"
            }</summary>
            <p class="script-quote">${escapeHtml(item.script)}</p>
          </details>
          <button type="button" class="btn-secondary copy-script-btn">${
            en ? "📋 Copy Explanation Script" : "📋 Salin Skrip Komunikasi"
          }</button>
        `;

        const detailsEl = card.querySelector("details");
        if (detailsEl) {
          detailsEl.addEventListener("toggle", () => {
            if (detailsEl.open) openAnalogyIds.add(item.id);
            else openAnalogyIds.delete(item.id);
          });
        }

        const copyBtn = card.querySelector(".copy-script-btn");
        copyBtn.addEventListener("click", () => {
          copyTextWithFallback(item.script).then((copied) => {
            copyBtn.textContent = copied
              ? isEn()
                ? "✅ Script Copied!"
                : "✅ Skrip Disalin!"
              : isEn()
              ? "✅ Open Drawer Above to Copy"
              : "✅ Buka Kotak Skrip Di Atas Untuk Salin";
            setTimeout(() => {
              copyBtn.textContent = isEn()
                ? "📋 Copy Explanation Script"
                : "📋 Salin Skrip Komunikasi";
            }, 2200);
          });
        });

        grid.appendChild(card);
      });
    }

    renderAnalogies();
    langRefreshCallbacks.push(renderAnalogies);
  }

  // --------------------------------------------------------------------------
  // KUIZ KLINIKAL INTERAKTIF (7 SENARIO TRIAJ & PENGURUSAN)
  // --------------------------------------------------------------------------
  function initClinicalQuiz() {
    const quizContainer = document.getElementById("clinicalQuizContainer");
    const scoreBadge = document.getElementById("quizScoreDisplay");
    const resetBtn = document.getElementById("quizResetBtn");
    if (!quizContainer) return;

    const answers = {};

    function renderQuiz() {
      const en = isEn();
      quizContainer.innerHTML = "";
      let correctCount = 0;
      const total = window.VERTIGO_DATA.clinicalQuiz.length;

      window.VERTIGO_DATA.clinicalQuiz.forEach((q) => {
        const chosenId = answers[q.id];
        const chosenObj = q.options.find((o) => o.id === chosenId);
        if (chosenObj && chosenObj.correct) correctCount++;

        const card = document.createElement("div");
        card.className = "quiz-card";
        card.innerHTML = `
          <div class="quiz-header">
            <span class="pill-badge pill-info">${escapeHtml(q.badge)}</span>
            <strong>${en ? "Patient:" : "Pesakit:"} ${escapeHtml(q.patient)}</strong>
          </div>
          <p class="quiz-vignette">${escapeHtml(q.vignette)}</p>
          <p class="quiz-question"><strong>${escapeHtml(q.question)}</strong></p>
          <div class="quiz-options"></div>
          <div class="quiz-feedback" style="display:${chosenObj ? "block" : "none"};">
            ${
              chosenObj
                ? `<div class="alert-banner ${chosenObj.correct ? "alert-safe" : "alert-critical"}">
                     <strong>${
                       chosenObj.correct
                         ? en
                           ? "✅ Accurate Clinical Decision!"
                           : "✅ Keputusan Tepat!"
                         : en
                         ? "❌ Review the Medical Fact:"
                         : "❌ Semak Semula Fakta Perubatan:"
                     }</strong>
                     <div style="margin-top:4px;">${escapeHtml(chosenObj.feedback)}</div>
                   </div>`
                : ""
            }
          </div>
        `;

        const optsWrap = card.querySelector(".quiz-options");
        q.options.forEach((opt) => {
          const btn = document.createElement("button");
          btn.type = "button";
          let cls = "quiz-opt-btn";
          if (chosenId) {
            if (opt.correct) cls += " opt-correct";
            else if (opt.id === chosenId && !opt.correct) cls += " opt-wrong";
          }
          btn.className = cls;
          btn.setAttribute("aria-pressed", String(chosenId === opt.id));
          btn.innerHTML = `<span class="opt-letter">${escapeHtml(opt.id.toUpperCase())}</span> <span>${escapeHtml(opt.text)}</span>`;
          btn.addEventListener("click", () => {
            answers[q.id] = opt.id;
            renderQuiz();
            window.markModuleExplored("quiz");
          });
          optsWrap.appendChild(btn);
        });

        quizContainer.appendChild(card);
      });

      const answeredCount = Object.keys(answers).length;
      if (scoreBadge) {
        scoreBadge.textContent = en
          ? `Clinical Acumen Score: ${correctCount} / ${total} (${answeredCount} answered)`
          : `Skor Ketajaman Klinikal: ${correctCount} / ${total} (${answeredCount} dijawab)`;
      }
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        Object.keys(answers).forEach((k) => delete answers[k]);
        renderQuiz();
      });
    }

    renderQuiz();
    langRefreshCallbacks.push(renderQuiz);
  }

  // --------------------------------------------------------------------------
  // BOOTSTRAP APLIKASI
  // --------------------------------------------------------------------------
  registerOfflineServiceWorker();

  document.addEventListener("DOMContentLoaded", () => {
    initTopControls();
    initQuickPatientHelper();
    initCausesMatrix();
    initIntelligentTriage();
    initBppvSideFinder();
    initEpisodeDiary();
    initFiveDChecklist();
    initSodiumCalculator();
    initAnalogies();
    initClinicalQuiz();
    if (window.initAllSimulators) window.initAllSimulators();

    // Apply persisted or default language cleanly across static & dynamic UI
    window.setAppLanguage(window.currentLang || "ms");
    updateMasteryProgress();
  });
})();
