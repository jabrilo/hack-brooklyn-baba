import Logo from "./Logo"

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white/60 backdrop-blur" data-testid="site-footer">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center md:px-10">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-md text-xs leading-relaxed text-slate-500">
            MythMD provides evidence-informed educational insights. It is not a substitute for
            professional medical advice, diagnosis, or treatment.
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
          <a href="#how-it-works" className="transition-colors hover:text-[#251F47]">
            How it works
          </a>
          <a href="#sample-claims" className="transition-colors hover:text-[#251F47]">
            Sample claims
          </a>
          <a href="#faq" className="transition-colors hover:text-[#251F47]">
            FAQ
          </a>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400">© {new Date().getFullYear()} MythMD</span>
        </div>
      </div>
    </footer>
  )
}
