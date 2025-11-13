# Design Document

## Overview

This design document outlines the technical approach for refactoring the Coco Loko Açaiteria home page (Index.tsx) to implement a 2x2 grid layout for quick access actions and an auto-sliding carousel for the "Como Funciona" section. The design leverages existing Tailwind CSS utilities, React hooks for carousel state management, and the embla-carousel-react library already present in the project dependencies.

## Architecture

### Component Structure

The refactored Index page will maintain its current single-component architecture with the following internal structure:

```
Index Component
├── Hero Section (Grid Layout)
│   ├── Logo
│   └── Quick Access Grid (2x2)
│       ├── Fazer Pedido Button
│       ├── Consultar Pedido Button
│       ├── Garçom Button
│       └── Gerente Button
└── Features Section (Carousel)
    ├── "Como Funciona" Heading
    └── Carousel Container
        ├── Carousel Viewport
        │   ├── Cliente Card
        │   ├── Garçom Card
        │   └── Gerente Card
        └── Carousel Controls
            └── Pagination Dots
```

### Technology Choices

1. **Carousel Library**: embla-carousel-react (already in dependencies)
   - Lightweight and performant
   - Supports touch gestures natively
   - Provides auto-play plugin
   - Highly customizable

2. **Styling**: Tailwind CSS with existing utility classes
   - Maintains consistency with current design system
   - Responsive utilities for grid layout
   - Custom animations for carousel transitions

3. **State Management**: React hooks (useState, useEffect, useCallback)
   - Manages carousel auto-play state
   - Handles user interaction pause logic
   - Controls pagination dot highlighting

## Components and Interfaces

### Index Component Modifications

The Index component will be refactored to include:

#### Grid Layout Section

```typescript
// Grid container with responsive classes
<div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
  {/* Four action buttons */}
</div>
```

Key design decisions:
- Use `grid-cols-2` for consistent 2x2 layout across all mobile sizes
- Maintain existing button structure (icon + label)
- Remove "Acesso Rápido" heading
- Adjust spacing to compensate for removed heading

#### Carousel Section

```typescript
interface CarouselState {
  selectedIndex: number;
  scrollSnaps: number[];
}

// Embla carousel setup
const [emblaRef, emblaApi] = useEmblaCarousel(
  { loop: true, align: 'center' },
  [Autoplay({ delay: 5000, stopOnInteraction: true })]
);
```

Key design decisions:
- Loop enabled for infinite scrolling
- Center alignment for single card display
- 5-second delay between auto-slides
- Auto-play stops on user interaction (swipe, dot click)
- Resumes after 10 seconds of inactivity

### Carousel Controls Component

Pagination dots will be implemented inline within the Index component:

```typescript
const DotButton = ({ selected, onClick }: DotButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-3 h-3 rounded-full mx-1 transition-all ${
      selected ? 'bg-purple-900 w-8' : 'bg-purple-300'
    }`}
    aria-label={`Go to slide ${index + 1}`}
  />
);
```

Key design decisions:
- Active dot expands horizontally (w-8) for clear indication
- Inactive dots remain circular (w-3 h-3)
- Purple color scheme matches brand
- Accessible labels for screen readers
- Minimum 44x44px touch target (achieved through padding)

## Data Models

No new data models are required. The component will continue to use:

- Static content for action buttons (labels, icons, routes)
- Static content for role cards (Cliente, Garçom, Gerente descriptions)

## Layout Specifications

### Quick Access Grid

**Desktop/Tablet (sm and above):**
```css
- Container: max-w-3xl (768px)
- Grid: 2 columns
- Gap: 1.5rem (24px)
- Card min-height: 140px
- Card padding: 2rem vertical
```

**Mobile:**
```css
- Container: max-w-3xl (768px)
- Grid: 2 columns
- Gap: 1rem (16px)
- Card min-height: 120px
- Card padding: 1.5rem vertical
```

### Carousel Layout

**Container:**
```css
- Max-width: 6xl (1152px)
- Padding: 1rem horizontal (mobile), 1rem (desktop)
- Overflow: hidden
```

**Viewport:**
```css
- Display: flex
- Overflow: hidden
- Touch-action: pan-y (allows vertical scroll, horizontal swipe)
```

**Slides:**
```css
- Flex: 0 0 100% (full width)
- Min-width: 0
- Padding: 0 1rem (creates peek effect)
```

**Cards:**
```css
- Padding: 1.5rem (mobile), 2rem (desktop)
- Border-radius: 1rem (rounded-2xl)
- Shadow: lg with hover xl
- Border: 2px with role-specific color
```

## Carousel Behavior Specification

### Auto-Play Logic

```typescript
// Pseudo-code for auto-play behavior
const autoplayOptions = {
  delay: 5000,              // 5 seconds between slides
  stopOnInteraction: true,  // Pause on swipe/click
  stopOnMouseEnter: false,  // Don't pause on hover (mobile-first)
};

