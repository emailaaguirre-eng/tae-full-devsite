"use client";

import Image from "next/image";
import { useState } from "react";

export default function VideoSection() {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handlePortalButtonClick = (feature: string) => {
    setShowTooltip(feature);
    setTimeout(() => setShowTooltip(null), 2000);
  };
  return (
    <section className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            Welcome to The Artful Experience Gallery and Upload Center
          </h1>
          <h2 className="text-2xl md:text-3xl font-normal text-brand-dark mb-4">
            Where soul-stirring art and images become a living portal.
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-6"></div>
          <div className="text-lg text-brand-darkest max-w-3xl mx-auto space-y-4 text-left">
            <p>
              Give a gift that will never be forgotten, even if that gift is for you.
            </p>
            <p>
              Discover our ArtKey™ technology that allows you to upload videos, music, and time-released gift certificates that are embedded in the art.
            </p>
            <p>
              When the giftee scans the ArtKey™/QR Code, they will be surprised by the unique message, video, song, or e-gift card you have uploaded for them.
            </p>
          </div>
        </div>

        {/* Two-Column Layout: ArtKey Portal | Combined Options */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16 items-center">
          {/* Left: ArtKey Portal Smartphone */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative bg-gray-900 rounded-[3rem] p-2 shadow-2xl max-w-[280px] w-full">
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
              
              {/* Phone Screen */}
              <div className="bg-white rounded-[2.5rem] overflow-hidden pt-10 pb-6 px-5 min-h-[500px] relative">
                <h3 className="text-2xl font-bold text-brand-darkest mb-6 text-center font-playfair">
                  ArtKey™ Portal
                </h3>
                
                {/* Portal Buttons */}
                <div className="space-y-3 relative">
                  <button 
                    onClick={() => handlePortalButtonClick('Share Your Interests')}
                    className="w-full bg-brand-dark text-white py-4 px-6 rounded-2xl font-semibold hover:bg-brand-darkest transition-all shadow-md hover:shadow-lg text-left"
                    title="Available in ArtKey Portal"
                  >
                    Share Your Interests
                  </button>
                  <button 
                    onClick={() => handlePortalButtonClick('Playlist')}
                    className="w-full bg-brand-dark text-white py-4 px-6 rounded-2xl font-semibold hover:bg-brand-darkest transition-all shadow-md hover:shadow-lg text-left"
                    title="Available in ArtKey Portal"
                  >
                    Playlist
                  </button>
                  <button 
                    onClick={() => handlePortalButtonClick('Sign Guestbook')}
                    className="w-full bg-brand-dark text-white py-4 px-6 rounded-2xl font-semibold hover:bg-brand-darkest transition-all shadow-md hover:shadow-lg text-left"
                    title="Available in ArtKey Portal"
                  >
                    Sign Guestbook
                  </button>
                  <button 
                    onClick={() => handlePortalButtonClick('Video Greeting')}
                    className="w-full bg-brand-dark text-white py-4 px-6 rounded-2xl font-semibold hover:bg-brand-darkest transition-all shadow-md hover:shadow-lg text-left"
                    title="Available in ArtKey Portal"
                  >
                    Video Greeting
                  </button>
                  <button 
                    onClick={() => handlePortalButtonClick('Image Gallery')}
                    className="w-full bg-brand-dark text-white py-4 px-6 rounded-2xl font-semibold hover:bg-brand-darkest transition-all shadow-md hover:shadow-lg text-left"
                    title="Available in ArtKey Portal"
                  >
                    Image Gallery
                  </button>
                  {showTooltip && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-darkest text-white px-4 py-2 rounded-lg shadow-xl z-10 text-sm whitespace-nowrap">
                      {showTooltip} - Available in ArtKey Portal
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Combined Purchase and Upload Options */}
          <div className="bg-gradient-to-br from-brand-lightest to-white rounded-2xl shadow-lg p-8 border border-brand-light">
            <h3 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair">
              Your Purchase & Upload Options
            </h3>
            
            {/* Purchase Options */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-brand-darkest mb-4">
                Purchase Options:
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl font-bold text-brand-medium mt-1">1.</span>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-2">
                      <div className="flex-1 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-brand-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-6 h-6 bg-gray-300 rounded"></div>
                        <div className="w-6 h-6 bg-gray-300 rounded"></div>
                        <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl font-bold text-brand-medium mt-1">2.</span>
                  <div className="flex-1">
                    <p className="text-brand-darkest font-semibold mb-2">
                      Select from our library
                    </p>
                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center border-2 border-brand-medium">
                      <span className="text-3xl text-brand-medium">+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-brand-light my-8"></div>

            {/* Upload Options */}
            <div>
              <h4 className="text-lg font-semibold text-brand-darkest mb-4">
                Upload Options:
              </h4>
              <ul className="space-y-3 text-brand-darkest">
                <li className="flex items-start gap-3">
                  <span className="text-brand-medium text-lg mt-1">•</span>
                  <span>Short video</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-medium text-lg mt-1">•</span>
                  <span>Music/Playlist (Apple/Spotify)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-medium text-lg mt-1">•</span>
                  <span>You can even upload an e-gift card</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-block bg-gradient-to-br from-brand-lightest to-white rounded-2xl shadow-lg p-8 border border-brand-light">
            <p className="text-brand-darkest text-lg mb-6">
              Ready to create your own personalized products?
            </p>
            <a
              href="#products"
              className="inline-block bg-brand-dark text-white px-10 py-4 rounded-full font-semibold hover:bg-brand-darkest transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Creating Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
