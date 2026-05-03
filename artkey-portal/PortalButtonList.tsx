/**
 * ArtKey Portal — Button List Component
 *
 * Two modes controlled by the `mode` prop:
 *
 *   "live"   — production phone portal UI
 *              Dark pill buttons, hover scale, click opens modal.
 *              Usage: <PortalButtonList mode="live" onButtonClick={fn} />
 *
 *   "editor" — Design Editor UI
 *              Numbered rows with a drag handle and edit affordance.
 *              No onClick required; pass onEdit to handle editor actions.
 *              Usage: <PortalButtonList mode="editor" onEdit={fn} />
 *
 * Both modes read button labels from buttonConfig.ts — change that file
 * to update both UIs at once.
 *
 * Source: provided bundle (same pattern as cPanel `artkey-portal/PortalButtonList.tsx`).
 */

"use client";

import { useState } from "react";
import portalButtons, { type PortalButton } from "./buttonConfig";

/* ─── Shared token values ────────────────────────────────────────────────── */

const FONT_BODY = "Inter, system-ui, sans-serif";
const FONT_HEADING = "'Playfair Display', Georgia, serif";
const COLOR_DARK = "#1A1A1A";
const COLOR_BORDER = "#ded8d3";
const COLOR_MUTED = "#918c86";
const COLOR_BG_EDITOR = "#f3f3f3";

/* ─── Live mode ──────────────────────────────────────────────────────────── */

function LiveButton({
  btn,
  onClick,
}: {
  btn: PortalButton;
  onClick: (btn: PortalButton) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onClick(btn)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "10px 14px",
        background: hovered ? "#333333" : COLOR_DARK,
        border: "none",
        borderRadius: "9999px",
        color: "#ffffff",
        marginBottom: "8px",
        textAlign: "center",
        fontFamily: FONT_BODY,
        fontSize: "11.5px",
        fontWeight: 500,
        letterSpacing: "0.01em",
        cursor: "pointer",
        transition: "background 0.15s, transform 0.15s",
        transform: hovered ? "scale(1.02)" : "scale(1)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {btn.label}
    </button>
  );
}

/* ─── Editor mode ────────────────────────────────────────────────────────── */

function EditorRow({
  btn,
  index,
  onEdit,
}: {
  btn: PortalButton;
  index: number;
  onEdit?: (btn: PortalButton, index: number) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={
        onEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEdit(btn, index);
              }
            }
          : undefined
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 12px",
        background: hovered ? "#ffffff" : COLOR_BG_EDITOR,
        border: `1px solid ${hovered ? COLOR_DARK : COLOR_BORDER}`,
        borderRadius: "10px",
        marginBottom: "6px",
        transition: "background 0.12s, border-color 0.12s",
        cursor: onEdit ? "pointer" : "default",
      }}
      onClick={() => onEdit?.(btn, index)}
    >
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: "10px",
          color: COLOR_MUTED,
          minWidth: "16px",
          textAlign: "center",
          userSelect: "none",
        }}
      >
        {index + 1}
      </span>
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: "11.5px",
          fontWeight: 500,
          color: COLOR_DARK,
          flex: 1,
          letterSpacing: "0.01em",
        }}
      >
        {btn.label}
      </span>
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: "9px",
          color: COLOR_MUTED,
          background: COLOR_BORDER,
          borderRadius: "4px",
          padding: "2px 6px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {btn.type}
      </span>
      {onEdit && (
        <span
          style={{
            fontSize: "11px",
            color: hovered ? COLOR_DARK : COLOR_MUTED,
            transition: "color 0.12s",
          }}
        >
          ✎
        </span>
      )}
    </div>
  );
}

/* ─── Public component ───────────────────────────────────────────────────── */

interface LiveProps {
  mode: "live";
  /** Called when a button is tapped — use to open the matching modal */
  onButtonClick: (btn: PortalButton) => void;
  /** Override buttons; defaults to the shared portalButtons config */
  buttons?: PortalButton[];
}

interface EditorProps {
  mode: "editor";
  /** Called when a row is clicked in the editor */
  onEdit?: (btn: PortalButton, index: number) => void;
  /** Override buttons; defaults to the shared portalButtons config */
  buttons?: PortalButton[];
}

type PortalButtonListProps = LiveProps | EditorProps;

export default function PortalButtonList(props: PortalButtonListProps) {
  const buttons = props.buttons ?? portalButtons;

  if (props.mode === "editor") {
    return (
      <div>
        <div
          style={{
            fontFamily: FONT_HEADING,
            fontSize: "13px",
            fontWeight: 600,
            color: COLOR_DARK,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Portal Buttons
        </div>
        {buttons.map((btn, i) => (
          <EditorRow key={btn.id} btn={btn} index={i} onEdit={props.onEdit} />
        ))}
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: "10px",
            color: COLOR_MUTED,
            marginTop: "8px",
          }}
        >
          {buttons.length} buttons · Edit labels in{" "}
          <code style={{ fontSize: "10px" }}>buttonConfig.ts</code>
        </div>
      </div>
    );
  }

  return (
    <div>
      {buttons.map((btn) => (
        <LiveButton key={btn.id} btn={btn} onClick={props.onButtonClick} />
      ))}
    </div>
  );
}
