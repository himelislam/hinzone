# Claude Code - UI / UX Rules

## Purpose

These rules define the mandatory UI and UX standards for the **Stock Investment, Trading & MLM Platform**.

The objective is to create a modern, clean, responsive, accessible, and reusable interface that provides an excellent experience for both users and administrators.

The design should feel comparable to modern SaaS applications such as Stripe, Vercel, Linear, Notion, and GitHub while maintaining a professional financial platform aesthetic.

---

# 1. Design Philosophy

The UI should be:

- Modern
- Minimal
- Professional
- Fast
- Responsive
- Accessible
- Consistent
- Reusable

Avoid unnecessary visual clutter.

Every element should have a purpose.

---

# 2. Design Principles

Always follow:

- Simplicity
- Consistency
- Predictability
- Readability
- Accessibility
- Responsive Design
- Component Reusability

Users should never need to guess how the interface works.

---

# 3. Technology Stack

Frontend UI

- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- React Hook Form
- TanStack Query
- React Router

Charts

- Recharts

Animations

- Framer Motion (only where it improves UX)

---

# 4. Component Library

Use **shadcn/ui** as the primary component library.

Preferred components include:

- Button
- Card
- Input
- Textarea
- Select
- Combobox
- Table
- Badge
- Tabs
- Dialog
- Drawer
- Popover
- Tooltip
- Alert
- Toast
- Skeleton
- Pagination
- Calendar
- Dropdown Menu
- Command
- Sheet

Do not reinvent components that already exist.

---

# 5. Layout Structure

Use a consistent application layout.

```
Header

↓

Sidebar

↓

Main Content

↓

Footer (optional)
```

The admin panel and user dashboard should share the same layout system.

---

# 6. Responsive Design

Support:

- Mobile
- Tablet
- Laptop
- Desktop
- Ultra-wide screens

Recommended breakpoints

```
sm
md
lg
xl
2xl
```

No horizontal scrolling should occur unless explicitly required.

---

# 7. Color System

Use semantic color tokens instead of hardcoded colors.

Examples

- Primary
- Secondary
- Success
- Warning
- Destructive
- Muted
- Background
- Card
- Border

Prefer CSS variables and shadcn theme tokens.

Do not hardcode arbitrary hex values throughout the project.

---

# 8. Typography

Recommended font

```
Inter
```

Font hierarchy

- H1
- H2
- H3
- H4
- Body
- Small
- Caption

Use consistent spacing and line heights.

Avoid more than two font families.

---

# 9. Spacing

Use Tailwind spacing scale consistently.

Preferred spacing

```
2
4
6
8
12
16
20
24
```

Avoid random spacing values.

---

# 10. Icons

Use only:

```
Lucide React
```

Icons should:

- Match surrounding text size
- Be visually consistent
- Convey meaning
- Never replace labels where text is necessary

---

# 11. Buttons

Button variants

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Link

Support:

- Loading state
- Disabled state
- Icon buttons
- Keyboard focus

Never allow duplicate submissions while loading.

---

# 12. Forms

Use:

- React Hook Form
- Zod Validation

Every form should include:

- Labels
- Placeholders (optional)
- Helper text (when needed)
- Validation messages
- Loading indicators
- Success feedback

Never rely on placeholders as labels.

---

# 13. Tables

Use reusable data tables.

Features

- Pagination
- Sorting
- Searching
- Filtering
- Column visibility
- Responsive layout
- Empty state

Large datasets must use server-side pagination.

---

# 14. Dashboard Cards

Dashboard metrics should use reusable cards.

Examples

- Wallet Balance
- Portfolio Value
- Deposits
- Withdrawals
- Total Profit
- Referral Earnings
- Active Users
- Pending Requests

Each card should include:

- Title
- Value
- Optional icon
- Optional trend indicator

---

# 15. Charts

Use Recharts.

Supported charts

- Line
- Area
- Bar
- Pie
- Donut

Charts should:

- Be responsive
- Include legends
- Support tooltips
- Handle empty data gracefully

---

# 16. Navigation

Sidebar should support:

- Nested menus
- Active state
- Collapsible sections
- Icons
- Role-based visibility

Navigation should remain consistent across the application.

---

# 17. Loading States

Every asynchronous page should provide loading feedback.

Use:

