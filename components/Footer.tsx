export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-brand-dark via-brand-darkest to-brand-dark text-white py-12 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-medium to-transparent"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 font-playfair">The Artful Experience</h3>
            <p className="text-brand-lightest">
              Where fine art, prints & images meet your personal expression.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#home"
                  className="text-brand-lightest hover:text-brand-light transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-brand-lightest hover:text-brand-light transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="text-brand-lightest hover:text-brand-light transition-colors"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-brand-lightest hover:text-brand-light transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-brand-lightest">
              <li>📧 info@theartfulexperience.com</li>
              <li>🌐 theartfulexperience.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-medium pt-8 text-center text-brand-lightest">
          <p className="font-playfair">&copy; {new Date().getFullYear()} The Artful Experience. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

