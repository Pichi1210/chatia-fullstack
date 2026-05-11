import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"
import logo from "@/assets/logo.svg"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const content =
    variant === "responsive" ? (
      <>
        <img
          src={logo}
          alt="VILPU"
          className={cn(
            "h-11 w-auto group-data-[collapsible=icon]:hidden",
            className,
          )}
        />
        <img
          src={logo}
          alt="VILPU"
          className={cn(
            "size-9 hidden rounded-md object-cover object-left group-data-[collapsible=icon]:block",
            className,
          )}
        />
      </>
    ) : (
      <img
        src={logo}
        alt="VILPU"
        className={cn(
          variant === "full"
            ? "h-12 w-auto"
            : "size-9 rounded-md object-cover object-left",
          className,
        )}
      />
    )

  if (!asLink) {
    return content
  }

  return <Link to="/chat">{content}</Link>
}
