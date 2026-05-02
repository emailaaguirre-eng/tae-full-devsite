import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Calendar, MapPin, ExternalLink, ChevronRight } from "lucide-react";
import {
  ArtKeyTrademark,
  renderStringWithArtKeyTrademarks,
} from "@/components/RefinedTm";

interface PhoneModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  type: "gallery" | "video" | "playlist" | "voice";
}

const MODAL_STYLES = {
  body: { maxHeight: "60vh", overflowY: "auto" as const },
  section: { padding: "24px" },
  label: {
    fontFamily: "Inter, sans-serif",
    fontSize: "0.7rem",
    fontWeight: 700 as const,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#918c86",
    marginBottom: "16px",
    display: "block",
  },
  divider: { borderTop: "1px solid #ded8d3", margin: "0" },
};

/* ─── Welcome Message ─────────────────────────────────────────────────────── */
function WelcomeMessageContent() {
  return (
    <div style={MODAL_STYLES.section}>
      <span style={MODAL_STYLES.label}>A note from The Artful Experience</span>
      <div
        style={{
          background: "#ecece9",
          borderRadius: "14px",
          padding: "24px",
          border: "1px solid #ded8d3",
        }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1rem",
            color: "#000",
            lineHeight: 1.75,
            margin: 0,
            fontWeight: 400,
          }}
        >
          We're deeply honored to welcome Kimber as The Artful Experience's first co-creator, with an art collaboration launching in the New Year, followed by talks and immersive events. Her story is living proof that limits are meant to be rewritten—and we're just getting started together.
        </p>
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid #ded8d3",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: "#918c86",
          }}
        >
          The Artful Experience
        </div>
      </div>
    </div>
  );
}

/* ─── Behind the Scenes ───────────────────────────────────────────────────── */
// Set to true when real video content is ready to go live
const BEHIND_SCENES_LIVE = false;

