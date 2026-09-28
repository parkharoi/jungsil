import Link from "next/link";
import { getWrongSummary, listWrongAnswers, wrongFilterKeys } from "@/lib/reviews";
import { difficultyLabels, InvalidFilterError, questionTypeLabels } from "@/lib/problems";
import { languages, questionTypes, sourceTypes } from "@/db/schema";
import { reviewLabels, sourceLabels } from "@/lib/learning-labels";
export const dynamic = "force-dynamic";
export const metadata = { title: "오답노트 | JungSil" };

export default async function WrongAnswersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach(v => query.append(key, v));
    else if (value !== undefined) query.append(key, value);
  }
  const summary = getWrongSummary();
  let rows: ReturnType<typeof listWrongAnswers> = [], error = "";
  try { rows = listWrongAnswers(query); }
  catch (cause) { if (!(cause instanceof InvalidFilterError)) throw cause; error = cause.message; }
  const labels = { sourceType: "출처", examYear: "연도", examRound: "회차", questionType: "문제 유형", topic: "주제", subTopic: "세부 주제", language: "언어", reviewStatus: "복습 상태" };
  const options: Partial<Record<typeof wrongFilterKeys[number], readonly string[]>> = {
    sourceType: sourceTypes, questionType: questionTypes, language: [...languages, "NONE"], reviewStatus: Object.keys(reviewLabels),
  };
  const optionLabel = (key: string, value: string) => key === "sourceType" ? sourceLabels[value] ?? value
    : key === "questionType" ? questionTypeLabels[value as keyof typeof questionTypeLabels]
    : key === "reviewStatus" ? reviewLabels[value as keyof typeof reviewLabels] : value === "NONE" ? "언어 없음" : value;
  const offset = Number(query.get("offset") ?? 0), limit = Number(query.get("limit") ?? 50);
  const pageHref = (next: number) => { const p = new URLSearchParams(query); p.set("offset", String(next)); return "/wrong-answers?" + p; };
  return <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
    <h1 className="text-3xl font-bold">오답노트</h1>
    <p className="mt-3 text-zinc-600 dark:text-zinc-400">다시 풀어 연속 두 번 맞히면 복습 완료로 표시합니다. 일반 문제 풀이 정답은 복습 횟수에 포함하지 않습니다.</p>
    <dl className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{[
      ["전체 오답 문제", summary.total], ["미복습", summary.notReviewed], ["복습 중", summary.reviewing],
      ["복습 완료", summary.mastered], ["가장 많이 틀린 분야", summary.mostWrongTopic ?? "아직 없음"],
    ].map(([label, value]) => <div key={label} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><dt className="text-sm text-zinc-500">{label}</dt><dd className="mt-2 break-words text-xl font-semibold">{value}</dd></div>)}</dl>
    <p className="text-sm text-zinc-500">요약은 필터와 관계없이 전체 기록 기준입니다.</p>
    <form key={query.toString()} action="/wrong-answers" method="get" className="my-6 grid gap-4 rounded-xl bg-zinc-100 p-5 sm:grid-cols-2 lg:grid-cols-4 dark:bg-zinc-900">
      {wrongFilterKeys.map(key => <label key={key} className="grid gap-2 text-sm font-medium">{labels[key]}
        {options[key] ? <select name={key} defaultValue={query.get(key) ?? ""} className="min-w-0 rounded-lg border border-zinc-300 bg-white p-2.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100">
          <option value="">전체</option>{options[key]!.map(value => <option key={value} value={value}>{optionLabel(key, value)}</option>)}
        </select> : <input name={key} defaultValue={query.get(key) ?? ""} type={key === "examYear" || key === "examRound" ? "number" : "text"}
          min={key === "examYear" ? 1900 : 1} max={9999} maxLength={200} placeholder="전체"
          className="min-w-0 rounded-lg border border-zinc-300 bg-white p-2.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100" />}
      </label>)}
      <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4"><button className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800">필터 적용</button><Link href="/wrong-answers" className="underline underline-offset-4">초기화</Link></div>
    </form>
    {error ? <p role="alert" className="rounded-lg border border-red-300 p-4 text-red-700 dark:text-red-300">{error}</p>
      : rows.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center">
        <p className="text-lg font-semibold">{summary.total === 0 ? "아직 틀린 문제가 없습니다." : "조건에 맞는 오답이 없습니다."}</p>
        <p className="mt-2">{summary.total === 0 ? "문제를 풀면 여기에 자동으로 모아드릴게요." : "필터를 바꾸거나 이전 페이지를 확인해 주세요."}</p>
        <Link href="/problems" className="mt-4 inline-block text-emerald-700 underline dark:text-emerald-400">문제 풀기</Link>
      </div> : <ul className="grid gap-5">{rows.map(row => <li key={row.problemId} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">{sourceLabels[row.sourceType] ?? row.sourceType}</span>
          <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{reviewLabels[row.reviewStatus]}</span>
          <span className="py-1">{row.examYear ? row.examYear + "년" : "연도 없음"} · {row.examRound ? row.examRound + "회" : "회차 없음"} · {row.questionNumber ? row.questionNumber + "번" : "번호 없음"}</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold">{row.title}</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{questionTypeLabels[row.questionType]} · {row.topic} / {row.subTopic ?? "세부 주제 없음"} · {row.language ?? "언어 없음"} · {difficultyLabels[row.difficulty]}</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-zinc-500">최근에 틀린 답</dt><dd className="mt-1 whitespace-pre-wrap break-words">{row.latestWrongAnswer}</dd></div>
          <div><dt className="text-sm text-zinc-500">정확한 답</dt><dd className="mt-1 whitespace-pre-wrap break-words">{row.correctAnswer}</dd></div>
        </dl>
        <p className="mt-4 text-sm">오답 {row.wrongCount}회 / 전체 풀이 {row.totalAttemptCount}회 · 연속 재풀이 정답 {row.consecutiveCorrectCount}회</p>
        <p className="mt-1 text-sm text-zinc-500">최근 오답: <time dateTime={row.latestWrongAt}>{new Date(row.latestWrongAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</time></p>
        <p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600 dark:text-zinc-400">{row.explanation}</p>
        <Link href={"/problems/" + encodeURIComponent(row.problemId) + "?mode=retry"} className="mt-5 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800">다시 풀기</Link>
      </li>)}</ul>}
    {!error && <nav aria-label="오답 페이지" className="mt-6 flex gap-6">
      {offset > 0 && <Link href={pageHref(Math.max(0, offset - limit))} className="underline">이전</Link>}
      {rows.length === limit && <Link href={pageHref(offset + limit)} className="underline">다음</Link>}
    </nav>}
  </main>;
}
