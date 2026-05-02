"use client";

import type { ReactNode } from "react";
import type { Creator, PhoneButton } from "@/data/creators";
import PortalButtonList from "@/artkey-portal/PortalButtonList";

type Props = {
  creator: Creator;
  onButtonClick: (btn: PhoneButton) => void;
  /** Tighter frame when nested in the co-creators bento card (matches shared mockup). */
  compact?: boolean;
  /** Heading above the button list (default: guest preview line). */
  title?: ReactNode;
};

export function GuestStylePhoneMockup({
  creator,
  onButtonClick,
  compact = false,
  title = "Your Personalized Design",
}: Props) {
  return (
    <div
      style={{
        width: compact ? "200px" : "220px",
        height: compact ? "400px" : "440px",
        background: "#1A1A1A",
        borderRadius: "44px",
        padding: "8px",
        border: "2px solid #333",
        boxShadow: "0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)",
        marginTop: compact ? 8 : 16,
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 0,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "38px",
          height: "100%",
          padding: "18px 10px 10px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "18px",
            background: "#1A1A1A",
            borderRadius: "12px",
            margin: "0 auto 8px",
            flexShrink: 0,
          }}
          aria-hidden
        />
        <h4
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: compact ? "15px" : "17px",
            fontWeight: 700,
            color: "#000000",
            margin: "0 0 8px",
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h4>
        <div
          style={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            paddingRight: "2px",
          }}
        >
          <PortalButtonList
            mode="live"
            buttons={creator.phoneButtons}
            onButtonClick={onButtonClick}
          />
        </div>
      </div>
    </div>
  );
}
