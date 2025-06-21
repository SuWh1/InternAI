import { CheckCircle, MapPin, TrendingUp } from 'lucide-react';

const RoadmapInfoPage = () => {
  return (
    <div className="min-h-screen pt-16 bg-slate-50 animate-slide-up-lg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <MapPin className="h-16 w-16 text-blue-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Career Roadmap
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get a personalized, step-by-step plan to land your dream internship with AI-guided recommendations.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">How Our Roadmap Works</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Personalized Assessment</h3>
                <p className="text-gray-600">
                  Our AI analyzes your current skills, experience, and career goals to create a tailored roadmap just for you.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <TrendingUp className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Step-by-Step Guidance</h3>
                <p className="text-gray-600">
                  Receive actionable steps including skill development, project recommendations, and networking strategies.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600">
                  Monitor your advancement and get AI-powered adjustments to keep you on the fastest path to success.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">Ready to Start Your Journey?</h3>
            <p className="text-blue-100 mb-6">
              Join thousands of students who have successfully landed internships with our AI-powered roadmap.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200">
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapInfoPage; 