// ============================================================================
// VertigoLab — Bilingual Triage Engine, Patient Quick-SOS, Doctor Note & Quiz
// Supports Bahasa Melayu (ms) & English (en) seamlessly
// ============================================================================

(function () {
  "use strict";

  const langRefreshCallbacks = [];

  function isEn() {
    return window.currentLang === "en";
  }

  const exploredModules = new Set(
    JSON.parse(localStorage.getItem("vertigolab_explored") || '["sensory"]')
  );

  window.markModuleExplored = function (moduleId) {
    exploredModules.add(moduleId);
    try {
      localStorage.setItem("vertigolab_explored", JSON.stringify(Array.from(exploredModules)));
    } catch (_) {}
    updateMasteryProgress();
  };

  function updateMasteryProgress() {
    const totalModules = 8; // sensory, anatomy, matrix, triage, hints, epley, quiz, quickhelp
    const pct = Math.min(100, Math.round((exploredModules.size / totalModules) * 100));
    const fill = document.getElementById("masteryProgressFill");
    const label = document.getElementById("masteryProgressPct");
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = pct + "%";
  }

  // --------------------------------------------------------------------------
  // BILINGUAL (BM | EN) LANGUAGE CONTROLLER
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
      el.setAttribute("placeholder", en ? el.getAttribute("data-en-placeholder") : el.dataset.msPlaceholder);
    });

    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang-switch") === (en ? "en" : "ms"));
    });
  }

  window.setAppLanguage = function (lang) {
    const target = lang === "en" ? "en" : "ms";
    try {
      localStorage.setItem("vertigolab_lang", target);
    } catch (_) {}

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
  // MOD AUDIENS, MOD TENANG (MESRA PENING), BAHASA & TEMA WARNA
  // --------------------------------------------------------------------------
  function syncCalmModeButtons() {
    const isCalm = !!window.__vertigoCalmMode;
    const en = isEn();
    document.body.classList.toggle("calm-motion", isCalm);
    ["calmModeToggleBtn", "modalCalmModeBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.toggle("active", isCalm);
        if (en) {
          btn.textContent = isCalm
            ? "🧘 Calm Mode: ON (Animations Paused)"
            : "🧘 Dizzy-Friendly Mode (Pause Motion)";
        } else {
          btn.textContent = isCalm
            ? "🧘 Mod Tenang: AKTIF (Animasi Dijeda)"
            : "🧘 Mod Mesra Pening (Jeda Animasi)";
        }
      }
    });
  }

  function syncThemeButton() {
    const themeBtn = document.getElementById("themeToggleBtn");
    if (!themeBtn) return;
    const isLight = document.body.classList.contains("light-theme");
    if (isEn()) {
      themeBtn.textContent = isLight ? "🌙 Dark Mode" : "☀️ Light Mode";
    } else {
      themeBtn.textContent = isLight ? "🌙 Mod Gelap" : "☀️ Mod Cerah";
    }
  }

  function initTopControls() {
    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.setAppLanguage(btn.getAttribute("data-lang-switch"));
      });
    });

    const modeBtns = document.querySelectorAll("[data-audience-mode]");
    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-audience-mode");
        document.body.classList.toggle("mode-layman", mode === "layman");
        document.body.classList.toggle("mode-clinical", mode === "clinical");
        modeBtns.forEach((b) => b.classList.toggle("active", b === btn));
        if (window.refreshAnatomyAudienceText) window.refreshAnatomyAudienceText();
      });
    });

    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        syncThemeButton();
      });
    }

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.__vertigoCalmMode = true;
    }
    syncCalmModeButtons();
    syncThemeButton();

    ["calmModeToggleBtn", "modalCalmModeBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          window.__vertigoCalmMode = !window.__vertigoCalmMode;
          syncCalmModeButtons();
        });
      }
    });

    langRefreshCallbacks.push(() => {
      syncCalmModeButtons();
      syncThemeButton();
    });
  }

  // --------------------------------------------------------------------------
  // PAUTAN PANTAS & MODAL "SAYA SEDANG PENING SEKARANG" (BANTUAN PESAKIT)
  // --------------------------------------------------------------------------
  function initQuickPatientHelper() {
    const modal = document.getElementById("quickHelpModal");
    if (!modal) return;

    let breathInterval = null;
    let breathSec = 0;
    let activePatternKey = "bppv";

    function renderBreathingTick() {
      const breathText = document.getElementById("breathingPhaseText");
      const breathCircle = document.getElementById("breathingPacerOrb");
      if (!breathText || !breathCircle) return;
      const cycleSec = breathSec % 10; // 4s inhale, 6s exhale
      if (cycleSec < 4) {
        breathText.textContent = isEn()
          ? `Inhale Slowly Through Nose... (${4 - cycleSec}s)`
          : `Tarik Nafas Perlahan Melalui Hidung... (${4 - cycleSec}s)`;
        breathCircle.classList.add("inhale");
        breathCircle.classList.remove("exhale");
      } else {
        breathText.textContent = isEn()
          ? `Exhale Gently Through Mouth... (${10 - cycleSec}s)`
          : `Hembus Perlahan Melalui Mulut... (${10 - cycleSec}s)`;
        breathCircle.classList.add("exhale");
        breathCircle.classList.remove("inhale");
      }
    }

    function startBreathingGuide() {
      if (breathInterval) clearInterval(breathInterval);
      breathSec = 0;
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

    function openModal(initialTab) {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      window.markModuleExplored("quickhelp");
      if (initialTab) switchQuickTab(initialTab);
      startBreathingGuide();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      stopBreathingGuide();
    }

    function switchQuickTab(tabId) {
      modal.querySelectorAll("[data-qh-tab]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-qh-tab") === tabId);
      });
      modal.querySelectorAll("[data-qh-pane]").forEach((pane) => {
        pane.hidden = pane.getAttribute("data-qh-pane") !== tabId;
      });
    }

    document.querySelectorAll("[data-open-quickhelp]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const targetTab = trigger.getAttribute("data-open-quickhelp") || "step1";
        openModal(targetTab);
      });
    });

    modal.querySelectorAll("[data-close-quickhelp]").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    modal.querySelectorAll("[data-qh-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchQuickTab(btn.getAttribute("data-qh-tab")));
    });

    modal.querySelectorAll("[data-qh-goto]").forEach((btn) => {
      btn.addEventListener("click", () => switchQuickTab(btn.getAttribute("data-qh-goto")));
    });

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
              Dizziness/vertigo accompanied by neurological 5D signs, inability to stand unassisted, sudden unilateral hearing loss, or chest pain/fainting requires <strong>immediate Hospital Emergency Department evaluation</strong> to rule out stroke or acute cardiac causes. <strong>Do not drive yourself!</strong>
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
              Pening/vertigo yang disertai tanda saraf (5D), kegagalan berdiri, pekak mendadak sebelah telinga, atau sakit dada/pitam memerlukan penilaian <strong>Jabatan Kecemasan Hospital dengan segera</strong> untuk menolak strok atau masalah jantung akut. <strong>Jangan memandu sendiri!</strong>
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a href="tel:999" class="btn-danger-solid">📞 Hubungi Kecemasan 999</a>
              <button type="button" class="btn-secondary" id="qhJumpDocSummaryFromAlert">📋 Sediakan Nota Untuk Doktor Kecemasan</button>
            </div>
          `;
        const jumpBtn = document.getElementById("qhJumpDocSummaryFromAlert");
        if (jumpBtn) jumpBtn.addEventListener("click", () => switchQuickTab("step4"));
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
              <li><strong>Apa patut buat:</strong> Dapatkan pengesahan ujian <em>Dix-Hallpike</em> dan rawatan <strong>Epley Maneuver</strong> (berjaya 80%–90%). Bangun dari katil secara perlahan.</li>
              <li><strong>Apa JANGAN buat:</strong> Jangan bergantung pada pil tahan pening (cinnarizine/Stemetil) berbulan-bulan kerana ubat pil langsung tidak boleh mencairkan kristal ini!</li>
            </ul>
            <a href="#sec-epley" data-qh-jump-section class="btn-primary">🔄 Buka Panduan Visual 5 Langkah Epley</a>
          `
        },
        orthostatic: {
          title: "⚡ Corak Gelap Mata / Pening Ortostatik (Bukan Vertigo!)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Tekanan darah turun mendadak seketika apabila bangun berdiri cepat dari duduk/baring/sujud (akibat kurang air, kesan ubat darah tinggi, kurang darah/anemia, atau gula rendah).</li>
              <li><strong>Apa patut buat:</strong> Amalkan bangun 2 peringkat (duduk di tepi katil 30 saat &amp; gerakkan pergelangan kaki sebelum berdiri), minum air mencukupi, dan minta doktor periksa <strong>tekanan darah semasa baring vs berdiri</strong> serta semak dos ubat.</li>
              <li><strong>Apa JANGAN buat:</strong> Jangan makan ubat vertigo telinga tanpa nasihat doktor kerana ia boleh menyebabkan mengantuk dan risiko jatuh!</li>
            </ul>
          `
        },
        migraine: {
          title: "✨ Corak Vestibular Migraine (Pusing + Silau / Kurang Tidur)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Kepekaan saraf keseimbangan dan pemprosesan deria otak (boleh berlaku dari 5 minit hingga 72 jam, malah <strong>tanpa sakit kepala serentak</strong> dalam sehingga separuh kes!).</li>
              <li><strong>Apa patut buat:</strong> Rehat di bilik redup &amp; senyap, jaga waktu tidur tetap, minum air cukup, jangan biar perut lapar, dan jumpa doktor jika serangan kerap.</li>
            </ul>
          `
        },
        meniere: {
          title: "🌊 Corak Penyakit Meniere (Pusing Berjam + Desing/Telinga Penuh)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Lebihan tekanan cecair <em>endolymph</em> pada sebelah telinga dalam (serangan 20 minit hingga 12 jam disertai desingan tinnitus, telinga rasa tersumbat/penuh, dan kurang pendengaran).</li>
              <li><strong>Apa patut buat:</strong> Hadkan garam/natrium bawah 1,500–2,000 mg sehari secara sekata, kurangkan kopi/kafein, dan dapatkan ujian pendengaran (audiometri) bersama Pakar ENT.</li>
            </ul>
            <a href="#sec-pemulihan" data-qh-jump-section class="btn-primary">🧂 Cuba Kalkulator Garam Harian</a>
          `
        },
        neuritis: {
          title: "🦠 Corak Vestibular Neuritis / Labyrinthitis (Berterusan Berhari-hari)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Keradangan saraf keseimbangan telinga dalam (lazimnya pasca-jangkitan virus). Jika pendengaran turut menurun mendadak, ia dipanggil <em>Labyrinthitis</em> (atau perlu disaring strok AICA!).</li>
              <li><strong>Apa patut buat:</strong> Wajib diperiksa oleh doktor terlebih dahulu (pemeriksaan <strong>HINTS Plus</strong>) untuk mengesahkan ia bukan strok. Ubat tahan muntah hanya untuk 2–3 hari pertama; selepas itu mulakan <strong>senaman mata VRT</strong>!</li>
            </ul>
            <a href="#sec-pemulihan" data-qh-jump-section class="btn-primary">🎯 Buka Jurulatih VRT Gaze Stabilization</a>
          `
        },
        pppd: {
          title: "🛒 Corak PPPD (Terhuyung-hayang Kronik >3 Bulan & Sensitif Visual)",
          body: `
            <ul>
              <li><strong>Kenapa berlaku:</strong> Sering bermula selepas episod vertigo/stres terdahulu yang sebenarnya sudah sembuh, tetapi otak kekal 'terlalu berjaga-jaga' apabila berdiri, berjalan, atau melihat lorong pasar raya / skrin bergerak.</li>
              <li><strong>Apa patut buat:</strong> Jangan takut bergerak! Rawatan utama ialah latihan habituasi <strong>Rehabilitasi Vestibular (VRT)</strong> secara berperingkat dan pengurusan keresahan bersama doktor/fisioterapi vestibular.</li>
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
              <li><strong>What to do:</strong> Confirm with a <em>Dix-Hallpike</em> test and treat with the <strong>Epley Maneuver</strong> (80%–90% effective). Sit up from bed slowly.</li>
              <li><strong>What NOT to do:</strong> Do NOT rely on daily dizziness pills (cinnarizine/prochlorperazine) for weeks—oral pills cannot dissolve or move calcium crystals!</li>
            </ul>
            <a href="#sec-epley" data-qh-jump-section class="btn-primary">🔄 Open 5-Step Visual Epley Simulator</a>
          `
        },
        orthostatic: {
          title: "⚡ Orthostatic Lightheadedness / Presyncope (Not Inner-Ear Vertigo!)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Temporary drop in blood pressure when standing up quickly from sitting/lying down (caused by dehydration, blood pressure meds, anemia, or low blood sugar).</li>
              <li><strong>What to do:</strong> Practice 2-stage standing (sit at the bed edge for 30 seconds &amp; pump your ankles before standing), stay hydrated, and ask your doctor to check <strong>lying vs standing blood pressure</strong> and review medications.</li>
              <li><strong>What NOT to do:</strong> Avoid taking inner-ear vertigo suppressants unnecessarily, as they cause drowsiness and fall risk!</li>
            </ul>
          `
        },
        migraine: {
          title: "✨ Vestibular Migraine Pattern (Spinning + Light Sensitivity / Poor Sleep)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Hypersensitivity of central balance and sensory pathways (episodes last 5 minutes to 72 hours, and <strong>30%–50% occur WITHOUT a concurrent headache!</strong>).</li>
              <li><strong>What to do:</strong> Rest in a dim, quiet room, keep regular sleep and meal schedules, hydrate well, and consult a doctor if episodes are frequent.</li>
            </ul>
          `
        },
        meniere: {
          title: "🌊 Meniere's Disease Pattern (Hours of Spinning + Ear Ringing/Fullness)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Excess <em>endolymph</em> fluid pressure in one inner ear (attacks last 20 minutes to 12 hours with unilateral roaring tinnitus, ear fullness, and muffled hearing).</li>
              <li><strong>What to do:</strong> Keep sodium evenly below 1,500–2,000 mg/day, limit caffeine/alcohol, and arrange a formal hearing test (audiometry) with an ENT specialist.</li>
            </ul>
            <a href="#sec-pemulihan" data-qh-jump-section class="btn-primary">🧂 Try the Daily Sodium Calculator</a>
          `
        },
        neuritis: {
          title: "🦠 Vestibular Neuritis / Labyrinthitis Pattern (Continuous for Days)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Inflammation of the vestibular balance nerve (often post-viral). If hearing also drops suddenly, it is termed <em>Labyrinthitis</em> (and must be screened urgently for AICA stroke!).</li>
              <li><strong>What to do:</strong> Must be examined by a doctor first (<strong>HINTS Plus</strong> exam) to rule out stroke. Limit anti-nausea suppressants to the first ≤72 hours, then begin <strong>VRT eye-head exercises</strong>!</li>
            </ul>
            <a href="#sec-pemulihan" data-qh-jump-section class="btn-primary">🎯 Open VRT Gaze Stabilization Trainer</a>
          `
        },
        pppd: {
          title: "🛒 PPPD Pattern (Chronic Swaying >3 Months & Visual Motion Sensitivity)",
          body: `
            <ul>
              <li><strong>Why it happens:</strong> Often triggered after a prior vertigo/stress event that has already healed, leaving the brain over-reliant on visual cues when standing, walking, or scrolling/shopping in busy aisles.</li>
              <li><strong>What to do:</strong> Stay gently active! First-line treatment is graded <strong>Vestibular Rehabilitation Therapy (VRT)</strong> habituation and sensory retraining with your clinician/physiotherapist.</li>
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
          lnk.addEventListener("click", closeModal);
        });
      }
    }

    modal.querySelectorAll("[data-qh-pattern]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activePatternKey = btn.getAttribute("data-qh-pattern") || "bppv";
        modal.querySelectorAll("[data-qh-pattern]").forEach((b) => b.classList.toggle("active", b === btn));
        renderActivePatternCard();
      });
    });

    // Tab 4: Doctor Symptom Summary Generator (Copy / Print)
    const docFields = ["docSensation", "docDuration", "docTrigger", "docAssoc", "docMeds"];
    const docPreview = document.getElementById("docNotePreview");
    const copyDocBtn = document.getElementById("copyDocNoteBtn");
    const printDocBtn = document.getElementById("printDocNoteBtn");

    function buildDoctorSummaryText() {
      const en = isEn();
      const getSelectOrInputText = (id) => {
        const el = document.getElementById(id);
        if (!el) return "";
        if (el.tagName === "SELECT" && el.options[el.selectedIndex]) {
          return el.options[el.selectedIndex].text.trim();
        }
        return el.value.trim();
      };

      const redChecked = [];
      qhRedChecks.forEach((cb) => {
        if (cb.checked) {
          redChecked.push(en ? cb.getAttribute("data-en-label") || cb.getAttribute("data-label") : cb.getAttribute("data-label"));
        }
      });

      const today = new Date().toLocaleDateString(en ? "en-GB" : "ms-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      if (en) {
        return [
          `=== PATIENT DIZZINESS / VERTIGO SUMMARY FOR DOCTOR (${today}) ===`,
          `1. Primary Sensation: ${getSelectOrInputText("docSensation")}`,
          `2. Single Episode Duration: ${getSelectOrInputText("docDuration")}`,
          `3. Main Trigger: ${getSelectOrInputText("docTrigger")}`,
          `4. Ear / Associated Symptoms: ${getSelectOrInputText("docAssoc")}`,
          `5. Current Medications / Medical History: ${getSelectOrInputText("docMeds") || "None stated"}`,
          `6. Red-Flag Screen (5Ds / Unsteady Gait): ${
            redChecked.length ? "PRESENT (" + redChecked.join(", ") + ")" : "No 5D red-flag signs reported"
          }`,
          `--------------------------------------------------------------`,
          `Questions for Doctor: Could you help check whether this is peripheral vertigo (e.g., BPPV for Dix-Hallpike/Epley), orthostatic blood pressure drop, or requires a HINTS Plus exam?`
        ].join("\n");
      }

      return [
        `=== RINGKASAN SIMPTOM PENING / VERTIGO UNTUK DOKTOR (${today}) ===`,
        `1. Sifat Pening Utama: ${getSelectOrInputText("docSensation")}`,
        `2. Durasi Satu Episod: ${getSelectOrInputText("docDuration")}`,
        `3. Pencetus Serangan: ${getSelectOrInputText("docTrigger")}`,
        `4. Simptom Telinga / Iringan: ${getSelectOrInputText("docAssoc")}`,
        `5. Ubat Sedang Diambil / Penyakit Sedia Ada: ${getSelectOrInputText("docMeds") || "Tiada dinyatakan"}`,
        `6. Saringan Tanda Bahaya (5D / Ataksia): ${
          redChecked.length ? "ADA (" + redChecked.join(", ") + ")" : "Tiada tanda bahaya 5D dilaporkan"
        }`,
        `--------------------------------------------------------------`,
        `Soalan untuk Doktor: Mohon semakan sama ada ini vertigo periferi (cth: BPPV untuk Dix-Hallpike/Epley), punca tekanan darah ortostatik, atau memerlukan saringan HINTS Plus.`
      ].join("\n");
    }

    function updateDocPreview() {
      if (docPreview) docPreview.value = buildDoctorSummaryText();
    }

    docFields.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", updateDocPreview);
      if (el) el.addEventListener("change", updateDocPreview);
    });
    qhRedChecks.forEach((cb) => cb.addEventListener("change", updateDocPreview));

    if (copyDocBtn) {
      copyDocBtn.addEventListener("click", () => {
        const txt = buildDoctorSummaryText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(() => {
            copyDocBtn.textContent = isEn()
              ? "✅ Doctor Note Copied! (Paste in WhatsApp/Notes)"
              : "✅ Nota Doktor Disalin! (Boleh Tampal di WhatsApp/Nota)";
            setTimeout(() => {
              copyDocBtn.textContent = isEn()
                ? "📋 Copy Note for Doctor / WhatsApp"
                : "📋 Salin Nota Untuk Doktor / WhatsApp";
            }, 2500);
          });
        }
      });
    }

    if (printDocBtn) {
      printDocBtn.addEventListener("click", () => {
        window.print();
      });
    }

    evaluateQuickRedFlags();
    renderActivePatternCard();
    updateDocPreview();

    langRefreshCallbacks.push(() => {
      renderBreathingTick();
      evaluateQuickRedFlags();
      renderActivePatternCard();
      updateDocPreview();
    });
  }

  // --------------------------------------------------------------------------
  // MATRIKS PINTAR PUNCA UTAMA VERTIGO (TAPISAN & CARIAN)
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
            ? `<strong>💡 Audited Clinical Pearl (${item.name} — ${item.prevalence}):</strong> ${item.pearl}`
            : `<strong>💡 Fakta Klinikal Diaudit (${item.name} — ${item.prevalence}):</strong> ${item.pearl}`;
          return;
        }
      }
      pearlBox.innerHTML = en
        ? `<strong>💡 Click Any Row Above:</strong> View full audited clinical pearls including the <em>AICA stroke</em> alert (sudden deafness + vertigo) and official <em>Bárány Society</em> criteria.`
        : `<strong>💡 Klik Mana-Mana Baris Di Atas:</strong> Lihat fakta klinikal penuh termasuk amaran <em>strok arteri AICA</em> (pekak mendadak + vertigo) dan kriteria rasmi <em>Bárány Society</em>.`;
    }

    function renderRows() {
      const list = window.VERTIGO_DATA.causesMatrix.filter((item) => {
        const matchesFilter = activeFilter === "all" || item.durationTag === activeFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.fullName.toLowerCase().includes(q) ||
          item.trigger.toLowerCase().includes(q) ||
          item.earSymptoms.toLowerCase().includes(q) ||
          item.treatment.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
      });

      tbody.innerHTML = "";
      list.forEach((item) => {
        const tr = document.createElement("tr");
        const classes = [];
        if (item.dangerLevel === "critical") classes.push("row-critical");
        if (item.id === selectedCauseId) classes.push("selected-row");
        tr.className = classes.join(" ");

        const badgeClass =
          item.dangerLevel === "critical"
            ? "pill-danger"
            : item.dangerLevel === "moderate"
            ? "pill-warn"
            : "pill-ok";

        tr.innerHTML = `
          <td>
            <div class="cause-name-cell">
              <strong>${item.name}</strong>
              <span class="pill-badge ${badgeClass}">${item.type}</span>
            </div>
            <div class="cell-sub">${item.fullName}</div>
          </td>
          <td><strong>${item.duration}</strong></td>
          <td>${item.trigger}</td>
          <td>${item.earSymptoms}</td>
          <td><span class="treatment-highlight">${item.treatment}</span></td>
        `;

        tr.addEventListener("click", () => {
          selectedCauseId = item.id;
          tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected-row"));
          tr.classList.add("selected-row");
          renderPearl();
          window.markModuleExplored("matrix");
        });

        tbody.appendChild(tr);
      });
      renderPearl();
    }

    document.querySelectorAll("[data-matrix-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.getAttribute("data-matrix-filter");
        document.querySelectorAll("[data-matrix-filter]").forEach((b) => b.classList.toggle("active", b === btn));
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
  // ENJIN TRIAJ DIAGNOSTIK PINTAR (DIAUDIT MENGIKUT GRACE-3 & BÁRÁNY SOCIETY)
  // --------------------------------------------------------------------------
  function initIntelligentTriage() {
    const form = document.getElementById("triageForm");
    if (!form) return;

    const state = {
      sensation: "spinning",
      duration: "under1m",
      trigger: "positional",
      ear: "none",
      redFlags: new Set()
    };

    function computeAssessment() {
      const container = document.getElementById("triageResultsOutput");
      if (!container) return;
      const en = isEn();

      if (state.sensation === "lightheaded" && state.redFlags.size === 0) {
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

      if (state.sensation === "swayingChronic" && state.redFlags.size === 0) {
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
        bppv: 8,
        neuritis: 8,
        meniere: 8,
        migraine: 8,
        stroke: 8
      };
      const reasons = [];

      if (state.redFlags.size > 0) {
        scores.stroke += 90;
        reasons.push(
          en
            ? `🚨 <strong>Central Red Flags Detected (${state.redFlags.size} sign${state.redFlags.size > 1 ? "s" : ""}):</strong> Any 5D neurological sign or inability to stand unassisted is a critical warning for Brainstem / Cerebellar Stroke.`
            : `🚨 <strong>Tanda Bahaya Sentral Dikesan (${state.redFlags.size} tanda):</strong> Kehadiran tanda 5D atau kegagalan berdiri sendiri adalah amaran merah Strok Batang Otak / Serebelum.`
        );
      }

      if (state.duration === "under1m") {
        scores.bppv += 48;
        scores.meniere -= 4;
        scores.neuritis -= 5;
        reasons.push(
          en
            ? "⏱️ <strong>Duration &lt; 1 minute:</strong> Hallmark time window of otoconia crystal settling in BPPV."
            : "⏱️ <strong>Durasi &lt; 1 minit:</strong> Kriteria utama pergerakan hablur otoconia dalam BPPV."
        );
      } else if (state.duration === "minsToHours") {
        scores.meniere += 34;
        scores.migraine += 32;
        scores.bppv -= 4;
        reasons.push(
          en
            ? "⏱️ <strong>Duration 20 mins – 12 hours:</strong> Official diagnostic time window for Meniere's Disease and Vestibular Migraine."
            : "⏱️ <strong>Durasi 20 minit – 12 jam:</strong> Julat diagnostik rasmi bagi Penyakit Meniere dan Vestibular Migraine."
        );
      } else if (state.duration === "hoursToDays") {
        scores.neuritis += 38;
        scores.migraine += 25;
        scores.stroke += 18;
        reasons.push(
          en
            ? "⏱️ <strong>Lasting Days:</strong> Typical of Vestibular Neuritis or prolonged Vestibular Migraine, though central screening remains mandatory."
            : "⏱️ <strong>Berterusan Berhari-hari:</strong> Lazim bagi Vestibular Neuritis atau Vestibular Migraine panjang, namun saringan sentral wajib dilakukan."
        );
      } else if (state.duration === "continuousAcute") {
        scores.stroke += 38;
        scores.neuritis += 34;
        reasons.push(
          en
            ? "⏱️ <strong>Acute Vestibular Syndrome (Sudden Continuous):</strong> Per GRACE-3 guidelines, posterior stroke MUST be screened using the HINTS Plus protocol!"
            : "⏱️ <strong>Acute Vestibular Syndrome (Berterusan Mendadak):</strong> Mengikut garis panduan GRACE-3, wajib saring Strok Posterior dengan protokol HINTS Plus!"
        );
      }

      if (state.trigger === "positional") {
        scores.bppv += 42;
        reasons.push(
          en
            ? "🔄 <strong>Head Position Trigger:</strong> Gravity shifts detached calcium crystals inside the semicircular canal."
            : "🔄 <strong>Pencetus Perubahan Posisi Kepala:</strong> Graviti menggerakkan hablur kristal di dalam saluran separuh bulat."
        );
      } else if (state.trigger === "postViral") {
        scores.neuritis += 40;
        reasons.push(
          en
            ? "🦠 <strong>Post-Viral Onset:</strong> Classic trigger for acute vestibular nerve inflammation."
            : "🦠 <strong>Pasca-Jangkitan Virus:</strong> Pencetus klasik keradangan saraf vestibular."
        );
      } else if (state.trigger === "spontaneous") {
        scores.meniere += 25;
        scores.neuritis += 18;
        scores.stroke += 16;
      } else if (state.trigger === "sleepStressLight") {
        scores.migraine += 42;
        reasons.push(
          en
            ? "💡 <strong>Poor Sleep / Stress / Bright Glare:</strong> Core neuro-sensory triggers for Vestibular Migraine."
            : "💡 <strong>Kurang Tidur / Stres / Silau:</strong> Pencetus neuro-sensori utama bagi Vestibular Migraine."
        );
      } else if (state.trigger === "vascularRisk") {
        scores.stroke += 40;
        reasons.push(
          en
            ? "🩸 <strong>Vascular Risk Factors (Hypertension / Diabetes / AF / Acute Neck Pain):</strong> Elevates pretest probability of posterior circulation ischemia or vertebral dissection."
            : "🩸 <strong>Faktor Risiko Vaskular (Darah Tinggi / Diabetes / AF / Sakit Leher):</strong> Meningkatkan risiko iskemia edaran posterior."
        );
      }

      if (state.ear === "none") {
        scores.bppv += 14;
        scores.neuritis += 12;
      } else if (state.ear === "meniereTriad") {
        scores.meniere += 48;
        reasons.push(
          en
            ? "👂 <strong>Tinnitus + Aural Fullness + Fluctuating Hearing Loss:</strong> Classic Bárány Society triad for Meniere's Disease."
            : "👂 <strong>Tinnitus + Telinga Penuh + Kurang Pendengaran Berfluktuasi:</strong> Triad diagnostik Bárány Society bagi Penyakit Meniere."
        );
      } else if (state.ear === "suddenDeafness") {
        scores.stroke += 36;
        scores.neuritis += 28;
        reasons.push(
          en
            ? "🚨 <strong>HINTS PLUS ALERT (New Sudden Unilateral Deafness + Vertigo):</strong> Can represent viral <em>Labyrinthitis</em> OR an <strong>AICA artery stroke</strong> supplying both the inner ear and brainstem—requires urgent emergency evaluation!"
            : "🚨 <strong>AMARAN HINTS PLUS (Pekak Mendadak Sebelah Telinga + Vertigo):</strong> Boleh disebabkan <em>Labyrinthitis</em> ATAU <strong>strok arteri AICA</strong> yang menyumbat bekalan darah ke telinga dalam &amp; batang otak—perlu penilaian kecemasan segera!"
        );
      } else if (state.ear === "photophobia") {
        scores.migraine += 40;
        reasons.push(
          en
            ? "✨ <strong>Light Sensitivity (Photophobia):</strong> Key diagnostic feature of Vestibular Migraine even when throbbing headache is absent."
            : "✨ <strong>Silau Cahaya (Fotofobia):</strong> Ciri utama Vestibular Migraine walaupun berlaku tanpa sakit kepala berdenyut serentak."
        );
      }

      const keys = Object.keys(scores);
      keys.forEach((k) => {
        if (scores[k] < 2) scores[k] = 2;
      });
      const total = keys.reduce((acc, k) => acc + scores[k], 0);

      const labelMap = en
        ? {
            bppv: {
              title: "BPPV (Loose Inner-Ear Crystals)",
              action: "Confirm via Dix-Hallpike test & perform Epley Maneuver (avoid chronic dizziness pills)."
            },
            neuritis: {
              title:
                state.ear === "suddenDeafness"
                  ? "Labyrinthitis (Must Rule Out AICA Stroke First!)"
                  : "Vestibular Neuritis (Nerve Inflammation)",
              action: "Confirm peripheral HINTS Plus exam with a doctor, cap anti-nausea meds at ≤72h, then start VRT."
            },
            meniere: {
              title: "Meniere's Disease (Endolymphatic Hydrops)",
              action: "Limit sodium <1,500–2,000 mg/day, reduce caffeine, obtain audiometry & ENT specialist care."
            },
            migraine: {
              title: "Vestibular Migraine",
              action: "Stabilize sleep, meals & hydration, manage glare/stress triggers, discuss migraine prophylaxis."
            },
            stroke: {
              title: "Posterior / Central Stroke (Emergency!)",
              action: "GO IMMEDIATELY TO HOSPITAL EMERGENCY (Call 999 / 911)! Do not drive yourself."
            }
          }
        : {
            bppv: {
              title: "BPPV (Hablur Kristal Telinga)",
              action: "Sahkan dengan ujian Dix-Hallpike & lakukan Epley Maneuver (elak bergantung pil tahan pening)."
            },
            neuritis: {
              title:
                state.ear === "suddenDeafness"
                  ? "Labyrinthitis (Wajib Tolak Strok AICA Dahulu!)"
                  : "Vestibular Neuritis (Keradangan Saraf)",
              action: "Sahkan HINTS Plus periferi oleh doktor, hadkan ubat muntah ≤72 jam, dan mulakan latihan VRT."
            },
            meniere: {
              title: "Penyakit Meniere (Hidrops Cecair)",
              action: "Hadkan natrium <1,500–2,000 mg/hari, kurangkan kafein, ujian audiometri & rujukan Pakar ENT."
            },
            migraine: {
              title: "Vestibular Migraine",
              action: "Stabilkan jadual tidur, waktu makan & hidrasi, urus silau/stres, bincang profilaksis doktor."
            },
            stroke: {
              title: "Strok Posterior / Sentral (Kecemasan!)",
              action: "SEGERA KE JABATAN KECEMASAN HOSPITAL (999)! Jangan memandu sendiri."
            }
          };

      const ranked = keys
        .map((k) => ({
          key: k,
          pct: Math.round((scores[k] / total) * 100),
          title: labelMap[k].title,
          action: labelMap[k].action
        }))
        .sort((a, b) => b.pct - a.pct);

      const isEmergency =
        state.redFlags.size > 0 ||
        ranked[0].key === "stroke" ||
        (state.ear === "suddenDeafness" && (state.duration === "continuousAcute" || state.duration === "hoursToDays"));

      let html = "";
      if (isEmergency) {
        html += en
          ? `
            <div class="alert-banner alert-critical" style="margin-bottom:14px;">
              <strong>🚑 RED-FLAG EMERGENCY ALERT: URGENT HOSPITAL ASSESSMENT REQUIRED!</strong>
              <div style="margin-top:4px;">This symptom combination carries significant risk for a central cause (brainstem/cerebellar or AICA stroke). Seek emergency medical care immediately and do not attempt home head maneuvers.</div>
            </div>
          `
          : `
            <div class="alert-banner alert-critical" style="margin-bottom:14px;">
              <strong>🚑 AMARAN KECEMASAN MERAH: PERLU PENILAIAN HOSPITAL SEGERA!</strong>
              <div style="margin-top:4px;">Gabungan simptom ini mempunyai risiko punca sentral (strok batang otak/serebelum atau arteri AICA). Dapatkan rawatan kecemasan segera dan jangan cuba manuver kepala sendiri di rumah.</div>
            </div>
          `;
      }

      html += `<div class="prob-list">`;
      ranked.forEach((item, index) => {
        const barColor = item.key === "stroke" ? "#ef4444" : index === 0 ? "#0ea5e9" : "#64748b";
        html += `
          <div class="prob-item ${index === 0 ? "prob-top" : ""}">
            <div class="prob-row-head">
              <span><strong>${index + 1}. ${item.title}</strong></span>
              <span class="prob-pct" style="color:${barColor}">${item.pct}%</span>
            </div>
            <div class="prob-bar-track">
              <div class="prob-bar-fill" style="width:${item.pct}%; background:${barColor};"></div>
            </div>
            ${
              index === 0
                ? `<div class="prob-action">👉 <strong>${
                    en ? "Recommended Next Step:" : "Cadangan Langkah Seterusnya:"
                  }</strong> ${item.action}</div>`
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

    boxes.forEach((b) => b.addEventListener("change", update5D));
    update5D();
    langRefreshCallbacks.push(update5D);
  }

  // --------------------------------------------------------------------------
  // KALKULATOR NATRIUM HARIAN (PENYAKIT MENIERE < 1,500–2,000 MG)
  // --------------------------------------------------------------------------
  function initSodiumCalculator() {
    const foodContainer = document.getElementById("sodiumFoodList");
    const totalEl = document.getElementById("sodiumTotalVal");
    const barEl = document.getElementById("sodiumProgressFill");
    const msgEl = document.getElementById("sodiumAdviceMsg");
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
          <span>${food.name}</span>
          <strong>${food.mg} mg</strong>
        `;
        label.querySelector("input").addEventListener("change", (e) => {
          if (e.target.checked) selected.add(food.id);
          else selected.delete(food.id);
          renderFoods();
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
        if (sum > 2000) {
          msgEl.textContent = en
            ? "⚠️ Exceeds 2,000 mg target! Sudden salt spikes can raise inner-ear endolymph pressure and trigger Meniere's attacks."
            : "⚠️ Melebihi sasaran 2,000 mg! Lonjakan garam mendadak boleh memicu tekanan cecair endolymph dan serangan Meniere.";
          msgEl.style.color = "#f87171";
        } else if (sum >= 1500) {
          msgEl.textContent = en
            ? "⚡ Borderline range (1,500–2,000 mg). Space sodium evenly across meals & avoid extra salty snacks."
            : "⚡ Dalam julat sempadan (1,500–2,000 mg). Agihkan pengambilan garam secara sekata sepanjang hari & elakkan makanan masin tambahan.";
          msgEl.style.color = "#fbbf24";
        } else {
          msgEl.textContent = en
            ? "✅ Well controlled (<1,500 mg/day)! Drink plenty of plain water (never restrict water!) & limit caffeine."
            : "✅ Terkawal (<1,500 mg/hari)! Pastikan minum air kosong mencukupi (jangan sekat air!) & kurangkan kafein.";
          msgEl.style.color = "#34d399";
        }
      }
    }

    renderFoods();
    langRefreshCallbacks.push(renderFoods);
  }

  // --------------------------------------------------------------------------
  // KAD ANALOGI KOMUNIKASI EDUKATIF + SALIN SKRIP PESAKIT / VIDEO
  // --------------------------------------------------------------------------
  function initAnalogies() {
    const grid = document.getElementById("analogiesGrid");
    if (!grid) return;

    function renderAnalogies() {
      const en = isEn();
      grid.innerHTML = "";
      window.VERTIGO_DATA.analogies.forEach((item) => {
        const card = document.createElement("div");
        card.className = "analogy-card";
        card.innerHTML = `
          <div class="analogy-icon">${item.icon}</div>
          <h3>${item.title}</h3>
          <div class="analogy-use">${item.targetUse}</div>
          <p class="analogy-summary">${item.summary}</p>
          <details class="script-drawer">
            <summary>${
              en ? "🎬 View Patient Explanation / Video Script" : "🎬 Lihat Skrip Penerangan Pesakit / Video"
            }</summary>
            <p class="script-quote">${item.script}</p>
          </details>
          <button type="button" class="btn-secondary copy-script-btn">${
            en ? "📋 Copy Explanation Script" : "📋 Salin Skrip Komunikasi"
          }</button>
        `;

        const copyBtn = card.querySelector(".copy-script-btn");
        copyBtn.addEventListener("click", () => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(item.script).then(() => {
              copyBtn.textContent = isEn() ? "✅ Script Copied!" : "✅ Skrip Disalin!";
              setTimeout(() => {
                copyBtn.textContent = isEn() ? "📋 Copy Explanation Script" : "📋 Salin Skrip Komunikasi";
              }, 2000);
            });
          } else {
            copyBtn.textContent = isEn() ? "✅ Ready to Copy Above" : "✅ Sedia Disalin dari Kotak Skrip";
          }
        });

        grid.appendChild(card);
      });
    }

    renderAnalogies();
    langRefreshCallbacks.push(renderAnalogies);
  }

  // --------------------------------------------------------------------------
  // KUIZ KLINIKAL INTERAKTIF (5 SENARIO TRIAJ & PENGURUSAN)
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
            <span class="pill-badge pill-info">${q.badge}</span>
            <strong>${en ? "Patient:" : "Pesakit:"} ${q.patient}</strong>
          </div>
          <p class="quiz-vignette">${q.vignette}</p>
          <p class="quiz-question"><strong>${q.question}</strong></p>
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
                     <div style="margin-top:4px;">${chosenObj.feedback}</div>
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
          btn.innerHTML = `<span class="opt-letter">${opt.id.toUpperCase()}</span> <span>${opt.text}</span>`;
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
  document.addEventListener("DOMContentLoaded", () => {
    initTopControls();
    initQuickPatientHelper();
    initCausesMatrix();
    initIntelligentTriage();
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
