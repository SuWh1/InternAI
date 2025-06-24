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
    <section className="py-20 bg-theme-secondary transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            How It Works
          </h2>
          <p className="text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">
            From zero to internship-ready in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group bg-theme-primary p-6 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300 border border-theme">
              <div className="bg-theme-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-theme-accent/20 transition-all duration-300">
                <step.icon className="h-8 w-8 text-theme-accent" />
              </div>

              <h3 className="text-xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
                {step.title}
              </h3>

              <p className="text-theme-secondary leading-relaxed transition-colors duration-300">
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
