"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { Problem } from "@/db/schema";

type Result = {
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
};

export default function AnswerForm({ problemId, questionType }: {
  problemId: string;
  questionType: Problem["questionType"];
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (!userAnswer.trim()) {
      setError("답안을 입력해 주세요.");
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const response = await fetch(`/api/problems/${encodeURIComponent(problemId)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswer }),
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
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUserAnswer(event.target.value),
    disabled: pending,
    required: true,
    maxLength: 10000,
    "aria-invalid": !!error,
    "aria-describedby": error ? "answer-error" : "answer-hint",
    className: "mt-3 w-full rounded-xl border border-zinc-300 bg-white p-4 font-mono text-sm leading-7 text-zinc-900 focus:outline-2 focus:outline-emerald-600 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100",
  };

  return (
    <section className="mt-8" aria-label="답안 입력 및 채점">
      {result ? (
        <div>
          <h2 role="status" className={`text-2xl font-bold ${result.correct ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
            {result.correct ? "정답입니다." : "오답입니다."}
          </h2>
          <dl className="mt-5 grid gap-5">
            {[
              ["내가 제출한 답", result.userAnswer],
              ["정답", result.correctAnswer],
              ["해설", result.explanation],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-3 whitespace-pre-wrap break-words leading-7">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <button type="button" onClick={() => {
              setUserAnswer("");
              setResult(null);
              setError("");
            }} className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">다시 풀기</button>
            <Link href="/problems" className="underline underline-offset-4">문제 목록으로 돌아가기</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <label htmlFor="user-answer" className="text-xl font-semibold">내 답안</label>
          <p id="answer-hint" className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {questionType === "SHORT_ANSWER" ? "답을 직접 입력해 주세요." : "여러 줄로 입력할 수 있습니다. 출력 문제는 값과 행 순서를 맞춰 주세요."}
          </p>
          {questionType === "SHORT_ANSWER" ? <input {...field} type="text" autoComplete="off" /> : <textarea {...field} rows={6} />}
          {error && <p id="answer-error" role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p>}
          <button type="submit" disabled={pending} className="mt-4 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
            {pending ? "채점 중…" : "제출하기"}
          </button>
        </form>
      )}
    </section>
  );
}
