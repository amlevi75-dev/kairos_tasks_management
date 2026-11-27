# Kairos — Hebrew/RTL re-integration into the new UI/UX

This applies your new UI/UX redesign plus the full Hebrew/RTL/language-switch
support, re-wired from the ground up. The redesign had no `LangContext`, no
`tr()` calls anywhere, and `main.jsx` hard-coded `UI_LANG = "en"` — all of
that plumbing is restored and reconnected to this codebase's new components.

## How to apply

Copy `src/` over your `frontend/src/` (same relative paths), then:

```
cd frontend
npm run build
```

No backend changes are needed — this is a frontend-only update, and it still
assumes the `users.language` column / `PUT /users/me/language` endpoint /
per-recipient translated notifications from the earlier `kairos_hebrew_i18n`
backend delivery. If that hasn't been applied to this instance yet, the
language switcher will still work locally (saved in the browser) but won't
sync across devices or translate server-sent emails/notifications.

## What changed

- **`main.jsx`** — now calls `applyDocLang()` from `i18n.js` instead of
  hard-coding English, so the saved language/direction is applied before
  the first paint.
- **`App.jsx`** — adds `LangContext`/`useLang`, the `changeLang()` /
  `syncLang()` logic (an explicit local choice always wins; otherwise the
  account's saved language is used), and a `<Fragment key={lang}>` remount
  so the whole tree re-renders cleanly on a language switch.
- **`components/Layout.jsx`** — sidebar footer gets a globe-icon language
  switcher; all of its own strings translated.
- **`views/LoginPage.jsx`** — top-right-corner language switcher (shown
  before login, since there's no account yet to read a saved language
  from); all strings translated.
- **`components/Icon.jsx`** — added the `globe` icon used by both switchers.
- **`components/RichTextEditor.jsx`** — fixed a re-introduced bug where a
  task's rich-text description didn't populate on mount (the `lastValue`
  ref was seeded with the initial value itself, so the first sync's guard
  was always false). Also translated its toolbar.
- **`components/GanttView.jsx`** — pinned to `dir="ltr"` at the root, since
  its day-offset bar math is left-to-right by construction; it would
  otherwise mirror incorrectly under Hebrew. Visible text translated.
- **Every other component/view** (`TaskModal`, `CommentPopover`,
  `CustomFieldValues`, `FieldBuilder`, `MembersPanel`, `TaskCard`,
  `TrashPanel`, `AdminUsers`, `Dashboard`, `MyTasks`, `ProjectAnalytics`,
  `ProjectUsers`, `ProjectView`) — every user-facing string wrapped with
  `tr()`, and every status/priority/role/field-type badge, select option,
  and board/column label switched from raw text to `trVal(kind, code,
  fallback)` so it displays correctly in both languages (this was done
  carefully everywhere a `<select>`'s `value=` holds the raw backend code —
  those were left untouched on purpose, only the *displayed* label was
  translated).
- **`i18n.he.js`** — added Hebrew translations for the ~40 new strings this
  redesign introduced that weren't in the old dictionary (new empty states,
  aria-labels, tab labels, the loading screen, etc.). Four short strings
  intentionally have **no** Hebrew entry and stay in Latin on purpose: the
  "B"/"I" bold/italic toolbar buttons, the "d" days-overdue suffix, and the
  word "English" in the switcher itself (you want that one to literally say
  "English", not "אנגלית").

## Verified

- Every touched file re-parses cleanly and the project builds with
  `vite build` with no errors.
- Built the static output and screenshotted the login page in both
  languages: the switcher works, `<html dir>` flips to `rtl`/`ltr`
  correctly, and the whole form mirrors via the existing logical CSS
  properties (no hard-coded `left`/`right` fighting it).

## Known gap — not verified here

This sandbox has no live PostgreSQL/backend, so the **authenticated**
screens (dashboard, board/list/Gantt, task modal, admin/members panels)
were reviewed by reading the code and by the build succeeding, but not
visually screenshotted end-to-end in both languages against real data.
Worth a quick click-through on your side, especially the Gantt chart (to
confirm it stays left-to-right under Hebrew) and the task modal's
status/priority chips.

## Still open from earlier (not part of this change)

The SSO auto-redirect you described (skipping the login page entirely on
a domain-joined machine, so hitting the app's URL goes straight through
SSO) hasn't been added to this `LoginPage.jsx` yet — say the word and I'll
wire it in as a small `useEffect` with a `sessionStorage` guard against
redirect loops, same approach discussed earlier.
