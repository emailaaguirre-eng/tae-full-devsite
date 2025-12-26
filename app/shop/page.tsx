"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ShopPage() {
  const [productImages, setProductImages] = useState<Record<string, string | null>>({
    card: null,
    postcard: null,
    invitation: null,
    announcement: null,
    print: null,
  });

  // Fetch product images from Gelato API
  useEffect(() => {
    const fetchProductImages = async () => {
      const productTypes = ['card', 'postcard', 'invitation', 'announcement', 'print'];
      const images: Record<string, string | null> = {};
      
      for (const type of productTypes) {
        try {
          const response = await fetch(`/api/gelato/variants?productType=${type}&includeProductInfo=true`);
          if (response.ok) {
            const data = await response.json();
            if (data.productInfo?.thumbnailUrl || data.productInfo?.previewImageUrl) {
              images[type] = data.productInfo.thumbnailUrl || data.productInfo.previewImageUrl;
            }
          }
        } catch (error) {
          console.error(`Error fetching product image for ${type}:`, error);
        }
      }
      
      setProductImages(images);
    };
    
    fetchProductImages();
  }, []);

  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Banner */}
          <div className="relative w-full overflow-hidden rounded-2xl mb-12">
            <img
              src="https://theartfulexperience.com/wp-content/uploads/2025/12/tAE_Holiday_Hero-1.png"
              alt="Shop hero"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Product Selection Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-brand-darkest mb-6 font-playfair text-center">
                Choose Your Product
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Ideas Card */}
                <Link
                  href="/shop/ideas"
                  className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all hover:shadow-lg bg-gradient-to-br from-purple-50 to-blue-50"
                >
                  <div className="text-5xl mb-4">💡</div>
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">ArtKey™ Ideas</h3>
                  <p className="text-brand-dark mb-4">Discover creative ways to enhance your products with digital experiences</p>
                  <div className="w-full py-3 px-6 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors text-center">
                    Explore Ideas
                  </div>
                </Link>

                {/* Cards */}
                <div className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all hover:shadow-lg bg-white">
                  {productImages.card && (
                    <img 
                      src={productImages.card} 
                      alt="Cards" 
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  {!productImages.card && <div className="text-5xl mb-4">💌</div>}
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Cards</h3>
                  <p className="text-brand-dark mb-4">Everyday greeting cards for notes and moments. Perfect for birthdays, holidays, thank you notes, and any occasion where you want to share a personal touch.</p>
                  <Link
                    href="/shop/card"
                    className="block w-full py-3 px-6 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors text-center"
                  >
                    Create A Card
                  </Link>
                </div>

                {/* Postcards */}
                <div className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all hover:shadow-lg bg-white">
                  {productImages.postcard && (
                    <img 
                      src={productImages.postcard} 
                      alt="Postcards" 
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  {!productImages.postcard && <div className="text-5xl mb-4">📮</div>}
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Postcards</h3>
                  <p className="text-brand-dark mb-4">Mail-ready postcards with a writable back. Ideal for travel memories, vacation updates, or quick notes to friends and family.</p>
                  <Link
                    href="/shop/postcard"
                    className="block w-full py-3 px-6 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors text-center"
                  >
                    Create A Postcard
                  </Link>
                </div>

                {/* Invitations */}
                <div className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all hover:shadow-lg bg-white">
                  {productImages.invitation && (
                    <img 
                      src={productImages.invitation} 
                      alt="Invitations" 
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  {!productImages.invitation && <div className="text-5xl mb-4">🎉</div>}
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Invitations</h3>
                  <p className="text-brand-dark mb-4">Event invitations designed to gather your people. Make your special events memorable with beautifully designed invitations.</p>
                  <Link
                    href="/shop/invitation"
                    className="block w-full py-3 px-6 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors text-center"
                  >
                    Create An Invitation
                  </Link>
                </div>

                {/* Announcements */}
                <div className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all hover:shadow-lg bg-white">
                  {productImages.announcement && (
                    <img 
                      src={productImages.announcement} 
                      alt="Announcements" 
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  {!productImages.announcement && <div className="text-5xl mb-4">📢</div>}
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Announcements</h3>
                  <p className="text-brand-dark mb-4">Share life updates and milestone news beautifully. Perfect for announcing important life events and achievements.</p>
                  <Link
                    href="/shop/announcement"
                    className="block w-full py-3 px-6 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors text-center"
                  >
                    Create An Announcement
                  </Link>
                </div>

                {/* Wall Art */}
                <div className="p-8 rounded-2xl border-2 border-brand-light hover:border-brand-dark transition-all hover:shadow-lg bg-white">
                  {productImages.print && (
                    <img 
                      src={productImages.print} 
                      alt="Wall Art" 
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  {!productImages.print && <div className="text-5xl mb-4">🖼️</div>}
                  <h3 className="text-xl font-bold text-brand-darkest mb-2 font-playfair">Wall Art</h3>
                  <p className="text-brand-dark mb-4">Premium prints for your walls, framed or unframed. Transform your favorite photos into stunning wall art for your home or office.</p>
                  <Link
                    href="/shop/print"
                    className="block w-full py-3 px-6 bg-brand-darkest text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors text-center"
                  >
                    Create Wall Art
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

