import { FileText, Zap, Star } from 'lucide-react';

const ResumeReviewInfoPage = () => {
  return (
    <div className="min-h-screen pt-16 bg-slate-50 animate-slide-up-lg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Resume Review & Optimization
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant, professional feedback on your resume with AI-powered analysis and optimization suggestions.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Why Our Resume Review Stands Out</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Zap className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Instant Analysis</h3>
                <p className="text-gray-600">
                  Upload your resume and get comprehensive feedback in seconds, not days. Our AI reviews content, formatting, and ATS compatibility.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Star className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Industry-Specific Insights</h3>
                <p className="text-gray-600">
                  Get tailored recommendations based on your target industry and role, with insights from thousands of successful applications.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <FileText className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Actionable Improvements</h3>
                <p className="text-gray-600">
                  Receive specific, actionable suggestions for keywords, formatting, and content optimization to maximize your interview chances.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What We Analyze</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Content relevance and impact</li>
              <li>• ATS (Applicant Tracking System) compatibility</li>
              <li>• Formatting and visual hierarchy</li>
              <li>• Keyword optimization</li>
              <li>• Industry-specific requirements</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">You'll Receive</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Detailed score breakdown</li>
              <li>• Specific improvement suggestions</li>
              <li>• Industry benchmark comparisons</li>
              <li>• Template recommendations</li>
              <li>• Follow-up optimization tips</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">Perfect Your Resume Today</h3>
            <p className="text-green-100 mb-6">
              Join professionals who have improved their interview rate by 3x with our AI-powered resume optimization.
            </p>
            <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200">
              Upload Resume Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeReviewInfoPage; 