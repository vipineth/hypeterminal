# React 19 Best Practices & Refactoring Guidelines

> A comprehensive guide for writing modern, performant React 19 code.
> Treat these patterns as law. Violate them only with explicit justification.

---

## Table of Contents

1. [The React Compiler Revolution](#the-react-compiler-revolution)
2. [useMemo & useCallback - The New Rules](#usememo--usecallback---the-new-rules)
3. [useEffect - Avoid Like The Plague](#useeffect---avoid-like-the-plague)
4. [New React 19 Hooks](#new-react-19-hooks)
5. [Refs - forwardRef is Dead](#refs---forwardref-is-dead)
6. [Server & Client Components](#server--client-components)
7. [State Management Patterns](#state-management-patterns)
8. [Performance Patterns](#performance-patterns)
9. [Migration Checklist](#migration-checklist)

---

## The React Compiler Revolution

React 19's compiler automatically memoizes components, hooks, and values. This fundamentally changes how we write React code.

### What the Compiler Does Automatically

- Memoizes all components (equivalent to wrapping everything in `memo()`)
- Stabilizes function and object identities when safe
- Hoists and caches pure computations tied to stable inputs
- Prevents unnecessary re-renders when inputs haven't logically changed

### The Golden Rule

**If the compiler can optimize it, let it. Don't fight the compiler with manual optimizations.**

---

## useMemo & useCallback - The New Rules

### When to REMOVE (Most Cases)

```tsx
// ❌ BAD - Unnecessary in React 19
const MemoizedComponent = () => {
  const [count, setCount] = useState(0);

  // Remove this - compiler handles it
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  // Remove this - compiler handles it
  const expensiveValue = useMemo(() => {
    return items.filter(item => item.active);
  }, [items]);

  return <Button onClick={handleClick}>{expensiveValue.length}</Button>;
};

// ✅ GOOD - Let the compiler optimize
const CleanComponent = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(c => c + 1);
  };

  const activeItems = items.filter(item => item.active);

  return <Button onClick={handleClick}>{activeItems.length}</Button>;
};
```

### When to KEEP Manual Memoization

Only use `useMemo`/`useCallback` in these specific scenarios:

#### 1. Third-Party Library Constraints

```tsx
// ✅ KEEP - External library requires stable reference
const MapComponent = () => {
  // react-map-gl compares callback identity externally
  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  return <Map onMove={onMove} />;
};
```

#### 2. Non-Pure Computations

```tsx
// ✅ KEEP - Computation touches external state/randomness
const RandomizedList = ({ items }) => {
  // Compiler won't optimize impure functions
  const shuffledItems = useMemo(() => {
    return [...items].sort(() => Math.random() - 0.5);
  }, [items]); // Only shuffle when items change

  return <List data={shuffledItems} />;
};
```

#### 3. State Library Selectors

```tsx
// ✅ KEEP - Zustand/Redux selector memoization
const useFilteredTrades = () => {
  return useStore(
    useCallback(
      (state) => state.trades.filter(t => t.status === 'open'),
      []
    )
  );
};
```

#### 4. Expensive Computations with Profiled Evidence

```tsx
// ✅ KEEP - Only after profiling proves necessity
const ChartComponent = ({ data }) => {
  // Profiler showed 50ms+ computation time
  const processedData = useMemo(() => {
    return heavyDataTransformation(data); // Measured: 80ms
  }, [data]);

  return <Chart data={processedData} />;
};
```

### Migration Strategy

1. **Profile first** - Measure commit time and re-render counts
2. **Remove aggressively** - Delete `useMemo`/`useCallback` calls
3. **Profile again** - Compare metrics
4. **Restore selectively** - Only add back what measurably helps

---

## useEffect - Avoid Like The Plague

`useEffect` is the most overused and misunderstood hook. In React 19, it should be **extremely rare**.

### The Core Principle

> **useEffect is for synchronizing with EXTERNAL systems AFTER render. That's it.**

If you're not syncing with something outside React (DOM APIs, websockets, analytics, third-party libraries), you probably don't need `useEffect`.

### ❌ Anti-Patterns to Eliminate

#### 1. Deriving State from Props/State

```tsx
// ❌ TERRIBLE - State derived from props
const BadComponent = ({ items }) => {
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    setFilteredItems(items.filter(i => i.active));
  }, [items]);

  return <List items={filteredItems} />;
};

// ✅ GOOD - Calculate during render
const GoodComponent = ({ items }) => {
  const filteredItems = items.filter(i => i.active);
  return <List items={filteredItems} />;
};
```

#### 2. Resetting State on Prop Change

```tsx
// ❌ BAD - useEffect to reset state
const BadForm = ({ userId }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData({});
  }, [userId]);

  return <Form data={formData} />;
};

// ✅ GOOD - Use key to reset component
const GoodForm = ({ userId }) => {
  return <FormInner key={userId} userId={userId} />;
};

const FormInner = ({ userId }) => {
  const [formData, setFormData] = useState({});
  return <Form data={formData} />;
};
```

#### 3. Fetching Data in useEffect

```tsx
// ❌ BAD - Manual fetch in useEffect
const BadDataComponent = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchData(id)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <Error />;
  return <Display data={data} />;
};

// ✅ GOOD - Use React 19's `use` or data fetching library
const GoodDataComponent = ({ id }) => {
  const { data, isLoading, error } = useQuery(['data', id], () => fetchData(id));

  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  return <Display data={data} />;
};

// ✅ BEST - Server Component (when possible)
async function BestDataComponent({ id }) {
  const data = await fetchData(id);
  return <Display data={data} />;
}
```

#### 4. Handling User Events

```tsx
// ❌ BAD - useEffect to respond to state change from event
const BadComponent = () => {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) {
      analytics.track('form_submitted');
      router.push('/success');
    }
  }, [submitted]);

  const handleSubmit = () => setSubmitted(true);

  return <button onClick={handleSubmit}>Submit</button>;
};

// ✅ GOOD - Handle in the event handler
const GoodComponent = () => {
  const handleSubmit = () => {
    analytics.track('form_submitted');
    router.push('/success');
  };

  return <button onClick={handleSubmit}>Submit</button>;
};
```

#### 5. Initializing Application State

```tsx
// ❌ BAD - useEffect for one-time initialization
const BadApp = () => {
  useEffect(() => {
    initializeAnalytics();
    loadUserPreferences();
  }, []);

  return <App />;
};

// ✅ GOOD - Initialize outside React
initializeAnalytics();
loadUserPreferences();

const GoodApp = () => {
  return <App />;
};

// Or use a module-level flag
let initialized = false;

const AlsoGoodApp = () => {
  if (!initialized) {
    initializeAnalytics();
    loadUserPreferences();
    initialized = true;
  }
  return <App />;
};
```

#### 6. Notifying Parent Components

```tsx
// ❌ BAD - useEffect to notify parent
const BadChild = ({ onItemsChange }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    onItemsChange(items);
  }, [items, onItemsChange]);

  return <ItemList items={items} />;
};

// ✅ GOOD - Lift state up or call in event handler
const GoodChild = ({ items, onItemsChange }) => {
  const handleAdd = (item) => {
    onItemsChange([...items, item]);
  };

  return <ItemList items={items} onAdd={handleAdd} />;
};
```

### ✅ Valid useEffect Uses (The Only Acceptable Cases)

#### 1. Synchronizing with External DOM APIs

```tsx
// ✅ VALID - Managing focus
const AutoFocusInput = () => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
};
```

#### 2. WebSocket/EventSource Connections

```tsx
// ✅ VALID - External subscription
const WebSocketComponent = ({ channel }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`wss://example.com/${channel}`);
    ws.onmessage = (e) => setMessages(m => [...m, e.data]);

    return () => ws.close();
  }, [channel]);

  return <MessageList messages={messages} />;
};
```

#### 3. Third-Party Library Integration

```tsx
// ✅ VALID - Chart.js, Map libraries, etc.
const ChartComponent = ({ data }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: data,
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return <canvas ref={canvasRef} />;
};
```

#### 4. Browser APIs (IntersectionObserver, ResizeObserver)

```tsx
// ✅ VALID - Browser observation APIs
const LazyImage = ({ src }) => {
  const imgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (imgRef.current) observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return <img ref={imgRef} src={isVisible ? src : placeholder} />;
};
```

### useEffect Checklist

Before writing `useEffect`, ask yourself:

- [ ] Am I deriving state? → **Calculate during render**
- [ ] Am I responding to a user event? → **Handle in event handler**
- [ ] Am I fetching data? → **Use a data fetching library or Server Component**
- [ ] Am I syncing with a parent? → **Lift state up**
- [ ] Am I initializing something? → **Do it outside React**
- [ ] Am I syncing with an EXTERNAL system? → **OK, use useEffect**

---

## New React 19 Hooks

### useActionState - Replace Manual Form State

```tsx
// ❌ OLD WAY - Multiple useState hooks
const OldForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = async (formData) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await submitForm(formData);
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setIsPending(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
};

// ✅ NEW WAY - useActionState
const NewForm = () => {
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      try {
        const result = await submitForm(formData);
        return { data: result, error: null };
      } catch (e) {
        return { data: null, error: e.message };
      }
    },
    { data: null, error: null }
  );

  return (
    <form action={formAction}>
      {state.error && <Error message={state.error} />}
      <button disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### useOptimistic - Instant UI Feedback

```tsx
// ❌ OLD WAY - Wait for server response
const OldLikeButton = ({ initialLikes }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isPending, setIsPending] = useState(false);

  const handleLike = async () => {
    setIsPending(true);
    try {
      const newLikes = await likePost(); // User waits...
      setLikes(newLikes);
    } finally {
      setIsPending(false);
    }
  };

  return <button onClick={handleLike} disabled={isPending}>{likes}</button>;
};

// ✅ NEW WAY - Optimistic update
const NewLikeButton = ({ initialLikes }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (current, increment) => current + increment
  );

  const handleLike = async () => {
    addOptimisticLike(1); // Instant feedback!
    try {
      const newLikes = await likePost();
      setLikes(newLikes);
    } catch {
      // Automatically reverts on error
    }
  };

  return <button onClick={handleLike}>{optimisticLikes}</button>;
};
```

### use - Read Promises in Render

```tsx
// ❌ OLD WAY - useEffect + useState
const OldComponent = ({ dataPromise }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    dataPromise.then(setData);
  }, [dataPromise]);

  if (!data) return <Loading />;
  return <Display data={data} />;
};

// ✅ NEW WAY - use() hook
const NewComponent = ({ dataPromise }) => {
  const data = use(dataPromise); // Suspends until resolved
  return <Display data={data} />;
};

// Wrap with Suspense
<Suspense fallback={<Loading />}>
  <NewComponent dataPromise={fetchData()} />
</Suspense>
```

### useFormStatus - Access Parent Form State

```tsx
// ✅ Access form state from any child component
const SubmitButton = () => {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
};

const Form = () => {
  return (
    <form action={serverAction}>
      <input name="email" />
      <SubmitButton /> {/* Automatically knows form state */}
    </form>
  );
};
```

---

## Refs - forwardRef is Dead

### The Old Way (Deprecated)

```tsx
// ❌ DEPRECATED - forwardRef wrapper
const OldInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

### The New Way

```tsx
// ✅ NEW - ref is just a prop
type InputProps = {
  ref?: React.Ref<HTMLInputElement>;
  placeholder?: string;
};

const NewInput = ({ ref, placeholder }: InputProps) => {
  return <input ref={ref} placeholder={placeholder} />;
};

// Usage is the same
const Parent = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  return <NewInput ref={inputRef} placeholder="Type here" />;
};
```

### Ref Cleanup Functions

```tsx
// ✅ NEW - Return cleanup from ref callback
const Component = () => {
  return (
    <div
      ref={(node) => {
        if (node) {
          // Setup
          const observer = new ResizeObserver(() => {});
          observer.observe(node);

          // Cleanup - returned function called on unmount
          return () => observer.disconnect();
        }
      }}
    />
  );
};
```

---

## Server & Client Components

### Default to Server Components

```tsx
// ✅ Server Component (default) - No directive needed
async function ProductList() {
  const products = await db.products.findMany(); // Direct DB access

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

### Use 'use client' Sparingly

```tsx
// ✅ Only add 'use client' when you NEED:
// - useState, useEffect, useRef
// - Event handlers (onClick, onChange, etc.)
// - Browser APIs (localStorage, window, etc.)
// - Third-party client libraries

'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Server Actions with 'use server'

```tsx
// ✅ Server Actions - Run on server, called from client
'use server';

export async function createOrder(formData: FormData) {
  const order = await db.orders.create({
    data: {
      product: formData.get('product'),
      quantity: Number(formData.get('quantity')),
    },
  });

  revalidatePath('/orders');
  return order;
}

// In client component:
'use client';

import { createOrder } from './actions';

export function OrderForm() {
  return (
    <form action={createOrder}>
      <input name="product" />
      <input name="quantity" type="number" />
      <button type="submit">Order</button>
    </form>
  );
}
```

### Component Composition Pattern

```tsx
// ✅ Server Component with Client "islands"
async function ProductPage({ id }) {
  const product = await getProduct(id); // Server fetch

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Client island for interactivity */}
      <AddToCartButton productId={id} />

      {/* Server-rendered reviews */}
      <Reviews productId={id} />
    </div>
  );
}
```

---

## State Management Patterns

### Prefer Local State

```tsx
// ✅ GOOD - State close to where it's used
const SearchInput = () => {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
};
```

### Lift State Only When Necessary

```tsx
// ✅ GOOD - Lifted only because siblings need it
const Parent = () => {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <List onSelect={setSelected} />
      <Details item={selected} />
    </>
  );
};
```

### Use URL State for Shareable State

```tsx
// ✅ GOOD - URL as source of truth for filters/sorting
const ProductList = () => {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');

  // Products filtered by URL params
  const products = useProducts({ category, sort });

  return <Grid products={products} />;
};
```

### Avoid Prop Drilling with Composition

```tsx
// ❌ BAD - Prop drilling
const App = () => {
  const [user, setUser] = useState(null);
  return <Layout user={user} setUser={setUser} />;
};

const Layout = ({ user, setUser }) => {
  return <Sidebar user={user} setUser={setUser} />;
};

// ✅ GOOD - Composition
const App = () => {
  const [user, setUser] = useState(null);

  return (
    <Layout>
      <Sidebar>
        <UserProfile user={user} />
        <LogoutButton onLogout={() => setUser(null)} />
      </Sidebar>
    </Layout>
  );
};
```

---

## Performance Patterns

### Profile Before Optimizing

```tsx
// ✅ Use React DevTools Profiler
// 1. Record a session
// 2. Identify slow commits (>16ms)
// 3. Find components causing re-renders
// 4. Apply targeted fixes
```

### Virtualize Long Lists

```tsx
// ✅ GOOD - Virtualization for 100+ items
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualList = ({ items }) => {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Debounce Expensive Operations

```tsx
// ✅ GOOD - Debounce search input
const Search = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const results = useSearch(debouncedQuery);

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <Results items={results} />
    </>
  );
};
```

### Lazy Load Heavy Components

```tsx
// ✅ GOOD - Code splitting
const HeavyChart = lazy(() => import('./HeavyChart'));

const Dashboard = () => {
  return (
    <div>
      <Summary />
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  );
};
```

---

## Migration Checklist

### Phase 1: Remove Unnecessary Memoization
- [ ] Remove `useMemo` for simple calculations
- [ ] Remove `useCallback` for event handlers
- [ ] Remove `memo()` wrappers from components
- [ ] Profile before and after to verify no regressions

### Phase 2: Eliminate useEffect Abuse
- [ ] Convert derived state to render calculations
- [ ] Move event-related side effects to handlers
- [ ] Replace data fetching useEffect with React Query/SWR/Server Components
- [ ] Use `key` prop to reset component state instead of useEffect

### Phase 3: Adopt New Hooks
- [ ] Replace form state management with `useActionState`
- [ ] Add optimistic updates with `useOptimistic`
- [ ] Use `use()` for promise handling where appropriate
- [ ] Adopt `useFormStatus` in form components

### Phase 4: Modernize Refs
- [ ] Remove `forwardRef` wrappers
- [ ] Pass `ref` as regular prop
- [ ] Add cleanup functions to ref callbacks where needed

### Phase 5: Component Architecture
- [ ] Default components to Server Components
- [ ] Add `'use client'` only where truly needed
- [ ] Extract interactive parts into client "islands"
- [ ] Move data fetching to server when possible

---

## Quick Reference Card

| Pattern | Old Way | React 19 Way |
|---------|---------|--------------|
| Memoization | `useMemo`, `useCallback`, `memo` | Let compiler handle it |
| Form State | Multiple `useState` | `useActionState` |
| Optimistic UI | Manual state juggling | `useOptimistic` |
| Promise in render | `useEffect` + `useState` | `use()` |
| Forward refs | `forwardRef()` | `ref` as prop |
| Derived state | `useEffect` to sync | Calculate in render |
| Data fetching | `useEffect` | Server Components / React Query |
| Form pending state | Prop drilling | `useFormStatus` |

---

## Sources

- [React 19 Official Blog](https://react.dev/blog/2024/12/05/react-19)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React Compiler & Memoization](https://www.developerway.com/posts/react-compiler-soon)
- [React 19 Ref Updates](https://blog.saeloun.com/2025/03/24/react-19-ref-as-prop/)
- [Server Components Guide](https://www.joshwcomeau.com/react/server-components/)
- [useActionState and useOptimistic](https://200oksolutions.com/blog/exploring-react-19-new-hooks/)
- [React 19 Best Practices](https://medium.com/@arshithdev/react-19-best-practices-for-engineers-who-know-hooks-better-than-their-friends-65bf8dcc4870)
- [Avoiding useEffect Overuse](https://medium.com/@ahamisi777/keep-effects-pure-or-pay-later-why-overusing-useeffect-in-react-19-is-the-new-code-smell-and-cf5d2d529377)
