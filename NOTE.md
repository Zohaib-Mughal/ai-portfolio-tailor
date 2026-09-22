# ARIA Implementation Gaps: Manual vs. Shadcn (Radix UI)

After building the Disclosure, Tabs, and Modal primitives from scratch and reading the generated source code for `shadcn/ui` (which wraps Radix UI primitives), I identified several critical gaps in my manual implementation.

## Gap 1: Body Scroll Locking and Portaling
In my manual `<Modal />`, I rendered the DOM nodes directly inline where the component was invoked and relied on a `fixed` positioning class to center it. I completely missed body scroll locking. 
* **Shadcn/Radix Solution:** Radix uses `createPortal` to append the Dialog to `document.body` to avoid nested `z-index` stacking context conflicts. It also utilizes a `RemoveScroll` utility that adds `overflow: hidden` and precise padding to the `<body>` to prevent the background page from scrolling while the modal is active, and prevents layout shift from disappearing scrollbars.

## Gap 2: Robust Focus Trapping & Outside Clicks
My manual focus trap relies on a rudimentary `querySelectorAll` for focusable elements and checking if `e.key === "Tab"`. If the modal content updates asynchronously or uses custom focusable elements, the trap breaks. I also missed implementing "click outside to close."
* **Shadcn/Radix Solution:** Radix uses a dedicated `<FocusScope>` component that handles complex edge cases (like iframes stealing focus). It also provides built-in `onPointerDownOutside` and `onInteractOutside` event handlers, correctly distinguishing between a user clicking the overlay versus dragging a selection outside the modal.

## Gap 3: Roving Tabindex in Tabs
While my manual `<Tabs />` implementation handles basic left/right arrow key navigation and adjusts the `tabIndex` from `0` to `-1`, it lacks smooth edge-case handling for layout directions.
* **Shadcn/Radix Solution:** Radix’s `Tabs` primitive explicitly accepts a `dir` prop (rtl/ltr) and automatically reverses the ArrowRight/ArrowLeft logic based on the user's language direction. It also implements proper roving tabindex using a specialized Collection context, ensuring that dynamically added or removed tabs don't break the keyboard navigation flow.