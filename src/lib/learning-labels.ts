export const reviewLabels = { NOT_REVIEWED: "미복습", REVIEWING: "복습 중", MASTERED: "복습 완료" } as const;
export type ReviewStatus = keyof typeof reviewLabels;
export const weaknessLevels = ["FOCUS", "WEAK", "CAUTION", "GOOD", "INSUFFICIENT_DATA"] as const;
export const weaknessLabels = { FOCUS: "집중 복습", WEAK: "취약", CAUTION: "주의", GOOD: "양호", INSUFFICIENT_DATA: "데이터 부족" } as const;
export const sourceLabels: Record<string, string> = {
  RESTORED_EXAM: "복원 기출", JUNGSIL_PREDICTED: "정실이 예상", SAMPLE: "샘플", MANUAL: "직접 등록",
  GAMJA_REFERENCE: "감자 참고", MOONEO_REFERENCE: "문어 참고",
};
