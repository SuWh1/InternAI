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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Who Is This For?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whether you're just starting out or looking to level up, we've got you covered
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                <audience.icon className="h-6 w-6 text-purple-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {audience.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
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