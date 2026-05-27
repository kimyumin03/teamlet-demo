import { auth } from "@/auth";
import { prisma } from "@teamlet/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.employeeId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const employeeId = session.user.employeeId;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      async function getCount() {
        return prisma.notification.count({
          where: { recipientEmployeeId: employeeId, isRead: false },
        });
      }

      // 최초 즉시 전송
      try {
        send({ unreadCount: await getCount() });
      } catch {
        controller.close();
        return;
      }

      // 15초마다 폴링
      const interval = setInterval(async () => {
        try {
          send({ unreadCount: await getCount() });
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 15_000);

      // 클라이언트 연결 해제 시 정리
      // ReadableStream cancel 콜백으로 처리
      return () => clearInterval(interval);
    },
    cancel() {
      // 클라이언트 disconnect 시 자동 호출
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
