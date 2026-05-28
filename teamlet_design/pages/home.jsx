// Teamlet — Home page (hi-fi)

const pageStyles_home = `
  .work { display: grid; grid-template-columns: minmax(0, 1fr) 340px; min-height: 0; }
  .feed { padding: 28px 32px 40px; min-width: 0; }
  .rail-h { padding: 28px 28px 40px; display: flex; flex-direction: column; gap: 14px; background: var(--bg); border-left: 1px solid var(--border); }
  .feed-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
  .h-title-h { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px; line-height: 1.2; }
  .h-title-h .wave { display: inline-block; transform-origin: 70% 70%; animation: wave 1.6s ease-in-out 1; }
  @keyframes wave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(18deg); } 50% { transform: rotate(-12deg); } 75% { transform: rotate(8deg); } }
  .h-sub-h { font-size: 13px; color: var(--fg-muted); }
  .h-sub-h .ping { display: inline-flex; align-items: center; gap: 5px; margin-left: 4px; }
  .h-sub-h .ping i { width: 6px; height: 6px; border-radius: 50%; background: var(--success); display: inline-block; box-shadow: 0 0 0 3px var(--success-50); }

  .post {
    border: 1px solid var(--border); border-radius: 16px;
    background: var(--bg-primary); margin-bottom: 14px;
    overflow: hidden; transition: border-color 120ms, box-shadow 120ms;
  }
  .post:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
  .post-h { display: flex; align-items: center; gap: 12px; padding: 16px 20px 10px; }
  .post-h .who-block { flex: 1; }
  .post-h .who { font-size: 13px; font-weight: 600; }
  .post-h .who .role { color: var(--fg-muted); font-weight: 400; }
  .post-h .meta { font-size: 12px; color: var(--fg-muted); }
  .post-h .pin { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 999px; background: var(--warn-50); color: var(--warn); display: inline-flex; align-items: center; gap: 4px; }
  .post-b { padding: 0 20px 16px; }
  .post-b h3 { margin: 6px 0 8px; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
  .post-b .text { color: var(--fg-muted); font-size: 13.5px; line-height: 1.6; }
  .post-b .text b { color: var(--fg); font-weight: 600; }
  .img-ph { height: 180px; background: repeating-linear-gradient(135deg, var(--bg-secondary) 0 14px, var(--bg-tertiary) 14px 16px); border: 1px solid var(--border); border-radius: 10px; margin: 14px 0 4px; display: grid; place-items: center; color: var(--fg-subtle); font-family: "JetBrains Mono", monospace; font-size: 12px; }
  .img-ph small { display: block; text-align: center; color: var(--fg-subtle); margin-top: 3px; font-size: 11px; }

  .post-f { display: flex; align-items: center; gap: 6px; padding: 12px 20px; border-top: 1px solid var(--border); color: var(--fg-muted); font-size: 12.5px; }
  .react { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: var(--bg-secondary); cursor: pointer; }
  .react:hover { background: var(--bg-tertiary); }
  .react b { color: var(--fg); font-weight: 600; }
  .post-f .spread { margin-left: auto; font-size: 12px; }

  .event-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px; border: 1px solid var(--border); border-radius: 14px;
    background: var(--bg-primary); margin-bottom: 10px;
    transition: border-color 120ms, transform 120ms; cursor: pointer;
  }
  .event-row:hover { border-color: var(--border-strong); transform: translateX(2px); }
  .event-row .date {
    font-family: "Inter", system-ui; width: 56px; flex-shrink: 0; text-align: center;
    padding: 4px 0; border-radius: 8px; background: var(--bg-secondary);
  }
  .event-row .date .m { font-size: 10px; font-weight: 600; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .event-row .date .d { font-size: 18px; font-weight: 700; color: var(--fg); line-height: 1.1; }
  .event-row .icon-c {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--primary-soft); color: var(--primary);
    display: grid; place-items: center; font-size: 16px; flex-shrink: 0;
  }
  .event-row .copy { flex: 1; min-width: 0; }
  .event-row .copy .t { font-size: 14px; font-weight: 600; }
  .event-row .copy .s { font-size: 12px; color: var(--fg-muted); margin-top: 2px; }
  .event-row .more { color: var(--fg-subtle); font-size: 13px; }
  .event-row:hover .more { color: var(--primary); }

  .todo-group-h { margin-bottom: 28px; }
  .todo-group-h h4 { margin: 0 0 12px; font-size: 12px; font-weight: 600; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 8px; }
  .todo-group-h h4 .c { font-family: "JetBrains Mono", monospace; color: var(--fg); background: var(--bg-tertiary); padding: 2px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 700; }
  .todo-row {
    display: grid; grid-template-columns: 24px 1fr auto auto;
    gap: 16px; align-items: center;
    padding: 14px 18px; border: 1px solid var(--border); border-radius: 12px;
    background: var(--bg-primary); margin-bottom: 8px;
    transition: border-color 120ms, transform 120ms; cursor: pointer;
  }
  .todo-row:hover { border-color: var(--border-strong); transform: translateX(2px); }
  .todo-row .check { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--border-strong); }
  .todo-row:hover .check { border-color: var(--primary); }
  .todo-row .body .t { font-size: 14px; font-weight: 600; }
  .todo-row .body .s { font-size: 12px; color: var(--fg-muted); margin-top: 2px; }
  .due {
    font-family: "JetBrains Mono", monospace; font-size: 11.5px; font-weight: 600;
    padding: 4px 10px; border-radius: 6px;
    background: var(--bg-secondary); color: var(--fg-muted); border: 1px solid var(--border);
  }
  .due.urgent { background: var(--destructive-50); border-color: var(--destructive); color: var(--destructive); }
  .due.soon { background: var(--warn-50); border-color: var(--warn); color: var(--warn); }
  .open-arr { color: var(--fg-subtle); font-size: 13px; }

  .widget { background: var(--bg-primary); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; }
  .widget h5 { margin: 0 0 12px; font-size: 12px; font-weight: 600; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 8px; }
  .widget h5 .all { margin-left: auto; color: var(--fg-subtle); font-family: "JetBrains Mono", monospace; font-size: 11px; text-transform: none; letter-spacing: 0; font-weight: 500; cursor: pointer; }
  .today-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .today-grid .cell { padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-secondary); }
  .today-grid .cell .n { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
  .today-grid .cell .l { font-size: 11.5px; color: var(--fg-muted); margin-top: 2px; font-weight: 500; }
  .cal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .cal-head .month { font-weight: 600; font-size: 13.5px; }
  .cal-head .nav-btns { display: flex; gap: 2px; }
  .cal-head .nav-btns button { width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-primary); color: var(--fg-muted); cursor: pointer; display: grid; place-items: center; font-size: 12px; }
  .cal-head .nav-btns button:hover { background: var(--bg-secondary); color: var(--fg); }
  .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
  .cal .dow { color: var(--fg-subtle); font-size: 10.5px; padding: 4px 0; font-weight: 600; }
  .cal .d { aspect-ratio: 1/1; display: grid; place-items: center; color: var(--fg); font-size: 12.5px; font-weight: 500; border-radius: 7px; position: relative; cursor: pointer; }
  .cal .d:hover { background: var(--bg-secondary); }
  .cal .d.out { color: var(--fg-subtle); }
  .cal .d.sun { color: var(--destructive); }
  .cal .d.today { background: var(--primary); color: var(--primary-on); font-weight: 700; }
  .cal .d.dot::after { content: ""; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: var(--fg-muted); }
  .cal .d.today.dot::after { background: var(--primary-on); }
  .cal .d.holiday { color: var(--destructive); }
  .cal .d.range { background: var(--primary-soft); }
  .legend { display: flex; gap: 14px; margin-top: 12px; font-size: 11px; color: var(--fg-muted); }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--fg-subtle); }
  .legend .h i { background: var(--destructive); }
  .legend .l i { background: var(--primary); }
  .legend .r i { background: var(--primary-soft); border: 1px solid var(--primary); }

  .ooo .row { display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .ooo .row:last-child { border-bottom: none; }
  .b-list .b { display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .b-list .b:last-child { border-bottom: none; }
  .b-list .b .when { font-family: "JetBrains Mono", monospace; font-size: 11px; padding: 3px 8px; background: var(--bg-secondary); border-radius: 6px; color: var(--fg-muted); }
  .b-list .b .when.today { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
  .b-list .b .info { flex: 1; }
  .b-list .b .info .nm { font-weight: 600; }
  .b-list .b .info .sub-b { font-size: 11.5px; color: var(--fg-muted); }
`;

