// Teamlet — Admin (permissions + documents + automation)

const pageStyles_admin = `
  .app-admin { display: grid; grid-template-columns: 248px 220px 1fr; min-height: 100vh; background: var(--bg); }
  .snav {
    background: var(--bg-primary); border-right: 1px solid var(--border);
    padding: 18px 12px; height: 100vh; position: sticky; top: 0; overflow-y: auto;
  }
  .snav-group { margin-bottom: 18px; }
  .snav-h {
    font-size: 10.5px; color: var(--fg-subtle);
    text-transform: uppercase; letter-spacing: 0.08em;
    margin: 0 10px 6px; font-weight: 600;
    display: flex; align-items: center; gap: 6px;
  }
  .snav-h .admin-badge {
    font-family: "JetBrains Mono", monospace; font-size: 9px;
    background: var(--fg); color: var(--bg-primary); padding: 1px 5px; border-radius: 3px;
    letter-spacing: 0;
  }
  .snav a {
    display: block; padding: 7px 12px; border-radius: 7px;
    font-size: 12.5px; color: var(--fg-muted); text-decoration: none;
    line-height: 1.5;
  }
  .snav a:hover { background: var(--bg-secondary); color: var(--fg); }
  .snav a.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
  .snav a small { display: block; font-size: 10.5px; color: var(--fg-subtle); font-family: "JetBrains Mono", monospace; font-weight: 500; margin-top: 1px; }
  .snav a.active small { color: var(--primary); opacity: 0.7; }

  .perm-split { display: grid; grid-template-columns: 280px 1fr; gap: 18px; margin-top: 18px; }
  .pg-list {
    background: var(--bg-primary); border: 1px solid var(--border); border-radius: 14px;
    padding: 10px; height: fit-content;
  }
  .pg-list h5 {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 11px; color: var(--fg-muted);
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
    margin: 6px 8px 8px;
  }
  .pg-list .grp {
    display: grid; grid-template-columns: 32px 1fr auto; gap: 10px;
    padding: 10px; border-radius: 9px; cursor: pointer;
    align-items: center;
    transition: background 100ms;
  }
  .pg-list .grp:hover { background: var(--bg-secondary); }
  .pg-list .grp.active { background: var(--primary-soft); }
  .pg-list .grp .ic {
    width: 32px; height: 32px; border-radius: 8px;
    display: grid; place-items: center; font-size: 14px;
    background: var(--warn-50); color: var(--warn);
  }
  .pg-list .grp .nm { font-size: 13px; font-weight: 600; }
  .pg-list .grp .s { font-size: 11px; color: var(--fg-muted); margin-top: 1px; }
  .pg-list .grp .ct {
    font-family: "JetBrains Mono", monospace; font-size: 10.5px; color: var(--fg);
    background: var(--bg-tertiary); padding: 2px 7px; border-radius: 999px; font-weight: 600;
  }

  .pg-detail {
    background: var(--bg-primary); border: 1px solid var(--border); border-radius: 14px;
    overflow: hidden;
  }
  .pgd-hero {
    padding: 18px 22px; border-bottom: 1px solid var(--border);
    display: grid; grid-template-columns: 52px 1fr auto; gap: 14px; align-items: center;
  }
  .pgd-hero .ic {
    width: 52px; height: 52px; border-radius: 12px;
    background: var(--bg-secondary); color: var(--fg-muted);
    display: grid; place-items: center; font-size: 24px;
  }
  .pgd-hero h2 { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; margin: 0; display: flex; align-items: center; gap: 8px; }
  .pgd-hero .s { font-size: 12.5px; color: var(--fg-muted); margin-top: 4px; }

  .pgd-members { padding: 14px 22px; border-bottom: 1px solid var(--border); background: var(--bg-secondary); }
  .pgd-members h4 {
    font-size: 11px; color: var(--fg-muted); margin: 0 0 8px;
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
    display: flex; align-items: center; gap: 8px;
  }
  .pgd-members h4 .ct {
    font-family: "JetBrains Mono", monospace; font-size: 10px;
    background: var(--bg-tertiary); color: var(--fg); padding: 1px 7px; border-radius: 999px; font-weight: 600;
  }
  .mems { display: flex; gap: 6px; flex-wrap: wrap; }
  .mem-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px 4px 4px; border: 1px solid var(--border); border-radius: 999px;
    background: var(--bg-primary); font-size: 12px;
  }
  .mem-chip .av-c { width: 22px; height: 22px; border-radius: 50%; background: var(--bg-tertiary); display: grid; place-items: center; font-size: 9px; font-weight: 600; color: var(--fg-muted); border: 1px solid var(--border); }
  .mem-chip.add { border-style: dashed; color: var(--fg-muted); padding: 4px 12px; cursor: pointer; }

  .pcat {
    display: flex; gap: 0; padding: 0 22px;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  .pcat .t {
    padding: 12px 14px; font-size: 12.5px; color: var(--fg-muted);
    border-bottom: 2px solid transparent; cursor: pointer; font-weight: 500;
    margin-bottom: -1px; white-space: nowrap;
  }
  .pcat .t.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
  .pcat .t .ct {
    font-family: "JetBrains Mono", monospace; font-size: 10px;
    background: var(--bg-tertiary); color: var(--fg-muted);
    padding: 1px 6px; border-radius: 999px; margin-left: 6px; font-weight: 600;
  }

  .pm-row {
    display: grid; grid-template-columns: 1fr 80px 80px 80px 110px;
    align-items: center; padding: 14px 22px;
    border-bottom: 1px solid var(--border);
  }
  .pm-row.head {
    background: var(--bg-secondary);
    padding-top: 10px; padding-bottom: 10px;
    font-size: 10.5px; color: var(--fg-muted);
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
  }
  .pm-row.head .a { text-align: center; }
  .pm-row:last-child { border-bottom: none; }
  .pm-row .pm-name { font-size: 13px; font-weight: 600; }
  .pm-row .pm-desc { font-size: 11.5px; color: var(--fg-muted); margin-top: 3px; }
  .pm-row .pm-cell { text-align: center; }
  .pm-row .pm-scope { text-align: right; font-family: "JetBrains Mono", monospace; font-size: 11.5px; color: var(--fg); }

  .ck {
    display: inline-grid; place-items: center;
    width: 24px; height: 24px; border-radius: 7px;
    border: 1px solid var(--border); background: var(--bg-primary);
  }
  .ck.on { background: var(--primary); border-color: var(--primary); color: var(--primary-on); font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 12px; }
  .ck.off { color: var(--fg-subtle); background: var(--bg-secondary); }

  /* Automation cards */
  .auto-card {
    background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px;
    padding: 14px 18px; margin-bottom: 8px;
    display: grid; grid-template-columns: 36px 1fr auto; gap: 12px; align-items: center;
  }
  .auto-card.off { opacity: 0.7; }
  .tog {
    width: 32px; height: 18px; border-radius: 999px;
    background: var(--primary); position: relative; cursor: pointer;
    transition: background 120ms;
  }
  .tog::after { content: ""; position: absolute; right: 2px; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: white; transition: right 120ms; }
  .auto-card.off .tog { background: var(--border-strong); }
  .auto-card.off .tog::after { right: auto; left: 2px; background: var(--bg-primary); }
  .auto-card .desc { font-size: 13px; line-height: 1.5; }
  .auto-card .desc b { font-weight: 700; }
  .auto-card .desc .if {
    display: inline-flex; align-items: center; gap: 4px;
    background: var(--warn-50); color: var(--warn);
    padding: 2px 8px; border-radius: 5px; font-family: "JetBrains Mono", monospace; font-size: 11.5px;
    margin-right: 4px;
  }
  .auto-card .desc .then {
    display: inline-flex; align-items: center; gap: 4px;
    background: var(--success-50); color: var(--success);
    padding: 2px 8px; border-radius: 5px; font-family: "JetBrains Mono", monospace; font-size: 11.5px;
    margin: 0 4px;
  }
  .auto-card .meta { font-size: 11.5px; color: var(--fg-muted); margin-top: 4px; }
`;

