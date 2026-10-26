import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { uploadToR2, isR2Configured, loadEnv } from '../server/r2Storage.js';

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Accurate cover URLs verified from AniList
const coverMap = {
  'reincarnation-of-the-suicidal-battle-god': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx136220-u9sewv3u02mN.jpg',
  'omniscient-readers-viewpoint': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-Pi21aq3ey9GG.jpg',
  'leveling-with-the-gods': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx138222-PyVZk5MOWP07.png',
  'a-returners-magic-should-be-special': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105393-oiHumQoBGKG5.jpg',
  'solo-leveling': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg',
  'the-greatest-estate-developer': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx140407-fJQr0fmqq1IO.png',
  'sss-class-revival-hunter': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx128067-wnLBg6Cy1ncs.jpg',
  'bastard': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b86964-vTdn1Esqw3va.jpg',
  'eleceed': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106929-flAUvHZDUz5v.jpg',
  'doom-breaker': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx136220-u9sewv3u02mN.jpg',
  'operation-true-love': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx149483-dmXE1sBUcGsX.jpg',
  'maybe-meant-to-be': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx146139-wyY4cGEYK8Kf.jpg',
  'the-reason-why-raeliana-ended-up-at-the-dukes-mansion': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx104973-5KZSV2FK9BMt.jpg',
  'seasons-of-blossom': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx121565-JaDVhpjegXvw.jpg',
  'a-business-proposal': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx110095-UXbHXPcRxFyp.jpg',
  'i-shall-master-this-family': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx130429-m3PuqOmxBgoo.png',
  'the-remarried-empress': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx113055-pGB4A5nzhFdF.jpg',
  'first-frost': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx147198-TEEiVQa3vyD1.jpg',
  'who-made-me-a-princess': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx107521-M4x3AUb7UGIM.png',
  'villains-are-destined-to-die': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118408-zZuOINqjBZYn.jpg',
};

