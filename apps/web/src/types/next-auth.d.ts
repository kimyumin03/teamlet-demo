import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      companyId: string | null;
      employeeId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    companyId?: string | null;
    employeeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    companyId?: string | null;
    employeeId?: string | null;
  }
}
