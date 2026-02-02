// app/customization-studio/page.tsx
// Canonical route is /studio. Keep this route as a simple redirect to avoid drift.

import { redirect } from "next/navigation";

export default function CustomizationStudioRedirectPage() {
  redirect("/studio");
}
