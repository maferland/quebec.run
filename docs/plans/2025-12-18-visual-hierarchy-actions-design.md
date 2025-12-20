# Visual Hierarchy of Actions Design

## Overview

Establish consistent, accessible action patterns across the entire app. Text-first approach replaces icon-only buttons, clickable titles signal navigation, context-appropriate treatments for different UI scenarios.

## Principles

1. **Text-first actions**: Labels always visible, icons enhance but never replace
2. **Clickable titles**: Primary color + hover underline signals navigation
3. **Context-appropriate patterns**: Different UI contexts get appropriate treatments
4. **Consistent destructive styling**: Always `variant="destructive"` for delete

## Button Patterns

| Context           | Treatment                                                          |
| ----------------- | ------------------------------------------------------------------ |
| Delete (anywhere) | `variant="destructive"` + "Delete" + `<Trash />`                   |
| Edit              | `variant="outline"` or `variant="default"` + "Edit" + `<Pencil />` |
| Primary action    | `variant="default"`                                                |
| Secondary action  | `variant="outline"`                                                |
| Overflow trigger  | `<MoreVertical>` icon-only (exception)                             |

## Icon Usage

**Include icons for:**

- Delete (trash)
- Edit (pencil)
- Add/Create (plus)
- Save (check)

**Skip icons for:**

- View, Cancel, Back, generic actions where text is self-explanatory

**Placement:** After text (`Delete <Trash />`)

**Responsive behavior:** Desktop shows icon+text, mobile can drop icons to save space

## Linked Titles

Titles in lists/cards that navigate should be visually distinct:

- **Color:** Current `text-primary`
- **Hover:** Add underline (`hover:underline`)
- **Context:** Lists, tables, cards where title navigates to detail view

```tsx
<Link href={`/clubs/${club.slug}`}>
  <h2 className="text-xl font-heading font-bold text-primary hover:underline">
    {club.name}
  </h2>
</Link>
```

**Non-clickable titles:** Detail pages, forms, modals - titles stay static (no hover state).

## Delete Confirmation

Tiered approach based on impact:

| Entity | Confirmation Method                  | Reason                             |
| ------ | ------------------------------------ | ---------------------------------- |
| Clubs  | Custom `<ConfirmDeleteDialog>` modal | High-impact, may cascade to events |
| Events | Browser `confirm()`                  | Lower-impact, single entity        |

**Modal content for clubs:**

- Clear title: "Delete Club"
- Impact warning: "This will permanently delete [Club Name] and all associated data"
- Two buttons: "Cancel" (outline) and "Delete" (destructive with trash icon)

## Multi-Action Patterns

**Overflow menus (3+ actions):**

- Trigger: `<MoreVertical>` icon button (exception to text-first rule)
- Size: `size="sm"` with `h-8 w-8 p-0`
- Content: Text actions with semantic colors (`text-error` for destructive)

**When NOT to use dropdown:**

- Single action: Just show the button
- Two actions with clear hierarchy: Show both as buttons
- Detail pages: Use explicit button group, not overflow menu

## Implementation Scope

### Components to Update

1. `delete-event-button.tsx` - Add "Delete" text label
2. `delete-club-button.tsx` - Add "Delete" text label + create modal
3. `club-card.tsx` - Add hover underline to title
4. `event-card.tsx` - Review title clickability
5. `staff-actions-menu.tsx` - Already follows text-in-dropdown pattern (ok)

### New Components

1. `<ConfirmDeleteDialog>` - Reusable delete confirmation modal for high-impact entities
