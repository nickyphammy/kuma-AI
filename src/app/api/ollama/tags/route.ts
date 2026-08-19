import { NextResponse } from "next/server";
import { listInstalled } from "@/lib/ollama";
import { errorResponse } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await listInstalled();
    return NextResponse.json({ models });
  } catch (err) {
    return errorResponse(err);
  }
}
