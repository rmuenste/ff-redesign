import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  ComparisonPanel,
  ContentRenderer,
  DataTable,
  DownloadTable,
  Equation,
  Figure,
  GalleryFigure,
  Icon,
  KpiBox,
  Overline,
  ReferenceList,
  Section,
  Tabs,
  useTabParam,
  VideoBlock
} from "../components";
import {
  sedimentationBrennerBands,
  sedimentationDownloads,
  sedimentationLandedFraction,
  sedimentationLubricationCases,
  sedimentationLubricationSpecs,
  sedimentationPhysicalRows,
  sedimentationPlaybackSpeeds,
  sedimentationCases,
  sedimentationCodes,
  sedimentationHasRun,
  sedimentationLevelPlotSpecs,
  sedimentationLevels,
  sedimentationPlotSpecs,
  sedimentationReferenceRows,
  sedimentationRunsByCode,
  sedimentationReferences,
  sedimentationDecomposition,
  sedimentationDtLadder,
  sedimentationFourCasePosterAsset,
  sedimentationFourCaseVideoAsset,
  sedimentationFourColumnPosterAsset,
  sedimentationFourColumnVideoAsset,
  sedimentationSetupAsset,
  type SedimentationBrennerBand,
  type SedimentationDecompositionFit,
  type SedimentationDtRow,
  type SedimentationLubricationCase,
  type SedimentationCodeId,
  type SedimentationPhysicalRow,
  type SedimentationRun
} from "../data/sedimentation";

function IntroductionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <GalleryFigure id="sedimentation" />
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "This benchmark examines the sedimentation of a single spherical particle in a confined tank. It validates particulate-flow methods against experiments and lattice-Boltzmann simulations of a sphere settling through silicone oil over particle Reynolds numbers from 1.5 to 31.9."
          },
          {
            type: "paragraph",
            text:
              "The experiment uses Particle Image Velocimetry (PIV), so the page compares simulation position and velocity curves directly with measured particle-motion references in interactive plots."
          },
          {
            type: "paragraph",
            text:
              "The observables focus on the sphere trajectory, the vertical settling velocity, and the near-wall deceleration caused by lubrication forces as the sphere approaches the tank bottom."
          }
        ]}
      />
      <VideoBlock
        src={sedimentationFourCaseVideoAsset}
        poster={sedimentationFourCasePosterAsset}
        title="Four cases on one clock"
      />
      <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, maxWidth: 760, marginTop: -20 }}>
        The four benchmark cases settle side by side on one clock: all four spheres are released at the same instant,
        and the film runs from t = 0 to 4.30 s at half real time. Colour is the fluid velocity magnitude on a vertical
        plane through the middle of each tank, and the sphere is the opaque body. Only the two faster cases reach the
        floor &mdash; E4 at Re = 31.9 touches down at t = 1.16 s and rebounds about 0.17 mm, E3 at Re = 11.6 at
        t = 1.58 s &mdash; while at Re = 4.1 and Re = 1.5 the squeeze film arrests the sphere 0.13 to 0.14 mm clear of
        the bottom. These are the base cases, without the sub-grid lubrication model; once a case has settled its
        column holds its last image, so all four stay on the same clock.
      </p>
      <div style={{ marginTop: 32 }}>
        <h3>Reference</h3>
        <ReferenceList items={sedimentationReferences} />
      </div>
    </Section>
  );
}

function DefinitionTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 80 }}>
      <ContentRenderer
        blocks={[
          { type: "heading", level: 3, text: "Geometry and flow configuration" },
          {
            type: "paragraph",
            text:
              "A Nylon sphere settles under gravity in a confined rectangular tank filled with silicone oil. The internal tank dimensions are 100 x 100 x 160 mm, the particle diameter is 15 mm, and the sphere center is initially 127.5 mm above the bottom wall."
          },
          { type: "equation", value: "$d_p = 15\\,\\mathrm{mm},\\quad \\mathbf{u}=0\\text{ on all walls}$", block: true },
          {
            type: "paragraph",
            text:
              "No-slip boundary conditions are imposed on the container walls and on the moving particle surface. The confined geometry is part of the benchmark, so wall effects are represented consistently in the experiment and simulations."
          }
        ]}
      />
      <Figure
        src={sedimentationSetupAsset}
        alt="Experimental setup and boundary conditions for a settling sphere"
        caption="Experimental setup and boundary conditions for the settling-sphere benchmark."
      />
      <div className="stack" style={{ gap: 24, marginTop: 24 }}>
        <div>
          <h3>Particle and fluid properties</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The particle density is <Equation>{"$\\rho_p = 1120\\,\\mathrm{kg/m^3}$"}</Equation>. The four experimental cases vary the silicone-oil density and viscosity to cover low and moderately inertial settling regimes.
          </p>
          <DataTable<SedimentationPhysicalRow>
            columns={[
              { id: "case", header: "Case", render: row => row.case },
              { id: "rhoF", header: "rho_f [kg/m3]", align: "right", render: row => row.rhoF },
              { id: "muF", header: "mu_f [Pa s]", align: "right", render: row => row.muF },
              { id: "re", header: "Re", align: "right", render: row => row.re },
              { id: "st", header: "St", align: "right", render: row => row.st }
            ]}
            rows={sedimentationPhysicalRows}
            getRowKey={row => row.case}
          />
        </div>
        <div>
          <h3>Key equations</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The Reynolds and Stokes numbers are defined from the terminal settling velocity and the fluid properties:
          </p>
          <Equation block>{"$Re = \\frac{\\rho_f u_\\infty d_p}{\\mu_f},\\quad St = \\frac{1}{9}\\frac{\\rho_p d_p u_\\infty}{\\rho_f \\nu}$"}</Equation>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The reference paper adds a near-wall lubrication force to its lattice-Boltzmann cases, because below one
            grid spacing its method resolves no squeeze film at all. That correction is the paper&apos;s Eq. 10, and it
            is what distinguishes its S18/S19 runs from S16/S17:
          </p>
          <Equation block>{"$F_{lub} = -6\\pi\\mu_f d_p u_\\perp\\left(\\frac{d_p}{h}-\\frac{d_p}{D_0}\\right)$"}</Equation>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The E1–E4 results on this page carry no such term. They resolve the near-wall flow directly at D/h ≈ 24,
            with the fictitious-boundary method alone and no lubrication correction of any kind. A separate study of
            what a sub-grid model adds on top of that resolved film, on these same fixtures, is on the Lubrication tab.
          </p>
        </div>
      </div>
    </Section>
  );
}

/**
 * The composite player. `VideoBlock` owns its own <video> and exposes no ref,
 * so the speed switcher lives here rather than on the shared component every
 * other page renders; the player itself keeps VideoBlock's dimensions and
 * frame. The switcher mirrors the plot controls visually (a labelled group of
 * option buttons with a mono detail line) without reaching into the
 * comparison-panel internals, which are local to that module.
 *
 * One file, three rates: the asset is the 50 fps master and slow motion is
 * `playbackRate`, so switching keeps the playhead where it is. The rate is
 * re-applied on `loadedmetadata` because some browsers reset it when the
 * resource loads, and `defaultPlaybackRate` is set alongside it for the same
 * reason.
 */
