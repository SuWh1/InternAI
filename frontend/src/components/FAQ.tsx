import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "How does the AI create my personalized roadmap?",
    answer: "Our AI analyzes your current skills, target internship, available study time, and learning preferences to create a custom roadmap. It considers factors like your academic year, prior experience, and specific company requirements to generate weekly goals and project recommendations."
  },
  {
    question: "Is InternAI really free?",
    answer: "Yes! Creating your personalized roadmap is completely free. We also offer optional premium features like resume reviews and 1-on-1 mentoring sessions for students who want extra support."
  },
  {
    question: "How long does it take to complete a roadmap?",
    answer: "Roadmaps typically range from 3-6 months depending on your starting point and target internship. The AI creates realistic timelines based on your available study hours per week and current skill level."
  },
  {
    question: "What companies does InternAI prepare me for?",
    answer: "We support roadmaps for major tech companies including Google (STEP), Microsoft (Explore), Amazon, Facebook, Apple, Netflix, and many more. The AI tailors the preparation based on each company's specific requirements and interview processes."
  },
  {
    question: "Can I update my roadmap if my goals change?",
    answer: "Absolutely! Your roadmap is dynamic and can be updated anytime. If you decide to target a different company or your availability changes, just let us know and we'll regenerate your plan accordingly."
  },
  {
    question: "Do I need programming experience to start?",
    answer: "Not at all! Our AI creates roadmaps for complete beginners through advanced students. If you're just starting out, your roadmap will include foundational programming concepts before moving to more advanced topics."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-theme-secondary transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-theme-secondary transition-colors duration-300">
            Everything you need to know about InternAI
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-theme-primary rounded-xl border border-theme overflow-hidden transition-colors duration-300">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-theme-hover transition-all duration-300"
              >
                <span className="font-semibold text-theme-primary transition-colors duration-300">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-theme-secondary/50 flex-shrink-0 transition-colors duration-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-theme-secondary/50 flex-shrink-0 transition-colors duration-300" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-theme-secondary leading-relaxed transition-colors duration-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;