import { PrismaClient } from "../packages/db/generated/client/index.js";
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

const docs = await prisma.formDocument.findMany({
  where: { kind: "LEAVE_REQUEST" },
  select: { id: true, title: true, formData: true, createdAt: true },
  orderBy: { createdAt: "desc" },
  take: 5,
});
console.log(`LEAVE_REQUEST 문서 ${docs.length}개`);
docs.forEach(d => {
  const fd = d.formData;
  console.log(`\n[${d.title}]`);
  console.log("  formData keys:", Object.keys(fd));
  if (fd.evidenceFileUrl) console.log("  evidenceFileUrl:", fd.evidenceFileUrl);
  else console.log("  evidenceFileUrl: 없음");
});

await prisma.$disconnect();
