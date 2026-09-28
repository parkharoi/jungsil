import Link from "next/link";
import { dimensions, getWeaknesses } from "@/lib/weaknesses";
import { questionTypeLabels } from "@/lib/problems";
import { sourceLabels, weaknessLabels } from "@/lib/learning-labels";
export const dynamic = "force-dynamic";
export const metadata = { title: "취약점 분석 | JungSil" };

export default function StatsPage() {
  const stats = getWeaknesses();
  const labels = { topic: "주제", subTopic: "세부 주제", language: "언어", questionType: "문제 유형", sourceType: "출처" };
  return <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
    <h1 className="text-3xl font-bold">취약점 분석</h1>
    <dl className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{[
      ["총 풀이 수", stats.totalAttempts], ["고유 문제 수", stats.uniqueProblemsSolved], ["맞힌 수", stats.totalCorrect],
      ["틀린 수", stats.totalWrong], ["전체 정답률", stats.accuracy + "%"], ["미해결 오답 문제", stats.unresolvedWrongProblems],
    ].map(([label, value]) => <div key={label} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><dt className="text-sm text-zinc-500">{label}</dt><dd className="mt-2 text-2xl font-semibold">{value}</dd></div>)}</dl>
    <section aria-labelledby="recommendations" className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950">
      <h2 id="recommendations" className="text-xl font-bold">오늘의 추천 학습</h2>
      {stats.recommendations.length ? <ol className="mt-4 list-decimal space-y-3 pl-5">{stats.recommendations.map(item => <li key={item.href}>
        <Link href={item.href} className="font-medium underline underline-offset-4">{item.title}</Link><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.reason}</p>
      </li>)}</ol> : <p className="mt-3">조금 더 문제를 풀면 정실이가 취약 영역을 찾아드릴게요.</p>}
    </section>
    <p className="mt-6 text-sm leading-6 text-zinc-600 dark:text-zinc-400">정답률은 전체 제출 기준입니다. 각 영역에서 서로 다른 문제를 3개 이상 풀어야 취약도를 판단합니다. 반복 오답은 문제별 첫 오답을 제외한 추가 오답 횟수입니다.</p>
    <nav aria-label="분석 기준" className="my-4 flex flex-wrap gap-4">{dimensions.map(key => <a key={key} href={"#" + key} className="text-emerald-700 underline dark:text-emerald-400">{labels[key]}별</a>)}</nav>
    {stats.totalAttempts === 0 && <p className="my-6 rounded-xl border border-dashed border-zinc-300 p-6">아직 풀이 기록이 없습니다. <Link href="/problems" className="underline">문제를 풀어보세요.</Link></p>}
    {dimensions.map(key => <section key={key} id={key} aria-labelledby={key + "-heading"} className="mt-10">
      <h2 id={key + "-heading"} className="text-xl font-bold">{labels[key]}별 취약점</h2>
      {key === "language" && <p className="mt-2 text-sm text-zinc-500">C · Java · Python · SQL · 언어 없음 — 실제 기록이 있는 항목을 표시합니다.</p>}
      <p className="mt-2 text-sm text-zinc-500">집중 복습 → 취약 → 주의 → 양호 → 데이터 부족 순으로 최대 50개 표시</p>
      {stats.groups[key].length === 0 ? <p className="mt-4 text-zinc-500">분석할 기록이 없습니다.</p> : <ul className="mt-4 grid gap-4 sm:grid-cols-2">{stats.groups[key].map(row => {
        const name = row.value === null ? key === "language" ? "언어 없음" : "세부 주제 없음"
          : key === "questionType" ? questionTypeLabels[row.value as keyof typeof questionTypeLabels]
          : key === "sourceType" ? sourceLabels[row.value] ?? row.value : row.value;
        return <li key={row.value ?? "__none__"} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{name}</h3><span className={row.weaknessLevel === "FOCUS" || row.weaknessLevel === "WEAK" ? "font-semibold text-rose-700 dark:text-rose-300" : "text-zinc-600 dark:text-zinc-400"}>{weaknessLabels[row.weaknessLevel]}</span></div>
          <p className="mt-3 text-2xl font-bold">정답률 {row.accuracy}%</p>
          <p className="mt-2 text-sm">고유 문제 {row.uniqueProblemsSolved}개 · 전체 제출 {row.attemptedCount}회 중 정답 {row.correctCount}회</p>
          <p className="mt-1 text-sm">오답 {row.wrongCount}회 · 반복 오답 {row.repeatedWrongCount}회</p>
          <p className="mt-2 text-xs text-zinc-500">최근 풀이: {new Date(row.lastAttemptedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
          {row.weaknessLevel === "INSUFFICIENT_DATA" && <p className="mt-3 text-sm">서로 다른 문제를 3개 이상 풀면 분석할 수 있어요.</p>}
          <Link href={"/wrong-answers?" + new URLSearchParams({ [key]: row.value ?? "NONE" })} className="mt-4 inline-block text-sm text-emerald-700 underline dark:text-emerald-400">이 영역의 오답 보기</Link>
        </li>;
      })}</ul>}
    </section>)}
  </main>;
}
