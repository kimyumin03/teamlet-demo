/**
 * 휴가 기본 시드 — 법정 필수(isRequired: true) + 회사 기본 제공(isRequired: false).
 * Flex 휴가 목록과 이름·부여방식·일수를 동일하게 맞춤.
 * bootstrapCompanyLeaveTypes에서 신규 회사 생성 시 전체 upsert.
 */

export type GrantMethod =
  | "ON_REQUEST"
  | "ON_OTHER_EXHAUSTED"
  | "MANUAL"
  | "ON_HIRE"
  | "PERIODIC"
  | "ON_TENURE";
export type GrantUnit = "MINUTE" | "HOUR" | "DAY" | "UNLIMITED";
export type PaymentType = "PAID" | "UNPAID" | "PARTIAL_PAID";
export type GenderRestriction = "ALL" | "MALE" | "FEMALE";
export type EvidenceRequirement = "NONE" | "BEFORE" | "AFTER";

export type LeaveTypeSeed = {
  key: string;
  name: string;
  description: string;
  isSystem: true;
  isRequired: boolean;
  grantMethod: GrantMethod;
  grantUnit: GrantUnit;
  grantAmount: number | null;
  paymentType: PaymentType;
  genderRestriction: GenderRestriction;
  evidenceRequirement: EvidenceRequirement;
  /** 한도 집계 주기 — "monthly_*" 면 월 한도(보건=월 1일), 그 외/미지정은 연 한도 */
  periodicCycle?: string | null;
  /** 일부 유급 일수 (PARTIAL_PAID — Flex 방식: 유급 인정 일수. 예 출산전후 60일, 난임 2일) */
  partialPayDays?: number;
  /** 휴가 기간에 휴일이 포함된 경우 휴일도 차감 (출산전후·유산사산 = true) */
  deductOnHoliday?: boolean;
};

// ── 법정 필수 (isRequired: true) ──────────────────────────────────────────────

