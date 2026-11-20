import Link from "next/link";
import { IconCheck } from "@/components/icons";
import { Card } from "@/components/ui";
import { moduleUrl } from "@/lib/pipeline";
import { getFinalVideo, getLatestRender } from "@/lib/production";
import type { EpisodeView } from "@/lib/queries";
import { planRender, type RenderPlan } from "@/lib/render";
import { RenderControls } from "./render-controls";

function fmt(sec: number) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Assemble everything into the final MP4. */
export async function RenderPanel({ ep }: { ep: EpisodeView }) {
  let plan: RenderPlan | null = null;
  let planError = "";
  try {
    plan = await planRender(ep.code);
  } catch (e) {
    planError = e instanceof Error ? e.message : "Could not plan the render";
  }
  const [job, final] = await Promise.all([getLatestRender(ep.code), getFinalVideo(ep.code)]);
  const c = plan?.counts;

  const checks = plan
    ? [
        {
          ok: c!.sections > 0 && c!.voiced === c!.sections,
          warn: c!.voiced > 0,
          label: `Narration: ${c!.voiced}/${c!.sections} sections recorded`,
          hint: c!.voiced < c!.sections ? "Sections without voice play silent (4 s per shot)." : "",
          href: moduleUrl(ep.code, "voice"),
        },
        {
          ok: c!.shots > 0 && c!.images + c!.clips === c!.shots,
          warn: c!.images + c!.clips > 0,
          label: `Shots: ${c!.images + c!.clips}/${c!.shots} have an image or clip`,
          hint: c!.images + c!.clips < c!.shots ? "Missing shots render as a placeholder card." : "",
          href: moduleUrl(ep.code, "shots"),
        },
        {
          ok: c!.clips > 0,
          warn: true,
          label: `Animated clips: ${c!.clips}`,
          hint: "Optional. Stills get a slow camera move from the shot list.",
          href: moduleUrl(ep.code, "motion"),
        },
        {
          ok: !!plan.music,
          warn: true,
          label: plan.music ? "Music bed ready" : "No music bed",
          hint: plan.music ? "" : "Optional. Voice only without it.",
          href: moduleUrl(ep.code, "music"),
        },
      ]
    : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <RenderControls code={ep.code} job={job} final={final} ready={!!plan && plan.counts.shots > 0} estimated={plan ? fmt(plan.seconds) : ""} />

      <Card className="h-fit p-4">
        <h3 className="font-semibold">Pre-flight</h3>
        <p className="mb-3 text-xs text-muted">
          You can render a draft at any time. Gaps are filled so you can watch the pacing early.
        </p>
        {planError ? (
          <p className="text-sm text-rose-600">{planError}</p>
        ) : (
          <ul className="space-y-3">
            {checks.map((x) => (
              <li key={x.label} className="flex gap-2.5 text-sm">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                    x.ok ? "bg-emerald-500 text-white" : x.warn ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {x.ok ? <IconCheck width={12} height={12} strokeWidth={3} /> : <span className="text-[11px] font-bold">!</span>}
                </span>
                <span className="min-w-0">
                  <Link href={x.href} className="font-medium hover:text-accent">
                    {x.label}
                  </Link>
                  {x.hint && <span className="block text-xs text-muted">{x.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {plan && (
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
            Estimated length <strong className="text-foreground">{fmt(plan.seconds)}</strong> · {plan.counts.shots} shots ·{" "}
            {plan.counts.sections} narration sections
          </p>
        )}
      </Card>
    </div>
  );
}
