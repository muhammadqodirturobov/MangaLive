# MangaLive.uz — Milestone 1 Implementation & Handoff Report

## 1. Loyiha haqida qisqacha ma'lumot
**MangaLive.uz** — O'zbek tilidagi manga, manhwa va manhua o'qish platformasining dastlabki bosqichi (Milestone 1). Sayt to'liq ishlab chiqildi, dastlabki namuna ma'lumotlari bilan to'ldirildi va ishlab chiquvchilar uchun toza arxitekturada topshirilmoqda.

---

## 2. Ishlatilgan texnologiyalar (Stack)
- **Framework:** React 18 + Vite 5 (tezkor HMR, zamonaviy bundler)
- **Routing:** React Router v6 (SPA navigatsiya: Bosh sahifa, Katalog, Manga tafsilotlari, Reader, Placeholder sahifalar)
- **Stillashtirish:** CSS Modules + CSS Custom Properties (`tokens.css`, `global.css`)
- **Ikonkalar:** Lucide React (yengil va daraxtsimon silkinuvchi SVG belgilar)
- **Ma'lumotlar qatlami:** Alohida `/src/data/` modullari (Manga, Janrlar, Boblar, Haftalik reyting)
- **Litsenziya va san'at xavfsizligi:** Hech qanday mualliflik huquqini buzuvchi rasm yo'q; barcha muqovalar va o'qish sahifalari dasturiy gradient SVG data-URI orqali xavfsiz tarzda generatsiya qilinadi.

---

## 3. Loyiha tuzilishi (Folder Structure)

```text
MangaLive.uz/
├── public/
│   ├── favicon.svg
├── src/
│   ├── assets/
│   │   └── coverHelper.js         # SVG gradient muqovalarni generatsiya qilish vositasi
│   ├── components/
│   │   ├── EmptyState/            # Natija topilmaganda ko'rsatiladigan holat
│   │   ├── FeaturedBanner/        # Katta banner (Featured story)
│   │   ├── Footer/                # Saytning pastki qismi va huquqiy ogohlantirishlar
│   │   ├── Header/                # Boshqaruv paneli, qidiruv, tema o'zgartirgich, mobil menyu
│   │   ├── LatestChapters/        # So'nggi yangilanishlar ro'yxati
│   │   ├── MangaCard/             # Qayta ishlatiluvchi manga kartochkasi
│   │   ├── MangaGrid/             # Moslashuvchan kartalar to'plami
│   │   ├── PopularGenres/         # Yon paneldagi janrlar filtri
│   │   └── WeeklyRanking/         # Haftalik top-10 reyting
│   ├── data/
│   │   ├── chapters.js            # Boblar va sahifalar generatori
│   │   ├── genres.js              # Janrlar ro'yxati va metama'lumotlari
│   │   ├── manga.js               # 12 ta badiiy namunaviy manga va qidiruv/filtr utilitalari
│   │   └── rankings.js            # Haftalik trend va reyting ma'lumotlari
│   ├── pages/
│   │   ├── CataloguePage.jsx      # To'liq katalog (qidiruv, filtrlar, saralash)
│   │   ├── HomePage.jsx           # Bosh sahifa (mockup bo'yicha to'liq yig'ilgan)
│   │   ├── MangaDetailPage.jsx    # Manga tafsilotlari sahifasi
│   │   ├── PlaceholderPage.jsx    # Kelgusi sahifalar (Reyting, Hamjamiyat va h.k.)
│   │   └── ReaderPage.jsx         # To'liq ekranli manga o'quvchi (klaviatura, navigatsiya, progress)
│   ├── styles/
│   │   ├── global.css             # Asosiy stillar, shriftlar, reset
│   │   └── tokens.css             # Dizayn tokenlari (ranglar, spacing, radiuslar)
│   ├── App.jsx                    # Marshrutlash va Tema (Dark/Light) menejeri
│   └── main.jsx                   # Ilovaning kirish nuqtasi
├── .eslintrc.cjs                  # Kod tozaligi qoidalari
├── .gitignore                     # Git va OneDrive e'tibordan chetda qoldiradigan fayllar
├── index.html                     # HTML shablon
├── package.json                   # Bog'liqliklar va skriptlar
└── vite.config.js                 # Vite konfiguratsiyasi
```

