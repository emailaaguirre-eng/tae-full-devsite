// editor/ui/WarningsPanel.tsx
import React from "react";
import type { WarningItem } from "../editorState";

export function WarningsPanel(props: {
  warnings: WarningItem[];
  onFix: (w: WarningItem) => void;
}) {
  const { warnings, onFix } = props;

  if (!warnings.length) {
    return (
      <div className="p-4 border-t">
        <div className="font-semibold">Warnings</div>
        <div className="text-sm text-neutral-500 mt-1">No issues detected.</div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t">
      <div className="font-semibold">Warnings</div>
      <div className="mt-2 space-y-2">
        {warnings.map((w) => (
          <div key={w.id} className="border rounded-none p-2">
            <div className="text-sm">
              <span className={w.severity === "error" ? "text-red-600 font-semibold" : "text-amber-600 font-semibold"}>
                {w.severity.toUpperCase()}
              </span>{" "}
              {w.message}
            </div>
            {w.fix && (
              <button className="mt-2 border rounded-none px-2 py-1 text-sm" onClick={() => onFix(w)}>
                Fix it
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
