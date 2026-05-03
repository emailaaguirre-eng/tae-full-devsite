"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { DEMO_PORTAL, LIVE_PREVIEW_PLACEHOLDER } from "./demoData";
import { DESIGN_PORTAL_MODULE_BUTTONS } from "./designTypes";
import {
  BUTTON_FONT_STACK,
  defaultDesignPreview,
  type DesignPreviewState,
  guestPhoneCanvasBackground,
  TITLE_FONT_STACK,
} from "./designPreviewModel";
import { pickTextOnBackground } from "./designColorUtils";
import styles from "./akBuilder.module.css";

type Viewport = "mobile" | "desktop";

export type PortalPreviewModule = { id: string; label: string; icon?: string };

type Props = {
  variant: "panel" | "aside";
  /** When true, phone screen shows design module buttons + sample title from `designPreview`. */
  designMode?: boolean;
  designPreview?: DesignPreviewState;
  /**
   * When `designMode` is false and this is set, the phone lists these as module buttons
   * (e.g. Features tab: only locally “on” modules). Empty array shows an empty-state hint.
   */
  enabledPortalModules?: PortalPreviewModule[];
  /** When true, viewport toggle and module row are disabled (visual-only mock). */
  staticPresentation?: boolean;
};

function phoneShapeClass(s: typeof styles, p: DesignPreviewState): string {
  if (p.btnShape === "pill") return s.designModBtnShapePill;
  if (p.btnShape === "square") return s.designModBtnShapeSquare;
  return s.designModBtnShapeRounded;
}

function GuestPhoneTitle({
  titleFont,
}: {
  titleFont: DesignPreviewState["titleFont"];
}) {
  return (
    <p
      className={styles.phoneRefTitle}
      style={{ fontFamily: TITLE_FONT_STACK[titleFont] }}
    >
      {DEMO_PORTAL.title}
    </p>
  );
}

