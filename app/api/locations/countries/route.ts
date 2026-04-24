import { NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/countries";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(COUNTRIES);
}