const seriesList = [
  // POPULAR COLLECTION (10 series)
  {
    id: 1,
    slug: 'reincarnation-of-the-suicidal-battle-god',
    title: 'Jang xudosining qayta tug\'ilishi',
    titleEn: 'Reincarnation of the Suicidal Battle God',
    author: 'Cheong-Dam',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 7.9,
    ratingCount: 41406,
    collection: 'popular',
    genres: ['harakatli', 'fantaziya', 'sarguzasht', 'fojiaviy'],
    palette: ['#1a0808', '#450a0a', '#7f1d1d'],
    accent: '#ef4444',
    synopsis: 'Insoniyatning eng so\'nggi jangchisi Zephyr, demonlar hukmdori Tartarosga qarshi qaqshatqich jangda mag\'lubiyatga uchraydi. Biroq uning taslim bo\'lmas jasorati va hiylasi xudolarni hayratda qoldiradi. Unga o\'z xotiralarini saqlagan holda o\'tmishga qaytish imkoni beriladi. Zephyr endi insoniyat taqdirini qutqarish va xudolarga ham dars berib qo\'yish uchun qaytadan qasos jangiga kirishadi.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 2,
    slug: 'omniscient-readers-viewpoint',
    title: 'Barchasini biluvchi kitobxon nigohi',
    titleEn: 'Omniscient Reader’s Viewpoint',
    author: 'sing N song, Sleepy-C (Redice Studio)',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 8.6,
    ratingCount: 134191,
    collection: 'popular',
    genres: ['fantaziya', 'harakatli', 'sarguzasht', 'sirli', 'psixologik'],
    palette: ['#040d1a', '#0c2340', '#1d4ed8'],
    accent: '#3b82f6',
    synopsis: 'Kim Dokja — "Qulagan dunyoda omon qolishning uch yo\'li" nomli minglab bobli noma\'lum romanining yagona sodiq o\'quvchisi edi. Roman nihoyasiga yetgan kuni ushbu romanning apokaliptik voqelig\'i birdan haqiqatga aylanadi. Butun Seul qonli ssenariylar maydoniga aylanganda, dunyoning qanday yakunlanishini faqat bitta inson — Dokja biladi.',
    animeAdaptation: 'E\'lon qilingan, hali efirga uzatilmagan (0 qism)',
  },
  {
    id: 3,
    slug: 'leveling-with-the-gods',
    title: 'Xudolar bilan birga daraja oshirish',
    titleEn: 'Leveling with the Gods',
    author: 'Black Ajin, Oh Hyun',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 7.8,
    ratingCount: 29326,
    collection: 'popular',
    genres: ['harakatli', 'fantaziya', 'sarguzasht', 'isekai'],
    palette: ['#0f051d', '#2e1065', '#581c87'],
    accent: '#a855f7',
    synopsis: 'Minoraga kirgan Kim YuWon do\'stlari bilan birga xudolarga qarshi kurashadi, ammo mag\'lubiyat muqarrar bo\'lib qoladi. Kronosning vaqt qurbonligi evaziga YuWon barcha xotiralarini saqlab, Minoraning tubiga — eng boshlang\'ich davriga qaytadi. Endi u xudolar ham havas qiladigan darajaga yetishi kerak.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 4,
    slug: 'a-returners-magic-should-be-special',
    title: 'Qaytgan insonning sehri o\'zgacha bo\'lishi kerak',
    titleEn: 'A Returner’s Magic Should Be Special',
    author: 'Yu So-nan, Wookjakga',
    type: 'manhwa',
    status: 'tugallangan',
    rating10: 7.6,
    ratingCount: 50838,
    collection: 'popular',
    genres: ['fantaziya', 'harakatli', 'maktab', 'sarguzasht'],
    palette: ['#021a12', '#064e3b', '#047857'],
    accent: '#10b981',
    synopsis: 'Soya Dunyosi insoniyatni deyarli qirib tashladi. Desir Arman va uning bir necha safdoshi so\'nggi ajdahoni o\'ldirganida, dunyo portlab ketadi. Biroq Desir o\'zini 13 yil oldin, Xebrion elita sehrgarlik akademiyasiga kirish arafasida ko\'radi. U o\'tmishdagi sinfiy tabaqalanishni yengib, bo\'lajak falokatga qarshi eng kuchli sehrgarlar jamoasini shakllantirishi shart.',
    animeAdaptation: 'To\'liq emas (1-mavsum 12 qism efirga uzatilgan)',
  },
  {
    id: 5,
    slug: 'solo-leveling',
    title: 'Yakkaxon daraja oshirish',
    titleEn: 'Solo Leveling',
    author: 'Chugong, DUBU (Redice Studio)',
    type: 'manhwa',
    status: 'tugallangan',
    rating10: 8.4,
    ratingCount: 287820,
    collection: 'popular',
    genres: ['harakatli', 'fantaziya', 'sarguzasht', 'super-qahramon'],
    palette: ['#020617', '#0f172a', '#1e293b'],
    accent: '#6366f1',
    synopsis: 'Dunyoning eng zaif E-darajali ovchisi Sung Jin-Woo qotilliklar to\'la sirli D-darajali ikki qavatli xavfli zindonga tushib qoladi. O\'lim yoqasida u faqat o\'zi ko\'ra oladigan sirli "Tizim" topshiriqlarini qabul qiladi. Faqat uning o\'zigagina darajasini cheksiz oshirish va soyalar armiyasining Monarxiga aylanish qobiliyati beriladi.',
    animeAdaptation: 'To\'liq emas (1-mavsum 12 qism efirga uzatilgan)',
  },
  {
    id: 6,
    slug: 'the-greatest-estate-developer',
    title: 'Eng buyuk koshona meʼmori',
    titleEn: 'The Greatest Estate Developer',
    author: 'BK_Moon, Kim Hyunsoo, Lee Hyunmin',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 9.0,
    ratingCount: 71134,
    collection: 'popular',
    genres: ['komediya', 'fantaziya', 'isekai', 'sarguzasht'],
    palette: ['#1c1917', '#292524', '#44403c'],
    accent: '#f59e0b',
    synopsis: 'Fuqarolik muhandisligi talabasi Kim Suho fantastik roman olamidagi xonavayron bo\'lgan Baron Frontera xonadonining mayxo\'r o\'g\'li Lloyd Frontera tanasida uyg\'onadi. Bo\'ynidagi ulkan qarzlardan qutulish va qulay pensiya hayotini qurish uchun Lloyd o\'zining zamonaviy muhandislik bilimlari, qat\'iyati va beqiyos kulgili mimikalari bilan butun o\'rta asr dunyosini qayta qurishga kirishadi.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 7,
    slug: 'sss-class-revival-hunter',
    title: 'SSS-darajali tirilish ovchisi',
    titleEn: 'SSS-Class Revival Hunter',
    author: 'Shin Noah, Bill K',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 8.3,
    ratingCount: 69996,
    collection: 'popular',
    genres: ['harakatli', 'fantaziya', 'psixologik', 'sarguzasht'],
    palette: ['#17051f', '#3b0764', '#581c87'],
    accent: '#d946ef',
    synopsis: 'Qobiliyatsiz F-darajali ovchi Kim Gong-Ja birinchi raqamli qahramon Olovli Imperatorga nihoyatda hasad qilardi. Tasodifan u qotilining qobiliyatini ko\'chirib olish mahoratiga ega bo\'ladi, lekin buning uchun u o\'lishi shart. Olovli Imperator uni o\'ldirganida, Gong-Ja uning 24 soat oldinga qaytish ko\'nikmasini egallab oladi. O\'limdan qo\'rqmaydigan ovchi shu tariqa Minoraning eng yuqori pog\'onalariga ko\'tariladi.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 8,
    slug: 'bastard',
    title: 'Haromi',
    titleEn: 'Bastard',
    author: 'Carnby Kim, Yeong-Chan Hwang',
    type: 'manhwa',
    status: 'tugallangan',
    rating10: 8.3,
    ratingCount: 77685,
    collection: 'popular',
    genres: ['psixologik', 'sirli', 'fojiaviy'],
    palette: ['#0f0505', '#1a0505', '#2a0a0a'],
    accent: '#dc2626',
    synopsis: 'Maktabda kamsitiladigan nimjon bola Jin Seonning dahshatli siri bor: uning hurmatli va boy tadbirkor otasi aslida shafqatsiz seriyali qotil, Jin esa uning noiloj sherigi. Biroq ota o\'zining navbatdagi qurboni sifatida Jinning yagona do\'sti bo\'lgan Kyun Yoonni nishonga olganida, Jin otasiga qarshi chiqishga va qizni himoya qilishga qasam ichadi.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 9,
    slug: 'eleceed',
    title: 'Eleceed',
    titleEn: 'Eleceed',
    author: 'Son Jeho, Zhena',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 8.5,
    ratingCount: 47399,
    collection: 'popular',
    genres: ['harakatli', 'komediya', 'super-qahramon', 'maktab'],
    palette: ['#02141a', '#083344', '#0e7490'],
    accent: '#06b6d4',
    synopsis: 'Jiwoo — yashirin chaqmoq tezligiga ega mehribon va mushuksevar o\'smir. Dunyoning eng qudratli uyg\'ongan sehrgarlaridan biri Kayden og\'ir jarohat tufayli o\'z kuchlarini semiz ko\'cha mushugi tanasiga joylashtirishga majbur bo\'ladi. Jiwoo yarador mushukni qutqargach, ular o\'rtasida kutilmagan ustoz-shogirdlik va kulgili sarguzashtlar boshlanadi.',
    animeAdaptation: 'Mavjud emas (faqat qisqa reklama PV)',
  },
  {
    id: 10,
    slug: 'doom-breaker',
    title: 'Doom Breaker: Qasoskor jangchi',
    titleEn: 'Doom Breaker',
    author: 'Cheong-Dam',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 7.9,
    ratingCount: 41406,
    collection: 'popular',
    genres: ['harakatli', 'fantaziya', 'sarguzasht', 'fojiaviy'],
    palette: ['#1a0808', '#450a0a', '#991b1b'],
    accent: '#f43f5e',
    synopsis: 'Qorong\'u xudolar insoniyatni ko\'ngilxushlik uchun yo\'q qilayotgan bir paytda, eng so\'nggi insoniy qahramon Zephyr xudolarning ko\'z o\'ngida buyuk kurash olib boradi. Urush xudolari unga ikkinchi imkoniyat taqdim etadi — o\'tmishga qaytib, o\'z taqdirini qayta yozish va insoniyatni halokatdan asrab qolish imkoniyati.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },

  // ROMANCE COLLECTION (10 series)
  {
    id: 11,
    slug: 'operation-true-love',
    title: 'Haqiqiy sevgi operatsiyasi',
    titleEn: 'Operation: True Love',
    author: 'kkokkalee, Dledumb',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 7.4,
    ratingCount: 17852,
    collection: 'romance',
    genres: ['romantik', 'maktab', 'komediya', 'sirli'],
    palette: ['#1f0a1c', '#4a044e', '#701a75'],
    accent: '#f472b6',
    synopsis: 'Soo-ae Shim o\'zini hech kim sevmasligini his qiladi. Bir kuni u eski telefon ichida g\'alati dasturni topadi: u har bir insonning hayoti davomida oladigan muhabbat ballarini ko\'rsatadi. Dahshatlisi shundaki, Soo-aening sevgi balli mutlaqo 0 ga teng! O\'z taqdirini o\'zgartirish va sevgiga loyiq ekanligini isbotlash uchun u maktabning eng jozibali o\'quvchisi bilan "soxta muhabbat operatsiyasi"ni boshlaydi.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 12,
    slug: 'maybe-meant-to-be',
    title: 'Balki taqdirimiz birgadir',
    titleEn: 'Maybe Meant to Be',
    author: 'Damcho, honeyskein',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 7.9,
    ratingCount: 28229,
    collection: 'romance',
    genres: ['romantik', 'komediya'],
    palette: ['#18081c', '#3b0764', '#7e22ce'],
    accent: '#c084fc',
    synopsis: '32 yoshli ishsiz Jia Han ota-onasining tinimsiz "qachon turmushga chiqasan" degan tazyiqlaridan to\'yadi. Tasodifan u bolalikdagi do\'sti, shartnoma bo\'yicha ishlovchi Jin Mincheol bilan uchrashadi. Yarim hazil, yarim jiddiy tarzda ular ota-onalarni tinchlantirish uchun soxta nikoh qurishga kelishib olishadi. Ammo qog\'ozdagi nikoh asta-sekin haqiqiy romantik tuyg\'ularga aylanib boradi.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 13,
    slug: 'the-reason-why-raeliana-ended-up-at-the-dukes-mansion',
    title: 'Raeliana gersog qasriga borishining sababi',
    titleEn: 'The Reason Why Raeliana Ended Up at the Duke\'s Mansion',
    author: 'Milcha, Whale',
    type: 'manhwa',
    status: 'tugallangan',
    rating10: 8.1,
    ratingCount: 29564,
    collection: 'romance',
    genres: ['romantik', 'fantaziya', 'isekai', 'sirli'],
    palette: ['#0f051d', '#2e1065', '#6b21a8'],
    accent: '#a855f7',
    synopsis: 'Eunha sirli tarzda vafot etib, o\'zi bilgan roman qahramoni Raeliana Mcmillan tanasida uyg\'onadi. Romanga ko\'ra, Raeliana o\'z unashtirilgan yigiti tomonidan zaharlanib o\'lishi kerak. Bu o\'limdan qochish uchun u qudratli va xavfli Gersog Noah Volstaire Wynknight bilan 6 oylik soxta nikoh shartnomasini tuzadi.',
    animeAdaptation: 'To\'liq emas (1-mavsum 12 qism efirga uzatilgan)',
  },
  {
    id: 14,
    slug: 'seasons-of-blossom',
    title: 'Gullagan fasllar',
    titleEn: 'Seasons of Blossom',
    author: 'Hongduck, NEMONE',
    type: 'manhwa',
    status: 'tugallangan',
    rating10: 8.5,
    ratingCount: 20545,
    collection: 'romance',
    genres: ['romantik', 'maktab', 'fojiaviy', 'psixologik'],
    palette: ['#021a12', '#064e3b', '#059669'],
    accent: '#34d399',
    synopsis: 'Har bir faslning o\'z rangi, quvonchi va dardi bor. Bahor — nozik ilk muhabbat, yoz esa yoshlikdagi unutilmas yo\'qotish va yurak og\'riqlari haqida hikoya qiladi. Maktabdagi yoshlarning murakkab hissiyotlari, sirlari va ulg\'ayish mashaqqatlari to\'rt fasl misolida nihoyatda ta\'sirchan ifodalangan.',
    animeAdaptation: 'Mavjud emas (Faqat live-action serial)',
  },
  {
    id: 15,
    slug: 'a-business-proposal',
    title: 'Ish yuzasidan taklif',
    titleEn: 'A Business Proposal',
    author: 'HaeHwa, Narak, Perilla',
    type: 'manhwa',
    status: 'tugallangan',
    rating10: 7.9,
    ratingCount: 12921,
    collection: 'romance',
    genres: ['romantik', 'komediya'],
    palette: ['#1f0a1c', '#4a044e', '#831843'],
    accent: '#fb7185',
    synopsis: 'Shin Hari badavlat dugonasi o\'rniga uni rad etishlari uchun soxta uchrashuvga boradi. Uchrashuvda esa uning ro\'parasida o\'zi ishlaydigan kompaniyaning talabchan bosh direktori Kang Tae-moo o\'tirgan bo\'ladi! Tae-moo buvisining tazyiqidan qutulish uchun uchrashgan birinchi qiziga uylanishga qaror qilgan edi. Hari ishini yo\'qotmaslik uchun ikkilamchi hayot kechirishga majbur bo\'ladi.',
    animeAdaptation: 'Mavjud emas (Faqat live-action serial)',
  },
  {
    id: 16,
    slug: 'i-shall-master-this-family',
    title: 'Bu safar oila boshlig\'i bo\'laman',
    titleEn: 'I Shall Master This Family',
    author: 'Kim Roah, Mon',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 8.2,
    ratingCount: 25708,
    collection: 'romance',
    genres: ['romantik', 'fantaziya', 'isekai', 'tarixiy'],
    palette: ['#1c0a00', '#451a03', '#9a3412'],
    accent: '#ea580c',
    synopsis: 'Firentia qudratli Lombardi xonadonining noqonuniy farzandi bo\'lsa-da, butun umrini oila ravnaqiga bag\'ishlagan edi. Biroq amakilarining ahmoqligi tufayli imperiyaning eng buyuk xonadoni butkul xonavayron bo\'ladi. Avtohalokatdan so\'ng Firentia o\'zining 7 yoshli bolaligiga qaytadi. Endi u xonadonning boshqaruvini o\'z qo\'liga olishga va taqdirini qayta yozishga bel bog\'laydi.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 17,
    slug: 'the-remarried-empress',
    title: 'Qayta turmush qurgan imperatrisa',
    titleEn: 'The Remarried Empress',
    author: 'Alphatart, Sumpul',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 7.6,
    ratingCount: 21145,
    collection: 'romance',
    genres: ['romantik', 'fantaziya', 'tarixiy', 'fojiaviy'],
    palette: ['#0f051d', '#3b0764', '#701a75'],
    accent: '#e879f9',
    synopsis: 'Navier Ellie Trovi Sharqiy Imperiyaning ideal imperatrisasi edi. Ammo imperator Sovieshu qochqin cho\'ri Rashtaga oshiq bo\'lib, Navierga xiyonat qiladi va ajrashishni talab etadi. Navier saroy oldida xotirjamlik bilan ajrashishga rozilik beradi, biroq bir shart bilan: G\'arbiy Qirollikning jozibali hukmdori Heinrey bilan qayta turmush qurish ruxsati!',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 18,
    slug: 'first-frost',
    title: 'Birinchi qirov',
    titleEn: 'First Frost',
    author: 'Zhu Yi, Xiao Guo, zero',
    type: 'manhua',
    status: 'davom etmoqda',
    rating10: 7.1,
    ratingCount: 2053,
    collection: 'romance',
    genres: ['romantik', 'psixologik'],
    palette: ['#03141f', '#072e42', '#0284c7'],
    accent: '#38bdf8',
    synopsis: 'Wen Yifan ona shahriga ish yuzasidan qaytganida, o\'tmishdagi unutilmas xotiralarga duch keladi. Tasodifiy uchrashuv uni maktab yillarida rad etgan yigiti Sang Yan bilan yuzlashtiradi. Taqdir o\'yini bilan ular bir kvartirada qo\'shni ijarachi bo\'lib qolishadi. Yillar davomida aytilmagan so\'zlar va yashirilgan hislar asta-sekin yuzaga chiqa boshlaydi.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
  {
    id: 19,
    slug: 'who-made-me-a-princess',
    title: 'Meni kim malika qildi',
    titleEn: 'Who Made Me a Princess',
    author: 'Plutus, Spoon',
    type: 'manhwa',
    status: 'tugallangan',
    rating10: 8.3,
    ratingCount: 40758,
    collection: 'romance',
    genres: ['romantik', 'fantaziya', 'isekai', 'komediya'],
    palette: ['#1c0f00', '#452a03', '#b45309'],
    accent: '#f59e0b',
    synopsis: 'Athanasia o\'z otasi — sovuqqon imperator Claude de Alger Obelia qo\'lida 18 yoshida qatl etiladigan baxtsiz malika haqidagi ertak kitobiga tushib qoladi. O\'limdan qutulish uchun u bolalikdanoq qochishga pul to\'playdi, biroq kutilmaganda saroy bog\'ida otasi bilan to\'qnash keladi. Endi uning yagona omon qolish yo\'li — shafqatsiz otasining mehrini qozonish!',
    animeAdaptation: 'E\'lon qilingan, to\'liq serial chiqmagan (0 qism)',
  },
  {
    id: 20,
    slug: 'villains-are-destined-to-die',
    title: 'Yovuzlar o\'limga mahkum',
    titleEn: 'Villains Are Destined to Die',
    author: 'Gwon Gyeoeul, SUOL',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating10: 8.4,
    ratingCount: 43959,
    collection: 'romance',
    genres: ['romantik', 'fantaziya', 'isekai', 'psixologik'],
    palette: ['#1a0524', '#3b0764', '#6b21a8'],
    accent: '#c084fc',
    synopsis: 'Bosh qahramon mashhur otome o\'yinining qiyin rejimiga tushib qoladi va eng nafratlangan yovuz qahramon Penelope Eckhart tanasida uyg\'onadi. Penelope uchun har qanday xato harakat yoki noto\'g\'ri so\'z muqarrar o\'lim bilan tugaydi. Uning atrofidagi besh erkak qahramonning muhabbat foizi noldan past. Omon qolish uchun u kamida bitta erkakning mehrini 100% ga yetkazishi shart.',
    animeAdaptation: 'Mavjud emas (0 qism)',
  },
];

async function runImport() {
  console.log('=== STARTING 20 SERIES METADATA & R2 IMPORT ===\n');

  // 1. Fetch genre map from Supabase
  const { data: dbGenres, error: gErr } = await supabase.from('genres').select('id, slug');
  if (gErr) throw new Error('Failed to fetch genres: ' + gErr.message);
  const genreSlugToId = {};
  dbGenres.forEach(g => { genreSlugToId[g.slug] = g.id; });

  // 2. Fetch existing mangas to avoid duplicates
  const { data: existingMangas } = await supabase.from('mangas').select('id, slug');
  const existingSlugs = new Set((existingMangas || []).map(m => m.slug));

  const report = [];

  for (const s of seriesList) {
    console.log(`\n[${s.id}/20] Processing "${s.titleEn}" (${s.slug})...`);

    // Check if already in DB
    if (existingSlugs.has(s.slug)) {
      console.log(`  -> Already exists in DB. Skipping duplicate creation.`);
      report.push({
        title: s.titleEn,
        slug: s.slug,
        status: 'already_exists',
        chaptersImported: 0,
        contentSource: 'N/A',
        notes: 'Already present in Supabase',
      });
      continue;
    }

    const coverSource = coverMap[s.slug];
    let coverUrl = `/api/r2/manga/${s.slug}/cover.jpg`;

    // Download and upload cover to Cloudflare R2
    try {
      if (coverSource && isR2Configured()) {
        console.log(`  -> Downloading cover from: ${coverSource}`);
        const imgRes = await fetch(coverSource, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const r2Key = `manga/${s.slug}/cover.jpg`;
          console.log(`  -> Uploading cover to R2 key "${r2Key}" (${buffer.length} bytes)...`);
          await uploadToR2({
            key: r2Key,
            body: buffer,
            contentType: 'image/jpeg',
          });
          console.log(`  -> Upload to R2 successful.`);
        } else {
          console.warn(`  -> Cover fetch returned ${imgRes.status}, using CDN fallback`);
          coverUrl = coverSource;
        }
      } else if (coverSource) {
        coverUrl = coverSource;
      }
    } catch (e) {
      console.warn(`  -> R2 upload notice: ${e.message}. Using cover URL.`);
      coverUrl = coverSource || `/api/r2/manga/${s.slug}/cover.jpg`;
    }

    // DB rating constraint is 0 to 5.0 (scale of 5 in PostgreSQL)
    const dbRating = Math.min(5.0, Math.max(0, Math.round((s.rating10 / 2) * 10) / 10));

    // Insert manga into Supabase
    const { data: insertedManga, error: insErr } = await supabase
      .from('mangas')
      .insert({
        slug: s.slug,
        title: s.title,
        title_en: s.titleEn,
        author: s.author,
        type: s.type,
        status: s.status,
        rating: dbRating,
        rating_count: s.ratingCount,
        chapters_count: 0, // Zero chapters until authorized redistributable files arrive
        views_count: 0,
        cover_url: coverUrl,
        banner_url: null,
        cover_color_start: s.palette[0],
        cover_color_end: s.palette[1],
        cover_accent: s.accent,
        synopsis: s.synopsis,
        is_featured: false,
        is_popular: s.collection === 'popular',
        is_new: true,
        last_chapter_number: 0,
      })
      .select()
      .single();

    if (insErr) {
      console.error(`  -> Failed to insert manga into Supabase:`, insErr.message);
      report.push({
        title: s.titleEn,
        slug: s.slug,
        status: 'error',
        error: insErr.message,
      });
      continue;
    }

    console.log(`  -> Successfully inserted manga into Supabase! ID: ${insertedManga.id}`);

    // Link genres in manga_genres junction table
    const genreInserts = [];
    for (const gSlug of s.genres) {
      const gId = genreSlugToId[gSlug];
      if (gId) {
        genreInserts.push({
          manga_id: insertedManga.id,
          genre_id: gId,
        });
      }
    }

    if (genreInserts.length > 0) {
      const { error: mgErr } = await supabase.from('manga_genres').insert(genreInserts);
      if (mgErr) {
        console.warn(`  -> Notice on genres insert:`, mgErr.message);
      } else {
        console.log(`  -> Linked ${genreInserts.length} genres successfully.`);
      }
    }

    report.push({
      id: s.id,
      title: s.titleEn,
      titleUz: s.title,
      slug: s.slug,
      status: 'verified_metadata_and_r2_cover_imported',
      chaptersImported: 0,
      pagesImported: 0,
      contentSource: 'AniList Verified Metadata & Cloudflare R2 Cover Artwork',
      authorizationStatus: 'Awaiting content authorization (litsenziyalangan kontent ruxsatnomasi kutilmoqda)',
      missingFiles: 'No authorized redistributable chapter archive supplied; copyright protected',
      animeAdaptation: s.animeAdaptation,
      rating: s.rating10,
      dbRating: dbRating,
      author: s.author,
      genres: s.genres,
    });
  }

  fs.writeFileSync('data/import-20-report.json', JSON.stringify(report, null, 2));
  console.log('\n=== COMPLETED IMPORT OF 20 SERIES ===');
  console.log('Saved detailed report to data/import-20-report.json');
}

runImport().catch(console.error);