function CompositeVideoBlock() {
  const [speedId, setSpeedId] = useState(sedimentationPlaybackSpeeds[0].id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rate = (sedimentationPlaybackSpeeds.find(speed => speed.id === speedId) ?? sedimentationPlaybackSpeeds[0]).rate;

  const applyRate = () => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;
  };

  useEffect(applyRate, [rate]);

  return (
    <div>
      <video
        ref={videoRef}
        controls
        preload="metadata"
        poster={sedimentationFourColumnPosterAsset}
        onLoadedMetadata={applyRate}
        style={{ width: "100%", maxWidth: 760, borderRadius: 4, border: "1px solid var(--divider)", display: "block" }}
      >
        <source src={sedimentationFourColumnVideoAsset} type="video/mp4" />
      </video>
      <div style={{ marginTop: 16, maxWidth: 760 }}>
        <Overline style={{ marginBottom: 12 }}>Playback speed</Overline>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {sedimentationPlaybackSpeeds.map(speed => {
            const active = speed.id === speedId;
            return (
              <button
                key={speed.id}
                type="button"
                className="focus-ring"
                aria-pressed={active}
                onClick={() => setSpeedId(speed.id)}
                style={{
                  padding: "8px 12px",
                  background: active ? "var(--surface-alt)" : "transparent",
                  border: `1px solid ${active ? "var(--primary)" : "var(--divider)"}`,
                  borderRadius: 4,
                  color: active ? "var(--fg1)" : "var(--fg2)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left"
                }}
              >
                <span style={{ display: "block" }}>{speed.label}</span>
                <span style={{ display: "block", color: "var(--fg3)", fontFamily: "var(--font-mono)", fontSize: 10, marginTop: 2 }}>
                  {speed.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const levelLabel = (id: string) => sedimentationLevels.find(level => level.id === id)?.label ?? id.toUpperCase();

const allRuns = sedimentationCodes.flatMap(code => sedimentationRunsByCode[code.id]);

/** Cases a code does not have at every level yet, as "FEAT3 has E1 at L3 and L4." */
function partialLadderNote() {
  const notes = sedimentationCodes.flatMap(code =>
    sedimentationCases
      .map(testCase => ({
        id: testCase.id,
        levels: sedimentationLevels
          .filter(level => sedimentationHasRun(testCase.id, level.id, sedimentationRunsByCode[code.id]))
          .map(level => level.label)
      }))
      .filter(entry => entry.levels.length < sedimentationLevels.length)
      .map(entry =>
        entry.levels.length
          ? `${code.label} has ${entry.id} at ${entry.levels.join(" and ")}.`
          : `${code.label} has no ${entry.id} curve yet.`
      )
  );
  return notes.length ? ` ${notes.join(" ")}` : "";
}

/** ", all with a time step of 1 ms" when the runs share one step, from the run summaries. */
function runTimeStepNote() {
  const steps = [...new Set(allRuns.map(run => run.dtS))];
  return steps.length === 1 ? `, all with a time step of ${steps[0] * 1000} ms` : "";
}

/** One row of the run table: a run of either code, with the mesh it ran on. */
interface RunRow extends SedimentationRun {
  code: SedimentationCodeId;
}

/** Both codes' runs, case by case and level by level, FeatFloWer first in each pair. */
const runRows: RunRow[] = sedimentationCases.flatMap(testCase =>
  sedimentationLevels.flatMap(level =>
    sedimentationCodes.flatMap(code =>
      sedimentationRunsByCode[code.id]
        .filter(run => run.case === testCase.id && run.level === level.id)
        .map(run => ({ ...run, code: code.id }))
    )
  )
);

const codeLabel = (id: SedimentationCodeId) => sedimentationCodes.find(code => code.id === id)?.label ?? id;
const cellsAcross = (level: string) => sedimentationLevels.find(entry => entry.id === level)?.cellsAcrossDiameter;

function ResultsTab() {
  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ gap: 28 }}>
        <div style={{ maxWidth: 900 }}>
          <h3>Two codes</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The four cases on this tab were computed with FeatFloWer and again with FEAT3, the newest member of the
            FEATFLOW family, on the same meshes and with the same time step. Both codes&apos; curves share the two
            charts below and both are listed in the run table, so they can be compared level by level against the
            same PIV measurements.
          </p>
        </div>
        <div style={{ maxWidth: 900 }}>
          <h3>Mesh refinement, case by case</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Each case was run on three meshes, from the coarsest, L2, to the finest, L4. Pick a case to see both
            codes at all three levels on top of the PIV measurements, as settling velocity or as the height of the
            sphere above the bottom. Colour and line style give the mesh level and the marker gives the code, a
            diamond for FeatFloWer and a triangle for FEAT3, so each level is a pair of curves in one colour; untick
            any of the six to thin the chart out. For both codes the curves draw together as the mesh is refined:
            going from L3 to L4 moves the settling peak less than going from L2 to L3.{partialLadderNote()}
          </p>
        </div>
        <ComparisonPanel specs={sedimentationLevelPlotSpecs} defaultMetric="velocity" />

        <div style={{ maxWidth: 900 }}>
          <h3>The runs behind the curves</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Every curve on this tab is one of these runs{runTimeStepNote()}. The peak is the fastest
            settling speed the sphere reaches on its way down. Both codes ran on the same meshes, so a level has the
            same number of mesh cells across the sphere diameter for each.
          </p>
          <DataTable<RunRow>
            columns={[
              { id: "case", header: "Case", render: row => <span style={{ fontWeight: 500 }}>{row.case}</span> },
              { id: "level", header: "Level", render: row => levelLabel(row.level) },
              { id: "code", header: "Code", render: row => codeLabel(row.code) },
              {
                id: "cells",
                header: "Cells across diameter",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{cellsAcross(row.level)?.toFixed(1)}</span>
              },
              {
                id: "steps",
                header: "Steps",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.steps.toLocaleString("en-US")}</span>
              },
              {
                id: "time",
                header: "Simulated [s]",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.tEndS.toFixed(2)}</span>
              },
              {
                id: "peak",
                header: "Peak speed [mm/s]",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>{(-row.peakVzMS * 1000).toFixed(2)}</span>
                )
              },
              {
                id: "tpeak",
                header: "Peak at [s]",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.tPeakS.toFixed(3)}</span>
              }
            ]}
            rows={runRows}
            getRowKey={row => `${row.case}-${row.level}-${row.code}`}
          />
        </div>

        <div className="stack" style={{ maxWidth: 900, gap: 20 }}>
          <h3 style={{ margin: 0 }}>What convergence looks like on this benchmark</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
            For FeatFloWer, the settling peak was measured across three mesh levels for all four cases. Refinement is not monotone:
            coarse meshes overshoot the peak by three to four per cent, the finest meshes undershoot by around two, and
            the intermediate level lands close to the reference partly because the two errors cancel. The practical
            consequence is that agreement at one resolution is not evidence of convergence, and mesh resolution should
            never be chosen to make a curve match.
          </p>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
            The step from the intermediate to the finest level shifts the peak by 2.1 to 2.4 percentage points, and it
            does so almost identically for every case despite an eightfold range in Reynolds number. The dominant
            spatial error therefore comes from how the sphere surface is represented on the mesh, not from the flow
            regime — which is why the four cases' refinement curves lie nearly on top of one another.
          </p>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
            The lowest-Reynolds case is the hard one: it sits about three per cent below the experiment at the
            intermediate level and moves further away under refinement. That gap is not specific to FeatFloWer. The
            same discrepancy appears in the original paper, whose own lattice-Boltzmann result is about five per cent
            below its own experiment for that case; FeatFloWer&apos;s finest configurations agree with those published simulations
            to within one per cent across all four cases. Agreement with the experiment to within two per cent is out
            of reach for any simulation there, so for this case the paper&apos;s simulations are as much a reference as
            its measurements.
          </p>
          <div
            style={{
              borderLeft: "3px solid var(--accent)",
              background: "var(--surface-alt)",
              borderRadius: 4,
              padding: "16px 20px"
            }}
          >
            <p style={{ margin: 0, color: "var(--fg1)", lineHeight: 1.65 }}>
              For the two lowest-Reynolds cases, the velocity ratios printed in the paper&apos;s Table II are a better
              reference than the digitised curves, whose peaks run three to four per cent fast. The time-step study
              below is measured against Table II for that reason.
            </p>
          </div>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
            The time-step study is stable at every step size tried, so the time step can be chosen against an error
            budget rather than for stability. The remaining dependence on it is genuine but sub-linear:
          </p>
        </div>

        <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" }}>
          <div>
            <h4 style={{ margin: "0 0 12px" }}>Time-step study, Re = 31.9 at D/h = 23.9</h4>
            <DataTable<SedimentationDtRow>
              columns={[
                { id: "dt", header: "dt [ms]", render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.dtMs}</span> },
                {
                  id: "error",
                  header: "Peak error vs Table II",
                  align: "right",
                  render: row => (
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {row.errorPct > 0 ? "+" : ""}
                      {row.errorPct.toFixed(2)}%
                    </span>
                  )
                }
              ]}
              rows={sedimentationDtLadder}
              getRowKey={row => `${row.level}-${row.dtMs}`}
            />
            <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
              Halving the step moves the peak by about half a percentage point each time, so the apparent order is
              below one rather than the second order the time scheme would suggest on its own.
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 12px" }}>Fitted error split, Re = 31.9</h4>
            <DataTable<SedimentationDecompositionFit>
              columns={[
                { id: "order", header: "Assumed order", render: row => <span style={{ fontFamily: "var(--font-mono)" }}>p = {row.order}</span> },
                ...["L2", "L3", "L4"].map(level => ({
                  id: level,
                  header: `Spatial ${level}`,
                  align: "right" as const,
                  render: (row: SedimentationDecompositionFit) => (
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {row.spatialPp[level] > 0 ? "+" : ""}
                      {row.spatialPp[level]?.toFixed(2)}
                    </span>
                  )
                })),
                {
                  id: "temporal",
                  header: "Temporal at 1 ms",
                  align: "right",
                  render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.temporalPpAt1ms.toFixed(2)}</span>
                }
              ]}
              rows={sedimentationDecomposition.E4 ?? []}
              getRowKey={row => `p${row.order}`}
            />
            <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
              Percentage points, from an additive fit to all mesh levels and time steps. The temporal order is not known precisely, so both
              readings are shown; they agree on the structure. The spatial term reaches zero within its uncertainty at
              the finest level, and the temporal term is negative while the coarse spatial terms are positive — which
              is the cancellation that makes the intermediate mesh at 1 ms look better than it is.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 900 }}>
          <h3>All four cases at one level</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The same runs, with the four cases side by side at a single mesh level. Each case has a FeatFloWer and a
            FEAT3 curve in its colour, again told apart by the marker. The level switch changes the simulation
            curves only; the PIV markers are the same measurements at every level.
          </p>
        </div>
        <ComparisonPanel specs={sedimentationPlotSpecs} defaultMetric="velocity" />
        <div style={{ maxWidth: 900 }}>
          <h3>Where the curves come from</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            The same four cases on one shared clock, from t = 0 to 4.30 s, with the columns left to right E1, E2, E3,
            E4. Beneath them the settling velocity and the sphere height of all four cases are drawn up to the current
            instant, against the PIV measurements, so every point on the FeatFloWer curves above can be traced back to the flow
            that produced it. The film plays at physical real time by default; the 2x and 4x settings slow it down
            without changing anything in the data. Each column holds its last image once that case has settled &mdash;
            E4 from t = 1.30 s, E3 from 1.80 s, E2 from 2.70 s &mdash; which is what keeps the four on one clock.
          </p>
          <CompositeVideoBlock />
        </div>
      </div>
    </Section>
  );
}

