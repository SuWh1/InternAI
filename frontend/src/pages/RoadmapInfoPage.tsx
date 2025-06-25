import { CheckCircle, MapPin, TrendingUp } from 'lucide-react';
import AnimatedSection from '../components/common/AnimatedSection';

const RoadmapInfoPage = () => {
  return (
    <div className="min-h-screen pt-16 bg-theme-primary transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatedSection className="text-center mb-12">
          <MapPin className="h-16 w-16 text-theme-accent mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            AI-Powered Career Roadmap
          </h1>
          <p className="text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">
            Get a personalized, step-by-step plan to land your dream internship with AI-guided recommendations.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={2} className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-8 mb-8 transition-colors duration-300">
          <h2 className="text-2xl font-semibold text-theme-primary mb-6 transition-colors duration-300">How Our Roadmap Works</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">Personalized Assessment</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  Our AI analyzes your current skills, experience, and career goals to create a tailored roadmap just for you.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <TrendingUp className="h-6 w-6 text-theme-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">Step-by-Step Guidance</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  Receive actionable steps including skill development, project recommendations, and networking strategies.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-theme-primary mb-2 transition-colors duration-300">Progress Tracking</h3>
                <p className="text-theme-secondary transition-colors duration-300">
                  Monitor your advancement and get AI-powered adjustments to keep you on the fastest path to success.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={4} className="text-center">
          <div className="bg-gradient-to-r from-theme-accent to-purple-600 text-white rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">Ready to Start Your Journey?</h3>
            <p className="text-blue-100 mb-6">
              Join thousands of students who have successfully landed internships with our AI-powered roadmap.
            </p>
            <button className="bg-white text-theme-accent px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200">
              Get Started Today
            </button>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default RoadmapInfoPage; 