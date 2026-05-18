/**
 * React Router DOM → Next.js compatibility shim.
 * Replace `import { ... } from "@/lib/compat-router"` with this module.
 */
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, ReactNode } from "react";
import React from "react";

type AnyProps = Record<string, unknown>;

export function Link({
  to,
  href,
  children,
  className,
  target,
  rel,
  onClick,
  style,
}: {
  to?: string;
  href?: string;
  children?: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  style?: React.CSSProperties;
} & AnyProps) {
  const dest = (to || href || "#") as string;
  return (
    <NextLink href={dest} className={className} target={target} rel={rel} onClick={onClick} style={style}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (path: string | object, opts?: { replace?: boolean }) => {
    // Guard: if called with an event object (e.g. from onClick) ignore it
    if (typeof path !== "string") return;
    if (opts?.replace) router.replace(path);
    else router.push(path);
  };
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const router = useRouter();
  return (router.query || {}) as T;
}

export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  if (typeof window === "undefined") {
    return [new URLSearchParams(), () => {}];
  }
  const params = new URLSearchParams(window.location.search);
  return [params, () => {}];
}

export function useLocation() {
  const router = useRouter();
  return {
    pathname: router.pathname,
    search: typeof window !== "undefined" ? window.location.search : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
    state: null,
  };
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// Stubs — not used in leaf pages, but needed if any component imports them
export const BrowserRouter = ({ children }: { children: ReactNode }) => <>{children}</>;
export const Routes = ({ children }: { children: ReactNode }) => <>{children}</>;
export const Route = () => null;
export const Outlet = () => null;

/**
 * NavLink — supports react-router-dom's function-as-className API:
 * `className={({ isActive }) => isActive ? "active" : ""}`
 */
export function NavLink({
  to,
  href,
  children,
  className,
  target,
  rel,
  onClick,
  style,
  end: _end,
}: {
  to?: string;
  href?: string;
  children?: ReactNode;
  className?: string | (({ isActive }: { isActive: boolean }) => string);
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  style?: React.CSSProperties | (({ isActive }: { isActive: boolean }) => React.CSSProperties);
  end?: boolean;
} & AnyProps) {
  const router = useRouter();
  const dest = (to || href || "#") as string;
  const isActive =
    typeof window !== "undefined"
      ? window.location.pathname === dest || window.location.pathname.startsWith(dest + "/")
      : router.pathname === dest || router.pathname.startsWith(dest + "/");

  const resolvedClass =
    typeof className === "function" ? className({ isActive }) : className;
  const resolvedStyle =
    typeof style === "function" ? style({ isActive }) : style;

  return (
    <NextLink href={dest} className={resolvedClass} target={target} rel={rel} onClick={onClick} style={resolvedStyle}>
      {children}
    </NextLink>
  );
}
