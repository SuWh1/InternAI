import { Briefcase, Heart, TrendingUp } from 'lucide-react';

const MyInternshipsPage = () => {
  return (
    <div className="min-h-screen pt-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Briefcase className="h-16 w-16 text-purple-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            My Internships
          </h1>
          <p className="text-xl text-gray-600">
            Track applications, manage opportunities, and discover new matches
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Briefcase className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Coming soon...
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Your personalized internship dashboard is in development. Track your applications, 
              discover AI-matched opportunities, and manage your entire internship search process in one place.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Tracking</h3>
                <p className="text-gray-600 text-sm">Monitor status of all your applications</p>
              </div>
              
              <div className="text-center p-6">
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved Opportunities</h3>
                <p className="text-gray-600 text-sm">Keep track of interesting positions</p>
              </div>
              
              <div className="text-center p-6">
                <Briefcase className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Matches</h3>
                <p className="text-gray-600 text-sm">Discover personalized recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyInternshipsPage; 