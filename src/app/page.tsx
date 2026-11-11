import Link from "next/link";
import ExamCards from "./exam-cards";
import ExamCountdown from "./exam-countdown";

export const dynamic = "force-dynamic";
export const metadata = { title: "정실이 | 오늘도 급제를 향해" };

export default function Home() {
  return <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">그대의 정보처리기사 실기 동행</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">반갑소, 오늘도 함께 달려봅시다.</h1>
    <ExamCountdown initialTime={new Date().toISOString()} />
    <ExamCards />
    <div className="grid gap-3 border-t border-zinc-200 pt-6 text-sm sm:grid-cols-3 dark:border-zinc-800">
      <Link className="rounded-xl bg-zinc-100 p-5 font-semibold hover:underline dark:bg-zinc-900" href="/problems?view=all">유형별 문제 연습 →</Link>
      <Link className="rounded-xl bg-zinc-100 p-5 font-semibold hover:underline dark:bg-zinc-900" href="/wrong-answers">틀린 문제 다시 보기 →</Link>
      <Link className="rounded-xl bg-zinc-100 p-5 font-semibold hover:underline dark:bg-zinc-900" href="/stats">나의 취약점 살펴보기 →</Link>
    </div>
  </main>;
}
