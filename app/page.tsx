import Hero from "@/components/Hero";
import OurStory from "@/components/OurStory";
import Gallery from "@/components/Gallery";
import Availability from "@/components/Availability";
import InquiryForm from "@/components/InquiryForm";
import { InquiryDatesProvider } from "@/components/InquiryDatesContext";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <OurStory />
      <Gallery />
      <InquiryDatesProvider>
        <Availability />
        <InquiryForm />
      </InquiryDatesProvider>
      <footer className="border-t border-walnut/10 px-6 py-8 text-center text-sm text-walnut-light">
        © {new Date().getFullYear()} Rolls Ranch. All rights reserved.
      </footer>
    </main>
  );
}
