import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

const logo = "/assets/images/vilpu-logo.png"

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
            "h-7 w-auto shrink-0 group-data-[collapsible=icon]:hidden",
            className,
          )}
        />
        <img
          src={logo}
          alt="VILPU"
          className={cn(
            "hidden h-7 w-auto shrink-0 object-contain group-data-[collapsible=icon]:block",
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
            ? "h-8 w-auto"
            : "h-8 w-auto rounded-md object-contain",
          className,
        )}
      />
    )

  if (!asLink) {
    return content
  }

  return <Link to="/chat">{content}</Link>
}
