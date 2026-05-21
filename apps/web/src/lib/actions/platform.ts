"use server";

import {
  approveCompanyApplication,
  rejectCompanyApplication,
  type ApprovalResult,
} from "@teamlet/modules/tenancy";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import { requirePlatformAdmin } from "@/lib/platform-admin";

/** 회사 등록 신청 승인 — 플랫폼 관리자 전용 */
export async function approveApplicationAction(
  applicationId: string,
): Promise<ApiResponse<ApprovalResult>> {
  const admin = await requirePlatformAdmin();
  return toApiResponse(
    await approveCompanyApplication(applicationId, {
      approverUserId: admin.userId,
    }),
  );
}

/** 회사 등록 신청 반려 — 플랫폼 관리자 전용 */
export async function rejectApplicationAction(
  applicationId: string,
  reviewMemo?: string,
): Promise<ApiResponse<{ applicationId: string }>> {
  const admin = await requirePlatformAdmin();
  return toApiResponse(
    await rejectCompanyApplication(applicationId, {
      approverUserId: admin.userId,
      reviewMemo: reviewMemo?.trim() || null,
    }),
  );
}
