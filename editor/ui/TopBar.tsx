// editor/ui/TopBar.tsx
import React from "react";
import type { SideId, CornerStyle } from "../../types/printSpec";

type Props = {
  // Side selection
  activeSide: SideId;
  onSwitchSide: (side: SideId) => void;

  // Optional (if your editor supports these already)
  orientation?: "portrait" | "landscape";
  onOrientationChange?: (v: "portrait" | "landscape") => void;

  format?: "flat" | "bifold";
  onFormatChange?: (v: "flat" | "bifold") => void;

  // Trim controls
  cornerStyle: CornerStyle;
  cornerRadiusMm: number;
  onCornerStyleChange: (v: CornerStyle) => void;
  onCornerRadiusChange: (mm: number) => void;

  // Preview mask toggle (rounded preview)
  showRoundedPreviewMask: boolean;
  onTogglePreviewMask: () => void;

  // Apply to all areas
  onApplyToAllAreas: () => void;

  // Export
  onExport?: () => void;

  // Undo/Redo hooks (optional)
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
};

function PillButton(props: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  const { active, disabled, onClick, children, title } = props;
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm border rounded-none",
        "transition-colors",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-100",
        active ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-600" : "bg-white text-neutral-900 border-neutral-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SegLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-neutral-500 mr-2 whitespace-nowrap">{children}</div>;
}

export function TopBar(props: Props) {
  const {
    activeSide,
    onSwitchSide,

    orientation,
    onOrientationChange,

    format,
    onFormatChange,

    cornerStyle,
    cornerRadiusMm,
    onCornerStyleChange,
    onCornerRadiusChange,

    showRoundedPreviewMask,
    onTogglePreviewMask,

    onApplyToAllAreas,

    onExport,

    canUndo,
    canRedo,
    onUndo,
    onRedo,
  } = props;

  const isRounded = cornerStyle === "rounded";

  return (
    <div className="w-full border-b bg-white">
      <div className="flex items-center justify-between px-4 py-2 gap-3">
        {/* Left: Title + controls */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="font-semibold text-sm whitespace-nowrap">Project Editor</div>

          {/* Orientation (optional) */}
          {orientation && onOrientationChange && (
            <div className="flex items-center">
              <SegLabel>Orientation:</SegLabel>
              <div className="flex gap-1">
                <PillButton active={orientation === "portrait"} onClick={() => onOrientationChange("portrait")}>
                  Portrait
                </PillButton>
                <PillButton active={orientation === "landscape"} onClick={() => onOrientationChange("landscape")}>
                  Landscape
                </PillButton>
              </div>
            </div>
          )}

          {/* Format (optional) */}
          {format && onFormatChange && (
            <div className="flex items-center">
              <SegLabel>Format:</SegLabel>
              <div className="flex gap-1">
                <PillButton active={format === "flat"} onClick={() => onFormatChange("flat")}>
                  Flat
                </PillButton>
                <PillButton active={format === "bifold"} onClick={() => onFormatChange("bifold")}>
                  Bifold
                </PillButton>
              </div>
            </div>
          )}

          {/* Side toggle */}
          <div className="flex items-center">
            <SegLabel>Side:</SegLabel>
            <div className="flex gap-1">
              <PillButton active={activeSide === "front"} onClick={() => onSwitchSide("front")}>
                Front
              </PillButton>
              <PillButton active={activeSide === "back"} onClick={() => onSwitchSide("back")}>
                Back
              </PillButton>
            </div>
          </div>

          {/* Trim */}
          <div className="flex items-center gap-2">
            <SegLabel>Trim:</SegLabel>
            <div className="flex gap-1">
              <PillButton active={cornerStyle === "square"} onClick={() => onCornerStyleChange("square")}>
                Square edges
              </PillButton>
              <PillButton active={cornerStyle === "rounded"} onClick={() => onCornerStyleChange("rounded")}>
                Rounded corners
              </PillButton>
            </div>

            {/* Radius input (only when rounded) */}
            <div className="flex items-center gap-2 ml-2">
              <label className="text-xs text-neutral-500 whitespace-nowrap">Radius (mm)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={cornerRadiusMm}
                disabled={!isRounded}
                onChange={(e) => onCornerRadiusChange(Number(e.target.value))}
                className={[
                  "w-20 px-2 py-1 text-sm border rounded-none",
                  !isRounded ? "bg-neutral-100 text-neutral-400" : "bg-white",
                ].join(" ")}
              />
            </div>

            {/* Preview mask toggle */}
            <div className="flex items-center gap-2 ml-2">
              <label className="text-xs text-neutral-500 whitespace-nowrap">Preview mask</label>
              <input
                type="checkbox"
                checked={showRoundedPreviewMask}
                onChange={onTogglePreviewMask}
                disabled={!isRounded}
              />
            </div>
          </div>

          {/* Apply to all areas */}
          <div className="flex items-center">
            <PillButton onClick={onApplyToAllAreas} title="Duplicate the selected object to the other side">
              Apply to all areas
            </PillButton>
          </div>
        </div>

        {/* Right: Undo/Redo + Export */}
        <div className="flex items-center gap-2">
          <PillButton disabled={!canUndo} onClick={onUndo} title="Undo">
            ↶
          </PillButton>
          <PillButton disabled={!canRedo} onClick={onRedo} title="Redo">
            ↷
          </PillButton>

          <PillButton onClick={onExport} title="Export print-ready file">
            Export
          </PillButton>
        </div>
      </div>
    </div>
  );
}
