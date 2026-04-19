import Link from "next/link";
import { cn } from "@/lib/utils";

type CommonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
};

const variantClasses = {
  primary:
    "bg-primary text-white hover:bg-primary-strong shadow-[0_14px_28px_rgba(11,110,79,0.22)]",
  secondary:
    "bg-surface text-text ring-1 ring-border hover:bg-surface-muted",
  ghost: "bg-transparent text-text-muted hover:bg-surface-muted hover:text-text",
  danger: "bg-danger text-white hover:bg-red-800",
};

const sizeClasses = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

function sharedClassName({
  variant = "primary",
  size = "md",
  className,
}: Pick<CommonProps, "variant" | "size" | "className">) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button(props: ButtonAsButton | ButtonAsLink) {
  if ("href" in props && props.href) {
    const { href, children, className, variant, size } = props;

    return (
      <Link href={href} className={sharedClassName({ className, variant, size })}>
        {children}
      </Link>
    );
  }

  const { children, className, variant, size, ...buttonProps } = props;

  return (
    <button
      className={sharedClassName({ className, variant, size })}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
