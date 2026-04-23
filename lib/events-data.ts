// lib/events-data.ts — static event data for YIF

export type TicketTier = {
  id: string;
  name: string;
  price: number; // NGN
  description: string;
  available: number;
};

export type YIFEvent = {
  slug: string;
  title: string;
  tagline: string;
  category: "Awards" | "Conference" | "Workshop" | "Cultural" | "Fundraiser";
  date: string; // ISO
  endDate?: string; // ISO
  time: string;
  location: string;
  address: string;
  country: string;
  description: string;
  agenda: string[];
  speakers: { name: string; role: string }[];
  tiers: TicketTier[];
  past?: boolean;
};

export const EVENTS: YIFEvent[] = [
  {
    slug: "yif-annual-awards-2026",
    title: "YIF Annual Awards & Recognition Ceremony 2026",
    tagline:
      "Honouring the sons and daughters of Oodua who have made the race proud",
    category: "Awards",
    date: "2026-07-12",
    time: "5:00 PM WAT",
    location: "Federal Palace Hotel, Lagos",
    address: "1415 Ahmadu Bello Way, Victoria Island, Lagos",
    country: "Nigeria",
    description:
      "The YIF Annual Awards & Recognition Ceremony celebrates outstanding Yoruba individuals at home and in the diaspora who have distinguished themselves in their fields. Join us for an evening of culture, recognition, and unity as we honour heroes and heroines of the Yoruba race.",
    agenda: [
      "5:00 PM — Arrival & Reception",
      "6:00 PM — Opening prayers & national anthem",
      "6:20 PM — Welcome address by the National President",
      "6:45 PM — Keynote: The Yoruba Nation in a Changing World",
      "7:30 PM — Awards presentation (8 categories)",
      "9:00 PM — Cultural performances & dinner",
      "10:30 PM — Closing remarks",
    ],
    speakers: [
      { name: "Chief Aderounmu Adesesan", role: "National President, YIF" },
      { name: "Dr. Aderibole Olumide", role: "Keynote Speaker" },
      { name: "Mr. Sanjo Olawuyi", role: "Master of Ceremonies" },
    ],
    tiers: [
      {
        id: "general",
        name: "General Admission",
        price: 25000,
        description: "Standard seating, dinner included",
        available: 300,
      },
      {
        id: "vip",
        name: "VIP",
        price: 75000,
        description: "Priority seating, exclusive reception & gift pack",
        available: 50,
      },
      {
        id: "table",
        name: "Table of 10",
        price: 200000,
        description: "Reserved table for 10 guests, branding opportunities",
        available: 20,
      },
    ],
  },
  {
    slug: "yoruba-world-day-summit-2026",
    title: "Yoruba World Day Summit 2026",
    tagline:
      "Connecting the global Yoruba diaspora — unity, culture, and progress",
    category: "Conference",
    date: "2026-09-06",
    endDate: "2026-09-07",
    time: "9:00 AM BST",
    location: "The Barbican Centre, London",
    address: "Silk Street, Barbican, London EC2Y 8DS",
    country: "United Kingdom",
    description:
      "The Yoruba World Day Summit brings together Yoruba leaders, entrepreneurs, scholars, and creatives from over 30 countries for two days of high-level dialogue, cultural celebration, and strategic networking. This is the flagship event of the YIF calendar.",
    agenda: [
      "Day 1 — Cultural Celebration & Opening Ceremony",
      "Day 1 — Panel: Economic Empowerment in the Diaspora",
      "Day 1 — Networking Dinner",
      "Day 2 — Youth Forum & Leadership Masterclass",
      "Day 2 — Closing Plenary: The Path Forward for Yoruba Unity",
    ],
    speakers: [
      { name: "Chief Aderounmu Adesesan", role: "National President, YIF" },
      {
        name: "Princess M. Adewunmi King (Labamba)",
        role: "National Co-ordinator, UK",
      },
      { name: "Ms. Olushola Olude", role: "YIF Representative, United States" },
      { name: "Dr. Gbenga Adeyeye", role: "YIF Representative, South Africa" },
    ],
    tiers: [
      {
        id: "delegate",
        name: "Delegate Pass (2 days)",
        price: 45000,
        description: "Full access both days, meals included",
        available: 400,
      },
      {
        id: "vip",
        name: "VIP Delegate",
        price: 120000,
        description: "VIP lounge access, both days, gala dinner ticket",
        available: 60,
      },
      {
        id: "student",
        name: "Student / Youth (Under 30)",
        price: 10000,
        description:
          "Both days, meals included — valid student ID required at entry",
        available: 100,
      },
    ],
  },
  {
    slug: "karo-ojire-investment-workshop-2026",
    title: "Karo-Ojire Economic Empowerment Workshop",
    tagline: "Breaking free from poverty through cooperative economics",
    category: "Workshop",
    date: "2026-06-14",
    time: "10:00 AM WAT",
    location: "YIF Secretariat, Ibadan",
    address: "Secretariat Road, Ibadan, Oyo State",
    country: "Nigeria",
    description:
      "A practical, hands-on workshop on cooperative economics and investment strategies for Yoruba entrepreneurs. Learn how the Karo-Ojire initiative creates pathways to economic self-reliance, particularly for widows and young people.",
    agenda: [
      "10:00 AM — Registration & welcome",
      "10:30 AM — Introduction to Cooperative Economics",
      "11:30 AM — Karo-Ojire: Model & Opportunities",
      "1:00 PM — Lunch break",
      "2:00 PM — Group discussions & case studies",
      "4:00 PM — Q&A and next steps",
    ],
    speakers: [
      { name: "Mr. Edward Kayode Adeleye", role: "Treasurer, YIF" },
      { name: "Ogundare Adenike", role: "Youth Development Lead, YIF" },
    ],
    tiers: [
      {
        id: "general",
        name: "Participant",
        price: 5000,
        description: "Full day access, workshop materials, lunch",
        available: 150,
      },
    ],
  },
  {
    slug: "yif-fundraising-gala-london-2026",
    title: "YIF UK Fundraising Gala 2026",
    tagline:
      "An evening of culture and generosity — supporting Yoruba scholars",
    category: "Fundraiser",
    date: "2026-10-17",
    time: "7:00 PM BST",
    location: "Grosvenor House Hotel, London",
    address: "Park Lane, London W1K 7TN",
    country: "United Kingdom",
    description:
      "Join YIF UK for a glittering fundraising gala supporting the YIF Scholarship Programme. Every ticket purchased directly funds a Yoruba student's university education. An evening of Afrobeats, Yoruba cuisine, live performances, and philanthropic spirit.",
    agenda: [
      "7:00 PM — Arrival & cocktail reception",
      "7:45 PM — Welcome by Princess M. Adewunmi King",
      "8:00 PM — Scholarship impact presentation",
      "8:30 PM — Dinner & live cultural performances",
      "10:00 PM — Fundraising auction",
      "11:00 PM — Dancing & networking",
    ],
    speakers: [
      {
        name: "Princess M. Adewunmi King (Labamba)",
        role: "National Co-ordinator, UK",
      },
      {
        name: "Princess Omolabake Margret King",
        role: "YIF Representative, London",
      },
    ],
    tiers: [
      {
        id: "individual",
        name: "Individual Ticket",
        price: 60000,
        description:
          "Dinner, entertainment, and a contribution to the Scholarship Fund",
        available: 200,
      },
      {
        id: "couple",
        name: "Couple Ticket",
        price: 110000,
        description: "Two tickets — save ₦10,000",
        available: 60,
      },
      {
        id: "sponsor",
        name: "Gold Sponsor Table (10)",
        price: 500000,
        description:
          "Table of 10, naming rights on program, recognition speech slot",
        available: 10,
      },
    ],
  },
];