const pct = (value: number, digits = 0) => `${value >= 0 ? "+" : "−"}${Math.abs(value * 100).toFixed(digits)}%`;
const ms = (seconds: number) => `${Math.round(seconds * 1000)} ms`;
const mm = (metres: number) => `${(metres * 1000).toFixed(3)} mm`;

function LubricationTab({ onOpenViscometer }: { onOpenViscometer: () => void }) {
  const clamp = sedimentationLubricationCases[0];

  return (
    <Section style={{ paddingTop: 40, paddingBottom: 100 }}>
      <div className="stack" style={{ maxWidth: 900, gap: 20 }}>
        <h3 style={{ margin: 0 }}>What a sub-grid model adds to an already-resolved film</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          The rigid-body engine now carries a switchable sub-grid lubrication model — the Kroupa et al. resistance
          set with its wall terms, Vinogradova slip and a saturation cut-off. Switching it on in a resolved
          simulation is not as simple as adding the classical force, because the flow solver is already carrying
          most of the squeeze film. Adding the full resistance on top of that counts the same physics twice.
        </p>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, margin: 0 }}>
          For CFD-coupled runs the model therefore runs in a <em>deficit</em> form: every resistance coefficient is
          reduced by its own value at the gap where the model switches on, so only the part of the film the resolved
          flow does <em>not</em> carry is added. Activation is tied to the mesh rather than to the particle — a clamp
          sets it at {clamp.clampFactor} grid cells, {mm(clamp.activationGap)} on these fixtures, which is where the
          mesh stops resolving the film. In its leading normal term the deficit form reduces to the paper&apos;s
          Eq. 10.
        </p>
      </div>

      <div style={{ marginTop: 36, maxWidth: 900 }}>
        <h3>Why the deficit form, measured</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          The choice is not a matter of taste. A separate wall-approach benchmark drives a sphere towards a wall at
          constant velocity, where the drag has an exact solution, and scores each candidate against it in the two
          bands that matter — between one and two cells of gap, and inside the last cell.
        </p>
        <DataTable<SedimentationBrennerBand>
          columns={[
            { id: "label", header: "Configuration", render: row => <span style={{ fontWeight: 500 }}>{row.label}</span> },
            {
              id: "band1",
              header: "1-2 cells of gap",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{pct(row.band1h2h, 1)}</span>
            },
            {
              id: "band2",
              header: "Last cell",
              align: "right",
              render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{pct(row.bandSub1h, 1)}</span>
            }
          ]}
          rows={sedimentationBrennerBands}
          getRowKey={row => row.model}
        />
        <p style={{ color: "var(--fg2)", lineHeight: 1.65, marginTop: 12 }}>
          Deviations from the exact wall-approach drag. The resolved method alone is short of it, which is the gap a
          sub-grid model is there to close; the full resistance set overshoots by about three quarters, which is the
          double-counting made visible; the deficit form is the one that lands closest to the exact answer in both
          bands. It is the configuration used for everything below.
        </p>
      </div>

      <div style={{ marginTop: 44, maxWidth: 900 }}>
        <h3>With the model switched on</h3>
        <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
          The two lowest-Reynolds cases of this benchmark were run again with the model in its production
          configuration. Everything else is the same as in the FeatFloWer E1 and E2 runs; the single difference is
          that lubrication is switched on. The baselines are therefore the very FeatFloWer curves on the Results tab, which makes the
          pair a controlled comparison rather than two similar simulations.
        </p>
      </div>

      <div style={{ marginTop: 28 }}>
        <ComparisonPanel specs={sedimentationLubricationSpecs} defaultMetric="approach" />
      </div>

      <div className="stack" style={{ marginTop: 44, maxWidth: 900, gap: 32 }}>
        <div>
          <h3>Through the film band</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            Above the activation gap the two runs are the same simulation — the deficit form is inert there by
            construction. Below it the sphere decelerates more gradually, which is the behaviour the paper reports
            for its own lubricated cases.
          </p>
          <DataTable<SedimentationLubricationCase>
            columns={[
              {
                id: "case",
                header: "Case",
                render: row => (
                  <span>
                    <span style={{ fontWeight: 500 }}>{row.id}</span>
                    <span style={{ color: "var(--fg3)", fontSize: 12 }}> · Re = {row.re}</span>
                  </span>
                )
              },
              {
                id: "one",
                header: "Speed at 1 cell",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>{pct(-row.reductions[0].reduction)}</span>
                )
              },
              {
                id: "half",
                header: "Speed at 1/2 cell",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>{pct(-row.reductions[1].reduction)}</span>
                )
              },
              {
                id: "steps",
                header: "Steps with the model active",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.activeSteps}</span>
              },
              {
                id: "force",
                header: "Peak |F_lub| / buoyant weight",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{row.peakForceRatio.toFixed(2)}</span>
              }
            ]}
            rows={sedimentationLubricationCases}
            getRowKey={row => row.id}
          />
        </div>

        <div>
          <h3>And it lands</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            This is the part worth checking. The paper notes that its own lubrication force makes the approach run
            on unrealistically long — the sphere never quite arrives. Here the descent stays finite: the time from
            the activation gap to rest grows by roughly a tenth, and both runs settle at the same resting gap. The
            deficit form, the saturation cut-off and the hard-contact response between them keep the film from
            becoming an infinite cushion.
          </p>
          <DataTable<SedimentationLubricationCase>
            columns={[
              {
                id: "case",
                header: "Case",
                render: row => (
                  <span>
                    <span style={{ fontWeight: 500 }}>{row.id}</span>
                    <span style={{ color: "var(--fg3)", fontSize: 12 }}> · Re = {row.re}</span>
                  </span>
                )
              },
              {
                id: "base",
                header: "To rest, no F_lub",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{ms(row.landing.base)}</span>
              },
              {
                id: "lub",
                header: "To rest, with model",
                align: "right",
                render: row => <span style={{ fontFamily: "var(--font-mono)" }}>{ms(row.landing.lubricated)}</span>
              },
              {
                id: "delta",
                header: "Change",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{pct(row.landing.increase)}</span>
                )
              },
              {
                id: "gap",
                header: "Resting gap",
                align: "right",
                render: row => (
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {mm(row.restingGap.base)} / {mm(row.restingGap.lubricated)}
                  </span>
                )
              }
            ]}
            rows={sedimentationLubricationCases}
            getRowKey={row => row.id}
          />
          <p style={{ color: "var(--fg2)", fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
            Time from the activation gap until the settling speed has fallen to{" "}
            {(sedimentationLandedFraction * 100).toFixed(0)} per cent of its value there. Resting gaps are quoted
            without and with the model.
          </p>
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>Scope</h3>
          <div
            style={{
              borderLeft: "3px solid var(--accent)",
              background: "var(--surface-alt)",
              borderRadius: 4,
              padding: "16px 20px"
            }}
          >
            <p style={{ margin: 0, color: "var(--fg1)", lineHeight: 1.65 }}>
              At this resolution the correction is modest by construction. The resolved flow already carries most of
              the film, so the model has little left to supply — its peak force never exceeds a quarter of the
              sphere&apos;s buoyant weight. The paper&apos;s method had no resolved film below one grid spacing at
              all and needed the full force. The digitised PIV cannot tell the two curves apart here either: the
              approach window holds about a dozen samples at velocities near the measurement floor, and the
              simulation-to-experiment differences shown on the Results tab are larger than the effect. The
              wall-approach benchmark above is what tests the model quantitatively; these runs show its qualitative
              behaviour, and that the sphere still comes to rest in the configuration used for production runs.
            </p>
          </div>
        </div>

        <div>
          <h3>At suspension scale</h3>
          <p style={{ color: "var(--fg2)", lineHeight: 1.65 }}>
            What the same model does to the bulk viscosity of a sheared suspension, rather than to a single sphere
            approaching a wall, belongs to the numerical viscometer: its concentration series runs every
            concentration with and without the model.
          </p>
          <Button variant="stroked" size="sm" onClick={onOpenViscometer} trailing={<Icon name="arrow_forward" size={14} />}>
            Numerical Viscometer
          </Button>
        </div>
      </div>
    </Section>
  );
}

