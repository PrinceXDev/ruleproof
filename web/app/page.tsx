import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Ban,
  Database,
  Download,
  EyeOff,
  FileSearch,
  FlaskConical,
  GitBranch,
  GitCompareArrows,
  History,
  Lock,
  Mic,
  Quote,
  Radar,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";
import Nav from "@/components/landing/Nav";
import Logo from "@/components/landing/Logo";
import HeroConsole from "@/components/landing/HeroConsole";
import ProductDemo from "@/components/landing/ProductDemo";
import LandingMotion from "@/components/landing/LandingMotion";
import SmoothScroll from "@/components/landing/SmoothScroll";
import Quickstart from "@/components/landing/Quickstart";
import Faq from "@/components/landing/Faq";

const wrap = "mx-auto w-full max-w-7xl px-4 sm:px-8";
const eyebrow =
  "font-mono text-[11px] font-medium uppercase tracking-[.2em] text-ink-faint";
const card =
  "rounded-2xl border border-white/[.08] bg-[linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01))]";

function SectionHeading({
  id,
  kicker,
  title,
  children,
}: {
  id?: string;
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end" data-reveal>
      <div>
        <p className={cn(eyebrow, "flex items-center gap-2")}>
          <span className="h-px w-6 bg-brand" /> {kicker}
        </p>
        <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-5xl lg:text-[56px]">
          {title}
        </h2>
      </div>
      {children && (
        <p className="max-w-md text-pretty text-[15px] leading-relaxed text-ink-muted lg:justify-self-end">
          {children}
        </p>
      )}
    </div>
  );
}

const pipeline = [
  "Plain-language rule",
  "Sentence-scoped parser",
  "Source provenance",
  "Visible assumptions",
  "8-case plan",
  "Endpoint coverage",
  "Human approval",
  "Immutable revisions",
  "Exact-status runner",
  "Request & response evidence",
  "Revision diff",
  "CI gate",
];

const steps = [
  {
    n: "01",
    title: "Explain the rule",
    body: "Type or dictate who can do what. The bounded parser extracts roles, actions and tenant scope — each tagged with the exact sentence it came from.",
    detail: ["viewer · editor", "read · update", "own · other tenant"],
    icon: Mic,
  },
  {
    n: "02",
    title: "Review the exact plan",
    body: "Eight explicit scenarios with expected HTTP statuses, plus a map of which API endpoints the rule covers. Override any expectation, acknowledge assumptions, then approve that specific revision.",
    detail: ["Endpoint gaps flagged", "Approval never carries over"],
    icon: FileSearch,
  },
  {
    n: "03",
    title: "Run against a fixture",
    body: "The approved requests go to the seeded-defect or corrected API with per-request timeouts. Statuses are matched exactly — a 500 is not a deny.",
    detail: ["Seeded defect: 6 pass · 2 fail", "Corrected: 8 pass"],
    icon: FlaskConical,
  },
  {
    n: "04",
    title: "Inspect the evidence",
    body: "Open any result: rule excerpt → expectation → request → response body, with a plain-language explanation. Replay history or export the JSON bundle.",
    detail: ["Rule → plan → request → response"],
    icon: ScanSearch,
  },
];

const endpoints = [
  ["POST", "/api/plans", "Parse a rule into a new plan"],
  ["GET", "/api/plans/{id}", "Fetch a plan revision"],
  ["POST", "/api/plans/{id}/revise", "New revision from changed wording"],
  ["PATCH", "/api/plans/{id}/cases", "Override expectations → new revision"],
  ["POST", "/api/plans/{id}/acknowledge", "Acknowledge parser assumptions"],
  ["POST", "/api/plans/{id}/approve", "Approve this exact revision"],
  ["POST", "/api/runs", "Run an approved plan on a fixture"],
  ["GET", "/api/runs/{id}", "Fetch a run with evidence"],
  ["GET", "/api/plans/{id}/history", "Full lineage + every run"],
  ["GET", "/api/plans/{id}/diff", "What changed vs. the previous revision"],
  ["GET", "/api/plans/{id}/coverage", "Endpoints the rule covers, and the gaps"],
  ["GET", "/api/plans/{id}/export", "Download the evidence bundle"],
];

const methodColor: Record<string, string> = {
  GET: "text-pass",
  POST: "text-brand",
  PATCH: "text-attn",
};

