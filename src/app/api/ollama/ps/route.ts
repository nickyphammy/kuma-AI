import { NextResponse } from "next/server";
import { listRunning } from "@/lib/ollama";
import { errorResponse } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await listRunning();
    const totalResident = models.reduce((sum, m) => sum + m.sizeTotal, 0);
    const totalVram = models.reduce((sum, m) => sum + m.sizeVram, 0);
    return NextResponse.json({
      models,
      totals: {
        resident: totalResident,
        vram: totalVram,
        cpu: Math.max(totalResident - totalVram, 0),
        count: models.length,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
