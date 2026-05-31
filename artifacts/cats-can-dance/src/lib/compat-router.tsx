/**
 * React Router DOM → wouter compatibility shim.
 * Drop-in replacement that uses wouter under the hood.
 */
import { Link as WouterLink, useLocation as useWouterLocation, useParams as useWouterParams, useRouter } from "wouter";
import { useEffect, ReactNode } from "react";
import React from "react";

type AnyProps = Record<string, unknown>;

function toHref(raw: unknown): string {
  if (!raw) return "#";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) {
    const { pathname = "/", search = "", hash = "" } = raw as Record<string, string>;
    return `${pathname}${search}${hash}`;
  }
  return "#";
}

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
  to?: unknown;
  href?: unknown;
  children?: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  style?: React.CSSProperties;
} & AnyProps) {
  const dest = toHref(to ?? href);
  if (target === "_blank" || dest.startsWith("http") || dest.startsWith("mailto:")) {
    return (
      <a href={dest} className={className} target={target} rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)} onClick={onClick} style={style}>
        {children}
      </a>
    );
  }
  return (
    <WouterLink href={dest} className={className} target={target} rel={rel} onClick={onClick as any} style={style}>
      {children as any}
    </WouterLink>
  );
}

export function useNavigate() {
  const [, navigate] = useWouterLocation();
  return (path: string | object, opts?: { replace?: boolean }) => {
    const dest = toHref(path);
    if (dest === "#") return;
    navigate(dest, { replace: opts?.replace });
  };
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  // @ts-ignore — wouter params typing
  return useWouterParams() as T;
}

export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const [location, navigate] = useWouterLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const setParams = (next: URLSearchParams) => {
    navigate(`${location}?${next.toString()}`);
  };
  return [params, setParams];
}

export function useLocation() {
  const [pathname] = useWouterLocation();
  return {
    pathname,
    search: typeof window !== "undefined" ? window.location.search : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
    state: null,
  };
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const [, navigate] = useWouterLocation();
  useEffect(() => {
    navigate(to, { replace });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export const BrowserRouter = ({ children }: { children: ReactNode }) => <>{children}</>;
export const Routes = ({ children }: { children: ReactNode }) => <>{children}</>;
export const Route = () => null;
export const Outlet = () => null;

export type NavLinkRenderProps = { isActive: boolean; isPending?: boolean };

export type NavLinkProps = {
  to?: unknown;
  href?: unknown;
  children?: ReactNode;
  className?: string | ((props: NavLinkRenderProps) => string);
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  style?: React.CSSProperties | ((props: NavLinkRenderProps) => React.CSSProperties);
  end?: boolean;
} & AnyProps;

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
}: NavLinkProps) {
  const [pathname] = useWouterLocation();
  const dest = toHref(to ?? href);
  const isActive = pathname === dest || pathname.startsWith(dest + "/");

  const resolvedClass =
    typeof className === "function" ? className({ isActive }) : className;
  const resolvedStyle =
    typeof style === "function" ? style({ isActive }) : style;

  if (target === "_blank" || dest.startsWith("http") || dest.startsWith("mailto:")) {
    return (
      <a href={dest} className={resolvedClass} target={target} rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)} onClick={onClick} style={resolvedStyle}>
        {children}
      </a>
    );
  }

  return (
    <WouterLink href={dest} className={resolvedClass} target={target} rel={rel} onClick={onClick as any} style={resolvedStyle}>
      {children as any}
    </WouterLink>
  );
}