function ReferenceDataTab() {
  return (
    <Section narrow style={{ paddingTop: 40, paddingBottom: 100 }}>
      <ContentRenderer
        blocks={[
          {
            type: "paragraph",
            text:
              "The simulation series and the PIV references are two-column text files without a header, one simulation row per 1 ms time step. The position plots show the gap height in sphere diameters, h/d_p = (z - 0.0075) / 0.015 from the sphere-centre height z in metres; the PIV position files are already given as h/d_p. campaign_runs.csv summarises each FeatFloWer run: its case and level, the number of steps, the time step, the simulated time, and the peak settling velocity with the time at which it occurs."
          },
          {
            type: "paragraph",
            text:
              "The FEAT3 series come in the same two-column format, one row per 1 ms step, as feat3_velE*_L*.txt and feat3_posE*_L*.txt, with the same normalisation for the position plots. feat3_runs.csv summarises the FEAT3 runs in the same way and adds the number of mesh cells across the sphere diameter; sedimentation-feat3.zip bundles all of them."
          }
        ]}
      />
      <div className="stack" style={{ marginTop: 32, gap: 32 }}>
        <DataTable
          columns={[
            { id: "fileType", header: "File family", render: row => row.fileType },
            { id: "pattern", header: "Pattern", render: row => row.pattern },
            { id: "column1", header: "Column 1", render: row => row.column1 },
            { id: "column2", header: "Column 2", render: row => row.column2 }
          ]}
          rows={sedimentationReferenceRows}
          getRowKey={row => row.pattern}
        />
        <DownloadTable items={sedimentationDownloads} />
      </div>
    </Section>
  );
}

