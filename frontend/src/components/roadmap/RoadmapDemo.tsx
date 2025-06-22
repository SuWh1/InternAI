import { useState } from 'react';
import { Play, BookOpen, Target, Clock } from 'lucide-react';
import InteractiveRoadmap from './InteractiveRoadmap';
import type { Roadmap, RoadmapProgress } from '../../types/roadmap';

const RoadmapDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  // Sample roadmap data matching the agent pipeline output
  const sampleRoadmap: Roadmap = {
    weeks: [
      {
        week_number: 1,
        theme: "Algorithm Review",
        focus_area: "algorithm_review",
        tasks: [
          "Complete 5 algorithm problems on LeetCode/HackerRank",
          "Set up development environment",
          "Create/update LinkedIn profile"
        ],
        estimated_hours: 12,
        deliverables: ["Weekly progress summary"],
        resources: ["LeetCode", "Algorithm Design Manual", "GeeksforGeeks"]
      },
      {
        week_number: 2,
        theme: "Advanced Data Structures",
        focus_area: "advanced_ds",
        tasks: [
          "Study trees, graphs, and hash tables",
          "Implement basic data structures from scratch",
          "Practice with simple examples"
        ],
        estimated_hours: 15,
        deliverables: ["Data structure implementations"],
        resources: ["Data Structures and Algorithms book", "Visualgo", "HackerRank"]
      },
      {
        week_number: 3,
        theme: "System Design Basics",
        focus_area: "system_design_intro",
        tasks: [
          "Read system design fundamentals",
          "Design a simple system (URL shortener)",
          "Network with professionals in your field"
        ],
        estimated_hours: 18,
        deliverables: ["System design document"],
        resources: ["System Design Interview book", "High Scalability blog"]
      },
      {
        week_number: 4,
        theme: "Framework Deep Dive",
        focus_area: "framework_mastery",
        tasks: [
          "Build a web application feature",
          "Learn/practice modern web frameworks",
          "Practice behavioral interview questions"
        ],
        estimated_hours: 16,
        deliverables: ["Web application prototype"],
        resources: ["React Documentation", "Node.js Guides", "Express.js"]
      }
    ],
    personalization_factors: {
      experience_level: "Intermediate",
      focus_areas: ["algorithms", "coding_practice", "system_design"],
      skill_assessment: {
        overall_score: 6,
        level_category: "intermediate"
      },
      timeline_urgency: "medium",
      target_internships: ["Google STEP", "Microsoft Explore"],
      has_resume: true
    },
    generated_at: new Date().toISOString(),
    roadmap_type: "3_month_internship_prep"
  };

  const sampleProgress: RoadmapProgress[] = [
    {
      week_number: 1,
      completed_tasks: ["task-0"],
      total_tasks: 3,
      completion_percentage: 33,
      last_updated: new Date().toISOString()
    },
    {
      week_number: 2,
      completed_tasks: [],
      total_tasks: 3,
      completion_percentage: 0,
      last_updated: new Date().toISOString()
    },
    {
      week_number: 3,
      completed_tasks: [],
      total_tasks: 3,
      completion_percentage: 0,
      last_updated: new Date().toISOString()
    },
    {
      week_number: 4,
      completed_tasks: [],
      total_tasks: 3,
      completion_percentage: 0,
      last_updated: new Date().toISOString()
    }
  ];

  const handleNodeClick = (node: any) => {
    console.log('Demo: Node clicked', node);
  };

  const handleProgressUpdate = (weekNumber: number, taskId: string, completed: boolean) => {
    console.log('Demo: Progress updated', { weekNumber, taskId, completed });
  };

  if (!showDemo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Target className="h-16 w-16 text-blue-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Interactive Roadmap Demo
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Experience the interactive roadmap component with sample data. 
            Click nodes to expand, mark tasks complete, and get AI-powered explanations.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Expandable Nodes</h3>
              <p className="text-sm text-gray-600">Click to view tasks, resources, and details</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Progress Tracking</h3>
              <p className="text-sm text-gray-600">Mark tasks complete and track progress</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">AI Explanations</h3>
              <p className="text-sm text-gray-600">Get detailed topic explanations on demand</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDemo(true)}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Launch Interactive Demo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Interactive Roadmap Demo</h3>
            <p className="text-blue-700 text-sm">
              Sample 4-week internship preparation roadmap with interactive features
            </p>
          </div>
          <button
            onClick={() => setShowDemo(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Close Demo
          </button>
        </div>
      </div>

      {/* Interactive Roadmap */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Demo Instructions</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>• Click nodes</strong> to expand and see detailed tasks
            </div>
            <div>
              <strong>• Check circles</strong> to mark tasks as complete
            </div>
            <div>
              <strong>• Use controls</strong> to zoom and pan around the roadmap
            </div>
            <div>
              <strong>• Click "Get Details"</strong> for AI-powered explanations
            </div>
          </div>
        </div>
        
        <div className="h-[600px] w-full border border-gray-200 rounded-lg">
          <InteractiveRoadmap
            roadmap={sampleRoadmap}
            progress={sampleProgress}
            onNodeClick={handleNodeClick}
            onProgressUpdate={handleProgressUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default RoadmapDemo; 