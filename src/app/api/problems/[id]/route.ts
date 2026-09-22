import { findProblem } from "@/lib/problems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const problem = findProblem(id);
    if (!problem) {
      return Response.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json(problem);
  } catch {
    console.error("Failed to read problem.");
    return Response.json({ error: "문제를 불러오지 못했습니다." }, { status: 500 });
  }
}
