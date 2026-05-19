/**
 * 법정 휴가 8종 시드 데이터 (docs/01 §7, docs/03 §4 LeaveType).
 * ⚠️ LeaveType 테이블은 Phase 3 — 현재는 타입드 데이터 모듈(상수)로 준비.
 *    is_system=true, is_required=true (필수 — 비활성화만 가능, 삭제 불가).
 *
 * grant_method=on_request (신청 시 부여), 일수는 법정 기준.
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
  isRequired: true;
  grantMethod: GrantMethod;
  grantUnit: GrantUnit;
  grantAmount: number | null; // UNLIMITED 시 null
  paymentType: PaymentType;
  genderRestriction: GenderRestriction;
  evidenceRequirement: EvidenceRequirement;
};

export const KR_STATUTORY_LEAVE_TYPES: LeaveTypeSeed[] = [
  {
    key: "family_care",
    name: "가족돌봄휴가",
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
    name: "군소집훈련휴가",
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
    name: "난임치료휴가",
    description: "난임 치료 시술 (연 6일, 최초 2일 유급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 6,
    paymentType: "PARTIAL_PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "spouse_childbirth",
    name: "배우자출산휴가",
    description: "배우자 출산 (20일, 유급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 20,
    paymentType: "PAID",
    genderRestriction: "ALL",
    evidenceRequirement: "AFTER",
  },
  {
    key: "menstrual",
    name: "보건휴가",
    description: "여성 보건 (월 1일, 무급)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 1,
    paymentType: "UNPAID",
    genderRestriction: "FEMALE",
    evidenceRequirement: "NONE",
  },
  {
    key: "compensatory",
    name: "보상휴가",
    description: "연장·야간·휴일 근로에 대한 보상 (근로자 대표 서면 합의)",
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
    key: "maternity_self",
    name: "산전후휴가(본인)",
    description: "출산 전후 휴가 (90일, 다태아 120일)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 90,
    paymentType: "PAID",
    genderRestriction: "FEMALE",
    evidenceRequirement: "BEFORE",
  },
  {
    key: "maternity_premature",
    name: "산전후휴가(미숙아)",
    description: "미숙아 출산 시 산전후 휴가 연장 (100일)",
    isSystem: true,
    isRequired: true,
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: 100,
    paymentType: "PAID",
    genderRestriction: "FEMALE",
    evidenceRequirement: "BEFORE",
  },
];
