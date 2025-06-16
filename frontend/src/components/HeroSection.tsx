import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-slide-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            🎯 Want to Get Into{' '}
            <span className="text-blue-600">Google STEP</span>?{' '}
            <br className="hidden sm:block" />
            Let AI Build Your Roadmap.
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Stop wondering what to learn next. Get a personalized, AI-generated roadmap 
            that turns your internship dreams into achievable weekly goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/onboarding"
              className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Get Your Free Roadmap
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <p className="text-sm text-gray-500">
              📊 Join 2,000+ students already using InternAI
            </p>
          </div>

          {/* Demo Image Placeholder */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl h-64 sm:h-80 flex items-center justify-center">
              <div className="text-center">
                <Target className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <p className="text-blue-700 font-medium">Interactive Roadmap Preview</p>
                <p className="text-sm text-gray-600 mt-2">Personalized learning path visualization</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;