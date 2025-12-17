"use client";

import { useState } from "react";

export default function CommissionedArt() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    description: "",
    budget: "",
    timeline: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission - you can integrate with your backend/email service
    console.log("Commissioned Art Request:", formData);
    alert("Thank you for your interest! We'll contact you soon.");
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      projectType: "",
      description: "",
      budget: "",
      timeline: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="commissioned" className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
            Commissioned Art
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            Bring your vision to life with custom commissioned artwork. 
            Work directly with our talented artists to create something truly unique.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-brand-darkest mb-4 font-playfair">
                What We Offer
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-medium rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-darkest mb-1">Custom Portraits</h4>
                    <p className="text-brand-darkest">
                      Personalized portraits in various styles and mediums
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-medium rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-darkest mb-1">Original Artwork</h4>
                    <p className="text-brand-darkest">
                      One-of-a-kind pieces created specifically for you
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-medium rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-darkest mb-1">Digital Art</h4>
                    <p className="text-brand-darkest">
                      Custom digital illustrations and designs
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-medium rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-darkest mb-1">Art Consultation</h4>
                    <p className="text-brand-darkest">
                      Expert guidance to bring your artistic vision to reality
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-brand-lightest rounded-2xl p-6">
              <h3 className="text-xl font-bold text-brand-darkest mb-3 font-playfair">
                The Process
              </h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-bold text-brand-medium">1.</span>
                  <span className="text-brand-darkest">Submit your commission request</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-brand-medium">2.</span>
                  <span className="text-brand-darkest">We&apos;ll match you with the perfect artist</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-brand-medium">3.</span>
                  <span className="text-brand-darkest">Review initial concepts and provide feedback</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-brand-medium">4.</span>
                  <span className="text-brand-darkest">Finalize and receive your custom artwork</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-brand-lightest rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair">
              Request a Commission
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-brand-darkest mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-brand-light rounded-lg focus:border-brand-medium focus:outline-none bg-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-brand-darkest mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-brand-light rounded-lg focus:border-brand-medium focus:outline-none bg-white"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-brand-darkest mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-brand-light rounded-lg focus:border-brand-medium focus:outline-none bg-white"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="projectType" className="block text-sm font-semibold text-brand-darkest mb-2">
                  Project Type *
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  required
                  value={formData.projectType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-brand-light rounded-lg focus:border-brand-medium focus:outline-none bg-white"
                >
                  <option value="">Select a type...</option>
                  <option value="portrait">Custom Portrait</option>
                  <option value="original">Original Artwork</option>
                  <option value="digital">Digital Art</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-brand-darkest mb-2">
                  Project Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-brand-light rounded-lg focus:border-brand-medium focus:outline-none bg-white resize-none"
                  placeholder="Tell us about your vision, style preferences, size requirements, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget" className="block text-sm font-semibold text-brand-darkest mb-2">
                    Budget Range
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-brand-light rounded-lg focus:border-brand-medium focus:outline-none bg-white"
                  >
                    <option value="">Select range...</option>
                    <option value="under-500">Under $500</option>
                    <option value="500-1000">$500 - $1,000</option>
                    <option value="1000-2500">$1,000 - $2,500</option>
                    <option value="2500-5000">$2,500 - $5,000</option>
                    <option value="5000+">$5,000+</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="timeline" className="block text-sm font-semibold text-brand-darkest mb-2">
                    Timeline
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-brand-light rounded-lg focus:border-brand-medium focus:outline-none bg-white"
                  >
                    <option value="">Select timeline...</option>
                    <option value="asap">ASAP</option>
                    <option value="1-month">Within 1 month</option>
                    <option value="2-3-months">2-3 months</option>
                    <option value="3-6-months">3-6 months</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-dark text-white py-4 rounded-lg font-semibold hover:bg-brand-darkest transition-all shadow-lg hover:shadow-xl"
              >
                Submit Commission Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

