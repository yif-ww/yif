import type { Metadata } from "next";
import { ProgramsHero } from "@/components/programs/ProgramsHero";
import { KaroOjireSection } from "@/components/programs/KaroOjireSection";
import { ScholarshipSection } from "@/components/programs/ScholarshipSection";
import {
  AwardsSection,
  YouthSection,
} from "@/components/programs/AwardsYouthSections";

export const metadata: Metadata = {
  title: "Programs & Initiatives | YIF",
  description:
    "Explore YIF's four core programs: Karo-Ojire Economic Empowerment, the 2024–25 Scholarship, Annual Events & Awards (Order of Odua), and Youth Development.",
  openGraph: {
    title: "Programs & Initiatives | Yoruba Indigenes' Foundation",
    description:
      "Four pillars driving Yoruba advancement — economic empowerment, education, cultural recognition, and youth development.",
    type: "website",
  },
};

export default function ProgramsPage() {
  return (
    <>
      <ProgramsHero />
      <KaroOjireSection />
      <ScholarshipSection />
      <AwardsSection />
      <YouthSection />
    </>
  );
}