export function LivePreviewCard({
  variant,
  designMode = false,
  designPreview,
  enabledPortalModules,
  staticPresentation = false,
}: Props) {
  const [viewport, setViewport] = useState<Viewport>("mobile");
  const [tappedModuleId, setTappedModuleId] = useState<string | null>(null);

  const preview = designPreview ?? defaultDesignPreview();

  const showDesignPhone = Boolean(designMode && designPreview);
  const portalModuleList =
    !showDesignPhone && enabledPortalModules !== undefined ? enabledPortalModules : null;
  const showPortalStrip = portalModuleList !== null;

  const shapeClass = phoneShapeClass(styles, preview);

  const customFill = showDesignPhone
    ? designPreview!.moduleFillHex
    : showPortalStrip
      ? preview.moduleFillHex
      : null;

  const screenBg = showDesignPhone
    ? guestPhoneCanvasBackground(designPreview!)
    : showPortalStrip
      ? guestPhoneCanvasBackground(preview)
      : undefined;

  const titleFont = showDesignPhone && designPreview ? designPreview.titleFont : preview.titleFont;
  const buttonFont = showDesignPhone && designPreview ? designPreview.buttonFont : preview.buttonFont;

  return (
    <div
      className={
        variant === "panel"
          ? styles.livePreviewCard
          : `${styles.livePreviewCard} ${styles.livePreviewCardCompact}`
      }
    >
      <div className={styles.livePreviewHeader}>
        <h4 className={styles.livePreviewHeading}>Live Preview</h4>
        <div className={styles.viewToggle} role="group" aria-label="Preview viewport">
          <button
            type="button"
            className={
              viewport === "mobile"
                ? styles.viewToggleBtnActive
                : styles.viewToggleBtn
            }
            aria-pressed={viewport === "mobile"}
            disabled={staticPresentation}
            onClick={() => setViewport("mobile")}
          >
            <Smartphone className={styles.viewToggleIcon} strokeWidth={2} aria-hidden />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            className={
              viewport === "desktop"
                ? styles.viewToggleBtnActive
                : styles.viewToggleBtn
            }
            aria-pressed={viewport === "desktop"}
            disabled={staticPresentation}
            onClick={() => setViewport("desktop")}
          >
            <Monitor className={styles.viewToggleIcon} strokeWidth={2} aria-hidden />
            <span>Desktop</span>
          </button>
        </div>
      </div>

      <div
        className={
          viewport === "desktop"
            ? `${styles.deviceFrame} ${styles.deviceFrameDesktop}`
            : styles.deviceFrame
        }
      >
        <div
          className={
            viewport === "desktop"
              ? `${styles.deviceScreen} ${styles.deviceScreenDesktop}`
              : styles.deviceScreen
          }
          style={screenBg != null ? { background: screenBg } : undefined}
        >
          <div className={styles.dynamicIsland} aria-hidden>
            <span className={styles.dynamicIslandDot} />
            <span className={styles.dynamicIslandDot} />
          </div>
          <div
            className={[
              styles.screenBody,
              showDesignPhone || showPortalStrip ? styles.screenBodyDesign : "",
              showDesignPhone || showPortalStrip ? styles.screenBodyGuestPhone : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {showDesignPhone && designPreview ? (
              <div className={`${styles.phoneScreenDesign} ${styles.phoneScreenDesignReference}`}>
                <GuestPhoneTitle titleFont={titleFont} />
                <div className={styles.phoneRefModuleStack}>
                  {DESIGN_PORTAL_MODULE_BUTTONS.map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      className={[
                        styles.phoneRefBtn,
                        shapeClass,
                        !staticPresentation && tappedModuleId === btn.id
                          ? styles.designModBtnTapped
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        fontFamily: BUTTON_FONT_STACK[buttonFont],
                        ...(customFill
                          ? {
                              background: customFill,
                              backgroundImage: "none",
                              color: pickTextOnBackground(customFill),
                              boxShadow: "0 2px 8px rgba(18, 26, 42, 0.18)",
                            }
                          : {}),
                      }}
                      disabled={staticPresentation}
                      onClick={
                        staticPresentation
                          ? undefined
                          : () => {
                              setTappedModuleId(btn.id);
                              window.setTimeout(() => setTappedModuleId(null), 450);
                            }
                      }
                    >
                      <span className={styles.phoneRefBtnIcon} aria-hidden>
                        {btn.icon}
                      </span>
                      <span className={styles.phoneRefBtnLabel}>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : portalModuleList !== null ? (
              <div className={`${styles.phoneScreenDesign} ${styles.phoneScreenDesignReference}`}>
                <GuestPhoneTitle titleFont={titleFont} />
                <div className={styles.phoneRefModuleStack}>
                  {portalModuleList.length === 0 ? (
                    <p className={styles.phoneFeaturesEmpty}>
                      No modules enabled. On the Features tab, turn a module to{" "}
                      <strong>Enabled</strong> and it will list here.
                    </p>
                  ) : (
                    portalModuleList.map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        className={[
                          styles.phoneRefBtn,
                          shapeClass,
                          !staticPresentation && tappedModuleId === btn.id
                            ? styles.designModBtnTapped
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{
                          fontFamily: BUTTON_FONT_STACK[buttonFont],
                          ...(customFill
                            ? {
                                background: customFill,
                                backgroundImage: "none",
                                color: pickTextOnBackground(customFill),
                                boxShadow: "0 2px 8px rgba(18, 26, 42, 0.18)",
                              }
                            : {}),
                        }}
                        disabled={staticPresentation}
                        onClick={
                          staticPresentation
                            ? undefined
                            : () => {
                                setTappedModuleId(btn.id);
                                window.setTimeout(() => setTappedModuleId(null), 450);
                              }
                        }
                      >
                        {btn.icon ? (
                          <span className={styles.phoneRefBtnIcon} aria-hidden>
                            {btn.icon}
                          </span>
                        ) : null}
                        <span className={styles.phoneRefBtnLabel}>{btn.label}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p className={styles.screenPlaceholder}>{LIVE_PREVIEW_PLACEHOLDER}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