- Skeletons
- Spinners
- Progress indicators

Avoid blank screens during loading.

---

# 18. Empty States

Every list or table should have an empty state.

Include:

- Illustration or icon
- Short explanation
- Primary action (if applicable)

Example

```
No deposits found.

Create your first deposit request.
```

---

# 19. Error States

Error screens should include:

- Friendly message
- Retry button
- Optional support link

Avoid exposing technical details.

---

# 20. Notifications

Use toast notifications for:

- Success
- Warning
- Error
- Information

Messages should be concise and actionable.

---

# 21. Dialogs

Use dialogs for:

- Confirm Delete
- Approvals
- Rejections
- Logout
- Dangerous actions

Destructive actions must require confirmation.

---

# 22. Accessibility

Every page must support:

- Keyboard navigation
- Visible focus states
- Proper labels
- ARIA attributes where needed
- Color contrast compliance
- Screen readers

Accessibility should not be treated as optional.

---

# 23. Dark Mode

The architecture should support dark mode.

Requirements

- Theme switching
- CSS variables
- Consistent colors
- Persistent preference

Implementation can be introduced in a future release.

---

# 24. Performance

Optimize UI performance by:

- Lazy loading routes
- Code splitting
- Image optimization
- Memoization where beneficial
- Virtualized lists for large datasets

Avoid unnecessary re-renders.

---

# 25. Animations

Use animations sparingly.

Recommended uses

- Modal transitions
- Drawer transitions
- Toasts
- Page fade-ins
- Skeleton replacement

Avoid distracting or excessive animations.

---

# 26. Page Structure

Each page should follow a predictable layout.

```
Page Title

↓

Breadcrumb (optional)

↓

Actions

↓

Filters

↓

Content

↓

Pagination
```

Maintain consistent spacing between sections.

---

# 27. User Dashboard Pages

Examples

- Dashboard
- Portfolio
- Wallet
- Deposits
- Withdrawals
- Trading
- Referrals
- Notifications
- Profile
- Settings

All pages should follow the same design language.

---

# 28. Admin Dashboard Pages

Examples

- Dashboard
- Users
- Wallets
- Deposits
- Withdrawals
- Stocks
- Trading
- MLM
- Notifications
- Reports
- Settings
- Audit Logs

Use shared layout and reusable components.

---

# 29. Reusable Components

Create shared components for:

- Data Table
- Search Bar
- Filter Panel
- Status Badge
- Stat Card
- Page Header
- Form Section
- Confirmation Dialog
- Empty State
- Error State
- Loading Skeleton

Avoid duplicate UI implementations.

---

# 30. Status Badges

Use consistent status indicators.

Examples

Success

```
Approved
Completed
Active
```

Warning

```
Pending
Processing
```

Error

```
Rejected
Failed
Blocked
```

Neutral

```
Draft
Inactive
Archived
```

Never use inconsistent colors for the same status.

---

# 31. Financial Display Rules

Currency values should:

- Use centralized formatting utilities
- Respect Settings currency configuration
- Support thousands separators
- Display correct currency symbols
- Maintain consistent decimal precision

Do not manually format currency values throughout the application.

---

# 32. Mobile Experience

On smaller screens:

- Collapse sidebar into a drawer
- Stack dashboard cards
- Make tables horizontally scrollable only when necessary
- Keep primary actions easily accessible
- Ensure touch-friendly controls

Mobile usability is a first-class requirement.

---

# 33. Future UI Features

The UI architecture should support:

- Multi-language (i18n)
- RTL layouts
- Theme customization
- White-label branding
- Advanced dashboards
- Drag-and-drop widgets
- Real-time updates
- Mobile application parity

Future enhancements should not require major refactoring.

---

# 34. Non-Negotiable Rules

The following rules must always be followed:

- Use shadcn/ui components whenever possible.
- Build reusable components before creating page-specific UI.
- Maintain consistent spacing, typography, and color usage.
- Every page must be responsive across all supported devices.
- Every asynchronous operation must provide loading, success, and error feedback.
- Every form must include validation and accessible labels.
- Never hardcode colors, spacing, or typography values outside the design system.
- Financial information must always use centralized formatting utilities.
- Accessibility and keyboard navigation are mandatory.
- Keep the interface clean, modern, and focused on usability rather than visual complexity.
