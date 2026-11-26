import Shell from "@/components/Shell";
import Hero from "@/components/sections/Hero";
import { CosmicWeb, EarthChapter, FirstLight, FirstStars } from "@/components/sections/Chapters";
import Work from "@/components/sections/Work";
import Contact from "@/components/sections/Contact";

/** The story, in order: one section per chapter (data-stage 0–6). */
export default function Home() {
  return (
    <Shell>
      <Hero />
      <FirstLight />
      <FirstStars />
      <CosmicWeb />
      <Work />
      <EarthChapter />
      <Contact />
    </Shell>
  );
}
