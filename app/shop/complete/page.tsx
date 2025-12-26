"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function OrderCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productType = searchParams.get("product_type");
  const artkeyId = searchParams.get("artkey_id");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      router.push("/shop");
    }, 1000);
  };

  const handleSaveAndCheckout = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      router.push("/shop");
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-4xl font-bold text-brand-darkest mb-4 font-playfair">
              Your Design is Complete!
            </h1>
            <p className="text-lg text-brand-dark mb-8">
              Your {productType} design with ArtKey™ Portal ID: <strong>{artkeyId}</strong> has been saved.
            </p>
            <div className="bg-brand-lightest rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-brand-darkest mb-4 font-playfair">What's Next?</h2>
              <p className="text-brand-dark mb-4">You can continue shopping or proceed to checkout to complete your order.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleSaveAndContinue} disabled={isSaving} className="px-8 py-4 bg-brand-darkest text-white rounded-lg font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? "Saving..." : "Save and Continue Shopping"}
              </button>
              <button onClick={handleSaveAndCheckout} disabled={isSaving} className="px-8 py-4 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? "Saving..." : "Save and Checkout"}
              </button>
            </div>
            <div className="mt-8 pt-6 border-t border-brand-light">
              <Link href="/shop" className="text-brand-dark hover:text-brand-darkest transition-colors">← Back to Shop</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
