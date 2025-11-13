# Design System – Nick a Deal AI Admin

This document defines the design tokens, component usage, and visual guidelines for the application.

---

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Components](#components)
5. [Layout](#layout)
6. [Icons](#icons)

---

## Colors

The application uses a theme system (light/dark mode) via Next Themes and Tailwind CSS.

### Color Palette

```css
/* Light Mode */
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%
--card: 0 0% 100%
--card-foreground: 222.2 84% 4.9%
--popover: 0 0% 100%
--popover-foreground: 222.2 84% 4.9%
--primary: 222.2 47.4% 11.2%
--primary-foreground: 210 40% 98%
--secondary: 210 40% 96.1%
--secondary-foreground: 222.2 47.4% 11.2%
--muted: 210 40% 96.1%
--muted-foreground: 215.4 16.3% 46.9%
--accent: 210 40% 96.1%
--accent-foreground: 222.2 47.4% 11.2%
--destructive: 0 84.2% 60.2%
--destructive-foreground: 210 40% 98%
--border: 214.3 31.8% 91.4%
--input: 214.3 31.8% 91.4%
--ring: 222.2 84% 4.9%

/* Dark Mode (automatic inversion) */
```

### Usage

Use Tailwind classes for colors:

```tsx
// Backgrounds
<div className="bg-background">  // Page background
<div className="bg-card">         // Card background
<div className="bg-muted">        // Muted background

// Text
<p className="text-foreground">      // Primary text
<p className="text-muted-foreground"> // Secondary text

// Buttons
<Button variant="default">      // Primary button
<Button variant="secondary">    // Secondary button
<Button variant="destructive">  // Delete/danger actions

// Borders
<div className="border border-border">
```

### Semantic Colors

- **Primary**: Main actions, links
- **Secondary**: Secondary actions
- **Destructive**: Delete, danger actions (red)
- **Muted**: Disabled states, subtle backgrounds
- **Success**: Green (custom, use `text-green-600`)

---

## Typography

### Font Stack

Default system fonts (no custom font loaded):
```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Font Sizes (Tailwind)

```tsx
// Headings
<h1 className="text-3xl font-bold">     // Page titles
<h2 className="text-2xl font-semibold"> // Section titles
<h3 className="text-xl font-semibold">  // Subsection titles
<h4 className="text-lg font-semibold">  // Card titles

// Body
<p className="text-base">               // Default body text
<p className="text-sm">                 // Small text
<p className="text-xs text-muted-foreground"> // Helper text
```

### Font Weights

- **Bold**: `font-bold` (700) - Headings
- **Semibold**: `font-semibold` (600) - Section titles
- **Medium**: `font-medium` (500) - Emphasized text
- **Normal**: `font-normal` (400) - Body text

### Line Heights

Default line heights (Tailwind default):
- Tight: `leading-tight`
- Normal: `leading-normal`
- Relaxed: `leading-relaxed`

---

## Spacing

Use Tailwind spacing scale (multiples of 4px):

```tsx
// Padding
<div className="p-4">        // 16px all sides
<div className="px-4 py-2">  // 16px horizontal, 8px vertical
<div className="p-6">        // 24px all sides
<div className="p-8">        // 32px all sides

// Margin
<div className="mb-4">       // 16px bottom margin
<div className="mt-2">       // 8px top margin
<div className="space-y-4">  // Vertical spacing between children

// Gaps (Flexbox/Grid)
<div className="gap-4">      // 16px gap
<div className="gap-2">      // 8px gap
```

### Common Spacing Patterns

```tsx
// Card padding
<CardContent className="p-6">

// Form spacing
<div className="space-y-4">  // Between form fields

// Section spacing
<section className="space-y-6">  // Between sections

// List spacing
<ul className="space-y-2">  // Between list items
```

---

## Components

### Buttons

**Variants:**
- `default` - Primary actions
- `secondary` - Secondary actions
- `outline` - Outlined button
- `ghost` - Minimal button
- `destructive` - Delete/danger actions

```tsx
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

**Sizes:**
- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Icon-only button

```tsx
<Button size="sm">Small</Button>
<Button size="icon"><Icon /></Button>
```

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Forms

```tsx
<div className="space-y-4">
  <div>
    <Label htmlFor="input">Label</Label>
    <Input id="input" type="text" />
  </div>
  <div>
    <Label htmlFor="textarea">Description</Label>
    <Textarea id="textarea" rows={4} />
  </div>
</div>
```

### Tables

```tsx
<table className="w-full">
  <thead className="bg-muted">
    <tr>
      <th className="px-4 py-3 text-left text-sm font-medium">Column</th>
    </tr>
  </thead>
  <tbody className="divide-y">
    <tr className="hover:bg-muted/50">
      <td className="px-4 py-3">Data</td>
    </tr>
  </tbody>
</table>
```

### Dialogs

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Layout

### Page Structure

```tsx
<DashboardLayout>
  <div className="space-y-6">
    {/* Page header */}
    <div>
      <h1 className="text-3xl font-bold">Page Title</h1>
      <p className="text-muted-foreground">Description</p>
    </div>

    {/* Content sections */}
    <Card>
      {/* Content */}
    </Card>
  </div>
</DashboardLayout>
```

### Grid Layouts

```tsx
// Two columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Three columns
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Flexbox

```tsx
// Row
<div className="flex items-center gap-4">

// Space between
<div className="flex items-center justify-between">

// Column
<div className="flex flex-col gap-4">
```

---

## Icons

Use **Lucide React** icons:

```tsx
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle2,
  XCircle 
} from "lucide-react";

<Search className="h-4 w-4" />
<Plus className="mr-2 h-4 w-4" />
```

### Common Icons

- **Actions**: `Plus`, `Edit`, `Trash2`, `Save`, `RefreshCw`
- **Status**: `CheckCircle2`, `XCircle`, `AlertCircle`, `Loader2`
- **Navigation**: `Search`, `Settings`, `Key`, `Users`, `FileText`
- **AI**: `Sparkles` (for AI features)

### Icon Sizes

- `h-4 w-4` - Small (inline with text)
- `h-5 w-5` - Medium (buttons)
- `h-6 w-6` - Large (headers)
- `h-8 w-8` - Extra large (feature icons)

---

## Component Patterns

### Loading States

```tsx
{loading ? (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
) : (
  // Content
)}
```

### Error States

```tsx
{error && (
  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
    <AlertCircle className="h-4 w-4" />
    <span>{error}</span>
  </div>
)}
```

### Success States

```tsx
{success && (
  <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
    <CheckCircle2 className="h-4 w-4" />
    <span>{success}</span>
  </div>
)}
```

### Empty States

```tsx
{items.length === 0 ? (
  <div className="rounded-lg border bg-card p-8 text-center">
    <p className="text-muted-foreground">
      No items found. Create your first item to get started.
    </p>
    <Button className="mt-4">
      <Plus className="mr-2 h-4 w-4" />
      Add Item
    </Button>
  </div>
) : (
  // List of items
)}
```

---

## Responsive Design

### Breakpoints (Tailwind)

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Mobile-First

```tsx
// Stack on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">

// Single column mobile, multiple desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Hide on mobile
<div className="hidden md:block">
```

---

## Accessibility

### Semantic HTML

- Use proper heading hierarchy (`h1` → `h2` → `h3`)
- Use semantic elements (`<nav>`, `<main>`, `<section>`)
- Label form inputs properly

### Keyboard Navigation

- All interactive elements keyboard accessible
- Focus states visible (Tailwind default)
- Tab order logical

### ARIA Labels

```tsx
<Button aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
</Button>
```

---

## Dark Mode

Dark mode is handled automatically by Next Themes:
- Uses system preference by default
- Users can toggle manually
- All components support both themes

No special dark mode styling needed - Tailwind handles it automatically via CSS variables.

---

**Last Updated**: After Step 14 completion

