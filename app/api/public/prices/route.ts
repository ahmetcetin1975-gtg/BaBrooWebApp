import { NextResponse } from "next/server";
import { getPrices } from "@/lib/gtg/api";

export async function GET() {
  try {
    const prices = await getPrices();
    return NextResponse.json(prices);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load prices";
    return NextResponse.json({ message }, { status: 500 });
  }
}
