// Teamlet — Members page

const pageStyles_members = `
  .vtog {
    display: inline-flex; padding: 3px; background: var(--bg-secondary);
    border-radius: 8px; gap: 2px;
  }
  .vtog .v {
    padding: 5px 12px; font-size: 12px; color: var(--fg-muted); border-radius: 6px;
    cursor: pointer; display: inline-flex; gap: 6px; align-items: center; font-weight: 500;
  }
  .vtog .v.active { background: var(--bg-primary); color: var(--fg); font-weight: 600; box-shadow: var(--shadow-sm); }
  .vtog .v svg { width: 13px; height: 13px; stroke: currentColor; stroke-width: 1.6; fill: none; }

  .cb-box { width: 16px; height: 16px; border: 1.5px solid var(--border-strong); border-radius: 4px; display: inline-block; vertical-align: middle; }
  .cb-box.on { background: var(--primary); border-color: var(--primary); position: relative; }
  .cb-box.on::after { content: ""; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: 1.5px solid var(--primary-on); border-top: 0; border-left: 0; transform: rotate(45deg); }
  .em { font-family: "JetBrains Mono", monospace; font-size: 12px; color: var(--fg-muted); }
  .role-cell .r { font-weight: 600; font-size: 13px; }
  .role-cell .o { font-size: 11.5px; color: var(--fg-muted); margin-top: 1px; }

  /* org chart */
  .orgchart {
    border: 1px solid var(--border); border-radius: 14px; background: var(--bg-primary);
    padding: 32px 24px; min-height: 340px;
  }
  .ot { display: flex; flex-direction: column; align-items: center; gap: 28px; }
  .ot .root, .ot .node {
    padding: 10px 16px; border: 1px solid var(--border); border-radius: 10px;
    background: var(--bg-primary); font-size: 13px; font-weight: 600;
    display: inline-flex; gap: 10px; align-items: center;
    box-shadow: var(--shadow-sm);
  }
  .ot .root { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  .ot .node { font-weight: 500; color: var(--fg); }
  .ot .ct { font-family: "JetBrains Mono", monospace; color: var(--fg-muted); font-size: 11px; padding: 2px 7px; background: var(--bg-secondary); border-radius: 999px; font-weight: 600; }
  .ot-level { display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; }
  .ot-branch { display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; }
  .ot-branch::before { content: ""; position: absolute; top: -20px; left: 50%; width: 1px; height: 20px; background: var(--border); }
  .ot-l2 { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .ot-l2 .node { background: var(--bg-secondary); }
`;

