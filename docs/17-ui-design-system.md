# UI Design System

**Project Name:** Stock Investment, Trading & MLM Platform

**Version:** 1.1

**Document Version:** 1.0

---

# 1. Overview

The UI Design System defines the visual language, reusable components, layouts, spacing, typography, colors, and interaction patterns used throughout the platform.

The goal is to ensure:

- Consistent Design
- Modern UI
- Excellent User Experience
- Responsive Layout
- Reusable Components
- Easy Maintenance
- Fast Development

The frontend will be built using **React + Tailwind CSS + shadcn/ui**.

---

# 2. Design Principles

The application should follow these principles.

- Clean
- Professional
- Modern
- Minimal
- Financial Dashboard Style
- Accessible
- Responsive
- Consistent

---

# 3. Design Inspiration

The interface should resemble modern SaaS dashboards similar to:

- Stripe Dashboard
- Vercel Dashboard
- Linear
- Notion
- Clerk Dashboard
- GitHub
- Coinbase
- Binance

---

# 4. Theme

Version 1 supports:

```
Light Theme
```

Future versions:

```
Dark Theme

System Theme
```

Theme support should be architected from the beginning.

---

# 5. Color Palette

## Primary

```
Blue

#2563EB
```

---

## Secondary

```
Indigo

#4F46E5
```

---

## Success

```
Green

#16A34A
```

---

## Warning

```
Orange

#F59E0B
```

---

## Danger

```
Red

#DC2626
```

---

## Information

```
Sky

#0284C7
```

---

## Background

```
#F8FAFC
```

---

## Surface

```
White

#FFFFFF
```

---

## Border

```
#E5E7EB
```

---

## Text

Primary

```
#111827
```

Secondary

```
#6B7280
```

Muted

```
#9CA3AF
```

---

# 6. Typography

Font Family

```
Inter
```

Fallback

```
sans-serif
```

---

## Font Sizes

| Element | Size |
| ------- | ---: |
| Display | 48px |
| H1      | 36px |
| H2      | 30px |
| H3      | 24px |
| H4      | 20px |
| H5      | 18px |
| H6      | 16px |
| Body    | 16px |
| Small   | 14px |
| Caption | 12px |

---

# 7. Font Weights

```
400

500

600

700
```

---

# 8. Border Radius

Cards

```
16px
```

Buttons

```
10px
```

Inputs

```
10px
```

Dialogs

```
20px
```

Badges

```
999px
```

---

# 9. Shadows

Small

```
shadow-sm
```

Medium

```
shadow-md
```

Large

```
shadow-lg
```

Hover

```
shadow-xl
```

---

# 10. Spacing System

Use an 8px spacing scale.

```
4

8

12

16

24

32

40

48

64

96
```

Tailwind spacing utilities should follow this scale.

---

# 11. Grid System

Desktop

```
12 Columns
```

Tablet

```
8 Columns
```

Mobile

```
4 Columns
```

---

# 12. Layout Structure

```
Sidebar

↓

Top Navigation

↓

Breadcrumb

↓

Page Header

↓

Content

↓

Footer
```

---

# 13. Sidebar

Contains:

- Logo
- Navigation
- User Profile
- Logout

Desktop

```
280px
```

Collapsed

```
80px
```

Mobile

```
Drawer
```

---

# 14. Top Navigation

Contains:

- Search
- Notifications
- User Menu
- Theme Switcher (Future)

Height

```
72px
```

---

# 15. Buttons

Variants

```
Primary

Secondary

Outline

Ghost

Link

Destructive
```

Sizes

```
Small

Medium

Large

Icon
```

States

- Default
- Hover
- Active
- Loading
- Disabled

---

# 16. Inputs

Supported Components

- Text Input
- Password
- Email
- Number
- Phone
- Search
- Textarea

States

- Default
- Focus
- Error
- Disabled

---

# 17. Select Components

Supported

- Single Select
- Multi Select
- Searchable Select

---

# 18. Form Components

Reusable components

- Input
- Select
- Checkbox
- Radio
- Toggle
- Date Picker
- Time Picker
- File Upload
- Image Upload

Validation messages should appear below each field.

---

# 19. Cards

Used for:

- Dashboard Statistics
- Wallet Summary
- Portfolio
- User Profile
- Settings

Card Structure

```
Header

↓

Body

↓

Footer (Optional)
```

---

