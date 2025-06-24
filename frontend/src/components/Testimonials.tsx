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
    <section className="py-20 bg-theme-primary transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-35 lg:px-35">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            Success Stories
          </h2>
          <p className="text-xl text-theme-secondary transition-colors duration-300">
            Join thousands of students who've landed their dream internships
          </p>
        </div>

        <div className="relative bg-theme-secondary rounded-2xl p-8 lg:p-12 border border-theme transition-colors duration-300">
          <div className="flex items-center justify-center mb-6">
            {[...Array(currentTestimonial.rating)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
          </div>

          <blockquote className="text-xl text-theme-secondary text-center mb-8 leading-relaxed transition-colors duration-300">
            "{currentTestimonial.content}"
          </blockquote>

          <div className="text-center">
            <div className="bg-theme-accent text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-semibold">
              {currentTestimonial.avatar}
            </div>
            <div className="font-semibold text-theme-primary transition-colors duration-300">{currentTestimonial.name}</div>
            <div className="text-theme-secondary transition-colors duration-300">{currentTestimonial.role}</div>
            <div className="text-theme-accent font-medium mt-1">{currentTestimonial.company}</div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center mt-8 space-x-4">
            <button
              onClick={prevTestimonial}
              className="bg-theme-primary border border-theme rounded-full p-2 hover:bg-theme-hover transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5 text-theme-secondary transition-colors duration-300" />
            </button>
            
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-theme-accent' : 'bg-theme-secondary/50'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextTestimonial}
              className="bg-theme-primary border border-theme rounded-full p-2 hover:bg-theme-hover transition-all duration-300"
            >
              <ChevronRight className="h-5 w-5 text-theme-secondary transition-colors duration-300" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;