// Resume logic
useEffect(() => {
  if (!emblaApi) return;
  
  let resumeTimer: NodeJS.Timeout;
  
  const handleInteraction = () => {
    // Pause auto-play
    emblaApi.plugins().autoplay?.stop();
    
    // Resume after 10 seconds
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      emblaApi.plugins().autoplay?.play();
    }, 10000);
  };
  
  emblaApi.on('pointerDown', handleInteraction);
  
  return () => {
    clearTimeout(resumeTimer);
    emblaApi.off('pointerDown', handleInteraction);
  };
}, [emblaApi]);
```

### Slide Transition

- **Duration**: 300ms
- **Easing**: ease-in-out
- **Transform**: translateX with GPU acceleration
- **Initial animation**: Trigger first auto-slide after 2 seconds to demonstrate motion

### Pagination Interaction

```typescript
const scrollTo = useCallback(
  (index: number) => emblaApi?.scrollTo(index),
  [emblaApi]
);

// Update selected index on scroll
useEffect(() => {
  if (!emblaApi) return;
  
  const onSelect = () => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  };
  
  emblaApi.on('select', onSelect);
  onSelect();
  
  return () => emblaApi.off('select', onSelect);
}, [emblaApi]);
```

## Responsive Design Strategy

### Breakpoints

- **Mobile**: < 640px (default)
- **Tablet**: ≥ 640px (sm)
- **Desktop**: ≥ 768px (md)
- **Large Desktop**: ≥ 1024px (lg)

### Grid Adaptations

| Breakpoint | Columns | Gap | Card Height | Font Size |
|------------|---------|-----|-------------|-----------|
| Mobile     | 2       | 16px| 120px       | 14px      |
| Tablet+    | 2       | 24px| 140px       | 16px      |

The grid remains 2x2 across all breakpoints for consistency and optimal space usage.

### Carousel Adaptations

| Breakpoint | Visible Cards | Peek Amount | Padding |
|------------|---------------|-------------|---------|
| Mobile     | 1             | 20px        | 16px    |
| Tablet+    | 1             | 40px        | 24px    |

Peek amount refers to the partial visibility of the next card, creating a visual hint for swiping.

## Accessibility Considerations

### Keyboard Navigation

```typescript
// Carousel keyboard controls
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft') {
    emblaApi?.scrollPrev();
  } else if (event.key === 'ArrowRight') {
    emblaApi?.scrollNext();
  }
};

