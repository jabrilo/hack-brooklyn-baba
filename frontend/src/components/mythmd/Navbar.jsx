import { useState } from "react"
import { Menu, X } from "lucide-react"
import Logo from "./Logo"
import { Button } from "@/components/ui/button"

const links = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Sample Claims", href: "#sample-claims" },
  { label: "FAQ", href: "#faq" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/70 backdrop-blur-xl"
      data-testid="site-navbar"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">
        <a href="#top" aria-label="MythMD home" data-testid="nav-logo-link">
          <Logo />
        </a>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#404E7C] transition-colors hover:text-[#251F47]"
              data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button
            asChild
            className="h-10 rounded-full bg-[#251F47] px-5 text-white shadow-md transition-all hover:bg-[#260F26] hover:shadow-lg"
            data-testid="nav-cta-button"
          >
            <a href="#tool">Check a claim</a>
          </Button>
        </div>

        <button
          className="rounded-lg p-2 text-[#251F47] transition hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
          data-testid="nav-mobile-toggle"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div
          className="border-t border-slate-100 bg-white/95 backdrop-blur-xl md:hidden"
          data-testid="nav-mobile-panel"
        >
          <div className="flex flex-col gap-1 px-5 py-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-[15px] font-medium text-[#404E7C] hover:bg-slate-50 hover:text-[#251F47]"
                data-testid={`nav-mobile-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              className="mt-2 h-11 rounded-full bg-[#251F47] text-white hover:bg-[#260F26]"
              data-testid="nav-mobile-cta"
            >
              <a href="#tool" onClick={() => setOpen(false)}>
                Check a claim
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