function PageAdmin() {
  const [section, setSection] = React.useState("perm");
  return (
    <>
      <style>{pageStyles_admin}</style>
      <SettingsSubnav current={section} onPick={setSection} />
      <div className="main">
        <Topbar
          placeholder="권한, 그룹, 구성원 검색…"
          actions={
            <>
              <button className="btn btn-outline">감사 로그</button>
              <button className="btn btn-primary"><Icon name="plus"/>{section === "perm" ? "권한 그룹" : "문서 유형"}</button>
            </>
          }
        />
        <main className="page-body">
          {section === "perm" && <PermissionsView/>}
          {section === "docs" && <DocumentsView/>}
        </main>
      </div>
    </>
  );
}

function SettingsSubnav({ current, onPick }) {
  return (
    <nav className="snav">
      <div className="snav-group">
        <h4 className="snav-h">개인</h4>
        <a>프로필 <small>이름 · 연락처</small></a>
        <a>보안 <small>2FA · 세션</small></a>
        <a>알림 <small>이메일 · 슬랙</small></a>
      </div>
      <div className="snav-group">
        <h4 className="snav-h">회사</h4>
        <a>회사 정보 <small>대표 · 주소 · 로고</small></a>
        <a>공휴일 <small>한국 · 회사 자율</small></a>
        <a>조직 · 직책 <small>본부 · 팀 · 직급</small></a>
      </div>
      <div className="snav-group">
        <h4 className="snav-h">운영 <span className="admin-badge">ADMIN</span></h4>
        <a className={current === "perm" ? "active" : ""} onClick={(e) => { e.preventDefault(); onPick("perm"); }}>권한 그룹 <small>역할 · 범위</small></a>
        <a>휴가 정책 <small>종류 · 부여 규칙</small></a>
        <a>워크플로우 <small>결재선 · 템플릿</small></a>
        <a className={current === "docs" ? "active" : ""} onClick={(e) => { e.preventDefault(); onPick("docs"); }}>문서함 <small>유형 · 보관 · 자동</small></a>
        <a>감사 로그 <small>관리자 활동</small></a>
      </div>
    </nav>
  );
}