export function ParticleSedimentationPage() {
  const navigate = useNavigate();
  const tabs = [
    { id: "introduction", label: "Introduction" },
    { id: "definition", label: "Definition" },
    { id: "results", label: "Results" },
    { id: "lubrication", label: "Lubrication" },
    { id: "reference-data", label: "Reference Data" }
  ];
  const [tab, setTab] = useTabParam(tabs.map(item => item.id), "introduction");

  return (
    <div>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)", padding: "24px 0" }}>
        <Section>
          <button
            type="button"
            className="focus-ring"
            onClick={() => navigate("/benchmarks")}
            style={{ display: "flex", alignItems: "center", gap: 6, border: 0, background: "transparent", color: "var(--fg2)", cursor: "pointer", fontFamily: "inherit", fontSize: 12, marginBottom: 12 }}
          >
            <Icon name="arrow_back" size={14} /> Catalogue / Particulate / SED
          </button>
          <div className="split split-hero">
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip tone="solid">SED</Chip>
                <Chip>Particulate</Chip>
                <Chip>3D</Chip>
                <Chip>Core benchmarks</Chip>
              </div>
              <h1 className="display display-md" style={{ margin: "0 0 12px" }}>
                Particle <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--primary)" }}>Sedimentation</span>
              </h1>
              <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.55 }}>
                A confined settling-sphere benchmark comparing two codes, FeatFloWer and FEAT3, at three mesh levels, L2 to L4, against PIV particle-motion measurements for four Reynolds-number regimes.
              </p>
            </div>
            <div className="kpi-grid">
              <KpiBox label="Cases" value="4" />
              <KpiBox label="Re" value="1.5-31.9" />
              <KpiBox label="Levels" value={String(sedimentationLevels.length)} />
              <KpiBox label="Codes" value={String(sedimentationCodes.length)} />
              <KpiBox label="Particle" value="15 mm" />
              <KpiBox label="Tank" value="100x100x160" />
            </div>
          </div>
        </Section>
      </div>

      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}>
        <Section>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </Section>
      </div>

      {tab === "introduction" && <IntroductionTab />}
      {tab === "definition" && <DefinitionTab />}
      {tab === "results" && <ResultsTab />}
      {tab === "lubrication" && (
        <LubricationTab onOpenViscometer={() => navigate("/benchmarks/numerical-viscometer")} />
      )}
      {tab === "reference-data" && <ReferenceDataTab />}
    </div>
  );
}
