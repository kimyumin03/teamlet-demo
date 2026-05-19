/**
 * 한국 법정 공휴일 시드 데이터 (docs/01 §7, docs/03 §12 CompanyHoliday).
 * ⚠️ CompanyHoliday 테이블은 Phase 3 — 현재는 타입드 데이터 모듈(상수)로 준비.
 *    Phase 3 휴가 모듈에서 seed runner 가 회사 캘린더에 주입.
 *
 * 음력 휴일은 lunarMonth/lunarDay 보관 → korean-lunar-calendar 로 연도별 양력 변환.
 * 노동절(근로자의 날)은 필수(삭제 불가) — docs/01 §7.
 */

export type HolidayType = "STATUTORY" | "CUSTOM" | "ONE_TIME";
export type SubstituteRule = "NONE" | "SUNDAY" | "SAT_SUN";

export type HolidaySeed = {
  key: string;
  name: string;
  type: HolidayType;
  /** true = 음력 (lunarMonth/lunarDay 사용) */
  isLunar: boolean;
  solarMonth?: number;
  solarDay?: number;
  lunarMonth?: number;
  lunarDay?: number;
  /** 다일 휴일 (설/추석 = 3일): 시작 오프셋 ~ 일수 */
  spanDays?: number;
  substituteRule: SubstituteRule;
  yearlyRecurring: boolean;
  /** 필수 = 삭제 불가 (노동절) */
  isRequired: boolean;
};

export const KR_STATUTORY_HOLIDAYS: HolidaySeed[] = [
  {
    key: "new_year",
    name: "신정",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 1,
    solarDay: 1,
    substituteRule: "NONE",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "seollal",
    name: "설날",
    type: "STATUTORY",
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 1,
    spanDays: 3, // 전날 ~ 다음날
    substituteRule: "SUNDAY",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "samiljeol",
    name: "삼일절",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 3,
    solarDay: 1,
    substituteRule: "SUNDAY",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "labor_day",
    name: "근로자의 날",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 5,
    solarDay: 1,
    substituteRule: "NONE",
    yearlyRecurring: true,
    isRequired: true, // 삭제 불가 (docs/01 §7)
  },
  {
    key: "childrens_day",
    name: "어린이날",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 5,
    solarDay: 5,
    substituteRule: "SAT_SUN",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "buddha_birthday",
    name: "부처님 오신 날",
    type: "STATUTORY",
    isLunar: true,
    lunarMonth: 4,
    lunarDay: 8,
    substituteRule: "SAT_SUN",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "memorial_day",
    name: "현충일",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 6,
    solarDay: 6,
    substituteRule: "NONE",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "liberation_day",
    name: "광복절",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 8,
    solarDay: 15,
    substituteRule: "SUNDAY",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "chuseok",
    name: "추석",
    type: "STATUTORY",
    isLunar: true,
    lunarMonth: 8,
    lunarDay: 15,
    spanDays: 3, // 전날 ~ 다음날
    substituteRule: "SUNDAY",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "gaecheonjeol",
    name: "개천절",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 10,
    solarDay: 3,
    substituteRule: "SUNDAY",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "hangeul_day",
    name: "한글날",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 10,
    solarDay: 9,
    substituteRule: "SUNDAY",
    yearlyRecurring: true,
    isRequired: false,
  },
  {
    key: "christmas",
    name: "기독탄신일",
    type: "STATUTORY",
    isLunar: false,
    solarMonth: 12,
    solarDay: 25,
    substituteRule: "SUNDAY",
    yearlyRecurring: true,
    isRequired: false,
  },
];
