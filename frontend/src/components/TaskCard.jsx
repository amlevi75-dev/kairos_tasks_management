import { tr, trVal } from "../i18n";
import { fmtDate } from "../App";
import Icon from "./Icon";
import { statusColor, prioColor, tint } from "../signals";
function isOverdue(due_date, status) {
  if (!due_date || status === "done") return false;
  return new Date(due_date) < new Date(new Date().toDateString());
}
export default function TaskCard({
  task,
  onClick
}) {
  const pc = prioColor(task.priority);
  const sc = statusColor(task.status);
  const overdue = isOverdue(task.due_date, task.status);

  // A real <button>: reachable with Tab, opens with Enter/Space, and shows
  // the same hover/focus lift (styled in index.css .task-card).
  // The priority stripe sits on the inline-start edge, so it mirrors in RTL.
  return <button type="button" onClick={onClick} className={`task-card${overdue ? " is-overdue" : ""}`} style={{
    borderInlineStart: `3px solid ${pc}`
  }}>
      {/* Title row */}
      <div style={{
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 6,
      lineHeight: 1.4,
      color: "var(--text-primary)"
    }}>
        {task.title}
        {task.is_collaborator && <span style={{
        marginInlineStart: 6,
        fontSize: 10,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 99,
        background: "var(--accent-soft)",
        color: "var(--accent-text)"
      }}>
            {tr("Collaborating")}
          </span>}
      </div>

      {/* Description — rendered as HTML (bold/italic/lists), clamped to 2
          lines. Stripped-tag preview would lose the formatting the field
          is for; the clamp keeps a card-sized excerpt regardless. */}
      {task.description && <div style={{
      fontSize: 11,
      color: "var(--text-muted)",
      marginBottom: 8,
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical"
    }} dangerouslySetInnerHTML={{
      __html: task.description
    }} />}

      {/* Badges row */}
      <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap"
    }}>
        <span style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "1px 6px",
        borderRadius: 3,
        background: tint(sc),
        color: sc
      }}>
          {task.status.replace("_", " ").toUpperCase()}
        </span>
        <span style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "1px 6px",
        borderRadius: 3,
        background: tint(pc),
        color: pc
      }}>
          {task.priority.toUpperCase()}
        </span>
        {/* Subtask count */}
        {task.subtask_count > 0 && <span title={tr("Subtasks done")} style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 10,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 3,
        background: "var(--bg-elevated)",
        color: "var(--text-muted)"
      }}>
            <Icon name="subtasks" size={11} /> {task.subtask_done || 0}/{task.subtask_count}
          </span>}
        {/* Assignee avatar */}
        {task.assignee_name && <div style={{
        marginInlineStart: "auto",
        display: "flex",
        alignItems: "center",
        gap: 4
      }}>
            <div aria-hidden="true" style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: `hsl(${task.assignee_id * 67 % 360},50%,38%)`,
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>{task.assignee_name[0].toUpperCase()}</div>
            <span style={{
          fontSize: 11,
          color: "var(--text-muted)"
        }}>{task.assignee_name.split(" ")[0]}</span>
          </div>}
      </div>

      {/* Due date row */}
      {task.due_date && <div style={{
      marginTop: 6,
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: overdue ? "var(--sig-red)" : "var(--text-muted)",
      fontWeight: overdue ? 600 : 400
    }}>
          <Icon name={overdue ? "bell-ring" : "calendar"} size={12} />
          {fmtDate(task.due_date)}
          {overdue && <span style={{
        marginInlineStart: 2
      }}>{tr("\u2014 Overdue")}</span>}
        </div>}
    </button>;
}