# Copilot Instructions

## Workflow

- Before making changes, inspect the relevant folder structure, the target files, and nearby examples of similar functionality (for new routes, start from `_src.example`). Identify the established patterns for file placement, naming, imports, formatting, types, and integration, then follow them.
- Keep code consistent with the closest applicable examples in the project. Do not introduce a new style, abstraction, or refactor unless the request requires it.
- Make focused changes that satisfy the request while preserving existing behavior and unrelated work.
- Re-read a file before editing it if it may have changed since you last read it.
- When a change affects multiple parts of the project (for example types, API calls, and UI), keep those parts aligned with each other and with existing conventions.

## Project structure

- Route-level code in `apps/next/src/app/` follows the template in `apps/next/src/app/_src.example`. When creating a new page or route, create a `_src/` folder inside the route folder with the same structure, and keep `page.tsx` in the route folder next to `_src/`, not inside it. Never modify `_src.example` itself.
- Before building a new route, also check how existing routes adapt the template, and follow them.
- Template layout:

  ```
  <route>/
  ├── _src/
  │   ├── components/          # Components local to this route
  │   ├── modules/
  │   │   ├── index.tsx        # Composes the modules below
  │   │   ├── aside/
  │   │   ├── footer/
  │   │   ├── header/
  │   │   ├── main/
  │   │   └── nav/             # Each module: index.tsx + batches/
  │   ├── utils/               # Helpers local to this route
  │   ├── schemas.ts           # Schemas and types for this route
  │   └── useLocalContext.ts   # Local state/context for this route
  └── page.tsx
  ```

- Each module has an `index.tsx` as its entry point and a `batches/` folder for the smaller parts that belong to that module. Do not put a module's sub-parts directly in `components/`, and do not make one module import another module's `batches/`.
- Put code in the narrowest place that fits: a part used by one module goes in that module's `batches/`, a part shared across modules goes in `components/`, and a non-UI helper goes in `utils/`.
- `.gitkeep` files are placeholders only. Do not copy them into real routes, and remove one when you add a real file to its folder.

## Declarations

- Declare React components with the `FC` type and an explicit return type. Use the appropriate return type for async or null-rendering components. Do not declare components with the `function` keyword.
- Exception: Generic components may omit the `FC` type and declare type parameters directly on the arrow function (for example `const Form = <TData, TVariables>(...): ReactElement => ...`), because React's `FC` does not support generic type parameters. An explicit return type is still required.

  ```tsx
  // Correct
  const UserCard: FC<I> = (props): ReactElement => <div>{props.name}</div>;

  // Correct (generic component exception)
  const Form = <TData, TVariables>(...): ReactElement => { ... };

  // Incorrect
  function UserCard({ name }: I) { ... }
  ```

- Declare named functions as `const name = (...) => ...`, with an explicit return type where appropriate. Do not use `function name(...)` declarations.

## Props

- In components that receive props, access them as `props.name`. Do not destructure them in the parameter list or later (for example, do not write `const { name } = props`).
- Exceptions:
  - **Ref props**: ref props may be destructured in the parameter list, with the remaining props kept in `...props`, because refs must be accessed outside `props` for mutation. Access all non-ref props through `props.name`.
    ```tsx
    const Input: FC<I> = ({ inputRef, ...props }): ReactElement => <input ref={inputRef} value={props.value} />;
    ```
  - **HTML / Underlying Element Prop Forwarding (Rest Props)**: When a component wraps an underlying native HTML element or external component and forwards the remaining attributes via `...props`, custom props (such as `color`, `variant`, `size`, `label`, `errorMessage`, `className`, or default parameter values like `type = "button"`) may be destructured in the parameter list alongside `...props` to avoid spreading invalid custom attributes onto the DOM element.
    ```tsx
    const Button: FC<IButton> = ({ className, color, disabled, size, type = "button", variant, ...props }): ReactElement => (
      <button className={ButtonTWM({ className, color, disabled, size, variant })} disabled={disabled} type={type} {...props}>
        {props.children}
      </button>
    );
    ```
  - **Form Library Integration**: Form registration functions (such as `register` from `react-hook-form`) may be destructured in the parameter list alongside `...props` so they can be invoked directly (e.g. `{...register("field")}`) while the remaining component/form props are accessed via `props.name` or forwarded.
    ```tsx
    const Form: FC<I> = ({ register, ...props }): ReactElement => (
      <form onSubmit={props.onSubmit}>
        <input {...register("label")} />
      </form>
    );
    ```
- Destructure in the parameter list only when there is an explicit need (such as extracting refs, separating forwarded rest props from custom DOM attributes, or form library helpers). Never write a pattern that contains only the rest element, such as `({ ...props })`; write `(props)` instead.

  ```tsx
  // Correct
  const Card: FC<ICardProps> = (props): ReactElement => <div>{props.title}</div>;

  // Incorrect
  const Card: FC<ICardProps> = ({ ...props }): ReactElement => <div>{props.title}</div>;
  ```

