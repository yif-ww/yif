import { NextResponse } from "next/server";
import { getCities } from "@/lib/countries";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") ?? "";
  const state = searchParams.get("state") ?? "";
  if (!country || !state) return NextResponse.json([]);
  return NextResponse.json(getCities(country, state));
}
