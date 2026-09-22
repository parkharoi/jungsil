import { InvalidFilterError, listProblems } from "@/lib/problems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    return Response.json(listProblems(new URL(request.url).searchParams));
  } catch (error) {
    if (error instanceof InvalidFilterError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to list problems.");
    return Response.json({ error: "문제를 불러오지 못했습니다." }, { status: 500 });
  }
}