function PageHome() {
  const [tab, setTab] = React.useState("feed");
  return (
    <>
      <style>{pageStyles_home}</style>
      <div className="work">
        <main className="feed">
          <div className="feed-head">
            <div>
              <h1 className="h-title-h">좋은 아침이에요, 유민님 <span className="wave">👋</span></h1>
              <div className="h-sub-h">금 · 2026년 5월 22일 <span className="ping"><i></i> 오늘 출근 38 · 휴가 4 · 재택 6</span></div>
            </div>
          </div>

          <div className="tabs">
            <button className={"tab" + (tab === "feed" ? " active" : "")} onClick={() => setTab("feed")}>홈 피드</button>
            <button className={"tab" + (tab === "news" ? " active" : "")} onClick={() => setTab("news")}>소식 <span className="count">2</span></button>
            <button className={"tab" + (tab === "todo" ? " active" : "")} onClick={() => setTab("todo")}>할 일 <span className="count">7</span></button>
          </div>

          {tab === "feed" && <FeedView />}
          {tab === "news" && <NewsView />}
          {tab === "todo" && <TodoView />}
        </main>
        <HomeRail />
      </div>
    </>
  );
}

function FeedView() {
  return (
    <section>
      <div className="kpis">
        <div className="kpi"><span className="lbl">연차 잔여</span><span className="val num">11.5<small>/ 15일</small></span><span className="delta">휴가 신청 →</span></div>
        <div className="kpi"><span className="lbl">결재 대기</span><span className="val num">7<small>건</small></span><span className="delta">바로 처리 →</span></div>
        <div className="kpi"><span className="lbl">이번 주 근무</span><span className="val num">32:14<small>/ 40h</small></span><span className="delta">근무표 →</span></div>
        <div className="kpi cta"><span className="lbl">오늘 할 일</span><span className="val">3건 마감 임박</span><span className="delta">→ 할 일 탭</span></div>
      </div>

      <article className="post">
        <div className="post-h">
          <div className="av">수민</div>
          <div className="who-block">
            <div className="who">정수민 <span className="role">· HR팀 매니저</span></div>
            <div className="meta">2시간 전 · 공지사항</div>
          </div>
          <span className="pin">📌 필독</span>
        </div>
        <div className="post-b">
          <h3>6월 1일부 사내 복지 제도 개편 안내</h3>
          <div className="text">6월 1일부터 <b>복지 포인트가 연 100만 원</b>으로 확대되고, <b>도서 구입비</b>가 정식 항목에 추가됩니다. 자율 출퇴근, 재택근무 규정 일부 조정 사항도 있습니다.</div>
          <div className="img-ph">본문 첨부 이미지<small>image · 16:9 · 1.2 MB</small></div>
        </div>
        <div className="post-f">
          <span className="react">👏 <b>24</b></span>
          <span className="react">❤️ <b>11</b></span>
          <span className="react">💬 6</span>
          <span className="spread mono">읽음 87 / 142</span>
        </div>
      </article>

      <div className="event-row">
        <div className="date"><div className="m">MAY</div><div className="d">22</div></div>
        <div className="icon-c">🎂</div>
        <div className="copy"><div className="t">오늘 생일인 동료 2명 — 박지훈, 이서연</div><div className="s">동료에게 축하 메시지를 전달해보세요</div></div>
        <span className="more">전달하기 →</span>
      </div>

      <div className="event-row">
        <div className="date"><div className="m">MAY</div><div className="d">26</div></div>
        <div className="icon-c">👋</div>
        <div className="copy"><div className="t">새로 합류한 동료 — 한도윤 (디자인팀)</div><div className="s">월요일 입사 · 프로필 보고 인사 보내기</div></div>
        <span className="more">프로필 →</span>
      </div>

      <article className="post">
        <div className="post-h">
          <div className="av">상우</div>
          <div className="who-block">
            <div className="who">이상우 → 박혜진</div>
            <div className="meta">5시간 전 · 인정과 피드백</div>
          </div>
        </div>
        <div className="post-b">
          <div className="text">지난 주 디자인 시스템 리팩토링 정말 고생 많으셨어요! 덕분에 새 페이지 작업이 훨씬 빠르고 일관성 있게 진행되고 있습니다.</div>
        </div>
        <div className="post-f">
          <span className="react">🔥 <b>8</b></span>
          <span className="react">👏 <b>5</b></span>
          <span className="react">💬 2</span>
          <span className="spread mono">팀 전체 공개</span>
        </div>
      </article>
    </section>
  );
}