export const PAST_EVENTS: YIFEvent[] = [
  {
    slug: "yoruba-world-day-2025",
    title: "Yoruba World Day 2025",
    tagline: "A global celebration of Yoruba heritage",
    category: "Cultural",
    date: "2025-09-07",
    time: "10:00 AM BST",
    location: "London, United Kingdom",
    address: "London",
    country: "United Kingdom",
    description:
      "The 2025 Yoruba World Day celebrated Yoruba heritage across all continents with events in 15+ countries.",
    agenda: [],
    speakers: [],
    tiers: [],
    past: true,
  },
];

export const CATEGORY_COLORS: Record<YIFEvent["category"], string> = {
  Awards: "var(--yif-gold)",
  Conference: "var(--yif-navy-light)",
  Workshop: "var(--yif-green)",
  Cultural: "var(--yif-terracotta)",
  Fundraiser: "var(--yif-navy)",
};

export const CATEGORY_GRADIENTS: Record<YIFEvent["category"], string> = {
  Awards: "from-[#c9913d] via-[#e8a93e] to-[#c0553a]",
  Conference: "from-[#1a2744] via-[#253560] to-[#1a2744]",
  Workshop: "from-[#2d6a4f] via-[#1a2744] to-[#253560]",
  Cultural: "from-[#c0553a] via-[#c9913d] to-[#1a2744]",
  Fundraiser: "from-[#111b33] via-[#1a2744] to-[#c9913d]",
};

export function getEventBySlug(slug: string): YIFEvent | undefined {
  return [...EVENTS, ...PAST_EVENTS].find((e) => e.slug === slug);
}

export function getAllEventSlugs(): string[] {
  return [...EVENTS, ...PAST_EVENTS].map((e) => e.slug);
}

export function formatEventDate(iso: string, endIso?: string): string {
  const start = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const startStr = start.toLocaleDateString("en-GB", opts);
  if (!endIso) return startStr;
  const end = new Date(endIso);
  const endStr = end.toLocaleDateString("en-GB", opts);
  return `${startStr} – ${endStr}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
