/**
 * Notable Yoruba Icons — curated dataset for the "Wall of Influence",
 * About-page timeline, and program-aligned icon clusters.
 *
 * Image sources are Wikimedia Commons (Public Domain unless noted).
 * For full attribution and to swap images locally, see
 * docs/YIF Website Content Inventory.md.
 */

export type IconCategory =
  | "Statesman"
  | "Activist"
  | "Royalty"
  | "Governance"
  | "Education"
  | "Diaspora"
  | "Arts"
  | "Music"
  | "Cinema"
  | "Faith";

export type IconImpact = "Foundational" | "Transformative" | "Contemporary";

export type ProgramRelevance =
  | "economic"
  | "education"
  | "recognition"
  | "youth";

export interface YorubaIcon {
  id: string;
  name: string;
  honorific?: string;
  title: string;
  yorubaTitle?: string;
  lifespan: string; // e.g. "1909 – 1987"
  era: string; // for the timeline header, e.g. "Independence Era"
  category: IconCategory;
  impact: IconImpact;
  region: string;
  // Quick-bio (hover layer)
  shortBio: string;
  // Full profile (modal layer)
  achievements: string[];
  legacy: string;
  yifRelevance: string;
  programs: ProgramRelevance[];
  // Cross-linking between icons (ids)
  relatedIds?: string[];
  // Imagery
  imageUrl: string; // 440px Wikimedia thumb
  imageHiRes?: string;
  imageCredit: string;
  imageAlt: string;
  wikipediaUrl?: string;
  // For timeline ordering
  yearAnchor: number;
}

export const YORUBA_ICONS: readonly YorubaIcon[] = [
  {
    id: "obafemi-awolowo",
    name: "Chief Obafemi Awolowo",
    honorific: "Chief",
    title: "Visionary Statesman & Nationalist",
    yorubaTitle: "Asiwaju Awon Yoruba",
    lifespan: "1909 – 1987",
    era: "Independence Era",
    category: "Statesman",
    impact: "Foundational",
    region: "Western Region, Nigeria",
    shortBio:
      "Architect of free education in Nigeria and first Premier of the Western Region — the political conscience of a generation.",
    achievements: [
      "First Premier of the Western Region of Nigeria",
      "Founder of Egbe Omo Oduduwa, the foundational Yoruba nationalist movement",
      "Pioneered free primary education across the Western Region",
      "Champion of fiscal federalism and Nigerian self-government",
      "Author of seminal works on African political economy",
    ],
    legacy:
      "Transformed Southwest Nigeria into West Africa's foremost educational and industrial heartland, setting a template for development that endures today.",
    yifRelevance:
      "His doctrine of cooperative economics and human-capital investment is the intellectual root of YIF's Karo-Ojire and Scholarship programs.",
    programs: ["economic", "education"],
    relatedIds: ["funmilayo-ransome-kuti", "adekunle-ajasin"],
    imageUrl: "/image/yif-icons/Obafemi_Awolowo.jpg",
    imageCredit: "Wikimedia Commons · Public Domain",
    imageAlt: "Chief Obafemi Awolowo, first Premier of the Western Region.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Obafemi_Awolowo",
    yearAnchor: 1909,
  },
  {
    id: "funmilayo-ransome-kuti",
    name: "Funmilayo Ransome-Kuti",
    title: "Feminist Pioneer & Women's Rights Activist",
    yorubaTitle: "Iyalode of the Yorubas",
    lifespan: "1900 – 1978",
    era: "Colonial Resistance",
    category: "Activist",
    impact: "Foundational",
    region: "Abeokuta, Ogun State",
    shortBio:
      "The Lioness of Lisabi — organizer of the Abeokuta Women's Union and the first Nigerian woman to drive a car.",
    achievements: [
      "Led the 1947 Abeokuta Women's Union revolt that forced the Alake's abdication",
      "First woman to drive a car in Nigeria",
      "Founder of the Nigerian Women's Union and Federation of Nigerian Women's Societies",
      "Recipient of the Lenin Peace Prize for international advocacy",
      "Mother of cultural icons Fela, Beko and Olikoye Ransome-Kuti",
    ],
    legacy:
      "Pioneered Africa's modern women's liberation movement and proved that organized civil action could topple entrenched colonial authority.",
    yifRelevance:
      "Her model of grassroots organizing inspires YIF's Women's Empowerment chapters across the diaspora.",
    programs: ["education", "recognition"],
    relatedIds: ["obafemi-awolowo"],
    imageUrl:
      "/image/yif-icons/70_year_old_Funmilayo_Ransome-Kuti_on_her_birthday.png",
    imageCredit: "Wikimedia Commons · Public Domain",
    imageAlt: "Funmilayo Ransome-Kuti on her 70th birthday.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Funmilayo_Ransome-Kuti",
    yearAnchor: 1900,
  },
  {
    id: "ooni-sijuwade",
    name: "Oba Okunade Sijuwade",
    honorific: "Olubuse II",
    title: "Spiritual Head of the Yoruba People",
    yorubaTitle: "Ooni of Ife",
    lifespan: "1930 – 2015",
    era: "Cultural Revival",
    category: "Royalty",
    impact: "Transformative",
    region: "Ile-Ife, Osun State",
    shortBio:
      "The 50th Ooni of Ife — a global ambassador who carried the Yoruba spiritual office onto the world stage.",
    achievements: [
      "Reigned as the 50th Ooni of Ife (1980 – 2015)",
      "Convener of the historic Ife Reconciliation between Yoruba royal houses",
      "Patron of cultural festivals that revived Ife as the Yoruba spiritual capital",
      "Established educational endowments across Yorubaland",
      "Hosted heads of state and global leaders at the royal court",
    ],
    legacy:
      "Restored the international visibility of the Ooni stool and anchored a generation of cultural diplomacy.",
    yifRelevance:
      "Embodies the cultural-preservation pillar that frames every YIF event and Order of Odua honour.",
    programs: ["recognition"],
    relatedIds: ["alaafin-adeyemi", "ooni-ogunwusi"],
    imageUrl: "/image/yif-icons/Oba_Okunade_Sijuwade.png",
    imageCredit: "Wikimedia Commons · Public Domain",
    imageAlt: "Oba Okunade Sijuwade Olubuse II, the 50th Ooni of Ife.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Ooni_of_Ife",
    yearAnchor: 1930,
  },
  {
    id: "alaafin-adeyemi",
    name: "Oba Lamidi Olayiwola Adeyemi III",
    title: "Custodian of Yoruba Political Heritage",
    yorubaTitle: "Alaafin of Oyo",
    lifespan: "1938 – 2022",
    era: "Modern Monarchy",
    category: "Royalty",
    impact: "Transformative",
    region: "Oyo, Oyo State",
    shortBio:
      "The 45th Alaafin — fifty-two years on the throne of Oyo and a relentless voice for Yoruba unity.",
    achievements: [
      "Reigned 1970 – 2022, the longest-serving Alaafin of Oyo in modern history",
      "Mediator of inter-state peace agreements across Yorubaland",
      "Champion of educational scholarships and youth empowerment",
      "International cultural ambassador for the Oyo Empire's heritage",
      "Custodian of the Alaafin's library and oral history archives",
    ],
    legacy:
      "Symbol of continuity — proof that traditional institutions can adapt and lead through five decades of national change.",
    yifRelevance:
      "The longevity and unity ethos of his reign inform YIF's pan-Yoruba leadership convening.",
    programs: ["recognition", "youth"],
    relatedIds: ["ooni-sijuwade", "ooni-ogunwusi"],
    imageUrl: "/image/yif-icons/alaafin-of-oyo-oba-lamidi-adeyemi.jpg",
    imageCredit: "Alaafin of Oyo royal court",
    imageAlt:
      "Oba Lamidi Olayiwola Adeyemi III, the 45th Alaafin of Oyo, in royal regalia.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Alaafin_of_Oyo",
    yearAnchor: 1938,
  },
  {
    id: "ooni-ogunwusi",
    name: "Oba Adeyeye Enitan Ogunwusi",
    honorific: "Ojaja II",
    title: "Modern Spiritual Leader & Innovator",
    yorubaTitle: "Ooni of Ife",
    lifespan: "Born 1974",
    era: "Digital Renaissance",
    category: "Royalty",
    impact: "Contemporary",
    region: "Ile-Ife, Osun State",
    shortBio:
      "The 51st Ooni — bridging ancient stool and digital era through entrepreneurship, diaspora outreach and youth investment.",
    achievements: [
      "Coronated as the 51st Ooni of Ife in 2015",
      "Convener of the Olojo Festival as a global Yoruba homecoming",
      "Patron of youth entrepreneurship and creative-economy ventures",
      "Diaspora ambassador across Europe, the Americas and the Caribbean",
      "Advocate for digital preservation of Yoruba heritage",
    ],
    legacy:
      "Re-imagined the Ooni stool as a modern, globally networked institution without surrendering its spiritual core.",
    yifRelevance:
      "Direct alignment with YIF's diaspora-engagement and youth-entrepreneurship mandate.",
    programs: ["youth", "recognition", "economic"],
    relatedIds: ["ooni-sijuwade", "alaafin-adeyemi"],
    imageUrl: "/image/yif-icons/Ooni_Ogunwusi_Enitan_Adeyeye.jpg",
    imageCredit: "Royal Court of the Ooni of Ife",
    imageAlt: "Oba Adeyeye Enitan Ogunwusi, Ojaja II — the 51st Ooni of Ife.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Ooni_of_Ife",
    yearAnchor: 1974,
  },
  {
    id: "adekunle-ajasin",
    name: "Chief Adekunle Ajasin",
    title: "Democratic Leader & Governance Reformer",
    lifespan: "1908 – 1997",
    era: "Second Republic",
    category: "Governance",
    impact: "Foundational",
    region: "Ondo State",
    shortBio:
      "Educator-turned-governor whose name remains shorthand for integrity in Nigerian public life.",
    achievements: [
      "Governor of Ondo State (1979 – 1983) under the Second Republic",
      "Lifelong educator and school administrator before politics",
      "Co-leader of the National Democratic Coalition (NADECO) for democracy",
      "Architect of education and rural-development reforms in Ondo",
      "Namesake of Adekunle Ajasin University, Akungba",
    ],
    legacy:
      "Set a benchmark for principled, scholarly leadership in Yoruba politics that still anchors regional discourse.",
    yifRelevance:
      "Models the integrity-led governance YIF promotes through its civic-leadership programming.",
    programs: ["education", "recognition"],
    relatedIds: ["obafemi-awolowo", "ambrose-ali"],
    imageUrl: "/image/yif-icons/adekunle-ajasin.jpg",
    imageCredit: "Public Domain",
    imageAlt: "Chief Adekunle Ajasin, former Governor of Ondo State.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Adekunle_Ajasin",
    yearAnchor: 1908,
  },
  {
    id: "ambrose-ali",
    name: "Prof. Ambrose Folorunsho Alli",
    title: "Educational Pioneer & Reformist Governor",
    lifespan: "1929 – 1989",
    era: "Second Republic",
    category: "Education",
    impact: "Transformative",
    region: "Bendel State (now Edo / Delta)",
    shortBio:
      "Professor of pathology turned reformist governor — built free education and the university that bears his name.",
    achievements: [
      "Governor of Bendel State (1979 – 1983)",
      "Founded Bendel State University, now Ambrose Alli University, Ekpoma",
      "Pioneered a tuition-free education programme across Bendel",
      "Distinguished academic and pathologist before public service",
      "Advocate for healthcare expansion in rural communities",
    ],
    legacy:
      "Demonstrated that mass education and institution-building are the surest route to regional transformation.",
    yifRelevance:
      "His blueprint informs the YIF Scholarship Program's commitment to access and academic excellence.",
    programs: ["education"],
    relatedIds: ["adekunle-ajasin", "obafemi-awolowo"],
    imageUrl: "/image/yif-icons/ambrose-alli.jpg",
    imageCredit: "Public Domain",
    imageAlt: "Prof. Ambrose Folorunsho Alli, former Governor of Bendel State.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Ambrose_Ali",
    yearAnchor: 1929,
  },
  {
    id: "wole-soyinka",
    name: "Prof. Wole Soyinka",
    honorific: "Prof.",
    title: "Nobel Laureate, Playwright & Conscience of a Nation",
    yorubaTitle: "Akinwande Oluwole Babatunde Soyinka",
    lifespan: "Born 1934",
    era: "Independence Era",
    category: "Arts",
    impact: "Foundational",
    region: "Abeokuta, Ogun State",
    shortBio:
      "First African Nobel Laureate in Literature — a fearless dramatist, essayist and political prisoner whose pen has shaped a continent's conscience.",
    achievements: [
      "Awarded the Nobel Prize in Literature (1986) — first African laureate",
      "Author of Death and the King's Horseman, A Dance of the Forests, The Lion and the Jewel",
      "Founder of the 1960 Masks and Orisun Theatre companies",
      "Detained 22 months in solitary confinement during the Nigerian Civil War for advocating peace",
      "Recipient of Nigeria's CFR national honour and global academic chairs from Cornell to Cambridge",
    ],
    legacy:
      "Demonstrated to the world that Yoruba cosmology and African dramatic forms could stand among the highest registers of world literature.",
    yifRelevance:
      "Patron-spirit of YIF's Arts & Heritage programming — proof that cultural excellence is itself a form of nation-building.",
    programs: ["education", "recognition"],
    relatedIds: ["funmilayo-ransome-kuti", "fela-kuti", "hubert-ogunde"],
    imageUrl: "/image/yif-icons/Wole_Soyinka_in_2018.jpg",
    imageCredit: "Wikimedia Commons · CC BY-SA",
    imageAlt: "Prof. Wole Soyinka, Nobel Laureate in Literature.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Wole_Soyinka",
    yearAnchor: 1934,
  },
  {
    id: "fela-kuti",
    name: "Fela Anikulapo-Kuti",
    title: "Afrobeat Pioneer & Pan-African Voice",
    yorubaTitle: "Abami Eda",
    lifespan: "1938 – 1997",
    era: "Post-Independence",
    category: "Music",
    impact: "Transformative",
    region: "Abeokuta · Lagos",
    shortBio:
      "Architect of Afrobeat — the saxophonist-prophet whose music turned the Yoruba groove into the global vocabulary of resistance.",
    achievements: [
      "Created Afrobeat by fusing Yoruba rhythms, highlife, jazz and funk",
      "Founder of Kalakuta Republic and the Africa Shrine, Lagos",
      "Released over 50 albums including Zombie, Sorrow Tears and Blood, Coffin for Head of State",
      "Posthumously inducted into the Rock and Roll Hall of Fame (2021)",
      "Inspired the Tony Award-winning Broadway musical FELA!",
    ],
    legacy:
      "Made Afrobeat the most influential African musical export of the 20th century and modelled artistic activism for generations.",
    yifRelevance:
      "Anchor of YIF's youth-creative pillar — a reminder that Yoruba sound and stagecraft are world-class economic engines.",
    programs: ["youth", "recognition", "economic"],
    relatedIds: ["funmilayo-ransome-kuti", "wole-soyinka"],
    imageUrl: "/image/yif-icons/Femi_Kuti.jpg",
    imageCredit: "Wikimedia Commons",
    imageAlt: "Fela Anikulapo-Kuti, founder of Afrobeat.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Fela_Kuti",
    yearAnchor: 1938,
  },
  {
    id: "hubert-ogunde",
    name: "Chief Hubert Ogunde",
    honorific: "Chief",
    title: "Father of Nigerian Theatre & Cinema",
    lifespan: "1916 – 1990",
    era: "Colonial Resistance",
    category: "Cinema",
    impact: "Foundational",
    region: "Ososa, Ogun State",
    shortBio:
      "The pioneer who turned travelling Yoruba folk-opera into a professional theatre industry — and ultimately into Nollywood's first roots.",
    achievements: [
      "Founded the Ogunde Concert Party (1945), Africa's first professional theatre troupe",
      "Wrote and staged Strike and Hunger, Bread and Bullet, and Yoruba Ronu — banned for political defiance",
      "Pioneered Yoruba-language cinema with Aiye, Jaiyesimi and Aropin N'Tenia",
      "Trained the first generation of Yoruba theatre and film practitioners",
      "Honoured with national awards across Nigeria and West Africa",
    ],
    legacy:
      "Without Ogunde there is no Nollywood — he gave Yoruba performance its modern industrial form and political voice.",
    yifRelevance:
      "Patron of YIF's creative-economy and youth-arts grants — the original blueprint for cultural enterprise.",
    programs: ["youth", "economic", "recognition"],
    relatedIds: ["wole-soyinka", "tunde-kelani", "fela-kuti"],
    imageUrl: "/image/yif-icons/hubert_ogunde.jpg",
    imageCredit: "Public Domain",
    imageAlt: "Chief Hubert Ogunde, father of Nigerian theatre.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Hubert_Ogunde",
    yearAnchor: 1916,
  },
  {
    id: "tunde-kelani",
    name: "Chief Tunde Kelani",
    honorific: "Chief",
    title: "Master Filmmaker & Cultural Archivist",
    lifespan: "Born 1948",
    era: "Cultural Revival",
    category: "Cinema",
    impact: "Transformative",
    region: "Abeokuta, Ogun State",
    shortBio:
      "Cinematographer-storyteller whose Mainframe Films preserved Yoruba literature on screen and gave Nollywood its art-house standard.",
    achievements: [
      "Founder of Mainframe Film & Television Productions",
      "Director of Saworoide, Thunderbolt: Magun, Arugba, Maami, Dazzling Mirage",
      "Adapted seminal Yoruba novels by Adebayo Faleti and Akinwumi Isola for the screen",
      "Recipient of the Lifetime Achievement Award at the Africa Movie Academy Awards",
      "International festival circuits include FESPACO, Berlinale and the British Film Institute",
    ],
    legacy:
      "Proved that indigenous-language cinema can be both commercially viable and artistically world-class.",
    yifRelevance:
      "Models YIF's commitment to bilingual storytelling and cultural archiving as community development tools.",
    programs: ["youth", "recognition", "education"],
    relatedIds: ["hubert-ogunde", "wole-soyinka"],
    imageUrl: "/image/yif-icons/tunde-kelani.jpg",
    imageCredit: "Wikimedia Commons · CC BY-SA",
    imageAlt: "Chief Tunde Kelani, founder of Mainframe Productions.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Tunde_Kelani",
    yearAnchor: 1948,
  },
  {
    id: "susanne-wenger",
    name: "Susanne Wenger",
    yorubaTitle: "Adunni Olorisha",
    title: "Austrian-Yoruba Priestess & Sacred-Grove Custodian",
    lifespan: "1915 – 2009",
    era: "Cultural Revival",
    category: "Diaspora",
    impact: "Transformative",
    region: "Osogbo, Osun State (b. Graz, Austria)",
    shortBio:
      "Austrian artist who became a Yoruba Olorisha and rebuilt the Osun-Osogbo Sacred Grove — now a UNESCO World Heritage Site.",
    achievements: [
      "Initiated as a priestess of Obatala and adopted as Adunni Olorisha",
      "Reconstructed the shrines and sculptures of the Osun-Osogbo Sacred Grove from 1958 onward",
      "Co-led the New Sacred Art Movement, mentoring generations of Yoruba sculptors",
      "Instrumental in the Grove's UNESCO World Heritage Site listing (2005)",
      "Awarded Nigeria's MFR honour for services to culture",
    ],
    legacy:
      "Demonstrated that genuine love of Yoruba tradition transcends ancestry — and saved one of humanity's most important sacred landscapes.",
    yifRelevance:
      "Living symbol of YIF's diaspora-belonging philosophy — Yoruba identity as a chosen, lived covenant.",
    programs: ["recognition", "education"],
    relatedIds: ["ooni-sijuwade", "ooni-ogunwusi"],
    imageUrl: "/image/yif-icons/susanne_wenger.jpg",
    imageCredit: "Wikimedia Commons · CC BY-SA",
    imageAlt:
      "Susanne Wenger (Adunni Olorisha), Austrian-Yoruba artist and priestess.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Susanne_Wenger",
    yearAnchor: 1915,
  },
  {
    id: "moshood-abiola",
    name: "Chief MKO Abiola",
    honorific: "Chief",
    title: "Democracy Martyr & Pan-African Philanthropist",
    yorubaTitle: "Aare Ona Kakanfo of Yorubaland",
    lifespan: "1937 – 1998",
    era: "Democracy Struggle",
    category: "Statesman",
    impact: "Foundational",
    region: "Abeokuta, Ogun State",
    shortBio:
      "Winner of the annulled June 12, 1993 election — the businessman who paid for Nigerian democracy with his life.",
    achievements: [
      "Won Nigeria's freest-ever election (June 12, 1993) before its annulment",
      "Holder of the Aare Ona Kakanfo title, generalissimo of the Yoruba",
      "Global advocate for African slavery reparations",
      "Built schools, libraries and sports infrastructure across Africa via the Abiola Foundation",
      "Posthumously declared GCFR and June 12 declared Democracy Day by President Buhari (2018)",
    ],
    legacy:
      "His sacrifice in detention reset Nigeria's democratic moral compass — June 12 is now a national holiday in his honour.",
    yifRelevance:
      "Eternal reference point for YIF's civic-leadership and democratic-engagement programmes.",
    programs: ["recognition", "education"],
    relatedIds: ["bola-ige", "lateef-jakande", "obafemi-awolowo"],
    imageUrl: "/image/yif-icons/moshood-abiola.webp",
    imageCredit: "Wikimedia Commons",
    imageAlt: "Chief MKO Abiola, winner of the June 12, 1993 election.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/MKO_Abiola",
    yearAnchor: 1937,
  },
  {
    id: "lateef-jakande",
    name: "Alhaji Lateef Jakande",
    honorific: "Alhaji",
    title: "Architect of Modern Lagos",
    yorubaTitle: "Baba Kekere",
    lifespan: "1929 – 2021",
    era: "Second Republic",
    category: "Governance",
    impact: "Transformative",
    region: "Lagos State",
    shortBio:
      "First civilian Governor of Lagos — the journalist-statesman who built schools, housing estates and metro plans the city still depends on.",
    achievements: [
      "First Executive Governor of Lagos State (1979 – 1983)",
      "Built 23 housing estates and the Jakande low-cost housing scheme",
      "Established Lagos State University (LASU) and 23 new high schools",
      "Initiated the Lagos Metroline rail project (later cancelled by military coup)",
      "Veteran journalist and protégé of Chief Obafemi Awolowo",
    ],
    legacy:
      "Defined what good urban governance looks like in Africa — affordable housing, mass education and people-first transit.",
    yifRelevance:
      "Direct inspiration for YIF's urban-development advocacy and Karo-Ojire economic-empowerment model.",
    programs: ["education", "economic", "recognition"],
    relatedIds: ["obafemi-awolowo", "bola-ige", "moshood-abiola"],
    imageUrl: "/image/yif-icons/lateef_jakande.jpg",
    imageCredit: "Wikimedia Commons · CC BY-SA",
    imageAlt: "Alhaji Lateef Jakande, first civilian Governor of Lagos State.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Lateef_Jakande",
    yearAnchor: 1929,
  },
  {
    id: "bola-ige",
    name: "Chief Bola Ige",
    honorific: "Chief",
    title: "Cicero of Esa-Oke & Constitutional Lawyer",
    yorubaTitle: "Cicero of Esa-Oke",
    lifespan: "1930 – 2001",
    era: "Second Republic",
    category: "Governance",
    impact: "Transformative",
    region: "Esa-Oke, Osun State",
    shortBio:
      "Silver-tongued lawyer-politician — Governor of old Oyo State, Attorney-General of Nigeria, and a martyr of the rule of law.",
    achievements: [
      "Governor of the old Oyo State (1979 – 1983)",
      "Senior Advocate of Nigeria and Attorney-General & Minister of Justice (1999 – 2001)",
      "Founding leader of the Alliance for Democracy (AD)",
      "Champion of fiscal federalism and constitutional reform",
      "Pioneered free education and rural roads in old Oyo State",
    ],
    legacy:
      "Embodied the Awoist tradition of scholarly, rule-of-law politics — his unsolved assassination remains a national wound.",
    yifRelevance:
      "Reference figure for YIF's rule-of-law advocacy and legal-aid scholarship pipeline.",
    programs: ["education", "recognition"],
    relatedIds: ["obafemi-awolowo", "lateef-jakande", "moshood-abiola"],
    imageUrl: "/image/yif-icons/chief_james_ajibola_idowu_ige.jpg",
    imageCredit: "Wikimedia Commons",
    imageAlt: "Chief Bola Ige, the Cicero of Esa-Oke.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Bola_Ige",
    yearAnchor: 1930,
  },
  {
    id: "david-oyedepo",
    name: "Bishop David Oyedepo",
    honorific: "Bishop",
    title: "Faith Leader, Educator & Author",
    lifespan: "Born 1954",
    era: "Digital Renaissance",
    category: "Faith",
    impact: "Contemporary",
    region: "Omu-Aran, Kwara State",
    shortBio:
      "Founder of Living Faith Church Worldwide — pastor, prolific author and chancellor of two of Africa's leading private universities.",
    achievements: [
      "Founder and Presiding Bishop of Living Faith Church Worldwide (Winners' Chapel)",
      "Founder and Chancellor of Covenant University and Landmark University",
      "Author of more than 70 books on faith, leadership and prosperity",
      "Built Faith Tabernacle, one of the world's largest church auditoriums",
      "Architect of a global ministry across more than 60 countries",
    ],
    legacy:
      "Pioneered faith-based higher education in Nigeria, lifting tens of thousands into world-class academic and professional pathways.",
    yifRelevance:
      "Aligns with YIF's education-as-empowerment thesis and demonstrates the scale Yoruba institutional builders can achieve.",
    programs: ["education", "youth"],
    relatedIds: ["yemi-osinbajo", "ambrose-ali"],
    imageUrl: "/image/yif-icons/david-oyedepo.png",
    imageCredit: "Living Faith Church Worldwide",
    imageAlt: "Bishop David Oyedepo, founder of Living Faith Church Worldwide.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/David_Oyedepo",
    yearAnchor: 1954,
  },
  {
    id: "yemi-osinbajo",
    name: "Prof. Yemi Osinbajo",
    honorific: "Prof.",
    title: "Constitutional Scholar & Reformist Statesman",
    lifespan: "Born 1957",
    era: "Digital Renaissance",
    category: "Statesman",
    impact: "Contemporary",
    region: "Ikenne · Lagos",
    shortBio:
      "Senior Advocate, professor of law and Vice President of Nigeria (2015 – 2023) — a quiet architect of social-investment reform.",
    achievements: [
      "Vice President of the Federal Republic of Nigeria (2015 – 2023)",
      "Senior Advocate of Nigeria and Professor of Law at the University of Lagos",
      "Architect of the National Social Investment Programme (N-Power, TraderMoni, school-feeding)",
      "Former Attorney-General of Lagos State under Tinubu",
      "Pastor at the Redeemed Christian Church of God",
    ],
    legacy:
      "Showed that scholarly integrity and faith-anchored ethics can coexist with the highest political office in Nigeria.",
    yifRelevance:
      "Living example of the policy-maker pipeline YIF's scholarship and youth-leadership programmes seek to produce.",
    programs: ["education", "recognition", "economic"],
    relatedIds: ["david-oyedepo", "bola-ige", "obafemi-awolowo"],
    imageUrl: "/image/yif-icons/yemi-osinbajo.jpg",
    imageCredit: "Wikimedia Commons · CC BY",
    imageAlt: "Prof. Yemi Osinbajo, Vice President of Nigeria 2015 – 2023.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Yemi_Osinbajo",
    yearAnchor: 1957,
  },
] as const;

