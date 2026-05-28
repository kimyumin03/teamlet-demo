// Teamlet — Workflow (e-approval) page

const pageStyles_workflow = `
  .doc {
    display: grid; grid-template-columns: 100px 1fr 220px auto;
    gap: 16px; align-items: center;
    padding: 14px 18px;
    border: 1px solid var(--border); border-radius: 14px;
    background: var(--bg-primary); margin-bottom: 8px;
    cursor: pointer; position: relative;
    transition: border-color 120ms, box-shadow 120ms;
  }
  .doc:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
  .doc.urg::before {
    content: ""; position: absolute; left: -1px; top: 14px; bottom: 14px;
    width: 3px; background: var(--destructive); border-radius: 0 3px 3px 0;
  }
  .doc-kind { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
  .doc-kind .k {
    font-size: 10.5px; padding: 3px 8px; border-radius: 4px;
    background: var(--bg-tertiary); color: var(--fg-muted); font-weight: 600;
    font-family: "Inter", system-ui; letter-spacing: 0.04em; text-transform: uppercase;
  }
  .doc-kind .k.expense { background: var(--warn-50); color: var(--warn); }
  .doc-kind .k.leave { background: var(--success-50); color: var(--success); }
  .doc-kind .k.training { background: var(--purple-50); color: var(--purple); }
  .doc-kind .k.wfh { background: var(--info-50); color: var(--info); }
  .doc-kind .k.hr { background: var(--destructive-50); color: var(--destructive); }
  .doc-kind .d { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--fg-subtle); }
  .doc-body .t { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .doc-body .m { display: flex; gap: 10px; font-size: 12px; color: var(--fg-muted); align-items: center; flex-wrap: wrap; }
  .doc-body .m .who { display: inline-flex; gap: 6px; align-items: center; color: var(--fg); }
  .doc-body .m .who .av-mini {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--bg-tertiary); border: 1px solid var(--border);
    display: grid; place-items: center;
    font-family: "Inter", system-ui; font-size: 8.5px; font-weight: 600; color: var(--fg-muted);
  }
  .doc-body .m .who b { font-weight: 600; }
  .doc-body .m .sep { color: var(--fg-subtle); }
  .doc-body .m .amt { color: var(--fg); font-weight: 600; }

  .aline { display: flex; align-items: center; gap: 0; font-size: 11px; color: var(--fg-muted); flex-wrap: wrap; }
  .aline .step {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 9px; border: 1px solid var(--border); border-radius: 999px;
    background: var(--bg-primary); font-size: 10.5px; min-width: 0;
  }
  .aline .step::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--fg-subtle); flex-shrink: 0; }
  .aline .step.done::before { background: var(--success); }
  .aline .step.now { font-weight: 700; color: var(--fg); border-color: var(--primary); background: var(--primary-soft); }
  .aline .step.now::before { background: var(--primary); border-radius: 1px; width: 5px; height: 5px; }
  .aline .step.rej::before { background: var(--destructive); }
  .aline .arr { color: var(--fg-subtle); padding: 0 5px; font-size: 10px; }

  .doc-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
  .doc-due {
    font-family: "JetBrains Mono", monospace; font-size: 10.5px; font-weight: 600;
    padding: 4px 9px; border: 1px solid var(--border); border-radius: 5px;
    color: var(--fg-muted); background: var(--bg-primary); min-width: 56px; text-align: center;
  }
  .doc-due.urg { background: var(--destructive-50); border-color: var(--destructive); color: var(--destructive); }
  .doc-due.soon { background: var(--warn-50); border-color: var(--warn); color: var(--warn); }
  .doc-due.ok { background: var(--success-50); border-color: var(--success); color: var(--success); }
  .doc-due.rej { background: var(--destructive-50); border-color: var(--destructive); color: var(--destructive); }

  .sec-divider {
    display: flex; align-items: center; gap: 10px; margin: 18px 0 10px;
    font-size: 11.5px; color: var(--fg-muted);
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
  }
  .sec-divider .ct { background: var(--bg-tertiary); color: var(--fg); padding: 1px 8px; border-radius: 999px; font-family: "JetBrains Mono", monospace; font-size: 10px; }
  .sec-divider .line { flex: 1; height: 1px; background: var(--border); }
`;

