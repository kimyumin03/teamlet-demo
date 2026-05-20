import type { LeaveTxCategory, LeaveTxType } from "@teamlet/db";

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
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string;
};
