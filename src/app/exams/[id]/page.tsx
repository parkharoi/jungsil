import Link from "next/link";
import { notFound } from "next/navigation";
import { listExams, listExamProblems } from "@/lib/problems";

export const dynamic = "force-dynamic";
export const metadata = { title: "회차 풀이 | 정실이" };

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = listExams().find(exam => exam.id === id);
  if (!exam) notFound();
  const questions = listExamProblems(id);
  const next = questions.find(question => !question.solved) ?? questions[0];
  const href = (problemId: string) => `/problems/${encodeURIComponent(problemId)}?exam=${encodeURIComponent(id)}`;
  return <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
    <Link href="/problems" className="text-sm text-emerald-700 underline dark:text-emerald-400">← 기출문제 모음</Link>
    <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">{exam.certification} 실기 · 복원 문제</p>
    <h1 className="mt-2 text-4xl font-bold">{exam.year}년 {exam.round}회</h1>
    <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-300">한 문제씩 풀고, 해설을 확인하고, 다음 문제로 나아가세요.<br />풀이 기록은 자동으로 남습니다.</p>
    <div className="my-8 rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-950">
      <p className="font-semibold">{exam.solved === exam.available && exam.available > 0 ? "모든 문제를 풀었어요. 수고했소!" : `지금까지 ${exam.solved} / ${exam.available}문제 완료`}</p>
      <progress aria-label="회차 풀이 진행률" className="my-4 h-2 w-full accent-emerald-600" value={exam.solved} max={exam.available || 1} />
      {next && <Link href={href(next.id)} className="inline-block rounded-xl bg-emerald-800 px-6 py-3 font-semibold text-white hover:bg-emerald-900">{exam.solved === exam.available ? "처음부터 다시 풀기" : exam.solved ? `${next.questionNumber}번부터 이어서 풀기` : "1번부터 시작하기"} →</Link>}
      {exam.available < exam.expected && <p className="mt-4 text-sm">전체 {exam.expected}문제 중 {exam.available}문제가 준비됐어요.</p>}
    </div>
    <h2 className="text-xl font-bold">이번 회차 문제</h2>
    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">번호는 제공 PDF의 표시 순서입니다. 완료 표시는 정오답과 관계없이 제출한 문제를 뜻합니다.</p>
    <ol className="mt-5 grid gap-3">{questions.map(q => <li key={q.id}><Link href={href(q.id)} className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 hover:border-emerald-600 dark:border-zinc-700">
      <span className="font-mono text-xl text-emerald-700 dark:text-emerald-400">{String(q.questionNumber).padStart(2, "0")}</span>
      <span className="flex-1 text-sm font-medium">{q.title}</span><span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{q.solved ? "완료 ✓" : "미풀이"}</span>
    </Link></li>)}</ol>
  </main>;
}
