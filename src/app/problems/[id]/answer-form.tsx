"use client";

import Link from "next/link";
import { scholarVoice } from "@/lib/scholar-voice";
import { useRef, useState, type FormEvent } from "react";
import type { gradeParts } from "@/lib/answer-parts";
import type { Problem } from "@/db/schema";
import { reviewLabels, type ReviewStatus } from "@/lib/learning-labels";

type Result = {
  correct: boolean;
  results?: ReturnType<typeof gradeParts>;
  correctParts?: number;
  totalParts?: number;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  consecutiveCorrectCount?: number;
  reviewStatus?: ReviewStatus;
};

export default function AnswerForm({ problemId, questionType, answerParts, retry = false, examHref, nextHref, nextLabel }: {
  problemId: string;
  retry?: boolean;
  examHref?: string;
  nextHref?: string;
  nextLabel?: string;
  answerParts?: { key: string; label?: string }[] | null;
  questionType: Problem["questionType"];
}) {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const startedAt = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (answerParts?.length ? answerParts.some(part => !userAnswers[part.key]?.trim()) : !userAnswer.trim()) {
      setError("답안을 입력해 주세요.");
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const response = await fetch(`/api/problems/${encodeURIComponent(problemId)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(answerParts?.length ? { userAnswers } : { userAnswer }), startedAt: startedAt.current, attemptContext: retry ? "WRONG_ANSWER_RETRY" : examHref ? "PAST_EXAM_SESSION" : "PRACTICE" }),
      });
      if (!response.ok) {
        setError(response.status === 404 ? "문제를 찾을 수 없습니다."
          : response.status === 400 ? "답안을 확인해 주세요. 10,000자 이내로 입력할 수 있습니다."
          : "답안을 채점하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setResult(await response.json());
    } catch {
      setError("서버에 연결하지 못했습니다. 입력한 답안을 확인하고 다시 제출해 주세요.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const field = {
    id: "user-answer",
    name: "userAnswer",
    value: userAnswer,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      startedAt.current ??= new Date().toISOString();
      setUserAnswer(event.target.value);
    },
    disabled: pending,
    required: true,
    maxLength: 10000,
    "aria-invalid": !!error,
    "aria-describedby": error ? "answer-error" : "answer-hint",
    className: "mt-3 w-full rounded-xl border border-zinc-300 bg-white p-4 font-mono text-sm leading-7 text-zinc-900 focus:outline-2 focus:outline-emerald-600 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100",
  };

  return (
    <section className="mt-8" aria-label="답안 입력 및 채점">
      {retry && <p className="mb-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">오답 재풀이 · 답안을 제출하면 정실이가 정답과 해설을 알려드리겠소.</p>}
      {result ? (
        <div>
          <h2 role="status" className={`text-2xl font-bold ${result.correct ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
            {result.correct ? "정답이오! 그렇소, 잘하였소!" : "오답이오. 괜찮소, 다시 도전하면 되오!"}
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">{result.correct ? "그대, 천재 아니오? 어찌 풀었는지까지 기억하면 금상첨화라오." : "틀린 대목을 알았으니 한 걸음 나아간 것이오. 정실이와 함께 짚어 봅시다."}</p>
          {retry && result.reviewStatus && <p className="mt-3" role="status">연속 재풀이 정답 {result.consecutiveCorrectCount}회 · {reviewLabels[result.reviewStatus]}</p>}
          {result.results && <div className="mt-5">
            <p>빈칸 정답 {result.correctParts} / {result.totalParts}</p>
            <ul className="mt-3 grid gap-3">{result.results.map(part => <li key={part.key} className="min-w-0 rounded-xl border border-zinc-300 p-4">
              <p className="font-semibold">{part.key} · {part.correct ? "정답" : "오답"}</p>
              <p className="mt-2 whitespace-pre-wrap break-words">내 답: {part.userAnswer}</p>
              <p className="whitespace-pre-wrap break-words">정답: {part.correctAnswer}</p>
            </li>)}</ul>
          </div>}
          <dl className="mt-5 grid gap-5">
            {(result.results ? [["해설", result.explanation]] : [
              ["내가 제출한 답", result.userAnswer],
              ["정답", result.correctAnswer],
              ["해설", result.explanation],
            ]).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
                <dt className="font-semibold">{label === "해설" ? "정실이의 급제 해설" : label}</dt>
                {label === "해설" && <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">이 대목을 기억해 두시오. 풀이의 까닭을 함께 살펴봅시다!</p>}
                <dd className="mt-3 whitespace-pre-wrap break-words leading-7">{label === "해설" ? scholarVoice(value) : value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            {nextHref && <Link href={nextHref} className="rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900">{nextLabel}</Link>}
            <button type="button" onClick={() => {
              startedAt.current = null;
              setUserAnswer("");
              setUserAnswers({});
              setResult(null);
              setError("");
            }} className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">다시 풀기</button>
            <Link href={retry ? "/wrong-answers" : examHref ?? "/problems"} className="underline underline-offset-4">{retry ? "오답노트로 돌아가기" : examHref ? "회차 목록으로 돌아가기" : "문제 목록으로 돌아가기"}</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <h2 className="text-xl font-semibold">내 답안</h2>
          <p id="answer-hint" className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {answerParts?.length ? "모든 빈칸에 답을 적어 주시오." : questionType === "SHORT_ANSWER" ? "그대가 생각한 답을 적어 주시오." : "여러 줄로 적어도 좋소. 출력값과 행 순서를 살펴 주시오."}
          </p>
          {answerParts?.length ? <div className="grid gap-4">{answerParts.map((part, index) => <label key={part.key} className="min-w-0">
            <span className="mt-3 block">{part.key}{part.label && part.label !== part.key ? " · " + part.label : ""}</span>
            <input {...field} id={"answer-part-" + index} name={part.key} value={userAnswers[part.key] ?? ""} type="text" autoComplete="off"
              onChange={event => { startedAt.current ??= new Date().toISOString(); setUserAnswers(previous => ({ ...previous, [part.key]: event.target.value })); }} />
          </label>)}</div> : <label><span className="sr-only">내 답안</span>{questionType === "SHORT_ANSWER" ? <input {...field} type="text" autoComplete="off" /> : <textarea {...field} rows={6} />}</label>}
          {error && <p id="answer-error" role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p>}
          <button type="submit" disabled={pending} className="mt-4 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
            {pending ? "채점 중…" : "제출하기"}
          </button>
        </form>
      )}
    </section>
  );
}
