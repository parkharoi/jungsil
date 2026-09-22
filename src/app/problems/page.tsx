import Link from "next/link";
import { difficultyLabels, getFilterOptions, InvalidFilterError, listProblems, questionTypeLabels } from "@/lib/problems";

export const dynamic = "force-dynamic";
export const metadata = { title: "문제 목록 | JungSil" };

export default async function ProblemsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.append(key, value);
  }
  const options = getFilterOptions();
  let rows: ReturnType<typeof listProblems> = [];
  let error = "";
  try {
    rows = listProblems(query);
  } catch (cause) {
    if (!(cause instanceof InvalidFilterError)) throw cause;
    error = cause.message;
  }
  const fields = [
    { key: "questionType", label: "문제 유형" },
    { key: "topic", label: "주제" },
    { key: "difficulty", label: "난이도" },
    { key: "language", label: "프로그래밍 언어" },
  ] as const;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      <Link href="/" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">JungSil · 정실이</Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">문제 목록</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">유형과 주제로 문제를 찾아 개념을 익혀보세요.</p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">JungSil Sample은 직접 만든 학습용 문제이며 실제 기출문제가 아닙니다.</p>

      <form key={query.toString()} action="/problems" method="get" className="my-8 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
        {fields.map(({ key, label }) => (
          <label key={key} className="grid gap-2 text-sm font-medium">
            {label}
            <select name={key} defaultValue={query.get(key) ?? ""} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 focus:outline-2 focus:outline-emerald-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100">
              <option value="">전체</option>
              {options[key].map((value) => (
                <option key={value} value={value}>
                  {key === "questionType" ? questionTypeLabels[value as keyof typeof questionTypeLabels]
                    : key === "difficulty" ? difficultyLabels[value as keyof typeof difficultyLabels] : value}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">필터 적용</button>
          <Link href="/problems" className="text-sm underline underline-offset-4">초기화</Link>
        </div>
      </form>

      {error ? <p role="alert" className="rounded-lg border border-red-300 p-4 text-red-700 dark:text-red-300">{error} 필터를 초기화해 주세요.</p> : (
        <>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">총 {rows.length}문제</p>
          {rows.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center">조건에 맞는 문제가 없습니다.</p> : (
            <ul className="grid gap-4">
              {rows.map((problem) => (
                <li key={problem.id}>
                  <Link href={`/problems/${encodeURIComponent(problem.id)}`} className="block rounded-xl border border-zinc-200 p-5 transition-colors hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-zinc-800 dark:hover:border-emerald-400">
                    <h2 className="text-lg font-semibold">{problem.title}</h2>
                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div><dt className="sr-only">문제 유형</dt><dd>{questionTypeLabels[problem.questionType]}</dd></div>
                      <div><dt className="sr-only">주제</dt><dd>{problem.topic}</dd></div>
                      <div><dt className="sr-only">난이도</dt><dd>{difficultyLabels[problem.difficulty]}</dd></div>
                      <div><dt className="sr-only">프로그래밍 언어</dt><dd>{problem.language ?? "언어 해당 없음"}</dd></div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
