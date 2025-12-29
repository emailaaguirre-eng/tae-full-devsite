"use client";

import { useState, useEffect, useRef } from "react";
import heroData from "@/content/hero.json";

interface HeroContent {
  headline1: string;
  headline2: string;
  subtitle: string;
  description: string;
}

const heroBackground =
  "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/tAE_Hero_Image-e1765861961231.png?v=2";

export default function Hero() {
  const [selectedOption, setSelectedOption] = useState<"upload" | "gallery" | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Use hero content from JSON file (editable via Visual Editor)
  const [heroContent, setHeroContent] = useState<HeroContent>(heroData);

  // Fetch hero content from WordPress (fallback if API is available)
  useEffect(() => {
    fetch('/api/hero-content')
      .then(res => res.json())
      .then(data => setHeroContent(data))
      .catch(() => {
        // Fallback to JSON file content if API fails
        setHeroContent(heroData);
      });
  }, []);

  // Convert image to JPG format
  const convertImageToJPG = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to convert image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Convert to JPG (quality 0.92 for good balance)
          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(jpgDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        // Only allow one photo at this stage, convert to JPG
        const file = files[0];
        const jpgDataUrl = await convertImageToJPG(file);
        setSelectedImages([jpgDataUrl]); // Replace with single image
      } catch (error) {
        console.error('Error converting image:', error);
        alert('Failed to process image. Please ensure it is in JPG, PNG, or BMP format.');
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      {/* Organic background shapes - more artistic */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-light/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-medium/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brand-dark/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        {/* The Artful Experience Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark font-playfair tracking-wide">
            The Artful Experience
          </h1>
          <div className="mt-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg w-full">
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
                  We invite you to explore, and look forward to our official launch in January 2026.
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
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Typography with more personality */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-5xl md:text-6xl font-normal text-brand-dark leading-[1.1] tracking-tight font-playfair">
                {heroContent.headline1} {heroContent.headline2}
              </h1>
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

            {/* Action buttons - more refined */}
            {/* COMMENTED OUT: Upload Image and Browse Gallery buttons
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setSelectedOption("upload")}
                className="group relative bg-brand-dark text-white px-8 py-4 text-base font-medium hover:bg-brand-darkest transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Image
                </span>
                <div className="absolute inset-0 bg-brand-darkest transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </button>
              <button
                onClick={() => window.location.href = '/gallery'}
                className="group relative bg-white text-brand-dark px-8 py-4 text-base font-medium border-2 border-brand-dark hover:bg-brand-lightest transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Browse Gallery
                </span>
              </button>
            </div>
            */}
          </div>

          {/* Right side - Upload interface or placeholder */}
          <div className="relative">
            {selectedOption === "upload" ? (
              <div className="bg-brand-lightest/95 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-brand-light animate-fade-in min-h-[500px]">
                <h3 className="text-lg font-bold text-brand-darkest mb-4 font-playfair">Select Photo</h3>
                
                {/* Instructions */}
                <div className="mb-6 p-4 bg-white/80 rounded-lg border border-brand-light">
                  <p className="text-sm text-brand-darkest leading-relaxed font-playfair">
                    Choose the photo that speaks to your heart&mdash;the one you&apos;d love to share as a gift. 
                    In the Design Editor, you can create beautiful collages by adding more photos, 
                    or enhance this single image with artistic touches. Remember, you&apos;ll also be able 
                    to add photos to your ArtKey™ Portal, so select the image that truly captures 
                    the moment you want to gift.
                  </p>
                </div>
                
                <div className="grid grid-cols-12 gap-4 h-full">
                  {/* Left: Action buttons sidebar */}
                  <div className="col-span-3 space-y-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-brand-medium text-white px-4 py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Select
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.bmp,image/jpeg,image/png,image/bmp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {selectedImages.length > 0 && (
                      <button
                        onClick={() => {
                          const params = new URLSearchParams({
                            images: selectedImages.join(','),
                            from_hero: 'true',
                          });
                          window.location.href = `/customize?${params}`;
                        }}
                        className="w-full bg-brand-dark text-white px-4 py-3 rounded-xl font-medium hover:bg-brand-darkest transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Customize
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedOption(null);
                        setSelectedImages([]);
                      }}
                      className="w-full bg-white text-brand-dark px-4 py-3 rounded-xl font-medium border border-brand-light hover:bg-brand-lightest transition-colors"
                    >
                      Back
                    </button>
                  </div>

                  {/* Center: Single photo placeholder or selected image */}
                  <div className="col-span-9 space-y-3 flex flex-col">
                    {selectedImages.length > 0 ? (
                      <div className="relative group flex-shrink-0 aspect-square w-full bg-white rounded-xl border-2 border-brand-light shadow-md overflow-hidden">
                        <img
                          src={selectedImages[0]}
                          alt="Selected photo"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        <button
                          onClick={() => setSelectedImages([])}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 aspect-square bg-white border-2 border-brand-light rounded-xl flex items-center justify-center shadow-sm">
                        <div className="flex flex-col items-center gap-2 text-brand-dark/40">
                          <div className="w-12 h-12 rounded-full border border-brand-light flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium">Upload your photo</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : selectedOption === "gallery" ? (
              <div className="bg-white/90 backdrop-blur-md p-8 shadow-2xl border border-brand-light/50 animate-fade-in">
                <p className="text-brand-dark font-medium mb-6 text-sm uppercase tracking-wide">
                  Select Product Type
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href="#cards"
                    className="group relative bg-gradient-to-br from-brand-light to-brand-medium p-8 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/20 rounded mb-4 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-white font-bold text-lg">Cards</div>
                    </div>
                    <div className="absolute inset-0 bg-white/10 transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  </a>
                  <a
                    href="#prints"
                    className="group relative bg-gradient-to-br from-brand-medium to-brand-dark p-8 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/20 rounded mb-4 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-white font-bold text-lg">Prints</div>
                    </div>
                    <div className="absolute inset-0 bg-white/10 transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full bg-white/80 flex items-center justify-center overflow-hidden rounded-2xl shadow-xl border border-brand-light/60">
                <img
                  src={heroBackground}
                  alt="TheAE Hero"
                  className="w-full h-auto object-contain"
                  style={{ objectPosition: 'top center' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Organic wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              {submitMessage && (
                <div
                  className={`p-3 rounded-lg ${
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
                className="w-full bg-brand-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

