import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactFormRealtime } from "@/components/contact-form-realtime"
import { CustomerFeedback } from "@/components/customer-feedback"

export default function ContatoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ContactFormRealtime />
        <CustomerFeedback />
      </main>
      <Footer />
    </div>
  )
}
