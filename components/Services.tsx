export default function Services() {
  const services = [
    {
      title: "Consulting",
      description: "Expert guidance and strategic planning to help your business thrive in a competitive landscape.",
      icon: "💼",
    },
    {
      title: "Development",
      description: "Custom solutions built with cutting-edge technology to meet your unique requirements.",
      icon: "⚙️",
    },
    {
      title: "Design",
      description: "Beautiful, user-centered designs that create memorable experiences and drive engagement.",
      icon: "🎨",
    },
    {
      title: "Analytics",
      description: "Data-driven insights to help you make informed decisions and optimize performance.",
      icon: "📊",
    },
    {
      title: "Support",
      description: "Dedicated 24/7 support to ensure your operations run smoothly without interruption.",
      icon: "🛟",
    },
    {
      title: "Training",
      description: "Comprehensive training programs to empower your team with the skills they need.",
      icon: "📚",
    },
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            Our Services
          </h2>
          <div className="w-24 h-1 bg-brand-medium mx-auto mb-4"></div>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            We offer a comprehensive range of services designed to help your business succeed
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-brand-lightest p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-transparent hover:border-brand-medium"
            >
              <div className="text-5xl mb-4">{service.icon}</div>
              <h3 className="text-2xl font-bold text-brand-dark mb-3">
                {service.title}
              </h3>
              <p className="text-brand-darkest leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

