"use client";

import Image from "next/image";
import { mediaUrl } from "@/lib/media";
import { useSiteMedia } from "@/hooks/useSiteMedia";

const TESTIMONIAL_DATA = [
  { name: "Deanna Lankin", location: "Testimonial details coming soon", mediaKey: "testimonials.8", defaultImage: "https://theartfulexperience.com/wp-content/uploads/2025/12/bctestimonial.png", text: "Final approved testimonial copy for Deanna Lankin is pending and will be added in this same format." },
  { name: "Katelyn", location: "Testimonial details coming soon", mediaKey: "testimonials.9", defaultImage: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/river-1.jpg", text: "Final approved testimonial copy for Katelyn is pending and will be added in this same format." },
  { name: "Bryant Colman", location: "Founder - The Artful Experience | Entrepreneur | Global Explorer | Innovator", mediaKey: "testimonials.7", defaultImage: "https://theartfulexperience.com/wp-content/uploads/2025/12/bctestimonial.png", text: "For twenty years I\u2019ve sent holiday cards to stay connected with family, friends, and clients. This year I reimagined the tradition through The Artful Experience, sharing an interactive experience with a personal video, favorite discoveries from the year, and a guestbook for friends to reconnect. What began as a holiday greeting became a living, shared experience." },
  { name: "River", location: "Coach & Founder, Madinah\u2019s Living Farmacy", mediaKey: "testimonials.1", defaultImage: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/river-1.jpg", text: "As a coach, I love how TheAE reinforces the power of imagery, affirmations, and interactive reflection. It transforms a single moment into a living reminder of the mindset where anything is possible. I would recommend theAE platform to any coach at any level." },
  { name: "Grant", location: "Russ Lyon's Sotheby's International", mediaKey: "testimonials.3", defaultImage: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/IMG_0814.jpeg", text: "I wanted memorable gifts for my real estate clients. The art was amazing and the ArtKeys\u2122 let me deliver time-released messages and e-gift cards\u2014perfect for VIPs. The customization options and the ability to add personalized content made each gift truly special." },
  { name: "Mary", location: "Family Keepsake", mediaKey: "testimonials.6", defaultImage: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/9A91E9CB-3917-4204-9C30-B36EAC1BD4E2.jpeg", text: "I wanted to preserve a special moment with my daughter. I uploaded a photo to TheAE and described the feeling I hoped to capture. The artwork exceeded my expectations and now symbolizes a moment I will cherish forever." },
  { name: "Morgan", location: "Travel Influencer", mediaKey: "testimonials.2", defaultImage: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/3125EEFB-C70A-4CF7-8DB3-1F4DB841E4B9-scaled.jpeg", text: "Rio de Janeiro holds a special place in my heart. I uploaded my photo from Ipanema Beach to TheAE, where it was artfully enhanced by Deanna Lankin. Now I can relive that moment anytime, and the ArtKey\u2122 interactivity, music, artwork, and inspiration brings the image to life." },
  { name: "Dr. Shyla", location: "", mediaKey: "testimonials.4", defaultImage: "https://theartfulexperience.com/wp-content/uploads/2025/12/IMG_7692-1-scaled.jpeg", text: "I wanted something more meaningful than a traditional holiday card for my patients. With The Artful Experience, I was able to share beautiful imagery along with videos, personalized plans, and inspiration. The response was incredible. I highly recommend TheAE for holiday cards and special announcements." },
  { name: "Connie", location: "Broker at Harcourts The Garner Group Real Estate | Bend, Oregon", mediaKey: "testimonials.5", defaultImage: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/photocuhtgg.png", text: "The Artful Experience turns a simple image into a meaningful gift designed specifically for your client. The process is seamless, but the result is thoughtful, creative, and unforgettable. The Spotify playlist is the perfect finishing touch." },
];

function TestimonialImage({ mediaKey, defaultImage, alt }: { mediaKey: string; defaultImage: string; alt: string }) {
  const src = useSiteMedia(mediaKey, mediaUrl(defaultImage));
  return <Image src={src} alt={alt} fill className="object-cover object-top" />;
}

export default function Testimonials() {
  const testimonials = TESTIMONIAL_DATA.map((t) => ({
    ...t,
    image: t.defaultImage,
  }));

  return (
    <section id="testimonials" className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            How Our Friends & Clients Use the ArtKey™
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            Real stories from people who have experienced the magic of The Artful Experience
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl shadow-lg overflow-visible hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-4 relative z-0 flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded-t-2xl">
                <TestimonialImage
                  mediaKey={TESTIMONIAL_DATA[index].mediaKey}
                  defaultImage={TESTIMONIAL_DATA[index].defaultImage}
                  alt={testimonial.name}
                />
              </div>
              
              {/* Content - expands on hover */}
              <div className="p-6 transition-all duration-500 group-hover:p-8 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-brand-darkest mb-1 group-hover:text-2xl transition-all duration-500">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-brand-dark group-hover:text-base transition-all duration-500">
                    {testimonial.location}
                  </p>
                </div>
                
                <div className="flex gap-1 mb-4 group-hover:mb-6 transition-all duration-500">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg group-hover:text-xl transition-all duration-500">★</span>
                  ))}
                </div>
                
                <p className="text-brand-darkest leading-relaxed italic text-sm group-hover:text-base group-hover:leading-loose transition-all duration-500 flex-1">
                  &quot;{testimonial.text}&quot;
                </p>
              </div>
              
              {/* Hover overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-darkest/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


