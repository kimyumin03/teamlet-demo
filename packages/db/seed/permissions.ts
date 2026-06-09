/**
 * 권한 카탈로그 시드 — assertPermission 으로 실제 검증되는 권한만 수록.
 *
 * 키 컨벤션: <category>.<domain>.<action>
 *
 * 총 24개 / 9개 카테고리 (Flex 구조 참고, 우리 구현 범위로 정제)
 * 미구현·미사용 키는 포함하지 않음:
 *   - 근태(attendance), 급여(payroll), 전자계약, 인사이트, 외부연동, 구독결제 → 제외
 *   - leave.type.* → leave.policy.manage 로 통합 (leave-type.ts 참조)
 *   - workflow.approval_policy.* → workflow.template.manage 로 통합
 *   - company.documents.* → 올바른 키는 document.company_archive.manage
 *   - member.appointment.*, member.hr_info.*, member.salary_contract.* → 미구현
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

function pair(
  category: string,
  domain: string,
  label: string,
  opts: {
    sensitivity?: PermissionSensitivity;
    hasScope?: boolean;
    warningText?: string;
    readDesc?: string;
    manageDesc?: string;
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
      description: opts.readDesc,
      sensitivity: opts.sensitivity ?? "NORMAL",
      hasScope: opts.hasScope ?? false,
    },
    {
      key: `${base}.manage`,
      category,
      domain,
      action: "MANAGE",
      name: `${label} 관리`,
      description: opts.manageDesc,
      sensitivity: opts.sensitivity ?? "NORMAL",
      hasScope: opts.hasScope ?? false,
      dependsOnPermissionKeys: [`${base}.read`],
      warningText: opts.warningText,
    },
  ];
}

function single(
  key: string,
  category: string,
  domain: string,
  action: PermissionAction,
  name: string,
  opts: Omit<PermissionSeed, "key" | "category" | "domain" | "action" | "name"> = {},
): PermissionSeed {
  return { key, category, domain, action, name, ...opts };
}

export const PERMISSION_CATALOG: PermissionSeed[] = [
  // ── 회사 기본 정보
  ...pair("company", "basic_info", "회사 기본 정보", {
    readDesc: "회사명·대표자·사업자번호·주소 등 기본 정보 조회",
    manageDesc: "회사 기본 정보 편집",
  }),

  // 공지·쉬는날은 전체 구성원 열람 공개이므로 manage 만 등록
  single("company.holidays.manage", "company", "holidays", "MANAGE", "쉬는 날 설정", {
    description: "공휴일·대체휴일·회사지정 쉬는 날 추가·수정·삭제",
  }),
  single("company.announcement.manage", "company", "announcement", "MANAGE", "공지사항 관리", {
    description: "공지사항 작성·수정·삭제 및 전체·부서 발송",
  }),

  // ── 구성원 (Core HR) — scope 필수 적용 영역
  ...pair("member", "directory", "구성원", {
    hasScope: true,
    readDesc: "구성원 목록·프로필·재직 정보·이력 조회",
    manageDesc: "구성원 등록·수정·퇴직 처리·조직 변경·초대·일괄 가져오기",
  }),

  // ── 휴가
  ...pair("leave", "policy", "연차·휴가 정책", {
    readDesc: "연차 정책·촉진 설정·맞춤 휴가 종류 조회",
    manageDesc: "연차 정책 설정·촉진 실행·맞춤 휴가 종류 생성·수정·삭제 (leave.type CRUD 포함)",
  }),
  ...pair("leave", "balance", "구성원 휴가", {
    hasScope: true,
    readDesc: "구성원 휴가 부여·사용 내역·잔여 조회",
    manageDesc: "휴가 신청 승인·반려·관리자 처리",
  }),
  single("leave.adjust.execute", "leave", "adjust", "EXECUTE", "휴가 직접 조정", {
    description: "관리자가 구성원 휴가 잔여일수를 직접 가감",
    sensitivity: "SENSITIVE",
    dependsOnPermissionKeys: ["leave.balance.read"],
  }),

  // ── 워크플로우
  ...pair("workflow", "template", "양식·승인 정책", {
    readDesc: "결재 양식·분류·승인 정책 조회",
    manageDesc: "결재 양식 생성·수정·삭제 및 승인 정책 설정 (approval_policy CRUD 포함)",
  }),

  // ── 채용 (P5 구현 완료 — assertPermission guard 존재)
  ...pair("recruit", "posting", "채용 공고"),
  ...pair("recruit", "candidate", "후보자", {
    sensitivity: "SENSITIVE",
    readDesc: "후보자 목록·지원서·면접 내역 조회",
    manageDesc: "후보자 등록·평가·상태 관리",
  }),

  // ── 문서·증명서
  // 회사 문서함 열람은 전체 구성원 공개 → manage 만 등록
  single("document.company_archive.manage", "document", "company_archive", "MANAGE", "회사 문서함 관리", {
    description: "취업규칙·사규 등 회사 공유 문서 업로드·수정·삭제",
  }),
  single("document.certificate.manage", "document", "certificate", "MANAGE", "증명서 관리", {
    description: "재직·경력 증명서 발급·재발급·내역 조회",
    sensitivity: "SENSITIVE",
  }),

  // ── 권한 그룹
  ...pair("permission", "role", "권한 그룹", {
    sensitivity: "CRITICAL",
    warningText: "권한 변경은 모든 구성원에게 영향을 줄 수 있어요",
    readDesc: "역할·권한 목록 조회",
    manageDesc: "역할 생성·수정·삭제·구성원 역할 배정",
  }),

  // ── 보안·인증 설정
  ...pair("settings", "company_security", "보안·인증 정책", {
    sensitivity: "CRITICAL",
    readDesc: "2FA 정책·IP 허용 목록·세션 만료 설정 조회",
    manageDesc: "2FA 강제·IP 허용 목록 관리·세션 만료 정책 변경",
  }),

  // ── 감사 로그
  single("audit.log.read", "audit", "log", "READ", "감사 로그 조회", {
    description: "구성원·권한·결재 변경 이력 열람 및 다운로드",
    sensitivity: "SENSITIVE",
  }),
];

/**
 * 시드 적용 — upsert(멱등) 후 카탈로그에서 제거된 권한·역할 매핑을 DB에서도 정리.
 * `pnpm db:seed` 재실행 시 dead 권한이 자동 삭제됨.
 */
export async function seedPermissions(
  prisma: import("../src/index").PrismaClient,
): Promise<number> {
  // 현행 카탈로그 upsert
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

  // 카탈로그에서 제거된 dead 권한 정리 (RolePermission cascade → Permission)
  const catalogKeys = PERMISSION_CATALOG.map((p) => p.key);
  const dead = await prisma.permission.findMany({
    where: { key: { notIn: catalogKeys } },
    select: { id: true },
  });
  if (dead.length > 0) {
    const deadIds = dead.map((p) => p.id);
    await prisma.rolePermission.deleteMany({ where: { permissionId: { in: deadIds } } });
    await prisma.permission.deleteMany({ where: { id: { in: deadIds } } });
  }

  return PERMISSION_CATALOG.length;
}