export default function Home() {
  return (
    <div className="relative overflow-x-clip bg-canvas text-ink">
      <SmoothScroll />
      <LandingMotion />
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-brand px-4 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Nav />

      <main id="main">
        {/* HERO */}
        <section className="relative isolate pt-28 sm:pt-36">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-[-280px] -z-10 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(213,248,121,.14),transparent)]"
          />
          <div className={cn(wrap, "grid items-center gap-14 pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28")}>
            <div>
              <a
                href="#problem"
                data-hero
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[.03] py-1 pl-1 pr-3.5 text-xs text-ink-muted backdrop-blur transition-colors hover:border-brand/40"
              >
                <span className="rounded-full bg-brand px-2 py-0.5 font-medium text-brand-ink">New</span>
                Speak a rule. Get request-level proof.
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <h1
                data-hero-title
                className="mt-7 text-balance text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl lg:text-[84px]"
              >
                Your UI says no. Does your{" "}
                <span className="text-brand underline decoration-brand/30 decoration-[6px] underline-offset-[10px]">
                  API?
                </span>
              </h1>
              <p data-hero className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
                RuleProof turns a plain-language access rule into a reviewable,
                approved test plan — then fires real HTTP requests and shows you,
                with evidence, exactly where the API breaks the rule.
              </p>
              <div data-hero className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/studio/" className={buttonVariants({ size: "lg" })}>
                  Open the Evidence Studio
                  <ArrowUpRight size={18} className="transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                </Link>
                <a href="#demo" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  Try the 60-second demo
                </a>
              </div>
              <dl data-hero className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/[.07] pt-6">
                {[
                  ["8", "explicit checks per rule"],
                  ["0", "silent guesses"],
                  ["1:1", "approval per revision"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="sr-only">{l}</dt>
                    <dd className="font-mono-tnum text-3xl font-semibold tracking-tight text-ink">{v}</dd>
                    <dd className="mt-1 text-xs leading-snug text-ink-faint">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div data-hero>
              <HeroConsole />
            </div>
          </div>
        </section>

        {/* PIPELINE MARQUEE */}
        <div className="relative border-y border-white/[.07] bg-[#0d0f0e] py-5 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex w-max animate-marquee gap-10 motion-reduce:animate-none">
            {[...pipeline, ...pipeline].map((p, i) => (
              <span key={i} className="flex items-center gap-10 font-mono text-xs uppercase tracking-[.16em] text-ink-faint">
                {p}
                <ArrowRight size={13} className="text-brand/70" />
              </span>
            ))}
          </div>
        </div>

        {/* PROBLEM */}
        <section className={cn(wrap, "py-28 sm:py-36")}>
          <SectionHeading
            id="problem"
            kicker="The problem"
            title={
              <>
                Hidden isn’t <span className="text-ink-faint line-through decoration-fail/70">forbidden</span>.
              </>
            }
          >
            Broken access control is the #1 risk in the OWASP Top 10. It hides in
            plain sight: the button is gone, so everyone assumes the data is
            safe. The API never got the memo.
          </SectionHeading>

          <div className="mt-16 grid gap-5 lg:grid-cols-2" data-stagger>
            <div className={cn(card, "p-6 sm:p-8")}>
              <p className={cn(eyebrow, "flex items-center gap-2")}>
                <EyeOff size={14} /> What the UI shows · viewer@tenant-A
              </p>
              <div className="mt-6 space-y-2">
                {[
                  ["a1", "Launch brief.pdf", "Tenant A", true],
                  ["a2", "Q3 roadmap.md", "Tenant A", true],
                  ["b1", "Tenant B asset", "hidden", false],
                ].map(([id, name, t, visible]) => (
                  <div
                    key={id as string}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                      visible
                        ? "border-white/[.07] bg-black/20"
                        : "border-dashed border-white/10 text-ink-faint",
                    )}
                  >
                    <span className="font-mono text-xs text-ink-faint">{id as string}</span>
                    <span className={cn("flex-1", !visible && "blur-[3px] select-none")}>{name as string}</span>
                    {visible ? (
                      <span className="text-xs text-ink-faint">{t as string}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs"><Lock size={12} /> No access</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-pass">
                <ShieldCheck size={16} /> Looks locked down.
              </p>
            </div>

            <div className={cn(card, "border-fail/25 bg-[linear-gradient(180deg,rgba(255,142,134,.07),rgba(255,142,134,.01))] p-6 sm:p-8")}>
              <p className={cn(eyebrow, "flex items-center gap-2 text-fail/80")}>
                <Terminal size={14} /> What the API does · same user
              </p>
              <pre className="mt-6 overflow-x-auto rounded-xl border border-white/[.07] bg-black/50 p-5 font-mono text-[13px] leading-relaxed text-ink-muted">
                <span className="text-brand">$</span> curl -H <span className="text-attn">&quot;Authorization: Bearer demo-viewer-a&quot;</span> \{"\n"}
                {"    "}/assets/b1{"\n\n"}
                <span className="text-fail">HTTP/1.1 200 OK</span>{"\n"}
                {'{ "asset": "b1", "tenant": "B" }'}
              </pre>
              <p className="mt-6 flex items-center gap-2 text-sm text-fail">
                <ShieldAlert size={16} /> Tenant A just read Tenant B’s data.
              </p>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-pretty text-ink-muted" data-reveal>
            RuleProof makes the question explicit — <em className="not-italic text-ink">an identity, an action, a tenant, an expected status</em> —
            and keeps the request and response as proof when the answer is wrong.
          </p>
        </section>

        {/* WORKFLOW */}
        <section className="border-y border-white/[.07] bg-[#0d0f0e] py-28 sm:py-36">
          <div className={wrap}>
            <SectionHeading
              id="workflow"
              kicker="How it works"
              title={<>Four steps. No silent leaps.</>}
            >
              You write the rule. You approve the checks. Every stage makes the
              next decision visible — nothing jumps from a sentence straight to
              a verdict.
            </SectionHeading>

            <div className="relative mt-16 grid gap-4 lg:pl-16" data-rail>
              <div aria-hidden className="absolute bottom-6 left-6 top-6 hidden w-px bg-white/10 lg:block">
                <div data-rail-fill className="h-full w-full origin-top bg-[linear-gradient(#d5f879,#78dcaa)]" />
              </div>
              {steps.map(({ n, title, body, detail, icon: Icon }) => (
                <article
                  key={n}
                  data-step
                  className={cn(
                    card,
                    "group relative grid gap-6 p-6 transition-colors duration-500 sm:p-8 md:grid-cols-[auto_1fr_1fr] md:items-start",
                    "[&.is-active]:border-brand/30 [&.is-active]:bg-brand/[.035]",
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute -left-[46px] top-9 hidden size-3 rounded-full border-2 border-[#0d0f0e] bg-white/20 transition-colors duration-500 group-[.is-active]:bg-brand lg:block"
                  />
                  <span className="grid size-12 place-items-center rounded-xl border border-white/10 bg-black/30 text-brand">
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="font-mono text-xs text-ink-faint">STEP {n}</p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h3>
                  </div>
                  <div>
                    <p className="text-[15px] leading-relaxed text-ink-muted">{body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {detail.map((d) => (
                        <code key={d} className="rounded-md border border-white/[.08] bg-black/30 px-2 py-1 font-mono text-[11px] text-ink-muted">
                          {d}
                        </code>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section className={cn(wrap, "py-28 sm:py-36")}>
          <SectionHeading
            id="demo"
            kicker="Try it here"
            title={<>One rule. Eight checks. Now show me the response.</>}
          >
            Walk the full loop without leaving this page: generate the plan,
            approve it, run it against both fixtures, and trace a failure back
            to the sentence it violates.
          </SectionHeading>
          <div className="mt-14" data-reveal>
            <ProductDemo />
          </div>
        </section>

        {/* MATRIX */}
        <section className="border-y border-white/[.07] bg-[#0d0f0e] py-28 sm:py-36">
          <div className={cn(wrap, "grid gap-14 lg:grid-cols-2 lg:items-center")}>
            <div data-reveal>
              <p className={cn(eyebrow, "flex items-center gap-2")}>
                <span className="h-px w-6 bg-brand" /> The coverage model
              </p>
              <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
                Every combination, written down.
              </h2>
              <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink-muted">
                Most access bugs live in the case nobody wrote a test for.
                RuleProof expands a rule into the full cross product of roles,
                actions and tenant scope — so “viewer updates their own asset”
                gets an explicit answer, even if your rule only implied it.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-sm">
                {["2 roles", "2 actions", "2 scopes"].map((x, i) => (
                  <span key={x} className="flex items-center gap-3">
                    <span className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-ink">{x}</span>
                    {i < 2 && <span className="text-ink-faint">×</span>}
                  </span>
                ))}
                <span className="text-ink-faint">=</span>
                <span className="rounded-lg bg-brand px-3 py-2 font-semibold text-brand-ink">8 checks</span>
              </div>
            </div>
            <div className={cn(card, "overflow-hidden")} data-reveal>
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Expected outcomes for the sample rule</caption>
                <thead>
                  <tr className="border-b border-white/[.07] font-mono text-[10px] uppercase tracking-[.16em] text-ink-faint">
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">Own tenant</th>
                    <th className="px-5 py-3 font-medium">Other tenant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[.05]">
                  {[
                    ["Viewer", "Read", 200, 403],
                    ["Viewer", "Update", 403, 403],
                    ["Editor", "Read", 200, 403],
                    ["Editor", "Update", 200, 403],
                  ].map(([r, a, own, other]) => (
                    <tr key={`${r}${a}`}>
                      <td className="px-5 py-4 text-ink">{r}</td>
                      <td className="px-5 py-4 text-ink-muted">{a}</td>
                      {[own, other].map((s, i) => (
                        <td key={i} className="px-5 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 font-mono-tnum text-xs",
                              s === 200 ? "bg-pass/10 text-pass" : "bg-white/[.05] text-ink-muted",
                            )}
                          >
                            {s === 200 ? "allow" : "deny"} {s}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-white/[.07] px-5 py-3 text-xs text-ink-faint">
                Seeded-defect API: both <span className="text-fail">Other tenant · Read</span> cells return 200.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES BENTO */}
        <section className={cn(wrap, "py-28 sm:py-36")}>
          <SectionHeading
            id="features"
            kicker="What’s inside"
            title={<>Built for evidence, not vibes.</>}
          >
            Every design decision pushes the same way: make the claim
            checkable, make the limits visible, and never let an approval
            outlive the thing it approved.
          </SectionHeading>

          <div className="mt-16 grid gap-4 md:grid-cols-6" data-stagger>
            <Feature
              className="md:col-span-4"
              icon={Quote}
              title="Source-sentence provenance"
              body="Every extracted role, action and scope carries the sentence it came from. Analysis is sentence-scoped, so unrelated clauses never get conflated."
            >
              <div className="mt-6 space-y-2 rounded-xl border border-white/[.07] bg-black/30 p-4 text-sm">
                <p className="text-ink-muted">
                  <mark className="rounded bg-brand/15 px-1 text-brand">Editors</mark> can also{" "}
                  <mark className="rounded bg-pass/15 px-1 text-pass">update</mark> them.
                </p>
                <p className="font-mono text-[11px] text-ink-faint">
                  → role: editor · action: update · source: sentence 2
                </p>
              </div>
            </Feature>
            <Feature
              className="md:col-span-2"
              icon={Sparkles}
              title="Assumptions, never guesses"
              body="Wording outside the vocabulary becomes a visible assumption. Approval is blocked until a human acknowledges it."
            />
            <Feature
              className="md:col-span-6"
              icon={Radar}
              title="The endpoint you forgot"
              body="RuleProof maps your rule onto the API’s OpenAPI spec and flags every object-level endpoint the rule never mentions. Add one sentence and the new checks catch the leak nobody was looking for."
            >
              <div className="mt-6 divide-y divide-white/[.06] rounded-xl border border-white/[.07] bg-black/30 font-mono text-[11.5px]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                  <span className="w-9 text-ink-faint">GET</span>
                  <span className="text-ink">/assets/{"{id}"}</span>
                  <span className="ml-auto text-pass">4 checks</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                  <span className="w-9 text-ink-faint">PUT</span>
                  <span className="text-ink">/assets/{"{id}"}</span>
                  <span className="ml-auto text-pass">4 checks</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                  <span className="w-9 text-ink-faint">GET</span>
                  <span className="text-ink">/assets/{"{id}"}/export</span>
                  <span className="ml-auto text-attn">no rule → cross-tenant export leaks</span>
                </div>
              </div>
            </Feature>
            <Feature
              className="md:col-span-2"
              icon={GitBranch}
              title="Immutable revisions"
              body="Change a word or an expectation and you get a new child plan in the same lineage. Old approvals stay with old plans."
            >
              <div className="mt-5 flex items-center gap-2 font-mono text-[11px]">
                <span className="rounded border border-pass/30 bg-pass/10 px-2 py-1 text-pass">rev 1 ✓</span>
                <span className="h-px flex-1 bg-white/15" />
                <span className="rounded border border-attn/30 bg-attn/10 px-2 py-1 text-attn">rev 2 · needs approval</span>
              </div>
            </Feature>
            <Feature
              className="md:col-span-3"
              icon={GitCompareArrows}
              title="Revision diff"
              body="Re-approving? See exactly what changed: word-level rule edits, every flipped expectation, new or resolved assumptions — and whether an old approval was reset."
            >
              <div className="mt-5 rounded-xl border border-white/[.07] bg-black/30 p-4 text-sm leading-relaxed text-ink-muted">
                Editors can <del className="rounded bg-fail/10 px-1 text-fail/80">also</del>{" "}
                <ins className="rounded bg-pass/15 px-1 text-pass no-underline">read and</ins> update them.
                <p className="mt-2 font-mono text-[11px] text-ink-faint">
                  viewer · update · own <span className="line-through">deny 403</span> →{" "}
                  <span className="text-pass">allow 200</span>
                </p>
              </div>
            </Feature>
            <Feature
              className="md:col-span-3"
              icon={Workflow}
              title="CI gate"
              body="Commit the approved plan and run it on every push. The build fails on any mismatch — and refuses plans that are unapproved or edited after approval."
            >
              <pre className="mt-5 overflow-x-auto rounded-xl border border-white/[.07] bg-black/30 p-4 font-mono text-[11.5px] leading-relaxed text-ink-muted">
                <span className="text-brand">$</span> ruleproof-ci -bundle plan.json -fixture broken{"\n"}
                {"  "}<span className="text-fail">FAIL</span> viewer read other tenant  want 403 got 200{"\n"}
                {"  "}6 passed · <span className="text-fail">2 failed</span>{"  "}
                <span className="text-ink-faint">→ exit 1</span>
              </pre>
            </Feature>
            <Feature
              className="md:col-span-2"
              icon={Ban}
              title="Exact status matching"
              body="Want 403, got 500? That’s a failure. Redirects and crashes never masquerade as a denial."
            />
            <Feature
              className="md:col-span-2"
              icon={ScanSearch}
              title="Evidence inspector"
              body="An accessible drawer with the rule excerpt, revision IDs, redacted request headers and a highlighted response body."
            />
            <Feature
              className="md:col-span-3"
              icon={History}
              title="Run history & replay"
              body="Every run is stored against the exact revision it tested. Reopen any past run and compare seeded vs corrected side by side."
            />
            <Feature
              className="md:col-span-3"
              icon={Download}
              title="Exportable evidence bundle"
              body="One JSON file with the rule, every revision, approvals and runs — attach it to a ticket, a PR or an audit trail."
            />
            <Feature
              className="md:col-span-2"
              icon={Database}
              title="SQLite or Postgres"
              body="Embedded SQLite out of the box. Set DATABASE_URL and the same SQL runs on Postgres."
            />
            <Feature
              className="md:col-span-2"
              icon={Mic}
              title="Voice-first input"
              body="Dictate rules with Wispr Flow into a plain textarea. The parser was tuned on how people say rules out loud."
            />
            <Feature
              className="md:col-span-2"
              icon={ShieldCheck}
              title="Accessible by default"
              body="Focus-trapped drawer, Radix primitives, keyboard everything, reduced-motion support, 390px to 1440px."
            />
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="border-y border-white/[.07] bg-[#0d0f0e] py-28 sm:py-36">
          <div className={wrap}>
            <SectionHeading
              id="architecture"
              kicker="Under the hood"
              title={<>One Go binary. Zero magic.</>}
            >
              A small REST API in Go serves both synthetic fixtures and the
              statically exported Next.js UI from a single origin. Fits in one
              container.
            </SectionHeading>

            <div className="mt-16 grid gap-4 lg:grid-cols-[1fr_auto_1.6fr_auto_1fr] lg:items-stretch" data-stagger>
              <ArchBox title="Browser" sub="Next.js 16 · React 19 · Tailwind v4 · GSAP" items={["Landing + sample", "Evidence Studio", "Evidence drawer"]} />
              <ArchArrow />
              <div className={cn(card, "border-brand/25 p-6")}>
                <p className="font-mono text-[11px] uppercase tracking-[.16em] text-brand">cmd/server · Go</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    ["internal/api", "REST surface, JSON errors"],
                    ["internal/rules", "Bounded sentence parser"],
                    ["internal/check", "HTTP runner, exact match"],
                    ["internal/store", "Immutable plans · SQLite/PG"],
                  ].map(([p, d]) => (
                    <div key={p} className="rounded-lg border border-white/[.07] bg-black/30 p-3">
                      <p className="font-mono text-xs text-ink">{p}</p>
                      <p className="mt-1 text-xs text-ink-faint">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
              <ArchArrow />
              <ArchBox
                title="Fixtures"
                sub="internal/assets · synthetic"
                items={["Seeded defect — skips read ownership check", "Corrected — checks tenant on every request", "Two local servers, started with the API"]}
              />
            </div>
          </div>
        </section>

        {/* API */}
        <section className={cn(wrap, "grid gap-14 py-28 sm:py-36 lg:grid-cols-[1fr_1.3fr]")}>
          <div id="api" className="scroll-mt-24" data-reveal>
            <p className={cn(eyebrow, "flex items-center gap-2")}>
              <span className="h-px w-6 bg-brand" /> API
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
              Every click is an endpoint.
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-muted">
              The studio is a thin client. Script the same explain → approve →
              run → export flow from CI, a notebook or curl.
            </p>
            <pre className="mt-8 overflow-x-auto rounded-xl border border-white/[.07] bg-black/40 p-5 font-mono text-[12.5px] leading-relaxed text-ink-muted">
              <span className="text-brand">curl</span> -X POST localhost:8080/api/plans \{"\n"}
              {"  "}-d <span className="text-attn">{`'{"text":"Viewers can read assets in their own tenant."}'`}</span>
            </pre>
          </div>
          <div className={cn(card, "divide-y divide-white/[.05] overflow-hidden")} data-reveal>
            {endpoints.map(([m, path, desc]) => (
              <div key={m + path} className="grid grid-cols-[64px_1fr] items-baseline gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[64px_1fr_1fr]">
                <span className={cn("font-mono text-[11px] font-semibold", methodColor[m])}>{m}</span>
                <code className="font-mono text-[13px] text-ink">{path}</code>
                <span className="col-start-2 text-xs text-ink-faint sm:col-start-auto sm:text-right">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* VOICE */}
        <section className="relative isolate overflow-hidden border-y border-white/[.07] py-28 sm:py-36">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_100%,rgba(213,248,121,.1),transparent)]" />
          <div className={cn(wrap, "grid gap-12 lg:grid-cols-2 lg:items-center")}>
            <div data-reveal>
              <p className={cn(eyebrow, "flex items-center gap-2")}>
                <span className="h-px w-6 bg-brand" /> Built with Wispr Flow
              </p>
              <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
                Say the rule. Out loud.
              </h2>
              <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink-muted">
                Access rules are usually spoken first — in standups, reviews and
                Slack huddles. RuleProof meets them there: dictate straight into
                the Explain editor with Wispr Flow and the parser handles the
                way people actually phrase permissions.
              </p>
            </div>
            <div className={cn(card, "p-6")} data-reveal>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-brand text-brand-ink animate-pulse-ring">
                  <Mic size={18} />
                </span>
                <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden>
                  {Array.from({ length: 48 }, (_, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-brand/60"
                      style={{ height: `${20 + Math.round(Math.abs(Math.sin(i * 1.7)) * 80)}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-6 text-lg leading-relaxed text-ink">
                “Viewers can read assets in their own tenant. Editors can also
                update them. Neither role can access another tenant’s assets.”
              </p>
              <p className="mt-4 font-mono text-[11px] text-ink-faint">
                → 6 concepts · 0 assumptions · 8 checks ready for review
              </p>
            </div>
          </div>
        </section>

        {/* SCOPE */}
        <section className={cn(wrap, "py-28 sm:py-36")}>
          <SectionHeading
            id="scope"
            kicker="Honest by design"
            title={<>Evidence you can inspect. Limits you can see.</>}
          />
          <div className="mt-14 grid gap-4 md:grid-cols-2" data-stagger>
            <div className={cn(card, "p-7")}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-pass">
                <ShieldCheck size={18} /> A green matrix means
              </h3>
              <ul className="mt-5 space-y-3 text-[15px] text-ink-muted">
                <li>Each approved scenario returned exactly its expected status.</li>
                <li>Against that fixture, for that revision, at that time.</li>
                <li>With request and response kept as evidence.</li>
              </ul>
            </div>
            <div className={cn(card, "p-7")}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-attn">
                <ShieldAlert size={18} /> It does not mean
              </h3>
              <ul className="mt-5 space-y-3 text-[15px] text-ink-muted">
                <li>Your whole application is secure.</li>
                <li>Roles or actions outside viewer/editor · read/update were tested.</li>
                <li>Anything about your production API — only bundled fixtures are targeted.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* QUICKSTART + FAQ */}
        <section className="border-y border-white/[.07] bg-[#0d0f0e] py-28 sm:py-36">
          <div className={cn(wrap, "grid gap-16 lg:grid-cols-2")}>
            <div id="start" className="scroll-mt-24" data-reveal>
              <p className={cn(eyebrow, "flex items-center gap-2")}>
                <span className="h-px w-6 bg-brand" /> Quickstart
              </p>
              <h2 className="mb-8 mt-5 text-4xl font-semibold tracking-[-0.035em]">Running in a minute.</h2>
              <Quickstart />
            </div>
            <div id="faq" className="scroll-mt-24" data-reveal>
              <p className={cn(eyebrow, "flex items-center gap-2")}>
                <span className="h-px w-6 bg-brand" /> FAQ
              </p>
              <h2 className="mb-8 mt-5 text-4xl font-semibold tracking-[-0.035em]">Fair questions.</h2>
              <Faq />
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className={cn(wrap, "py-28 sm:py-36")}>
          <div
            className="relative isolate overflow-hidden rounded-3xl border border-brand/20 px-6 py-20 text-center sm:px-12 sm:py-28"
            data-reveal
          >
            <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_50%_0%,rgba(213,248,121,.18),transparent_70%)]" />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,#000,transparent_75%)]"
            />
            <p className={eyebrow}>Make the rule testable</p>
            <h2 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1] tracking-[-0.045em] sm:text-7xl">
              Don’t stop at “it should.” See what it does.
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/studio/" className={buttonVariants({ size: "lg" })}>
                Open the Evidence Studio <ArrowUpRight size={18} />
              </Link>
              <a href="#start" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                Run it locally
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[.07]">
        <div className={cn(wrap, "flex flex-col gap-6 py-10 sm:flex-row sm:items-center")}>
          <Logo />
          <p className="text-sm text-ink-faint">
            Built for <span className="text-ink-muted">No Hands: The Wispr Challenge</span> · WeMakeDevs × Wispr Flow
          </p>
          <nav className="flex gap-5 text-sm text-ink-muted sm:ml-auto" aria-label="Footer">
            <Link href="/studio/" className="hover:text-ink">Studio</Link>
            <a href="#api" className="hover:text-ink">API</a>
            <a href="#scope" className="hover:text-ink">Scope</a>
            <a href="https://github.com/PrinceXDev/ruleproof" className="hover:text-ink">GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
  className,
  children,
}: {
  icon: typeof Quote;
  title: string;
  body: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <article
      className={cn(
        card,
        "group relative overflow-hidden p-6 transition-colors duration-300 hover:border-white/15 sm:p-7",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -right-16 -top-16 size-40 rounded-full bg-brand/0 blur-3xl transition-colors duration-500 group-hover:bg-brand/10"
      />
      <span className="grid size-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-brand">
        <Icon size={18} />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
      {children}
    </article>
  );
}

function ArchBox({ title, sub, items }: { title: string; sub: string; items: string[] }) {
  return (
    <div className={cn(card, "p-6")}>
      <p className="font-mono text-[11px] uppercase tracking-[.16em] text-ink-faint">{sub}</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-ink-muted">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArchArrow() {
  return (
    <div aria-hidden className="flex items-center justify-center text-brand/60">
      <ArrowRight className="rotate-90 lg:rotate-0" size={22} />
    </div>
  );
}
