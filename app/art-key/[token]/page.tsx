import Link from "next/link";
import { brand } from "@/lib/theme";
import { ArtKeyPortalPlaceholder } from "@/components/ArtKeyEditor";

export default function ArtKeyPortal({ params }: { params: { token: string } }) {
  const { token } = params;
  return (
    <main className="min-h-screen" style={{ background: brand.lightest }}>
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div className="text-xs text-brand-darkest/70">Token: {token}</div>
          <Link href="/" className="text-sm text-brand-dark underline">Home</Link>
        </header>
        <ArtKeyPortalPlaceholder token={token} />
      </div>
    </main>
  );
}
