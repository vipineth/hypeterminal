## React 19 Code Review Checklist

Use this checklist when reviewing PRs that modify React components.

### useEffect Anti-Patterns

- [ ] **No derived state in useEffect** - State calculated from props/other state should be computed during render, not in useEffect
  ```tsx
  // BAD
  useEffect(() => setFiltered(items.filter(...)), [items])

  // GOOD
  const filtered = items.filter(...)
  ```

- [ ] **No state reset in useEffect** - Use `key` prop to reset component state when props change
  ```tsx
  // BAD
  useEffect(() => { setFormData({}); }, [userId])

  // GOOD
  <FormComponent key={userId} />
  ```

- [ ] **No localStorage/sessionStorage reads in useEffect** - Initialize state from storage
  ```tsx
  // BAD
  useEffect(() => { setData(localStorage.getItem('key')); }, [])

  // GOOD
  const [data] = useState(() => localStorage.getItem('key'))
  ```

- [ ] **No event handling logic in useEffect** - Put it in event handlers
  ```tsx
  // BAD
  useEffect(() => { if (submitted) navigate('/success'); }, [submitted])

  // GOOD
  const handleSubmit = () => { navigate('/success'); }
  ```

- [ ] **useEffect only for external system sync** - WebSockets, DOM APIs, third-party libs

### useMemo/useCallback

- [ ] **No useMemo for simple calculations** - React 19 compiler handles this
  ```tsx
  // BAD
  const total = useMemo(() => a + b, [a, b])

  // GOOD
  const total = a + b
  ```

- [ ] **No useCallback for simple event handlers** - Unless passed to memoized children
  ```tsx
  // BAD (if Button is not memoized)
  const handleClick = useCallback(() => setCount(c => c + 1), [])

  // GOOD
  const handleClick = () => setCount(c => c + 1)
  ```

- [ ] **Keep useMemo for expensive operations** - Array sorting, filtering large datasets, complex transformations

### React 19 Patterns

- [ ] **No forwardRef** - Pass `ref` as regular prop
  ```tsx
  // BAD
  const Input = forwardRef((props, ref) => <input ref={ref} />)

  // GOOD
  const Input = ({ ref, ...props }) => <input ref={ref} {...props} />
  ```

- [ ] **Use new hooks where applicable**
  - `useActionState` for form state management
  - `useOptimistic` for optimistic UI updates
  - `useFormStatus` to access parent form state
  - `use()` to read promises in render

### Server/Client Components

- [ ] **Default to Server Components** - No directive needed
- [ ] **'use client' only when needed** - useState, useEffect, event handlers, browser APIs
- [ ] **'use server' for Server Actions** - Database operations, mutations

### Performance

- [ ] **Virtualize long lists** - Use `@tanstack/react-virtual` for 100+ items
- [ ] **Lazy load heavy components** - `React.lazy()` with `Suspense`
- [ ] **Debounce expensive operations** - Search inputs, API calls

---

**Reference**: See `react-19-guidelines.md` for detailed examples and explanations.
