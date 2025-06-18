import { Briefcase, Search, Target } from 'lucide-react';

const InternshipsInfoPage = () => {
  return (
    <div className="min-h-screen pt-16 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Briefcase className="h-16 w-16 text-purple-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Internship Matching
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover internship opportunities that perfectly match your skills, interests, and career goals with AI-powered recommendations.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">How We Help You Find the Perfect Internship</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Search className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Smart Search & Filtering</h3>
                <p className="text-gray-600">
                  Our AI searches thousands of internship postings and filters them based on your profile, preferences, and compatibility score.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Target className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Personalized Matching</h3>
                <p className="text-gray-600">
                  Get ranked recommendations based on your skills, experience level, location preferences, and career aspirations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Briefcase className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Application Insights</h3>
                <p className="text-gray-600">
                  Receive detailed insights about each opportunity including company culture, application tips, and success probability.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">10,000+</div>
            <div className="text-gray-600">Active Internship Listings</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">500+</div>
            <div className="text-gray-600">Partner Companies</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-purple-500 mb-2">85%</div>
            <div className="text-gray-600">Match Success Rate</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">What Makes Our Platform Different</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">For Students</h4>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• AI-powered job matching</li>
                <li>• Application tracking and reminders</li>
                <li>• Interview preparation resources</li>
                <li>• Real-time application status updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Quality Opportunities</h4>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• Verified company listings</li>
                <li>• Detailed role descriptions</li>
                <li>• Competitive compensation data</li>
                <li>• Growth and learning opportunities</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">Start Your Internship Search</h3>
            <p className="text-purple-100 mb-6">
              Access thousands of curated internship opportunities and let AI help you find your perfect match.
            </p>
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200">
              Explore Opportunities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipsInfoPage; 