// editor/editorState.ts
import type { PrintSpec, SideId, CornerStyle } from "../types/printSpec";

export type EditorState = {
  printSpec: PrintSpec;
  activeSide: SideId;

  // store serialized nodes per side (design layer only)
  designJsonBySide: Record<SideId, string | null>;

  // UI settings
  showRoundedPreviewMask: boolean;

  // corner style (applies to all sides)
  cornerStyle: CornerStyle;
  cornerRadiusMm: number;

  // selection
  selectedNodeId: string | null;

  // warnings
  warnings: WarningItem[];
};

export type WarningType =
  | "OUTSIDE_SAFE"
  | "OUTSIDE_TRIM"
  | "ROUNDED_CORNER_DANGER"
  | "LOW_DPI_IMAGE"
  | "SMALL_TEXT"
  | "THIN_STROKE";

export type WarningItem = {
  id: string;
  type: WarningType;
  message: string;
  nodeId?: string;
  severity: "warn" | "error";
  fix?: "MOVE_INTO_SAFE" | "CENTER_IN_SAFE" | "SCALE_TO_FIT_SAFE";
};

export type EditorAction =
  | { type: "SET_ACTIVE_SIDE"; side: SideId }
  | { type: "SAVE_SIDE_JSON"; side: SideId; json: string }
  | { type: "SET_SELECTED_NODE"; nodeId: string | null }
  | { type: "SET_CORNER_STYLE"; cornerStyle: CornerStyle }
  | { type: "SET_CORNER_RADIUS_MM"; cornerRadiusMm: number }
  | { type: "SET_WARNINGS"; warnings: WarningItem[] }
  | { type: "TOGGLE_ROUNDED_PREVIEW_MASK"; value?: boolean };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_ACTIVE_SIDE":
      return { ...state, activeSide: action.side, selectedNodeId: null };
    case "SAVE_SIDE_JSON":
      return {
        ...state,
        designJsonBySide: { ...state.designJsonBySide, [action.side]: action.json },
      };
    case "SET_SELECTED_NODE":
      return { ...state, selectedNodeId: action.nodeId };
    case "SET_CORNER_STYLE":
      return { ...state, cornerStyle: action.cornerStyle };
    case "SET_CORNER_RADIUS_MM":
      return { ...state, cornerRadiusMm: action.cornerRadiusMm };
    case "SET_WARNINGS":
      return { ...state, warnings: action.warnings };
    case "TOGGLE_ROUNDED_PREVIEW_MASK":
      return { ...state, showRoundedPreviewMask: action.value ?? !state.showRoundedPreviewMask };
    default:
      return state;
  }
}
