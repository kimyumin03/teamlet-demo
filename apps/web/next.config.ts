import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // 린트는 별도 CI 단계에서 수행 — 프로덕션 빌드/배포를 lint 규칙 drift 에 묶지 않음.
  // (타입체크는 유지 → 실제 타입 버그는 빌드에서 계속 차단)
  eslint: { ignoreDuringBuilds: true },
  // 모노레포 루트 고정 — standalone 파일 트레이싱이 사용자 홈까지 스캔하지 않도록
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // axhub 빌드 인스턴스 메모리 한계(~1-2GB) 대응 — webpack 빌드 피크 메모리 절감
  experimental: { webpackMemoryOptimizations: true },
  // Prisma: webpack 번들에서 제외 (엔진 동적 resolve 가 사용자 홈을 스캔하지 않도록)
  serverExternalPackages: ["@prisma/client", "@prisma/engines", "prisma"],
  // 워크스페이스 패키지는 소스로 직접 트랜스파일 (빌드 단계 불필요)
  transpilePackages: [
    "@teamlet/ui",
    "@teamlet/shared",
    "@teamlet/modules",
    "@teamlet/db",
  ],
  // typedRoutes: 라우트 표면이 안정화되는 Phase 2 에서 재도입.
};

export default nextConfig;
