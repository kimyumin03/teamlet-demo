import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const HOLIDAYS_MANAGE = "company.holidays.manage";

export type HolidayItem = {
  id: string;
  date: Date;
  name: string;
  isNational: boolean;
};

export async function listCompanyHolidays(
  actorEmployeeId: string,
  year?: number,
): Promise<Result<HolidayItem[]>> {
  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const targetYear = year ?? new Date().getFullYear();
  const start = new Date(`${targetYear}-01-01`);
  const end = new Date(`${targetYear + 1}-01-01`);

  const holidays = await prisma.companyHoliday.findMany({
    where: {
      companyId: emp.companyId,
      date: { gte: start, lt: end },
    },
    orderBy: { date: "asc" },
  });

  return ok(holidays.map((h) => ({ id: h.id, date: h.date, name: h.name, isNational: h.isNational })));
}

export async function addCompanyHoliday(
  actorEmployeeId: string,
  input: { date: string; name: string; isNational?: boolean },
): Promise<Result<{ id: string }>> {
  try {
    await assertPermission(actorEmployeeId, HOLIDAYS_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const dateVal = new Date(input.date);
  const existing = await prisma.companyHoliday.findUnique({
    where: { companyId_date: { companyId: emp.companyId, date: dateVal } },
  });
  if (existing) return err(errors.conflict("해당 날짜에 이미 공휴일이 등록돼 있어요"));

  const holiday = await prisma.companyHoliday.create({
    data: {
      companyId: emp.companyId,
      date: dateVal,
      name: input.name.trim(),
      isNational: input.isNational ?? false,
    },
  });

  return ok({ id: holiday.id });
}

/* ──────────────────────────────────────────────────────────
 * 법정공휴일 연도별 자동 등록 (공공데이터포털 특일정보 API)
 * 한국천문연구원 getRestDeInfo — 연도별 공식 법정공휴일(대체공휴일 포함).
 * ⚠️ 서비스키 필요: 환경변수 DATA_GO_KR_SERVICE_KEY (디코딩 키 권장).
 * ────────────────────────────────────────────────────────── */

const REST_DE_INFO_URL =
  "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

type RestDeItem = {
  dateKind?: string;
  dateName?: string;
  isHoliday?: string;
  locdate?: number | string;
  seq?: number;
};

/** locdate(YYYYMMDD) → "YYYY-MM-DD" */
function locdateToIso(locdate: number | string): string {
  const s = String(locdate);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** 특일정보 API에서 해당 연도의 법정공휴일(isHoliday=Y) 목록 조회 */
export async function fetchKoreanStatutoryHolidays(
  year: number,
): Promise<Result<{ date: string; name: string }[]>> {
  const rawKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!rawKey) {
    return err(
      errors.validation(
        "공공데이터포털 서비스키가 설정되지 않았어요. 환경변수 DATA_GO_KR_SERVICE_KEY 를 설정해 주세요.",
      ),
    );
  }
  // 이미 URL 인코딩된 키(%포함)면 그대로, 디코딩 키면 인코딩
  const keyParam = rawKey.includes("%") ? rawKey : encodeURIComponent(rawKey);

  const attemptMonth = async (month: number): Promise<RestDeItem[]> => {
    const params = new URLSearchParams({
      solYear: String(year),
      solMonth: String(month).padStart(2, "0"),
      numOfRows: "50",
      _type: "json",
    });
    // 명세 표기에 맞춰 대문자 ServiceKey 사용
    const url = `${REST_DE_INFO_URL}?${params.toString()}&ServiceKey=${keyParam}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      // 게이트웨이가 간헐적으로 401/5xx 를 반환 → 재시도 대상
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        response?: {
          header?: { resultCode?: string; resultMsg?: string };
          body?: { items?: "" | { item?: RestDeItem | RestDeItem[] } };
        };
      };
      const code = json.response?.header?.resultCode;
      if (code && code !== "00") {
        throw new Error(json.response?.header?.resultMsg ?? `API ${code}`);
      }
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

  try {
    const monthly = await Promise.all(
      Array.from({ length: 12 }, (_, i) => monthFetch(i + 1)),
    );
    const seen = new Set<string>();
    const result: { date: string; name: string }[] = [];
    for (const item of monthly.flat()) {
      if (item.isHoliday !== "Y" || item.locdate == null) continue;
      const date = locdateToIso(item.locdate);
      if (seen.has(date)) continue;
      seen.add(date);
      result.push({ date, name: (item.dateName ?? "공휴일").trim() });
    }
    result.sort((a, b) => a.date.localeCompare(b.date));
    return ok(result);
  } catch (e) {
    return err(
      errors.internal(
        `법정공휴일 조회에 실패했어요: ${e instanceof Error ? e.message : "알 수 없는 오류"}`,
      ),
    );
  }
}

/** 회사 캘린더에 해당 연도 법정공휴일을 자동 등록 (기존 날짜는 건너뜀) */
export async function syncStatutoryHolidays(
  actorEmployeeId: string,
  year: number,
): Promise<Result<{ added: number; skipped: number }>> {
  try {
    await assertPermission(actorEmployeeId, HOLIDAYS_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const fetched = await fetchKoreanStatutoryHolidays(year);
  if (!fetched.ok) return fetched;
  if (fetched.data.length === 0) {
    return ok({ added: 0, skipped: 0 });
  }

  // 기존 날짜(법정/회사 자율)는 건너뛰어 수기 등록분을 덮어쓰지 않음
  const created = await prisma.companyHoliday.createMany({
    data: fetched.data.map((h) => ({
      companyId: emp.companyId,
      date: new Date(h.date),
      name: h.name,
      isNational: true,
    })),
    skipDuplicates: true,
  });

  return ok({ added: created.count, skipped: fetched.data.length - created.count });
}

/** 여러 연도 법정공휴일 일괄 등록 (fromYear..toYear, 최대 10개 연도). */
export async function syncStatutoryHolidaysRange(
  actorEmployeeId: string,
  fromYear: number,
  toYear: number,
): Promise<Result<{ added: number; skipped: number; years: number }>> {
  const lo = Math.min(fromYear, toYear);
  const hi = Math.max(fromYear, toYear);
  if (hi - lo > 9) return err(errors.validation("한 번에 최대 10개 연도까지만 등록할 수 있어요"));

  let added = 0;
  let skipped = 0;
  for (let y = lo; y <= hi; y++) {
    const res = await syncStatutoryHolidays(actorEmployeeId, y);
    if (!res.ok) return res;
    added += res.data.added;
    skipped += res.data.skipped;
  }
  return ok({ added, skipped, years: hi - lo + 1 });
}

export async function deleteCompanyHoliday(
  actorEmployeeId: string,
  holidayId: string,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, HOLIDAYS_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const holiday = await prisma.companyHoliday.findFirst({
    where: { id: holidayId, companyId: emp.companyId },
  });
  if (!holiday) return err(errors.notFound("공휴일을 찾을 수 없어요"));

  await prisma.companyHoliday.delete({ where: { id: holidayId } });
  return ok(undefined);
}
