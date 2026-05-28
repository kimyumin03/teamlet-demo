// Teamlet — Leave management (admin) page

const pageStyles_leave = `
  .work-lv { display: grid; grid-template-columns: minmax(0, 1fr) 360px; min-height: 0; }
  .sheet-col {
    background: var(--bg); border-left: 1px solid var(--border);
    padding: 24px;
  }
  .sht-hero {
    display: flex; align-items: flex-start; gap: 12px;
    padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 16px;
  }
  .sht-hero .who-block { flex: 1; }
  .sht-hero .who-block .n { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
  .sht-hero .who-block .m { font-size: 12px; color: var(--fg-muted); margin-top: 2px; }
  .sht-hero .close {
    width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border);
    background: var(--bg-primary); color: var(--fg-muted); display: grid; place-items: center; cursor: pointer;
  }
  .sht-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .sht-meta .m {
    padding: 10px 12px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 10px;
  }
  .sht-meta .m .l { font-size: 11px; color: var(--fg-muted); }
  .sht-meta .m .v { font-size: 16px; font-weight: 700; margin-top: 2px; }
  .sht-meta .m .v small { font-size: 11.5px; color: var(--fg-muted); font-weight: 500; margin-left: 4px; }
  .sht-meta .m .v.warn { color: var(--warn); }

  .sht-section { margin-bottom: 16px; }
  .sht-section h4 {
    margin: 0 0 8px; font-size: 11.5px; color: var(--fg-muted);
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
    display: flex; justify-content: space-between; align-items: center;
  }
  .sht-section h4 .link { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--fg-subtle); cursor: pointer; text-transform: none; letter-spacing: 0; font-weight: 500; }
  .sht-section h4 .link:hover { color: var(--primary); }
  .lvlist { display: flex; flex-direction: column; gap: 6px; }
  .lvlist .row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px;
  }
  .lvlist .row.na { background: var(--bg-secondary); border-style: dashed; }
  .lvlist .row .t { font-size: 13px; font-weight: 600; }
  .lvlist .row .s { font-size: 11px; color: var(--fg-muted); margin-top: 1px; }
  .lvlist .row .v { font-family: "JetBrains Mono", monospace; font-size: 13px; font-weight: 700; }
  .lvlist .row.na .v { color: var(--fg-subtle); font-weight: 500; }

  .ann { display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
  .ann .num-big { font-family: "JetBrains Mono", monospace; font-size: 14px; font-weight: 700; }
  .ann .num-big.warn { color: var(--warn); }
  .ann .of { font-family: "JetBrains Mono", monospace; font-size: 11.5px; color: var(--fg-muted); }
  .ann .bar { width: 64px; height: 5px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
  .ann .bar i { display: block; height: 100%; background: var(--primary); border-radius: 3px; }
  .ann .bar i.warn { background: var(--warn); }
  .ann .bar i.danger { background: var(--destructive); }

  .lvtypes { display: flex; gap: 4px; flex-wrap: wrap; }
  .lv-b {
    font-size: 10.5px; padding: 2px 7px; border-radius: 999px;
    font-family: "JetBrains Mono", monospace;
    background: var(--bg-tertiary); color: var(--fg-muted); font-weight: 600;
  }
  .lv-b.has { background: var(--bg-secondary); color: var(--fg); }
  .lv-b.na { background: transparent; color: var(--fg-subtle); border: 1px dashed var(--border); }
  .lv-more { font-size: 10.5px; color: var(--fg-muted); font-family: "JetBrains Mono", monospace; }
`;

