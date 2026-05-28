// Teamlet — shared design components
// Exports: Icon, Sidebar, Topbar, TopbarSearch
// Loaded as a Babel script tag; exports go to window.

function Icon({ name, ...props }) {
  const paths = {
    home: <><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></>,
    members: <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M15 14c2.8 0 5.5 1.6 5.5 5"/></>,
    leave: <><path d="M12 3v9"/><path d="M4 12a8 8 0 0 1 16 0"/><path d="M9 20l3-3 3 3"/></>,
    workflow: <><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h6M10 16h4"/></>,
    org: <><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2h12v2"/></>,
    search: <><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0v5l1.5 2h-15L6 14z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
    docs: <><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 13h7M9 17h5"/></>,
    insight: <><path d="M4 20V8M10 20V4M16 20v-8M22 20H2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5a7 7 0 0 0 .1-1.2z"/></>,
    perm: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.5c0 1.5-2.4 2-2.4 3.5"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></>,
    download: <><path d="M12 4v12M6 11l6 5 6-5"/><path d="M4 20h16"/></>,
    filter: <><path d="M3 5h18M6 12h12M10 19h4"/></>,
    chev_d: <><path d="M6 9l6 6 6-6"/></>,
    chev_r: <><path d="M9 6l6 6-6 6"/></>,
    check: <><path d="M5 12l4 4 10-10"/></>,
    x: <><path d="M6 6l12 12M18 6L6 18"/></>
  };
  return <svg viewBox="0 0 24 24" {...props}>{paths[name] || null}</svg>;
}

function Sidebar({ active, onNavigate }) {
  const items = [
    [
      { id: "home", label: "홈", icon: "home" },
      { id: "members", label: "구성원", icon: "members" },
      { id: "leave", label: "휴가", icon: "leave", badge: "3" },
      { id: "workflow", label: "워크플로우", icon: "workflow", badge: "7", attn: true },
      { id: "org", label: "조직도", icon: "org" }
    ],
    [
      { id: "search", label: "검색", icon: "search", kbd: "⌘K" },
      { id: "bell", label: "알림", icon: "bell", badge: "12" },
      { id: "docs", label: "문서·증명서", icon: "docs" },
      { id: "insight", label: "인사이트", icon: "insight" }
    ],
    [
      { id: "settings", label: "설정", icon: "settings" },
      { id: "perm", label: "권한 관리", icon: "perm" }
    ]
  ];
  const labels = [null, "Workspace", "Admin"];

  return (
    <aside className="side">
      <div className="org">
        <div className="org-logo">T</div>
        <div className="org-name">
          팀렛 주식회사
          <small>Pro · 142명</small>
        </div>
        <div className="org-caret">⌄</div>
      </div>

      <div className="status-pill">
        <span className="dot-live"></span>
        <span className="lbl">근무중</span>
        <span className="t mono num">2h 47m</span>
      </div>

      {items.map((group, gi) => (
        <div className="nav-group" key={gi}>
          {labels[gi] && <div className="nav-label">{labels[gi]}</div>}
          {group.map(it => (
            <a key={it.id}
               className={"nav-item" + (active === it.id ? " active" : "")}
               onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate(it.id); }}>
              <Icon name={it.icon} />
              {it.label}
              {it.kbd && <span className="kbd">{it.kbd}</span>}
              {it.badge && <span className={"badge" + (it.attn ? " attn" : "")}>{it.badge}</span>}
            </a>
          ))}
        </div>
      ))}

      <div className="me">
        <div className="av">유민</div>
        <div className="meta">
          <div className="name">김유민</div>
          <div className="role">PRODUCT · ADMIN</div>
        </div>
        <span className="caret">⋯</span>
      </div>
    </aside>
  );
}

function Topbar({ placeholder, actions }) {
  return (
    <div className="topbar">
      <div className="search">
        <Icon name="search" />
        <span className="ph">{placeholder || "검색…"}</span>
        <span className="kbd-s">⌘ K</span>
      </div>
      <div className="top-actions">
        <button className="icon-btn"><Icon name="bell" /><span className="pip"></span></button>
        <button className="icon-btn"><Icon name="help" /></button>
        {actions}
      </div>
    </div>
  );
}

// PageNav — sub-tabs at top of body
function PageNav({ pages, current, onPick }) {
  return (
    <div className="pagenav">
      {pages.map(p => (
        <a key={p.id}
           className={current === p.id ? "cur" : ""}
           onClick={(e) => { e.preventDefault(); onPick && onPick(p.id); }}>
          {p.label}
        </a>
      ))}
    </div>
  );
}

Object.assign(window, { Icon, Sidebar, Topbar, PageNav });
