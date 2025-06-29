import { FileText, Upload, Star } from 'lucide-react';
import AnimatedSection from '../components/common/AnimatedSection';

const MyResumePage = () => {
  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatedSection className="text-center mb-12">
          <FileText className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            My Resume
          </h1>
          <p className="text-xl text-theme-secondary transition-colors duration-300">
            Manage, optimize, and track your resume performance
          </p>
        </AnimatedSection>

        <AnimatedSection delay={2} className="bg-theme-secondary rounded-lg shadow-sm border border-theme p-12 transition-colors duration-300">
          <div className="text-center">
            <Upload className="h-24 w-24 text-theme-secondary/50 mx-auto mb-6 transition-colors duration-300" />
            <h2 className="text-3xl font-semibold text-theme-primary mb-4 transition-colors duration-300">
              Coming soon...
            </h2>
            <p className="text-lg text-theme-secondary mb-8 max-w-2xl mx-auto transition-colors duration-300">
              Your comprehensive resume management center is being built. Upload, analyze, optimize, and track 
              the performance of your resumes with AI-powered insights and recommendations.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <FileText className="h-12 w-12 text-theme-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-theme-primary mb-2 transition-colors duration-300">Resume Versions</h3>
                <p className="text-theme-secondary text-sm transition-colors duration-300">Manage multiple versions for different roles</p>
              </div>
              
              <div className="text-center p-6">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-theme-primary mb-2 transition-colors duration-300">AI Analysis</h3>
                <p className="text-theme-secondary text-sm transition-colors duration-300">Get instant feedback and optimization tips</p>
              </div>
              
              <div className="text-center p-6">
                <Upload className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-theme-primary mb-2 transition-colors duration-300">Performance Tracking</h3>
                <p className="text-theme-secondary text-sm transition-colors duration-300">Monitor application success rates</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default MyResumePage; 