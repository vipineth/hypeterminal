# Zustand Rules

Best practices for Zustand stores based on [TkDodo's guidelines](https://tkdodo.eu/blog/working-with-zustand).

## Store Organization

### Never Export the Raw Store
Export only custom hooks, never the store itself. This prevents components from subscribing to the entire store.

```tsx
// Bad - exposes raw store
export { useMyStore };

// Good - only export hooks
export const useValue = () => useMyStore((s) => s.value);
export const useActions = () => useMyStore((s) => s.actions);
```

### Separate Actions from State
Put all actions in an `actions` namespace. Actions are static and never change, so a single hook can expose all of them without performance penalties.

```tsx
const useMyStore = create((set) => ({
  count: 0,
  actions: {
    increment: () => set((s) => ({ count: s.count + 1 })),
    reset: () => set({ count: 0 }),
  },
}));

export const useMyActions = () => useMyStore((s) => s.actions);
```

### Keep Stores Small and Focused
Prefer multiple small stores over one large store. Combine via custom hooks if needed.

## Selector Best Practices

### Prefer Atomic Selectors
Return individual primitives, not objects. Objects create new references on every render.

```tsx
// Good - atomic selectors return primitives
export const useScaleStart = () => useStore((s) => s.scaleStart);
export const useScaleEnd = () => useStore((s) => s.scaleEnd);
export const useScaleLevels = () => useStore((s) => s.scaleLevels);

// Bad - object creates new reference every render
export const useScaleConfig = () => useStore((s) => ({
  start: s.scaleStart,
  end: s.scaleEnd,
  levels: s.scaleLevels,
}));
```

### Use `useShallow` Only When Necessary
If you must return an object (e.g., for component props), use `useShallow`:

```tsx
import { useShallow } from "zustand/react/shallow";

// Acceptable when you need multiple values together
export const useScaleConfig = () =>
  useStore(
    useShallow((s) => ({
      start: s.scaleStart,
      end: s.scaleEnd,
      levels: s.scaleLevels,
    })),
  );
```

But prefer atomic selectors when possible.

## Actions Best Practices

### Model Actions as Events
Put business logic inside actions, not in components. Actions should describe what happened, not be raw setters.

```tsx
// Good - business logic in action
setOrderType: (orderType) => {
  const isTrigger = isTriggerOrderType(orderType);
  set({
    orderType,
    reduceOnly: isTrigger ? true : get().reduceOnly,
    tpSlEnabled: isTrigger ? false : get().tpSlEnabled,
  });
},

// Bad - business logic spread across components
// Component calculates derived state, then calls multiple setters
```

### Avoid Getter Functions in Components
Use `getState()` only outside React (in callbacks, utilities). Inside components, use selector hooks.

```tsx
// Good - for use outside React
export function getOrderEntryState() {
  return useOrderEntryStore.getState();
}

// In components, use hooks
const side = useOrderSide();
```

## Store Scope

### Global vs Scoped Stores
- **Global stores**: App-wide settings, user preferences, auth state
- **Scoped stores**: Component-subtree state that might need multiple instances

For truly component-scoped state that needs isolation, consider Zustand + React Context pattern:

```tsx
const StoreContext = createContext(null);

function StoreProvider({ children }) {
  const [store] = useState(() => createStore());
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
```

## Common Pitfalls

1. **Full store subscriptions**: Always use selectors, never `useStore()` without a selector
2. **Object selectors without shallow**: Creates infinite re-renders
3. **Mixing state types**: Keep server state (React Query), URL state, and client state separate
4. **useEffect for derived state**: Compute derived state directly, don't sync with effects
