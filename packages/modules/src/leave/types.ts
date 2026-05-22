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
};

export type LeaveTypeItem = {
  id: string;
  name: string;
  key: string;
  grantAmount: number | null;
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