---

## 4. Amalga oshirilgan asosiy funksiyalar

1. **Bosh sahifa (Approved visual mockup bo'yicha):**
   - Qoramtir to'q-ko'k fon va binafsha (purple/violet) urg'ular.
   - Katta tanlangan manga banneri (reyting, muallif, tavsif, janrlar, tugmalar).
   - Ommabop mangalar paneli (baho, ko'rishlar soni, yangi/holat teglari).
   - O'ng yon panel: Janrlar bo'yicha tezkor filtr va Haftalik Top-10 reyting.
   - So'nggi bob yangilanishlari (vaqti, bob raqami va to'g'ridan-to'g'ri o'qishga o'tish).
   - Moslashuvchan mobil moslashuv (hamburger menyu, sensorli moslashuv).

2. **Katalog va Qidiruv (Katalog sahifasi):**
   - URL parametrlari (`?q=...&janr=...`) bilan to'liq bog'langan qidiruv.
   - Kengaytirilgan filtr paneli: Janr, Tur (Manga, Manhwa, Manhua), Holat, va Saralash (Mashhur, Yangi, Reyting, Sarlavha).
   - Natija topilmaganda toza Empty State va filtrlarni tozalash tugmasi.

3. **Manga tafsilotlari (MangaDetailPage):**
   - Orqa fondagi xiralashtirilgan muqova va ma'lumotlar.
   - To'liq tavsif, statistika, boblar ro'yxati.
   - "So'nggi bobni o'qish" va "Boshidan o'qish" harakatlari.

4. **Interaktiv Manga Reader (ReaderPage):**
   - To'liq ekranli o'qish rejimi.
   - Sensorli teginish hududlari (o'ng: keyingi, chap: oldingi, markaz: panelni chaqirish).
   - Klaviatura yordamida varaqlash (←, →, A, D, Escape).
   - Sahifalar progress paneli va nuqtali navigatsiya.
   - Bob tugaganda avtomatik keyingi bobga o'tish tavsiyasi.

5. **Mavzu (Theme toggle):**
   - Qorong'u (Dark) va Yorug' (Light) mavzular o'rtasida o'tish.
   - Tanlov `localStorage`da saqlanib qoladi.

---

## 5. Sinov va Tekshiruv (Test & Verification)

- **Node.js muhiti:** Windows tizimiga Node.js LTS (v26.8.1) o'rnatildi.
- **ESLint:** Kod tekshiruvidan o'tkazildi — **0 ta xatolik, 0 ta ogohlantirish**.
- **Production Build:** `npm run build` muvaffaqiyatli yakunlandi (`dist` to'liq shakllantirildi, 0 ta xatolik).
- **Vite Dev Server:** `http://localhost:5173/` manzilida ishga tushirildi va `HTTP 200 OK` javobi olindi.

---

## 6. Loyihani mahalliy (local) ishga tushirish yo'riqnomasi

Loyihani ishga tushirish uchun quyidagi buyruqlarni terminalda bajaring:

```bash
# 1. Loyiha papkasiga o'ting (agar u yerda bo'lmasangiz):
cd MangaLive.uz

# 2. Rivojlanish serverini ishga tushiring:
npm run dev
```

Brauzerda `http://localhost:5173/` manzilini oching.

Boshqa foydali buyruqlar:
- `npm run build` — ishlab chiqarish uchun optimallashtirilgan paket tayyorlash (`dist/` papkasiga).
- `npm run lint` — kod tozaligini tekshirish.
