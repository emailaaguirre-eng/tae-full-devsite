"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import heroData from "@/content/hero.json";
import { mediaUrl } from "@/lib/media";

interface HeroContent {
  headline1: string;
  headline2: string;
  subtitle: string;
  description: string;
}

// Hero background image
const heroBackground = mediaUrl(
  "https://theartfulexperience.com/wp-content/uploads/2026/01/herowedding.png"
);

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const [heroContent, setHeroContent] = useState<HeroContent>(heroData);
  
  const totalSlides = 3;
  const autoPlayInterval = 8000; // 8 seconds per slide

  // Fetch hero content from WordPress
  useEffect(() => {
    fetch('/api/hero-content')
      .then(res => res.json())
      .then(data => setHeroContent(data))
      .catch(() => setHeroContent(heroData));
  }, []);

  // Auto-play slides
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 15 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 15000);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  }, []);

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: data.message || 'Thank you for signing up!' });
        setSignUpForm({ name: '', email: '' });
        setTimeout(() => {
          setShowSignUpModal(false);
          setSubmitMessage(null);
        }, 2000);
      } else {
        setSubmitMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="home"
      className="relative pt-16 min-h-screen flex items-center overflow-hidden"
      style={{ backgroundColor: "#f3f3f3" }}
    >
      {/* Organic background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-light/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-medium/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brand-dark/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Slider Container */}
      <div className="w-full relative z-10">
        {/* The Artful Experience Title - Always visible */}
        <div className="text-center pt-8 pb-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark font-playfair tracking-wide">
            The Artful Experience
          </h1>
        </div>

        {/* Slides */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* SLIDE 1: Coming Soon */}
            <div className="w-full flex-shrink-0 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="bg-white p-8 shadow-lg">
                  <h2 className="text-2xl md:text-3xl font-bold text-brand-darkest mb-6 font-playfair text-center">
                    We&apos;re Building Something Special
                  </h2>
                  <div className="text-lg text-brand-darkest max-w-4xl mx-auto mb-6 text-left space-y-4">
                    <p>
                      A destination where art comes to life. From original paintings and photography (even from your phone) to holiday cards, wedding announcements, personal milestones, and meaningful moments, each piece is designed to live beyond the surface.
                    </p>
                    <p>
                      Through our proprietary ArtKey™ technology, any artwork, image, or card becomes an interactive experience. Upload a personal video, curated playlist, heartfelt message, or e-gift card, and transform what you give into something that speaks, evolves, and endures.
                    </p>
                    <p>
                      Every piece becomes more than an object.
                    </p>
                    <p>
                      It becomes a story.<br />
                      A memory.<br />
                      An experience that&apos;s meant to be returned to, not tucked away.
                    </p>
                    <p className="font-bold">
                      We invite you to explore, and look forward to our official launch in early 2026.
                    </p>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => setShowSignUpModal(true)}
                      className="inline-block bg-brand-medium text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-dark transition-all shadow-lg"
                    >
                      Sign up for updates
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE 2: Hero Content with Image */}
            <div className="w-full flex-shrink-0 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left side - Typography */}
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal text-brand-dark leading-[1.1] tracking-tight font-playfair">
                        {heroContent.headline1} {heroContent.headline2}
                      </h2>
                    </div>
                    
                    <div className="pl-2 border-l-4 border-brand-medium space-y-3">
                      <p className="text-base md:text-lg text-brand-darkest leading-relaxed font-light whitespace-normal">
                        {(heroContent.subtitle || "").replace(/\s*\n\s*/g, " ").trim()}
                      </p>
                      <p className="text-sm md:text-base text-brand-dark leading-relaxed">
                        {heroContent.description.split('\n')
                          .filter(line => !line.toLowerCase().includes('upload an image') && !line.toLowerCase().includes('browse our library'))
                          .map((line, i) => (
                            <span key={i}>
                              {i === 0 && line.includes('ArtKey') ? (
                                <>
                                  {line.split('ArtKey')[0]}
                                  <span className="font-bold text-brand-darkest">ArtKey™</span>
                                  {line.split('ArtKey')[1]}
                                </>
                              ) : (
                                line
                              )}
                              {i < heroContent.description.split('\n').filter(line => !line.toLowerCase().includes('upload an image') && !line.toLowerCase().includes('browse our library')).length - 1 && <br />}
                            </span>
                          ))}
                      </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <a
                        href="/shop"
                        className="inline-block bg-brand-dark text-white px-8 py-4 text-base font-medium hover:bg-brand-darkest transition-all duration-300 "
                      >
                        Explore Products
                      </a>
                    </div>
                  </div>

                  {/* Right side - Hero Image */}
                  <div className="relative">
                    <div className="w-full bg-white/80 flex items-center justify-center overflow-hidden  shadow-xl border border-brand-light/60">
                      <img
                        src={heroBackground}
                        alt="TheAE Hero"
                        className="w-full h-auto object-contain"
                        style={{ objectPosition: 'top center' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE 3: Gallery */}
            <div className="w-full flex-shrink-0 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto py-12">
                <div className="bg-white  p-8 md:p-12 shadow-lg">
                  <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left - Gallery Preview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="aspect-square bg-gradient-to-br from-brand-light to-brand-medium  shadow-md flex items-center justify-center">
                        <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="aspect-square bg-gradient-to-br from-brand-medium to-brand-dark  shadow-md flex items-center justify-center">
                        <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div className="aspect-square bg-gradient-to-br from-brand-dark to-brand-darkest  shadow-md flex items-center justify-center">
                        <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0v16a2 2 0 002 2h6a2 2 0 002-2V4" />
                        </svg>
                      </div>
                      <div className="aspect-square bg-gradient-to-br from-brand-accent to-brand-light  shadow-md flex items-center justify-center">
                        <svg className="w-16 h-16 text-brand-dark/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>

                    {/* Right - Gallery Info */}
                    <div className="space-y-6">
                      <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest font-playfair">
                        Discover Our Gallery
                      </h2>
                      <p className="text-lg text-brand-dark leading-relaxed">
                        Explore original works from talented artists. Each piece is available as a high-quality print enhanced with ArtKey™ technology, bringing the artist&apos;s story to life.
                      </p>
                      <ul className="space-y-3 text-brand-darkest">
                        <li className="flex items-center gap-3">
                          <span className="w-2 h-2 bg-brand-medium rounded-full"></span>
                          Original paintings & photography
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-2 h-2 bg-brand-medium rounded-full"></span>
                          Artist stories & behind-the-scenes
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-2 h-2 bg-brand-medium rounded-full"></span>
                          Premium print quality
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-2 h-2 bg-brand-medium rounded-full"></span>
                          ArtKey™ enhanced experiences
                        </li>
                      </ul>
                      <a
                        href="/gallery"
                        className="inline-block bg-brand-dark text-white px-8 py-4 text-base font-medium hover:bg-brand-darkest transition-all duration-300 "
                      >
                        Browse Gallery
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slider Navigation */}
        <div className="flex justify-center items-center gap-6 py-8">
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex gap-3">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? 'bg-brand-dark w-8'
                    : 'bg-brand-light hover:bg-brand-medium'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Organic wave divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80L48 75C96 70 192 60 288 55C384 50 480 50 576 52.5C672 55 768 60 864 62.5C960 65 1056 65 1152 60C1248 55 1344 45 1392 40L1440 35V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
            fill="white"
            className="opacity-90"
          />
        </svg>
      </div>

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  shadow-xl max-w-md w-full p-8 relative">
            <button
              onClick={() => {
                setShowSignUpModal(false);
                setSubmitMessage(null);
                setSignUpForm({ name: '', email: '' });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-brand-darkest mb-2 font-playfair">Sign Up for Updates</h2>
            <p className="text-gray-600 mb-6">Stay informed about our launch and new features.</p>

            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={signUpForm.name}
                  onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-brand-medium focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={signUpForm.email}
                  onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-brand-medium focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              {submitMessage && (
                <div
                  className={`p-3  ${
                    submitMessage.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-medium text-white px-6 py-3  font-semibold hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
