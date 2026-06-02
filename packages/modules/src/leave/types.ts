import type { LeaveTxCategory, LeaveTxType, LeaveRequestStatus, LeavePromotionType, LeavePromotionStatus } from "@teamlet/db";

export type LeaveBalanceSummary = {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeKey: string;
  grantedDays: number;
  usedDays: number;
  adjustedDays: number;
  remainingDays: number;
};

export type GrantLeaveInput = {
  employeeId: string;
  leaveTypeId: string;
  days: number;
  category: LeaveTxCategory;
  reason?: string;
  note?: string;
};

export type RequestLeaveInput = {
  employeeId: string;
  leaveTypeId: string;
  /** 결재자 — undefined이면 즉시 자동 승인. 설정 시 FormDocument 결재 경유. */
  approverId?: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string;
  evidenceFileUrl?: string;
};

export type LeaveTypeItem = {
  id: string;
  name: string;
  key: string;
  grantAmount: number | null;
  grantMethod: string;
  grantUnit: string;
  paymentType: string;
  evidenceRequirement: string;
  approverEmployeeId: string | null;
  approverName: string | null;
};

export type PendingLeaveRequestItem = {
  id: string;
  employeeName: string;
  leaveTypeName: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  createdAt: Date;
};

export type LeaveRequestItem = {
  id: string;
  leaveTypeName: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewNote: string | null;
  createdAt: Date;
};

/** 연차 상세 — 월별 원장 한 행 (자동부여/소멸/사용/조정 + 누적 잔여). */
export type AnnualLeaveLedgerRow = {
  month: number; // 1-12
  granted: number; // 자동 부여 (GRANT)
  expired: number; // 소멸 (EXPIRE)
  used: number; // 사용 (USE)
  adjusted: number; // 조정 (ADJUST)
  remaining: number; // 해당 월말 누적 잔여
  isHireMonth: boolean;
  isCurrentMonth: boolean;
};

/** 연차 상세 탭 데이터 — 월별 원장 + 연간 요약. */
export type AnnualLeaveLedger = {
  year: number;
  hasAnnualType: boolean;
  rows: AnnualLeaveLedgerRow[];
  summary: { granted: number; expired: number; used: number; adjusted: number };
};

export type CompanyLeaveBalanceRow = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  departmentName: string | null;
  positionName: string | null;
  hireDate: Date | null;
  balances: {
    leaveTypeId: string;
    leaveTypeKey: string;
    leaveTypeName: string;
    grantedDays: number;
    usedDays: number;
    adjustedDays: number;
    remainingDays: number;
  }[];
};

export type MonthlyAnnualUsageRow = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  hireDate: Date | null;
  remainingDays: number;
  monthlyUsage: number[]; // 인덱스 0=1월 ~ 11=12월
};

export type CompanyLeaveRequestItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  createdAt: Date;
  formDocumentId: string | null;
};

export type LeavePromotionItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  departmentName: string | null;
  employmentStatus: string;
  year: number;
  promotionType: LeavePromotionType;
  targetDays: number;
  expiryDate: Date;
  status: LeavePromotionStatus;
  requestedAt: Date;
  submittedAt: Date | null;
  approvedAt: Date | null;
  planDates: Date[];
  formDocumentId: string | null;
};

/** 구성원 본인 — 내 휴가 > 연차 사용 계획 탭 */
export type MyLeavePromotionItem = {
  id: string;
  year: number;
  promotionType: LeavePromotionType;
  targetDays: number;
  expiryDate: Date;
  status: LeavePromotionStatus;
  requestedAt: Date;
  submittedAt: Date | null;
  planDates: Date[];
  formDocumentId: string | null;
  /** 작성 가능 여부 (작성요청됨/관리자작성기간) */
  canSubmit: boolean;
};

/** 연차 사용 계획 활동 로그 1줄 (teamlet[28]) */
export type LeavePlanActivityLog = {
  actorName: string;
  message: string;
  at: Date;
};

/** 연차 사용 계획 상세 (관리자 사이드 패널 / 본인 조회) */
export type LeavePromotionDetail = {
  id: string;
  employeeName: string;
  employeeNumber: string | null;
  year: number;
  promotionType: LeavePromotionType;
  targetDays: number;
  expiryDate: Date;
  status: LeavePromotionStatus;
  requestedAt: Date;
  submittedAt: Date | null;
  approvedAt: Date | null;
  planDates: Date[];
  formDocumentId: string | null;
  activityLog: LeavePlanActivityLog[];
  approval: { step: number; approverName: string; status: string }[];
};
