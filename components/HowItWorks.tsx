import Image from "next/image";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20" style={{ backgroundColor: '#ecece9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            How It Works
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            Create personalized art with embedded memories in just a few simple steps
          </p>
        </div>

        {/* Step 1 - Two Options Side by Side */}
        <div className="mb-16">
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {/* Option 1: Upload Your Image */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <Image
                  src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/uploadyourimage.png"
                  alt="Design Editor - Upload Your Image"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h4 className="text-xl font-bold text-brand-darkest mb-2">
                  Upload Your Image
                </h4>
                <p className="text-brand-darkest">
                  Personalize your art with a message. Upload your own photo and transform it into a beautiful piece of art using our Design Editor.
                </p>
              </div>
            </div>

            {/* OR Divider - Centered */}
            <div className="flex items-center justify-center">
              <div className="bg-brand-medium text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl shadow-lg">
                OR
              </div>
            </div>

            {/* Option 2: Choose from Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <Image
                  src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/buyanexistingprint.jpg"
                  alt="Choose art from gallery"
                  fill
                  className="object-cover"
                  style={{ top: 0 }}
                />
              </div>
              <div className="p-6">
                <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h4 className="text-xl font-bold text-brand-darkest mb-2">
                  Choose Art from Our Online Gallery
                </h4>
                <p className="text-brand-darkest">
                  Explore our unique art collection. Select from curated pieces by internationally recognized artists.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps 2-4 */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 2 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              <Image
                src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/uploadmedia.png"
                alt="Upload your media"
                fill
                className="object-cover"
                style={{ top: 0 }}
              />
            </div>
            <div className="p-6">
              <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h4 className="text-xl font-bold text-brand-darkest mb-2">
                Upload Your Media
              </h4>
              <p className="text-brand-darkest">
                Images, videos, music, e-gift card, or a time-released message. Add all the personal touches that make your gift unique.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              <Image
                src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/legacy-3.jpeg"
                alt="Send the gift"
                fill
                className="object-cover"
                style={{ top: 0 }}
              />
            </div>
            <div className="p-6">
              <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h4 className="text-xl font-bold text-brand-darkest mb-2">
                Send the Gift
              </h4>
              <p className="text-brand-darkest">
                We&apos;ll carefully package and ship your personalized art. Your gift will arrive ready to be displayed and enjoyed.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              <Image
                src="https://dredev.theartfulexperience.com/wp-content/uploads/2025/06/couch.jpg"
                alt="Find the perfect place"
                fill
                className="object-cover"
                style={{ top: 0 }}
              />
            </div>
            <div className="p-6">
              <div className="inline-block bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h4 className="text-xl font-bold text-brand-darkest mb-2">
                Interact with the ArtKey™
              </h4>
              <p className="text-brand-darkest">
                Find the perfect place for your art, then bring it to life with the ArtKey™. Hold. Connect. Experience. Place your phone near the signature and hold it for a moment. Your personalized content opens, and your experience comes to life.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="/shop"
            className="inline-block bg-brand-medium text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-brand-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Upload your image to get started
          </a>
        </div>
      </div>
    </section>
  );
}
