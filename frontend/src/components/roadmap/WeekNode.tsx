import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  Lock
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
    is_locked?: boolean;
    step_index?: number;
    completed_tasks?: string[];
    onExpand?: (weekNumber: number, isLocked?: boolean) => void;
    onTaskToggle?: (weekNumber: number, taskIndex: number, isCompleted: boolean, isLocked?: boolean) => void;
    onGetDetails?: (topic: string, context: string, isLocked?: boolean) => void;
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
    is_locked = false,
    step_index = 0,
    completed_tasks = [],
    onExpand,
    onTaskToggle,
    onGetDetails
  } = data;

  // Initialize and sync local state with actual progress data
  useEffect(() => {
    const taskIndices = new Set<number>();
    
    // Check if we have subtopic progress (new system) or task progress (old system)
    const hasSubtopics = completed_tasks.some(taskId => taskId.startsWith('subtopic-'));
    
    completed_tasks.forEach(taskId => {
      if (hasSubtopics) {
        // Parse subtopic IDs like "subtopic-0", "subtopic-1", etc.
        const match = taskId.match(/^subtopic-(\d+)$/);
        if (match) {
          taskIndices.add(parseInt(match[1], 10));
        }
      } else {
        // Parse task IDs like "task-0", "task-1", etc.
        const match = taskId.match(/^task-(\d+)$/);
        if (match) {
          taskIndices.add(parseInt(match[1], 10));
        }
      }
    });
    setCompletedTasks(taskIndices);
  }, [completed_tasks]);

  // Always use 6 as total for subtopic system, original task count for task system
  const hasSubtopics = completed_tasks.some(taskId => taskId.startsWith('subtopic-'));
  const totalItems = 6; // Always show 6 total items for all weeks
  const completedItems = hasSubtopics 
    ? completed_tasks.filter(taskId => taskId.startsWith('subtopic-')).length
    : completed_tasks.filter(taskId => taskId.startsWith('task-')).length;

  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const isCompleted = completionPercentage === 100;

  const handleExpand = () => {
    onExpand?.(week_number, is_locked);
  };

  const handleTaskToggle = (taskIndex: number) => {
    if (is_locked) return;
    
    const newCompletedTasks = new Set(completedTasks);
    const isCompleting = !newCompletedTasks.has(taskIndex);
    
    if (newCompletedTasks.has(taskIndex)) {
      newCompletedTasks.delete(taskIndex);
    } else {
      newCompletedTasks.add(taskIndex);
    }
    setCompletedTasks(newCompletedTasks);
    onTaskToggle?.(week_number, taskIndex, isCompleting, is_locked);
  };

  const handleGetDetails = () => {
    onGetDetails?.(theme, `Week ${week_number} focus area: ${focus_area}`, is_locked);
  };

  // Animation variants
  const nodeVariants = {
    initial: {
      scale: 0.8,
      opacity: 0,
      y: 20
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: step_index * 0.1,
        type: "spring" as const,
        stiffness: 300,
        damping: 25
      }
    },
    hover: {
      scale: is_locked ? 1 : 1.05,
      transition: {
        duration: 0.2,
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    }
  };

  const expandedContentVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const
      }
    },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <div className={`relative ${is_last_step && !is_locked ? 'pt-6' : ''}`}>
      {/* Crown container positioned above the node */}
      {is_last_step && !is_locked && (
        <motion.div 
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20"
          initial={{ y: -20, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            rotate: [0, -5, 5, -5, 0]
          }}
          transition={{
            y: { duration: 0.5 },
            opacity: { duration: 0.5 },
            rotate: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <Crown className="w-8 h-8 text-yellow-500" />
        </motion.div>
      )}
      
      <motion.div 
        className={`
          bg-theme-secondary rounded-lg border-2 transition-all duration-300 
          ${is_locked 
            ? 'border-theme opacity-50 cursor-not-allowed' 
            : 'shadow-lg'
          }
          ${!is_locked && is_current_step 
            ? 'border-purple-500 bg-purple-500/10 shadow-2xl' 
            : !is_locked && isCompleted 
              ? 'border-green-400 bg-green-50/20' 
              : !is_locked
                ? 'border-theme'
                : ''
          }
          ${is_expanded ? 'min-w-80' : 'w-64'}
          ${!is_locked && is_last_step ? 'shadow-2xl ring-4 ring-yellow-300 ring-opacity-50' : ''}
          relative overflow-hidden
        `}
        variants={nodeVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
      {/* Lock overlay for locked nodes */}
      {is_locked && (
        <motion.div 
          className="absolute inset-0 bg-black/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="bg-theme-secondary/90 rounded-full p-3 shadow-lg border border-theme"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Lock className="w-6 h-6 text-theme-primary" />
          </motion.div>
        </motion.div>
      )}

      {/* Sparkles and background effects for final step */}
      {is_last_step && !is_locked && (
        <>
          <motion.div 
            className="absolute -top-2 -left-2 z-10"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-yellow-100/30 to-orange-100/30 rounded-lg pointer-events-none"
            animate={{
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </>
      )}

      {/* Current step glow effect */}
      {is_current_step && !is_last_step && !is_locked && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-lg pointer-events-none"
          animate={{
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 ${
          is_locked ? 'bg-gray-400' :
          is_last_step ? 'bg-yellow-500' : 
          is_current_step ? 'bg-purple-500' : 
          'bg-green-500'
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 ${
          is_locked ? 'bg-gray-400' :
          is_last_step ? 'bg-yellow-500' : 
          is_current_step ? 'bg-purple-500' : 
          'bg-green-500'
        }`}
      />

      {/* Header */}
      <div className="p-4 border-b border-theme transition-colors duration-300">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <motion.div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${is_locked 
                  ? 'bg-theme-secondary text-theme-secondary border border-theme' 
                  : is_last_step 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' 
                    : is_current_step
                      ? 'bg-purple-500 text-white shadow-lg'
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-theme-accent/80 text-white'
                }
              `}
              animate={is_current_step && !is_locked ? { 
                scale: [1, 1.1, 1] 
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {is_locked ? <Lock className="w-4 h-4" /> : is_last_step ? <Crown className="w-4 h-4" /> : week_number}
            </motion.div>
            <div className="flex-1">
              <h3 className={`font-semibold text-sm transition-colors duration-300 ${
                is_locked ? 'text-theme-primary' :
                is_last_step ? 'text-yellow-800 font-bold' : 
                is_current_step ? 'text-purple-500 font-bold' : 
                'text-theme-primary'
              }`}>
                {is_locked 
                  ? `🔒 ${theme} - Locked` 
                  : is_last_step 
                    ? `🎉 ${theme} - Final Step!` 
                    : is_current_step 
                      ? `➡️ ${theme} - Current Step` 
                      : theme
                }
              </h3>
              <p className={`text-xs transition-colors duration-300 ${
                is_locked ? 'text-theme-secondary' :
                is_last_step ? 'text-yellow-600' : 
                is_current_step ? 'text-purple-500/80' : 
                'text-theme-secondary'
              }`}>
                {is_locked ? 'Complete the previous week to unlock' : focus_area}
              </p>
            </div>
          </div>
          <motion.button
            onClick={handleExpand}
            disabled={is_locked}
            className={`p-1 rounded transition-colors ${
              is_locked ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'
            }`}
            animate={{ rotate: is_expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {is_locked ? (
              <Lock className="w-4 h-4 text-gray-400" />
            ) : is_expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </motion.button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
          <motion.div
            className={`h-2 rounded-full ${
              is_locked 
                ? 'bg-gray-400' 
                : is_last_step 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                  : is_current_step
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                    : isCompleted 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: is_locked ? '0%' : `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Quick stats */}
        <div className={`flex items-center justify-between text-xs ${is_locked ? 'text-theme-primary' : 'text-gray-600'}`}>
          <motion.div 
            className="flex items-center space-x-1"
            whileHover={{ scale: 1.05 }}
          >
            <Clock className="w-3 h-3" />
            <span>{is_locked ? '--' : estimated_hours}h/week</span>
          </motion.div>
          <motion.div 
            className="flex items-center space-x-1"
            whileHover={{ scale: 1.05 }}
          >
            {is_locked ? (
              <span>Locked</span>
            ) : (
              <span>{completedItems}/{totalItems} topics</span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {is_expanded && !is_locked && (
          <motion.div 
            className="p-4 space-y-4"
            variants={expandedContentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Tasks */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center space-x-2 mb-2">
                <List className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm text-gray-700">Tasks</span>
              </div>
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start space-x-2"
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                  >
                    <motion.button
                      onClick={() => handleTaskToggle(index)}
                      className="mt-0.5 flex-shrink-0"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {completedTasks.has(index) ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                      )}
                    </motion.button>
                    <span className={`text-xs ${
                      completedTasks.has(index) 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-700'
                    }`}>
                      {task}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Deliverables */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm text-gray-700">Deliverables</span>
              </div>
              <div className="space-y-1">
                {deliverables.map((deliverable, index) => (
                  <motion.div 
                    key={index} 
                    className="text-xs text-gray-600"
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                  >
                    • {deliverable}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Resources */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm text-gray-700">Resources</span>
              </div>
              <div className="space-y-1">
                {resources.map((resource, index) => (
                  <motion.div 
                    key={index} 
                    className="text-xs text-gray-600"
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                  >
                    • {resource}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Get Details Button */}
            <motion.button
              onClick={handleGetDetails}
              className="w-full bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1 relative overflow-hidden"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BookOpen className="w-3 h-3 relative z-10" />
              <span className="relative z-10">Get Detailed Explanation</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default WeekNode; 