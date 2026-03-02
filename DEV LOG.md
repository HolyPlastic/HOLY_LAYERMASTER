# DEV LOG

---

### 2024-07-29: Responsive Narrow Layout

**Objective:** Implement a responsive layout that adapts the UI for narrow, vertically-docked panel configurations.

**Changes:**

1.  **`index.html`**: Added `id="stateRow"` to the `div.row` containing the Layer States controls. This provides a stable, specific hook for CSS targeting, independent of class structure.

2.  **`css/style.css`**: Appended a new CSS block targeting elements when a `.narrow` class is present on the `<body>`. These rules use `flex-wrap: wrap` and the `order` property to reflow horizontal rows into vertical stacks. This is particularly important for the memory bank rows and the layer state controls, ensuring inputs and buttons remain accessible in a constrained width.

3.  **`js/main.js`**: Appended a self-executing anonymous function that initializes a `ResizeObserver`.
    *   **Why `ResizeObserver`?**: This is a modern and highly efficient browser API for reacting to element size changes. It avoids the performance cost and potential lag of traditional `setInterval` or `window.onresize` polling.
    *   **Logic**: The observer monitors the `<body>` element. If the body's content width drops below a `200px` breakpoint, it adds the `.narrow` class. If it goes above, it removes the class. This dynamically toggles the responsive styles defined in the CSS.