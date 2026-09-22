"use client";

export default function ProblemError({ reset }: { reset: () => void }) {
  return <main className="mx-auto w-full max-w-3xl px-5 py-16">
    <h1 className="text-2xl font-bold">문제를 불러오지 못했습니다.</h1>
    <p className="mt-3">잠시 후 다시 시도해 주세요.</p>
    <button onClick={reset} className="mt-6 rounded-lg bg-emerald-700 px-5 py-3 text-white">다시 시도</button>
  </main>;
}
