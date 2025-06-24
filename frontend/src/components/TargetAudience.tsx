import { GraduationCap, Code, Users } from 'lucide-react';

const audiences = [
  {
    icon: GraduationCap,
    title: "First-Year Students",
    description: "Just starting your CS journey? Perfect! We'll help you build foundational skills and create a timeline that works with your coursework."
  },
  {
    icon: Code,
    title: "Second-Year Students",
    description: "Ready to level up? Get advanced project ideas, interview prep strategies, and networking tips to stand out from the crowd."
  },
  {
    icon: Users,
    title: "Career Switchers",
    description: "Transitioning to tech? Our roadmaps account for your existing skills and fast-track you to internship readiness."
  }
];

const TargetAudience = () => {
  return (
    <section className="py-20 bg-theme-primary transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            Who Is This For?
          </h2>
          <p className="text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">
            Whether you're just starting out or looking to level up, we've got you covered
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <div key={index} className="bg-theme-secondary p-6 rounded-xl shadow-sm border border-theme hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center">
              <div className="bg-purple-500/10 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                <audience.icon className="h-6 w-6 text-purple-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
                {audience.title}
              </h3>
              
              <p className="text-theme-secondary leading-relaxed transition-colors duration-300">
                {audience.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetAudience;