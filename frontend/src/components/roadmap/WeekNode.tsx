import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Target,
  BookOpen,
  List,
  Crown,
  Sparkles
} from 'lucide-react';


interface WeekNodeProps {
  data: {
    label: string;
    week_number: number;
    theme: string;
    focus_area: string;
    tasks: string[];
    estimated_hours: number;
    deliverables: string[];
    resources: string[];
    is_completed: boolean;
    is_expanded: boolean;
    is_last_step?: boolean;
    is_current_step?: boolean;
    step_index?: number;
    completed_tasks?: string[];
    onExpand?: (weekNumber: number) => void;
    onTaskToggle?: (weekNumber: number, taskIndex: number, isCompleted: boolean) => void;
    onGetDetails?: (topic: string, context: string) => void;
  };
}

const WeekNode: React.FC<WeekNodeProps> = ({ data }) => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  
  const {
    week_number,
    theme,
    focus_area,
    tasks,
    estimated_hours,
    deliverables,
    resources,
    is_expanded,
    is_last_step = false,
    is_current_step = false,
    step_index = 0,
    completed_tasks = [],
    onExpand,
    onTaskToggle,
    onGetDetails
  } = data;

  // Initialize and sync local state with actual progress data
  useEffect(() => {
    const taskIndices = new Set<number>();
    completed_tasks.forEach(taskId => {
      // Parse task IDs like "task-0", "task-1", etc.
      const match = taskId.match(/^task-(\d+)$/);
      if (match) {
        taskIndices.add(parseInt(match[1], 10));
      }
    });
    setCompletedTasks(taskIndices);
  }, [completed_tasks]);

  // Keep local state in sync with backend data
  const actualCompletionPercentage = tasks.length > 0 ? Math.round((completed_tasks.length / tasks.length) * 100) : 0;

  // Use backend data as source of truth for completion status
  const completionPercentage = actualCompletionPercentage;
  const isCompleted = actualCompletionPercentage === 100;

  const handleExpand = () => {
    onExpand?.(week_number);
  };

  const handleTaskToggle = (taskIndex: number) => {
    const newCompletedTasks = new Set(completedTasks);
    const isCompleting = !newCompletedTasks.has(taskIndex);
    
    if (newCompletedTasks.has(taskIndex)) {
      newCompletedTasks.delete(taskIndex);
    } else {
      newCompletedTasks.add(taskIndex);
    }
    setCompletedTasks(newCompletedTasks);
    onTaskToggle?.(week_number, taskIndex, isCompleting);
  };

  const handleGetDetails = () => {
    onGetDetails?.(theme, `Week ${week_number} focus area: ${focus_area}`);
  };

  // Calculate elevation effect based on step index
  const elevationClass = `shadow-${Math.min(step_index + 1, 3) * 2}xl`;
  const transformStyle = {
    transform: `translateY(-${step_index * 2}px) rotate(${step_index * 0.5}deg)`,
    transition: 'all 0.3s ease-in-out'
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105
        ${is_current_step 
          ? 'border-indigo-500 bg-indigo-50 shadow-2xl ring-4 ring-indigo-300 ring-opacity-60 animate-pulse' 
          : isCompleted 
            ? 'border-green-400 bg-green-50' 
            : 'border-blue-300'
        }
        ${is_expanded ? 'min-w-80' : 'w-64'}
        ${is_last_step ? 'shadow-2xl ring-4 ring-yellow-300 ring-opacity-50' : elevationClass}
        relative overflow-hidden
      `}
      style={transformStyle}
    >
      {/* Crown and celebration effects for final step */}
      {is_last_step && (
        <>
          <div className="absolute -top-3 -right-3 z-10">
            <Crown className="w-8 h-8 text-yellow-500 animate-bounce" />
          </div>
          <div className="absolute -top-2 -left-2 z-10">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/30 to-orange-100/30 rounded-lg pointer-events-none" />
        </>
      )}

      {/* Current step glow effect */}
      {is_current_step && !is_last_step && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-lg pointer-events-none animate-pulse" />
      )}

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 ${
          is_last_step ? 'bg-yellow-500' : 
          is_current_step ? 'bg-indigo-500 animate-pulse' : 
          'bg-green-500'
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 ${
          is_last_step ? 'bg-yellow-500' : 
          is_current_step ? 'bg-indigo-500 animate-pulse' : 
          'bg-green-500'
        }`}
      />

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${is_last_step 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' 
                : is_current_step
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg animate-pulse'
                  : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white'
              }
            `}>
              {is_last_step ? <Crown className="w-4 h-4" /> : week_number}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-sm ${
                is_last_step ? 'text-yellow-800 font-bold' : 
                is_current_step ? 'text-indigo-800 font-bold' : 
                'text-gray-800'
              }`}>
                {is_last_step 
                  ? `🎉 ${theme} - Final Step!` 
                  : is_current_step 
                    ? `➡️ ${theme} - Current Step` 
                    : theme
                }
              </h3>
              <p className={`text-xs ${
                is_last_step ? 'text-yellow-600' : 
                is_current_step ? 'text-indigo-600' : 
                'text-gray-500'
              }`}>
                {focus_area}
              </p>
            </div>
          </div>
          <button
            onClick={handleExpand}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {is_expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              is_last_step 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                : is_current_step
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse'
                  : isCompleted 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Quick stats */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{estimated_hours}h/week</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>{completed_tasks.length}/{tasks.length} tasks</span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {is_expanded && (
        <div className="p-4 space-y-4">
          {/* Tasks */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <List className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm text-gray-700">Tasks</span>
            </div>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <button
                    onClick={() => handleTaskToggle(index)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {completedTasks.has(index) ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                    )}
                  </button>
                  <span className={`text-xs ${
                    completedTasks.has(index) 
                      ? 'text-gray-500 line-through' 
                      : 'text-gray-700'
                  }`}>
                    {task}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm text-gray-700">Deliverables</span>
            </div>
            <div className="space-y-1">
              {deliverables.map((deliverable, index) => (
                <div key={index} className="text-xs text-gray-600">
                  • {deliverable}
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span className="font-medium text-sm text-gray-700">Resources</span>
            </div>
            <div className="space-y-1">
              {resources.map((resource, index) => (
                <div key={index} className="text-xs text-gray-600">
                  • {resource}
                </div>
              ))}
            </div>
          </div>

          {/* Get Details Button */}
          <button
            onClick={handleGetDetails}
            className="w-full bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
          >
            <BookOpen className="w-3 h-3" />
            <span>Get Detailed Explanation</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WeekNode; 