function NewsView() {
  return (
    <section>
      <div className="kpis" style={{gridTemplateColumns: "1fr 1fr"}}>
        <div className="kpi"><span className="lbl">읽지 않은 공지</span><span className="val num">2<small>건</small></span></div>
        <div className="kpi"><span className="lbl">이번 주 새 글</span><span className="val num">5<small>건</small></span></div>
      </div>
      <article className="post">
        <div className="post-h">
          <div className="av">민호</div>
          <div className="who-block">
            <div className="who">대표이사 김민호</div>
            <div className="meta">이틀 전 · 회사 소식</div>
          </div>
        </div>
        <div className="post-b">
          <h3>2분기 OKR 중간 점검 결과 공유</h3>
          <div className="text">전사 OKR 진행률 67%. 디자인·엔지니어링 본부 모두 핵심 지표가 정상 궤도에 있습니다.</div>
        </div>
        <div className="post-f">
          <span className="react">🚀 <b>32</b></span>
          <span className="react">👏 <b>14</b></span>
          <span className="spread mono">읽음 119 / 142</span>
        </div>
      </article>
      <article className="post">
        <div className="post-h">
          <div className="av">IT</div>
          <div className="who-block">
            <div className="who">IT 운영팀</div>
            <div className="meta">3일 전 · 시스템 공지</div>
          </div>
        </div>
        <div className="post-b">
          <h3>5월 25일 02:00 ~ 04:00 정기 점검 예정</h3>
          <div className="text">점검 시간에는 일부 서비스 접속이 제한될 수 있습니다.</div>
        </div>
        <div className="post-f">
          <span className="react">👀 <b>16</b></span>
          <span className="spread mono">읽음 96 / 142</span>
        </div>
      </article>
    </section>
  );
}