function PageWorkflow() {
  const [tab, setTab] = React.useState("pending");
  return (
    <>
      <style>{pageStyles_workflow}</style>
      <main className="page-body">
        <div className="page-h">
          <div>
            <h1 className="h-title">워크플로우</h1>
            <div className="h-sub">오늘 처리 7건 · 평균 결재 소요 1.4일</div>
          </div>
          <div style={{display:"flex", gap:"8px"}}>
            <button className="btn btn-outline">템플릿 관리</button>
            <button className="btn btn-primary"><Icon name="plus"/>새 문서</button>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi cta"><span className="lbl">결재 대기 (내가 처리)</span><span className="val num">7<small>건</small></span><span className="delta">마감 임박 <b>3</b> · 일반 4</span></div>
          <div className="kpi"><span className="lbl">내가 요청한 진행 중</span><span className="val num">2<small>건</small></span><span className="delta">대기 단계 평균 <b>0.8일</b></span></div>
          <div className="kpi"><span className="lbl">이번 달 완료</span><span className="val num">34<small>건</small></span><span className="delta">승인 <b>32</b> · 반려 2</span></div>
          <div className="kpi"><span className="lbl">참조</span><span className="val num">11<small>건</small></span><span className="delta">읽지 않음 <b>4</b></span></div>
        </div>

        <div className="tabs">
          <button className={"tab"+(tab==="pending"?" active":"")} onClick={()=>setTab("pending")}>결재 대기 <span className="count">7</span></button>
          <button className={"tab"+(tab==="requested"?" active":"")} onClick={()=>setTab("requested")}>내가 요청한 <span className="count">14</span></button>
          <button className={"tab"+(tab==="completed"?" active":"")} onClick={()=>setTab("completed")}>완료·참조 <span className="count">62</span></button>
        </div>

        <div className="filters">
          <span className="chip"><span className="lbl">종류</span><span className="val">전체</span><span className="x">⌄</span></span>
          <span className="chip"><span className="lbl">기간</span><span className="val">최근 30일</span><span className="x">⌄</span></span>
          <span className="chip"><span className="lbl">신청자</span><span className="val">전체</span><span className="x">⌄</span></span>
          <span className="chip add">+ 필터</span>
          <span className="spread"><button className="btn btn-outline sm">일괄 승인 (선택)</button></span>
        </div>

        {tab === "pending" && <PendingList/>}
        {tab === "requested" && <RequestedList/>}
        {tab === "completed" && <CompletedList/>}
      </main>
    </>
  );
}

function PendingList() {
  return (
    <>
      <div className="sec-divider">
        <span>마감 임박</span><span className="ct">3</span><span className="line"></span>
      </div>
      <div className="doc urg">
        <div className="doc-kind"><span className="k leave">휴가 신청</span><span className="d">WF-2026-0421</span></div>
        <div className="doc-body">
          <div className="t">박지훈 · 연차 사용 (2일)</div>
          <div className="m">
            <span className="who"><span className="av-mini">지훈</span><b>박지훈</b></span>
            <span className="sep">·</span><span>5. 26 (월) ~ 5. 27 (화)</span>
            <span className="sep">·</span><span>신청 어제 16:24</span>
          </div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step now">팀장</span><span className="arr">›</span><span className="step">HR</span></div>
        <div className="doc-actions">
          <span className="doc-due urg">오늘 마감</span>
          <button className="btn btn-destructive sm">반려</button>
          <button className="btn btn-success sm">승인</button>
        </div>
      </div>
      <div className="doc urg">
        <div className="doc-kind"><span className="k expense">출장비 정산</span><span className="d">WF-2026-0418</span></div>
        <div className="doc-body">
          <div className="t">이서연 · 부산 출장비 정산 <span style={{color:"var(--fg-muted)", fontWeight:500}}>(470,000원)</span></div>
          <div className="m">
            <span className="who"><span className="av-mini">서연</span><b>이서연</b></span>
            <span className="sep">·</span><span>5. 19 ~ 5. 20 · 영수증 8</span>
            <span className="sep">·</span><span className="amt">470,000원</span>
          </div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step done">팀장</span><span className="arr">›</span><span className="step now">재무</span></div>
        <div className="doc-actions">
          <span className="doc-due urg">D-1</span>
          <button className="btn btn-destructive sm">반려</button>
          <button className="btn btn-success sm">승인</button>
        </div>
      </div>
      <div className="doc urg">
        <div className="doc-kind"><span className="k hr">인사평가</span><span className="d">WF-2026-0415</span></div>
        <div className="doc-body">
          <div className="t">2026 Q2 인사평가 1차 리뷰 작성</div>
          <div className="m">
            <span className="who"><span className="av-mini">HR</span><b>HR팀</b> 요청</span>
            <span className="sep">·</span><span>평가 대상 6명 · 진행 2 / 6</span>
          </div>
        </div>
        <div className="aline"><span className="step done">요청</span><span className="arr">›</span><span className="step now">평가자</span></div>
        <div className="doc-actions">
          <span className="doc-due urg">D-1</span>
          <button className="btn btn-primary sm">작성 시작 →</button>
        </div>
      </div>

      <div className="sec-divider">
        <span>이번 주</span><span className="ct">4</span><span className="line"></span>
      </div>
      <div className="doc">
        <div className="doc-kind"><span className="k training">외부 교육</span><span className="d">WF-2026-0412</span></div>
        <div className="doc-body">
          <div className="t">디자인팀 · UX 컨퍼런스 참가</div>
          <div className="m">
            <span className="who"><span className="av-mini">혜진</span><b>박혜진</b></span>
            <span className="sep">·</span><span>6. 12 ~ 13 (서울)</span>
            <span className="sep">·</span><span className="amt">280,000원</span>
          </div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step now">팀장</span><span className="arr">›</span><span className="step">HR</span><span className="arr">›</span><span className="step">재무</span></div>
        <div className="doc-actions">
          <span className="doc-due soon">D-4</span>
          <button className="btn btn-destructive sm">반려</button>
          <button className="btn btn-success sm">승인</button>
        </div>
      </div>
      <div className="doc">
        <div className="doc-kind"><span className="k wfh">재택 근무</span><span className="d">WF-2026-0410</span></div>
        <div className="doc-body">
          <div className="t">최민재 · 재택근무 신청 (1일)</div>
          <div className="m">
            <span className="who"><span className="av-mini">민재</span><b>최민재</b></span>
            <span className="sep">·</span><span>5. 28 (목)</span>
            <span className="sep">·</span><span>사유: 어린이집 행사</span>
          </div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step now">팀장</span></div>
        <div className="doc-actions">
          <span className="doc-due soon">D-4</span>
          <button className="btn btn-destructive sm">반려</button>
          <button className="btn btn-success sm">승인</button>
        </div>
      </div>
      <div className="doc">
        <div className="doc-kind"><span className="k expense">구매 요청</span><span className="d">WF-2026-0408</span></div>
        <div className="doc-body">
          <div className="t">개발팀 · 신규 도서 구매 (3건)</div>
          <div className="m">
            <span className="who"><span className="av-mini">도현</span><b>김도현</b></span>
            <span className="sep">·</span><span>도서 3종</span>
            <span className="sep">·</span><span className="amt">96,000원</span>
          </div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step now">팀장</span><span className="arr">›</span><span className="step">재무</span></div>
        <div className="doc-actions">
          <span className="doc-due soon">D-5</span>
          <button className="btn btn-destructive sm">반려</button>
          <button className="btn btn-success sm">승인</button>
        </div>
      </div>
    </>
  );
}

