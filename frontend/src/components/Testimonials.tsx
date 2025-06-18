import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useState } from 'react';

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Sophomore at UC Berkeley",
    company: "Landed Google STEP 2024",
    content: "InternAI's roadmap was a game-changer. The weekly breakdown made everything manageable, and I never felt overwhelmed. The AI knew exactly what skills I needed to focus on.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Marcus Rodriguez",
    role: "First-year at MIT",
    company: "Microsoft Explore Intern",
    content: "I was completely lost on where to start. InternAI gave me a clear path from beginner to interview-ready. The project suggestions were spot-on for my skill level.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Emily Wang",
    role: "Career Switcher",
    company: "Amazon SDE Intern",
    content: "As someone switching from finance to tech, I needed a fast-track plan. InternAI's personalized approach helped me land an internship in just 6 months.",
    rating: 5,
    avatar: "EW"
  }
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-35 lg:px-35">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands of students who've landed their dream internships
          </p>
        </div>

        <div className="relative bg-gray-50 rounded-2xl p-8 lg:p-12">
          <div className="flex items-center justify-center mb-6">
            {[...Array(currentTestimonial.rating)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
          </div>

          <blockquote className="text-xl text-gray-700 text-center mb-8 leading-relaxed">
            "{currentTestimonial.content}"
          </blockquote>

          <div className="text-center">
            <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-semibold">
              {currentTestimonial.avatar}
            </div>
            <div className="font-semibold text-gray-900">{currentTestimonial.name}</div>
            <div className="text-gray-600">{currentTestimonial.role}</div>
            <div className="text-blue-600 font-medium mt-1">{currentTestimonial.company}</div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center mt-8 space-x-4">
            <button
              onClick={prevTestimonial}
              className="bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 transition-all duration-200"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextTestimonial}
              className="bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 transition-all duration-200"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;