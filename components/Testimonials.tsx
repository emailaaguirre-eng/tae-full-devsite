"use client";

import Image from "next/image";

export default function Testimonials() {
  const testimonials = [
    {
      name: "River",
      location: "River Madinah of Madinah's Living Farmacy",
      text: "There was an image of me where I felt totally empowered, strong and playful. I uploaded this image to TheAE website along with my intentions for the new year, goals and inspirations. What I received was totally what I had asked for and more. I use this imagery to remind myself of that special moment and that when I am in that \"state\", nothing is impossible. I am also able to use TheAE platform to upload my \"power jams\", favorite quotes and inspirational thoughts. It is more than artwork, it is living breathing imagery I will use forever.",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/river-1.jpg"
    },
    {
      name: "Morgan",
      location: "Rio de Janeiro",
      text: "Rio de Janeiro has a special place in my heart. When I visited Ipanema Beach in Rio, it captivated me and made me feel alive. I wanted to memorialize this special moment, so I uploaded my picture to TheAE. My image was artfully enhanced by world-renowned artist Deanna Lankin, and now I can relive that memory every time I see it. I also enjoyed the interactivity of the ArtKey™, being able to preview Deanna's other works, suggested playlist and other fun things like the meditative ideas and images. It's an image that has been captured for a lifetime.",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/3125EEFB-C70A-4CF7-8DB3-1F4DB841E4B9-scaled.jpeg"
    },
    {
      name: "Grant A",
      location: "Russ Lyon's Sotheby's International",
      text: "I wanted memorable gifts for my real estate clients. The art was amazing and the ArtKeys™ let me deliver time-released messages and e-gift cards—perfect for VIPs. The customization options and the ability to add personalized content made each gift truly special.",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/IMG_0814.jpeg"
    },
    {
      name: "Connie Upham",
      location: "Broker at Harcourts The Garner Group Real Estate, Bend, Oregon",
      text: "The Artful Experience transforms a simple image into a gift that feels truly meaningful and made especially for your client. The ordering process is simple and seamless, yet delivers remarkable impact - thoughtful, creative, entirely unique, and sure to leave a lasting impression. The accompanying Spotify playlist is the perfect finishing touch.",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/photocuhtgg.png"
    },
    {
      name: "Mary H",
      location: "Family Keepsake",
      text: "I wanted to capture a special moment of time with my daughter. I found the perfect picture of us on my iPhone, uploaded the image to TheAE site, and described the feeling that I was after. When I received the art in the mail, it was better than I had imagined. I now have something that symbolizes that special moment of time with my daughter that I will cherish forever.",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/9A91E9CB-3917-4204-9C30-B36EAC1BD4E2.jpeg"
    },
    {
      name: "Dr. Shyla",
      location: "",
      text: "I wanted to send a special holiday card to my patients, but instead of a traditional card, I chose to share beautiful imagery that truly reflected my vision. I was thrilled to discover that I could also upload videos, personalized patient plans, and inspirational testimonials. What I didn't expect was just how impactful it would be. The response from my patients was incredible—meaningful, memorable, and genuinely useful. If you want to create a lasting impression, I highly recommend ordering your holiday cards, birthday greetings, or special-occasion announcements through The Artful Experience.",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/IMG_7692-scaled.jpeg"
    },
    {
      name: "Bryant Colman",
      location: "Founder - The Artful Experience",
      text: "For the past twenty years, I have sent holiday cards as a way to stay connected with family, friends, and clients. Each year, I reflect on the moments that mattered most—sharing inspirational images, personal reflections, and a message of encouragement for the year ahead. This year, I used our platform to reimagine that tradition. Instead of a static card, I sent an interactive experience that included a personal video message, favorite destinations, hotels, restaurants, and artists I discovered throughout the year. I also included a guestbook, allowing old friends and new connections to leave messages and reconnect in meaningful ways. What began as a holiday greeting became a living, shared experience and a reminder of why The Artful Experience exists.",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/bctestimonialimage.png"
    },
  ];

  return (
    <section id="testimonials" className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            What our Clients & Friends Say
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            Real stories from people who have experienced the magic of The Artful Experience
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl shadow-lg overflow-visible hover:shadow-2xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-4 relative z-0 flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded-t-2xl">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  fill
                  className="object-contain transition-transform duration-500 group-hover:scale-110"
                  style={{ objectPosition: 'center' }}
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