export function getIconById(id: string): YorubaIcon | undefined {
  return YORUBA_ICONS.find((i) => i.id === id);
}

export function getIconsByProgram(program: ProgramRelevance): YorubaIcon[] {
  return YORUBA_ICONS.filter((i) => i.programs.includes(program));
}

export function getRelatedIcons(icon: YorubaIcon): YorubaIcon[] {
  if (!icon.relatedIds?.length) return [];
  return icon.relatedIds
    .map((id) => getIconById(id))
    .filter((i): i is YorubaIcon => Boolean(i));
}

export function getIconsTimeline(): YorubaIcon[] {
  return [...YORUBA_ICONS].sort((a, b) => a.yearAnchor - b.yearAnchor);
}

export const CATEGORY_STYLES: Record<
  IconCategory,
  { label: string; bg: string; text: string; ring: string }
> = {
  Statesman: {
    label: "Statesman",
    bg: "bg-[var(--yif-navy)]/8",
    text: "text-[var(--yif-navy)]",
    ring: "ring-[var(--yif-navy)]/30",
  },
  Activist: {
    label: "Activist",
    bg: "bg-[var(--yif-terracotta)]/10",
    text: "text-[var(--yif-terracotta)]",
    ring: "ring-[var(--yif-terracotta)]/30",
  },
  Royalty: {
    label: "Royalty",
    bg: "bg-[var(--yif-gold)]/12",
    text: "text-[var(--yif-gold)]",
    ring: "ring-[var(--yif-gold)]/40",
  },
  Governance: {
    label: "Governance",
    bg: "bg-[var(--yif-navy-light)]/15",
    text: "text-[var(--yif-navy)]",
    ring: "ring-[var(--yif-navy-light)]/30",
  },
  Education: {
    label: "Education",
    bg: "bg-[var(--yif-green)]/10",
    text: "text-[var(--yif-green)]",
    ring: "ring-[var(--yif-green)]/30",
  },
  Diaspora: {
    label: "Diaspora",
    bg: "bg-[var(--yif-gold-pale)]",
    text: "text-[var(--yif-navy)]",
    ring: "ring-[var(--yif-gold)]/30",
  },
  Arts: {
    label: "Arts",
    bg: "bg-[var(--yif-terracotta)]/8",
    text: "text-[var(--yif-terracotta)]",
    ring: "ring-[var(--yif-terracotta)]/25",
  },
  Music: {
    label: "Music",
    bg: "bg-[var(--yif-gold)]/10",
    text: "text-[var(--yif-gold)]",
    ring: "ring-[var(--yif-gold)]/30",
  },
  Cinema: {
    label: "Cinema",
    bg: "bg-[var(--yif-navy-dark)]/15",
    text: "text-[var(--yif-navy-dark)]",
    ring: "ring-[var(--yif-navy-dark)]/30",
  },
  Faith: {
    label: "Faith",
    bg: "bg-[var(--yif-cream-dark)]",
    text: "text-[var(--yif-navy)]",
    ring: "ring-[var(--yif-gold)]/25",
  },
};

export const IMPACT_STYLES: Record<
  IconImpact,
  { dots: number; label: string }
> = {
  Foundational: { dots: 3, label: "Foundational impact" },
  Transformative: { dots: 3, label: "Transformative impact" },
  Contemporary: { dots: 2, label: "Contemporary impact" },
};
