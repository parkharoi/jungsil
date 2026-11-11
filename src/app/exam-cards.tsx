import Link from "next/link";
import { listExams } from "@/lib/problems";

export default function ExamCards() {
  const exams = listExams();
  return <section aria-labelledby="exam-heading" className="my-10">
    <div className="mb-5"><p className="text-xs font-bold tracking-widest text-emerald-700 dark:text-emerald-400">한 회차씩, 차근차근</p>
      <h2 id="exam-heading" className="mt-2 text-2xl font-bold">기출문제 모음</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">회차를 고르면 첫 문제부터 마지막 문제까지 이어서 풀 수 있어요.</p></div>
    {exams.length ? <div className="grid gap-4 sm:grid-cols-2">{exams.map(exam => <Link key={exam.id} href={`/exams/${encodeURIComponent(exam.id)}`} className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-emerald-600 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3"><span className="text-sm text-zinc-500 dark:text-zinc-400">{exam.certification} 실기 · 복원</span><span aria-hidden="true" className="text-emerald-700 dark:text-emerald-400">↗</span></div>
      <h3 className="mt-4 text-2xl font-bold">{exam.year}년 {exam.round}회</h3>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{exam.solved} / {exam.available}문제 풀이 완료</p>
      <progress aria-label={`${exam.year}년 ${exam.round}회 풀이 진행률`} className="mt-3 h-1.5 w-full accent-emerald-600" value={exam.solved} max={exam.available || 1} />
      {exam.available < exam.expected && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">전체 {exam.expected}문제 중 {exam.available}문제 풀이 가능</p>}
      <p className="mt-5 font-semibold text-emerald-700 dark:text-emerald-400">{!exam.available ? "회차 살펴보기" : exam.solved === exam.available ? "한 번 더 도전하기" : exam.solved ? "이어서 풀기" : "회차 시작하기"} →</p>
    </Link>)}</div> : <p className="rounded-xl border border-dashed p-6">등록된 기출 회차가 없습니다.</p>}
  </section>;
}