function PageMembers() {
  const [view, setView] = React.useState("list");
  const [selected, setSelected] = React.useState(0);
  const rows = [
    { name: "김유민", role: "Product", title: "프로덕트 매니저", sn: "001", email: "charles@jocodingax.ai", hire: "2026. 5. 18", emp: "정규", status: "work", perm: "admin", permLabel: "최고관리자" },
    { name: "강수빈", role: "Design", title: "시니어 디자이너", sn: "033", email: "subin@team.io", hire: "2025. 7. 18", emp: "정규", status: "work", perm: "purple", permLabel: "조직장" },
    { name: "고성현", role: "PM", title: "프로덕트 매니저", sn: "5001", email: "sh.ko@team.io", hire: "2025. 2. 19", emp: "정규", status: "work", perm: "", permLabel: "일반" },
    { name: "박서연", role: "Design", title: "디자이너", sn: "042", email: "sy.park@team.io", hire: "2026. 4. 22", emp: "수습", status: "work", perm: "", permLabel: "일반" },
    { name: "허원재", role: "Engineering", title: "백엔드 엔지니어", sn: "013", email: "wj.heo@team.io", hire: "2024. 11. 4", emp: "정규", status: "leave", perm: "", permLabel: "일반" },
    { name: "한도윤", role: "Design", title: "디자이너", sn: "044", email: "dy.han@team.io", hire: "2026. 5. 26", emp: "수습", status: "wait", perm: "", permLabel: "일반" },
    { name: "박민영", role: "Design", title: "디자이너", sn: "035", email: "my.park@team.io", hire: "2025. 7. 14", emp: "정규", status: "work", perm: "", permLabel: "일반" },
    { name: "오정협", role: "Engineering", title: "시니어 엔지니어", sn: "032", email: "jh.oh@team.io", hire: "2024. 5. 19", emp: "정규", status: "end", perm: "", permLabel: "일반" },
  ];
  return (
    <>
      <style>{pageStyles_members}</style>
      <main className="page-body">
        <div className="page-h">
          <div>
            <h1 className="h-title">구성원</h1>
            <div className="h-sub">전체 142명 · 재직 134 · 휴직 5 · 입사 예정 3</div>
          </div>
          <div className="vtog">
            <span className={"v" + (view === "list" ? " active" : "")} onClick={() => setView("list")}>
              <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>리스트
            </span>
            <span className={"v" + (view === "org" ? " active" : "")} onClick={() => setView("org")}>
              <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2h12v2"/></svg>조직도
            </span>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi"><span className="lbl">재직</span><span className="val num">134<small>명</small></span><span className="delta">정규 <b>118</b> · 계약 16</span></div>
          <div className="kpi"><span className="lbl">이번 달 입사</span><span className="val num">3<small>명</small></span><span className="delta">온보딩 완료 <b>1</b> / 3</span></div>
          <div className="kpi"><span className="lbl">휴직</span><span className="val num">5<small>명</small></span><span className="delta">육아 <b>3</b> · 질병 2</span></div>
          <div className="kpi"><span className="lbl">평가 미진행</span><span className="val num">8<small>명</small></span><span className="delta">2026 Q2 진행 <b>134/142</b></span></div>
        </div>

        {view === "list" ? (
          <>
            <div className="filters">
              <span className="chip"><span className="lbl">조직</span><span className="val">전사</span><span className="x">⌄</span></span>
              <span className="chip"><span className="lbl">재직 상태</span><span className="val">재직</span><span className="x">⌄</span></span>
              <span className="chip"><span className="lbl">근로유형</span><span className="val">전체</span><span className="x">⌄</span></span>
              <span className="chip add">+ 필터</span>
              <span className="spread">
                <span className="chip">컬럼 8 / 24</span>
                <button className="btn btn-outline sm"><Icon name="download"/>내보내기</button>
              </span>
            </div>

            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:"40px"}}><span className="cb-box"></span></th>
                  <th style={{width:"22%"}}>이름</th>
                  <th>사번</th>
                  <th>이메일</th>
                  <th>조직 · 직책</th>
                  <th>입사일</th>
                  <th>근로유형</th>
                  <th>상태</th>
                  <th>권한</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={selected === i ? "active" : ""} onClick={() => setSelected(i)}>
                    <td><span className={"cb-box" + (selected === i ? " on" : "")}></span></td>
                    <td>
                      <div className="ppl">
                        <div className="av">{r.name.slice(-2)}</div>
                        <div><div className="n">{r.name}</div><div className="m">{r.role}</div></div>
                      </div>
                    </td>
                    <td className="sn">{r.sn}</td>
                    <td className="em">{r.email}</td>
                    <td><div className="role-cell"><div className="r">{r.role}</div><div className="o">{r.title}</div></div></td>
                    <td className="sn">{r.hire}</td>
                    <td><span className="tag">{r.emp}</span></td>
                    <td><span className={"st " + r.status}>{r.status === "work" ? "재직" : r.status === "leave" ? "휴직" : r.status === "wait" ? "입사 예정" : "퇴직 예정"}</span></td>
                    <td><span className={"tag" + (r.perm ? " " + r.perm : "")}>{r.permLabel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{marginTop:"14px", display:"flex", justifyContent:"space-between", fontSize:"11.5px", color:"var(--fg-muted)", fontFamily:"JetBrains Mono, monospace"}}>
              <span>선택 1명 · 일괄 액션: 권한 변경 / 조직 이동 / 발령 / 비활성화</span>
              <span>‹ 1 2 3 … 18 ›</span>
            </div>
          </>
        ) : (
          <div className="orgchart">
            <div className="ot">
              <div className="root">팀렛 주식회사 <span className="ct">142명</span></div>
              <div className="ot-level">
                <div className="ot-branch">
                  <div className="node">프로덕트 본부 <span className="ct">42</span></div>
                  <div className="ot-l2">
                    <div className="node">디자인 <span className="ct">8</span></div>
                    <div className="node">PM <span className="ct">6</span></div>
                  </div>
                </div>
                <div className="ot-branch">
                  <div className="node">엔지니어링 본부 <span className="ct">68</span></div>
                  <div className="ot-l2">
                    <div className="node">프론트엔드 <span className="ct">14</span></div>
                    <div className="node">백엔드 <span className="ct">21</span></div>
                    <div className="node">풀스택 <span className="ct">9</span></div>
                    <div className="node">AI <span className="ct">7</span></div>
                  </div>
                </div>
                <div className="ot-branch">
                  <div className="node">사업 본부 <span className="ct">21</span></div>
                  <div className="ot-l2">
                    <div className="node">세일즈 <span className="ct">12</span></div>
                    <div className="node">CS <span className="ct">9</span></div>
                  </div>
                </div>
                <div className="ot-branch">
                  <div className="node">경영지원 <span className="ct">11</span></div>
                  <div className="ot-l2">
                    <div className="node">HR <span className="ct">5</span></div>
                    <div className="node">재무 <span className="ct">4</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

Object.assign(window, { PageMembers });
