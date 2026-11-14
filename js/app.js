// ============================================================================
// VertigoLab — Enjin Kecerdasan Triaj, Matriks Pintar, Kalkulator & Kuiz
// ============================================================================

(function () {
  "use strict";

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
    const totalModules = 7; // sensory, anatomy, matrix, triage, hints, epley, quiz
    const pct = Math.min(100, Math.round((exploredModules.size / totalModules) * 100));
    const fill = document.getElementById("masteryProgressFill");
    const label = document.getElementById("masteryProgressPct");
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = pct + "%";
  }

  // --------------------------------------------------------------------------
  // MOD AUDIENS (AWAM vs KLINIKAL) & TEMA WARNA
  // --------------------------------------------------------------------------
  function initTopControls() {
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
        const isLight = document.body.classList.contains("light-theme");
        themeBtn.textContent = isLight ? "🌙 Mod Gelap" : "☀️ Mod Cerah";
      });
    }
  }

  // --------------------------------------------------------------------------
  // MATRIKS PINTAR 5 PUNCA UTAMA VERTIGO (TAPISAN & CARIAN)
  // --------------------------------------------------------------------------
  function initCausesMatrix() {
    const tbody = document.getElementById("causesMatrixBody");
    const pearlBox = document.getElementById("matrixActivePearl");
    if (!tbody) return;

    let activeFilter = "all";
    let searchQuery = "";

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
        tr.className = item.dangerLevel === "critical" ? "row-critical" : "";
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
          tbody.querySelectorAll("tr").forEach((r) => r.classList.remove("selected-row"));
          tr.classList.add("selected-row");
          if (pearlBox) {
            pearlBox.innerHTML = `<strong>💡 Mutiara Klinikal (${item.name} — ${item.prevalence}):</strong> ${item.pearl}`;
          }
          window.markModuleExplored("matrix");
        });

        tbody.appendChild(tr);
      });
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
  }

  // --------------------------------------------------------------------------
  // ENJIN TRIAJ DIAGNOSTIK PINTAR (PROBABILITI BERPEMBERAT + LOGIK KLINIKAL)
  // --------------------------------------------------------------------------
  function initIntelligentTriage() {
    const form = document.getElementById("triageForm");
    if (!form) return;

    const state = {
      sensation: "spinning", // 'spinning' | 'lightheaded'
      duration: "under1m", // 'under1m' | 'minsToHours' | 'hoursToDays' | 'continuousAcute'
      trigger: "positional", // 'positional' | 'postViral' | 'spontaneous' | 'sleepStressLight' | 'vascularRisk'
      ear: "none", // 'none' | 'meniereTriad' | 'suddenDeafness' | 'photophobia'
      redFlags: new Set()
    };

    function computeAssessment() {
      const container = document.getElementById("triageResultsOutput");
      if (!container) return;

      // Case 0: Not true vertigo (Presyncope / Lightheadedness)
      if (state.sensation === "lightheaded" && state.redFlags.size === 0) {
        container.innerHTML = `
          <div class="alert-banner alert-warn">
            <strong>⚠️ BUKAN VERTIGO VESTIBULAR SEBENAR (Suspek Lightheadedness / Presyncope)</strong>
            <p style="margin-top:6px;">
              Rasa gelap mata, melayang, atau hampir pitam (terutamanya semasa bangun berdiri) lazimnya berpunca daripada perubahan tekanan darah ortostatik, dehidrasi, anemia, atau faktor kardiovaskular—<strong>bukan</strong> kristal telinga dalam. Elakkan mengambil pil tahan pening vestibular tanpa semakan tekanan darah & nadi!
            </p>
          </div>
        `;
        return;
      }

      // Weighted scoring across the 5 diagnoses
      const scores = {
        bppv: 8,
        neuritis: 8,
        meniere: 8,
        migraine: 8,
        stroke: 8
      };
      const reasons = [];

      // 1. Red Flags (5D + Ataxia)
      if (state.redFlags.size > 0) {
        scores.stroke += 85;
        reasons.push(
          `🚨 <strong>Tanda Bahaya Sentral Dikesan (${state.redFlags.size} tanda):</strong> Kehadiran tanda 5D atau kegagalan berdiri tegak tanpa dipapah adalah petunjuk kuat Strok Posterior (batang otak/serebelum).`
        );
      }

      // 2. Duration (Soalan Emas #1)
      if (state.duration === "under1m") {
        scores.bppv += 48;
        scores.meniere -= 4;
        scores.neuritis -= 5;
        reasons.push("⏱️ <strong>Durasi < 1 minit:</strong> Sangat klasik bagi pergerakan mekanikal hablur otolith (BPPV).");
      } else if (state.duration === "minsToHours") {
        scores.meniere += 34;
        scores.migraine += 32;
        scores.bppv -= 4;
        reasons.push(
          "⏱️ <strong>Durasi 20 minit – 12 jam:</strong> Julat utama bagi Penyakit Meniere dan Vestibular Migraine."
        );
      } else if (state.duration === "hoursToDays") {
        scores.neuritis += 38;
        scores.migraine += 24;
        scores.stroke += 18;
        reasons.push(
          "⏱️ <strong>Berhari-hari:</strong> Lazim bagi Vestibular Neuritis (atau Vestibular Migraine berpanjangan), namun wajib saring punca sentral."
        );
      } else if (state.duration === "continuousAcute") {
        scores.stroke += 36;
        scores.neuritis += 34;
        reasons.push(
          "⏱️ <strong>Serangan Akut Berterusan (Acute Vestibular Syndrome):</strong> Wajib bezakan Vestibular Neuritis daripada Strok Posterior menggunakan protokol HINTS!"
        );
      }

      // 3. Trigger (Soalan Emas #2)
      if (state.trigger === "positional") {
        scores.bppv += 42;
        reasons.push(
          "🔄 <strong>Pencetus Ubah Posisi Kepala:</strong> Mengocak hablur otolith di dalam saluran separuh bulat."
        );
      } else if (state.trigger === "postViral") {
        scores.neuritis += 40;
        reasons.push("🦠 <strong>Pasca-Jangkitan Virus:</strong> Pencetus utama keradangan saraf vestibular.");
      } else if (state.trigger === "spontaneous") {
        scores.meniere += 25;
        scores.neuritis += 18;
        scores.stroke += 16;
      } else if (state.trigger === "sleepStressLight") {
        scores.migraine += 42;
        reasons.push(
          "💡 <strong>Kurang Tidur / Stres / Silau:</strong> Pencetus neuro-vaskular utama bagi Vestibular Migraine."
        );
      } else if (state.trigger === "vascularRisk") {
        scores.stroke += 38;
        reasons.push(
          "🩸 <strong>Faktor Risiko Vaskular (Darah Tinggi / Diabetes / AF):</strong> Meningkatkan kebarangkalian iskemia posterior."
        );
      }

      // 4. Ear & Associated Neuro Symptoms
      if (state.ear === "none") {
        scores.bppv += 14;
        scores.neuritis += 12;
      } else if (state.ear === "meniereTriad") {
        scores.meniere += 48;
        reasons.push(
          "👂 <strong>Tinnitus + Telinga Penuh + Kurang Pendengaran:</strong> Triad klasik lebihan cecair endolymph (Penyakit Meniere)."
        );
      } else if (state.ear === "suddenDeafness") {
        scores.neuritis += 28;
        scores.stroke += 26;
        reasons.push(
          "👂 <strong>Kurang Pendengaran Akut Serentak:</strong> Jika pasca-virus ia dipanggil <em>Labyrinthitis</em> (merebak ke cochlear nerve); tetapi jika akut mendadak bersama faktor vaskular, awas infarksi <em>arteri AICA</em>!"
        );
      } else if (state.ear === "photophobia") {
        scores.migraine += 40;
        reasons.push(
          "✨ <strong>Silau Cahaya (Fotofobia):</strong> Boleh mengiringi Vestibular Migraine walaupun TANPA sakit kepala berdenyut serentak."
        );
      }

      // Normalize to percentages
      const keys = Object.keys(scores);
      keys.forEach((k) => {
        if (scores[k] < 2) scores[k] = 2;
      });
      const total = keys.reduce((acc, k) => acc + scores[k], 0);

      const labelMap = {
        bppv: {
          title: "BPPV (Hablur Kristal Telinga)",
          action: "Ujian Dix-Hallpike & Epley Maneuver (elak bergantung pil tahan pening)."
        },
        neuritis: {
          title:
            state.ear === "suddenDeafness"
              ? "Labyrinthitis / Vestibular Neuritis"
              : "Vestibular Neuritis (Keradangan Saraf)",
          action: "Sahkan HINTS periferi, ubat akut <72 jam sahaja, kemudian mulakan latihan VRT."
        },
        meniere: {
          title: "Penyakit Meniere (Lebihan Cecair)",
          action: "Hadkan natrium <1,500–2,000 mg/hari, kurangkan kafein, rujuk pakar ENT & ujian audiometri."
        },
        migraine: {
          title: "Vestibular Migraine",
          action: "Stabilkan jadual tidur & hidrasi, kawal stres/silau, pertimbang profilaksis doktor."
        },
        stroke: {
          title: "Strok Posterior (Punca Sentral)",
          action: "KECEMASAN HOSPITAL SEGERA! Lakukan pemeriksaan HINTS & pengimejan neuro."
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

      const isEmergency = state.redFlags.size > 0 || ranked[0].key === "stroke";

      let html = "";
      if (isEmergency) {
        html += `
          <div class="alert-banner alert-critical" style="margin-bottom:14px;">
            <strong>🚑 AMARAN KECEMASAN MERAH: KEBARANGKALIAN PUNCA SENTRAL / STROK TINGGI!</strong>
            <div style="margin-top:4px;">Segera ke Jabatan Kecemasan Hospital. Jangan memandu sendiri dan jangan cuba melakukan manuver posisi di rumah.</div>
          </div>
        `;
      }

      html += `<div class="prob-list">`;
      ranked.forEach((item, index) => {
        const barColor =
          item.key === "stroke"
            ? "#ef4444"
            : index === 0
            ? "#0ea5e9"
            : "#64748b";
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
                ? `<div class="prob-action">👉 <strong>Fokus Tindakan:</strong> ${item.action}</div>`
                : ""
            }
          </div>
        `;
      });
      html += `</div>`;

      if (reasons.length > 0) {
        html += `<div class="reasoning-box"><h4>🧠 Penaakulan Enjin Klinikal:</h4><ul>${reasons
          .map((r) => `<li>${r}</li>`)
          .join("")}</ul></div>`;
      }

      container.innerHTML = html;
    }

    form.querySelectorAll("select, input[type='radio']").forEach((el) => {
      el.addEventListener("change", () => {
        const name = el.getAttribute("name");
        if (name && state.hasOwnProperty(name)) {
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
  }

  // --------------------------------------------------------------------------
  // SENARAI SEMAK KECEMASAN TANDA 5D (SEKSYEN 3)
  // --------------------------------------------------------------------------
  function initFiveDChecklist() {
    const boxes = document.querySelectorAll(".five-d-check");
    const statusBox = document.getElementById("fiveDStatusBox");
    if (!boxes.length || !statusBox) return;

    function update5D() {
      let checkedCount = 0;
      boxes.forEach((b) => {
        if (b.checked) checkedCount++;
      });

      if (checkedCount > 0) {
        statusBox.className = "alert-banner alert-critical";
        statusBox.innerHTML = `<strong>🚨 ${checkedCount} TANDA AMARAN MERAH DIKESAN!</strong> Vertigo disertai mana-mana tanda 5D atau kegagalan berdiri sendiri menandakan kemungkinan besar <strong>Strok Batang Otak / Serebelum</strong>. Hubungi ambulans / ke Jabatan Kecemasan SEGERA!`;
      } else {
        statusBox.className = "alert-banner alert-safe";
        statusBox.innerHTML = `<strong>ℹ️ Tiada Tanda 5D Ditanda:</strong> Walau bagaimanapun, bagi vertigo akut berterusan yang baru bermula, doktor masih perlu melakukan pemeriksaan fizikal <strong>HINTS</strong>.`;
      }
    }

    boxes.forEach((b) => b.addEventListener("change", update5D));
    update5D();
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
          msgEl.textContent =
            "⚠️ Melebihi had 2,000 mg! Lebihan garam meningkatkan tekanan cecair endolymph dan mencetuskan serangan Meniere.";
          msgEl.style.color = "#f87171";
        } else if (sum >= 1500) {
          msgEl.textContent =
            "⚡ Dalam zon sempadan (1,500–2,000 mg). Elakkan menambah kicap/sos atau makanan terproses lagi hari ini.";
          msgEl.style.color = "#fbbf24";
        } else {
          msgEl.textContent =
            "✅ Terkawal di bawah sasaran <1,500 mg sehari! Kekalkan hidrasi air kosong sekata & kurangkan kafein.";
          msgEl.style.color = "#34d399";
        }
      }
    }

    renderFoods();
  }

  // --------------------------------------------------------------------------
  // KAD ANALOGI KOMUNIKASI EDUKATIF + SALIN SKRIP PESAKIT / VIDEO
  // --------------------------------------------------------------------------
  function initAnalogies() {
    const grid = document.getElementById("analogiesGrid");
    if (!grid) return;

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
          <summary>🎬 Lihat Skrip Penerangan Pesakit / Video</summary>
          <p class="script-quote">${item.script}</p>
        </details>
        <button type="button" class="btn-secondary copy-script-btn">📋 Salin Skrip Komunikasi</button>
      `;

      const copyBtn = card.querySelector(".copy-script-btn");
      copyBtn.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(item.script).then(() => {
            copyBtn.textContent = "✅ Skrip Disalin!";
            setTimeout(() => {
              copyBtn.textContent = "📋 Salin Skrip Komunikasi";
            }, 2000);
          });
        } else {
          copyBtn.textContent = "✅ Sedia Disalin dari Kotak Skrip";
        }
      });

      grid.appendChild(card);
    });
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
            <strong>Pesakit: ${q.patient}</strong>
          </div>
          <p class="quiz-vignette">${q.vignette}</p>
          <p class="quiz-question"><strong>${q.question}</strong></p>
          <div class="quiz-options"></div>
          <div class="quiz-feedback" style="display:${chosenObj ? "block" : "none"};">
            ${
              chosenObj
                ? `<div class="alert-banner ${chosenObj.correct ? "alert-safe" : "alert-critical"}">
                     <strong>${chosenObj.correct ? "✅ Keputusan Tepat!" : "❌ Semak Semula Penaakulan Klinikal:"}</strong>
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
        scoreBadge.textContent = `Skor Ketajaman Klinikal: ${correctCount} / ${total} (${answeredCount} dijawab)`;
      }
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        Object.keys(answers).forEach((k) => delete answers[k]);
        renderQuiz();
      });
    }

    renderQuiz();
  }

  // --------------------------------------------------------------------------
  // BOOTSTRAP APLIKASI
  // --------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initTopControls();
    initCausesMatrix();
    initIntelligentTriage();
    initFiveDChecklist();
    initSodiumCalculator();
    initAnalogies();
    initClinicalQuiz();
    if (window.initAllSimulators) window.initAllSimulators();
    updateMasteryProgress();
  });
})();
