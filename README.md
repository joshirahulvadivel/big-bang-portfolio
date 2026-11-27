# Big Bang Portfolio

The personal portfolio of Joshirahul Vadivel, Associate Project Manager at
araCreate Group. It tells a career as the story of the universe: seven chapters,
from the Big Bang to Earth at night, each matched to a step of the career. A 3D
scene behind the page moves through cosmic time as you scroll.

## What it does

- Scroll-driven 3D story in seven chapters: Origin, First light, First stars,
  Cosmic web, The Sun (selected work), Earth, and Now.
- A clock in the corner counts the time since the Big Bang alongside the career
  year.
- Selected work in a rotating 3D gallery on desktop and as stacked cards on phones,
  each opening a case study.
- A globe of the cities the work connects to.
- A contact form that sends email through Resend, plus a downloadable résumé.
- Optional ambient soundtrack that follows the story.
- Layouts for phones, tablets and desktops, and less motion when the visitor's
  system asks for reduced motion.

## Stack

| Layer | Tool |
| --- | --- |
| Framework | Next.js 15 (App Router, Turbopack), React 19, TypeScript |
| 3D | three.js, React Three Fiber, drei, postprocessing |
| Motion | Framer Motion, Lenis smooth scroll |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Email | Resend |
| Imagery | NASA imagery, resized with sharp |

## Layout

```
src/
├── app/                 # Page, layout, global styles, /api/contact route
├── components/
│   ├── sections/        # One component per chapter, plus the portrait
│   ├── three/           # 3D scene: backdrop, story, Earth, warp, work gallery
│   └── *.tsx            # Nav, chapter rail, cosmic clock, loader, cursor, sound
├── content/site.ts      # All text on the site: profile, roles, projects, awards
├── data/                # Credits for the NASA imagery
└── lib/                 # Story timeline, scroll state, ambient audio
public/                  # Résumé, portrait, fonts, space imagery
scripts/                 # NASA image download script
```

To change any text on the site, edit `src/content/site.ts`; no component changes
are needed. The chapters and their cosmic ages are defined in `src/lib/story.ts`.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Run the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Lint |
| `pnpm space:assets` | Download and resize the NASA imagery, and update its credits |
| `pnpm preview` | Build for Cloudflare Workers and run it locally in the Workers runtime |
| `pnpm deploy` | Build for Cloudflare Workers and deploy |

### Contact form

Copy `.env.example` to `.env.local` and fill in:

- `RESEND_API_KEY`: an API key from https://resend.com/api-keys
- `CONTACT_TO_EMAIL`: where messages are delivered
- `CONTACT_FROM_EMAIL`: optional; the sender, on a domain verified in Resend

Without these, the site still runs, and the form tells visitors to send an email
instead.

## Deploy

The site runs on Cloudflare Workers through the
[OpenNext adapter](https://opennext.js.org/cloudflare). Worker settings live in
`wrangler.jsonc`. Cloudflare Workers Builds deploys each push to `main` with:

- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`

In production, the contact form's keys are set as Worker secrets (Settings →
Variables and Secrets), not in `.env.local`.

## Credits

Space imagery: NASA, ESA, CSA, STScI · NASA Earth Observatory · NASA SVS. It is
used under NASA's media guidelines, and no endorsement is implied. Full credits
are in `src/data/space-credits.json` and in the site footer.

## License

MIT. See [LICENSE](LICENSE). Copyright (c) 2026 Joshirahul Vadivel.
