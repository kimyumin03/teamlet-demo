/**
 * 시드 러너 — `pnpm db:seed` (docs/04 §5 첫 부팅 4번).
 * Phase 1 활성: 권한 카탈로그 (Permission 테이블).
 * Phase 3 대기: 공휴일 / 법정 휴가 (CompanyHoliday·LeaveType — 회사 캘린더 단위 주입).
 */
import { prisma } from "../src/index.js";
import { seedPermissions, PERMISSION_CATALOG } from "./permissions.js";
import { KR_STATUTORY_HOLIDAYS } from "./holidays-kr.js";
import { KR_STATUTORY_LEAVE_TYPES } from "./leave-types.js";

async function main() {
  console.log("🌱 Teamlet 시드 시작");

  const count = await seedPermissions(prisma);
  console.log(`  ✔ 권한 카탈로그 ${count}개 upsert (${PERMISSION_CATALOG.length} 정의)`);

  // Phase 3 데이터는 테이블 생성 후 회사 캘린더 단위로 주입 (현재는 검증만)
  console.log(
    `  ⏳ 공휴일 ${KR_STATUTORY_HOLIDAYS.length}종 / 법정휴가 ${KR_STATUTORY_LEAVE_TYPES.length}종 — Phase 3 대기 (데이터 정의 완료)`,
  );

  console.log("✅ 시드 완료");
}

main()
  .catch((e) => {
    console.error("❌ 시드 실패", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
