import Image from "next/image";

export default function GiftIdeas() {
  const giftIdeas = [
    {
      id: 1,
      title: "For Your Friend or Partner",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/09/uploadyourprint.png",
      description: "Upload a memorable image that will be transformed into a beautiful piece of art. You will also be able to upload personal content using our upload center, where you can load your favorite song, video clips, or e-gift card. When the giftee scans the discreetly placed ArtKey, they will access the media you personalized for them. A gift like no other that is personalized to the recipient!",
    },
    {
      id: 2,
      title: "As a Wedding or Anniversary Gift",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/forweddings.jpeg",
      description: "Upload one of your wedding photos or commission a painting from one of our artists to turn into a breathtaking canvas or paper print. Similar to our other options, you can upload videos, songs, or messages of well wishes, fun stories and words of encouragement from your guests that will be memorialized forever. This is more than a gift, it is a timeless treasure in the making.",
    },
    {
      id: 3,
      title: "For a Special Client or Customer",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/specialcustomer.png",
      description: "A perfect gift to create connection with your best clients and customers. Upload exclusive messages and videos conveying your appreciation for the partnership. Perfect for: Real estate professionals, Airbnb hosts for their guests, Finance executives building meaningful rapport, Hotel and restaurant operators, Or anyone who wants to leave a lasting impression on a valued client.",
    },
    {
      id: 4,
      title: "For a Legacy",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/tae_legacy.png",
      description: "In times of celebration of life, offer a gift filled with love and encouragement. A landscape print or commissioned portrait layered with tribute—photos, letters, and voice notes that carry forward the essence of someone beloved. You can also include time-released messages to give the recipient something to look forward to such as words of encouragement, a favorite memory or simply a beautiful song that reminds you of them. The artwork becomes a sacred portal of connection and grace—something to revisit, again and again.",
    },
    {
      id: 5,
      title: "Off to School Print",
      image: "https://dredev.theartfulexperience.com/wp-content/uploads/2025/12/offtocollege.png",
      description: "Upload a cherished photo, and we'll transform it into heartfelt wall-art your campus bound kiddo can take with them as they begin their journey. Your print will have a scannable QR code that unlocks your messages of love and encouragement, video notes, photo memories, even gift cards for meals and groceries. A beautiful keepsake and a lasting tie to home.",
    },
  ];

  return (
    <section id="gift-ideas" className="py-20" style={{ backgroundColor: '#ecece9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            Gift Ideas
          </h2>
          <p className="text-lg text-brand-darkest max-w-2xl mx-auto">
            Our art and images feature a discreetly located ArtKey or QR code that you can customize. Our images get to tell a personalized story!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {giftIdeas.map((idea) => (
            <div key={idea.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative">
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-white border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-700 font-semibold text-sm whitespace-nowrap">
                    {idea.title}
                  </div>
                </div>
                <div className="aspect-[4/3] bg-gray-100 relative">
                  <Image
                    src={idea.image}
                    alt={idea.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="p-6">
                <p className="text-brand-darkest leading-relaxed">
                  {idea.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

