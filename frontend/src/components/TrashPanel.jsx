import { tr, trVal } from "../i18n";
import { useState, useEffect } from "react";
import { apiFetch } from "../App";
import { SIG, tint, PRIO_COLORS } from "../signals";
import Icon from "./Icon";
export default function TrashPanel({
  projectId,
  isOwner,
  onClose,
  onRestored
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    apiFetch(`/tasks/trash?project_id=${projectId}`).then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [projectId]);
  const restore = async taskId => {
    await apiFetch(`/tasks/trash/${taskId}/restore`, {
      method: "POST"
    });
    load();
    onRestored();
  };
  const permanent = async (taskId, title) => {
    if (!confirm(tr('Permanently delete "{title}"? This cannot be undone.', { title }))) return;
    await apiFetch(`/tasks/trash/${taskId}/permanent`, {
      method: "DELETE"
    });
    load();
  };
  return <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{
      maxWidth: 600
    }}>
        <div className="modal-header">
          <span style={{
          fontWeight: 600,
          fontSize: 15,
          display: "inline-flex",
          alignItems: "center",
          gap: 8
        }}><Icon name="trash" /> {tr("Trash")}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label={tr("Close")}><Icon name="x" size={14} /></button>
        </div>
        <div style={{
        padding: "0 24px 24px"
      }}>
          {loading && <div style={{
          padding: "24px 0",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13
        }}>{tr("Loading\u2026")}</div>}
          {!loading && items.length === 0 && <div style={{
          padding: "40px 0",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13
        }}>
              <Icon name="trash" size={30} strokeWidth={1.5} style={{
            marginBottom: 8
          }} />
              <br />{tr("Trash is empty")}
            </div>}
          <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 16
        }}>
            {items.map(t => <div key={t.id} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            background: "var(--bg-elevated)",
            borderRadius: 8,
            border: "1px solid var(--border)"
          }}>
                <div style={{
              flex: 1,
              minWidth: 0
            }}>
                  <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                textDecoration: "line-through"
              }}>{t.title}</div>
                  <div style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 2
              }}>
                    {tr("Deleted")} {t.deleted_at?.slice(0, 16).replace("T", " ")}
                    {t.reporter_name && tr(" · by {name}", { name: t.reporter_name })}
                  </div>
                </div>
                <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 99,
              background: tint(PRIO_COLORS[t.priority], 13),
              color: PRIO_COLORS[t.priority],
              flexShrink: 0
            }}>
                  {trVal("prio", t.priority, t.priority)}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => restore(t.id)}>{tr("Restore")}</button>
                {isOwner && <button className="btn btn-danger btn-sm" onClick={() => permanent(t.id, t.title)}>{tr("Delete")}</button>}
              </div>)}
          </div>
        </div>
      </div>
    </div>;
}