// Apply to carousel container
<div onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Como Funciona carousel">
```

### ARIA Labels

- Carousel container: `role="region"` with `aria-label="Como Funciona carousel"`
- Pagination dots: `aria-label="Go to slide {n}"` with `aria-current="true"` for active
- Cards: Maintain existing semantic HTML structure

### Focus Management

- Ensure carousel container is focusable (`tabIndex={0}`)
- Pagination dots have visible focus indicators
- Focus moves to selected slide on dot click

### Color Contrast

All existing color combinations meet WCAG AA standards:
- Purple text on white: 12.6:1 (AAA)
- White text on purple: 12.6:1 (AAA)
- White text on cyan: 4.5:1 (AA)
- White text on green: 4.5:1 (AA)
- Purple text on yellow: 8.6:1 (AAA)

## Animation and Transitions

### Grid Buttons

Maintain existing hover effects:
```css
- Transform: scale(1.05) on hover
- Shadow: lg → xl on hover
- Transition: all 200ms ease
```

### Carousel Slides

```css
- Transform: translateX with GPU acceleration
- Transition: transform 300ms ease-in-out
- Opacity: 1 (no fade effects)
```

### Pagination Dots

```css
- Width: 12px → 32px (active)
- Background: purple-300 → purple-900 (active)
- Transition: all 300ms ease
```

### Initial Load Animation

```typescript
// Trigger first auto-slide after 2 seconds to demonstrate motion
useEffect(() => {
  if (!emblaApi) return;
  
  const timer = setTimeout(() => {
    emblaApi.scrollNext();
  }, 2000);
  
  return () => clearTimeout(timer);
}, [emblaApi]);
```

## Error Handling

### Carousel Initialization Failure

```typescript
useEffect(() => {
  if (!emblaApi) {
    console.warn('Carousel failed to initialize, falling back to static display');
    return;
  }
  // ... carousel setup
}, [emblaApi]);
```

Fallback behavior:
- Display all three cards in a vertical stack (original layout)
- Hide pagination dots
- No auto-play functionality

### Touch Event Conflicts

Ensure carousel doesn't interfere with page scrolling:
```css
touch-action: pan-y; /* Allow vertical scroll, capture horizontal swipe */
```

## Performance Considerations

### Lazy Loading

Not applicable - all content is above the fold and should load immediately.

### Animation Performance

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, or `margin`
- Use `will-change: transform` sparingly on carousel slides

### Bundle Size

embla-carousel-react is already in dependencies:
- Core: ~5KB gzipped
- Autoplay plugin: ~1KB gzipped
- Total impact: Minimal (already loaded)

## Testing Strategy

### Unit Tests

Not required for this refactor as it's primarily a layout and interaction change. The component maintains the same navigation behavior.

### Manual Testing Checklist

1. **Grid Layout**
   - [ ] Four buttons display in 2x2 grid
   - [ ] "Acesso Rápido" heading is removed
   - [ ] Cards have equal dimensions
   - [ ] Spacing is consistent
   - [ ] All buttons navigate correctly

2. **Carousel Functionality**
   - [ ] Carousel displays one card at a time
   - [ ] Auto-slide advances every 5 seconds
   - [ ] Swipe gestures work on mobile
   - [ ] Pagination dots indicate current slide
   - [ ] Clicking dots navigates to correct slide
   - [ ] Auto-play pauses on interaction
   - [ ] Auto-play resumes after 10 seconds

3. **Responsive Behavior**
   - [ ] Layout adapts correctly at 320px width
   - [ ] Layout adapts correctly at 640px width
   - [ ] Layout adapts correctly at 1024px width
   - [ ] No horizontal scrolling occurs

4. **Accessibility**
   - [ ] Keyboard navigation works (arrow keys)
   - [ ] Focus indicators are visible
   - [ ] Screen reader announces carousel correctly
   - [ ] Touch targets are at least 44x44px

5. **Visual Consistency**
   - [ ] Colors match existing design
   - [ ] Fonts and sizes are consistent
   - [ ] Shadows and borders are preserved
   - [ ] Hover effects work correctly

### Browser Testing

- Chrome (mobile and desktop)
- Safari (iOS and macOS)
- Firefox (desktop)
- Edge (desktop)

### Device Testing

- iPhone (Safari)
- Android phone (Chrome)
- iPad (Safari)
- Desktop (1920x1080)

## Migration Notes

### Breaking Changes

None. This is a visual refactor that maintains all existing functionality and navigation behavior.

### Backwards Compatibility

Fully backwards compatible. No API changes, no route changes, no data structure changes.

### Rollback Plan

If issues arise, the original Index.tsx can be restored from version control. No database migrations or configuration changes are required.

## Implementation Phases

### Phase 1: Grid Layout Refactor
- Remove "Acesso Rápido" heading
- Convert button container to 2x2 grid
- Adjust spacing and sizing
- Test responsive behavior

### Phase 2: Carousel Implementation
- Install/verify embla-carousel-react dependency
- Create carousel structure
- Implement basic slide functionality
- Add pagination dots

### Phase 3: Auto-Play and Interactions
- Implement auto-play with 5-second delay
- Add pause on interaction logic
- Add resume after 10 seconds logic
- Implement keyboard navigation

### Phase 4: Polish and Testing
- Add initial animation hint
- Fine-tune transitions and timing
- Accessibility audit
- Cross-browser testing
- Mobile device testing

## Future Enhancements

Potential improvements for future iterations (not in scope):

1. **Carousel Indicators**: Add left/right arrow buttons for desktop users
2. **Swipe Indicators**: Show subtle swipe hint animation on first load
3. **Analytics**: Track which carousel slides users interact with most
4. **A/B Testing**: Test different auto-play intervals for optimal engagement
5. **Prefers-Reduced-Motion**: Respect user's motion preferences by disabling auto-play
