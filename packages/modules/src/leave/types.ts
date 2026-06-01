import type { LeaveTxCategory, LeaveTxType, LeaveRequestStatus } from "@teamlet/db";

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
  /** 결재자 — 휴가 신청은 통합 결재 인프라(FormDocument)를 거친다. */
  approverId: string;
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
