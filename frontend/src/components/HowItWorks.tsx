import { MessageSquare, BookOpen, RocketIcon } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Tell Us About You",
    description:
      "Answer a few questions about your background, goals, and learning preferences in our friendly onboarding form.",
  },
  {
    icon: BookOpen,
    title: "AI Creates Your Plan",
    description:
      "Our AI analyzes your profile and generates a personalized roadmap with weekly goals, projects, and resources.",
  },
  {
    icon: RocketIcon,
    title: "Follow & Succeed",
    description:
      "Track your progress, complete tasks, and land that dream internship with confidence and preparation.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-35 lg:px-35">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From zero to internship-ready in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group bg-white p-6 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <step.icon className="h-8 w-8 text-blue-600" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {step.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
