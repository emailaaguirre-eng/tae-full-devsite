"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetchJson, AdminUnauthorizedError } from "@/lib/admin/clientFetch";
import { ExternalLink, Package, Search } from "lucide-react";

type ListingRow = {
  id: string;
  listingCode: string;
  slug: string;
  name: string;
  description: string | null;
  heroImage: string | null;
  galleryImages: string | null;
  /** Resolved preview URL for admin list (listing hero → gallery → assignment/legacy). */
  thumbnailUrl?: string | null;
  /** Lowercased concatenation of name, codes, category, linked legacy product & creators — for search. */
  searchText?: string;
  active: boolean;
  featured: boolean;
  customizable: boolean;
  requiresQrCode: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string;
  categoryPathLabel: string;
  assignmentCount: number;
  enabledAssignmentCount: number;
  mappedAssignmentCount: number;
  minEffectivePrice: number | null;
  maxEffectivePrice: number | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  categoryType: string;
  pathLabel: string;
  icon: string;
  taeBaseFee: number;
  requiresQrCode: boolean;
  productCount: number;
};

const BTN_SECONDARY =
  "border border-brand-dark text-brand-dark px-4 py-2 text-sm font-medium inline-flex items-center gap-2 hover:bg-brand-dark/10 transition-colors disabled:opacity-50";

function formatPrice(value: number | null | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function CatalogV2ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const leafCategories = useMemo(
    () => categories.filter((c) => (c.categoryType || "leaf") === "leaf"),
    [categories]
  );

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { res, data } = await adminFetchJson(
        "/api/admin/catalog-v2/listings",
        undefined,
        () => router.push("/b_d_admn_tae/login")
      );

      if (res.ok && data?.success) {
        setListings(data.data || []);
        setCategories(data.categories || []);
      } else {
        setError(data?.error || `Failed to load Catalog V2 listings (${res.status})`);
      }
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) return;
      setError("Failed to load Catalog V2 listings");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const searchQ = search.trim().toLowerCase();
  const filtered = listings.filter((l) => {
    const matchSearch =
      !searchQ ||
      (l.searchText && l.searchText.includes(searchQ)) ||
      (!l.searchText &&
        [l.name, l.listingCode, l.slug, l.description || "", l.categoryPathLabel, l.categoryName, l.categorySlug]
          .join(" ")
          .toLowerCase()
          .includes(searchQ));

    const matchCat = !filterCat || l.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-medium text-sm">Loading Catalog V2 listings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-normal text-brand-dark font-playfair">
            Catalog V2 Listings
          </h1>
          <p className="text-sm text-brand-medium mt-1">
            {listings.length} listings total. Read-only validation view for the new customer-facing product model.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <Link href="/b_d_admn_tae/catalog/products" className={BTN_SECONDARY}>
            Legacy Products
          </Link>
        </div>
      </div>

      <div className="bg-white border border-brand-light mb-5">
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, slug, category, description, artist…"
              className="w-full border border-brand-light pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest"
            />
          </div>

          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="border border-brand-light px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium bg-brand-lightest min-w-[240px]"
          >
            <option value="">All categories</option>
            {leafCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.pathLabel || c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-brand-light">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-8 h-8 text-brand-medium mx-auto mb-2" />
            <div className="text-sm text-brand-medium">No Catalog V2 listings found</div>
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-brand-medium font-medium bg-brand-lightest">
              <div className="col-span-1">Image</div>
              <div className="col-span-3">Listing</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Price Range</div>
              <div className="col-span-2">Assignments</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Actions</div>
            </div>

            {filtered.map((l) => {
              const fullyMapped =
                l.assignmentCount > 0 && l.assignmentCount === l.mappedAssignmentCount;

              return (
                <div key={l.id} className="px-4 py-3 hover:bg-brand-lightest/50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 md:items-center">
                    <div className="flex md:contents gap-3 md:gap-4 md:items-center">
                      <div className="md:col-span-1 shrink-0">
                        <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">
                          Image
                        </div>
                        {l.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary URLs
                          <img
                            src={l.thumbnailUrl}
                            alt=""
                            className="w-16 h-16 md:w-14 md:h-14 rounded-md object-cover border border-brand-light bg-brand-lightest"
                          />
                        ) : (
                          <div
                            className="w-16 h-16 md:w-14 md:h-14 rounded-md border border-dashed border-brand-light bg-brand-lightest flex items-center justify-center"
                            title="No thumbnail"
                          >
                            <Package className="w-5 h-5 text-brand-medium/45" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-3 min-w-0 flex-1">
                        <Link
                          href={`/b_d_admn_tae/catalog-v2/listings/${encodeURIComponent(l.listingCode)}`}
                          className="block group"
                        >
                          <div className="text-sm font-medium text-brand-dark group-hover:text-brand-accent transition-colors">
                            {l.name}
                          </div>
                          <div className="text-[10px] text-brand-medium mt-0.5 group-hover:text-brand-dark transition-colors">
                            {l.listingCode} · /shop/{l.slug}
                          </div>
                        </Link>
                      </div>
                    </div>

                    <div className="md:col-span-2 text-xs text-brand-medium">
                      <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">
                        Category
                      </div>
                      {l.categoryPathLabel || l.categoryName}
                    </div>

                    <div className="md:col-span-2 text-sm font-medium text-brand-dark">
                      <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">
                        Price Range
                      </div>
                      ${formatPrice(l.minEffectivePrice)}
                      {l.maxEffectivePrice !== null && l.maxEffectivePrice !== l.minEffectivePrice
                        ? ` - $${formatPrice(l.maxEffectivePrice)}`
                        : ""}
                    </div>

                    <div className="md:col-span-2 text-xs text-brand-medium">
                      <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">
                        Assignments
                      </div>
                      <div>{l.enabledAssignmentCount}/{l.assignmentCount} enabled</div>
                      <div className={fullyMapped ? "text-green-700" : "text-amber-700"}>
                        {l.mappedAssignmentCount}/{l.assignmentCount} mapped
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">
                        Status
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 font-medium ${
                          l.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {l.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="md:col-span-1">
                      <div className="md:hidden text-[10px] uppercase tracking-wider text-brand-medium font-medium mb-1">
                        Actions
                      </div>
                      <div className="flex items-center gap-2 flex-wrap md:justify-end">
                        <Link
                          href={`/shop/${l.slug}`}
                          target="_blank"
                          className="text-brand-medium hover:text-brand-dark transition-colors"
                          title="Open storefront listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
