import { parseScore } from "@/lib/course";

/**
 * The before/after result, drawn as the movement it is.
 *
 * ⚠️ THE FORM IS A CHANGE-OVER-TIME BAR, NOT TWO NUMBER CARDS. Two boxes with an arrow
 * between them is a *layout* of the numbers; it draws the two states and leaves the reader
 * to do the subtraction. The job of this section is the distance travelled, so distance is
 * what gets encoded — a track with a marker where they started and a fill reaching where
 * they finished. The gain is the thing you see first.
 *
 * ⚠️ THE TWO MEASURES SHARE ONE AXIS BECAUSE BOTH ARE PLOTTED AS % OF THEIR OWN MAXIMUM.
 * Score is out of ten and confidence out of five; putting raw values on a common track
 * would make 5/10 and 2/5 look like the same distance from each other as they are from
 * zero. Indexing each to its own maximum is what makes them comparable at all — and is why
 * this is one axis rather than the dual-axis chart it superficially resembles.
 *
 * ⚠️ COLOURS ARE A SEQUENTIAL RAMP, NOT TWO CATEGORIES. Before and after are the same
 * student at two moments, so the relationship is magnitude, not identity: one hue, dim to
 * bright. `#54708F → #9BC8FF` on the `#0B1F38` surface passes lightness monotonicity,
 * adjacent ΔL and light-end contrast (validated, not eyeballed).
 *
 * Falls back to plain text when a course expresses its result as something other than a
 * fraction — "Band 5 → Band 7" has no geometry to draw.
 */
export default function ProofGain({
  weeks,
  rows,
}: {
  weeks: number;
  rows: { label: string; unit: string; before: string; after: string }[];
}) {
  const parsed = rows.map((row) => ({
    ...row,
    from: parseScore(row.before),
    to: parseScore(row.after),
  }));

  const drawable = parsed.filter((row) => row.from && row.to);

  if (!drawable.length) {
    return (
      <div className="gain gain--text">
        {parsed.map((row) => (
          <p key={row.label}>
            <span>{row.label}</span>
            <strong>
              {row.before} → {row.after}
            </strong>
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="gain" data-reveal="">
      <div className="gain__axis" aria-hidden="true">
        <span>Week 1</span>
        <span className="gain__axis-line" />
        <span>Week {weeks}</span>
      </div>

      {drawable.map((row, index) => {
        const from = row.from!;
        const to = row.to!;

        /**
         * Percentage gain, relative to where they started — 5/10 → 9/10 is +80%, not
         * +40 percentage points.
         *
         * ⚠️ A RELATIVE GAIN FROM A LOW BASE IS A BIG NUMBER. It stays honest only because
         * the raw scores are direct-labelled on the track directly beneath it — the
         * percentage is the headline, `5/10 → 9/10` is the working. A percentage floating
         * with no scores under it would be the kind of figure that is technically true and
         * rhetorically dishonest.
         *
         * ⚠️ GUARDED AGAINST A ZERO BASE. A student starting at 0/10 has an undefined
         * relative gain, not an infinite one — that row falls back to the plain difference.
         */
        const gainPct = from.value > 0 ? ((to.value - from.value) / from.value) * 100 : null;
        const delta = to.value - from.value;

        return (
          <div
            className="gain__row"
            key={row.label}
            style={
              {
                "--from": `${from.pct}%`,
                "--to": `${to.pct}%`,
                // Staggered so the two bars read as a sequence rather than a jump.
                "--delay": `${index * 140}ms`,
              } as React.CSSProperties
            }
          >
            <div className="gain__head">
              <span className="gain__label">{row.label}</span>
              {delta > 0 ? (
                <span className="gain__delta">
                  {gainPct !== null ? (
                    <strong>+{Math.round(gainPct)}%</strong>
                  ) : (
                    <strong>
                      +{Number(delta.toFixed(1))} {row.unit}
                    </strong>
                  )}
                </span>
              ) : null}
            </div>

            <div
              className="gain__track"
              role="img"
              aria-label={`${row.label}: ${from.label} in week 1, ${to.label} in week ${weeks}`}
            >
              <div className="gain__fill" />
              <div className="gain__marker" />
              {/* Direct labels at both ends — with two marks and one entity there is
                  nothing for a legend to disambiguate. */}
              <span className="gain__from">{from.label}</span>
              <span className="gain__to">{to.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
