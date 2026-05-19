import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
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
