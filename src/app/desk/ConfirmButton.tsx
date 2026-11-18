"use client";
/** A submit button that asks first. For actions that cannot be undone, such as removing a story for good. */
export default function ConfirmButton({ ask, children, ...rest }: { ask: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...rest} onClick={e => { if (!window.confirm(ask)) e.preventDefault(); }}>{children}</button>;
}
