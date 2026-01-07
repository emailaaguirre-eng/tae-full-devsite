// editor/ProjectEditor.tsx
import React, { useEffect, useMemo, useReducer, useRef } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Line } from "react-konva";
import type { PrintSpec, PrintSide, SideId } from "../types/printSpec";
import { mmToPx } from "../types/printSpec";
import { editorReducer, EditorState } from "./editorState";
import { roundedRectPath } from "./roundedRect";
import { runPreflight } from "./preflight/runPreflight";
import { applySnapping } from "./snapping/applySnapping";
import { ShapesPanel } from "./ui/ShapesPanel";
import { TopBar } from "./ui/TopBar";
import { WarningsPanel } from "./ui/WarningsPanel";

type Props = {
  initialSpec: PrintSpec;
};

function getSide(spec: PrintSpec, sideId: SideId): PrintSide {
  const s = spec.sides.find((x) => x.id === sideId);
  if (!s) throw new Error(`Missing side ${sideId} in spec`);
  return s;
}

export function ProjectEditor({ initialSpec }: Props) {
  const [state, dispatch] = useReducer(editorReducer, null as any, (): EditorState => ({
    printSpec: initialSpec,
    activeSide: initialSpec.sideIds[0] ?? "front",
    designJsonBySide: { front: null, back: null },
    showRoundedPreviewMask: true,
    cornerStyle: "square",
    cornerRadiusMm: 3,
    selectedNodeId: null,
    warnings: [],
  }));

  const stageRef = useRef<Konva.Stage | null>(null);
  const designLayerRef = useRef<Konva.Layer | null>(null);
  const guidesLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const side = useMemo(() => getSide(state.printSpec, state.activeSide), [state.printSpec, state.activeSide]);

  // Apply corner settings to side for rendering (you might store per-product instead)
  const cornerRadiusPx = mmToPx(state.cornerRadiusMm, state.printSpec.dpi);
  const effectiveCornerRadiusPx = state.cornerStyle === "rounded" ? cornerRadiusPx : 0;

  const canvasW = side.canvasPx.w;
  const canvasH = side.canvasPx.h;

  const bleedPx = side.bleedPx;
  const safePx = side.safePx;

  // Rects in canvas coords
  const trimRect = { x: bleedPx, y: bleedPx, width: canvasW - bleedPx * 2, height: canvasH - bleedPx * 2 };
  const safeRect = { x: bleedPx + safePx, y: bleedPx + safePx, width: canvasW - (bleedPx + safePx) * 2, height: canvasH - (bleedPx + safePx) * 2 };

  // Save active side JSON before switching
  function saveActiveSideJson() {
    const designLayer = designLayerRef.current;
    if (!designLayer) return;
    const json = designLayer.toJSON();
    dispatch({ type: "SAVE_SIDE_JSON", side: state.activeSide, json });
  }

  function loadSideJson(sideId: SideId) {
    const designLayer = designLayerRef.current;
    if (!designLayer) return;

    designLayer.destroyChildren();

    const json = state.designJsonBySide[sideId];
    if (json) {
      // recreate nodes into this layer
      const node = Konva.Node.create(json) as any;
      // Node.create returns a Layer if json was a layer.
      // If it is a Layer, move its children into our design layer:
      if (node instanceof Konva.Layer) {
        node.getChildren().each((child) => designLayer.add(child));
        node.destroy();
      } else {
        designLayer.add(node);
      }
    }

    designLayer.draw();
  }

  function onSwitchSide(next: SideId) {
    if (next === state.activeSide) return;
    saveActiveSideJson();
    dispatch({ type: "SET_ACTIVE_SIDE", side: next });
    // load after state update:
    setTimeout(() => loadSideJson(next), 0);
  }

  // Initial load
  useEffect(() => {
    loadSideJson(state.activeSide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run preflight on changes (simple debounce could be added)
  function refreshPreflight() {
    const stage = stageRef.current;
    const designLayer = designLayerRef.current;
    if (!stage || !designLayer) return;

    const warnings = runPreflight({
      designLayer,
      safeRect,
      trimRect,
      cornerStyle: state.cornerStyle,
      cornerRadiusPx: effectiveCornerRadiusPx,
      exportDpi: state.printSpec.dpi,
    });

    dispatch({ type: "SET_WARNINGS", warnings });
  }

  // Hook: run preflight after side switch / edits
  useEffect(() => {
    const designLayer = designLayerRef.current;
    if (!designLayer) return;

    const handler = () => refreshPreflight();
    designLayer.on("dragend transformend", handler);
    designLayer.on("click tap", handler);

    // You can also call it on a timer or after object add/remove
    refreshPreflight();

    return () => {
      designLayer.off("dragend transformend", handler);
      designLayer.off("click tap", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeSide, state.cornerStyle, state.cornerRadiusMm]);

  // Selection
  function handleStageMouseDown(e: any) {
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    if (clickedOnEmpty) {
      dispatch({ type: "SET_SELECTED_NODE", nodeId: null });
      transformerRef.current?.nodes([]);
      return;
    }

    const target = e.target;
    const id = target?.id?.();
    if (!id) return;

    dispatch({ type: "SET_SELECTED_NODE", nodeId: id });
    transformerRef.current?.nodes([target]);
  }

  // Snapping guides
  function handleDragMove(e: any) {
    const node: Konva.Node = e.target;
    const guidesLayer = guidesLayerRef.current;
    const stage = stageRef.current;
    if (!guidesLayer || !stage) return;

    applySnapping({
      node,
      stage,
      guidesLayer,
      safeRect,
      snapThreshold: 6,
    });
  }

  // Rounded preview mask: clip design layer
  useEffect(() => {
    const designLayer = designLayerRef.current;
    if (!designLayer) return;

    const group = designLayer; // you can also wrap design nodes in a Group

    if (state.showRoundedPreviewMask && effectiveCornerRadiusPx > 0) {
      group.clipFunc((ctx) => roundedRectPath(ctx as any, trimRect.x, trimRect.y, trimRect.width, trimRect.height, effectiveCornerRadiusPx));
    } else {
      // remove clip
      group.clipFunc(undefined as any);
      group.clipWidth(undefined as any);
      group.clipHeight(undefined as any);
    }

    designLayer.draw();
  }, [state.showRoundedPreviewMask, effectiveCornerRadiusPx, trimRect.x, trimRect.y, trimRect.width, trimRect.height]);

  // Add shapes
  function addNode(node: Konva.Node) {
    const designLayer = designLayerRef.current;
    if (!designLayer) return;
    designLayer.add(node);
    designLayer.draw();
    refreshPreflight();
  }

  // Apply to all areas: duplicate selected node to other side(s)
  function applyToAllAreas() {
    const designLayer = designLayerRef.current;
    if (!designLayer) return;
    const selected = state.selectedNodeId ? designLayer.findOne(`#${state.selectedNodeId}`) : null;
    if (!selected) return;

    // Save current side json
    saveActiveSideJson();

    for (const sideId of state.printSpec.sideIds) {
      if (sideId === state.activeSide) continue;
      const json = state.designJsonBySide[sideId];

      // Load other side into a temp layer
      const tempLayer = new Konva.Layer();
      if (json) {
        const node = Konva.Node.create(json);
        if (node instanceof Konva.Layer) {
          node.getChildren().each((c) => tempLayer.add(c));
        } else {
          tempLayer.add(node);
        }
      }

      const clone = selected.clone({ id: `${selected.id()}_${sideId}` });
      tempLayer.add(clone);

      // Save back
      state.designJsonBySide[sideId] = tempLayer.toJSON();
      tempLayer.destroy();
    }

    // Save updated dict back into state by forcing SAVE action for each side
    // (If you're using a store, do this cleaner. Here we dispatch for back/front.)
    dispatch({ type: "SAVE_SIDE_JSON", side: "front", json: state.designJsonBySide.front ?? null as any });
    dispatch({ type: "SAVE_SIDE_JSON", side: "back", json: state.designJsonBySide.back ?? null as any });
  }

  return (
    <div className="h-full w-full flex flex-col">
      <TopBar
        activeSide={state.activeSide}
        onSwitchSide={onSwitchSide}
        cornerStyle={state.cornerStyle}
        cornerRadiusMm={state.cornerRadiusMm}
        onCornerStyleChange={(v) => dispatch({ type: "SET_CORNER_STYLE", cornerStyle: v })}
        onCornerRadiusChange={(mm) => dispatch({ type: "SET_CORNER_RADIUS_MM", cornerRadiusMm: mm })}
        showRoundedPreviewMask={state.showRoundedPreviewMask}
        onTogglePreviewMask={() => dispatch({ type: "TOGGLE_ROUNDED_PREVIEW_MASK" })}
        onApplyToAllAreas={applyToAllAreas}
      />

      <div className="flex flex-1 min-h-0">
        <div className="w-[320px] border-r bg-white overflow-auto">
          <ShapesPanel
            safeRect={safeRect}
            onAdd={(node) => addNode(node)}
          />

          <WarningsPanel
            warnings={state.warnings}
            onFix={(w) => {
              // Implement fix actions in a helper
              // e.g., moveSelectedIntoSafe(designLayerRef.current, w.nodeId, safeRect)
            }}
          />
        </div>

        <div className="flex-1 bg-neutral-50 flex items-center justify-center">
          <Stage
            ref={(r) => (stageRef.current = r)}
            width={canvasW}
            height={canvasH}
            onMouseDown={handleStageMouseDown}
            onTouchStart={handleStageMouseDown}
          >
            {/* Guides */}
            <Layer ref={(r) => (guidesLayerRef.current = r)} listening={false}>
              {/* Bleed boundary (canvas edge) */}
              <Rect
                x={0}
                y={0}
                width={canvasW}
                height={canvasH}
                stroke="#a855f7"
                dash={[8, 6]}
              />
              {/* Trim */}
              <Rect
                x={trimRect.x}
                y={trimRect.y}
                width={trimRect.width}
                height={trimRect.height}
                stroke="#f59e0b"
                dash={[8, 6]}
                cornerRadius={effectiveCornerRadiusPx}
              />
              {/* Safe */}
              <Rect
                x={safeRect.x}
                y={safeRect.y}
                width={safeRect.width}
                height={safeRect.height}
                stroke="#10b981"
                dash={[6, 6]}
                cornerRadius={Math.max(0, effectiveCornerRadiusPx - safePx)}
              />
              {/* snapping guide lines will be drawn dynamically in applySnapping() */}
            </Layer>

            {/* Design objects */}
            <Layer ref={(r) => (designLayerRef.current = r)} onDragMove={handleDragMove}>
              {/* Nodes go here */}
            </Layer>

            {/* Transformer layer */}
            <Layer>
              <Konva.Transformer ref={(r: any) => (transformerRef.current = r)} />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
