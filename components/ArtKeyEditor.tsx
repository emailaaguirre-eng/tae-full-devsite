import { templates } from "@/lib/templates";
import { brand } from "@/lib/theme";

export function ArtKeyEditor({ token }: { token: string }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        <div className="p-4 rounded-2xl border border-brand-light bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-brand-dark">Templates</h2>
              <p className="text-xs text-brand-darkest/70">Choose a template (includes AZ team themes)</p>
            </div>
            <div className="text-[10px] text-brand-darkest/60">token: {token}</div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {templates.map((tpl) => (
              <div key={tpl.value} className="rounded-xl border border-brand-light overflow-hidden">
                <div
                  className="h-20"
                  style={{ background: tpl.bg }}
                />
                <div className="p-2 text-sm flex items-center justify-between">
                  <span className="text-brand-darkest">{tpl.name}</span>
                  <button className="text-xs px-2 py-1 bg-brand-medium text-white rounded" aria-label={Select }>
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-brand-light bg-white shadow-sm">
          <h2 className="text-lg font-bold text-brand-dark mb-2">Coming next</h2>
          <ul className="text-sm text-brand-darkest/80 list-disc list-inside space-y-1">
            <li>Color palettes, backgrounds, fonts</li>
            <li>Buttons/links, guestbook, media uploads, Spotify, messages</li>
            <li>Save/load via WP REST</li>
            <li>Trigger QR + composite</li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-2xl border border-brand-light bg-white shadow-sm">
          <h2 className="text-lg font-bold text-brand-dark mb-2">Live Preview (placeholder)</h2>
          <div className="rounded-xl border border-brand-light bg-brand-lightest h-80 flex items-center justify-center text-sm text-brand-darkest/70">
            Portal preview will render here.
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArtKeyPortalPlaceholder({ token }: { token: string }) {
  return (
    <div className="p-4 rounded-2xl border border-brand-light bg-white shadow-sm">
      <h2 className="text-lg font-bold text-brand-dark mb-2">Portal Placeholder</h2>
      <p className="text-sm text-brand-darkest/80">Will load portal data for token: {token}.</p>
    </div>
  );
}
