export type BlogPost = {
  slug: string;
  title: string;
  category: "Culture" | "Politics" | "Events" | "Youth Development";
  excerpt: string;
  body: string[];
  date: string; // ISO 8601
  readTime: number; // minutes
  author: string;
  authorRole: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "the-strength-of-yoruba-heritage",
    title: "The Strength of Yoruba Heritage",
    category: "Culture",
    excerpt:
      "For centuries, Yoruba civilization has stood as one of Africa's most vibrant and enduring cultural traditions — from the sacred city of Ile-Ife to diaspora communities on four continents.",
    date: "2026-03-15",
    readTime: 5,
    author: "Dr. Aderibole Olumide",
    authorRole: "National President/CEO, YIF",
    body: [
      "The Yoruba civilization is one of the world's most ancient and richly documented cultures, tracing its spiritual and historical origins to Ile-Ife — the city regarded as the cradle of Yoruba identity. From the intricate bronze castings of Benin to the vibrant indigo adire textiles of Abeokuta, Yoruba art has long been a language of its own, speaking of cosmology, hierarchy, and a people's unbroken relationship with the divine.",
      "Central to this heritage is the Yoruba language — a tonal tongue spoken by over 50 million people worldwide and recognized by UNESCO for its literary and oral traditions. Yoruba proverbs (àsàyán ọ̀rọ̀) carry generations of wisdom in a single phrase. Institutions like the Yoruba Indigenes' Foundation exist precisely to formalize this transmission: ensuring that the values embedded in language, festivals, masquerades, and lineage rites are not lost to the acceleration of modernity.",
      "YIF's cultural mandate, articulated through its founding motto — 'Fun Isokan, Idagbasoke ati Ilosiwaju Omo Yoruba Lapapo' (Yoruba Unity, Progress, and Advancement Together) — goes beyond preservation. It is about activation. When Yoruba sons and daughters in Mali, Brazil, China, and the United States connect through our diaspora network, they are not merely nostalgic; they are building the kind of transnational solidarity that allows culture to be a living, economic force.",
      "The annual awards ceremony, where distinguished Yoruba leaders receive the Staff of Distinction in the Order of Odua, is one tangible expression of how YIF honours this continuum between ancestral achievement and contemporary excellence. Heritage, for us, is never a museum piece — it is the foundation upon which future generations stand.",
    ],
  },
  {
    slug: "leadership-in-nigeria-today",
    title: "Leadership in Nigeria Today",
    category: "Politics",
    excerpt:
      "As Yoruba-led state governments chart bold economic and social agendas, the question is no longer whether capable leadership exists — but whether institutions are strong enough to sustain it.",
    date: "2026-02-28",
    readTime: 6,
    author: "Mr. Sanjo Olawuyi",
    authorRole: "Director of Publicity, YIF",
    body: [
      "Nigeria's federal structure places enormous responsibility on sub-national governments, and the Yoruba states have increasingly demonstrated what purposeful, accountable leadership can accomplish in the face of structural constraints. Governors across Lagos, Ogun, Oyo, Osun, Ekiti, Ondo, and Kwara have each articulated distinct development blueprints — from infrastructure and industrial corridors to social protection schemes — that reflect a new seriousness in governance.",
      "The Yoruba Indigenes' Foundation maintains a non-partisan posture while actively engaging governance structures. Our charter calls for 'non-partisan cooperation at communal, local, and international levels.' This is not passivity — it is a strategic commitment to outlasting electoral cycles. YIF's role is to research, advise, and help bridge identifiable development gaps regardless of which administration is in power.",
      "What the current leadership landscape demands is a maturing of civil society alongside government. Too often, non-governmental organizations in Nigeria adopt a posture of permanent opposition rather than constructive partnership. YIF's approach — working with executive governors as patrons and allies, while preserving organizational independence — models a more productive relationship between civic institutions and the state.",
      "Leadership today must also grapple with a young and restless population. Over 60 percent of Nigeria's population is under 25. Any governance framework that does not place youth employment, education quality, and digital opportunity at its center is governing for the past, not the future. It is precisely this urgency that drives YIF's Youth Development program and our scholarship initiative, which provides pathways to university education for talented Yoruba young people who would otherwise lack access.",
    ],
  },
  {
    slug: "yoruba-world-day-2026",
    title: "Yoruba World Day 2026",
    category: "Events",
    excerpt:
      "This year's Yoruba World Day carries a bold economic theme: Branding Nigeria & Investment Portfolios — a call for diaspora capital, indigenous innovation, and institutional partnership to converge.",
    date: "2026-04-10",
    readTime: 4,
    author: "Chief Aderounmu Adesesan",
    authorRole: "National Coordinator, YIF",
    body: [
      "Yoruba World Day is observed annually by Yoruba communities across the globe — a moment to reaffirm cultural identity, celebrate achievement, and strengthen the bonds between homeland and diaspora. The 2026 edition carries an explicitly economic charge: the theme 'Branding Nigeria & Investment Portfolios' recognizes that cultural pride and economic agency are not separate conversations.",
      "For YIF, this theme aligns directly with the Karo-Ojire Economic Empowerment Project — our cooperative investment vehicle designed to channel collective Yoruba capital into sustainable ventures. The cooperative model offers a powerful alternative to dependence on government patronage. As our founding philosophy holds: 'We don't have to win an election or pass a bill to do what we think is right for us. We can simply move our race forward.'",
      "Celebrations this year span Lagos, Ibadan, London, Atlanta, and São Paulo, with online participation from our representatives in Mali, Uganda, China, Australia, and beyond. Local committees have organized cultural exhibitions, investment forums, and youth talent showcases. The UK chapter, led by National Co-ordinator Princess M. Adewunmi King, has coordinated a fundraising gala in London to support the scholarship program.",
      "The investment portfolio discussions at Yoruba World Day 2026 events will focus on three sectors: agribusiness (particularly Yoruba-owned cooperatives in Ogun and Oyo states), technology and digital services (leveraging Yoruba talent in Lagos's growing tech ecosystem), and cultural tourism (monetizing heritage sites and festivals in a way that reinvests in local communities). YIF invites its members and patrons worldwide to attend, contribute, and lead.",
    ],
  },
  {
    slug: "youth-development-in-yoruba-land",
    title: "Youth Development in Yoruba Land",
    category: "Youth Development",
    excerpt:
      "The next chapter of Yoruba advancement will be written by young people — and YIF's scholarship program, mentorship networks, and youth affairs directorate are building the conditions for that future right now.",
    date: "2026-01-20",
    readTime: 5,
    author: "Ogundare Adenike",
    authorRole: "Youth Coordinator, YIF",
    body: [
      "If there is one truth that unites every chapter of YIF's work — from cooperative economics to cultural preservation — it is that the future of the Yoruba people depends on the capacity we build in the next generation. Youth development is not a program category for us; it is the organizing logic of everything we do.",
      "The YIF Scholarship Program (2024–2025 Batch) represents one of the Foundation's most direct interventions: identifying talented Yoruba students, connecting them with top-slot scholarships at premium universities at home and abroad, and ensuring that financial circumstance does not determine intellectual destiny. With a registration process accessible to all and a selection process grounded in merit and need, the program has already created transformative pathways for young scholars.",
      "Beyond scholarships, youth development at YIF encompasses mentorship, digital literacy, and leadership formation. Our Youth Affairs directorate, led by Director Mr. Oluwatosin Famori, works to build networks between young Yorubas in the diaspora and their counterparts in Nigeria — facilitating internships, knowledge exchange, and joint projects that build skills while reinforcing cultural identity.",
      "The challenge is scale. Millions of young Yorubas deserve access to these opportunities, and the current programs serve only a fraction of that need. YIF's call to action is simple: if you are a successful Yoruba son or daughter — in business, medicine, law, technology, the arts — sponsor a scholar, mentor a youth, contribute to the cooperative. The most meaningful legacy any of us can leave is a young person fully equipped to carry the tradition forward.",
    ],
  },
];

/** Returns a single post by slug, or undefined if not found. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Returns all slugs — used for generateStaticParams. */
export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

/** Category accent colors keyed to CSS variable names. */
export const CATEGORY_COLORS: Record<BlogPost["category"], string> = {
  Culture: "var(--yif-gold)",
  Politics: "var(--yif-navy-light)",
  Events: "var(--yif-terracotta)",
  "Youth Development": "var(--yif-green)",
};

/** Gradient classes per category for card banners. */
export const CATEGORY_GRADIENTS: Record<BlogPost["category"], string> = {
  Culture: "from-[#c9913d] via-[#e8a93e] to-[#c0553a]",
  Politics: "from-[#1a2744] via-[#253560] to-[#1a2744]",
  Events: "from-[#c0553a] via-[#c9913d] to-[#e8a93e]",
  "Youth Development": "from-[#2d6a4f] via-[#1a2744] to-[#253560]",
};

/** Format ISO date for display. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
