import { MapPin, Calendar, CheckCircle } from 'lucide-react';

const MyRoadmapPage = () => {
  return (
    <div className="min-h-screen pt-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <MapPin className="h-16 w-16 text-blue-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            My Career Roadmap
          </h1>
          <p className="text-xl text-gray-600">
            Your personalized journey to landing your dream internship
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Coming Soon...
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We're building your personalized AI-powered career roadmap. This dashboard will show your progress, 
              next steps, and tailored recommendations to help you achieve your career goals.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">Monitor your advancement through each milestone</p>
              </div>
              
              <div className="text-center p-6">
                <MapPin className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Steps</h3>
                <p className="text-gray-600 text-sm">AI-curated action items based on your goals</p>
              </div>
              
              <div className="text-center p-6">
                <Calendar className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline Management</h3>
                <p className="text-gray-600 text-sm">Stay on track with intelligent scheduling</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRoadmapPage; 