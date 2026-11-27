// Single source of truth for status / priority / role colours.
// Values are CSS variables (defined per theme in index.css), so every view
// picks up the right contrast in dark and light mode automatically.

export const SIG = {
  slate:  "var(--sig-slate)",
  blue:   "var(--sig-blue)",
  amber:  "var(--sig-amber)",
  green:  "var(--sig-green)",
  red:    "var(--sig-red)",
  violet: "var(--sig-violet)",
};

export const STATUS_COLORS = { new: SIG.slate, open: SIG.blue, in_progress: SIG.amber, done: SIG.green };
export const PRIO_COLORS   = { low: SIG.green, medium: SIG.blue, high: SIG.amber, critical: SIG.red };
export const ROLE_COLORS   = { owner: SIG.amber, member: SIG.blue, viewer: SIG.slate, light_member: SIG.violet };

export const statusColor = (s) => STATUS_COLORS[s] || SIG.slate;
export const prioColor   = (p) => PRIO_COLORS[p]   || SIG.blue;
export const roleColor   = (r) => ROLE_COLORS[r]   || SIG.slate;

// Translucent tint of any colour (CSS var or hex) — replaces the old
// `${hex}20` string concatenation, which only worked with hex values.
export const tint = (color, pct = 12) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
