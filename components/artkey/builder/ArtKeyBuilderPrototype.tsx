"use client";

import { useEffect, useMemo, useState } from "react";
import { ArtKeyTrademark } from "@/components/RefinedTm";
import { LivePreviewCard } from "./LivePreviewCard";
import { FEATURE_MODULES, type FeatureModuleDef, type FeatureModuleId } from "./featureModules";
import { BuilderTabs, type BuilderTabId } from "./BuilderTabs";
import { DesignTabPanel } from "./DesignTabPanel";
import { FeatureConfigureModal } from "./FeatureConfigureModal";
import { FeatureLibraryGrid } from "./FeatureLibraryGrid";
import {
  defaultDesignPreview,
  designPreviewForStartingPoint,
  type DesignPreviewState,
} from "./designPreviewModel";
import { DESIGN_DETAIL_TABS, type DesignDetailTabId, type DesignStartingPoint } from "./designTypes";
import styles from "./akBuilder.module.css";

function PanelShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

export type ArtKeyBuilderPrototypeProps = {
  /**
   * When true, Design controls (starting point, appearance tabs, presets, color picker)
   * and live preview chrome (viewport toggle + module row) are non-interactive for a
   * static mock. Main builder tabs stay usable.
   */
  visualMock?: boolean;
};

export function ArtKeyBuilderPrototype({ visualMock = false }: ArtKeyBuilderPrototypeProps) {
  const [tab, setTab] = useState<BuilderTabId>("design");
  const [designStart, setDesignStart] = useState<DesignStartingPoint | null>(null);
  const [designDetailTab, setDesignDetailTab] =
    useState<DesignDetailTabId>("background");
  const [designPreview, setDesignPreview] = useState<DesignPreviewState>(() =>
    defaultDesignPreview()
  );
  const [configureFeature, setConfigureFeature] = useState<FeatureModuleDef | null>(null);
  const [moduleOn, setModuleOn] = useState<Record<FeatureModuleId, boolean>>(
    () =>
      Object.fromEntries(
        FEATURE_MODULES.map((m) => [m.id, !m.comingSoon])
      ) as Record<FeatureModuleId, boolean>
  );

  const enabledModulesForPhone = useMemo(
    () =>
      FEATURE_MODULES.filter((m) => moduleOn[m.id] && !m.comingSoon).map((m) => ({
        id: m.id,
        label: m.title,
        icon: m.cardIcon,
      })),
    [moduleOn]
  );

  useEffect(() => {
    setDesignPreview(designPreviewForStartingPoint(designStart));
  }, [designStart]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerRow}>
            <div>
              <p className={styles.safetyLabel}>
                Builder Prototype - Not connected to live portals.
              </p>
              <div className={styles.titleRow}>
                <span className={styles.titleStar} aria-hidden>
                  ✦
                </span>
                <h1 className={styles.title}>
                  <ArtKeyTrademark /> Portal Builder
                </h1>
              </div>
              <p className={styles.kicker}>
                Local preview only. No API, save, upload, tokens, or QR.
              </p>
            </div>
            <div className={styles.pill}>Phase 1 · Static / demo</div>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <BuilderTabs active={tab} onChange={setTab} />

        <div className={styles.layoutGrid}>
          <div className={styles.mainStack}>
            {tab === "design" && (
              <DesignTabPanel
                readOnly={visualMock}
                startingPoint={designStart}
                onStartingPointChange={setDesignStart}
                detailTab={designDetailTab}
                onDetailTabChange={setDesignDetailTab}
                preview={designPreview}
                onPreviewPatch={(patch) =>
                  setDesignPreview((prev) => ({ ...prev, ...patch }))
                }
              />
            )}

            {tab === "features" && (
              <PanelShell title="Feature library">
                <p>
                  Turn modules on or off, then use <strong>Configure →</strong> for
                  neutral placeholder copy. Nothing here reads from live portal or
                  homepage data.
                </p>
                <FeatureLibraryGrid
                  moduleOn={moduleOn}
                  setModuleOn={setModuleOn}
                  onOpenConfigure={(id) => {
                    const f = FEATURE_MODULES.find((m) => m.id === id) ?? null;
                    setConfigureFeature(f);
                  }}
                />
              </PanelShell>
            )}

            {tab === "save" && (
              <PanelShell title="Save">
                <p>
                  Draft save, continue, checkout, and share / QR handoff will live
                  here. This prototype does not persist changes or generate QR codes.
                </p>
                <div className={styles.publishBox}>
                  <p className={styles.publishBoxTitle}>Example share URL (not real)</p>
                  <p className={styles.monoUrl}>https://artkey.example/art-key/sample-portal</p>
                </div>
              </PanelShell>
            )}
          </div>

          <aside className={styles.aside}>
            <h3 className={styles.asideKicker}>Live preview & configuration</h3>
            <p className={styles.asidePreviewNote}>
              Preview stays visible on every tab (static demo).
            </p>
            <LivePreviewCard
              variant="aside"
              designMode={tab === "design" && designStart !== null}
              designPreview={designPreview}
              enabledPortalModules={
                tab !== "design" ? enabledModulesForPhone : undefined
              }
              staticPresentation={visualMock}
            />
            <div className={styles.asideDivider}>
              {tab === "features" ? (
                <p className={styles.asideHint}>
                  <span className={styles.asideHintLead}>Features</span> — the phone lists
                  enabled modules. <strong>Configure →</strong> opens a popup (no separate
                  Configure tab).
                </p>
              ) : tab === "save" ? (
                <p className={styles.asideHint}>
                  <span className={styles.asideHintLead}>Save</span> — draft status,
                  share links, and proof actions will show here when the flow is wired.
                  No writes in this prototype.
                </p>
              ) : tab === "design" ? (
                <p className={styles.asideHint}>
                  <span className={styles.asideHintLead}>Design</span>
                  {visualMock ? (
                    <>
                      {" "}
                      — <strong>Visual mock</strong>: appearance controls and preview
                      buttons are disabled; use the top tabs to view Features or Save.
                    </>
                  ) : designStart === null ? (
                    <>
                      {" "}
                      — pick <strong>Use a Template</strong> or{" "}
                      <strong>Build Manually</strong> first. The module strip and style
                      preview load after you choose a path; until then the phone shows a
                      short placeholder.
                    </>
                  ) : (
                    <>
                      {" "}
                      — path:{" "}
                      <strong>
                        {designStart === "template" ? "Template" : "Manual"}
                      </strong>
                      . Active group:{" "}
                      <strong>
                        {DESIGN_DETAIL_TABS.find((t) => t.id === designDetailTab)?.label}
                      </strong>
                      . Module labels in the phone come from{" "}
                      <code className={styles.inlineCode}>DESIGN_PORTAL_MODULE_BUTTONS</code>.
                    </>
                  )}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      <FeatureConfigureModal
        open={configureFeature !== null}
        onClose={() => setConfigureFeature(null)}
        feature={configureFeature}
      />
    </div>
  );
}