export const KR_STATUTORY_LEAVE_TYPES: LeaveTypeSeed[] = [
  {
    key: "annual",
    name: "연차",
    description: "연차유급휴가 (정책 기반 자동 부여 — 입사 1년 미만 월차, 1년 이상 15일~25일)",
    isSystem: true,
    isRequired: true,
    grantMethod: "PERIODIC",
    grantUnit: "DAY",
    grantAmount: null,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "NONE",
  },
  {
    key: "family_care",
    name: "가족돌봄",
    description: "가족의 질병·사고·노령 또는 자녀 양육 사유 (연 최대 10일, 무급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 10,
    paymentType: "UNPAID",
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "military_training",
    name: "군소집훈련",
    description: "예비군·민방위 등 법정 소집 훈련 (소집 기간, 유급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: null,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "BEFORE",
  },
  {
    key: "infertility",
    name: "난임 치료",
    description: "난임 치료 시술 (남녀고용평등법 §18의3 — 연 6일, 최초 2일 유급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "PERIODIC",
    grantUnit: "DAY",
    grantAmount: 6,
    paymentType: "PARTIAL_PAID",
    partialPayDays: 2,
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "spouse_childbirth",
    name: "배우자출산",
    description: "배우자 출산 (남녀고용평등법 §18의2 — 20일 유급, 출산 후 120일 내 청구)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 20,
    paymentType: "PAID",
    genderRestriction: "MALE",
    evidenceRequirement: "AFTER",
  },
  {
    key: "menstrual",
    name: "보건",
    description: "여성 보건 (매월 1일 부여, 무급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "PERIODIC",
    grantUnit: "DAY",
    grantAmount: 1,
    paymentType: "UNPAID",
    genderRestriction: "FEMALE",
    evidenceRequirement: "NONE",
    periodicCycle: "monthly_from_hire", // 월 1일 한도
  },
  {
    key: "maternity_self",
    name: "산전후 - 본인",
    description: "출산 전후 휴가 (근로기준법 §74 — 총 90일, 출산 후 45일 이상 확보 / 최초 60일 유급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 90,
    paymentType: "PARTIAL_PAID",
    partialPayDays: 60,
    deductOnHoliday: true,
    genderRestriction: "FEMALE",
    evidenceRequirement: "BEFORE",
  },
  {
    key: "maternity_premature",
    name: "산전후 - 미숙아",
    description: "미숙아 출산 시 산전후 휴가 (근로기준법 §74 — 총 100일 / 최초 60일 유급, 2025.7 시행)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 100,
    paymentType: "PARTIAL_PAID",
    partialPayDays: 60,
    deductOnHoliday: true,
    genderRestriction: "FEMALE",
    evidenceRequirement: "BEFORE",
  },
  {
    key: "maternity_multiple",
    name: "산전후 - 본인 (다태아)",
    description: "다태아 출산 전후 휴가 (근로기준법 §74 — 총 120일, 출산 후 60일 이상 확보 / 최초 75일 유급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 120,
    paymentType: "PARTIAL_PAID",
    partialPayDays: 75,
    deductOnHoliday: true,
    genderRestriction: "FEMALE",
    evidenceRequirement: "BEFORE",
  },
  {
    key: "miscarriage",
    name: "유산·사산",
    description: "유산 또는 사산 시 (근로기준법 §74 — 임신 주수별 5~90일, 최초 60일 유급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: null,
    paymentType: "PARTIAL_PAID",
    partialPayDays: 60,
    deductOnHoliday: true,
    genderRestriction: "FEMALE",
    evidenceRequirement: "BEFORE",
  },
  {
    key: "miscarriage_multiple",
    name: "유산·사산 (다태아)",
    description: "다태아 임신 중 유산 또는 사산 시 (근로기준법 §74 — 임신 주수별, 최초 60일 유급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: null,
    paymentType: "PARTIAL_PAID",
    partialPayDays: 60,
    deductOnHoliday: true,
    genderRestriction: "FEMALE",
    evidenceRequirement: "BEFORE",
  },

  // ── 회사 기본 제공 (isRequired: false — 비활성화 및 삭제 가능) ────────────────

  {
    key: "compensatory",
    name: "보상",
    description: "연장·야간·휴일 근로 보상 (근로기준법 §57, 근로자대표 서면합의 / 통상 1.5배·휴일 8h초과 2배 시간 부여)",
    isSystem: true,
    isRequired: true,
    grantMethod: "MANUAL",
    grantUnit: "HOUR",
    grantAmount: null,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "NONE",
  },
  {
    key: "marriage_self",
    name: "결혼 - 본인",
    description: "본인 결혼 경조사 (5일, 유급)",
    isSystem: true,
    isRequired: false,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 5,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "marriage_child",
    name: "결혼 - 자녀",
    description: "자녀 결혼 경조사 (1일, 유급)",
    isSystem: true,
    isRequired: false,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 1,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "refresh",
    name: "리프레시",
    description: "장기 근속 리프레시 휴가 (근속 시 30일 부여, 유급)",
    isSystem: true,
    isRequired: false,
    grantMethod: "ON_TENURE",
    grantUnit: "DAY",
    grantAmount: 30,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "NONE",
  },
  {
    key: "sick_leave",
    name: "병가",
    description: "질병·부상 치료 (연차 소진 후 최대 60일 부여, 유급)",
    isSystem: true,
    isRequired: false,
    grantMethod: "ON_OTHER_EXHAUSTED",
    grantUnit: "DAY",
    grantAmount: 60,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "emergency",
    name: "비상",
    description: "긴급 개인 사유 (1일, 유급)",
    isSystem: true,
    isRequired: false,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 1,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "NONE",
  },
  {
    key: "bereavement_close",
    name: "조의 - 부모/배우자/자녀",
    description: "부모·배우자·자녀 사망 경조사 (5일, 유급)",
    isSystem: true,
    isRequired: false,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 5,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "bereavement_extended",
    name: "조의 - 조부모/형제/자매",
    description: "조부모·형제·자매 사망 경조사 (3일, 유급)",
    isSystem: true,
    isRequired: false,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 3,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "award",
    name: "포상",
    description: "포상 휴가 (관리자가 직접 부여)",
    isSystem: true,
    isRequired: false,
    grantMethod: "MANUAL",
    grantUnit: "DAY",
    grantAmount: null,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "NONE",
  },
];
