/**
 * 데모/실회사 공휴일 시드 헬퍼.
 *  1순위: 공공데이터포털 특일정보 API (env DATA_GO_KR_SERVICE_KEY) — 음력·대체공휴일까지 정확.
 *  2순위: 양력 고정 공휴일 fallback (키 없음/네트워크 실패 시).
 *
 * db 패키지는 modules 에 의존하지 않으므로 fetch 로직을 자기완결적으로 둔다
 * (modules/tenancy/holiday.ts 의 fetchKoreanStatutoryHolidays 와 동일 사양).
 * 음력 공휴일(설·추석·부처님오신날)은 연도별 양력이 달라 정적 계산이 어려움 → API 로만 정확히 채운다.
 */
import type { PrismaClient } from "../generated/client/index.js";

const REST_DE_INFO_URL =
  "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

type RestDeItem = { dateName?: string; isHoliday?: string; locdate?: number | string };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** locdate(YYYYMMDD) → "YYYY-MM-DD" */
function locdateToIso(locdate: number | string): string {
  const s = String(locdate);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

// 양력 고정 공휴일 (연도 무관) — API 미연결 시 fallback.
const SOLAR_FIXED: Array<{ m: number; d: number; name: string }> = [
  { m: 1, d: 1, name: "신정" },
  { m: 3, d: 1, name: "삼일절" },
  { m: 5, d: 1, name: "근로자의 날" },
  { m: 5, d: 5, name: "어린이날" },
  { m: 6, d: 6, name: "현충일" },
  { m: 8, d: 15, name: "광복절" },
  { m: 10, d: 3, name: "개천절" },
  { m: 10, d: 9, name: "한글날" },
  { m: 12, d: 25, name: "기독탄신일" },
];

async function fetchYearHolidays(
  year: number,
  keyParam: string,
): Promise<{ date: string; name: string }[]> {
  const attemptMonth = async (month: number): Promise<RestDeItem[]> => {
    const params = new URLSearchParams({
      solYear: String(year),
      solMonth: pad(month),
      numOfRows: "50",
      _type: "json",
    });
    const url = `${REST_DE_INFO_URL}?${params.toString()}&ServiceKey=${keyParam}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        response?: {
          header?: { resultCode?: string };
          body?: { items?: "" | { item?: RestDeItem | RestDeItem[] } };
        };
      };
      const code = json.response?.header?.resultCode;
      if (code && code !== "00") throw new Error(`API ${code}`);
      const items = json.response?.body?.items;
      if (!items) return [];
      const item = items.item;
      if (!item) return [];
      return Array.isArray(item) ? item : [item];
    } finally {
      clearTimeout(timer);
    }
  };

  const monthFetch = async (month: number): Promise<RestDeItem[]> => {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await attemptMonth(month);
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
    throw lastErr;
  };

  const monthly = await Promise.all(
    Array.from({ length: 12 }, (_, i) => monthFetch(i + 1)),
  );
  const seen = new Set<string>();
  const out: { date: string; name: string }[] = [];
  for (const it of monthly.flat()) {
    if (it.isHoliday !== "Y" || it.locdate == null) continue;
    const date = locdateToIso(it.locdate);
    if (seen.has(date)) continue;
    seen.add(date);
    out.push({ date, name: (it.dateName ?? "공휴일").trim() });
  }
  return out;
}

/**
 * 회사 캘린더에 연도별 법정공휴일 시드 (skipDuplicates). API 우선, 실패 시 양력 fallback.
 * @returns 등록 건수와 출처
 */
export async function seedCompanyHolidays(
  prisma: PrismaClient,
  companyId: string,
  years: number[],
): Promise<{ added: number; source: "api" | "fallback" }> {
  const rawKey = process.env.DATA_GO_KR_SERVICE_KEY;
  let rows: { date: string; name: string }[] = [];
  let source: "api" | "fallback" = "fallback";

  if (rawKey) {
    try {
      const keyParam = rawKey.includes("%") ? rawKey : encodeURIComponent(rawKey);
      const all = await Promise.all(years.map((y) => fetchYearHolidays(y, keyParam)));
      rows = all.flat();
      if (rows.length > 0) source = "api";
    } catch {
      rows = [];
    }
  }

  if (rows.length === 0) {
    rows = years.flatMap((y) =>
      SOLAR_FIXED.map((h) => ({ date: `${y}-${pad(h.m)}-${pad(h.d)}`, name: h.name })),
    );
    source = "fallback";
  }

  const created = await prisma.companyHoliday.createMany({
    data: rows.map((h) => ({
      companyId,
      date: new Date(h.date),
      name: h.name,
      isNational: true,
    })),
    skipDuplicates: true,
  });
  return { added: created.count, source };
}
