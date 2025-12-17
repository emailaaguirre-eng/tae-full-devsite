"use client";

export default function ComingSoon() {
  return (
    <section className="py-20" style={{ backgroundColor: '#ecece9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6 font-playfair">
              We&apos;re Building Something Special!
            </h2>
            <p className="text-lg md:text-xl text-brand-darkest leading-relaxed mb-6">
              Welcome to our site. We are currently working hard to finalize our full experience, launching officially in January 2026.
            </p>
            <p className="text-base text-brand-dark leading-relaxed mb-8">
              In the meantime, feel free to look around! To stay in the loop, join our email list for updates on our launch. (Don&apos;t worry, we promise to keep your inbox spam-free).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="#contact"
                className="bg-brand-medium text-white px-8 py-4 rounded-full font-semibold hover:bg-brand-dark transition-all shadow-lg"
              >
                Sign up for updates
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

