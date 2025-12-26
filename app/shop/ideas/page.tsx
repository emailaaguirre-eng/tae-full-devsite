"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function IdeasPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-brand-darkest mb-4 font-playfair">
              ArtKey™ Ideas
            </h1>
            <p className="text-xl text-brand-dark max-w-2xl mx-auto">
              Discover creative ways to enhance your cards, prints, and products with digital experiences
            </p>
          </div>

          {/* Main Introduction */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <p className="text-2xl text-brand-darkest leading-relaxed mb-6 font-playfair text-center">
              ArtKey turns a physical moment into a digital experience that continues the story.
            </p>
            <p className="text-lg text-brand-dark leading-relaxed mb-8 text-center">
              A scan or tap from a card, print, or product opens a private portal where you can share what doesn't fit on paper — memories, media, messages, introductions, offers, next steps.
            </p>
            <div className="text-center">
              <p className="text-xl font-semibold text-brand-darkest mb-2">No app. No account. Just connection.</p>
            </div>
          </div>

          {/* Personal Use Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">✨</span>
              <h2 className="text-3xl font-bold text-brand-darkest font-playfair">For Personal Use</h2>
            </div>
            
            <p className="text-lg text-brand-dark mb-6 italic">
              The things that matter don't end in the moment.
            </p>
            
            <p className="text-lg font-semibold text-brand-darkest mb-4">An ArtKey can:</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Add voice, video, or music to a card or gift</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Share memories, galleries, or a story behind a photo or artwork</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Hold time-released messages for milestones or special dates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Host RSVP pages, guest registries, and thank-you experiences</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Create keepsakes that grow more meaningful over time</span>
              </li>
            </ul>
            
            <p className="text-lg text-brand-darkest font-semibold italic text-center mt-6">
              A physical keepsake becomes a living memory.
            </p>
          </div>

          {/* Business Use Section */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🚀</span>
              <h2 className="text-3xl font-bold text-brand-darkest font-playfair">For Business & Professional Use</h2>
            </div>
            
            <p className="text-lg text-brand-dark mb-6 italic">
              A printed piece becomes a smart, scannable touchpoint.
            </p>
            
            <p className="text-lg font-semibold text-brand-darkest mb-4">An ArtKey can:</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Introduce you or your business with a video or message</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Link to booking, scheduling, or inquiry forms</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Launch product information, demos, or purchase options</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Support events with RSVP, registration, or post-event follow-up</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-darkest mt-1">•</span>
                <span className="text-brand-dark">Share portfolios, testimonials, or onboarding content</span>
              </li>
            </ul>
          </div>

          {/* Call to Action */}
          <div className="bg-brand-darkest text-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold mb-4 font-playfair">Ready to Create Your ArtKey?</h3>
            <p className="text-lg mb-6 text-white/90">
              Start customizing your product and add an ArtKey to bring it to life.
            </p>
            <Link
              href="/shop"
              className="inline-block px-8 py-4 bg-white text-brand-darkest rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

