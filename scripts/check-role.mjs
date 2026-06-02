import { PrismaClient } from "../packages/db/generated/client/index.js";
const p = new PrismaClient({ datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } } });
const role = await p.role.findFirst({ where: { name: "기본" }, select: { id: true, name: true, _count: { select: { userRoles: true } } } });
console.log("기본 역할:", role);
await p.$disconnect();