function BehindTheScenesContent() {
  if (!BEHIND_SCENES_LIVE) {
    return (
      <div style={MODAL_STYLES.section}>
        <div
          style={{
            background: "#ecece9",
            border: "1px solid #ded8d3",
            borderRadius: "14px",
            padding: "40px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "#ded8d3",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            🎬
          </div>
          <h4
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.1rem",
              fontWeight: 500,
              color: "#000",
              margin: 0,
            }}
          >
            Coming Soon
          </h4>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.82rem",
              color: "#918c86",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "280px",
            }}
          >
            Behind the Scenes content is on its way. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={MODAL_STYLES.section}>
      <span style={MODAL_STYLES.label}>Behind the Scenes</span>
      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #ded8d3",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        <img
          src="https://picsum.photos/seed/climbing1/480/270"
          alt="Behind the scenes"
          style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "rgba(255,255,255,0.92)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "18px", marginLeft: "3px" }}>▶</span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "12px",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.7rem",
            padding: "3px 8px",
            borderRadius: "4px",
          }}
        >
          4:32
        </div>
      </div>
      <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 500, color: "#000", margin: "0 0 6px" }}>
        The Prosthetic That Changed Everything
      </h4>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#555", lineHeight: 1.6, margin: "0 0 20px" }}>
        A candid look at how Kimber's custom prosthetic tool was designed and refined over two seasons of alpine climbing.
      </p>
      <hr style={MODAL_STYLES.divider} />
      <div style={{ paddingTop: "16px" }}>
        <span style={MODAL_STYLES.label}>More Videos</span>
        {[
          { title: "Training Day on Mount Rainier", thumb: "climbing2", duration: "7:18" },
          { title: "Ice Climbing with One Hand", thumb: "climbing3", duration: "5:44" },
          { title: "The Making of the ArtKey Poster", thumb: "climbing4", duration: "3:22" },
        ].map((v) => (
          <div
            key={v.title}
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
              cursor: "pointer",
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={`https://picsum.photos/seed/${v.thumb}/100/60`}
                alt={v.title}
                style={{ width: "90px", height: "56px", objectFit: "cover", borderRadius: "6px", display: "block" }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: "4px",
                  right: "4px",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  fontSize: "0.6rem",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {v.duration}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", fontWeight: 500, color: "#000", lineHeight: 1.4 }}>
                {renderStringWithArtKeyTrademarks(v.title)}
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#918c86", marginTop: "4px" }}>
                Kimber Cross
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sponsors & Partners ─────────────────────────────────────────────────── */
// To add a sponsor: set sponsorLogoUrl to the logo image URL and fill in the other fields.
const sponsorLogoUrl: string | null = null;        // e.g. "https://example.com/logo.png"
const sponsorName: string | null = null;            // e.g. "The North Face"
const sponsorDescription: string | null = null;     // short paragraph about the partnership
const sponsorWebsite: string | null = null;         // e.g. "https://www.thenorthface.com"

function SponsorsPartnersContent() {
  if (!sponsorName) {
    return (
      <div style={MODAL_STYLES.section}>
        <div
          style={{
            background: "#ecece9",
            border: "1px solid #ded8d3",
            borderRadius: "14px",
            padding: "40px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "#ded8d3",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            🤝
          </div>
          <h4
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.1rem",
              fontWeight: 500,
              color: "#000",
              margin: 0,
            }}
          >
            Coming Soon
          </h4>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.82rem",
              color: "#918c86",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "280px",
            }}
          >
            Sponsor and partner details will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={MODAL_STYLES.section}>
      <span style={MODAL_STYLES.label}>Official Partners</span>
      <div
        style={{
          border: "1px solid #ded8d3",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            background: "#000",
            padding: "28px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sponsorLogoUrl ? (
            <img
              src={sponsorLogoUrl}
              alt={sponsorName}
              style={{ maxHeight: "36px", maxWidth: "160px", objectFit: "contain", filter: "invert(1)" }}
            />
          ) : (
            <span style={{ color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.18em" }}>
              {sponsorName.toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ padding: "20px 24px" }}>
          <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 500, color: "#000", margin: "0 0 8px" }}>
            {sponsorName}
          </h4>
          {sponsorDescription && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#555", lineHeight: 1.65, margin: "0 0 16px" }}>
              {sponsorDescription}
            </p>
          )}
          {sponsorWebsite && (
            <a
              href={sponsorWebsite}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#000",
                textDecoration: "none",
                borderTop: "1px solid #ded8d3",
                paddingTop: "14px",
              }}
            >
              <ExternalLink size={13} />
              Visit {sponsorWebsite.replace("https://www.", "").replace("https://", "")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Talks & Appearances ─────────────────────────────────────────────────── */
const appearances = [
  {
    date: { month: "JAN", day: "15", year: "2026" },
    title: "Summit Stories: Women in Adaptive Climbing",
    venue: "REI Co-op — Seattle, WA",
    type: "Panel Discussion",
    past: true,
  },
  {
    date: { month: "FEB", day: "8", year: "2026" },
    title: "Adaptive Athletics & The Future of Gear",
    venue: "Outdoor Retailer — Denver, CO",
    type: "Keynote",
    past: true,
  },
  {
    date: { month: "FEB", day: "22", year: "2026" },
    title: "Climbing Without Limits — Book Talk",
    venue: "Powell's Books — Portland, OR",
    type: "Speaking",
    past: true,
  },
  {
    date: { month: "MAR", day: "8", year: "2026" },
    title: "International Women's Day — Guest Speaker",
    venue: "University of Washington — Seattle, WA",
    type: "Guest Lecture",
    past: true,
  },
  {
    date: { month: "MAR", day: "29", year: "2026" },
    title: "Adaptive Athlete Summit",
    venue: "San Leandro, CA",
    type: "Athlete Event",
    past: true,
  },
];

function TalksAppearancesContent() {
  return (
    <div style={MODAL_STYLES.section}>
      <span style={MODAL_STYLES.label}>Past Appearances</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {appearances.map((ev, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "14px",
              background: ev.past ? "#f8f8f7" : "#ffffff",
              border: `1px solid ${ev.past ? "#e8e4e0" : "#ded8d3"}`,
              borderRadius: "10px",
              padding: "14px",
              opacity: ev.past ? 0.7 : 1,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: "44px",
                background: ev.past ? "#ded8d3" : "#1A1A1A",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 4px",
              }}
            >
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: ev.past ? "#918c86" : "#fff",
                  lineHeight: 1,
                }}
              >
                {ev.date.month}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: ev.past ? "#918c86" : "#fff",
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                {ev.date.day}
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.55rem",
                  color: ev.past ? "#918c86" : "rgba(255,255,255,0.6)",
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                {ev.date.year}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    background: ev.past ? "#ded8d3" : "#ecece9",
                    color: ev.past ? "#918c86" : "#475569",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  {ev.past ? "Past" : ev.type}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.83rem",
                  fontWeight: 600,
                  color: "#000",
                  lineHeight: 1.3,
                  marginBottom: "5px",
                }}
              >
                {renderStringWithArtKeyTrademarks(ev.title)}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.72rem",
                  color: "#918c86",
                }}
              >
                <MapPin size={10} />
                {ev.venue}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Forum / Blog ────────────────────────────────────────────────────────── */
const posts = [
  {
    id: 1,
    title: "Why I Climbed Rainier Six Times",
    date: "March 28, 2026",
    excerpt: "People ask me what keeps me going back. It's not the summit — it's the space between the decisions. The mountain doesn't care about your limitations. It just asks: what will you do next?",
    image: "climbing5",
    tag: "Mindset",
    readTime: "4 min read",
  },
  {
    id: 2,
    title: "Building the Prosthetic That Let Me Ice Climb",
    date: "February 14, 2026",
    excerpt: "Two seasons, three prototypes, and one breakthrough. Here's the full story of how we worked with engineers, climbers, and occupational therapists to design a tool that changed everything.",
    image: "climbing6",
    tag: "Gear",
    readTime: "6 min read",
  },
  {
    id: 3,
    title: "To Every Adaptive Athlete Starting Out",
    date: "January 5, 2026",
    excerpt: "You're going to hear a lot of 'that's impressive for someone with your condition.' Ignore it. Every boundary you push doesn't just move for you — it moves for everyone who comes after.",
    image: "climbing7",
    tag: "Community",
    readTime: "3 min read",
  },
];

// Set to true when forum/blog content is ready to go live
const FORUM_LIVE = false;

function ForumContent() {
  if (!FORUM_LIVE) {
    return (
      <div style={MODAL_STYLES.section}>
        <div
          style={{
            background: "#ecece9",
            border: "1px solid #ded8d3",
            borderRadius: "14px",
            padding: "40px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "#ded8d3",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            ✍️
          </div>
          <h4
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.1rem",
              fontWeight: 500,
              color: "#000",
              margin: 0,
            }}
          >
            Coming Soon
          </h4>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.82rem",
              color: "#918c86",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "280px",
            }}
          >
            The supporter forum is coming soon. Posts and updates from Kimber will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: "20px 24px 4px" }}>
        <span style={MODAL_STYLES.label}>Forum For Supporters</span>
      </div>
      {posts.map((post, i) => (
        <div key={post.id}>
          <div style={{ padding: "0 24px 20px" }}>
            <img
              src={`https://picsum.photos/seed/${post.image}/480/200`}
              alt={post.title}
              style={{
                width: "100%",
                height: "140px",
                objectFit: "cover",
                borderRadius: "10px",
                display: "block",
                marginBottom: "12px",
                border: "1px solid #ded8d3",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span
                style={{
                  background: "#ecece9",
                  border: "1px solid #ded8d3",
                  borderRadius: "9999px",
                  padding: "3px 10px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                {post.tag}
              </span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: "#918c86" }}>
                {post.date}
              </span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: "#ded8d3" }}>·</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: "#918c86" }}>
                {post.readTime}
              </span>
            </div>
            <h4
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1rem",
                fontWeight: 500,
                color: "#000",
                margin: "0 0 8px",
                lineHeight: 1.35,
              }}
            >
              {renderStringWithArtKeyTrademarks(post.title)}
            </h4>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.8rem",
                color: "#555",
                lineHeight: 1.65,
                margin: "0 0 12px",
              }}
            >
              {post.excerpt}
            </p>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#000",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Read more <ChevronRight size={13} />
            </button>
          </div>
          {i < posts.length - 1 && <hr style={MODAL_STYLES.divider} />}
          {i < posts.length - 1 && <div style={{ height: "20px" }} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Stay Connected ──────────────────────────────────────────────────────── */
function StayConnectedContent() {
  return (
    <div style={MODAL_STYLES.section}>
      <span style={MODAL_STYLES.label}>Stay in the loop</span>
      <div
        style={{
          background: "#ecece9",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #ded8d3",
          marginBottom: "20px",
        }}
      >
        <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 500, color: "#000", margin: "0 0 6px" }}>
          Get updates from Kimber
        </h4>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#555", lineHeight: 1.6, margin: "0 0 16px" }}>
          New climbs, new posts, upcoming appearances — dropped directly to your inbox.
        </p>
        <input
          type="email"
          placeholder="Your email address"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #ded8d3",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.82rem",
            color: "#000",
            background: "#fff",
            boxSizing: "border-box" as const,
            marginBottom: "10px",
            outline: "none",
          }}
        />
        <button
          style={{
            width: "100%",
            padding: "10px",
            background: "#1A1A1A",
            color: "#fff",
            border: "none",
            borderRadius: "9999px",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Subscribe
        </button>
      </div>
      <span style={MODAL_STYLES.label}>Follow Along</span>
      {[
        { platform: "Instagram", handle: "@kimbercrossclimbs", icon: "📷" },
        { platform: "YouTube", handle: "Kimber Cross", icon: "▶" },
        { platform: "Strava", handle: "Kimber Cross", icon: "🏃" },
      ].map((s) => (
        <div
          key={s.platform}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 0",
            borderBottom: "1px solid #ded8d3",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#ecece9",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {s.icon}
          </div>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#000" }}>
              {s.platform}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#918c86" }}>
              {s.handle}
            </div>
          </div>
          <ExternalLink size={13} color="#918c86" style={{ marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Modal Shell ─────────────────────────────────────────────────────────── */
function getContent(title: string) {
  switch (title) {
    case "Welcome Message": return <WelcomeMessageContent />;
    case "Behind the Scenes": return <BehindTheScenesContent />;
    case "Sponsors & Partners": return <SponsorsPartnersContent />;
    case "Talks & Appearances": return <TalksAppearancesContent />;
    case "Forum For Supporters": return <ForumContent />;
    case "Stay Connected": return <StayConnectedContent />;
    default: return null;
  }
}

export function PhoneModal({ open, onClose, title }: PhoneModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
          }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 50,
            background: "#ffffff",
            border: "1px solid #ded8d3",
            borderRadius: "16px",
            padding: 0,
            maxWidth: "480px",
            width: "90vw",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(20,20,20,0.18)",
          }}
        >
          <DialogPrimitive.Title style={{ display: "none" }}>{title}</DialogPrimitive.Title>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px",
              borderBottom: "1px solid #ded8d3",
              background: "#f3f3f3",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#000000",
                  lineHeight: 1.2,
                }}
              >
                {renderStringWithArtKeyTrademarks(title)}
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.65rem",
                  color: "#918c86",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: "2px",
                }}
              >
                <ArtKeyTrademark /> Portal
              </div>
            </div>
            <DialogPrimitive.Close
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#ded8d3",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#000";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#ded8d3";
                (e.currentTarget as HTMLButtonElement).style.color = "inherit";
              }}
            >
              <X size={14} />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div style={MODAL_STYLES.body}>{getContent(title)}</div>

          {/* Footer */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #ded8d3",
              background: "#ecece9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.65rem",
                color: "#918c86",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Powered by The <ArtKeyTrademark />
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
