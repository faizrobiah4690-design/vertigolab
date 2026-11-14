// ============================================================================
// VertigoLab — Bilingual Clinical & Educational Database (BM & EN)
// Audited against Bárány Society (ICVD), AAO-HNS BPPV & GRACE-3 (2023) Guidelines
// ============================================================================

window.currentLang = localStorage.getItem("vertigolab_lang") === "en" ? "en" : "ms";

window.VERTIGO_DATA_BY_LANG = {
  // ==========================================================================
  // BAHASA MELAYU (MS)
  // ==========================================================================
  ms: {
    anatomyParts: [
      {
        id: "utricle-saccule",
        title: "Utricle & Saccule (Organ Otolith)",
        subtitle: "Pengesan Graviti & Gerakan Lurus",
        badge: "Sensor Graviti",
        color: "#0ea5e9",
        clinical:
          "Dua kantung makula bermembran di dalam vestibule yang mengesan pecutan linear dan tarikan graviti: utricle tersusun mendatar (mengesan gerakan maju-undur seperti kereta memecut atau kepala condong), manakala saccule tersusun menegak (mengesan gerakan atas-bawah seperti menaiki lif).",
        layman:
          "Bayangkan dua 'timbang air' pintar di dalam telinga yang memberitahu otak sama ada kepala anda sedang tegak, menunduk, naik lif, atau bergerak di dalam kereta.",
        highlightZone: "utricle"
      },
      {
        id: "otoliths",
        title: "Otoliths (Otoconia) & Otolithic Membrane",
        subtitle: "Hablur Kalsium Karbonat Mikroskopik",
        badge: "Kristal Semula Jadi",
        color: "#f59e0b",
        clinical:
          "Hablur kalsium karbonat mikroskopik (otoconia) yang melekat di atas lapisan gel membran otolitik. Apabila kepala condong, daya inersia dan graviti hablur ini menggeser lapisan gel lalu melenturkan bulu deria (stereocilia ke arah kinocilium) pada sel rambut (hair cells) untuk mengubah kadar impuls saraf vestibular (CN VIII).",
        layman:
          "Kristal kalsium halus semula jadi yang menindih bulu deria di atas lapisan gel. Bila kepala menunduk, berat kristal ini membengkokkan bulu halus untuk menghantar isyarat posisi kepala ke otak.",
        highlightZone: "otoliths"
      },
      {
        id: "semicircular-ducts",
        title: "Semicircular Ducts & Ampulla",
        subtitle: "Pengesan Putaran Kepala 3 Paksi (3D)",
        badge: "3 Gelung Putaran",
        color: "#8b5cf6",
        clinical:
          "Tiga saluran separuh bulat (posterior, anterior/superior, dan lateral/horizontal) berisi cecair endolymph yang bersudut hampir 90° antara satu sama lain. Putaran kepala menyebabkan aliran inersia endolymph memesongkan cupula di pangkal pengesan bernama ampulla, mengaktifkan Refleks Vestibulo-Okular (VOR).",
        layman:
          "Tiga tiub gelung berisi cecair yang mengesan pusingan kepala (mengangguk, menggeleng, dan teleng bahu) supaya pandangan mata kekal tajam walaupun kepala bergerak.",
        highlightZone: "canals"
      },
      {
        id: "bppv-trigger",
        title: "Mekanisme BPPV (Canalithiasis)",
        subtitle: "Hablur Tanggal & Mengocak Cecair Saluran",
        badge: "Punca #1 Vertigo",
        color: "#ef4444",
        clinical:
          "Apabila hablur otoconia tanggal daripada makula utricle (akibat faktor usia, trauma kepala ringan, kekurangan vitamin D, atau idiopatik) lalu masuk ke semicircular duct—85%–90% berlaku di kanal posterior kerana kedudukannya paling bawah—gerakan kepala menyebabkan hablur tenggelam mengikut graviti. Aliran endolymph palsu ini menarik cupula dan mencetuskan nystagmus serta vertigo berputar singkat (<1 minit).",
        layman:
          "Kristal kecil tercabut dari tempat asalnya lalu jatuh ke dalam tiub pusingan. Bila anda baring atau mengiring di katil, kristal itu bergolek mengocak air tiub seperti batu kecil—menipu otak kononnya kepala berpusing laju! Ubat pil tidak boleh 'mencairkan' kristal kalsium ini.",
        highlightZone: "bppv"
      }
    ],

    sensorPresets: {
      normal: {
        label: "Keadaan Pegun Normal",
        vestibular: "Seimbang Kiri = Kanan",
        visual: "Bilik Pegun",
        proprioception: "Tapak Kaki Stabil",
        conflictLevel: 0,
        nystagmus: "none",
        nausea: "Tiada",
        summary:
          "Ketiga-tiga sensor (telinga dalam, mata, sendi/tapak kaki) menghantar maklumat yang selari ke batang otak dan serebelum. Bebola mata tenang dan tiada loya."
      },
      trueRotation: {
        label: "Berpusing Sebenar (Fisiologi)",
        vestibular: "Putaran Dikesan (VOR Aktif)",
        visual: "Pemandangan Bergerak Selari",
        proprioception: "Daya Putaran Badan Selari",
        conflictLevel: 12,
        nystagmus: "physiologic",
        nausea: "Minimum",
        summary:
          "Semua deria bersetuju bahawa badan memang sedang berpusing. Refleks Vestibulo-Okular (VOR) menggerakkan mata secara normal untuk menstabilkan fokus penglihatan."
      },
      acuteVertigo: {
        label: "Serangan Vertigo Periferi (BPPV / Neuritis)",
        vestibular: "KECEMASAN PALSU: Berputar Laju!",
        visual: "Bilik Sedang Pegun",
        proprioception: "Katil / Lantai Pegun",
        conflictLevel: 92,
        nystagmus: "horizontal-jerk",
        nausea: "Tinggi (Pusat Muntah Aktif)",
        summary:
          "Konflik Deria Ketara! Sebelah telinga dalam menghantar isyarat kecemasan kepala berputar laju, sedangkan mata dan tapak kaki melapor badan sedang diam. Akibatnya, mata bergerak luar kawal satu arah (nystagmus periferi—berkurang bila fokus satu titik) dan refleks loya/muntah tercetus."
      },
      centralStroke: {
        label: "Vertigo Sentral (Strok Batang Otak / Serebelum)",
        vestibular: "Litar Batang Otak / Serebelum Terganggu",
        visual: "Diplopia / Fokus Lari",
        proprioception: "Ataksia Teruk (Gagal Berdiri)",
        conflictLevel: 100,
        nystagmus: "vertical-bidirectional",
        nausea: "Tinggi + Risiko Nyawa!",
        summary:
          "KECEMASAN PERUBATAN: Gangguan berlaku pada pusat pemprosesan keseimbangan di batang otak atau serebelum (cth: strok iskemia/pendarahan). Nystagmus boleh bertukar arah mengikut lirikan atau menegak tulen, tidak hilang walaupun merenung satu titik, dan sering disertai tanda 5D atau kegagalan berdiri."
      },
      presyncope: {
        label: "Bukan Vertigo: Gelap Mata (Presyncope / Ortostatik)",
        vestibular: "Normal (Tiada Ilusi Pusingan)",
        visual: "Pandangan Gelap / Kabur Seketika",
        proprioception: "Lutut Lemah Semasa Bangun Berdiri",
        conflictLevel: 10,
        nystagmus: "none",
        nausea: "Ringan / Peluh Sejuk",
        summary:
          "KESILAPAN PALING KERAP: Rasa gelap mata, kepala ringan, atau hampir pitam semasa bangun berdiri (hipotensi ortostatik, dehidrasi, kurang darah, atau masalah jantung/gula rendah) BUKAN vertigo vestibular. Dunia tidak berpusing!"
      }
    },

    causesMatrix: [
      {
        id: "bppv",
        name: "BPPV",
        fullName: "Benign Paroxysmal Positional Vertigo (Kriteria Bárány / AAO-HNS)",
        type: "Periferi (Mekanikal)",
        prevalence: "#1 Tersering (~40%–50% kes vertigo periferi)",
        duration: "Kurang 1 minit (lazimnya 15–45 saat)",
        durationTag: "seconds",
        trigger: "Ubah posisi kepala mengikut graviti (baring, mengiring di katil, mendongak, membongkok)",
        earSymptoms: "Tiada kurang pendengaran baharu atau tinnitus",
        treatment: "Manuver reposisi kanal: Epley (kanal posterior 85–90%) atau BBQ Roll/Gufoni (kanal mendatar)",
        dangerLevel: "low",
        pearl:
          "Sela masa (latency) 2–10 saat pada ujian Dix-Hallpike diikuti pusing & nystagmus yang REDA dalam <60 saat apabila kepala dikekalkan pegun. Ubat tahan pening tidak dapat mencairkan kristal kalsium!"
      },
      {
        id: "neuritis",
        name: "Vestibular Neuritis",
        fullName: "Acute Unilateral Vestibulopathy (& Labyrinthitis jika libat koklea)",
        type: "Periferi (Keradangan Saraf)",
        prevalence: "Punca ke-2 tersering vertigo periferi akut",
        duration: "Berterusan ≥ 24 jam (berhari-hari; puncak pada 24–72 jam pertama)",
        durationTag: "days",
        trigger: "Spontan (sering didahului atau dikaitkan dengan jangkitan virus)",
        earSymptoms: "Tiada bagi Vestibular Neuritis. (Jika disertai kurang pendengaran akut = Labyrinthitis!)",
        treatment: "Ubat simptom akut ≤48–72 jam SAHAJA, kortikosteroid awal terpilih (atas penilaian doktor) + VRT awal",
        dangerLevel: "moderate",
        pearl:
          "AMARAN HINTS PLUS: Jika vertigo akut berterusan hadir bersama kurang pendengaran baharu sebelah telinga, jangan terus anggap Labyrinthitis virus biasa—saring strok arteri AICA terlebih dahulu!"
      },
      {
        id: "meniere",
        name: "Penyakit Meniere",
        fullName: "Definite Meniere's Disease (Endolymphatic Hydrops — Bárány 2015)",
        type: "Periferi (Lebihan Tekanan Cecair)",
        prevalence: "Episodik kronik telinga dalam",
        duration: "20 minit hingga 12 jam setiap serangan",
        durationTag: "hours",
        trigger: "Spontan berulang (berkait fluktuasi tekanan endolymph & pengambilan garam tinggi)",
        earSymptoms: "Wajib ada simptom sebelah telinga berfluktuasi: Tinnitus + Telinga Penuh + Kurang Pendengaran (frekuensi rendah–sederhana)",
        treatment: "Diet rendah natrium sekata (<1,500–2,000 mg/hari), kurangkan kafein/alkohol, hidrasi baik, rawatan pakar ENT",
        dangerLevel: "moderate",
        pearl:
          "Diagnosis memerlukan ≥2 episod vertigo spontan (20 min–12 jam) serta bukti audiometri kurang pendengaran sensorineural pada telinga terlibat."
      },
      {
        id: "migraine",
        name: "Vestibular Migraine",
        fullName: "Migrain Vestibular (Kriteria Bárány / ICHD-3)",
        type: "Neuro-Vestibular",
        prevalence: "Punca paling kerap vertigo episodik berulang pada dewasa muda/pertengahan",
        duration: "5 minit hingga 72 jam",
        durationTag: "variable",
        trigger: "Kurang tidur, stres, silau cahaya/skrin, lapar/dehidrasi, haid, makanan pencetus",
        earSymptoms: "Pendengaran lazimnya normal; kerap ada sensitif bunyi (fonofobia) & silau cahaya (fotofobia)",
        treatment: "Stabilkan tidur, waktu makan & hidrasi, senaman aerobik ringan, elak pencetus & ubat profilaksis migrain",
        dangerLevel: "low",
        pearl:
          "FAKTA PENTING: Sehingga 30%–50% episod Vestibular Migraine berlaku bersama fotofobia/aura TANPA sakit kepala berdenyut pada waktu yang sama!"
      },
      {
        id: "stroke",
        name: "Strok Posterior (Sentral)",
        fullName: "Iskemia / Pendarahan Batang Otak & Serebelum (GRACE-3 Guideline)",
        type: "Sentral (Vaskular Kecemasan)",
        prevalence: "~10%–20% kes Acute Vestibular Syndrome di Jabatan Kecemasan",
        duration: "Berterusan akut mendadak (atau serangan sepintas TIA vaskular beberapa minit)",
        durationTag: "continuous",
        trigger: "Spontan mendadak; risiko tinggi pada darah tinggi, diabetes, fibrilasi atrium (AF), kolesterol, perokok, atau sakit leher akut",
        earSymptoms: "Lazimnya tiada, KECUALI strok arteri AICA yang menyebabkan pekak mendadak sebelah telinga!",
        treatment: "KECEMASAN HOSPITAL SEGERA (999) — Penilaian neuro-vaskular & tingkap rawatan strok akut",
        dangerLevel: "critical",
        pearl:
          "Dalam 24–48 jam pertama vertigo berterusan akut, CT otak hampir selalu terlepas strok iskemia posterior dan MRI awal masih boleh negatif palsu dalam ~15–20% kes; pemeriksaan HINTS Plus yang betul mempunyai sensitiviti ~99%!"
      },
      {
        id: "pppd",
        name: "PPPD & Pening Bukan Vertigo",
        fullName: "Persistent Postural-Perceptual Dizziness / Hipotensi Ortostatik",
        type: "Fungsional Kronik / Sistemik",
        prevalence: "Sangat lazim pada pening kronik >3 bulan atau warga emas",
        duration: "Saat sahaja semasa berdiri (Ortostatik) ATAU rasa terhuyung hampir setiap hari >3 bulan (PPPD)",
        durationTag: "other",
        trigger: "Ortostatik: Bangun berdiri cepat. PPPD: Berdiri/berjalan & persekitaran visual sibuk (pasar raya, skrol telefon)",
        earSymptoms: "Tiada simptom telinga aktif",
        treatment: "Ortostatik: Semak tekanan darah baring-berdiri, hidrasi & ubat darah tinggi. PPPD: Latihan VRT habituasi & terapi kognitif",
        dangerLevel: "low",
        pearl:
          "PPPD sering bermula selepas serangan BPPV atau Vestibular Neuritis yang sudah sembuh secara fizikal, tetapi otak kekal 'terlalu berjaga-jaga' terhadap rangsangan visual."
      }
    ],

    epleySteps: {
      left: [
        {
          step: 1,
          title: "Posisi Permulaan (Duduk & Pusing 45° Kiri)",
          timerSec: 15,
          headAngle: -45,
          bodyState: "sitting",
          canalProgress: 0.1,
          instruction:
            "Duduk tegak memanjang di atas katil. Letakkan sebiji bantal di belakang supaya apabila anda berbaring nanti, bantal berada di bawah BAHU (bukan di bawah kepala). Pusingkan kepala 45° ke arah KIRI (sebelah telinga yang bermasalah).",
          mechanism:
            "Menjajarkan saluran separuh bulat posterior kiri tepat selari dengan arah gerakan rebah badan."
        },
        {
          step: 2,
          title: "Baring Cepat & Leher Mendongak 20°–30°",
          timerSec: 45,
          headAngle: -45,
          bodyState: "supine-extended",
          canalProgress: 0.35,
          instruction:
            "Rebahkan badan ke belakang sehingga bahu terletak di atas bantal dan kepala mendongak sedikit ke bawah (20°–30°) sambil kekal berpusing 45° ke KIRI. Tunggu sekurang-kurangnya 30–60 saat (atau sehingga rasa pusing berhenti sepenuhnya + 30 saat).",
          mechanism:
            "Selepas sela masa 2–10 saat, hablur kristal mula bergerak menjauhi sensor ampulla mengikut graviti. Rasa pusing seketika pada langkah ini menandakan kristal sedang bergerak ke arah yang betul!"
        },
        {
          step: 3,
          title: "Pusing Kepala 90° ke Sisi Kanan (Tanpa Angkat Kepala)",
          timerSec: 45,
          headAngle: 45,
          bodyState: "supine-extended",
          canalProgress: 0.62,
          instruction:
            "JANGAN angkat kepala dari tilam! Pusingkan kepala 90° perlahan-lahan tetapi lancar ke arah KANAN (kini muka menghadap 45° ke kanan, leher masih mendongak sedikit). Kekalkan selama 30–60 saat.",
          mechanism:
            "Graviti menarik hablur kristal melepasi puncak lengkungan kanal menuju ke laluan keluar."
        },
        {
          step: 4,
          title: "Golek Badan Mengiring ke Kanan & Hidung Menghala Lantai",
          timerSec: 45,
          headAngle: 135,
          bodyState: "side-lying",
          canalProgress: 0.86,
          instruction:
            "Golekkan bahu dan seluruh badan mengiring ke sisi KANAN, kemudian tundukkan kepala sedikit lagi supaya hidung menghala serong 45° ke arah lantai/tilam. Kekalkan selama 30–60 saat.",
          mechanism:
            "Hablur kristal meluncur turun melalui hujung saluran (common crus) terus menuju pintu utricle."
        },
        {
          step: 5,
          title: "Bangun Duduk Perlahan & Rehat 10–15 Minit",
          timerSec: 60,
          headAngle: 0,
          bodyState: "sitting-recovery",
          canalProgress: 1.0,
          instruction:
            "Sambil mengekalkan dagu tunduk sedikit, tolak badan naik perlahan-lahan ke posisi duduk di tepi katil (kaki terjuntai). Duduk tenang selama 10–15 minit sebelum berdiri dan berjalan.",
          mechanism:
            "Hablur kristal jatuh semula ke dalam utricle (tempat asalnya). Mengikut garis panduan terkini AAO-HNS, anda TIDAK perlu memakai pendakap leher atau tidur duduk selama 48 jam!"
        }
      ],
      right: [
        {
          step: 1,
          title: "Posisi Permulaan (Duduk & Pusing 45° Kanan)",
          timerSec: 15,
          headAngle: 45,
          bodyState: "sitting",
          canalProgress: 0.1,
          instruction:
            "Duduk tegak memanjang di atas katil. Letakkan sebiji bantal di belakang supaya apabila anda berbaring nanti, bantal berada di bawah BAHU (bukan di bawah kepala). Pusingkan kepala 45° ke arah KANAN (sebelah telinga yang bermasalah).",
          mechanism:
            "Menjajarkan saluran separuh bulat posterior kanan tepat selari dengan arah gerakan rebah badan."
        },
        {
          step: 2,
          title: "Baring Cepat & Leher Mendongak 20°–30°",
          timerSec: 45,
          headAngle: 45,
          bodyState: "supine-extended",
          canalProgress: 0.35,
          instruction:
            "Rebahkan badan ke belakang sehingga bahu terletak di atas bantal dan kepala mendongak sedikit ke bawah (20°–30°) sambil kekal berpusing 45° ke KANAN. Tunggu sekurang-kurangnya 30–60 saat (atau sehingga rasa pusing berhenti sepenuhnya + 30 saat).",
          mechanism:
            "Selepas sela masa 2–10 saat, hablur kristal bergerak menjauhi sensor ampulla kanan mengikut graviti."
        },
        {
          step: 3,
          title: "Pusing Kepala 90° ke Sisi Kiri (Tanpa Angkat Kepala)",
          timerSec: 45,
          headAngle: -45,
          bodyState: "supine-extended",
          canalProgress: 0.62,
          instruction:
            "JANGAN angkat kepala dari tilam! Pusingkan kepala 90° ke arah KIRI (kini muka menghadap 45° ke kiri, leher masih mendongak sedikit). Kekalkan selama 30–60 saat.",
          mechanism:
            "Graviti menarik hablur kristal melepasi puncak lengkungan kanal kanan menuju ke laluan keluar."
        },
        {
          step: 4,
          title: "Golek Badan Mengiring ke Kiri & Hidung Menghala Lantai",
          timerSec: 45,
          headAngle: -135,
          bodyState: "side-lying",
          canalProgress: 0.86,
          instruction:
            "Golekkan bahu dan seluruh badan mengiring ke sisi KIRI, kemudian tundukkan kepala sedikit lagi supaya hidung menghala serong 45° ke arah lantai/tilam. Kekalkan selama 30–60 saat.",
          mechanism:
            "Hablur kristal meluncur turun melalui hujung saluran terus menuju pintu utricle."
        },
        {
          step: 5,
          title: "Bangun Duduk Perlahan & Rehat 10–15 Minit",
          timerSec: 60,
          headAngle: 0,
          bodyState: "sitting-recovery",
          canalProgress: 1.0,
          instruction:
            "Sambil mengekalkan dagu tunduk sedikit, tolak badan naik perlahan-lahan ke posisi duduk di tepi katil (kaki terjuntai). Duduk tenang selama 10–15 minit sebelum berdiri dan berjalan.",
          mechanism:
            "Hablur kristal kembali selamat ke dalam utricle. Mengikut garis panduan AAO-HNS, tiada keperluan memakai kolar leher atau tidur duduk 48 jam!"
        }
      ]
    },

    sodiumFoods: [
      { id: "instant-noodle", name: "Mi Segera Sup + Perencah Penuh (1 bungkus)", mg: 1450 },
      { id: "nasi-lemak", name: "Nasi Lemak Sambal + Ikan Bilis Goreng", mg: 850 },
      { id: "soy-sauce", name: "Kicap Masin / Sos Tiram (1 sudu besar)", mg: 920 },
      { id: "roti-canai", name: "Roti Canai + Kuah Dhal/Kari", mg: 620 },
      { id: "salted-fish", name: "Ikan Masin / Telur Masin (1 potong kecil)", mg: 780 },
      { id: "fast-burger", name: "Burger Ayam Goreng / Makanan Segera", mg: 980 },
      { id: "home-rice", name: "Nasi Putih + Ikan Bakar Segar + Sayur Rebus", mg: 260 },
      { id: "fresh-fruit", name: "Buah-buahan Segar & Air Kosong", mg: 15 }
    ],

    analogies: [
      {
        id: "stone-in-tube",
        icon: "🫧",
        title: "Analogi Batu Dalam Gelung Air (BPPV)",
        targetUse: "Menerangkan kenapa pil tidak boleh menyembuhkan BPPV & kenapa Epley diperlukan",
        summary:
          "Bayangkan tiub gelung berisi air dengan bulu halus pengesan arus—apabila sebutir pasir jatuh ke dalamnya, setiap kali kepala bergerak, pasir itu melanggar bulu deria dan menipu otak kononnya kepala masih berpusing.",
        script:
          "\"Tuan/Puan, di dalam telinga kita ada tiub gelung kecil berisi air yang mengesan pusingan kepala. Masalah sekarang ialah sebutir kristal kalsium halus telah tercabut lalu jatuh ke dalam tiub itu seperti sebutir batu di dalam gelung air. Setiap kali Tuan/Puan baring atau mengiring, batu itu bergolek mengocak air dan melanggar sensor deria—sebab itu dunia rasa berpusing kencang selama 20 hingga 40 saat. Makan pil tahan pening berbulan-bulan tidak boleh 'mencairkan' batu kristal ini; cara paling tepat ialah kita golekkan semula batu itu keluar ke tempat asalnya melalui gerakan Epley Maneuver.\""
      },
      {
        id: "three-gps",
        icon: "📡",
        title: "Analogi Tiga Kamera GPS Bercanggah (Loya & Muntah)",
        targetUse: "Menenangkan pesakit yang cemas apabila vertigo diiringi loya dan muntah teruk",
        summary:
          "Mata beritahu otak \"kita duduk diam\", tapak kaki beritahu \"lantai stabil\", tetapi telinga yang meradang menjerit \"kita berpusing laju\"—percanggahan isyarat ini mengaktifkan pusat muntah di batang otak.",
        script:
          "\"Rasa loya dan muntah yang teruk ini berlaku kerana otak menerima tiga laporan sensor yang bercanggah serentak. Mata Tuan/Puan melapor 'kita sedang duduk diam', tapak kaki melapor 'lantai stabil', tetapi sensor telinga dalam yang terganggu menghantar isyarat seolah-olah kepala sedang berpusing laju. Konflik deria ini mengaktifkan refleks pusat muntah di batang otak—sama seperti mekanisme mabuk laut yang kuat.\""
      },
      {
        id: "crutch-trap",
        icon: "🩼",
        title: "Analogi Tongkat Selepas Terseliuh (Bahaya Bergantung Pil Tahan Pening)",
        targetUse: "Mendidik pesakit supaya tidak makan cinnarizine / prochlorperazine berbulan-bulan",
        summary:
          "Makan pil tahan pening berbulan-bulan ibarat memakai tongkat selama-lamanya selepas kaki sembuh—otak terhalang membina pelarasan semula jadi, malah meningkatkan risiko mengantuk, jatuh, dan tangan menggigil pada warga emas.",
        script:
          "\"Ubat tahan pening seperti prochlorperazine (Stemetil) atau cinnarizine ini ibarat tongkat kecemasan semasa buku lali baru terseliuh—ia hanya wajar untuk 2 hingga 3 hari pertama semasa sedang muntah teruk. Jika dimakan berbulan-bulan, ia menidurkan isyarat keseimbangan sehingga otak gagal membina pelarasan semula jadi (central compensation), malah pada warga emas penggunaan berpanjangan boleh menyebabkan kesan sampingan mengantuk, jatuh, atau tangan menggigil (parkinsonisme cetusan ubat). Selepas 72 jam, ubat terbaik untuk melatih semula otak ialah senaman mata dan kepala (VRT).\""
      }
    ],

    clinicalQuiz: [
      {
        id: 1,
        badge: "Senario 1 • Pening Posisi di Katil",
        patient: "Puan Rahmah, 54 tahun",
        vignette:
          "Setiap pagi apabila Puan Rahmah mengiring ke kiri di atas katil atau mendongak menyidai pakaian, bilik terasa berpusing kencang selama kira-kira 25 saat kemudian hilang sepenuhnya apabila beliau kekal diam. Tiada telinga berdesing, tiada kurang pendengaran, dan tiada tanda neurologi. Beliau telah makan pil cinnarizine setiap hari selama 4 bulan tetapi serangan masih berulang.",
        question: "Apakah diagnosis paling tepat dan tindakan pengurusan terbaik mengikut garis panduan AAO-HNS?",
        options: [
          {
            id: "a",
            text: "Gandakan dos cinnarizine dan tambah prochlorperazine selama 2 bulan lagi untuk 'mencairkan' kristal telinga.",
            correct: false,
            feedback:
              "Salah & berisiko! Ubat penindas vestibular langsung TIDAK mencairkan hablur otoconia, melambatkan pemulihan otak, dan penggunaan cinnarizine/prochlorperazine berbulan-bulan meningkatkan risiko mengantuk serta parkinsonisme cetusan ubat."
          },
          {
            id: "b",
            text: "BPPV kanal posterior; sahkan dengan ujian Dix-Hallpike, lakukan Epley Maneuver, dan hentikan pengambilan pil penindas vestibular.",
            correct: true,
            feedback:
              "Tepat sekali! Episod <1 minit yang dicetuskan oleh perubahan posisi kepala tanpa simptom telinga adalah klasik bagi BPPV. Epley Maneuver memberikan kadar pemulihan 80%–90%."
          },
          {
            id: "c",
            text: "Penyakit Meniere; mulakan sekatan garam ketat bawah 1,500 mg sehari.",
            correct: false,
            feedback:
              "Tidak tepat. Kriteria Bárány bagi Penyakit Meniere memerlukan episod spontan 20 minit hingga 12 jam berserta tinnitus, telinga penuh, dan kurang pendengaran."
          },
          {
            id: "d",
            text: "Hipotensi ortostatik; nasihatkan tambah pengambilan garam harian.",
            correct: false,
            feedback:
              "Tidak tepat. Puan Rahmah mengalami ilusi berpusing sebenar (vertigo) semasa mengiring di katil, bukan gelap mata semasa bangun berdiri."
          }
        ]
      },
      {
        id: 2,
        badge: "Senario 2 • Acute Vestibular Syndrome (GRACE-3 / HINTS Plus)",
        patient: "Encik Chong, 63 tahun (Darah Tinggi & Diabetes)",
        vignette:
          "Hadir dengan vertigo berterusan mendadak sejak 5 jam lalu bersama loya dan nystagmus spontan. Semasa Head Impulse Test dilakukan, mata pesakit KEKAL TERPAKU SEMPURNA pada hidung pemeriksa tanpa saccade pembetulan (impulse normal), nystagmus bertukar arah apabila melirik kiri-kanan, dan beliau gagal berdiri tegak tanpa dipapah.",
        question: "Apakah tafsiran klinikal dan tindakan kecemasan paling tepat?",
        options: [
          {
            id: "a",
            text: "Head Impulse yang normal membuktikan sistem keseimbangan normal; benarkan pulang dengan ubat tahan muntah.",
            correct: false,
            feedback:
              "KESILAPAN BERBAHAYA! Dalam pesakit Acute Vestibular Syndrome (vertigo berterusan + nystagmus), Head Impulse yang 'normal' justru menandakan saraf telinga dalam utuh tetapi puncanya berada di BATANG OTAK / SEREBELUM (Strok)!"
          },
          {
            id: "b",
            text: "Jika imbasan CT otak atau MRI awal 12 jam pertama dilaporkan normal, strok boleh ditolak 100%.",
            correct: false,
            feedback:
              "Tidak tepat! CT otak mempunyai sensitiviti sangat rendah untuk strok iskemia posterior, malah MRI DWI awal masih boleh terlepas ~15–20% strok fossa posterior dalam 24–48 jam pertama."
          },
          {
            id: "c",
            text: "Suspek tinggi Strok Posterior (Sentral)! Aktifkan protokol strok kecemasan hospital segera; HINTS sentral + ataksia trunkal gred 3 mengatasi imbasan awal yang negatif.",
            correct: true,
            feedback:
              "Cemerlang! Mengikut garis panduan GRACE-3, mana-mana satu tanda sentral pada HINTS Plus atau ketidakupayaan berdiri sendiri dalam vertigo akut berterusan mewajibkan pengurusan strok posterior segera."
          },
          {
            id: "d",
            text: "Lakukan Epley Maneuver berulang kali di Jabatan Kecemasan.",
            correct: false,
            feedback:
              "Salah! Epley Maneuver hanya untuk BPPV (<1 minit dicetuskan posisi), bukan untuk vertigo berterusan dengan tanda strok sentral."
          }
        ]
      },
      {
        id: 3,
        badge: "Senario 3 • Pemulihan Pasca-Neuritis & Had 72 Jam Ubat",
        patient: "Amir, 34 tahun",
        vignette:
          "Mengalami vertigo spontan berterusan beberapa hari selepas jangkitan virus. Pendengaran normal sepenuhnya, tiada tanda 5D, beliau boleh berdiri sendiri walaupun sedikit goyang, dan HINTS Plus oleh doktor mengesahkan punca periferi sepenuhnya. Kini hari ke-5 dan muntah sudah berhenti.",
        question: "Apakah langkah pemulihan terbaik mulai hari ke-5?",
        options: [
          {
            id: "a",
            text: "Vestibular Neuritis (Acute Unilateral Vestibulopathy); hentikan ubat penindas vestibular (melepasi 72 jam) dan mulakan Latihan Rehabilitasi Vestibular (VRT / gaze stabilization).",
            correct: true,
            feedback:
              "Tepat! Menghentikan penindas vestibular selepas fasa muntah akut (≤72 jam) dan memulakan latihan pergerakan mata-kepala (VRT) memacu neuroplastisiti otak (central compensation)."
          },
          {
            id: "b",
            text: "Labyrinthitis; teruskan prochlorperazine selama 8 minggu.",
            correct: false,
            feedback:
              "Tidak tepat: pendengaran Amir normal (jadi ia Vestibular Neuritis, bukan Labyrinthitis), dan prochlorperazine 8 minggu akan menghalang pampasan otak."
          },
          {
            id: "c",
            text: "Baring kaku di bilik gelap tanpa menggerakkan kepala selama 3 minggu.",
            correct: false,
            feedback:
              "Salah! Imobilisasi berpanjangan melambatkan pemulihan keseimbangan dan meningkatkan risiko berkembang menjadi PPPD."
          },
          {
            id: "d",
            text: "Sekat garam bawah 500 mg sehari.",
            correct: false,
            feedback:
              "Tidak berkaitan; diet rendah natrium dikhususkan untuk mengawal hidrops endolymph dalam Penyakit Meniere."
          }
        ]
      },
      {
        id: 4,
        badge: "Senario 4 • Episod Pusing + Silau Cahaya Tanpa Sakit Kepala",
        patient: "Cik Nadia, 29 tahun",
        vignette:
          "Mengalami beberapa episod dunia berpusing selama 3 hingga 6 jam setiap kali kurang tidur dan stres kerja. Beliau mempunyai sejarah migrain sejak remaja. Semasa episod berpusing ini, beliau berasa sangat silau melihat cahaya (fotofobia), tetapi TIADA sakit kepala berdenyut serentak dan ujian pendengaran adalah normal.",
        question: "Apakah diagnosis paling bertepatan mengikut kriteria Bárány Society?",
        options: [
          {
            id: "a",
            text: "Penyakit Meniere dua belah telinga.",
            correct: false,
            feedback:
              "Tidak tepat kerana tiada kurang pendengaran frekuensi rendah, tinnitus, atau rasa telinga penuh."
          },
          {
            id: "b",
            text: "Vestibular Migraine; stabilkan jadual tidur, waktu makan & hidrasi, urus pencetus silau/stres, dan bincang rawatan profilaksis jika kerap.",
            correct: true,
            feedback:
              "Tepat! Sehingga separuh serangan Vestibular Migraine berlaku bersama ciri migrain (seperti fotofobia/aura) tanpa sakit kepala serentak."
          },
          {
            id: "c",
            text: "BPPV kanal posterior.",
            correct: false,
            feedback:
              "Tidak tepat; episod BPPV berlangsung kurang 1 minit, bukannya 3 hingga 6 jam secara berterusan."
          },
          {
            id: "d",
            text: "Bukan penyakit sebenar kerana tiada sakit kepala atau pekak.",
            correct: false,
            feedback:
              "Salah! Vestibular Migraine adalah entiti neuro-vestibular sah yang diiktiraf oleh Bárány Society dan ICHD-3."
          }
        ]
      },
      {
        id: 5,
        badge: "Senario 5 • Gelap Mata Warga Emas vs Vertigo",
        patient: "Pak Samad, 68 tahun (Baru Ditukar Dos Ubat Darah Tinggi)",
        vignette:
          "Mengadu 'pening vertigo' setiap kali bangun cepat daripada duduk atau sujud—pandangan menjadi gelap berbintang ('gelap mata'), kepala rasa ringan dan hampir pitam selama beberapa saat, tetapi bilik langsung TIDAK terasa berpusing. Simptom tidak pernah berlaku semasa berbaring mengiring di atas katil.",
        question: "Apakah penilaian perubatan yang paling tepat dan selamat?",
        options: [
          {
            id: "a",
            text: "Ini ialah presyncope / pening ortostatik (bukan vertigo vestibular); periksa tekanan darah baring-berdiri, hidrasi, dan semak ubat darah tinggi bersama doktor.",
            correct: true,
            feedback:
              "Tepat 100%! Membezakan presyncope ortostatik daripada vertigo mengelakkan pemberian pil tahan pening yang tidak perlu (yang malah boleh menyebabkan warga emas jatuh!)."
          },
          {
            id: "b",
            text: "Lakukan Epley Maneuver kedua-dua belah telinga serta-merta.",
            correct: false,
            feedback:
              "Tidak sesuai kerana tiada ilusi berpusing dan tidak dicetuskan oleh baring mengiring."
          },
          {
            id: "c",
            text: "Beri cinnarizine 3 kali sehari untuk jangka panjang.",
            correct: false,
            feedback:
              "Berbahaya pada warga emas! Cinnarizine tidak merawat tekanan darah rendah ortostatik dan boleh menyebabkan mengantuk, jatuh, serta parkinsonisme cetusan ubat."
          },
          {
            id: "d",
            text: "Sekat air minuman supaya telinga kering.",
            correct: false,
            feedback:
              "Salah dan berbahaya; dehidrasi akan memburukkan lagi penurunan tekanan darah ortostatik!"
          }
        ]
      }
    ]
  },

  // ==========================================================================
  // ENGLISH (EN)
  // ==========================================================================
  en: {
    anatomyParts: [
      {
        id: "utricle-saccule",
        title: "Utricle & Saccule (Otolith Organs)",
        subtitle: "Gravity & Linear Acceleration Sensors",
        badge: "Gravity Sensors",
        color: "#0ea5e9",
        clinical:
          "Two membranous macular sacs inside the vestibule that detect linear acceleration and gravitational pull: the horizontally oriented utricle detects fore-aft motion and head tilt (e.g., car accelerating), while the vertically oriented saccule detects up-down motion (e.g., riding an elevator).",
        layman:
          "Think of two smart 'spirit levels' inside your inner ear that tell your brain whether your head is upright, tilted, riding an elevator, or accelerating in a car.",
        highlightZone: "utricle"
      },
      {
        id: "otoliths",
        title: "Otoliths (Otoconia) & Otolithic Membrane",
        subtitle: "Microscopic Calcium Carbonate Crystals",
        badge: "Balance Crystals",
        color: "#f59e0b",
        clinical:
          "Microscopic calcium carbonate crystals (otoconia) embedded atop the gelatinous otolithic membrane. Head tilt or linear inertia shears this gel layer, deflecting hair-cell stereocilia (toward or away from the kinocilium) to modulate firing rates along the vestibular nerve (CN VIII).",
        layman:
          "Tiny natural calcium crystals resting on a gel layer above delicate sensory hairs. When you tilt your head, the weight of these crystals bends the hairs to send precise head-position signals to your brain.",
        highlightZone: "otoliths"
      },
      {
        id: "semicircular-ducts",
        title: "Semicircular Ducts & Ampulla",
        subtitle: "3-Axis Rotational Head Sensors (3D)",
        badge: "3 Rotation Loops",
        color: "#8b5cf6",
        clinical:
          "Three fluid-filled semicircular ducts (posterior, anterior/superior, and lateral/horizontal) arranged roughly 90° apart. Angular head rotation causes inertial endolymph flow that deflects the cupula within the ampulla, driving the Vestibulo-Ocular Reflex (VOR).",
        layman:
          "Three fluid-filled loop tubes that detect head rotation in 3D (nodding, shaking, and tilting) so your vision stays crystal-clear even while your head moves.",
        highlightZone: "canals"
      },
      {
        id: "bppv-trigger",
        title: "BPPV Mechanism (Canalithiasis)",
        subtitle: "Detached Crystals Sloshing Inside a Canal",
        badge: "#1 Cause of Vertigo",
        color: "#ef4444",
        clinical:
          "When otoconia detach from the utricular macula (due to aging, mild head trauma, vitamin D deficiency, or idiopathic causes) and migrate into a semicircular duct—85%–90% enter the posterior canal due to gravity—positional head changes cause the crystals to sink, creating a plunger-like endolymph current that deflects the cupula and triggers brief (<1 min) spinning vertigo and nystagmus.",
        layman:
          "Loose calcium crystals fall out of their home pouch into one of the rotation tubes. Every time you lie down or roll over in bed, those crystals tumble like pebbles in a water tube—tricking your brain into thinking the room is spinning! Pills cannot 'dissolve' these crystals.",
        highlightZone: "bppv"
      }
    ],

    sensorPresets: {
      normal: {
        label: "Normal Stationary Rest",
        vestibular: "Balanced Left = Right",
        visual: "Stationary Room",
        proprioception: "Stable Floor / Joints",
        conflictLevel: 0,
        nystagmus: "none",
        nausea: "None",
        summary:
          "All three sensory systems (inner ear, eyes, and muscles/joints) send matching reports to the brainstem and cerebellum. Eyes remain steady with zero nausea."
      },
      trueRotation: {
        label: "True Physical Rotation",
        vestibular: "Rotation Detected (VOR Active)",
        visual: "Matching Visual Motion",
        proprioception: "Matching Rotational Force",
        conflictLevel: 12,
        nystagmus: "physiologic",
        nausea: "Minimal",
        summary:
          "All sensors agree that your body is genuinely spinning. The physiologic Vestibulo-Ocular Reflex (VOR) smoothly stabilizes your gaze."
      },
      acuteVertigo: {
        label: "Peripheral Vertigo Attack (BPPV / Neuritis)",
        vestibular: "FALSE ALARM: Spinning Fast!",
        visual: "Room Is Still",
        proprioception: "Bed / Floor Is Still",
        conflictLevel: 92,
        nystagmus: "horizontal-jerk",
        nausea: "High (Vomiting Center Active)",
        summary:
          "Severe Sensory Conflict! One inner ear screams that your head is spinning rapidly while your eyes and feet report you are completely still. This mismatch drives involuntary unidirectional eye jerks (peripheral nystagmus—dampened by visual fixation) and brainstem nausea."
      },
      centralStroke: {
        label: "Central Vertigo (Brainstem / Cerebellar Stroke)",
        vestibular: "Central Brainstem Pathway Disrupted",
        visual: "Diplopia / Skewed Alignment",
        proprioception: "Severe Ataxia (Cannot Stand)",
        conflictLevel: 100,
        nystagmus: "vertical-bidirectional",
        nausea: "High + Medical Emergency!",
        summary:
          "MEDICAL EMERGENCY: The lesion lies in the brainstem or cerebellar balance centers (ischemic or hemorrhagic stroke). Nystagmus may change direction with gaze or beat purely vertically, fails to suppress with visual fixation, and often presents with 5D signs or inability to stand."
      },
      presyncope: {
        label: "Not Vertigo: Lightheadedness (Orthostatic Presyncope)",
        vestibular: "Normal (No Spinning Illusion)",
        visual: "Temporary Dimming / Tunnel Vision",
        proprioception: "Weak Knees Upon Standing",
        conflictLevel: 10,
        nystagmus: "none",
        nausea: "Mild / Sweaty",
        summary:
          "MOST COMMON MISCONCEPTION: Dimming vision, lightheadedness, or feeling faint when standing up (orthostatic hypotension, dehydration, anemia, hypoglycemia, or arrhythmia) is presyncope—NOT inner-ear vertigo. The room does not spin!"
      }
    },

    causesMatrix: [
      {
        id: "bppv",
        name: "BPPV",
        fullName: "Benign Paroxysmal Positional Vertigo (Bárány / AAO-HNS Criteria)",
        type: "Peripheral (Mechanical)",
        prevalence: "#1 Most Common (~40%–50% of peripheral vertigo)",
        duration: "Under 1 minute (typically 15–45 seconds)",
        durationTag: "seconds",
        trigger: "Gravity-dependent head position changes (lying down, rolling over in bed, looking up)",
        earSymptoms: "None (no new hearing loss or tinnitus)",
        treatment: "Canalith repositioning: Epley Maneuver (posterior canal 85–90%) or BBQ Roll/Gufoni (horizontal canal)",
        dangerLevel: "low",
        pearl:
          "Dix-Hallpike shows a 2–10s latency followed by torsional-upbeating nystagmus & spinning that RESOLVES within <60s if the head is held still. Vestibular suppressant pills cannot dissolve calcium crystals!"
      },
      {
        id: "neuritis",
        name: "Vestibular Neuritis",
        fullName: "Acute Unilateral Vestibulopathy (& Labyrinthitis if cochlear involved)",
        type: "Peripheral (Nerve Inflammation)",
        prevalence: "2nd most common peripheral cause",
        duration: "Continuous ≥ 24 hours (days; peaks in first 24–72 hours)",
        durationTag: "days",
        trigger: "Spontaneous onset (often preceded by a viral upper respiratory infection)",
        earSymptoms: "None in Vestibular Neuritis. (If accompanied by acute hearing loss = Labyrinthitis!)",
        treatment: "Short acute anti-emetics ≤48–72 hours ONLY, selective early corticosteroids (per physician) + early VRT",
        dangerLevel: "moderate",
        pearl:
          "HINTS PLUS WARNING: If acute continuous vertigo is accompanied by new unilateral hearing loss, do NOT assume benign viral labyrinthitis—rule out AICA stroke urgently!"
      },
      {
        id: "meniere",
        name: "Meniere's Disease",
        fullName: "Definite Meniere's Disease (Endolymphatic Hydrops — Bárány 2015)",
        type: "Peripheral (Fluid Pressure)",
        prevalence: "Chronic episodic unilateral disorder",
        duration: "20 minutes to 12 hours per attack",
        durationTag: "hours",
        trigger: "Spontaneous recurrent episodes (linked to endolymph pressure & high sodium spikes)",
        earSymptoms: "Fluctuating unilateral triad: Tinnitus + Aural Fullness + Low-to-Medium Frequency Hearing Loss",
        treatment: "Evenly spaced low-sodium diet (<1,500–2,000 mg/day), limit caffeine/alcohol, good hydration, ENT care",
        dangerLevel: "moderate",
        pearl:
          "Definite diagnosis requires ≥2 spontaneous vertigo episodes (20 min–12 hr) plus audiometrically documented sensorineural hearing loss in the affected ear."
      },
      {
        id: "migraine",
        name: "Vestibular Migraine",
        fullName: "Vestibular Migraine (Bárány / ICHD-3 Criteria)",
        type: "Neuro-Vestibular",
        prevalence: "Leading cause of recurrent episodic vertigo in young/middle-aged adults",
        duration: "5 minutes to 72 hours",
        durationTag: "variable",
        trigger: "Poor sleep, stress, bright/flickering lights, skipped meals, dehydration, hormonal shifts",
        earSymptoms: "Hearing usually normal; prominent light sensitivity (photophobia) & sound sensitivity (phonophobia)",
        treatment: "Regular sleep/meals/hydration, trigger management, aerobic exercise & migraine prophylaxis",
        dangerLevel: "low",
        pearl:
          "KEY CLINICAL FACT: Up to 30%–50% of Vestibular Migraine attacks occur with photophobia or aura WITHOUT a concurrent throbbing headache!"
      },
      {
        id: "stroke",
        name: "Posterior Stroke (Central)",
        fullName: "Brainstem / Cerebellar Ischemia or Hemorrhage (GRACE-3 Guideline)",
        type: "Central (Vascular Emergency)",
        prevalence: "~10%–20% of Acute Vestibular Syndrome cases in Emergency Departments",
        duration: "Abrupt continuous vertigo (or brief vascular TIA episodes lasting minutes)",
        durationTag: "continuous",
        trigger: "Sudden spontaneous onset; high risk with hypertension, diabetes, AFib, smoking, or acute neck pain (vertebral dissection)",
        earSymptoms: "Usually absent, EXCEPT AICA territory stroke which causes acute unilateral deafness!",
        treatment: "IMMEDIATE HOSPITAL EMERGENCY (999) — Acute stroke protocol & neuro-vascular imaging",
        dangerLevel: "critical",
        pearl:
          "Within the first 24–48 hours of continuous vertigo, head CT misses most posterior ischemic strokes and early DWI-MRI still misses ~15–20%; a trained HINTS Plus exam achieves ~99% sensitivity!"
      },
      {
        id: "pppd",
        name: "PPPD & Non-Vertigo Mimics",
        fullName: "Persistent Postural-Perceptual Dizziness / Orthostatic Hypotension",
        type: "Chronic Functional / Systemic",
        prevalence: "Very common in chronic dizziness >3 months or older adults",
        duration: "Seconds upon standing (Orthostatic) OR near-daily non-spinning swaying >3 months (PPPD)",
        durationTag: "other",
        trigger: "Orthostatic: Standing up quickly. PPPD: Upright posture, walking & busy visual scenes (supermarkets, scrolling)",
        earSymptoms: "No active inner-ear symptoms",
        treatment: "Orthostatic: Lying-standing BP check, hydration & medication review. PPPD: Habituation VRT & CBT",
        dangerLevel: "low",
        pearl:
          "PPPD frequently develops after an acute BPPV or neuritis episode has physically healed, when the brain remains stuck in high-alert visual dependence."
      }
    ],

    epleySteps: {
      left: [
        {
          step: 1,
          title: "Starting Position (Sit Upright & Turn Head 45° Left)",
          timerSec: 15,
          headAngle: -45,
          bodyState: "sitting",
          canalProgress: 0.1,
          instruction:
            "Sit upright lengthwise on the bed. Place a pillow behind you positioned so that when you lie back, it rests beneath your SHOULDERS (not your head). Turn your head 45° to the LEFT (the affected ear).",
          mechanism:
            "Aligns the left posterior semicircular canal directly with the plane in which you will lie back."
        },
        {
          step: 2,
          title: "Lie Back Briskly with Neck Extended 20°–30°",
          timerSec: 45,
          headAngle: -45,
          bodyState: "supine-extended",
          canalProgress: 0.35,
          instruction:
            "Lie back briskly onto your shoulders on the pillow so your neck extends slightly backward (20°–30°) while keeping your head turned 45° LEFT. Hold for at least 30–60 seconds (until any spinning stops + 30 seconds).",
          mechanism:
            "After a 2–10s latency, gravity pulls the otoconia crystals away from the ampulla sensor along the bottom curve of the canal."
        },
        {
          step: 3,
          title: "Turn Head 90° to the Right (Without Lifting Head)",
          timerSec: 45,
          headAngle: 45,
          bodyState: "supine-extended",
          canalProgress: 0.62,
          instruction:
            "DO NOT lift your head off the bed! Smoothly rotate your head 90° to the RIGHT (now facing 45° right, neck still slightly extended). Hold for 30–60 seconds.",
          mechanism:
            "Gravity guides the crystals over the apex of the posterior canal toward the exit limb."
        },
        {
          step: 4,
          title: "Roll Body onto Right Side & Point Nose 45° Toward Floor",
          timerSec: 45,
          headAngle: 135,
          bodyState: "side-lying",
          canalProgress: 0.86,
          instruction:
            "Roll your shoulders and body onto your RIGHT side, rotating your head further so your nose points 45° downward toward the mattress/floor. Hold for 30–60 seconds.",
          mechanism:
            "Crystals slide down through the common crus exit straight toward the utricle opening."
        },
        {
          step: 5,
          title: "Sit Up Slowly & Rest Quietly for 10–15 Minutes",
          timerSec: 60,
          headAngle: 0,
          bodyState: "sitting-recovery",
          canalProgress: 1.0,
          instruction:
            "Keeping your chin slightly tucked, push yourself slowly up to a seated position on the edge of the bed. Sit calmly for 10–15 minutes before standing up and walking.",
          mechanism:
            "Crystals settle safely back inside the utricle. Per updated AAO-HNS guidelines, strict 48-hour neck collars or sleeping upright are NOT required!"
        }
      ],
      right: [
        {
          step: 1,
          title: "Starting Position (Sit Upright & Turn Head 45° Right)",
          timerSec: 15,
          headAngle: 45,
          bodyState: "sitting",
          canalProgress: 0.1,
          instruction:
            "Sit upright lengthwise on the bed. Place a pillow behind you so it rests beneath your SHOULDERS when lying down. Turn your head 45° to the RIGHT (the affected ear).",
          mechanism:
            "Aligns the right posterior semicircular canal with the reclining plane."
        },
        {
          step: 2,
          title: "Lie Back Briskly with Neck Extended 20°–30°",
          timerSec: 45,
          headAngle: 45,
          bodyState: "supine-extended",
          canalProgress: 0.35,
          instruction:
            "Lie back briskly with your shoulders on the pillow and neck extended 20°–30° while keeping your head turned 45° RIGHT. Hold for 30–60 seconds (until spinning stops + 30s).",
          mechanism:
            "After a 2–10s latency, gravity moves the crystals away from the right ampulla."
        },
        {
          step: 3,
          title: "Turn Head 90° to the Left (Without Lifting Head)",
          timerSec: 45,
          headAngle: -45,
          bodyState: "supine-extended",
          canalProgress: 0.62,
          instruction:
            "DO NOT lift your head! Rotate your head 90° to the LEFT (now facing 45° left, neck still slightly extended). Hold for 30–60 seconds.",
          mechanism:
            "Gravity guides the crystals over the top arch of the right posterior canal."
        },
        {
          step: 4,
          title: "Roll Body onto Left Side & Point Nose 45° Toward Floor",
          timerSec: 45,
          headAngle: -135,
          bodyState: "side-lying",
          canalProgress: 0.86,
          instruction:
            "Roll your shoulders and body onto your LEFT side and turn your head so your nose points 45° downward toward the floor. Hold for 30–60 seconds.",
          mechanism:
            "Crystals travel down the exit limb into the utricle."
        },
        {
          step: 5,
          title: "Sit Up Slowly & Rest Quietly for 10–15 Minutes",
          timerSec: 60,
          headAngle: 0,
          bodyState: "sitting-recovery",
          canalProgress: 1.0,
          instruction:
            "With your chin slightly tucked, push up slowly to sit on the side of the bed. Sit calmly for 10–15 minutes before walking.",
          mechanism:
            "Crystals return safely to the utricle. Per AAO-HNS guidelines, 48-hour upright sleeping restrictions are unnecessary!"
        }
      ]
    },

    sodiumFoods: [
      { id: "instant-noodle", name: "Instant Noodle Soup + Full Seasoning (1 pack)", mg: 1450 },
      { id: "nasi-lemak", name: "Nasi Lemak with Sambal & Fried Anchovies", mg: 850 },
      { id: "soy-sauce", name: "Soy Sauce / Oyster Sauce (1 tablespoon)", mg: 920 },
      { id: "roti-canai", name: "Roti Canai + Dhal/Curry Gravy", mg: 620 },
      { id: "salted-fish", name: "Salted Fish / Salted Egg (1 small serving)", mg: 780 },
      { id: "fast-burger", name: "Fried Chicken Burger / Fast Food Meal", mg: 980 },
      { id: "home-rice", name: "Steamed Rice + Fresh Grilled Fish + Greens", mg: 260 },
      { id: "fresh-fruit", name: "Fresh Fruit & Plain Water", mg: 15 }
    ],

    analogies: [
      {
        id: "stone-in-tube",
        icon: "🫧",
        title: "Pebble in a Water Loop Analogy (BPPV)",
        targetUse: "Explains why anti-dizziness pills cannot cure BPPV & why the Epley Maneuver works",
        summary:
          "Picture a water-filled loop tube lined with delicate motion-sensing hairs—if a tiny grain of sand falls inside, every head turn rolls that grain across the sensors and tricks your brain into feeling a spin.",
        script:
          "\"Inside your ear are tiny fluid-filled loops that detect head rotation. Right now, a microscopic calcium crystal has slipped loose into one of those loops like a pebble in a water tube. Every time you lie down or roll over in bed, that pebble rolls through the fluid and trips the motion sensor—making the room spin for 20 to 40 seconds. Taking dizziness pills for months cannot 'dissolve' a calcium crystal; instead, we gently roll the crystal back to its home pouch using the Epley Maneuver.\""
      },
      {
        id: "three-gps",
        icon: "📡",
        title: "Three Conflicting GPS Cameras Analogy (Nausea & Spinning)",
        targetUse: "Reassures anxious patients when vertigo triggers intense nausea and vomiting",
        summary:
          "Your eyes tell your brain \"we're sitting still\", your feet report \"the floor is steady\", while the irritated ear screams \"we're spinning fast!\"—this sensory clash triggers the brainstem vomiting reflex.",
        script:
          "\"The intense nausea happens because your brain is receiving three conflicting sensor reports at the exact same moment. Your eyes report 'the room is still', your feet report 'the floor is solid', but the inflamed inner-ear nerve shouts 'we are spinning rapidly!'. That mismatch activates your brainstem's motion-sickness alarm, just like severe seasickness.\""
      },
      {
        id: "crutch-trap",
        icon: "🩼",
        title: "The Forever-Crutch Trap (Danger of Prolonged Suppressant Pills)",
        targetUse: "Educates patients to stop vestibular suppressants after the acute 48–72 hour phase",
        summary:
          "Taking dizziness pills (cinnarizine/prochlorperazine) for months is like using crutches forever after a healed ankle sprain—it blocks natural brain compensation and raises fall and tremor risks in older adults.",
        script:
          "\"Anti-vertigo pills like prochlorperazine or cinnarizine act like temporary crutches during the first 2 to 3 days of severe vomiting. But if you keep taking them for months, they numb the signals your brain needs to recalibrate (central compensation)—and in older adults, long-term use increases drowsiness, falls, and even drug-induced tremor/parkinsonism. After 72 hours, gentle eye-and-head exercises (VRT) are what truly retrain your balance.\""
      }
    ],

    clinicalQuiz: [
      {
        id: 1,
        badge: "Scenario 1 • Positional Bedtime Spinning",
        patient: "Mrs. Rahmah, 54 years old",
        vignette:
          "Every morning when Mrs. Rahmah rolls onto her left side in bed or looks up to hang laundry, the room spins intensely for ~25 seconds and stops completely once she holds still. She has no tinnitus, no hearing loss, and no neurologic deficits. She has taken cinnarizine daily for 4 months, yet attacks still recur.",
        question: "What is the most accurate diagnosis and AAO-HNS guideline-concordant management?",
        options: [
          {
            id: "a",
            text: "Double her cinnarizine dose and add prochlorperazine for 2 more months to 'dissolve' the ear crystals.",
            correct: false,
            feedback:
              "Incorrect & unsafe! Vestibular suppressants CANNOT dissolve otoconia crystals, delay brain compensation, and carry sedation/fall/parkinsonism risks when used chronically."
          },
          {
            id: "b",
            text: "Posterior canal BPPV; confirm with the Dix-Hallpike test, perform the Epley Maneuver, and discontinue daily vestibular suppressants.",
            correct: true,
            feedback:
              "Spot on! Brief (<1 min) episodes triggered by head-position changes without ear symptoms are classic BPPV. The Epley Maneuver achieves an 80%–90% success rate."
          },
          {
            id: "c",
            text: "Meniere's Disease; start strict <1,500 mg/day sodium restriction immediately.",
            correct: false,
            feedback:
              "Incorrect. Bárány criteria for Meniere's require spontaneous 20-minute to 12-hour episodes with fluctuating unilateral hearing loss, tinnitus, and fullness."
          },
          {
            id: "d",
            text: "Orthostatic hypotension; advise higher daily salt intake.",
            correct: false,
            feedback:
              "Incorrect. She experiences true rotational vertigo while rolling over in bed, not lightheadedness upon standing."
          }
        ]
      },
      {
        id: 2,
        badge: "Scenario 2 • Acute Vestibular Syndrome (GRACE-3 / HINTS Plus)",
        patient: "Mr. Chong, 63 years old (Hypertension & Diabetes)",
        vignette:
          "Presents with 5 hours of sudden, continuous vertigo, nausea, and spontaneous nystagmus. On rapid Head Impulse Testing, his eyes remain PERFECTLY LOCKED on the examiner's nose without a corrective saccade (normal impulse), nystagmus reverses direction on left vs right gaze, and he cannot stand unassisted.",
        question: "What is the critical clinical interpretation and triage decision?",
        options: [
          {
            id: "a",
            text: "A normal Head Impulse Test proves his balance nerve is healthy; discharge home on anti-emetics.",
            correct: false,
            feedback:
              "CRITICAL DANGER! In Acute Vestibular Syndrome (continuous vertigo + nystagmus), a 'normal' Head Impulse Test indicates an intact inner ear—pointing strongly to a BRAINSTEM / CEREBELLAR STROKE!"
          },
          {
            id: "b",
            text: "If a head CT or early 12-hour MRI comes back negative, stroke is 100% ruled out.",
            correct: false,
            feedback:
              "Incorrect! Non-contrast CT misses most posterior ischemic strokes, and early DWI-MRI still misses ~15–20% within the first 24–48 hours."
          },
          {
            id: "c",
            text: "High suspicion for Posterior Circulation Stroke! Activate emergency hospital stroke protocol immediately; central HINTS + severe truncal ataxia outweighs an early negative scan.",
            correct: true,
            feedback:
              "Excellent! Per GRACE-3 guidelines, any single central feature on HINTS Plus or inability to stand unassisted in acute continuous vertigo mandates urgent posterior stroke evaluation."
          },
          {
            id: "d",
            text: "Perform repeated Epley Maneuvers in the Emergency Department.",
            correct: false,
            feedback:
              "Wrong! Epley is solely for brief positional BPPV, never for continuous AVS with central signs."
          }
        ]
      },
      {
        id: 3,
        badge: "Scenario 3 • Post-Viral Neuritis & the 72-Hour Suppressant Rule",
        patient: "Amir, 34 years old",
        vignette:
          "Developed continuous spontaneous vertigo several days after a viral cold. Hearing is completely intact, there are no 5D signs, he can stand unassisted, and a physician's HINTS Plus exam confirmed a purely peripheral pattern. It is now Day 5 and vomiting has stopped.",
        question: "What is the optimal recovery plan starting on Day 5?",
        options: [
          {
            id: "a",
            text: "Vestibular Neuritis (Acute Unilateral Vestibulopathy); stop vestibular suppressant pills (past 72h) and begin Vestibular Rehabilitation Therapy (VRT / gaze stabilization).",
            correct: true,
            feedback:
              "Correct! Stopping vestibular suppressants once acute vomiting subsides (≤72h) and starting structured head-eye exercises drives central vestibular compensation."
          },
          {
            id: "b",
            text: "Labyrinthitis; continue prochlorperazine three times daily for 8 weeks.",
            correct: false,
            feedback:
              "Incorrect: hearing is intact (Vestibular Neuritis, not Labyrinthitis), and 8 weeks of prochlorperazine blocks brain recovery."
          },
          {
            id: "c",
            text: "Lie completely motionless in a dark room for 3 weeks.",
            correct: false,
            feedback:
              "Incorrect! Prolonged avoidance of head movement delays recovery and increases the risk of developing PPPD."
          },
          {
            id: "d",
            text: "Restrict sodium below 500 mg/day.",
            correct: false,
            feedback:
              "Unrelated; low-sodium diets target endolymphatic hydrops in Meniere's Disease."
          }
        ]
      },
      {
        id: 4,
        badge: "Scenario 4 • Spinning + Light Sensitivity Without Headache",
        patient: "Ms. Nadia, 29 years old",
        vignette:
          "Reports recurrent 3-to-6-hour episodes of room spinning triggered by sleep deprivation and heavy screen work. She has a history of migraines since her teens. During vertigo episodes she has marked photophobia, NO concurrent throbbing headache, and normal hearing.",
        question: "Which diagnosis best fits Bárány Society criteria?",
        options: [
          {
            id: "a",
            text: "Bilateral Meniere's Disease.",
            correct: false,
            feedback:
              "Incorrect—she has normal hearing and no fluctuating tinnitus or aural fullness."
          },
          {
            id: "b",
            text: "Vestibular Migraine; stabilize sleep, meal timing & hydration, manage light/stress triggers, and discuss migraine prophylaxis if frequent.",
            correct: true,
            feedback:
              "Correct! Up to half of Vestibular Migraine episodes present with migrainous features (like photophobia) without a simultaneous headache."
          },
          {
            id: "c",
            text: "Posterior canal BPPV.",
            correct: false,
            feedback:
              "Incorrect; BPPV episodes last under 1 minute, not 3 to 6 hours continuously."
          },
          {
            id: "d",
            text: "Not a real disorder since there is no headache or hearing loss.",
            correct: false,
            feedback:
              "Incorrect! Vestibular Migraine is a well-defined Bárány Society / ICHD-3 neuro-vestibular disorder."
          }
        ]
      },
      {
        id: 5,
        badge: "Scenario 5 • Older Adult Lightheadedness vs True Vertigo",
        patient: "Mr. Samad, 68 years old (Recent Blood Pressure Medication Increase)",
        vignette:
          "Complains of 'vertigo' whenever standing up quickly from a chair—his vision dims ('blacking out') and he feels faint for several seconds, WITHOUT any sensation that the room is spinning. It never occurs when rolling over in bed.",
        question: "What is the safest, most accurate clinical assessment?",
        options: [
          {
            id: "a",
            text: "Orthostatic presyncope / lightheadedness (not vestibular vertigo); check lying-to-standing blood pressure, hydration, and review antihypertensive dosing with his doctor.",
            correct: true,
            feedback:
              "100% Correct! Distinguishing orthostatic presyncope from vertigo prevents inappropriate sedating anti-vertigo pills that increase fall risk in older adults."
          },
          {
            id: "b",
            text: "Perform bilateral Epley Maneuvers immediately.",
            correct: false,
            feedback:
              "Inappropriate—there is no spinning illusion and no supine positional trigger."
          },
          {
            id: "c",
            text: "Prescribe long-term cinnarizine three times daily.",
            correct: false,
            feedback:
              "Unsafe in older adults! Cinnarizine does not treat orthostatic hypotension and risks sedation, falls, and drug-induced parkinsonism."
          },
          {
            id: "d",
            text: "Restrict fluid intake to dry out the inner ear.",
            correct: false,
            feedback:
              "Harmful—dehydration worsens orthostatic blood pressure drops!"
          }
        ]
      }
    ]
  }
};

window.VERTIGO_DATA = window.VERTIGO_DATA_BY_LANG[window.currentLang];

window.setVertigoLangData = function (lang) {
  window.currentLang = lang === "en" ? "en" : "ms";
  window.VERTIGO_DATA = window.VERTIGO_DATA_BY_LANG[window.currentLang];
};
