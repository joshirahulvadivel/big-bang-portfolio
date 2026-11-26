import Image from "next/image";
import { profile } from "@/content/site";

/** Illustrated portrait on a glass card, lit from behind in the accent gold; the lower edge fades into the page. */
export function Portrait() {
  return (
    <figure className="relative mx-auto w-full max-w-[280px] md:mx-0 md:max-w-[340px]">
      <div className="pointer-events-none absolute inset-x-[10%] bottom-[20%] top-[10%] rounded-full bg-accent/20 blur-3xl" aria-hidden />
      <div className="glass relative aspect-[4/5] overflow-hidden rounded-[2rem]">
        <Image
          src={profile.portrait}
          alt={profile.name}
          fill
          sizes="(min-width: 768px) 340px, 280px"
          className="object-cover object-top [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]"
        />
      </div>
      <figcaption className="mt-4 flex justify-between gap-4 md:flex-col md:gap-1 lg:flex-row lg:gap-4 text-[10px] uppercase tracking-[0.25em] text-muted">
        <span>{profile.name}</span>
        <span>{profile.location}</span>
      </figcaption>
    </figure>
  );
}

/** Small round photo with a gold ring, for the contact call to action. */
export function Avatar() {
  return (
    <div className="relative mx-auto h-24 w-24">
      <div className="pointer-events-none absolute inset-0 rounded-full bg-accent/30 blur-xl" aria-hidden />
      <Image
        src={profile.avatar}
        alt={profile.name}
        width={96}
        height={96}
        className="relative h-24 w-24 rounded-full bg-[#14161c] object-cover ring-1 ring-accent/60 ring-offset-4 ring-offset-bg"
      />
    </div>
  );
}