function TodoView() {
  return (
    <section>
      <div className="todo-group-h">
        <h4>마감 임박 <span className="c">3</span></h4>
        <div className="todo-row"><span className="check"></span><div className="body"><div className="t">박지훈 · 연차 사용 신청 결재</div><div className="s">5/26 ~ 5/27 (2일) · 신청 어제</div></div><span className="due urgent">오늘 마감</span><span className="open-arr">→</span></div>
        <div className="todo-row"><span className="check"></span><div className="body"><div className="t">2026 Q2 인사평가 1차 리뷰</div><div className="s">평가 대상 6명 · 진행 2/6</div></div><span className="due urgent">D-1</span><span className="open-arr">→</span></div>
        <div className="todo-row"><span className="check"></span><div className="body"><div className="t">한도윤 입사 온보딩 체크리스트</div><div className="s">입사일 5/26 · 12개 중 4개 미완료</div></div><span className="due soon">D-2</span><span className="open-arr">→</span></div>
      </div>
      <div className="todo-group-h">
        <h4>결재 대기 <span className="c">4</span></h4>
        <div className="todo-row"><span className="check"></span><div className="body"><div className="t">이서연 · 출장비 정산 (47만원)</div><div className="s">부산 출장 5/19~5/20</div></div><span className="due">D-3</span><span className="open-arr">→</span></div>
        <div className="todo-row"><span className="check"></span><div className="body"><div className="t">디자인팀 · 외부 교육 신청서</div><div className="s">UX 컨퍼런스 참가</div></div><span className="due">D-4</span><span className="open-arr">→</span></div>
        <div className="todo-row"><span className="check"></span><div className="body"><div className="t">최민재 · 재택근무 신청</div><div className="s">5/28 (목)</div></div><span className="due">D-4</span><span className="open-arr">→</span></div>
        <div className="todo-row"><span className="check"></span><div className="body"><div className="t">개발팀 · 신규 도서 구매 요청</div><div className="s">3건 · 9.6만원</div></div><span className="due">D-5</span><span className="open-arr">→</span></div>
      </div>
    </section>
  );
}

