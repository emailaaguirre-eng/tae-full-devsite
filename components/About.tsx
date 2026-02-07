export default function About() {
  return (
    <section id="about" className="py-20 bg-brand-lightest">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            About Us
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-brand-darkest mb-6">
              Who We Are
            </h3>
            <p className="text-lg text-brand-darkest mb-4 leading-relaxed">
              At The Artful Experience, we are committed to delivering exceptional results through
              innovation, expertise, and dedication. Our team of professionals
              brings years of experience to every project.
            </p>
            <p className="text-lg text-brand-darkest mb-4 leading-relaxed">
              We believe in building lasting relationships with our clients by
              consistently exceeding expectations and providing solutions that
              drive real results.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl font-bold text-brand-medium mb-2">10+</div>
              <div className="text-brand-darkest font-semibold">Years Experience</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl font-bold text-brand-medium mb-2">500+</div>
              <div className="text-brand-darkest font-semibold">Projects Completed</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl font-bold text-brand-medium mb-2">100+</div>
              <div className="text-brand-darkest font-semibold">Happy Clients</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl font-bold text-brand-medium mb-2">24/7</div>
              <div className="text-brand-darkest font-semibold">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

