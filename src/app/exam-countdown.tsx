"use client";

import { useEffect, useState } from "react";
import { examCountdown } from "@/lib/exam-countdown";

export default function ExamCountdown({ initialTime }: { initialTime: string }) {
  const [now, setNow] = useState(initialTime);
  useEffect(() => {
    const update = () => setNow(new Date().toISOString());
    const timer = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  const { days, progress } = examCountdown(new Date(now));
  return <section className="journey mt-8 overflow-hidden rounded-3xl border border-[#d9dec7] bg-[#f4f4e9] p-6 text-[#243d32] sm:p-9" aria-labelledby="journey-heading">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div><p className="text-xs font-bold tracking-widest text-[#647153]">정실이의 과거 급제 여정</p>
        <h2 id="journey-heading" className="mt-3 text-2xl font-bold sm:text-3xl">{days > 0 ? "합격의 그날까지, 한 걸음씩." : days === 0 ? "드디어 과거시험 날이오!" : "시험 보느라 수고했소!"}</h2>
        <p className="mt-3 text-sm text-[#59694e]">{days > 0 ? "오늘 푼 한 문제가 그대를 급제로 이끌 것이오." : days === 0 ? "갈고닦은 실력을 펼치고 오시오. 정실이가 응원하오!" : "달려온 그대에게 큰 박수를 보내오."}</p></div>
      <div className="rounded-2xl bg-[#244a3a] px-6 py-4 text-center text-white"><p className="text-xs text-[#d3dfc6]">정보처리기사 실기</p><p className="mt-1 font-mono text-4xl font-bold">{days > 0 ? `D-${days}` : days === 0 ? "D-DAY" : `D+${-days}`}</p><p className="mt-1 text-xs text-[#d3dfc6]">2026. 10. 25</p></div>
    </div>
    <div className="journey-scene mt-7" aria-hidden="true">
      <div className="journey-sun" /><div className="journey-mountain mountain-back" /><div className="journey-mountain mountain-front" />
      <span className="journey-cloud cloud-one">☁</span><span className="journey-cloud cloud-two">☁</span>
      <div className="journey-gate"><span>과거시험장</span><div className="gate-roof" /><div className="gate-pillars" /></div>
      <div className="journey-track"><div className="journey-trail" style={{ width: `${progress}%` }} /><div className={`scholar-position ${days <= 0 ? "arrived" : ""}`} style={{ left: `${progress}%` }}>
        <span className="scholar-name">정실이</span>
        <svg className="scholar" viewBox="0 0 100 120" width="80" height="96">
          <ellipse cx="50" cy="112" rx="27" ry="5" fill="#244a3a" opacity=".12" />
          <g className="scholar-leg leg-back"><path d="M49 88 L34 106 L23 105" fill="none" stroke="#384d45" strokeWidth="9" strokeLinecap="round" /></g>
          <g className="scholar-leg leg-front"><path d="M54 88 L67 105 L78 105" fill="none" stroke="#384d45" strokeWidth="9" strokeLinecap="round" /></g>
          <g className="scholar-body"><path d="M34 57 Q50 47 65 58 L77 91 Q51 101 27 91Z" fill="#56886e" stroke="#244a3a" strokeWidth="2" />
            <path d="M43 54 L53 70 L60 54" fill="#fff9df" /><path d="M51 68 L47 91 M51 68 L64 77" stroke="#fff9df" strokeWidth="4" />
            <path d="M35 63 L23 73 L15 65 M64 63 L75 55 L83 61" fill="none" stroke="#56886e" strokeWidth="11" strokeLinecap="round" />
            <circle cx="15" cy="65" r="5" fill="#efd0a4" /><circle cx="83" cy="61" r="5" fill="#efd0a4" />
            <rect x="74" y="39" width="12" height="23" rx="3" fill="#fff4d5" stroke="#9e8152" strokeWidth="2" transform="rotate(15 80 50)" />
            <circle cx="50" cy="39" r="20" fill="#f4d8b3" stroke="#244a3a" strokeWidth="2" />
            <circle cx="45" cy="39" r="2" fill="#243d32" /><circle cx="58" cy="39" r="2" fill="#243d32" />
            <path d="M48 47 Q53 51 58 46" fill="none" stroke="#9e5d4c" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="65" cy="45" rx="4" ry="2" fill="#eeb1a0" />
            <path d="M32 25 L36 7 Q50 1 64 7 L68 25" fill="#293d37" /><ellipse cx="50" cy="25" rx="34" ry="5" fill="#293d37" />
            <path d="M32 28 Q26 59 47 57" fill="none" stroke="#293d37" strokeWidth="1.5" />
          </g>
        </svg>
      </div></div>
    </div>
    <div className="mt-3 flex justify-between text-xs font-medium text-[#59694e]"><span>9.30 · 출발</span><span>10.25 · 과거시험</span></div>
    <p className="mt-4 text-center text-xs text-[#647153]">{days > 0 ? `시험까지 ${days}일 · 날짜가 가까워질수록 정실이가 시험장으로 다가가요.` : "정실이, 시험장 도착!"}</p>
  </section>;
}