function HomeRail() {
  return (
    <aside className="rail-h">
      <div className="widget">
        <h5>오늘의 팀 현황 <span className="all">5월 22일 (금)</span></h5>
        <div className="today-grid">
          <div className="cell"><div className="n num">38</div><div className="l">출근</div></div>
          <div className="cell"><div className="n num">06</div><div className="l">재택</div></div>
          <div className="cell"><div className="n num">04</div><div className="l">휴가</div></div>
          <div className="cell"><div className="n num">02</div><div className="l">출장</div></div>
        </div>
      </div>

      <div className="widget">
        <h5>이번 달 일정 <span className="all">월 보기 →</span></h5>
        <div className="cal-head">
          <div className="month">2026년 5월</div>
          <div className="nav-btns"><button>‹</button><button>›</button></div>
        </div>
        <div className="cal">
          <div className="dow">일</div><div className="dow">월</div><div className="dow">화</div><div className="dow">수</div><div className="dow">목</div><div className="dow">금</div><div className="dow">토</div>
          <div className="d out sun">26</div><div className="d out">27</div><div className="d out">28</div><div className="d out">29</div><div className="d out">30</div><div className="d out">1</div><div className="d out">2</div>
          <div className="d sun">3</div><div className="d">4</div><div className="d dot">5</div><div className="d">6</div><div className="d">7</div><div className="d">8</div><div className="d">9</div>
          <div className="d sun">10</div><div className="d">11</div><div className="d">12</div><div className="d">13</div><div className="d">14</div><div className="d">15</div><div className="d">16</div>
          <div className="d sun">17</div><div className="d">18</div><div className="d">19</div><div className="d">20</div><div className="d">21</div><div className="d today dot">22</div><div className="d">23</div>
          <div className="d sun">24</div><div className="d range">25</div><div className="d range dot">26</div><div className="d range">27</div><div className="d">28</div><div className="d">29</div><div className="d">30</div>
          <div className="d sun holiday">31</div><div className="d out">1</div><div className="d out">2</div><div className="d out">3</div><div className="d out">4</div><div className="d out">5</div><div className="d out">6</div>
        </div>
        <div className="legend">
          <span className="l"><i></i>오늘</span>
          <span className="h"><i></i>공휴일</span>
          <span><i></i>일정</span>
          <span className="r"><i></i>휴가</span>
        </div>
      </div>

      <div className="widget">
        <h5>오늘 자리 비움 <span className="all">전체 →</span></h5>
        <div className="ooo">
          <div className="row"><div className="av sm">혜진</div><span style={{flex:1, fontWeight:600}}>박혜진</span><span className="tag lv">연차</span></div>
          <div className="row"><div className="av sm">민재</div><span style={{flex:1, fontWeight:600}}>최민재</span><span className="tag lv">반차</span></div>
          <div className="row"><div className="av sm">도현</div><span style={{flex:1, fontWeight:600}}>김도현</span><span className="tag wfh">재택</span></div>
          <div className="row"><div className="av sm">서연</div><span style={{flex:1, fontWeight:600}}>이서연</span><span className="tag wfh">재택</span></div>
          <div className="row"><div className="av sm">지우</div><span style={{flex:1, fontWeight:600}}>한지우</span><span className="tag late">지각</span></div>
        </div>
      </div>

      <div className="widget">
        <h5>축하 보낼 동료</h5>
        <div className="b-list">
          <div className="b"><div className="av sm">지훈</div><div className="info"><div className="nm">박지훈</div><div className="sub-b">생일</div></div><div className="when today">오늘</div></div>
          <div className="b"><div className="av sm">서연</div><div className="info"><div className="nm">이서연</div><div className="sub-b">생일</div></div><div className="when today">오늘</div></div>
          <div className="b"><div className="av sm">수민</div><div className="info"><div className="nm">정수민</div><div className="sub-b">입사 3주년</div></div><div className="when">월</div></div>
        </div>
      </div>
    </aside>
  );
}

Object.assign(window, { PageHome });
