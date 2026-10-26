/**
 * MangaLive.uz — Production Manga Fallback Data
 *
 * Contains strictly verified, authorized manga records that match Supabase and Cloudflare R2.
 * All fake/demo placeholder titles have been completely removed.
 */

export const MANGA_LIST = [
  {
    id: 'mening-shogirdlarim-hammalari-katta-yovuzlar',
    uuid: '22222222-0001-0000-0000-000000000006',
    slug: 'mening-shogirdlarim-hammalari-katta-yovuzlar',
    coverImage: '/api/r2/manga/mening-shogirdlarim-hammalari-katta-yovuzlar/cover.jpg',
    title: 'Mening shogirdlarim — hammalari katta yovuzlar',
    titleEn: 'All My Disciples Are Big Villains',
    author: 'Mangabox',
    type: 'manhua',
    status: 'davom etmoqda',
    rating: 7.2,
    ratingCount: 3630,
    chapters: 5,
    views: 0,
    genres: ['jangovar', 'fantaziya', 'sarguzasht', 'isekai', 'sirli'],
    coverColor: ['#1a0533', '#5b21b6'],
    coverAccent: '#a78bfa',
    synopsis:
      "Lu Zhou uyg'onib, eng qudratli va eng qadimiy demonga aylangan. Uning dunyoni qo'rqitib turgan to'qqiz yovuz shogirdi bor: Bo'shliq sektasi sardori minglab demonlarni boshqaradi, ikkinchi shogird esa qilich demoni bo'lib, yoqtirmasa odamni o'ldiradi. Bunday yovuzlarni kultivatsiyasiz qanday boshqarish mumkin?",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: "5 ta bob tayyor!",
  },
  {
    id: '10-000-yil-keyingi-dunyoda-darajani-oshirish',
    uuid: 'e79e5112-f7ef-462d-a4d8-b3a398329c92',
    slug: '10-000-yil-keyingi-dunyoda-darajani-oshirish',
    coverImage: '/api/r2/manga/10-000-yil-keyingi-dunyoda-darajani-oshirish/cover.jpg',
    title: '10 000 yil keyingi dunyoda darajani oshirish',
    titleEn: 'Logging 10,000 Years into the Future',
    author: 'Changpan Warrior',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating: 7.1,
    ratingCount: 15403,
    chapters: 170,
    views: 0,
    genres: ['harakatli', 'fantaziya', 'jangovar', 'ilmiy-fantastika'],
    coverColor: ['#0f172a', '#1e293b'],
    coverAccent: '#38bdf8',
    synopsis:
      "Jang dao davrining boshida noma'lum yirtqichlar dunyoga bostirib keldi va insoniyat mudofaaga chekindi. Lu Sheng 10,000 yil keyingi kelajak xotiralariga ega bo'lib, o'tmish xatolarini tuzatishga kirishadi.",
    lastChapter: 170,
    lastUpdated: '2026-10-25',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '170 ta bob tayyor!',
  },
  {
    id: '4000-yildan-song-qaytib-kelgan-arximag',
    uuid: '5d993a38-d886-4d40-b318-279e1c30aaef',
    slug: '4000-yildan-song-qaytib-kelgan-arximag',
    coverImage: '/api/r2/manga/4000-yildan-song-qaytib-kelgan-arximag/cover.jpg',
    title: "4000 yildan so'ng qaytib kelgan arximag",
    titleEn: 'The Archmage Returns After 4000 Years',
    author: 'Barnicle, Nakhasan, Redice Studio',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating: 7.5,
    ratingCount: 38881,
    chapters: 5,
    views: 0,
    genres: ['harakatli', 'fantaziya', 'sehr', 'sarguzasht'],
    coverColor: ['#1e1b4b', '#312e81'],
    coverAccent: '#818cf8',
    synopsis:
      "West Road akademiyasining eng iqtidorsiz talabasi Frey Bleyk tanasida buyuk arximag Lukas Trowman 4000 yildan so'ng qayta uyg'onadi va qasos olishga kirishadi.",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '5 ta bob tayyor!',
  },
  {
    id: '1hp-klubi-qayta-boshlanish',
    uuid: 'faad8f08-6934-48f5-ab63-d5207412d4a6',
    slug: '1hp-klubi-qayta-boshlanish',
    coverImage: '/api/r2/manga/1hp-klubi-qayta-boshlanish/cover.jpg',
    title: '1HP klubi (qayta boshlanish)',
    titleEn: '1HP Club',
    author: 'elfboi',
    type: 'manga',
    status: 'pauza',
    rating: 0,
    ratingCount: 0,
    chapters: 5,
    views: 0,
    genres: ['komediya', 'fantaziya', 'sarguzasht'],
    coverColor: ['#14532d', '#166534'],
    coverAccent: '#4ade80',
    synopsis:
      "Do'stlar guruhi stol roli o'yini Dungeon & Dragons o'ynab, maroqli vaqt o'tkazishadi. 1HP bilan tirik qolgan qahramonlarning kulgili va hayajonli sarguzashtlari.",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: false,
    featuredTagline: '5 ta bob tayyor!',
  },
  {
    id: '66-666-yildan-song-qora-sehrgarning-qaytishi',
    uuid: '5ce34e83-217f-4318-96ed-7b927291edfa',
    slug: '66-666-yildan-song-qora-sehrgarning-qaytishi',
    coverImage: '/api/r2/manga/66-666-yildan-song-qora-sehrgarning-qaytishi/cover.jpg',
    title: '66 666 yildan so‘ng: Qora sehrgarning qaytishi',
    titleEn: '66,666 Years: Advent of the Dark Mage',
    author: 'Hwabong, Taru',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating: 7.3,
    ratingCount: 26199,
    chapters: 5,
    views: 0,
    genres: ['harakatli', 'fantaziya', 'sehr', 'qasos'],
    coverColor: ['#3b0764', '#581c87'],
    coverAccent: '#c084fc',
    synopsis:
      "Qudratli qora sehrgar Diablo Volpir 12 mabudga qarshi jangda mag'lub etilib, muhrlab qo'yilgan edi. 66 666 yil o'tgach, u Jamie Welton ismli chaqaloq qiyofasida qayta tug'iladi.",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '5 ta bob tayyor!',
  },
  {
    id: 'nano-mashina',
    uuid: '22e53399-3cce-43a6-a314-822ba0278b22',
    slug: 'nano-mashina',
    coverImage: '/api/r2/manga/nano-mashina/cover.jpg',
    title: 'Nano Mashina',
    titleEn: 'Nano Machine',
    author: 'Hanjoong Wolya / Hyun Jeolmu',
    type: 'manga',
    status: 'davom etmoqda',
    rating: 8.1,
    ratingCount: 49148,
    chapters: 40,
    views: 0,
    genres: ['harakatli', 'fantaziya', 'jangovar', 'ilmiy-fantastika', 'tarixiy'],
    coverColor: ['#0f172a', '#1e293b'],
    coverAccent: '#38bdf8',
    synopsis:
      "Murim dunyosida kamsitilgan Cheon Yeo-woon kelajakdan kelgan sirli avlodidan nano-mashinalar inyeksiyasini oladi va qadimiy jang san'atlarini yangi texnologiya bilan zabt etishga kirishadi.",
    lastChapter: 40,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '40 ta bob tayyor!',
  },
  {
    id: 'solo-leveling-ragnarok',
    uuid: 'c9bc134f-de26-4de7-8fa7-a53f19c51184',
    slug: 'solo-leveling-ragnarok',
    coverImage: '/api/r2/manga/solo-leveling-ragnarok/cover.jpg',
    title: "Yolg'izlikda daraja ko'tarish: Ragnarok",
    titleEn: 'Solo Leveling: Ragnarok',
    author: 'Redice Studio / Daul',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating: 7.5,
    ratingCount: 33778,
    chapters: 5,
    views: 0,
    genres: ['harakatli', 'fantaziya', 'jangovar', 'sarguzasht'],
    coverColor: ['#0f172a', '#1e1b4b'],
    coverAccent: '#6366f1',
    synopsis:
      "Yer yuzida yangi xavf tug'iladi va Sung Jin-woo ning o'g'li Sung Su-ho o'zining yashirin kuchlarini uyg'otadi. Shadow Monarch vorisining yangi afsonaviy janglari boshlanadi.",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '5 ta bob tayyor!',
  },
  {
      "id": "lookism",
      "uuid": "f223c50f-e13d-489b-9409-3fc0b88b0c41",
      "slug": "lookism",
      "coverImage": "/api/r2/manga/lookism/cover.jpg",
      "title": "Lookism",
      "titleEn": "Lookism 외모지상주의",
      "author": "Manga Nest",
      "type": "manhwa",
      "status": "tugallangan",
      "rating": 5,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "fojiaviy",
          "komediya",
          "maktab",
          "jangovar",
          "psixologik"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "Pak Xyon Sok - maktabda ta’qibga uchraydigan, ortiqcha vaznli, ko‘rimsiz yigit. U chorasizlik, qo‘rquv va adolatsizlik haqida hamma narsani biladi. Ammo bir kuni u yangi hayot boshlashga qaror qilib, to‘satdan yangi tanaga ega bo‘ladi. Azaliy omadsiz, misli ko‘rilmagan kuch va go‘zallikka ega bo‘lgan va birinchi marta atrofdagilarning hayratiga duch kelgan odam o‘zini qanday tutadi? U to‘satdan o‘zgarish sirlarini o‘rganadimi? O‘zini chinakamiga yangidan qurarmikin?..",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "dandadan",
      "uuid": "57bb7849-0c9a-4e96-9f7f-bb4d8d8c9e0f",
      "slug": "dandadan",
      "coverImage": "/api/r2/manga/dandadan/cover.jpg",
      "title": "Dandadan",
      "titleEn": "Dandadan",
      "author": "Anidon",
      "type": "manhwa",
      "status": "tugallangan",
      "rating": 4.8,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "komediya",
          "ilmiy-fantastika",
          "romantik",
          "maktab",
          "jangovar",
          "sirli",
          "harakatli"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "Arvohlar, maxluqlar, o‘zga sayyoraliklar, o‘smirlar romantikasi, janglar!.. Bu mangada barchasi mavjud! Okkultizmga mukkasidan ketgan, biroq arvohlarga ishonmaydigan Takakura hamda o’zga sayyoraliklarga ishonmaydigan qiz Ayase g‘ayritabiiy hodisalarga duch kelganlarida o‘zaro kelishmovchiliklarini bartaraf etishga urinadilar!",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "haddan-tashqari-jihozlangan",
      "uuid": "bed4bb78-4f4a-4d3d-89f6-e104eccb70db",
      "slug": "haddan-tashqari-jihozlangan",
      "coverImage": "/api/r2/manga/haddan-tashqari-jihozlangan/cover.jpg",
      "title": "Haddan tashqari jihozlangan",
      "titleEn": "Overgeared / Temppal / 템빨",
      "author": "Manga Nest",
      "type": "manhwa",
      "status": "davom etmoqda",
      "rating": 4.8,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "komediya",
          "ilmiy-fantastika",
          "romantik",
          "sarguzasht"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "Haqiqatda, o‘yinlarda, u qayerda bo‘lmasin, omadsizlik uning ortidan ergashadi... Ammo bir lahzada hamma narsa o‘zgaradi. Shimoliy g‘orning oxiridagi o‘yinda u maxsus kvestga duch keladi va \"Pagmaning noyob kitobi\"ni topadi... U yuz millionlab foydalanuvchilar erishishga muvaffaq bo‘lmagan narsaga erishadi.",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "arra-odam",
      "uuid": "d1623e4a-dc88-4061-950f-931922a68217",
      "slug": "arra-odam",
      "coverImage": "/api/r2/manga/arra-odam/cover.jpg",
      "title": "Arra-odam",
      "titleEn": "Chainsaw Man",
      "author": "Anidon",
      "type": "manhwa",
      "status": "tugallangan",
      "rating": 4.8,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "fantaziya",
          "komediya",
          "fojiaviy"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "\"Men doimo oddiy hayot kechirishni orzu qilardim: issiq to‘shakda uxlash, ertalab murabbo surtilgan non yeyish, qizim bilan uchrashuvga borish va har kuni tabassum qilish. Ammo otamning vafoti bilan hamma narsa o‘zgardi — endi, Potita, o‘ldirish payti keldi!\" — shunday so‘zlar bilan Dendzi o‘zining arra-iti Potita bilan navbatdagi vazifaga yo‘l oladi, chunki ular jin ovchilaridir. \r\n\r\nUlar har kuni pul uchun o‘ldirishadi, Dendzi bu pulni bir yakudzaga berishi shart, aks holda marhum otasining qarzini o‘z joni evaziga to‘lashga majbur bo‘ladi. Lekin Dendzini barcha qarzlarini uzgandan so‘ng nima kutmoqda: oddiy hayotga qaytadimi yoki dunyoni jinlardan qutqarishni davom ettiradimi? Balki taqdirning qahramonimiz uchun o‘z rejalari bordir?",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "meni-olib-ket-cheksiz-gacha",
      "uuid": "fd5a45bb-8074-440e-9a7a-b3eb01fe4a31",
      "slug": "meni-olib-ket-cheksiz-gacha",
      "coverImage": "/api/r2/manga/meni-olib-ket-cheksiz-gacha/cover.jpg",
      "title": "Meni olib ket: Cheksiz GACHA",
      "titleEn": "Me Escolhe! Gacha Infinito / Pick Me Up / Pick Me Up, Infinite Gacha / PICK ME UP～低レア★英",
      "author": "Shadow Manga",
      "type": "manhwa",
      "status": "tugallangan",
      "rating": 4.8,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "fantaziya",
          "komediya",
          "isekai",
          "fojiaviy",
          "sarguzasht"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "\"Pick Me Up!\" - juda murakkab bo‘lgan mobil o‘yin. Minora zabt etish bo‘yicha 5-o‘rinni egallagan qahramon yerto‘ladan o‘tayotganda hushidan ketadi va o‘yinga ko‘chiriladi.\r\nBosh qahramon hushiga kelgach, u 1-darajali o‘yin qahramoni - Xan Islatga aylandi. Yerga qaytish uchun u boshlovchi ustalar va qahramonlarni Minoraning 100-qavatidan olib o‘tishi kerak!",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "yollanma-askarning-maktabga-qaytishi",
      "uuid": "d888eb42-348d-4ba9-9696-45ed50c65c58",
      "slug": "yollanma-askarning-maktabga-qaytishi",
      "coverImage": "/api/r2/manga/yollanma-askarning-maktabga-qaytishi/cover.jpg",
      "title": "Yollanma askarning maktabga qaytishi",
      "titleEn": "Mercenary Enrollment | Ibhag yongbyeong | 입학용병",
      "author": "Shadow Manga",
      "type": "manhwa",
      "status": "tugallangan",
      "rating": 4.8,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "romantik",
          "maktab",
          "sarguzasht"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "Yuy Ijin bir vaqtlar aviahalokatdan omon qolgan yagona odam edi. Tirik qolish uchun u yollanma askarga aylanadi. Oradan 10 yil o‘tib, u o‘z shahriga, oilasi bag‘riga qaytadi. O‘tmishini unutib, oddiy maktab o‘quvchisi kabi yashay oladimi?",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "yengilmas-iljin-loyihasi",
      "uuid": "be1fbccd-034c-4558-a5ca-41fb00a30952",
      "slug": "yengilmas-iljin-loyihasi",
      "coverImage": "/api/r2/manga/yengilmas-iljin-loyihasi/cover.jpg",
      "title": "Yengilmas. «Iljin» loyihasi",
      "titleEn": "The Bully In-Charge | Iljin damdang Iljin",
      "author": "Manga Nest",
      "type": "manhwa",
      "status": "davom etmoqda",
      "rating": 4.8,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "fojiaviy",
          "romantik",
          "maktab",
          "jangovar"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "Bosh qahramon Kvon De-Gon o‘qishni tashlab, malaka imtihoniga tayyorgarlik ko‘rish uchun do‘konda qo‘shimcha pul ishlaydi. Bir kuni do‘konda ishlayotganida, bezorilar bilan mushtlashib qoladi. De-Gon ularni osonlikcha tartibga chaqirgach, ta’lim jamg‘armasidan «Iljin Iljinni boshqaradi» nomli loyihaga rahbarlik qilish taklifini oladi. Uzoq o‘ylab ko‘rgach, De-Gon taklifni qabul qiladi va jamg‘arma bilan aloqador bo‘lgan o‘rta maktabga o‘qishga kiradi. Endi uning vazifasi ta’lim jamg‘armasining ko‘rsatmasi bo‘yicha maktabdagi bezorilarni birin-ketin mag‘lub etishdan iborat.",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "qilich-qiroli",
      "uuid": "7b0bfa6a-2af6-4596-a137-39b45d1330cc",
      "slug": "qilich-qiroli",
      "coverImage": "/api/r2/manga/qilich-qiroli/cover.jpg",
      "title": "Latna Saga: Qilich qirolining omon qolishi",
      "titleEn": "Igye geom-wang saengjongi / Latna Saga: Survival of a Sword King",
      "author": "ZeroManhw",
      "type": "manhwa",
      "status": "davom etmoqda",
      "rating": 5,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "fantaziya",
          "komediya",
          "sarguzasht"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "Ryu Xan-Bin majburiy harbiy xizmatni endigina tugatgan oddiy odam edi. Kutilmaganda u boshqa dunyoga ko'chirildi... Taqdiriga tashlab ketilgan u yirtqich hayvonlar bilan to'lib-toshgan dunyoga tushib qolish yozilgan ekan, endi u omon qolishga va kuchliroq bo'lishga harakat qilmoqda. Muammo shundaki, unga omon qolishga yordam berishi kerak bo'lgan qo'llanma xatolarga to'la. Faqat 5 darajada qolib ketgan Xan-Bin xavf-xatarlarga to’la o’zga dunyoda omon qola oladimi?",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "shimoliy-qilich-afsonasi",
      "uuid": "a72def81-e6d9-44cd-94fc-863766a85551",
      "slug": "shimoliy-qilich-afsonasi",
      "coverImage": "/api/r2/manga/shimoliy-qilich-afsonasi/cover.jpg",
      "title": "Shimoliy qilich afsonasi",
      "titleEn": "北剑江湖 Legend of the Northern Blade | Buggeomjeongi",
      "author": "Goku Manhwa",
      "type": "manhwa",
      "status": "tugallangan",
      "rating": 5,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "fantaziya",
          "fojiaviy",
          "romantik",
          "jangovar",
          "sarguzasht"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "Dunyo zulmatga botganda, jang san’ati ustalari «Shimoliy Osmon klani»ni tashkil etish uchun to‘planishdi. Bu klan tufayli insonlar yana tinchlik va osoyishtalikka erishdi. Biroq, vaqt o‘tishi bilan ustalarning bir qismi xoinlik yo‘liga kirdi va klan rahbari Jin Kvanxoni butun klan bilan birga yo‘q qildi. Kvanxoning yagona o‘g‘li Jin Muvon esa o‘z klanining vayronalarini tark etmadi. Muvon hech qachon jang san’atini o‘rganmagan edi, ammo u otasi yashirincha qoldirgan usulni topib, Shimoliy Osmon klani jang san’atini o‘zlashtira boshladi.",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
      "id": "yakkaxon-maksimal-darajadagi-yangi-boshlovchi",
      "uuid": "66f688bb-f76b-4968-8b38-7438b70c2e60",
      "slug": "yakkaxon-maksimal-darajadagi-yangi-boshlovchi",
      "coverImage": "/api/r2/manga/yakkaxon-maksimal-darajadagi-yangi-boshlovchi/cover.jpg",
      "title": "Yakkaxon Maksimal Darajadagi Yangi Boshlovchi",
      "titleEn": "나 혼자 만렙 뉴비 / I Am the Top Ranker Newbie / I'm the Only Max-Leveled Newbie / Na Honja Mallep Newbie / Người Chơi Mới Cấp Tối Đa / Novato Solo a Nivel Máximo / Solo Max-Level Newbie /ผู้เล่นหน้าใหม่เลเวลแมกซ์ / 俺だけレベルMAXなビギナー / 我独自满级新手 / 满级新手 / 나혼자만렙뉴비",
      "author": "Magic Manga",
      "type": "manhwa",
      "status": "davom etmoqda",
      "rating": 4.8,
      "ratingCount": 50,
      "chapters": 10,
      "views": 1200,
      "genres": [
          "harakatli",
          "fantaziya",
          "komediya",
          "sarguzasht"
      ],
      "coverColor": [
          "#0f172a",
          "#1e293b"
      ],
      "coverAccent": "#38bdf8",
      "synopsis": "Bosh qahramon Jin Xek o‘yin nyutuberi bo‘lib, [Sinov minorasi]ning yakunini ko‘rgan yagona kishi edi. Biroq, o‘yinning mashhurligi pasayib ketgach, o‘yin nyutuberi sifatida hayot kechirish qiyinlashdi. Yakunni ko‘rgan Jin Xek o‘yinni tugatmoqchi edi. O‘sha kuni [Sinov minorasi] haqiqatga aylandi. O‘yinning barcha unsurlarini biladigan Jin Xek boshqalardan ko‘ra tezroq hamma narsani qo‘lga kiritadi: \"Men sizlarga chinakam tajribali o‘yinchi qanday bo‘lishini ko‘rsatib qo‘yaman.\"",
      "lastChapter": 10,
      "lastUpdated": "2026-10-25",
      "isNew": true,
      "isPopular": true,
      "isFeatured": false
  },
  {
    "id": "solo-leveling",
    "uuid": "11e94378-8f56-469e-ae09-37db992cc3a5",
    "slug": "solo-leveling",
    "coverImage": "/api/r2/manga/solo-leveling/cover.jpg",
    "title": "Yakkaxon daraja oshirish",
    "titleEn": "Solo Leveling",
    "author": "Chugong, DUBU (Redice Studio)",
    "type": "manhwa",
    "status": "tugallangan",
    "rating": 8.4,
    "ratingCount": 287820,
    "chapters": 60,
    "views": 0,
    "genres": [
      "harakatli",
      "fantaziya",
      "sarguzasht",
      "super-qahramon"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Dunyoning eng zaif E-darajali ovchisi Sung Jin-Woo qotilliklar to'la sirli D-darajali ikki qavatli xavfli zindonga tushib qoladi. O'lim yoqasida u faqat o'zi ko'ra oladigan sirli \"Tizim\" topshiriqlarini qabul qiladi. Faqat uning o'zigagina darajasini cheksiz oshirish va soyalar armiyasining Monarxiga aylanish qobiliyati beriladi.",
    "lastChapter": 60,
    "lastUpdated": "2026-10-26",
    "isNew": false,
    "isPopular": true,
    "isFeatured": true,
    "featuredTagline": "60 ta bob to'liq mavjud!"
  },
  {
    "id": "bastard",
    "uuid": "32483939-4c64-490a-90ba-591ce534e57a",
    "slug": "bastard",
    "coverImage": "/api/r2/manga/bastard/cover.jpg",
    "title": "Haromi",
    "titleEn": "Bastard",
    "author": "Carnby Kim, Yeong-Chan Hwang",
    "type": "manhwa",
    "status": "tugallangan",
    "rating": 6.6,
    "ratingCount": 475,
    "chapters": 0,
    "views": 0,
    "genres": [
      "psixologik",
      "sirli",
      "fojiaviy"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Maktabda kamsitiladigan nimjon bola Jin Seonning dahshatli siri bor: uning hurmatli va boy tadbirkor otasi aslida shafqatsiz seriyali qotil, Jin esa uning noiloj sherigi. Biroq ota o'zining navbatdagi qurboni sifatida Jinning yagona do'sti bo'lgan Kyun Yoonni nishonga olganida, Jin otasiga qarshi chiqishga va qizni himoya qilishga qasam ichadi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "operation-true-love",
    "uuid": "48c86b05-ab10-478c-8b0f-e564010837b0",
    "slug": "operation-true-love",
    "coverImage": "/api/r2/manga/operation-true-love/cover.jpg",
    "title": "Haqiqiy sevgi operatsiyasi",
    "titleEn": "Operation: True Love",
    "author": "kkokkalee, Dledumb",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 7.4,
    "ratingCount": 17852,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "maktab",
      "komediya",
      "sirli"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Soo-ae Shim o'zini hech kim sevmasligini his qiladi. Bir kuni u eski telefon ichida g'alati dasturni topadi: u har bir insonning hayoti davomida oladigan muhabbat ballarini ko'rsatadi. Dahshatlisi shundaki, Soo-aening sevgi balli mutlaqo 0 ga teng! O'z taqdirini o'zgartirish va sevgiga loyiq ekanligini isbotlash uchun u maktabning eng jozibali o'quvchisi bilan \"soxta muhabbat operatsiyasi\"ni boshlaydi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "omniscient-readers-viewpoint",
    "uuid": "fa57e52d-3acf-471a-bf9f-566692cf42e8",
    "slug": "omniscient-readers-viewpoint",
    "coverImage": "/api/r2/manga/omniscient-readers-viewpoint/cover.jpg",
    "title": "Barchasini biluvchi kitobxon nigohi",
    "titleEn": "Omniscient Reader",
    "author": "sing N song, Sleepy-C (Redice Studio)",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 8.6,
    "ratingCount": 134191,
    "chapters": 0,
    "views": 0,
    "genres": [
      "fantaziya",
      "harakatli",
      "sarguzasht",
      "sirli",
      "psixologik"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Kim Dokja — \"Qulagan dunyoda omon qolishning uch yo'li\" nomli minglab bobli noma'lum romanining yagona sodiq o'quvchisi edi. Roman nihoyasiga yetgan kuni ushbu romanning apokaliptik voqelig'i birdan haqiqatga aylanadi. Butun Seul qonli ssenariylar maydoniga aylanganda, dunyoning qanday yakunlanishini faqat bitta inson — Dokja biladi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "seasons-of-blossom",
    "uuid": "5e890b61-41a9-4f79-a85e-b158a24b69d0",
    "slug": "seasons-of-blossom",
    "coverImage": "/api/r2/manga/seasons-of-blossom/cover.jpg",
    "title": "Gullagan fasllar",
    "titleEn": "Seasons of Blossom",
    "author": "Hongduck, NEMONE",
    "type": "manhwa",
    "status": "tugallangan",
    "rating": 8.5,
    "ratingCount": 20545,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "maktab",
      "fojiaviy",
      "psixologik"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Har bir faslning o'z rangi, quvonchi va dardi bor. Bahor — nozik ilk muhabbat, yoz esa yoshlikdagi unutilmas yo'qotish va yurak og'riqlari haqida hikoya qiladi. Maktabdagi yoshlarning murakkab hissiyotlari, sirlari va ulg'ayish mashaqqatlari to'rt fasl misolida nihoyatda ta'sirchan ifodalangan.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "the-remarried-empress",
    "uuid": "762cb83a-6bda-418b-83f2-945873a50a6e",
    "slug": "the-remarried-empress",
    "coverImage": "/api/r2/manga/the-remarried-empress/cover.jpg",
    "title": "Qayta turmush qurgan imperatrisa",
    "titleEn": "The Remarried Empress",
    "author": "Alphatart, Sumpul",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 7.6,
    "ratingCount": 21145,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "fantaziya",
      "tarixiy",
      "fojiaviy"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Navier Ellie Trovi Sharqiy Imperiyaning ideal imperatrisasi edi. Ammo imperator Sovieshu qochqin cho'ri Rashtaga oshiq bo'lib, Navierga xiyonat qiladi va ajrashishni talab etadi. Navier saroy oldida xotirjamlik bilan ajrashishga rozilik beradi, biroq bir shart bilan: G'arbiy Qirollikning jozibali hukmdori Heinrey bilan qayta turmush qurish ruxsati!",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "villains-are-destined-to-die",
    "uuid": "a024e2c2-de55-4927-8bbb-a12295c3030f",
    "slug": "villains-are-destined-to-die",
    "coverImage": "/api/r2/manga/villains-are-destined-to-die/cover.jpg",
    "title": "Yovuzlar o'limga mahkum",
    "titleEn": "Villains Are Destined to Die",
    "author": "Gwon Gyeoeul, SUOL",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 8.4,
    "ratingCount": 43959,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "fantaziya",
      "isekai",
      "psixologik"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Bosh qahramon mashhur otome o'yinining qiyin rejimiga tushib qoladi va eng nafratlangan yovuz qahramon Penelope Eckhart tanasida uyg'onadi. Penelope uchun har qanday xato harakat yoki noto'g'ri so'z muqarrar o'lim bilan tugaydi. Uning atrofidagi besh erkak qahramonning muhabbat foizi noldan past. Omon qolish uchun u kamida bitta erkakning mehrini 100% ga yetkazishi shart.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "first-frost",
    "uuid": "53381180-c85e-48d0-8cbd-9d01b1046b11",
    "slug": "first-frost",
    "coverImage": "/api/r2/manga/first-frost/cover.jpg",
    "title": "Birinchi qirov",
    "titleEn": "First Frost",
    "author": "Zhu Yi, Xiao Guo, zero",
    "type": "manhua",
    "status": "davom etmoqda",
    "ratingCount": 0,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "psixologik"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Wen Yifan ona shahriga ish yuzasidan qaytganida, o'tmishdagi unutilmas xotiralarga duch keladi. Tasodifiy uchrashuv uni maktab yillarida rad etgan yigiti Sang Yan bilan yuzlashtiradi. Taqdir o'yini bilan ular bir kvartirada qo'shni ijarachi bo'lib qolishadi. Yillar davomida aytilmagan so'zlar va yashirilgan hislar asta-sekin yuzaga chiqa boshlaydi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "leveling-with-the-gods",
    "uuid": "7b6bb1c2-d571-489a-b33c-f1b3090de9d8",
    "slug": "leveling-with-the-gods",
    "coverImage": "/api/r2/manga/leveling-with-the-gods/cover.jpg",
    "title": "Xudolar bilan birga daraja oshirish",
    "titleEn": "Level Up with the Gods",
    "author": "Black Ajin, Oh Hyun",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 7.8,
    "ratingCount": 29326,
    "chapters": 0,
    "views": 0,
    "genres": [
      "harakatli",
      "fantaziya",
      "sarguzasht",
      "isekai"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Minoraga kirgan Kim YuWon do'stlari bilan birga xudolarga qarshi kurashadi, ammo mag'lubiyat muqarrar bo'lib qoladi. Kronosning vaqt qurbonligi evaziga YuWon barcha xotiralarini saqlab, Minoraning tubiga — eng boshlang'ich davriga qaytadi. Endi u xudolar ham havas qiladigan darajaga yetishi kerak.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "the-greatest-estate-developer",
    "uuid": "b8c6686f-19c2-4d8c-a2c1-4494b40c8f68",
    "slug": "the-greatest-estate-developer",
    "coverImage": "/api/r2/manga/the-greatest-estate-developer/cover.jpg",
    "title": "Eng buyuk koshona meʼmori",
    "titleEn": "The Greatest Estate Developer",
    "author": "BK_Moon, Kim Hyunsoo, Lee Hyunmin",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 9,
    "ratingCount": 71134,
    "chapters": 0,
    "views": 0,
    "genres": [
      "komediya",
      "fantaziya",
      "isekai",
      "sarguzasht"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Fuqarolik muhandisligi talabasi Kim Suho fantastik roman olamidagi xonavayron bo'lgan Baron Frontera xonadonining mayxo'r o'g'li Lloyd Frontera tanasida uyg'onadi. Bo'ynidagi ulkan qarzlardan qutulish va qulay pensiya hayotini qurish uchun Lloyd o'zining zamonaviy muhandislik bilimlari, qat'iyati va beqiyos kulgili mimikalari bilan butun o'rta asr dunyosini qayta qurishga kirishadi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "eleceed",
    "uuid": "c126029c-8b64-4fdc-8bcf-89d22f18a381",
    "slug": "eleceed",
    "coverImage": "/api/r2/manga/eleceed/cover.jpg",
    "title": "Eleceed",
    "titleEn": "Eleceed",
    "author": "Son Jeho, Zhena",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 8.5,
    "ratingCount": 47399,
    "chapters": 0,
    "views": 0,
    "genres": [
      "harakatli",
      "komediya",
      "super-qahramon",
      "maktab"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Jiwoo — yashirin chaqmoq tezligiga ega mehribon va mushuksevar o'smir. Dunyoning eng qudratli uyg'ongan sehrgarlaridan biri Kayden og'ir jarohat tufayli o'z kuchlarini semiz ko'cha mushugi tanasiga joylashtirishga majbur bo'ladi. Jiwoo yarador mushukni qutqargach, ular o'rtasida kutilmagan ustoz-shogirdlik va kulgili sarguzashtlar boshlanadi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "maybe-meant-to-be",
    "uuid": "04729676-e541-4f7d-9524-331977e8c176",
    "slug": "maybe-meant-to-be",
    "coverImage": "/api/r2/manga/maybe-meant-to-be/cover.jpg",
    "title": "Balki taqdirimiz birgadir",
    "titleEn": "Maybe Meant to Be",
    "author": "Damcho, honeyskein",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 7.9,
    "ratingCount": 28229,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "komediya"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "32 yoshli ishsiz Jia Han ota-onasining tinimsiz \"qachon turmushga chiqasan\" degan tazyiqlaridan to'yadi. Tasodifan u bolalikdagi do'sti, shartnoma bo'yicha ishlovchi Jin Mincheol bilan uchrashadi. Yarim hazil, yarim jiddiy tarzda ular ota-onalarni tinchlantirish uchun soxta nikoh qurishga kelishib olishadi. Ammo qog'ozdagi nikoh asta-sekin haqiqiy romantik tuyg'ularga aylanib boradi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "a-business-proposal",
    "uuid": "28ffe1ad-67fb-40c9-8e5d-440a18e4b87e",
    "slug": "a-business-proposal",
    "coverImage": "/api/r2/manga/a-business-proposal/cover.jpg",
    "title": "Ish yuzasidan taklif",
    "titleEn": "A Business Proposal",
    "author": "HaeHwa, Narak, Perilla",
    "type": "manhwa",
    "status": "tugallangan",
    "rating": 7.9,
    "ratingCount": 12921,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "komediya"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Shin Hari badavlat dugonasi o'rniga uni rad etishlari uchun soxta uchrashuvga boradi. Uchrashuvda esa uning ro'parasida o'zi ishlaydigan kompaniyaning talabchan bosh direktori Kang Tae-moo o'tirgan bo'ladi! Tae-moo buvisining tazyiqidan qutulish uchun uchrashgan birinchi qiziga uylanishga qaror qilgan edi. Hari ishini yo'qotmaslik uchun ikkilamchi hayot kechirishga majbur bo'ladi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "reincarnation-of-the-suicidal-battle-god",
    "uuid": "75fba74d-465a-4992-9561-851810bb287e",
    "slug": "reincarnation-of-the-suicidal-battle-god",
    "coverImage": "/api/r2/manga/reincarnation-of-the-suicidal-battle-god/cover.jpg",
    "title": "Jang xudosining qayta tug'ilishi",
    "titleEn": "Doom Breaker",
    "author": "Cheong-Dam",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 7.9,
    "ratingCount": 41406,
    "chapters": 0,
    "views": 0,
    "genres": [
      "harakatli",
      "fantaziya",
      "sarguzasht",
      "fojiaviy"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Insoniyatning eng so'nggi jangchisi Zephyr, demonlar hukmdori Tartarosga qarshi qaqshatqich jangda mag'lubiyatga uchraydi. Biroq uning taslim bo'lmas jasorati va hiylasi xudolarni hayratda qoldiradi. Unga o'z xotiralarini saqlagan holda o'tmishga qaytish imkoni beriladi. Zephyr endi insoniyat taqdirini qutqarish va xudolarga ham dars berib qo'yish uchun qaytadan qasos jangiga kirishadi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "a-returners-magic-should-be-special",
    "uuid": "e22a3edf-421c-453e-bd81-b53905da6361",
    "slug": "a-returners-magic-should-be-special",
    "coverImage": "/api/r2/manga/a-returners-magic-should-be-special/cover.jpg",
    "title": "Qaytgan insonning sehri o'zgacha bo'lishi kerak",
    "titleEn": "A Returner's Magic Should Be Special",
    "author": "Yu So-nan, Wookjakga",
    "type": "manhwa",
    "status": "tugallangan",
    "rating": 7.6,
    "ratingCount": 50838,
    "chapters": 0,
    "views": 0,
    "genres": [
      "fantaziya",
      "harakatli",
      "maktab",
      "sarguzasht"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Soya Dunyosi insoniyatni deyarli qirib tashladi. Desir Arman va uning bir necha safdoshi so'nggi ajdahoni o'ldirganida, dunyo portlab ketadi. Biroq Desir o'zini 13 yil oldin, Xebrion elita sehrgarlik akademiyasiga kirish arafasida ko'radi. U o'tmishdagi sinfiy tabaqalanishni yengib, bo'lajak falokatga qarshi eng kuchli sehrgarlar jamoasini shakllantirishi shart.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "sss-class-revival-hunter",
    "uuid": "36a38a19-335b-45d2-bf6e-88f5ea85d9cc",
    "slug": "sss-class-revival-hunter",
    "coverImage": "/api/r2/manga/sss-class-revival-hunter/cover.jpg",
    "title": "SSS-darajali tirilish ovchisi",
    "titleEn": "SSS-Class Revival Hunter",
    "author": "Shin Noah, Bill K",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 8.3,
    "ratingCount": 69996,
    "chapters": 0,
    "views": 0,
    "genres": [
      "harakatli",
      "fantaziya",
      "psixologik",
      "sarguzasht"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Qobiliyatsiz F-darajali ovchi Kim Gong-Ja birinchi raqamli qahramon Olovli Imperatorga nihoyatda hasad qilardi. Tasodifan u qotilining qobiliyatini ko'chirib olish mahoratiga ega bo'ladi, lekin buning uchun u o'lishi shart. Olovli Imperator uni o'ldirganida, Gong-Ja uning 24 soat oldinga qaytish ko'nikmasini egallab oladi. O'limdan qo'rqmaydigan ovchi shu tariqa Minoraning eng yuqori pog'onalariga ko'tariladi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "doom-breaker",
    "uuid": "f3e084a4-6b3e-41b7-90d9-9069d4821f17",
    "slug": "doom-breaker",
    "coverImage": "/api/r2/manga/doom-breaker/cover.jpg",
    "title": "Doom Breaker: Qasoskor jangchi",
    "titleEn": "Doom Breaker",
    "author": "Cheong-Dam",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 7.9,
    "ratingCount": 41406,
    "chapters": 0,
    "views": 0,
    "genres": [
      "harakatli",
      "fantaziya",
      "sarguzasht",
      "fojiaviy"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Qorong'u xudolar insoniyatni ko'ngilxushlik uchun yo'q qilayotgan bir paytda, eng so'nggi insoniy qahramon Zephyr xudolarning ko'z o'ngida buyuk kurash olib boradi. Urush xudolari unga ikkinchi imkoniyat taqdim etadi — o'tmishga qaytib, o'z taqdirini qayta yozish va insoniyatni halokatdan asrab qolish imkoniyati.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": true,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "the-reason-why-raeliana-ended-up-at-the-dukes-mansion",
    "uuid": "7f5448fd-ebeb-4adc-9d06-e81e9870cbfc",
    "slug": "the-reason-why-raeliana-ended-up-at-the-dukes-mansion",
    "coverImage": "/api/r2/manga/the-reason-why-raeliana-ended-up-at-the-dukes-mansion/cover.jpg",
    "title": "Raeliana gersog qasriga borishining sababi",
    "titleEn": "The Reason Why Raeliana Ended Up at the Duke's Mansion",
    "author": "Milcha, Whale",
    "type": "manhwa",
    "status": "tugallangan",
    "rating": 8.1,
    "ratingCount": 29564,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "fantaziya",
      "isekai",
      "sirli"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Eunha sirli tarzda vafot etib, o'zi bilgan roman qahramoni Raeliana Mcmillan tanasida uyg'onadi. Romanga ko'ra, Raeliana o'z unashtirilgan yigiti tomonidan zaharlanib o'lishi kerak. Bu o'limdan qochish uchun u qudratli va xavfli Gersog Noah Volstaire Wynknight bilan 6 oylik soxta nikoh shartnomasini tuzadi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "i-shall-master-this-family",
    "uuid": "a8240e73-586f-4812-888b-97496ce34cf8",
    "slug": "i-shall-master-this-family",
    "coverImage": "/api/r2/manga/i-shall-master-this-family/cover.jpg",
    "title": "Bu safar oila boshlig'i bo'laman",
    "titleEn": "I Shall Master this Family!",
    "author": "Kim Roah, Mon",
    "type": "manhwa",
    "status": "davom etmoqda",
    "rating": 8.2,
    "ratingCount": 25708,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "fantaziya",
      "isekai",
      "tarixiy"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Firentia qudratli Lombardi xonadonining noqonuniy farzandi bo'lsa-da, butun umrini oila ravnaqiga bag'ishlagan edi. Biroq amakilarining ahmoqligi tufayli imperiyaning eng buyuk xonadoni butkul xonavayron bo'ladi. Avtohalokatdan so'ng Firentia o'zining 7 yoshli bolaligiga qaytadi. Endi u xonadonning boshqaruvini o'z qo'liga olishga va taqdirini qayta yozishga bel bog'laydi.",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  },
  {
    "id": "who-made-me-a-princess",
    "uuid": "ad8cd668-403e-4e70-a2f8-5f471b7c2580",
    "slug": "who-made-me-a-princess",
    "coverImage": "/api/r2/manga/who-made-me-a-princess/cover.jpg",
    "title": "Meni kim malika qildi",
    "titleEn": "Who Made Me a Princess",
    "author": "Plutus, Spoon",
    "type": "manhwa",
    "status": "tugallangan",
    "rating": 8.3,
    "ratingCount": 40758,
    "chapters": 0,
    "views": 0,
    "genres": [
      "romantik",
      "fantaziya",
      "isekai",
      "komediya"
    ],
    "coverColor": [
      "#0b0d19",
      "#1e1b4b"
    ],
    "coverAccent": "#a855f7",
    "synopsis": "Athanasia o'z otasi — sovuqqon imperator Claude de Alger Obelia qo'lida 18 yoshida qatl etiladigan baxtsiz malika haqidagi ertak kitobiga tushib qoladi. O'limdan qutulish uchun u bolalikdanoq qochishga pul to'playdi, biroq kutilmaganda saroy bog'ida otasi bilan to'qnash keladi. Endi uning yagona omon qolish yo'li — shafqatsiz otasining mehrini qozonish!",
    "lastChapter": 0,
    "lastUpdated": "2026-10-26",
    "isNew": true,
    "isPopular": false,
    "isFeatured": false,
    "featuredTagline": "Rasmiy litsenziya kutilmoqda"
  }
];

/**
 * Get a manga by its id slug.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getMangaById(id) {
  if (!id) return undefined;
  const clean = String(id).toLowerCase().trim();
  return MANGA_LIST.find((m) => m.id === clean || m.slug === clean || m.uuid === clean);
}

/**
 * Get the featured manga (used for hero banner).
 * @returns {object|undefined}
 */
export function getFeaturedManga() {
  return MANGA_LIST.find((m) => m.isFeatured) ?? MANGA_LIST[0];
}

/**
 * Get rotating list of recommended featured mangas for hero banner carousel.
 * @param {number} limit
 * @returns {object[]}
 */
export function getFeaturedMangas(limit = 10) {
  const featured = MANGA_LIST.filter((m) => m.isFeatured);
  const remaining = MANGA_LIST.filter((m) => !m.isFeatured && m.rating >= 4.7);
  return [...featured, ...remaining].slice(0, limit);
}

/**
 * Get popular manga, sorted by views descending.
 * @param {number} limit
 * @returns {object[]}
 */
export function getPopularManga(limit = 8) {
  return [...MANGA_LIST]
    .filter((m) => m.isPopular)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/**
 * Get latest-updated manga.
 * @param {number} limit
 * @returns {object[]}
 */
export function getLatestManga(limit = 10) {
  return [...MANGA_LIST]
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .slice(0, limit);
}

/**
 * Filter manga by genre slug.
 * @param {string} genre
 * @returns {object[]}
 */
export function getMangaByGenre(genre) {
  if (!genre || genre === 'barchasi') return MANGA_LIST;
  return MANGA_LIST.filter((m) => m.genres.includes(genre));
}

/**
 * Search manga by query (case-insensitive).
 * @param {string} query
 * @returns {object[]}
 */
export function searchManga(query) {
  if (!query || !query.trim()) return MANGA_LIST;
  const q = query.toLowerCase().trim();
  return MANGA_LIST.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      (m.titleEn && m.titleEn.toLowerCase().includes(q)) ||
      (m.slug && m.slug.toLowerCase().includes(q)) ||
      m.author.toLowerCase().includes(q) ||
      m.genres.some((g) => g.toLowerCase().includes(q))
  );
}
