/**
 * 권한 카탈로그 시드 (docs/03 §7 — RBAC + Scope, ~70개 / 14 카테고리).
 * "조회(read) / 관리(manage)" 페어 패턴 + scope 옵션 + 민감도.
 * 우리 스코프 외(근태/급여/인사이트/단체보험/구독결제)는 제외.
 *
 * 키 컨벤션: <category>.<domain>.<action>  (action 생략 시 단일 권한)
 */

export type PermissionAction = "READ" | "MANAGE" | "EXECUTE";
export type PermissionSensitivity = "NORMAL" | "SENSITIVE" | "CRITICAL";

export type PermissionSeed = {
  key: string;
  category: string;
  domain: string;
  action: PermissionAction;
  name: string;
  description?: string;
  sensitivity?: PermissionSensitivity;
  hasScope?: boolean;
  dependsOnPermissionKeys?: string[];
  warningText?: string;
};

/** read/manage 페어 헬퍼 */
function pair(
  category: string,
  domain: string,
  label: string,
  opts: {
    sensitivity?: PermissionSensitivity;
    hasScope?: boolean;
    warningText?: string;
  } = {},
): PermissionSeed[] {
  const base = `${category}.${domain}`;
  return [
    {
      key: `${base}.read`,
      category,
      domain,
      action: "READ",
      name: `${label} 조회`,
      sensitivity: opts.sensitivity ?? "NORMAL",
      hasScope: opts.hasScope ?? false,
      warningText: opts.warningText,
    },
    {
      key: `${base}.manage`,
      category,
      domain,
      action: "MANAGE",
      name: `${label} 관리`,
      sensitivity: opts.sensitivity ?? "NORMAL",
      hasScope: opts.hasScope ?? false,
      dependsOnPermissionKeys: [`${base}.read`],
      warningText: opts.warningText,
    },
  ];
}

export const PERMISSION_CATALOG: PermissionSeed[] = [
  // ── 회사
  ...pair("company", "basic_info", "회사 기본 정보"),
  ...pair("company", "holidays", "쉬는 날"),
  ...pair("company", "documents", "회사 문서"),

  // ── 구성원 (Core HR) — scope 적용 핵심
  ...pair("member", "directory", "구성원", { hasScope: true }),
  ...pair("member", "personal_info", "구성원 개인정보", {
    hasScope: true,
    sensitivity: "SENSITIVE",
    warningText: "주민등록번호 등 고유식별정보 포함",
  }),
  ...pair("member", "hr_info", "구성원 인사정보", {
    hasScope: true,
    sensitivity: "SENSITIVE",
  }),
  ...pair("member", "salary_contract", "임금 계약", {
    hasScope: true,
    sensitivity: "CRITICAL",
    warningText: "급여 정보 — 최소 인원만 부여",
  }),
  ...pair("member", "appointment", "인사 발령", { hasScope: true }),
  {
    key: "member.bulk_import",
    category: "member",
    domain: "bulk",
    action: "EXECUTE",
    name: "구성원 일괄 가져오기",
    description: "CSV 업로드 / AxHub 동기화 (docs/03 §18)",
    sensitivity: "SENSITIVE",
  },
  {
    key: "member.bulk_export",
    category: "member",
    domain: "bulk",
    action: "EXECUTE",
    name: "구성원 일괄 내보내기",
    sensitivity: "SENSITIVE",
    warningText: "전체 구성원 정보 다운로드",
  },

  // ── 휴가
  ...pair("leave", "policy", "연차 정책"),
  ...pair("leave", "type", "맞춤 휴가"),
  ...pair("leave", "balance", "휴가 잔여", { hasScope: true }),
  {
    key: "leave.adjust.execute",
    category: "leave",
    domain: "adjust",
    action: "EXECUTE",
    name: "휴가 직접 조정",
    sensitivity: "SENSITIVE",
    dependsOnPermissionKeys: ["leave.balance.read"],
  },

  // ── 워크플로우
  ...pair("workflow", "document", "결재 문서", { hasScope: true }),
  ...pair("workflow", "template", "양식"),
  ...pair("workflow", "approval_policy", "승인 정책"),

  // ── 채용
  ...pair("recruit", "posting", "채용 공고"),
  ...pair("recruit", "candidate", "후보자", { sensitivity: "SENSITIVE" }),

  // ── 문서·증명서
  ...pair("document", "company_archive", "회사 문서함"),
  ...pair("document", "certificate", "증명서", { sensitivity: "SENSITIVE" }),

  // ── 설정 / 권한
  ...pair("permission", "role", "권한 그룹", {
    sensitivity: "CRITICAL",
    warningText: "권한 변경은 전사 영향",
  }),
  ...pair("settings", "company_security", "보안·인증 정책", {
    sensitivity: "CRITICAL",
  }),
  ...pair("settings", "login_policy", "로그인 정책"),

  // ── 감사 로그
  {
    key: "audit.log.read",
    category: "audit",
    domain: "log",
    action: "READ",
    name: "감사 로그 조회",
    sensitivity: "SENSITIVE",
  },

  // ── 멤버십 / 가입 (HR)
  {
    key: "tenancy.join_request.manage",
    category: "tenancy",
    domain: "join_request",
    action: "MANAGE",
    name: "직원 가입 요청 검토",
    description: "회사코드 가입 신청 승인/반려 (docs/06 §1.5)",
  },
  {
    key: "tenancy.invite.execute",
    category: "tenancy",
    domain: "invite",
    action: "EXECUTE",
    name: "구성원 초대",
  },

  // ── 외부 연동 (P2)
  {
    key: "integration.axhub.sync",
    category: "integration",
    domain: "axhub",
    action: "EXECUTE",
    name: "AxHub 동기화 설정·실행",
    description: "최고 관리자 (docs/03 §18)",
    sensitivity: "CRITICAL",
  },

  // ── 알림
  ...pair("notification", "policy", "알림 보존 정책"),
];

/** 시드 적용 — Permission upsert (멱등) */
export async function seedPermissions(
  prisma: import("../src/index").PrismaClient,
): Promise<number> {
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: {
        key: p.key,
        category: p.category,
        domain: p.domain,
        action: p.action,
        name: p.name,
        description: p.description ?? null,
        sensitivity: p.sensitivity ?? "NORMAL",
        hasScope: p.hasScope ?? false,
        dependsOnPermissionKeys: p.dependsOnPermissionKeys ?? [],
        warningText: p.warningText ?? null,
      },
      update: {
        category: p.category,
        domain: p.domain,
        action: p.action,
        name: p.name,
        description: p.description ?? null,
        sensitivity: p.sensitivity ?? "NORMAL",
        hasScope: p.hasScope ?? false,
        dependsOnPermissionKeys: p.dependsOnPermissionKeys ?? [],
        warningText: p.warningText ?? null,
      },
    });
  }
  return PERMISSION_CATALOG.length;
}
