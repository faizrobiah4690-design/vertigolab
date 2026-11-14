// ============================================================================
// VertigoLab — Pangkalan Data Klinikal & Edukatif (Berasaskan Playbook Vertigo)
// ============================================================================

window.VERTIGO_DATA = {
  anatomyParts: [
    {
      id: "utricle-saccule",
      title: "Utricle & Saccule",
      subtitle: "Pengesan Graviti & Pecutan Lurus",
      badge: "Organ Otolith",
      color: "#0ea5e9",
      clinical:
        "Dua kantung makula bermembran di dalam vestibule yang mengesan daya graviti dan gerakan linear (mendatar bagi utricle seperti kereta memecut; menegak bagi saccule seperti menaiki lif).",
      layman:
        "Bayangkan dua 'level air' pintar di dalam telinga yang memberitahu otak sama ada anda sedang tegak, menunduk, naik lif, atau memecut di dalam kereta.",
      highlightZone: "utricle"
    },
    {
      id: "otoliths",
      title: "Otoliths & Otolithic Membrane",
      subtitle: "Hablur Kalsium Karbonat Mikroskopik",
      badge: "Kristal Keseimbangan",
      color: "#f59e0b",
      clinical:
        "Hablur kalsium karbonat mikroskopik (otoconia) yang tersusun di atas lapisan gel membran otolitik. Apabila kepala menunduk atau memecut, inersia dan berat hablur melenturkan bulu deria (stereocilia) pada hair cells untuk menghantar impuls ke vestibular nerve.",
      layman:
        "Batu-batu kristal halus semula jadi yang menindih bulu deria di atas lapisan gel. Bila kepala condong, berat kristal ini membengkokkan bulu halus untuk menghantar isyarat kedudukan kepala ke otak.",
      highlightZone: "otoliths"
    },
    {
      id: "semicircular-ducts",
      title: "Semicircular Ducts & Ampulla",
      subtitle: "Pengesan Putaran 3 Paksi (3D)",
      badge: "Saluran Separuh Bulat",
      color: "#8b5cf6",
      clinical:
        "Tiga saluran separuh bulat (anterior, posterior, lateral/horizontal) berisi cecair endolymph yang tersusun bersudut tepat antara satu sama lain. Pergerakan putaran kepala menggerakkan cecair lalu memesongkan cupula di pangkal pengesan bernama ampulla.",
      layman:
        "Tiga tiub gelung berisi air yang mengesan pusingan kepala ke atas-bawah, kiri-kanan, dan teleng bahu pada masa nyata.",
      highlightZone: "canals"
    },
    {
      id: "bppv-trigger",
      title: "Pencetus BPPV (Canalithiasis)",
      subtitle: "Hablur Tanggal & Tersesat Ke Saluran",
      badge: "Punca #1 Vertigo",
      color: "#ef4444",
      clinical:
        "Apabila hablur otoliths tanggal daripada utricle lalu tersesat masuk ke dalam semicircular ducts (paling kerap kanal posterior kerana graviti), setiap gerakan baring atau pusing kepala mengocak cecair saluran tersebut seperti batu di dalam tiub air, memicu defleksi palsu pada ampulla dan mencetuskan vertigo berputar ekstrem.",
      layman:
        "Kristal kecil tercabut dari 'tempat asal' lalu jatuh ke dalam tiub pusingan. Bila anda baring atau pusing kepala di katil, kristal itu bergolek mengocak air tiub—menipu otak kononnya kepala berpusing kencang! Pil tidak boleh 'mencairkan' batu kristal ini.",
      highlightZone: "bppv"
    }
  ],

  sensorPresets: {
    normal: {
      label: "Keadaan Pegun Normal",
      vestibular: "Pegun (0°/s)",
      visual: "Bilik Pegun",
      proprioception: "Tapak Kaki Stabil",
      conflictLevel: 0,
      nystagmus: "none",
      nausea: "Tiada",
      summary:
        "Ketiga-tiga sensor menghantar laporan yang selari ke batang otak dan serebelum. Tiada konflik deria, mata stabil, dan tiada refleks loya."
    },
    trueRotation: {
      label: "Berpusing Sebenar (Kerusi Pusing)",
      vestibular: "Berputar Laju (120°/s)",
      visual: "Pemandangan Bergerak",
      proprioception: "Tekanan Putaran Badan",
      conflictLevel: 15,
      nystagmus: "physiologic",
      nausea: "Minimum",
      summary:
        "Semua sensor bersetuju bahawa tubuh memang sedang berpusing. Refleks Vestibulo-Okular (VOR) menstabilkan fokus mata secara fisiologi."
    },
    acuteVertigo: {
      label: "Serangan Vertigo Akut (BPPV / Neuritis)",
      vestibular: "KECEMASAN: Berputar 100 km/j!",
      visual: "Bilik Sedang Diam",
      proprioception: "Katil / Lantai Pegun",
      conflictLevel: 95,
      nystagmus: "horizontal-jerk",
      nausea: "Tinggi (Pusat Muntah Aktif)",
      summary:
        "Konflik Deria Ekstrem! Telinga dalam menjerit kepala sedang berpusing kencang, sedangkan mata dan tapak kaki melaporkan tubuh pegun. Otak memaksa bebola mata bergerak luar kawal (nystagmus) dan mengaktifkan pusat muntah batang otak."
    },
    centralStroke: {
      label: "Vertigo Sentral (Strok Posterior)",
      vestibular: "Isyarat Batang Otak Terganggu",
      visual: "Diplopia / Fokus Lari",
      proprioception: "Ataksia (Gagal Berdiri)",
      conflictLevel: 100,
      nystagmus: "vertical-bidirectional",
      nausea: "Sederhana–Tinggi + Tanda 5D",
      summary:
        "Gangguan bukan pada telinga dalam semata-mata, tetapi pada pusat pemprosesan di batang otak atau serebelum. Nystagmus boleh bertukar arah atau menegak tulen disertai masalah koordinasi dan percakapan."
    },
    presyncope: {
      label: "Bukan Vertigo: Gelap Mata (Tekanan Darah Rendah)",
      vestibular: "Normal (Tiada Pusingan)",
      visual: "Pandangan Gelap / Kabur Seketika",
      proprioception: "Lutut Lemah Semasa Bangun",
      conflictLevel: 10,
      nystagmus: "none",
      nausea: "Kadang-kadang Ringan",
      summary:
        "KESILAPAN LAZIM: Ini ialah presyncope / lightheadedness akibat aliran darah ke otak berkurang sementara (cth: bangun berdiri mengejut), BUKAN vertigo vestibular. Dunia tidak berpusing!"
    }
  },

  causesMatrix: [
    {
      id: "bppv",
      name: "BPPV",
      fullName: "Benign Paroxysmal Positional Vertigo",
      type: "Periferi (Mekanikal)",
      prevalence: "~40%–50% kes vertigo periferi",
      duration: "Kurang 1 minit (lazimnya 15–45 saat)",
      durationTag: "seconds",
      trigger: "Ubah posisi kepala (baring, pusing di katil, mendongak)",
      triggerTag: "positional",
      earSymptoms: "Tiada (pendengaran normal, tiada tinnitus)",
      treatment: "Manuver reposisi fizikal (Epley Maneuver) — kadar jaya 80%–90%",
      dangerLevel: "low",
      pearl:
        "Pil tahan pening langsung tidak dapat 'mencairkan' hablur otoliths. Diagnosis disahkan dengan ujian Dix-Hallpike (pusing muncul selepas sela masa 2–10 saat)."
    },
    {
      id: "neuritis",
      name: "Vestibular Neuritis",
      fullName: "Keradangan Saraf Vestibular (& Labyrinthitis)",
      type: "Periferi (Keradangan Pasca-Virus)",
      prevalence: "Punca ke-2 tersering vertigo periferi akut",
      duration: "Berhari-hari (berterusan pada fasa awal)",
      durationTag: "days",
      trigger: "Spontan (lazimnya selepas jangkitan virus saluran pernafasan)",
      triggerTag: "spontaneous-viral",
      earSymptoms: "Tiada (TETAPI ada kurang pendengaran jika merebak ke cochlear nerve = Labyrinthitis)",
      treatment: "Ubat akut singkat (<72 jam sahaja) + Latihan Rehabilitasi Vestibular (VRT)",
      dangerLevel: "moderate",
      pearl:
        "Wajib dibezakan daripada Strok Posterior menggunakan pemeriksaan HINTS kerana kedua-duanya hadir sebagai serangan berterusan (Acute Vestibular Syndrome)."
    },
    {
      id: "meniere",
      name: "Penyakit Meniere",
      fullName: "Endolymphatic Hydrops (Lebihan Cecair Telinga Dalam)",
      type: "Periferi (Hidrops Cecair)",
      prevalence: "Episodik kronik sebelah telinga",
      duration: "20 minit hingga 12 jam",
      durationTag: "hours",
      trigger: "Spontan (lebihan tekanan cecair endolymph; dipengaruhi garam tinggi)",
      triggerTag: "spontaneous-fluid",
      earSymptoms: "Tinnitus (berdesing), kurang pendengaran berfluktuasi, rasa telinga penuh (aural fullness)",
      treatment: "Diet rendah garam (<1,500–2,000 mg natrium/hari), kurangkan kafein, rujukan pakar ENT",
      dangerLevel: "moderate",
      pearl:
        "Triad klasik simptom sebelah telinga (tinnitus + telinga penuh + kurang pendengaran frekuensi rendah) semasa serangan membezakannya daripada punca lain."
    },
    {
      id: "migraine",
      name: "Vestibular Migraine",
      fullName: "Migrain Vestibular",
      type: "Neuro-Vestibular",
      prevalence: "Sangat kerap terlepas pandang / salah diagnosis",
      duration: "5 minit hingga 72 jam",
      durationTag: "variable",
      trigger: "Kurang tidur, stres emosi, silau cahaya, dehidrasi, makanan pencetus",
      triggerTag: "lifestyle",
      earSymptoms: "Jarang (kadang-kadang sensitif bunyi / fonofobia)",
      treatment: "Kawal pencetus (tidur & hidrasi stabil) & rawatan profilaksis migrain",
      dangerLevel: "low",
      pearl:
        "Sering mengelirukan kerana serangan berpusing bersama rasa silau cahaya (fotofobia) BOLEH berlaku tanpa sakit kepala berdenyut serentak!"
    },
    {
      id: "stroke",
      name: "Strok Posterior",
      fullName: "Iskemia / Pendarahan Batang Otak & Serebelum",
      type: "Sentral (Vaskular Kecemasan)",
      prevalence: "~15% kes vertigo akut berterusan",
      duration: "Berterusan (akut mendadak)",
      durationTag: "continuous",
      trigger: "Spontan / faktor risiko vaskular (darah tinggi, diabetes, AF, merokok)",
      triggerTag: "vascular",
      earSymptoms: "Jarang (KECUALI infarksi arteri AICA yang membekalkan telinga dalam sekali gus!)",
      treatment: "KECEMASAN HOSPITAL SEGERA (Penilaian protokol strok akut)",
      dangerLevel: "critical",
      pearl:
        "Pemeriksaan fizikal HINTS oleh doktor terlatih terbukti LEBIH sensitif mengesan strok awal berbanding imbasan MRI dalam tempoh 24 jam pertama!"
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
        otolithPos: { x: 0.24, y: 0.68 },
        canalProgress: 0.1,
        instruction:
          "Duduk tegak di atas katil dengan sebiji bantal diletakkan di belakang supaya berada betul-betul di bawah bahu apabila berbaring nanti. Pusingkan kepala 45 darjah ke arah KIRI (telinga yang terjejas).",
        mechanism:
          "Menjajarkan kanal posterior kiri selari dengan satah rebah badan untuk ujian Dix-Hallpike dan permulaan Epley."
      },
      {
        step: 2,
        title: "Baring Pantas & Kepala Mendongak (20°–30°)",
        timerSec: 45,
        headAngle: -45,
        bodyState: "supine-extended",
        otolithPos: { x: 0.52, y: 0.82 },
        canalProgress: 0.35,
        instruction:
          "Rebahkan badan dengan pantas ke belakang sehingga bahu terletak di atas bantal dan leher mendongak kira-kira 20 hingga 30 darjah sambil kepala kekal 45 darjah ke KIRI. Kekalkan selama 30 hingga 60 saat sehingga rasa pusing berhenti.",
        mechanism:
          "Selepas sela masa 2–10 saat, graviti menarik hablur otoliths bergerak menjauhi ampulla ke bahagian terendah lengkungan kanal posterior."
      },
      {
        step: 3,
        title: "Pusing Kepala 90° ke Sisi Bertentangan (Kanan)",
        timerSec: 45,
        headAngle: 45,
        bodyState: "supine-extended",
        otolithPos: { x: 0.78, y: 0.56 },
        canalProgress: 0.62,
        instruction:
          "Tanpa mengangkat kepala dari tilam, pusingkan kepala 90 darjah ke arah KANAN (kini menghadap 45 darjah ke kanan) dan tunggu lagi selama 30 hingga 60 saat.",
        mechanism:
          "Putaran ini menggerakkan hablur otoliths melepasi puncak lengkungan kanal menuju ke hujung keluaran (common crus)."
      },
      {
        step: 4,
        title: "Iringkan Badan & Hidung Tunduk 45° ke Lantai",
        timerSec: 45,
        headAngle: 135,
        bodyState: "side-lying",
        otolithPos: { x: 0.66, y: 0.28 },
        canalProgress: 0.86,
        instruction:
          "Golekkan seluruh bahu dan badan mengiring ke sisi KANAN sambil kepala berpusing lagi supaya hidung menghala serong 45 darjah ke lantai. Kekalkan selama 30 hingga 60 saat.",
        mechanism:
          "Graviti menarik hablur keluar sepenuhnya dari saluran separuh bulat menuju ke pintu masuk utricle."
      },
      {
        step: 5,
        title: "Bangun Perlahan & Duduk Tenang",
        timerSec: 60,
        headAngle: 0,
        bodyState: "sitting-recovery",
        otolithPos: { x: 0.35, y: 0.25 },
        canalProgress: 1.0,
        instruction:
          "Angkat badan perlahan-lahan untuk duduk semula di tepi katil sambil dagu ditundukkan sedikit. Duduk tenang selama beberapa minit sebelum cuba berdiri.",
        mechanism:
          "Hablur otoliths kembali selamat ke dalam utricle (tempat asalnya) dan tidak lagi mengocak cecair saluran separuh bulat!"
      }
    ],
    right: [
      {
        step: 1,
        title: "Posisi Permulaan (Duduk & Pusing 45° Kanan)",
        timerSec: 15,
        headAngle: 45,
        bodyState: "sitting",
        otolithPos: { x: 0.24, y: 0.68 },
        canalProgress: 0.1,
        instruction:
          "Duduk tegak di atas katil dengan sebiji bantal diletakkan di belakang supaya berada betul-betul di bawah bahu apabila berbaring nanti. Pusingkan kepala 45 darjah ke arah KANAN (telinga yang terjejas).",
        mechanism:
          "Menjajarkan kanal posterior kanan selari dengan satah rebah badan untuk ujian Dix-Hallpike dan permulaan Epley."
      },
      {
        step: 2,
        title: "Baring Pantas & Kepala Mendongak (20°–30°)",
        timerSec: 45,
        headAngle: 45,
        bodyState: "supine-extended",
        otolithPos: { x: 0.52, y: 0.82 },
        canalProgress: 0.35,
        instruction:
          "Rebahkan badan dengan pantas ke belakang sehingga bahu terletak di atas bantal dan leher mendongak kira-kira 20 hingga 30 darjah sambil kepala kekal 45 darjah ke KANAN. Kekalkan selama 30 hingga 60 saat sehingga rasa pusing berhenti.",
        mechanism:
          "Selepas sela masa 2–10 saat, graviti menarik hablur otoliths bergerak menjauhi ampulla ke bahagian terendah lengkungan kanal posterior kanan."
      },
      {
        step: 3,
        title: "Pusing Kepala 90° ke Sisi Bertentangan (Kiri)",
        timerSec: 45,
        headAngle: -45,
        bodyState: "supine-extended",
        otolithPos: { x: 0.78, y: 0.56 },
        canalProgress: 0.62,
        instruction:
          "Tanpa mengangkat kepala dari tilam, pusingkan kepala 90 darjah ke arah KIRI (kini menghadap 45 darjah ke kiri) dan tunggu lagi selama 30 hingga 60 saat.",
        mechanism:
          "Putaran ini menggerakkan hablur otoliths melepasi puncak lengkungan kanal menuju ke hujung keluaran (common crus)."
      },
      {
        step: 4,
        title: "Iringkan Badan & Hidung Tunduk 45° ke Lantai",
        timerSec: 45,
        headAngle: -135,
        bodyState: "side-lying",
        otolithPos: { x: 0.66, y: 0.28 },
        canalProgress: 0.86,
        instruction:
          "Golekkan seluruh bahu dan badan mengiring ke sisi KIRI sambil kepala berpusing lagi supaya hidung menghala serong 45 darjah ke lantai. Kekalkan selama 30 hingga 60 saat.",
        mechanism:
          "Graviti menarik hablur keluar sepenuhnya dari saluran separuh bulat menuju ke pintu masuk utricle."
      },
      {
        step: 5,
        title: "Bangun Perlahan & Duduk Tenang",
        timerSec: 60,
        headAngle: 0,
        bodyState: "sitting-recovery",
        otolithPos: { x: 0.35, y: 0.25 },
        canalProgress: 1.0,
        instruction:
          "Angkat badan perlahan-lahan untuk duduk semula di tepi katil sambil dagu ditundukkan sedikit. Duduk tenang selama beberapa minit sebelum cuba berdiri.",
        mechanism:
          "Hablur otoliths kembali selamat ke dalam utricle (tempat asalnya) dan tidak lagi mengocak cecair saluran separuh bulat!"
      }
    ]
  },

  sodiumFoods: [
    { id: "instant-noodle", name: "Mi Segera Sup (1 bungkus)", mg: 1450 },
    { id: "nasi-lemak", name: "Nasi Lemak Sambal + Ikan Bilis", mg: 850 },
    { id: "soy-sauce", name: "Kicap Masin / Sos Tiram (1 sudu besar)", mg: 920 },
    { id: "roti-canai", name: "Roti Canai + Kuah Dhal/Kari", mg: 620 },
    { id: "salted-fish", name: "Ikan Masin / Telur Masin (1 hidangan kecil)", mg: 780 },
    { id: "fast-burger", name: "Burger Ayam Goreng Segera", mg: 980 },
    { id: "home-rice", name: "Nasi Putih + Ikan Bakar Segar + Sayur", mg: 260 },
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
        "\"Tuan/Puan, di dalam telinga kita ada tiub gelung kecil berisi air yang mengesan pusingan kepala. Masalah sekarang ialah sebutir kristal halus telah tercabut lalu jatuh ke dalam tiub itu seperti sebutir batu di dalam gelung air. Setiap kali Tuan/Puan baring atau mengiring, batu itu bergolek mengocak air dan melanggar sensor deria—sebab itu dunia rasa berpusing kencang selama beberapa saat. Makan pil tahan pening berbulan-bulan tidak boleh 'mencairkan' batu kristal ini; cara paling berkesan ialah kita golekkan semula batu itu keluar ke tempat asalnya melalui gerakan Epley Maneuver.\""
    },
    {
      id: "three-gps",
      icon: "📡",
      title: "Analogi Tiga Kamera GPS Bercanggah (Mual & Pusing)",
      targetUse: "Menenangkan pesakit yang cemas apabila vertigo diiringi rasa loya dan muntah teruk",
      summary:
        "Mata beritahu otak \"kita duduk diam\", tapak kaki beritahu \"lantai stabil\", tetapi telinga yang rosak menjerit \"kita berpusing 100 km/j\"—otak menyangka tubuh diracun lalu mengaktifkan refleks muntah.",
      script:
        "\"Rasa loya dan muntah yang teruk ini berlaku kerana otak menerima tiga laporan GPS yang bercanggah serentak. Mata Tuan/Puan melapor 'kita sedang duduk diam', tapak kaki melapor 'lantai stabil', tetapi sensor telinga dalam yang meradang menjerit 'kita berpusing 100 km/jam!'. Apabila tiga sensor bercanggah begini, otak mengaktifkan penggera keselamatan di batang otak termasuk refleks muntah—sama seperti mabuk laut yang ekstrem.\""
    },
    {
      id: "crutch-trap",
      icon: "🩼",
      title: "Analogi Tongkat Selepas Terseliuh (Bahaya Bergantung Ubat)",
      targetUse: "Mendidik pesakit supaya berhenti bergantung kepada pil tahan pening selepas fasa akut 72 jam",
      summary:
        "Makan pil tahan pening berbulan-bulan ibarat memakai tongkat selama-lamanya selepas kaki sembuh—otak menjadi malas belajar mengimbang semula secara semula jadi.",
      script:
        "\"Ubat tahan pening seperti prochlorperazine atau cinnarizine ini ibarat tongkat kecemasan semasa buku lali baru terseliuh—ia sangat berguna untuk 2 hingga 3 hari pertama semasa sedang muntah teruk. Tetapi jika Tuan/Puan terus makan pil ini berbulan-bulan, ia menidurkan isyarat telinga ke otak. Ibarat memakai tongkat selama-lamanya walaupun kaki sudah sembuh, otak menjadi 'malas' dan gagal membina pelarasan keseimbangan semula jadi (central compensation). Sebab itu selepas 72 jam, kita hentikan ubat penindas dan mulakan senaman mata serta kepala (VRT).\""
    }
  ],

  clinicalQuiz: [
    {
      id: 1,
      badge: "Senario 1 • Pening di Katil",
      patient: "Puan Rahmah, 54 tahun",
      vignette:
        "Setiap pagi apabila Puan Rahmah berpusing mengiring ke kiri di atas katil atau mendongak menyidai pakaian, bilik terasa berpusing kencang selama kira-kira 25 saat kemudian hilang sepenuhnya. Tiada telinga berdesing, tiada kurang pendengaran, dan beliau boleh berjalan normal selepas episod reda. Beliau telah makan pil cinnarizine setiap hari selama 4 bulan tetapi serangan masih berulang.",
      question: "Apakah diagnosis paling tepat dan tindakan pengurusan terbaik?",
      options: [
        {
          id: "a",
          text: "Gandakan dos cinnarizine dan tambah prochlorperazine selama 2 bulan lagi untuk 'mencairkan' kristal telinga.",
          correct: false,
          feedback:
            "Kurang tepat! Ubat penindas vestibular langsung TIDAK boleh mencairkan hablur otoliths dan hanya wajar diambil kurang daripada 72 jam dalam fasa muntah akut."
        },
        {
          id: "b",
          text: "BPPV kanal posterior; sahkan dengan ujian Dix-Hallpike, lakukan Epley Maneuver, dan hentikan pergantungan pil tahan pening.",
          correct: true,
          feedback:
            "Tepat sekali! Durasi <1 minit yang dicetuskan oleh perubahan posisi kepala tanpa simptom telinga adalah klasik bagi BPPV. Epley Maneuver mempunyai kadar kejayaan 80%–90%."
        },
        {
          id: "c",
          text: "Penyakit Meniere; mulakan diet rendah garam bawah 1,500 mg sehari dengan segera.",
          correct: false,
          feedback:
            "Tidak tepat. Penyakit Meniere berlangsung 20 minit hingga 12 jam secara spontan dan disertai tinnitus, rasa telinga penuh, serta kurang pendengaran."
        },
        {
          id: "d",
          text: "Tekanan darah rendah ortostatik; nasihatkan minum lebih banyak air bergaram.",
          correct: false,
          feedback:
            "Tidak tepat. Puan Rahmah mengalami ilusi berpusing sebenar (vertigo) walaupun semasa berbaring mengiring di katil, bukan gelap mata semasa bangun berdiri."
        }
      ]
    },
    {
      id: 2,
      badge: "Senario 2 • Triaj Jabatan Kecemasan",
      patient: "Encik Chong, 63 tahun (Penghidap Darah Tinggi & Diabetes)",
      vignette:
        "Hadir dengan vertigo berterusan mendadak sejak 5 jam lalu disertai loya. Tiada sakit telinga atau kurang pendengaran. Pemeriksaan HINTS menunjukkan: semasa Head Impulse Test dilakukan dengan pantas, mata pesakit KEKAL TERPAKU SEMPURNA pada hidung pemeriksa tanpa tersentak (impulse normal), dan terdapat nystagmus yang bertukar arah apabila melirik ke kiri dan ke kanan. Beliau juga terhuyung-hayang teruk dan gagal berdiri tegak tanpa dipapah.",
      question: "Apakah tafsiran klinikal dan keputusan triaj paling kritikal?",
      options: [
        {
          id: "a",
          text: "Head Impulse yang normal membuktikan telinga dan otak normal; benarkan pulang dengan ubat tahan muntah.",
          correct: false,
          feedback:
            "BAHAYA BESAR! Dalam Acute Vestibular Syndrome (vertigo berterusan), Head Impulse yang 'normal' justru merupakan tanda amaran kuat punca SENTRAL (strok batang otak/serebelum)!"
        },
        {
          id: "b",
          text: "Lakukan Epley Maneuver serta-merta di katil kecemasan.",
          correct: false,
          feedback:
            "Salah dan berbahaya! Vertigo ini berterusan (bukan BPPV <1 minit) dan mempunyai tanda sentral yang jelas."
        },
        {
          id: "c",
          text: "Suspek tinggi Strok Posterior (Sentral)! Aktifkan protokol kecemasan strok hospital segera; jangan bergantung semata-mata pada MRI awal 24 jam pertama untuk menolak strok jika HINTS menunjukkan sentral.",
          correct: true,
          feedback:
            "Cemerlang! Gabungan Head Impulse normal + nystagmus bertukar arah + gagal berdiri tanpa dipapah dalam vertigo akut berterusan adalah amaran merah Strok Posterior. HINTS lebih sensitif daripada MRI awal dalam 24 jam pertama!"
        },
        {
          id: "d",
          text: "Vestibular Migraine biasa; berikan ubat tahan sakit dan nasihatkan tidur cukup.",
          correct: false,
          feedback:
            "Tidak tepat. Faktor risiko vaskular + tanda HINTS sentral + ataksia teruk wajib dirawat sebagai kecemasan Strok Posterior."
        }
      ]
    },
    {
      id: 3,
      badge: "Senario 3 • Pasca-Jangkitan Virus & Pemulihan",
      patient: "Amir, 34 tahun",
      vignette:
        "Seminggu selepas demam selesema virus, Amir mengalami vertigo spontan berterusan selama beberapa hari dengan muntah teruk pada 2 hari pertama. Pendengaran kedua-dua telinga adalah normal sepenuhnya. Pemeriksaan HINTS mengesahkan punca periferi (Head Impulse abnormal dengan saccade pembetulan, nystagmus satu arah, tiada skew). Kini masuk hari ke-5, muntah sudah berhenti tetapi masih ada rasa pening baki apabila menggerakkan kepala.",
      question: "Apakah diagnosis tepat dan pelan pemulihan terbaik mulai hari ke-5 ini?",
      options: [
        {
          id: "a",
          text: "Vestibular Neuritis; hentikan ubat penindas vestibular (kerana sudah melepasi fasa 72 jam) dan mulakan Latihan Rehabilitasi Vestibular (VRT / gaze stabilization).",
          correct: true,
          feedback:
            "Tepat! Keradangan saraf vestibular pasca-virus tanpa gangguan pendengaran ialah Vestibular Neuritis (jika ada kurang pendengaran ia dipanggil Labyrinthitis). Selepas 72 jam, hentikan pil penindas dan mulakan VRT supaya otak membina central compensation!"
        },
        {
          id: "b",
          text: "Labyrinthitis; teruskan prochlorperazine 3 kali sehari selama 6 minggu supaya kepala tidak goyang.",
          correct: false,
          feedback:
            "Kurang tepat atas dua sebab: (1) Pendengaran Amir normal, jadi ia Vestibular Neuritis, bukan Labyrinthitis; (2) Mengambil prochlorperazine berterusan menghalang otak membina pampasan semula jadi!"
        },
        {
          id: "c",
          text: "BPPV; ulang Epley Maneuver 5 kali sehari.",
          correct: false,
          feedback:
            "Tidak tepat. Serangan berhari-hari secara spontan pasca-virus adalah Vestibular Neuritis, bukan hablur BPPV."
        },
        {
          id: "d",
          text: "Rehat terlantar di bilik gelap tanpa menggerakkan kepala langsung selama sebulan.",
          correct: false,
          feedback:
            "Kurang tepat! Mengelakkan semua pergerakan kepala melambatkan pemulihan otak. Pergerakan mata dan kepala terancang (VRT) diperlukan untuk menentukur semula keseimbangan."
        }
      ]
    },
    {
      id: 4,
      badge: "Senario 4 • Silau Cahaya Tanpa Sakit Kepala",
      patient: "Cik Nadia, 29 tahun (Eksekutif Projek)",
      vignette:
        "Mengadu 4 episod dunia berpusing dalam tempoh 2 bulan terakhir, setiap episod berlangsung sekitar 4 hingga 8 jam. Serangan sering tercetus selepas tidur lewat menyiapkan kerja dan menatap skrin terang. Semasa berpusing, beliau berasa sangat silau melihat lampu (fotofobia), tetapi TIADA sakit kepala berdenyut serentak dan TIADA telinga berdesing atau pekak.",
      question: "Apakah punca vertigo yang paling berkemungkinan dan strategi kawalannya?",
      options: [
        {
          id: "a",
          text: "Penyakit Meniere peringkat awal; hadkan air kosong bawah 500 ml sehari.",
          correct: false,
          feedback:
            "Tidak tepat. Tiada tinnitus, kurang pendengaran, atau telinga penuh; malah dehidrasi boleh memburukkan keadaan beliau!"
        },
        {
          id: "b",
          text: "Vestibular Migraine; stabilkan jadual tidur, pastikan hidrasi mencukupi, urus stres/silau, dan bincang rawatan profilaksis jika kerap.",
          correct: true,
          feedback:
            "Tepat sekali! Vestibular Migraine berlangsung 5 minit hingga 72 jam, dicetuskan oleh kurang tidur/stres/silau, dan sering berlaku bersama fotofobia WALAUPUN tanpa sakit kepala berdenyut serentak."
        },
        {
          id: "c",
          text: "BPPV kanal mendatar; pembedahan telinga segera.",
          correct: false,
          feedback:
            "Tidak tepat. Episod berjam-jam dengan pencetus kurang tidur dan fotofobia merujuk kepada Vestibular Migraine, bukan BPPV."
        },
        {
          id: "d",
          text: "Bukan vertigo kerana tiada sakit kepala atau masalah telinga.",
          correct: false,
          feedback:
            "Kurang tepat. Ketiadaan sakit kepala semasa serangan adalah sebab utama Vestibular Migraine sering terlepas pandang!"
        }
      ]
    },
    {
      id: 5,
      badge: "Senario 5 • Membezakan Vertigo Sebenar vs Pening Lain",
      patient: "Pak Samad, 68 tahun",
      vignette:
        "Mengadu 'vertigo' kepada keluarganya. Apabila ditanya dengan teliti, beliau menjelaskan setiap kali bangun berdiri dengan cepat daripada kerusi malas, pandangannya menjadi gelap berbintang ('gelap mata') dan terasa hampir pitam selama 5 saat, TETAPI bilik atau dirinya langsung tidak terasa berpusing. Simptom tidak pernah berlaku semasa berbaring atau berpusing di atas katil.",
      question: "Apakah penilaian yang paling bijak dalam situasi ini?",
      options: [
        {
          id: "a",
          text: "Ini bukan vertigo vestibular sebenar, sebaliknya lightheadedness / presyncope (seperti hipotensi ortostatik); semak tekanan darah baring-berdiri dan ubat darah tinggi beliau.",
          correct: true,
          feedback:
            "Tepat 100%! Kesilapan paling besar dalam masyarakat adalah menyamakan semua 'pening' atau gelap mata akibat tekanan darah rendah dengan vertigo sebenar (ilusi pergerakan berpusing)."
        },
        {
          id: "b",
          text: "Terus lakukan Epley Maneuver kedua-dua belah telinga.",
          correct: false,
          feedback:
            "Tidak sesuai! Tiada ilusi berpusing dan tiada pencetus baring kepala; ini bukan BPPV."
        },
        {
          id: "c",
          text: "Berikan dimenhydrinate setiap malam untuk menguatkan saraf telinga.",
          correct: false,
          feedback:
            "Salah! Ubat penindas vestibular boleh menyebabkan mengantuk dan meningkatkan risiko jatuh pada warga emas tanpa merawat punca tekanan darah rendah."
        },
        {
          id: "d",
          text: "Diagnosis Labyrinthitis kronik.",
          correct: false,
          feedback:
            "Tidak tepat. Tiada vertigo berputar dan tiada kehilangan pendengaran pasca-virus."
        }
      ]
    }
  ]
};
