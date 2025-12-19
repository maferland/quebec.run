# Mobile Navigation - Potential Improvements

## Critical Issues

1. **Focus trap missing** - Menu doesn't trap focus; keyboard users can tab to elements behind modal
2. **ESC key doesn't close** - Keyboard navigation incomplete
3. **Touch targets too small** - Nav links < 44px height (WCAG 2.5.5 AA violation)
4. **Burger button small on mobile** - Current p-2 (8px) may miss on actual devices

## Visual/UX Improvements

5. **Backdrop too subtle** - bg-black/20 → bg-black/40 for clearer modal context
6. **Animation timing** - 200ms → 150ms feels snappier (industry standard)
7. **Menu positioning edge case** - Fixed top-20 might clip into header on certain scroll positions
8. **Landscape mobile confusion** - At 640px+ landscape, both burger AND desktop nav may appear

## Accessibility Gaps

9. **No focus visible on menu items** - Need clear focus rings
10. **Menu doesn't announce open/closed** - Need aria-live region
11. **Backdrop lacks semantic role** - Should have role="presentation"

## Mobile-Specific

12. **No safe-area handling** - iPhone notch/Dynamic Island not accounted for
13. **Scrolling long menus** - No max-height + overflow handling for short viewports
14. **Landscape orientation** - Menu positioning might be awkward in landscape

## Performance

15. **Animation jank potential** - Using translate might cause repaints; transform: translateZ(0) for GPU acceleration
16. **No reduced-motion support** - Animations should respect prefers-reduced-motion