function PageLeave() {
  const [tab, setTab] = React.useState("status");
  const [selected, setSelected] = React.useState(0);
  const rows = [
    { name: "박서연", role: "DESIGN · 디자이너", sn: "042", left: "0.5", total: "7.5", used: "7.0", pct: 88, severity: "danger", types: ["가족돌봄 1", "보건 1"], na: ["난임"], more: 3, st: "rej", stLabel: "7. 18 만료" },
    { name: "강수빈", role: "DESIGN · 디자이너", sn: "033", left: "3.0", total: "10", used: "7.0", pct: 70, severity: "warn", types: ["가족돌봄 1", "보건 1", "산전후 90"], more: 3, st: "wait", stLabel: "7. 18" },
    { name: "김세진", role: "ENG · 프론트엔드", sn: "027", left: "5.0", total: "8", used: "3.0", pct: 38, severity: "warn", types: ["가족돌봄 1", "배우자출산 20"], na: ["보건"], st: "run", stLabel: "진행 중" },
    { name: "김락윤", role: "AI", sn: "004", left: "12", total: "14", used: "2.0", pct: 14, severity: "ok", types: ["가족돌봄 1", "배우자출산 20"], na: ["보건"], st: "ok", stLabel: "정상" },
    { name: "고성현", role: "PM", sn: "5001", left: "13", total: "13", used: "0.0", pct: 0, severity: "ok", types: ["가족돌봄 1", "배우자출산 20"], na: ["보건"], st: "ok", stLabel: "정상" },
    { name: "박민영", role: "DESIGN · 디자이너", sn: "035", left: "8", total: "11", used: "3.0", pct: 27, severity: "ok", types: ["가족돌봄 1", "보건 1", "산전후 90"], more: 3, st: "ok", stLabel: "정상" },
    { name: "허원재", role: "ENG · 백엔드", sn: "013", left: "7", total: "11", used: "4.0", pct: 35, severity: "ok", types: ["군소집훈련 8h", "가족돌봄 1"], st: "ok", stLabel: "정상" },
  ];
  return (
    <>
      <style>{pageStyles_leave}</style>
      <div className="work-lv">
        <main className="page-body">
          <div className="page-h">
            <div>
              <h1 className="h-title">휴가 관리</h1>
              <div className="h-sub">전사 142명 · 평균 잔여 8.4일 · 소진 임박 11명</div>
            </div>
            <div style={{display:"flex", gap:"8px"}}>
              <button className="btn btn-outline">⬇ CSV</button>
              <button className="btn btn-primary"><Icon name="plus"/>휴가 부여</button>
            </div>
          </div>

          <div className="kpis">
            <div className="kpi"><span className="lbl">전사 평균 잔여</span><span className="val num">8.4<small>일</small></span><span className="delta">작년 동기 대비 <b>+0.7</b></span></div>
            <div className="kpi"><span className="lbl">소진 임박 (≤2)</span><span className="val num">11<small>명</small></span><span className="delta">촉진 필요 <b>4명</b></span></div>
            <div className="kpi"><span className="lbl">이번 달 사용</span><span className="val num">38<small>일</small></span><span className="delta">신청 <b>24건</b> · 대기 7</span></div>
            <div className="kpi cta"><span className="lbl">오늘 휴가 중</span><span className="val">4명</span><span className="delta">반차 2 · 종일 2</span></div>
          </div>

          <div className="tabs">
            <button className={"tab"+(tab==="status"?" active":"")} onClick={()=>setTab("status")}>현황</button>
            <button className={"tab"+(tab==="usage"?" active":"")} onClick={()=>setTab("usage")}>사용 내역 <span className="count">142</span></button>
            <button className={"tab"+(tab==="promote"?" active":"")} onClick={()=>setTab("promote")}>촉진 <span className="count">11</span></button>
          </div>

          {tab === "status" && (
            <>
              <div className="filters">
                <span className="chip"><span className="lbl">조직</span><span className="val">전사</span><span className="x">⌄</span></span>
                <span className="chip"><span className="lbl">재직 상태</span><span className="val">재직</span><span className="x">⌄</span></span>
                <span className="chip"><span className="lbl">정렬</span><span className="val">잔여 적은 순</span><span className="x">⌄</span></span>
                <span className="chip add">+ 필터</span>
                <span className="spread"><span className="chip">컬럼 6 / 18</span></span>
              </div>

              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{width:"24%"}}>이름</th>
                    <th>사번</th>
                    <th className="num">연차 잔여 / 부여</th>
                    <th className="num">사용</th>
                    <th>기타 휴가</th>
                    <th>소진 예정</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={selected === i ? "active" : ""} onClick={() => setSelected(i)}>
                      <td>
                        <div className="ppl">
                          <div className="av">{r.name.slice(-2)}</div>
                          <div><div className="n">{r.name}</div><div className="m">{r.role}</div></div>
                        </div>
                      </td>
                      <td className="sn">{r.sn}</td>
                      <td className="num">
                        <div className="ann">
                          <div className="bar"><i className={r.severity} style={{width: r.pct + "%"}}></i></div>
                          <span className={"num-big" + (r.severity === "danger" ? " warn" : "")}>{r.left}</span>
                          <span className="of">/ {r.total}</span>
                        </div>
                      </td>
                      <td className="num">{r.used}</td>
                      <td>
                        <div className="lvtypes">
                          {r.types.map((t, ti) => <span key={ti} className="lv-b has">{t}</span>)}
                          {r.na && r.na.map((t, ti) => <span key={"n"+ti} className="lv-b na">{t} ─</span>)}
                          {r.more && <span className="lv-more">+ {r.more}</span>}
                        </div>
                      </td>
                      <td><span className={"st " + r.st}>{r.stLabel}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{marginTop:"12px", display:"flex", justifyContent:"space-between", fontSize:"11px", color:"var(--fg-muted)", fontFamily:"JetBrains Mono, monospace"}}>
                <span>전체 142명 중 1–7 표시</span>
                <span>‹ 1 2 3 … 18 ›</span>
              </div>
            </>
          )}

          {tab === "usage" && (
            <div style={{padding:"60px 20px", textAlign:"center", color:"var(--fg-muted)", border:"1px dashed var(--border)", borderRadius:"14px"}}>
              <div style={{fontSize:"15px", fontWeight:600, color:"var(--fg)", marginBottom:"6px"}}>사용 내역</div>
              <div style={{fontSize:"12.5px"}}>날짜순 그룹화된 사용 로그 · 와이어프레임에서 확인 가능</div>
            </div>
          )}

          {tab === "promote" && (
            <PromoteQueue/>
          )}
        </main>

        <aside className="sheet-col">
          <div className="sht-hero">
            <div className="av lg">{rows[selected].name.slice(-2)}</div>
            <div className="who-block">
              <div className="n">{rows[selected].name}</div>
              <div className="m">{rows[selected].sn} · {rows[selected].role}</div>
            </div>
            <div className="close">×</div>
          </div>

          <div className="sht-meta">
            <div className="m">
              <div className="l">연차 잔여</div>
              <div className={"v" + (rows[selected].severity === "danger" ? " warn" : "")}>{rows[selected].left}<small>/ {rows[selected].total}일</small></div>
            </div>
            <div className="m">
              <div className="l">소멸 임박</div>
              <div className="v" style={{color: rows[selected].st === "rej" ? "var(--warn)" : "var(--fg)"}}>{rows[selected].stLabel}</div>
            </div>
          </div>

          <div className="sht-section">
            <h4>휴가 종류별 잔여 <span className="link">전체 정책 →</span></h4>
            <div className="lvlist">
              <div className="row"><div><div className="t">연차</div><div className="s">매년 부여 · 사용 {rows[selected].used} / {rows[selected].total}</div></div><div className="v">{rows[selected].left}일</div></div>
              {rows[selected].types.map((t, i) => (
                <div key={i} className="row">
                  <div><div className="t">{t.split(' ')[0]}</div><div className="s">신청 시 부여</div></div>
                  <div className="v">{t.split(' ').slice(1).join(' ')}</div>
                </div>
              ))}
              {rows[selected].na && rows[selected].na.map((t, i) => (
                <div key={i} className="row na">
                  <div><div className="t">{t}</div><div className="s">정책 미적용</div></div>
                  <div className="v">─</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"flex", gap:"6px"}}>
            <button className="btn btn-outline" style={{flex:1}}>연차 조정</button>
            <button className="btn btn-primary" style={{flex:1}}>+ 휴가 부여</button>
          </div>
        </aside>
      </div>
    </>
  );
}

