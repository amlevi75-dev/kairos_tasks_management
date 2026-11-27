import { useState, useEffect, useRef } from "react";
import { useAuth, apiFetch, useBranding, fmtDateTime, useLang } from "../App";
import { tr, trVal } from "../i18n";
import Icon from "./Icon";
import { SIG, tint } from "../signals";

// Theme: the user's explicit choice wins; until they make one, follow the
// operating system's light/dark preference.
function getStoredTheme() {
  try {
    const saved = localStorage.getItem("tm_theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  try { return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; }
  catch { return "dark"; }
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
function saveTheme(theme) {
  try { localStorage.setItem("tm_theme", theme); } catch {}
}

export default function Layout({ children, navigate, currentPage, currentParams }) {
  const { user, setUser } = useAuth();
  const branding          = useBranding();
  const { lang, changeLang } = useLang();

  const [projects, setProjects]           = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif]         = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [theme, setTheme]                 = useState(getStoredTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    apiFetch("/projects").then(setProjects).catch(() => {});
    apiFetch("/users/notifications").then(setNotifications).catch(() => {});
  }, []);

  const unread  = notifications.filter(n => !n.read).length;
  const isAdmin = !!user?.is_admin;
  const isDark  = theme === "dark";

  const logout = async () => {
    await apiFetch("/auth/logout", { method:"POST" });
    setUser(null);
  };

  const markAllRead = async () => {
    await apiFetch("/users/notifications/read", { method:"POST" });
    setNotifications(n => n.map(x => ({ ...x, read:1 })));
  };

  const openNotification = async (notif) => {
    // Mark single notification as read
    if (!notif.read) {
      apiFetch(`/users/notifications/${notif.id}/read`, { method:"POST" }).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read:1 } : n));
    }
    // Navigate to the task's project if we have the info
    if (notif.project_id) {
      navigate({ name:"project", params:{ projectId: notif.project_id } });
    }
    setShowNotif(false);
  };

  const toggleTheme = () => setTheme(t => {
    const next = t === "dark" ? "light" : "dark";
    saveTheme(next);
    return next;
  });

  // Direction comes from <html dir> (set in main.jsx); no local override here.
  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>

      {/* ── Sidebar ── */}
      <aside id="app-sidebar" aria-hidden={!sidebarOpen} style={{
        width: sidebarOpen ? 240 : 0, flexShrink:0,
        background:"var(--bg-surface)", borderInlineEnd: sidebarOpen ? "1px solid var(--border)" : "none",
        display:"flex", flexDirection:"column", overflow:"hidden",
        // Hidden when collapsed so its links drop out of the Tab order.
        visibility: sidebarOpen ? "visible" : "hidden",
        transition: sidebarOpen ? "width 0.2s ease" : "width 0.2s ease, visibility 0s linear 0.2s",
      }}>
        {/* Logo — from branding */}
        <div style={{ padding:"18px 20px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {branding.logo_svg ? (
              <img src={branding.logo_svg} alt={branding.app_name}
                style={{ width:32, height:32, borderRadius:8, flexShrink:0, objectFit:"contain" }} />
            ) : (
              <div style={{
                width:32, height:32, borderRadius:8, flexShrink:0,
                background:`linear-gradient(135deg, ${branding.primary_color}, #8b5cf6)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, fontWeight:700, color:"#fff",
              }}>{branding.logo_letter}</div>
            )}
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontWeight:700, fontSize:15, color:"var(--text-primary)", whiteSpace:"nowrap" }}>
                {branding.app_name}
              </div>
              <div style={{ fontSize:11, color:"var(--text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.display_name}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav aria-label="Main" style={{ flex:1, padding:"10px", overflowY:"auto" }}>
          <NavItem label={tr("Dashboard")} icon="dashboard"
            active={currentPage==="dashboard"}
            onClick={()=>navigate({name:"dashboard",params:{}})} />
          <NavItem label={tr("My Tasks")} icon="list-check"
            active={currentPage==="mytasks"}
            onClick={()=>navigate({name:"mytasks",params:{}})} />

          {isAdmin && <>
            <SectionLabel>{tr("Administration")}</SectionLabel>
            <NavItem label={tr("System Users")} icon="users"
              active={currentPage==="admin-users"}
              onClick={()=>navigate({name:"admin-users",params:{}})} />
          </>}

          <SectionLabel>{tr("Projects")}</SectionLabel>
          {projects.filter(p => !p.archived).map(p => {
            const pid             = p.id;
            const isActiveProject = currentPage==="project"          && Number(currentParams?.projectId)===pid;
            const isMembersPage   = currentPage==="project-users"    && Number(currentParams?.projectId)===pid;
            const isAnalyticsPage = currentPage==="project-analytics" && Number(currentParams?.projectId)===pid;
            const isExpanded      = isActiveProject || isMembersPage || isAnalyticsPage;
            return (
              <div key={pid}>
                <NavItem label={p.name} dot={p.color}
                  active={isActiveProject}
                  onClick={()=>navigate({name:"project",params:{projectId:pid}})} />
                {isExpanded && (
                  <>
                    {p.role !== "light_member" && <NavItem label={tr("Members")} icon="user" indent
                      active={isMembersPage}
                      onClick={()=>navigate({name:"project-users",params:{projectId:pid}})} />}
                    <NavItem label={tr("Analytics")} icon="chart" indent
                      active={isAnalyticsPage}
                      onClick={()=>navigate({name:"project-analytics",params:{projectId:pid}})} />
                  </>
                )}
              </div>
            );
          })}
          {projects.length===0 && (
            <div style={{ fontSize:12, color:"var(--text-muted)", padding:"8px 10px" }}>{tr("No projects yet")}</div>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding:"10px", borderTop:"1px solid var(--border)", flexShrink:0, display:"flex", flexDirection:"column", gap:2 }}>
          <FooterBtn icon="globe" label={lang==="he" ? "English" : "עברית"} onClick={()=>changeLang(lang==="he"?"en":"he")} />
          <FooterBtn icon={isDark?"sun":"moon"} label={isDark?tr("Light mode"):tr("Dark mode")} onClick={toggleTheme} />
          <FooterBtn icon="logout" label={tr("Sign Out")} onClick={logout} />
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <header style={{
          height:52, borderBottom:"1px solid var(--border)",
          background:"var(--bg-surface)",
          display:"flex", alignItems:"center", padding:"0 20px", gap:10, flexShrink:0,
        }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setSidebarOpen(o=>!o)}
            aria-label={sidebarOpen ? tr("Hide sidebar") : tr("Show sidebar")} aria-expanded={sidebarOpen} aria-controls="app-sidebar">
            <Icon name="list" />
          </button>
          <div style={{ flex:1 }} />

          {/* Notification bell */}
          <div style={{ position:"relative" }}>
            <button className="btn btn-ghost btn-sm" style={{ position:"relative" }}
              aria-label={unread>0 ? tr("Notifications, {n} unread", { n: unread }) : tr("Notifications")}
              aria-expanded={showNotif} aria-haspopup="true"
              onClick={()=>{ setShowNotif(v=>!v); }}>
              <Icon name="bell" />
              {unread>0 && (
                <span aria-hidden="true" style={{
                  position:"absolute", top:-4, insetInlineEnd:-4,
                  minWidth:16, height:16, padding:"0 4px", borderRadius:99,
                  background:"var(--danger-fill)", color:"#fff",
                  fontSize:10, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>{unread}</span>
              )}
            </button>
            {showNotif && (
              <NotifPanel
                notifications={notifications}
                onOpen={openNotification}
                onMarkAllRead={markAllRead}
                onClose={()=>setShowNotif(false)}
              />
            )}
          </div>

          {isAdmin && (
            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:tint(SIG.amber, 15), color:SIG.amber, letterSpacing:"0.5px" }}>
              {tr("ADMIN")}
            </span>
          )}
          <div style={{ fontSize:13, color:"var(--text-secondary)", padding:"4px 10px", background:"var(--bg-elevated)", borderRadius:6 }}>
            {user?.display_name}
          </div>
        </header>

        <main style={{ flex:1, overflow:"auto", background:"var(--bg-base)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ margin:"14px 10px 5px", fontSize:10, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.8px", textTransform:"uppercase" }}>
      {children}
    </div>
  );
}

function NavItem({ label, icon, dot, active, onClick, indent }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined}
      className={`nav-item${indent ? " is-indent" : ""}${active ? " is-active" : ""}`}>
      {dot
        ? <span aria-hidden="true" style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0, marginInline:5 }} />
        : <Icon name={icon} size={indent ? 14 : 16} />
      }
      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{label}</span>
    </button>
  );
}

function FooterBtn({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="footer-btn">
      <Icon name={icon} />
      {label}
    </button>
  );
}

function NotifPanel({ notifications, onOpen, onMarkAllRead, onClose }) {
  const unread = notifications.filter(n => !n.read).length;
  const panelRef = useRef(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    const onKey   = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div ref={panelRef} role="region" aria-label={tr("Notifications")} style={{
      position:"absolute", top:"calc(100% + 8px)", insetInlineEnd:0,
      width:340, maxHeight:440, overflowY:"auto",
      background:"var(--bg-elevated)", border:"1px solid var(--border-soft)",
      borderRadius:"var(--radius-lg)", boxShadow:"var(--shadow)", zIndex:50,
    }}>
      {/* Header */}
      <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontWeight:600, fontSize:13 }}>
          {tr("Notifications")} {unread>0 && <span style={{ marginInlineStart:4, fontSize:11, background:"var(--danger-fill)", color:"#fff", borderRadius:99, padding:"1px 7px" }}>{unread}</span>}
        </span>
        {unread>0 && (
          <button onClick={onMarkAllRead} style={{ background:"none", border:"none", fontSize:11, color:"var(--accent-text)", cursor:"pointer", padding:0 }}>
            {tr("Mark all read")}
          </button>
        )}
      </div>

      {notifications.length===0 && (
        <div style={{ padding:"32px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8, color:"var(--text-muted)", fontSize:13 }}>
          <Icon name="check-circle" size={22} style={{ color:"var(--sig-green)" }} />
          {tr("All caught up")}
        </div>
      )}

      {notifications.map(n => {
        const isClickable = !!n.project_id;
        const Row = isClickable ? "button" : "div";
        return (
          <Row key={n.id}
            type={isClickable ? "button" : undefined}
            onClick={isClickable ? () => onOpen(n) : undefined}
            className={isClickable ? "pick-row" : undefined}
            style={{
              width:"100%", font:"inherit", textAlign:"start", border:"none",
              padding:"11px 16px", borderBottom:"1px solid var(--border)",
              background: n.read ? "transparent" : "var(--accent-glow)",
              transition:"background 0.1s",
              display:"flex", gap:10, alignItems:"flex-start",
            }}
          >
            {/* Unread dot */}
            <div aria-hidden="true" style={{ width:8, height:8, borderRadius:"50%", background: n.read?"transparent":"var(--accent-text)", flexShrink:0, marginTop:4 }} />
            {!n.read && <span className="sr-only">{tr("Unread: ")}</span>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color: n.read?"var(--text-secondary)":"var(--text-primary)", lineHeight:1.4 }}>
                {n.message}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>{fmtDateTime(n.created_at)}</span>
                {isClickable && !n.read && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:"var(--accent-text)", fontWeight:600 }}>{tr("Open")} <Icon name="arrow-right" size={11} /></span>
                )}
              </div>
            </div>
          </Row>
        );
      })}
    </div>
  );
}
