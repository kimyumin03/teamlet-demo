import { z } from "zod";

/**
 * zod 스키마 — 인증 / 가입 흐름 (docs/06 Phase 1).
 * 비밀번호 정책: docs/03 §8 CompanyLoginPolicy 기본값 (min 8, 영문+숫자+특수 고정).
 */

const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 해요")
  .regex(/[a-zA-Z]/, "영문자를 포함해야 해요")
  .regex(/[0-9]/, "숫자를 포함해야 해요")
  .regex(/[^a-zA-Z0-9]/, "특수문자를 포함해야 해요");

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아니에요"),
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(2, "이름을 입력해 주세요").max(50),
    email: z.string().email("올바른 이메일 형식이 아니에요"),
    phone: z
      .string()
      .regex(/^01[016789]\d{7,8}$/, "휴대폰 번호 형식이 아니에요"),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "비밀번호가 일치하지 않아요",
    path: ["passwordConfirm"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

/** 회사코드로 가입 (docs/06 §1.2 join-company 옵션 2) */
export const joinByCodeSchema = z.object({
  companyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, "회사코드 형식은 XXXX-XXXX 예요"),
  memo: z.string().max(500).optional(),
});
export type JoinByCodeInput = z.infer<typeof joinByCodeSchema>;

/** 회사 등록 신청 (docs/06 §1.2 register-company / docs/03 §13 CompanyApplication) */
/** 역할 생성/수정 (docs/02 §11-1, docs/03 §7 Role). 시스템 역할은 시드 전용. */
export const roleCreateSchema = z.object({
  name: z.string().trim().min(2, "역할명은 2자 이상이어야 해요").max(50),
  description: z.string().max(500).optional(),
  icon: z.string().max(30).optional(),
});
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;

export const roleUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "역할명은 2자 이상이어야 해요")
    .max(50)
    .optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(30).optional(),
  isActive: z.boolean().optional(),
});
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;

/** 직원 추가 (docs/06 §2 구성원). companyEmail / employeeNumber / hireDate 은 빈 문자열 허용 — 모듈에서 null 변환. */
export const employeeCreateSchema = z.object({
  name: z.string().trim().min(2, "이름은 2자 이상이어야 해요").max(50),
  employeeNumber: z.string().trim().max(30).optional(),
  companyEmail: z.string().trim().max(254).optional(),
  hireDate: z.string().trim().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
});
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;

/** 직원 정보 수정 (docs/06 §2 구성원). 빈 문자열은 모듈에서 null 로 변환 — 필드 지우기 의미. name 만 필수. */
export const employeeUpdateSchema = z.object({
  name: z.string().trim().min(2, "이름은 2자 이상이어야 해요").max(50),
  employeeNumber: z.string().trim().max(30).optional(),
  companyEmail: z.string().trim().max(254).optional(),
  personalEmail: z.string().trim().max(254).optional(),
  phone: z.string().trim().max(20).optional(),
  birthDate: z.string().trim().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "DISPATCH"]).optional(),
  probationEndDate: z.string().trim().optional(),
  hireDate: z.string().trim().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
});
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

/** 직책 추가 (docs/03 §3 Position). isOrgHead 는 DYNAMIC_ORG_HEAD 평가용. */
export const positionCreateSchema = z.object({
  name: z.string().trim().min(1, "직책명을 입력해 주세요").max(50),
  isOrgHead: z.boolean().optional(),
});
export type PositionCreateInput = z.infer<typeof positionCreateSchema>;

/** 부서 추가 (docs/02 §3, docs/03 §3 Department). parentId 없으면 최상위. */
export const departmentCreateSchema = z.object({
  name: z.string().trim().min(1, "부서명을 입력해 주세요").max(50),
  parentId: z.string().optional(),
});
export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;

/** 부서 이름 변경. parentId 변경(이동)은 별도 단계. */
export const departmentUpdateSchema = z.object({
  name: z.string().trim().min(1, "부서명을 입력해 주세요").max(50),
});
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

/** 역할-권한 매핑 일괄 설정 (docs/02 §11-1, docs/03 §7 RolePermission). 전체 교체 패턴. */
export const setRolePermissionsSchema = z.object({
  items: z.array(
    z.object({
      permissionKey: z.string().min(1, "권한 키가 필요해요"),
      scopeType: z
        .enum(["ALL", "DEPARTMENT", "DIRECT_REPORTS", "SELF"])
        .nullable()
        .optional(),
      departmentIds: z.array(z.string()).optional(),
      includeSubDepartments: z.boolean().optional(),
    }),
  ),
});
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;

export const companyApplicationSchema = z.object({
  companyName: z.string().min(2, "회사명을 입력해 주세요").max(100),
  businessNumber: z
    .string()
    .regex(/^\d{3}-?\d{2}-?\d{5}$/, "사업자번호 형식이 아니에요"),
  representativeName: z.string().min(2, "대표자명을 입력해 주세요").max(50),
  contact: z
    .string()
    .regex(/^[\d-]{9,13}$/, "연락처 형식이 아니에요"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
  industry: z.string().min(1, "업종을 선택해 주세요").max(50),
  memo: z.string().max(1000).optional(),
});
export type CompanyApplicationInput = z.infer<typeof companyApplicationSchema>;
