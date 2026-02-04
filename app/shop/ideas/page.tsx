'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function IdeasPage() {
  return (
    <main className="min-h-screen bg-brand-lightest">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-brand-dark hover:text-brand-darkest mb-6"
            >
              <span>&#8592;</span>
              <span>Back to Shop</span>
            </Link>
            <h1 className="text-5xl font-bold text-brand-darkest mb-6 font-playfair">
              ArtKey&#8482; Ideas
            </h1>
            <p className="text-xl text-brand-dark max-w-3xl mx-auto">
              Discover creative ways to enhance your products with digital experiences
            </p>
          </div>

          {/* Personal Use */}
          <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">&#10024;</span>
              <h2 className="text-3xl font-bold text-brand-darkest font-playfair">
                For Moments That Matter
              </h2>
            </div>
            <p className="text-lg text-brand-dark mb-6">
              The things that matter don't end in the moment. A physical keepsake becomes a living memory.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Add voice, video, or music to a card or gift</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Share memories, galleries, or a story behind a photo or artwork</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Hold time-released messages for milestones or special dates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Host RSVP pages, guest registries, and thank-you experiences</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Create keepsakes that grow more meaningful over time</span>
              </li>
            </ul>
          </section>

          {/* Business Use */}
          <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">&#128640;</span>
              <h2 className="text-3xl font-bold text-brand-darkest font-playfair">
                For Brands &amp; Businesses
              </h2>
            </div>
            <p className="text-lg text-brand-dark mb-6">
              A smarter way to be remembered.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Introduce you or your business with a video or message</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Link to booking, scheduling, or inquiry forms</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Launch product information, demos, or purchase options</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Support events with RSVP, registration, or post-event follow-up</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Share portfolios, testimonials, or onboarding content</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">&#9679;</span>
                <span className="text-brand-dark">Share your booking link</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center">
            <Link
              href="/shop"
              className="inline-block px-8 py-4 bg-brand-darkest text-white rounded-lg font-bold hover:bg-brand-dark transition-colors"
            >
              Start Creating with ArtKey&#8482;
            </Link>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