function PermissionsView() {
  const [active, setActive] = React.useState(2);
  const groups = [
    { ic: "👑", nm: "최고 관리자", s: "SYSTEM · 변경 불가", ct: 6, color: "#fbf5e3" },
    { ic: "★", nm: "조직장", s: "SYSTEM · 조직 범위", ct: 11, color: "#e5edf7" },
    { ic: "○", nm: "일반 구성원", s: "SYSTEM · 자동 부여", ct: 142, color: "var(--bg-tertiary)" },
    { ic: "🎨", nm: "디자인 팀 리뷰어", s: "전사 평가 작성", ct: 3, color: "#fbecec" },
    { ic: "$", nm: "재무 결재", s: "전사 비용 결재", ct: 2, color: "#e8f3ec" },
  ];
  return (
    <>
      <div className="page-h">
        <div>
          <h1 className="h-title">권한 그룹</h1>
          <div className="h-sub">시스템 3 + 커스텀 2 · 매핑 142 / 142명</div>
        </div>
        <div style={{display:"flex", gap:"6px"}}>
          <button className="btn btn-outline sm">충돌 검사</button>
          <button className="btn btn-outline sm">⬇ 권한 표 내보내기</button>
        </div>
      </div>

      <div className="perm-split">
        <aside className="pg-list">
          <h5>그룹 <button className="btn btn-outline xs">+ 추가</button></h5>
          {groups.slice(0, 3).map((g, i) => (
            <div key={i} className={"grp" + (active === i ? " active" : "")} onClick={() => setActive(i)}>
              <div className="ic" style={{background: g.color}}>{g.ic}</div>
              <div><div className="nm">{g.nm}</div><div className="s">{g.s}</div></div>
              <div className="ct">{g.ct}</div>
            </div>
          ))}
          <h5 style={{marginTop:"14px"}}>커스텀</h5>
          {groups.slice(3).map((g, i) => (
            <div key={i+3} className={"grp" + (active === i+3 ? " active" : "")} onClick={() => setActive(i+3)}>
              <div className="ic" style={{background: g.color}}>{g.ic}</div>
              <div><div className="nm">{g.nm}</div><div className="s">{g.s}</div></div>
              <div className="ct">{g.ct}</div>
            </div>
          ))}
        </aside>

        <section className="pg-detail">
          <div className="pgd-hero">
            <div className="ic" style={{background: groups[active].color}}>{groups[active].ic}</div>
            <div>
              <h2>{groups[active].nm} {active < 3 && <span className="tag primary">시스템</span>}</h2>
              <div className="s">{groups[active].s} · 모든 재직 구성원에게 자동 부여 · 본인 정보 · 본인 휴가 · 팀 공개 자료</div>
            </div>
            <button className="btn btn-outline sm">권한 표 보기</button>
          </div>

          <div className="pgd-members">
            <h4>적용 구성원 <span className="ct">{groups[active].ct}명{active === 2 ? " (전체 자동)" : ""}</span></h4>
            <div className="mems">
              {["김유민", "강수빈", "고성현", "김락윤", "김세진", "박서연", "박민영", "박혜진", "오정협"].map((n, i) => (
                <span key={i} className="mem-chip"><span className="av-c">{n.slice(-2)}</span>{n}</span>
              ))}
              <span className="mem-chip add">+ 135명 더</span>
            </div>
          </div>

          <div className="pcat">
            <div className="t active">회사 정보 <span className="ct">3</span></div>
            <div className="t">구성원 정보 <span className="ct">6</span></div>
            <div className="t">근무 <span className="ct">4</span></div>
            <div className="t">휴가 <span className="ct">5</span></div>
            <div className="t">워크플로우 <span className="ct">3</span></div>
            <div className="t">문서함 <span className="ct">4</span></div>
            <div className="t">자동 발송 <span className="ct">2</span></div>
          </div>

          <div>
            <div className="pm-row head">
              <div>권한</div>
              <div className="a">읽기</div>
              <div className="a">쓰기</div>
              <div className="a">승인</div>
              <div style={{textAlign:"right"}}>적용 범위</div>
            </div>
            <div className="pm-row">
              <div>
                <div className="pm-name">회사 기본 정보 조회</div>
                <div className="pm-desc">대표 · 주소 · 사업자번호</div>
              </div>
              <div className="pm-cell"><span className="ck on">✓</span></div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-scope">전사</div>
            </div>
            <div className="pm-row">
              <div>
                <div className="pm-name">회사 공지사항</div>
                <div className="pm-desc">홈 피드 공지 게시 · 반응</div>
              </div>
              <div className="pm-cell"><span className="ck on">✓</span></div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-scope">전사</div>
            </div>
            <div className="pm-row">
              <div>
                <div className="pm-name">조직도 · 구성원 명부</div>
                <div className="pm-desc">전사 구성원 목록 열람</div>
              </div>
              <div className="pm-cell"><span className="ck on">✓</span></div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-scope">전사 (공개 필드만)</div>
            </div>
            <div style={{background:"var(--bg-secondary)", padding:"10px 22px", fontSize:"10.5px", color:"var(--fg-muted)", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600, borderTop:"1px dashed var(--border)", borderBottom:"1px dashed var(--border)"}}>
              아래는 권한 없음 ─ 다른 그룹에서 부여됨
            </div>
            <div className="pm-row" style={{opacity:0.55}}>
              <div>
                <div className="pm-name">회사 정보 변경</div>
                <div className="pm-desc">대표·주소 등 변경 (최고 관리자)</div>
              </div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-cell"><span className="ck off">─</span></div>
              <div className="pm-scope">─</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function DocumentsView() {
  return (
    <>
      <div className="page-h">
        <div>
          <h1 className="h-title">문서함</h1>
          <div className="h-sub">유형 18 · 자동 수집 12 · 평균 보관 7년</div>
        </div>
        <div style={{display:"flex", gap:"6px"}}>
          <button className="btn btn-outline">⬇ 일괄 백업</button>
          <button className="btn btn-primary"><Icon name="plus"/>문서 유형</button>
        </div>
      </div>

      <h3 style={{margin:"18px 0 10px", fontSize:"15px", fontWeight:700}}>자동 발송 규칙</h3>
      <div style={{fontSize:"12.5px", color:"var(--fg-muted)", marginBottom:"12px"}}>이벤트 → 액션 · 활성 4 / 비활성 1</div>

      <div className="auto-card">
        <div className="tog"></div>
        <div>
          <div className="desc">
            <span className="if">입사일 D-7</span>
            <b>근로계약서</b>를
            <span className="then">신규 입사자 + HR</span>
            에게 발송
          </div>
          <div className="meta">매번 자동 · 마지막: 5. 19 (한도윤) · 다음: 5. 26</div>
        </div>
        <div style={{display:"flex", gap:"6px"}}>
          <button className="btn btn-outline xs">로그</button>
          <button className="btn btn-outline xs">편집</button>
        </div>
      </div>

      <div className="auto-card">
        <div className="tog"></div>
        <div>
          <div className="desc">
            <span className="if">매년 1. 2 09:00</span>
            <b>연봉계약서</b>를
            <span className="then">재직 전원</span>
            에게 발송 · 서명 요청
          </div>
          <div className="meta">마지막: 2026. 1. 2 · 142명 서명 완료 · 다음: 2027. 1. 2</div>
        </div>
        <div style={{display:"flex", gap:"6px"}}>
          <button className="btn btn-outline xs">로그</button>
          <button className="btn btn-outline xs">편집</button>
        </div>
      </div>

      <div className="auto-card">
        <div className="tog"></div>
        <div>
          <div className="desc">
            <span className="if">매년 2. 14</span>
            <b>원천징수영수증</b>을
            <span className="then">재직 전원</span>
            발급
          </div>
          <div className="meta">국세청 연동 · 자동 발급 · 다음: 2027. 2. 14</div>
        </div>
        <div style={{display:"flex", gap:"6px"}}>
          <button className="btn btn-outline xs">로그</button>
          <button className="btn btn-outline xs">편집</button>
        </div>
      </div>

      <div className="auto-card">
        <div className="tog"></div>
        <div>
          <div className="desc">
            <span className="if">퇴직 처리 시</span>
            <b>경력증명서</b> 발급 알림을
            <span className="then">퇴직자</span>
            에게 발송
          </div>
          <div className="meta">마지막: 5. 12 (이종민) · 다음: 트리거 대기</div>
        </div>
        <div style={{display:"flex", gap:"6px"}}>
          <button className="btn btn-outline xs">로그</button>
          <button className="btn btn-outline xs">편집</button>
        </div>
      </div>

      <div className="auto-card off">
        <div className="tog"></div>
        <div>
          <div className="desc">
            <span className="if">생일</span>
            <b>축하 메일</b>을
            <span className="then">생일자 + 매니저</span>
            발송
          </div>
          <div className="meta">비활성 · 슬랙 봇으로 대체</div>
        </div>
        <div style={{display:"flex", gap:"6px"}}>
          <button className="btn btn-outline xs">로그</button>
          <button className="btn btn-outline xs">편집</button>
        </div>
      </div>

      <button className="btn btn-outline sm" style={{marginTop:"10px"}}>+ 자동 발송 규칙 추가</button>
    </>
  );
}

Object.assign(window, { PageAdmin });