function PromoteQueue() {
  const cols = [
    { label: "대기", ct: 4, items: [
      { nm: "박민영", info: "035 · 디자이너", d: "월차 1차 · 소멸 7. 14", due: "D-1", dueCls: "urgent" },
      { nm: "김수로", info: "002 · 백엔드", d: "월차 1차 · 소멸 8. 18", due: "D-6", dueCls: "soon" },
      { nm: "함헌규", info: "031 · 풀스택", d: "월차 2차 · 소멸 6. 20", due: "D-4", dueCls: "soon" },
      { nm: "박서연", info: "042 · 디자이너", d: "월차 1차 · 소멸 7. 18", due: "D-7", dueCls: "soon" },
    ]},
    { label: "진행 중", ct: 3, items: [
      { nm: "전민주", info: "005 · 프론트엔드", d: "월차 2차 · 작성 중", due: "진행", dueCls: "" },
      { nm: "고성현", info: "5001 · PM", d: "월차 2차 · 승인 대기", due: "진행", dueCls: "" },
      { nm: "김형주", info: "5002 · PM", d: "월차 2차 · 승인 대기", due: "진행", dueCls: "" },
    ]},
    { label: "완료", ct: 3, items: [
      { nm: "강수빈", info: "033 · 디자이너", d: "월차 1차 · 7. 18 소멸", due: "✓", dueCls: "" },
      { nm: "전민주", info: "005 · 프론트엔드", d: "월차 2차 · 5. 20 소멸", due: "✓", dueCls: "" },
      { nm: "송재희", info: "036 · HR", d: "월차 1차 · 5. 1 소멸", due: "✓", dueCls: "" },
    ]},
    { label: "종료", ct: 3, items: [
      { nm: "안승원", info: "5004", d: "월차 2차 · 작성 기간 지남", due: "만료", dueCls: "" },
      { nm: "송재희", info: "036 · HR", d: "월차 2차 · 사용자 취소", due: "취소", dueCls: "" },
      { nm: "김형주", info: "5002 · PM", d: "월차 2차 · 기간 지남", due: "만료", dueCls: "" },
    ]},
  ];
  return (
    <>
      <div className="kpi" style={{display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", marginBottom:"18px", padding:"14px 18px"}}>
        <div>
          <div className="lbl">관리자 큐</div>
          <div className="val" style={{fontSize:"20px"}}>내가 처리할 항목 <span className="num">4</span>건</div>
        </div>
        <div style={{display:"flex", gap:"8px"}}>
          <button className="btn btn-outline btn sm">촉진 설정</button>
          <button className="btn btn-primary btn sm">+ 사용 계획 요청</button>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"12px"}}>
        {cols.map((c, ci) => (
          <div key={ci} style={{background:"var(--bg-primary)", border:"1px solid var(--border)", borderRadius:"14px", padding:"12px"}}>
            <h5 style={{margin:"0 0 10px", fontSize:"11.5px", color:"var(--fg-muted)", textTransform:"uppercase", letterSpacing:"0.06em", display:"flex", justifyContent:"space-between", alignItems:"center", fontWeight:600}}>
              {c.label} <span className="tag">{c.ct}</span>
            </h5>
            {c.items.map((it, i) => (
              <div key={i} style={{padding:"10px 12px", background:"var(--bg-secondary)", borderRadius:"8px", marginBottom:"6px", display:"grid", gridTemplateColumns:"1fr auto", gap:"8px", alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"12.5px", fontWeight:600}}>{it.nm} <span style={{fontSize:"10.5px", color:"var(--fg-muted)", fontWeight:400, fontFamily:"JetBrains Mono, monospace", marginLeft:"3px"}}>{it.info}</span></div>
                  <div style={{fontSize:"11px", color:"var(--fg-muted)", fontFamily:"JetBrains Mono, monospace", marginTop:"3px"}}>{it.d}</div>
                </div>
                <span className={"due" + (it.dueCls ? " " + it.dueCls : "")}>{it.due}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

Object.assign(window, { PageLeave });
