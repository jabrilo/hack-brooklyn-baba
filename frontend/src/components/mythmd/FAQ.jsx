import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "Is MythMD a medical diagnosis tool?",
    a: "No. MythMD is an educational tool that helps you understand what peer-reviewed research says about a health claim. It does not diagnose, treat, or replace advice from a licensed clinician.",
  },
  {
    q: "Where does MythMD get its evidence?",
    a: "MythMD pulls from peer-reviewed journals, meta-analyses, systematic reviews and reputable public-health sources and links directly to them so you can read the original research yourself.",
  },
  {
    q: "What do the claim statuses mean?",
    a: "We label claims as Unsupported, Mixed Evidence, Needs Nuance or Likely True based on the strength, consistency and quality of the research we find. Each result also shows a confidence indicator.",
  },
  {
    q: "Does MythMD work with video and social posts?",
    a: "Yes. Paste a public TikTok, Instagram or YouTube link, and MythMD extracts the underlying health claim from available public text before cross-checking it with research.",
  },
]

export default function FAQ() {
  return (
    <section
      id="faq"
      className="relative border-t border-slate-100/70 py-20 md:py-28"
      data-testid="faq-section"
    >
      <div className="mx-auto max-w-4xl px-5 md:px-10">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71B48D]">
            FAQ
          </div>
          <h2 className="font-serif-display text-3xl font-medium leading-[1.08] tracking-tight text-[#251F47] md:text-[2.5rem]">
            Questions, answered.
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3" data-testid="faq-accordion">
          {FAQS.map((item, index) => (
            <AccordionItem
              key={item.q}
              value={`item-${index}`}
              className="rounded-2xl border border-slate-100 bg-white px-5 transition-colors data-[state=open]:border-[#86CB92]/60 md:px-6"
            >
              <AccordionTrigger
                className="py-5 font-serif-display text-[1.05rem] font-semibold text-[#251F47] hover:no-underline md:text-[1.15rem]"
                data-testid={`faq-trigger-${index}`}
              >
                {item.q}
              </AccordionTrigger>
              <AccordionContent
                className="pb-5 text-[14.5px] leading-relaxed text-[#404E7C]"
                data-testid={`faq-content-${index}`}
              >
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
