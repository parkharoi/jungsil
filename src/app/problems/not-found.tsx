import Link from "next/link";

export default function ProblemNotFound() {
  return <main className="mx-auto w-full max-w-3xl px-5 py-16">
    <h1 className="text-2xl font-bold">문제를 찾을 수 없습니다.</h1>
    <Link href="/problems" className="mt-6 inline-block text-emerald-700 underline dark:text-emerald-400">문제 목록으로 돌아가기</Link>
  </main>;
}
