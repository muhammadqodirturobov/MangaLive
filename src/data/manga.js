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
export function getFeaturedMangas(limit = 4) {
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
      m.author.toLowerCase().includes(q) ||
      m.genres.some((g) => g.toLowerCase().includes(q))
  );
}
