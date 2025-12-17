export default function AboutUs() {
  // Stream hero video from WordPress media library
  const aboutVideoUrl =
    "https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/Hero-PROMO-VIDEO.mp4";
  const aboutFeatureImage =
    "https://dredev.theartfulexperience.com/wp-content/uploads/2025/10/collage.png";

  return (
    <section id="about" className="bg-white">
      {/* Hero video area */}
      <div className="relative w-full overflow-hidden">
        <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] lg:aspect-[16/7]">
          <video
            src={aboutVideoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* About Us heading */}
      <div className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4 font-playfair">
              About Us
            </h2>
            <div className="w-24 h-1 bg-brand-medium mx-auto"></div>
          </div>
        </div>
      </div>

      {/* About + feature image */}
      <div className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
              <img
                src={aboutFeatureImage}
                alt="Gallery interior with featured artwork"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="bg-brand-lightest rounded-2xl p-8 md:p-10 shadow-lg space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-darkest font-playfair">The Artful Experience</h2>
              <p className="text-lg text-brand-darkest leading-relaxed">
                Welcome to The Artful Experience Gallery and Upload Center—where soul-stirring art and images become a living portal.
                Give a gift that will never be forgotten, even if that gift is for you.
              </p>
              <p className="text-lg text-brand-darkest leading-relaxed">
                Discover our ArtKey technology that lets you upload videos, music, and time-released e-gift cards embedded in the art.
                When the recipient scans the ArtKey or QR code, they unlock your message, video, song, or surprise.
              </p>
              <p className="text-lg text-brand-darkest leading-relaxed">
                Choose your path: upload your own image and personalize it, or select art from our gallery of internationally recognized artists.
                Every option supports layered media so your story travels with the piece.
              </p>
            </div>
          </div>

          {/* What Are Art Keys */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 space-y-4">
            <h3 className="text-3xl font-bold text-brand-darkest font-playfair">What Are Art Keys?</h3>
            <p className="text-lg text-brand-darkest leading-relaxed">
              Each painting or print is embedded with an Art Key—a discreet digital touchpoint that unlocks a personalized experience.
              By simply scanning near the artist’s signature, the artwork opens a hidden world of music, messages, videos, and exclusive surprises.
            </p>
            <p className="text-lg text-brand-darkest leading-relaxed">
              When you purchase our art or images as a gift, we give you control through our “upload center” to sync your desired content.
            </p>
            <p className="text-lg text-brand-darkest leading-relaxed">
              Recipients can then discover voice notes, heartfelt messages, behind-the-scenes stories, or even special videos from the artist or brand.
              Some Art Keys are time-released, revealing their contents only on meaningful dates like birthdays, anniversaries, or other milestones.
              Others unfold as living experiences—sharing evolving playlists, recipes, stories, or reflections over time.
            </p>
            <p className="text-lg text-brand-darkest leading-relaxed">
              Art Keys transform a piece of art from something you admire into something that connects, surprises, and evolves. You get to decide!
            </p>
            <div>
              <h4 className="text-2xl font-bold text-brand-darkest font-playfair mb-2">Who this is for?</h4>
              <ul className="list-disc list-inside text-brand-darkest space-y-1">
                <li>Gift givers who want to leave a lasting impression</li>
                <li>Art collectors who want the artist’s narrative</li>
                <li>AirBnb owners who want to bring their art and images to life</li>
                <li>Artists and photographers who want to share their narrative</li>
              </ul>
            </div>
            <p className="text-lg text-brand-darkest leading-relaxed">
              Whether it’s a framed piece, a postcard, or a one-of-a-kind commission, The Artful Experience invites people into a deeper kind of exchange—one that lives long after the moment passes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

