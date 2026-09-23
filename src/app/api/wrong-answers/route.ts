import { listWrongAnswers } from "@/lib/attempts";
import { InvalidFilterError } from "@/lib/problems";

export const runtime = "nodejs";

export function GET(request: Request) {
  try {
    return Response.json(listWrongAnswers(new URL(request.url).searchParams), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof InvalidFilterError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Failed to load wrong-answers.");
    return Response.json({ error: "풀이 기록을 불러오지 못했습니다." }, { status: 500 });
  }
}
