import { Briefcase, Heart, TrendingUp } from 'lucide-react';

const MyInternshipsPage = () => {
  return (
    <div className="min-h-screen pt-16 bg-theme-primary animate-slide-up-lg transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Briefcase className="h-16 w-16 text-purple-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            My Internships
          </h1>
          <p className="text-xl text-theme-secondary transition-colors duration-300">
            Track applications, manage opportunities, and discover new matches
          </p>
        </div>

        <div className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-12 transition-colors duration-300">
          <div className="text-center">
            <Briefcase className="h-24 w-24 text-theme-secondary/50 mx-auto mb-6 transition-colors duration-300" />
            <h2 className="text-3xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
              Coming soon...
            </h2>
            <p className="text-lg text-theme-secondary mb-8 max-w-2xl mx-auto transition-colors duration-300">
              Your personalized internship dashboard is in development. Track your applications, 
              discover AI-matched opportunities, and manage your entire internship search process in one place.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <TrendingUp className="h-12 w-12 text-theme-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-theme-primary mb-2 transition-colors duration-300">Application Tracking</h3>
                <p className="text-theme-secondary text-sm transition-colors duration-300">Monitor status of all your applications</p>
              </div>
              
              <div className="text-center p-6">
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-theme-primary mb-2 transition-colors duration-300">Saved Opportunities</h3>
                <p className="text-theme-secondary text-sm transition-colors duration-300">Keep track of interesting positions</p>
              </div>
              
              <div className="text-center p-6">
                <Briefcase className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-theme-primary mb-2 transition-colors duration-300">AI Matches</h3>
                <p className="text-theme-secondary text-sm transition-colors duration-300">Discover personalized recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyInternshipsPage; 