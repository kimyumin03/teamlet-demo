/**
 * 날짜 유틸 — 근속연수 / 시점 비교 (docs/04 §2 /shared/utils/date.ts).
 * 음력 변환은 korean-lunar-calendar 도입 시 확장 (Phase 3 휴가).
 */

/** 근속 연수 (소수점, 입사일 기준) */
export function tenureYears(hireDate: Date, at: Date = new Date()): number {
  const ms = at.getTime() - hireDate.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

/** 시점 기반 이력 조회 헬퍼: effective_date <= at < next_effective */
export function isEffectiveAt(
  effectiveDate: Date,
  nextEffective: Date | null,
  at: Date = new Date(),
): boolean {
  if (effectiveDate.getTime() > at.getTime()) return false;
  if (nextEffective === null) return true;
  return nextEffective.getTime() > at.getTime();
}

/** YYYY-MM-DD (KST 가정) */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 오늘 00:00 (적용일 기본값 — AppliedDateChip "적용일 오늘") */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
