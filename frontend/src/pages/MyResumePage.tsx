import { FileText, Upload, Star } from 'lucide-react';

const MyResumePage = () => {
  return (
    <div className="min-h-screen pt-16 bg-slate-50 animate-slide-up-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Coming soon...
          </h1>
          <p className="text-xl text-gray-600">
            Manage, optimize, and track your resume performance
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Upload className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              This is your dashboard.
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Your comprehensive resume management center is being built. Upload, analyze, optimize, and track 
              the performance of your resumes with AI-powered insights and recommendations.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume Versions</h3>
                <p className="text-gray-600 text-sm">Manage multiple versions for different roles</p>
              </div>
              
              <div className="text-center p-6">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h3>
                <p className="text-gray-600 text-sm">Get instant feedback and optimization tips</p>
              </div>
              
              <div className="text-center p-6">
                <Upload className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Tracking</h3>
                <p className="text-gray-600 text-sm">Monitor application success rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyResumePage; 