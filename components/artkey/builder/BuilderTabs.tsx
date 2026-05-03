"use client";

import styles from "./akBuilder.module.css";

export type BuilderTabId = "design" | "features" | "save";

const TABS: { id: BuilderTabId; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "features", label: "Features" },
  { id: "save", label: "Save" },
];

type Props = {
  active: BuilderTabId;
  onChange: (id: BuilderTabId) => void;
};

export function BuilderTabs({ active, onChange }: Props) {
  return (
    <div className={styles.tabList} role="tablist" aria-label="Portal builder sections">
      {TABS.map((tab) => {
        const isOn = active === tab.id;
        const isSave = tab.id === "save";
        const activeClass = isSave ? styles.tabActiveSave : styles.tabActive;
        const idleClass = isSave ? styles.tabSave : styles.tab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isOn}
            onClick={() => onChange(tab.id)}
            className={[
              isOn ? activeClass : idleClass,
              isSave ? styles.tabSavePush : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
