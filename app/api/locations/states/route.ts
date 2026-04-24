import { NextResponse } from "next/server";
import { getStates } from "@/lib/countries";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") ?? "";
  if (!country) return NextResponse.json([]);
  return NextResponse.json(getStates(country));
}