# 20. Tables

Every table supports:

- Search
- Pagination
- Sorting
- Filters
- Responsive Scroll
- Empty State

Used for:

- Users
- Deposits
- Withdrawals
- Transactions
- Stocks
- Reports

---

# 21. Badges

Variants

```
Primary

Success

Warning

Danger

Secondary
```

Examples

```
Approved

Pending

Rejected

Active

Inactive
```

---

# 22. Alerts

Variants

```
Success

Warning

Info

Danger
```

---

# 23. Modals

Used for

- Confirmation
- Delete
- Forms
- Preview
- Details

Animations should use smooth fade and scale transitions.

---

# 24. Toast Notifications

Used for

- Success
- Error
- Warning
- Information

Placement

```
Top Right
```

Auto dismiss

```
5 Seconds
```

---

# 25. Loading States

Use:

- Skeleton Loader
- Spinner
- Progress Bar

Never leave blank screens while loading.

---

# 26. Empty States

Every page should include an empty state.

Example

```
No Deposits Found

Create your first deposit.
```

---

# 27. Error States

Example

```
Something went wrong.

Please try again.
```

Include a Retry button where appropriate.

---

# 28. Charts

Preferred Library

```
Recharts
```

Charts

- Line Chart
- Area Chart
- Bar Chart
- Pie Chart
- Donut Chart

Charts should support tooltips and responsive resizing.

---

# 29. Icons

Preferred Library

```
Lucide React
```

Icons should maintain consistent sizing.

Sizes

```
16

20

24

32
```

---

# 30. Avatars

Support

- Image
- Initials
- Default Placeholder

---

# 31. Status Colors

Success

```
Green
```

Pending

```
Orange
```

Rejected

```
Red
```

Information

```
Blue
```

Inactive

```
Gray
```

---

# 32. Animations

Use subtle animations.

Recommended

- Fade
- Slide
- Scale

Avoid excessive motion.

---

# 33. Responsive Breakpoints

```
sm

640px
```

```
md

768px
```

```
lg

1024px
```

```
xl

1280px
```

```
2xl

1536px
```

---

# 34. Accessibility

The UI should support:

- Keyboard Navigation
- Visible Focus States
- Screen Readers
- Semantic HTML
- Sufficient Color Contrast
- ARIA Labels

Target WCAG 2.1 AA compliance.

---

# 35. Page Templates

Reusable page layout

```
Page Header

↓

Action Buttons

↓

Filters

↓

Content

↓

Pagination
```

---

# 36. Dashboard Widgets

Reusable widgets include:

- Statistic Card
- Revenue Card
- Wallet Card
- Portfolio Card
- Profit Card
- Activity Card

Widgets should receive data via props only.

---

# 37. Component Library

Core reusable components

```
Button

Input

Card

Modal

Drawer

Dropdown

Table

Pagination

Tabs

Accordion

Badge

Alert

Avatar

Tooltip

Popover

Toast

Breadcrumb

Sidebar

Navbar

Skeleton

Chart
```

These components should be shared across the application.

---

# 38. Form Validation

Use:

```
React Hook Form

+

Zod
```

Validation should occur:

- Client Side
- Server Side

Error messages should be consistent.

---

# 39. Design Tokens

Centralize all design values.

Example

```
Colors

Typography

Spacing

Radius

Shadow

Animation

Breakpoints

Z-Index
```

These tokens should be reusable throughout the project.

---

# 40. Future UI Enhancements

Future versions may support:

- Dark Mode
- Theme Customizer
- RTL Support
- Multi-language UI
- White Label Branding
- Dashboard Widget Customization
- Glassmorphism Theme
- Mobile Bottom Navigation
- Accessibility Enhancements
- Motion Preferences

---

# 41. Development Rules

The following rules are mandatory.

- Use Tailwind CSS utility classes consistently.
- Use shadcn/ui components as the foundation for all UI elements.
- Create reusable components before creating page-specific components.
- Avoid duplicate UI implementations.
- Keep spacing consistent using the 8px spacing system.
- Use Inter as the primary font.
- All pages must be fully responsive.
- Every interactive component must support loading, disabled, and error states.
- Use React Hook Form and Zod for all forms.
- All colors, spacing, typography, and shadows should be managed through design tokens.
- Accessibility should be considered during the development of every component.
- The design system should be scalable enough to support future themes and branding without major refactoring.
