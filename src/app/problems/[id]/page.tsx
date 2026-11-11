import Link from "next/link";
import AnswerForm from "./answer-form";
import { notFound } from "next/navigation";
import { difficultyLabels, findProblem, listExams, listExamProblems, questionTypeLabels } from "@/lib/problems";

export const dynamic = "force-dynamic";
export const metadata = { title: "문제 상세 | JungSil" };

export default async function ProblemPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const retry = query.mode === "retry";
  const { id } = await params;
  const problem = findProblem(id);
  if (!problem) notFound();
  const exam = !retry && query.exam === problem.examSetId ? listExams().find(exam => exam.id === problem.examSetId) : undefined;
  const questions = exam ? listExamProblems(exam.id) : [];
  const index = questions.findIndex(q => q.id === id);
  const next = questions[index + 1];
  const overview = exam ? `/exams/${encodeURIComponent(exam.id)}` : "/problems";
  const nextHref = exam && next ? `/problems/${encodeURIComponent(next.id)}?exam=${encodeURIComponent(exam.id)}` : overview;
  const safeSourceUrl = problem.sourceUrl && /^https?:\/\//i.test(problem.sourceUrl) ? problem.sourceUrl : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
      <Link href={overview} className="text-sm font-medium text-emerald-700 underline underline-offset-4 dark:text-emerald-400">← {exam ? `${exam.year}년 ${exam.round}회` : "문제 목록으로 돌아가기"}</Link>
      {exam && <div className="mt-6 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950"><p className="text-sm font-semibold">{exam.year}년 {exam.round}회 · {index + 1} / {questions.length}문제</p><progress aria-label="현재 문제 위치" className="mt-2 h-1.5 w-full accent-emerald-600" value={index + 1} max={questions.length} /></div>}
      <h1 className="mt-8 text-3xl font-bold leading-tight">{problem.title}</h1>
      <dl className="my-6 grid grid-cols-2 gap-4 rounded-xl bg-zinc-100 p-5 text-sm sm:grid-cols-4 dark:bg-zinc-900">
        {[
          ["문제 유형", questionTypeLabels[problem.questionType]],
          ["주제", problem.topic],
          ["난이도", difficultyLabels[problem.difficulty]],
          ["프로그래밍 언어", problem.language ?? "해당 없음"],
        ].map(([label, value]) => <div key={label}><dt className="text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}
      </dl>
      <section aria-labelledby="content-heading" className="mt-8">
        <h2 id="content-heading" className="text-xl font-semibold">문제</h2>
        <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-zinc-200 p-5 font-mono text-sm leading-7 dark:border-zinc-800">{problem.content}</pre>
        {problem.code && <pre aria-label="문제 코드" className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 p-5 font-mono text-sm leading-7 dark:border-zinc-800"><code>{problem.code}</code></pre>}
      </section>
      <AnswerForm key={problem.id + (retry ? ":retry" : ":practice")} problemId={problem.id} questionType={problem.questionType} answerParts={problem.answerParts} retry={retry} examHref={exam ? overview : undefined} nextHref={exam ? nextHref : undefined} nextLabel={next ? "다음 문제 →" : "회차 풀이 확인 →"} />
      <section aria-labelledby="source-heading" className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 id="source-heading" className="font-semibold">출처 정보</h2>
        <dl className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <div><dt className="inline">출처: </dt><dd className="inline">{problem.sourceName}</dd></div>
          <div><dt className="inline">출처 유형: </dt><dd className="inline">{problem.sourceType}</dd></div>
          <div><dt className="inline">연도 / 회차: </dt><dd className="inline">{problem.sourceYear ?? "해당 없음"} / {problem.sourceRound ?? "해당 없음"}</dd></div>
          <div><dt className="inline">출처 URL: </dt><dd className="inline">{safeSourceUrl ? <a href={safeSourceUrl} target="_blank" rel="noopener noreferrer" className="break-all underline">{safeSourceUrl}</a> : "없음"}</dd></div>
        </dl>
        {problem.sourceType === "SAMPLE" && <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">개발 검증을 위해 자체 제작한 문제입니다. 실제 시험 기출문제가 아닙니다.</p>}
      </section>
    </main>
  );
}