- This rule applies only to component props, not to helper functions (such as `*TWM` style generators) or values returned from hooks or context.

## Naming

- In array callbacks such as `map`, `find`, `filter`, `some`, and `forEach`, name the current item `dt` and access its fields through `dt`. Do not destructure the item in the callback parameter.
  - Use `i` for the index when one is needed: `.map((dt, i) => ...)`.
  - When a callback runs inside another array callback and iterates over a child collection of the outer item (for example `dt.cards`), name the inner item after its domain (such as `card` or `column`) instead of `dt`. The outer callback keeps `dt` and `i`.
  - If the inner callback needs an index, give it a descriptive name such as `cardIndex` instead of `i`. Never reuse `dt` or `i` in a nested callback, because that shadows the outer variables.

  ```tsx
  // Correct: single level, use dt (and i when the index is needed)
  const activeUsers = users.filter((dt) => dt.active);
  const selectedUser = users.find((dt) => dt.id === id);

  {
    columns.map((dt, i) => <Column key={dt.id} index={i} title={dt.title} />);
  }

  // Correct: nested, the outer callback keeps dt and i, the inner one uses the domain name
  {
    columns.map((dt, i) => (
      <section key={dt.id}>
        <h2>
          {i + 1}. {dt.title}
        </h2>
        {dt.cards.map((card, cardIndex) => (
          <Card key={card.id} index={cardIndex} title={card.title} />
        ))}
      </section>
    ));
  }

  // Incorrect: the inner callback reuses dt and i, which shadows the outer ones
  {
    columns.map((dt, i) => (
      <section key={dt.id}>
        {dt.cards.map((dt, i) => (
          <Card key={dt.id} index={i} title={dt.title} />
        ))}
      </section>
    ));
  }
  ```

- In event handlers such as `onClick`, `onChange`, and `onKeyDown`, name the event parameter `e` when it is used. Omit it when it is not used.
- Name local static data constants (arrays, lookup records, and configuration objects) in `UPPER_SNAKE_CASE`, with a descriptive suffix such as `_DATA`, `_COLOR`, or `_ORDER`. This does not apply to components, functions, hooks, or values derived from props, state, or hooks.

  ```tsx
  const ROLE_DATA = [{ label: "Admin", value: "admin" }] as const;
  const MEMBER_ROLE_COLOR: Record<string, string> = { admin: "bg-red-500" };
  const MEMBER_ROLE_ORDER = ["owner", "admin", "editor", "viewer"];
  ```

- Name every `interface` with an `I` prefix and every `type` alias with a `T` prefix, followed by a PascalCase name. This applies to exported and non-exported declarations alike.
- Name component files in `PascalCase` matching the exported component name (for example `ResultGrid.tsx` exporting `ResultGrid`). This applies everywhere, including files inside `batches/` folders. Do not use kebab-case for component files.

  ```ts
  export interface IDNDWorkspaceCreatePayload {
    label: string;
  }

  export type TDNDWorkspaceMemberRole = "admin" | "editor" | "viewer";

  interface IMembers {
    createdAt: string;
    role: TDNDWorkspaceMemberRole;
  }
  ```

## UI and styling

- Text written directly as a JSX `title` attribute value must be in Title Case: the first letter of every word is uppercase (`title="Delete Item"`, not `title="Delete item"` or `title="delete item"`).
- When creating or modifying UI with Tailwind CSS, style only the base appearance. Do not add `transition*` utilities or responsive variants such as `sm:`, `md:`, or `lg:`. Leave existing ones untouched unless asked.
- When a `className` is composed from multiple parts or dynamic values, build it as an array and call `.join(" ")`. Do not use template literals with `${}` for `className`. A fully static class string stays a plain string.

  ```tsx
  // Correct
  <div
    className={[
      "flex w-16 shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white",
      MEMBER_ROLE_COLOR[dt.role.toLocaleLowerCase()],
    ].join(" ")}
  />

  // Incorrect
  <div className={`flex w-16 shrink-0 ${MEMBER_ROLE_COLOR[dt.role.toLocaleLowerCase()]}`} />
  ```

- Do not add `aria-*` attributes. Prefer appropriate semantic HTML elements and follow existing UI patterns.

## Safety and lint

- Avoid non-null statements (`!`) unless their existence is guaranteed and the reason is clear.
- Don't disable lint rules without a specific reason.

## Verification and final report

- Run the relevant checks (lint, type-check) for the files or behavior you changed. If a check cannot be run, say so.
- Before finishing, compare the change against the closest existing examples you found at the start.
- In the final response, report any relevant inconsistencies found in existing or changed code. Distinguish pre-existing issues from issues introduced by this change, and state whether each was fixed or left untouched.
