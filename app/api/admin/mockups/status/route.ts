/**
 * Admin: Check Mockup Task Status
 * GET /api/admin/mockups/status?task_key=...
 *
 * Polls a Printful mockup task and returns current status + results.
 */
import { NextResponse } from "next/server";
import { getMockupTaskResult } from "@/lib/printful";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskKey = searchParams.get("task_key");

    if (!taskKey) {
      return NextResponse.json(
        { success: false, error: "task_key is required" },
        { status: 400 }
      );
    }

    const result = await getMockupTaskResult(taskKey);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[mockup-status] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Status check failed" },
      { status: 500 }
    );
  }
}
