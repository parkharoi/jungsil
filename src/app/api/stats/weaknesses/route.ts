import { getWeaknesses } from "@/lib/weaknesses";
import { InvalidFilterError } from "@/lib/problems";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  try {
    return Response.json(getWeaknesses(new URL(request.url).searchParams), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof InvalidFilterError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Failed to load learning statistics.");
    return Response.json({ error: "학습 통계를 불러오지 못했습니다." }, { status: 500 });
  }
}