function RequestedList() {
  return (
    <>
      <div className="doc">
        <div className="doc-kind"><span className="k leave">휴가 신청</span><span className="d">WF-2026-0420</span></div>
        <div className="doc-body">
          <div className="t">반차 신청 — 5. 22 (금) 오후</div>
          <div className="m"><span>오늘 09:12 작성</span><span className="sep">·</span><span>현재 단계: 송재희 (HR)</span></div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step now">HR</span></div>
        <div className="doc-actions"><button className="btn btn-outline sm">회수</button><button className="btn btn-outline sm">상세 →</button></div>
      </div>
      <div className="doc">
        <div className="doc-kind"><span className="k expense">출장비 정산</span><span className="d">WF-2026-0388</span></div>
        <div className="doc-body">
          <div className="t">서울 → 부산 출장비 정산</div>
          <div className="m"><span>3일 전 작성</span><span className="sep">·</span><span className="amt">312,500원</span><span className="sep">·</span><span>현재 단계: 재무</span></div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step done">팀장</span><span className="arr">›</span><span className="step now">재무</span></div>
        <div className="doc-actions"><button className="btn btn-outline sm">회수</button><button className="btn btn-outline sm">상세 →</button></div>
      </div>
    </>
  );
}

function CompletedList() {
  return (
    <>
      <div className="doc">
        <div className="doc-kind"><span className="k leave">휴가 신청</span><span className="d">WF-2026-0397</span></div>
        <div className="doc-body">
          <div className="t">연차 신청 — 5. 14 (수)</div>
          <div className="m"><span className="who"><span className="av-mini">헌규</span><b>함헌규</b></span><span className="sep">·</span><span>완료 5. 9</span></div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step done">팀장</span><span className="arr">›</span><span className="step done">HR</span></div>
        <div className="doc-actions"><span className="doc-due ok">승인</span><button className="btn btn-outline sm">상세 →</button></div>
      </div>
      <div className="doc">
        <div className="doc-kind"><span className="k expense">출장비 정산</span><span className="d">WF-2026-0381</span></div>
        <div className="doc-body">
          <div className="t">대전 출장비 — 영수증 누락</div>
          <div className="m"><span className="who"><span className="av-mini">도현</span><b>김도현</b></span><span className="sep">·</span><span>반려 5. 6</span><span className="sep">·</span><span>영수증 2건 미첨부</span></div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step rej">팀장</span></div>
        <div className="doc-actions"><span className="doc-due rej">반려</span><button className="btn btn-outline sm">재작성</button></div>
      </div>
      <div className="doc">
        <div className="doc-kind"><span className="k wfh">재택 근무</span><span className="d">WF-2026-0376</span></div>
        <div className="doc-body">
          <div className="t">재택근무 (2일) — 5. 7 ~ 5. 8</div>
          <div className="m"><span className="who"><span className="av-mini">혜진</span><b>박혜진</b></span><span className="sep">·</span><span>완료 5. 6</span></div>
        </div>
        <div className="aline"><span className="step done">신청</span><span className="arr">›</span><span className="step done">팀장</span></div>
        <div className="doc-actions"><span className="doc-due ok">승인</span><button className="btn btn-outline sm">상세 →</button></div>
      </div>
    </>
  );
}

Object.assign(window, { PageWorkflow });
