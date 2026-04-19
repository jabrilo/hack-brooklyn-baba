import Navbar from "@/components/mythmd/Navbar"
import Hero from "@/components/mythmd/Hero"
import HowItWorks from "@/components/mythmd/HowItWorks"
import SampleClaims from "@/components/mythmd/SampleClaims"
import FAQ from "@/components/mythmd/FAQ"
import Footer from "@/components/mythmd/Footer"

export default function Home() {
  return (
    <div className="min-h-screen mm-bg" data-testid="home-page">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <SampleClaims />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
