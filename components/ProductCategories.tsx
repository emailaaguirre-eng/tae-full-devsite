export default function ProductCategories() {
  const categories = [
    {
      title: "Upload Your Image",
      description: "Transform your own photo into a personalized art print or card with embedded media.",
      image: "📤",
      items: [
        "Choose size: art prints, postcards, book covers",
        "Paper, canvas, or framed options",
        "Layer video, music, e-gift certificates",
        "Time-released messages via ArtKey"
      ],
      color: "from-brand-light to-brand-medium"
    },
    {
      title: "Select From Our Library",
      description: "Curated art and photography—ready to personalize for any occasion.",
      image: "🖼️",
      items: [
        "Artist narratives and inspiration included",
        "Option to add your own media to the piece",
        "Discreet ArtKey/QR for your story",
        "Ready-to-gift prints and paintings"
      ],
      color: "from-brand-light to-brand-medium"
    },
    {
      title: "Cards, Announcements & Invites",
      description: "Perfect for postcards, holidays, thank yous, invitations, announcements, weddings, baby and graduation milestones, client follow-ups, and more.",
      image: "🎁",
      items: [
        "Holiday, birthday, thank you, sympathy, seasonal cards",
        "Birth, engagement, wedding, graduation announcements",
        "Invitations: parties, showers, retirements, open houses",
        "Client welcome/thank-you, just listed/just sold postcards"
      ],
      color: "from-brand-medium to-brand-dark"
    },
  ];

  return (
    <section id="products" className="py-20" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            Purchase Options
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            Start with your own image or choose from our library, then layer music, video, or messages with the ArtKey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden group cursor-pointer"
            >
              <div className={`bg-gradient-to-br ${category.color} p-8 text-center`}>
                <div className="text-6xl mb-4">{category.image}</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {category.title}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-brand-darkest mb-4">
                  {category.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {category.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-brand-darkest flex items-center gap-2">
                      <span className="text-brand-medium">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-brand-medium text-white py-3 rounded-full font-semibold hover:bg-brand-dark transition-colors">
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-block bg-white p-8 rounded-2xl shadow-lg">
            <p className="text-brand-darkest text-lg mb-4">
              Ready to begin? Upload your image or browse the gallery to start crafting your living artwork.
            </p>
            <button className="bg-brand-dark text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-darkest transition-colors">
              Start Creating
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

