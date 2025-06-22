import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  useReactFlow
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import WeekNode from './WeekNode';
import TopicDetailsModal from './TopicDetailsModal';
import agentService from '../../services/agentService';
import type { 
  InteractiveRoadmapProps, 
  RoadmapNode, 
  GPTTopicResponse 
} from '../../types/roadmap';

const nodeTypes = {
  week: WeekNode,
};

// Component to handle focusing on current step - must be inside ReactFlow
const FocusOnCurrentStep: React.FC<{ currentStepIndex: number }> = ({ currentStepIndex }) => {
  const { fitView, getNode } = useReactFlow();
  const hasInitialFocus = useRef(false);
  const lastFocusedIndex = useRef(-1);

  useEffect(() => {
    // Focus on initial load or when current step changes
    if ((!hasInitialFocus.current || lastFocusedIndex.current !== currentStepIndex) && currentStepIndex >= 0) {
      // Add a small delay to ensure nodes are rendered
      const timer = setTimeout(() => {
        const currentNodeId = `week-${currentStepIndex + 1}`;
        const currentNode = getNode(currentNodeId);
        
        if (currentNode) {
          fitView({
            nodes: [currentNode],
            padding: 200,
            duration: 800,
            minZoom: 0.8,
            maxZoom: 1.2
          });
          hasInitialFocus.current = true;
          lastFocusedIndex.current = currentStepIndex;
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, fitView, getNode]);

  return null;
};

const InteractiveRoadmap: React.FC<InteractiveRoadmapProps> = ({
  roadmap,
  progress = [],
  onNodeClick,
  onProgressUpdate,
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: string;
    context: string;
    details?: GPTTopicResponse;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Callback functions (must be declared before useMemo)
  const handleNodeExpand = useCallback((weekNumber: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  }, []);

  const handleTaskToggle = useCallback((weekNumber: number, taskIndex: number, isCompleted: boolean) => {
    onProgressUpdate?.(weekNumber, `task-${taskIndex}`, isCompleted);
  }, [onProgressUpdate]);

  const handleGetTopicDetails = useCallback(async (topic: string, context: string) => {
    setSelectedTopic({ topic, context });
    setDetailsModalOpen(true);
    setLoadingDetails(true);

    try {
      const userLevel = roadmap?.personalization_factors?.experience_level?.toLowerCase() || 'intermediate';
      
      const details = await agentService.getTopicDetails({
        topic,
        context,
        user_level: userLevel
      });
      
      setSelectedTopic(prev => prev ? { ...prev, details } : null);
    } catch (error) {
      console.error('Error fetching topic details:', error);
      setSelectedTopic(prev => prev ? { 
        ...prev, 
        details: {
          success: false,
          explanation: 'Failed to load detailed explanation. Please try again.',
          cached: false
        }
      } : null);
    } finally {
      setLoadingDetails(false);
    }
  }, [roadmap?.personalization_factors?.experience_level]);

  // Calculate current step based on progress
  const getCurrentStep = useCallback(() => {
    if (!progress || progress.length === 0) return 0;
    
    // Find the first incomplete week or the week with partial progress
    for (let i = 0; i < progress.length; i++) {
      if (progress[i].completion_percentage < 100) {
        return i;
      }
    }
    // If all weeks are complete, focus on the last week
    return progress.length - 1;
  }, [progress]);

  const currentStepIndex = getCurrentStep();

  // Transform roadmap data to ReactFlow format
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!roadmap?.weeks) {
      return { initialNodes: [], initialEdges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const nodeWidth = 280;
    const nodeHeight = 140;
    const stepHeight = 200; // Vertical distance between steps
    const stepWidth = 180;  // Horizontal distance between steps
    const totalWeeks = roadmap.weeks.length;
    
    // Calculate staircase layout - start from bottom and go up like stairs
    roadmap.weeks.forEach((week, index) => {
      // Create staircase effect: each step goes up and slightly to the right
      const x = 100 + (index * stepWidth);
      const y = 800 - (index * stepHeight); // Start from bottom (higher Y value) and go up
      
      const isLastStep = index === totalWeeks - 1;
      const isCurrentStep = index === currentStepIndex;
      
      // Find progress for this week
      const weekProgress = progress.find(p => p.week_number === week.week_number);
      
      const weekNode: Node = {
        id: `week-${week.week_number}`,
        type: 'week',
        position: { x, y },
        data: {
          label: `Week ${week.week_number}: ${week.theme}`,
          week_number: week.week_number,
          theme: week.theme,
          focus_area: week.focus_area,
          tasks: week.tasks,
          estimated_hours: week.estimated_hours,
          deliverables: week.deliverables,
          resources: week.resources,
          is_completed: weekProgress?.completion_percentage === 100 || false,
          is_expanded: expandedNodes.has(week.week_number),
          is_last_step: isLastStep,
          is_current_step: isCurrentStep,
          step_index: index,
          completed_tasks: weekProgress?.completed_tasks || [],
          onExpand: handleNodeExpand,
          onTaskToggle: handleTaskToggle,
          onGetDetails: handleGetTopicDetails
        },
        style: {
          width: expandedNodes.has(week.week_number) ? 320 : nodeWidth,
          height: expandedNodes.has(week.week_number) ? 'auto' : nodeHeight
        }
      };
      
      nodes.push(weekNode);
      
      // Connect to previous step (going upward like stairs)
      if (index > 0) {
        const prevWeekId = `week-${roadmap.weeks[index - 1].week_number}`;
        edges.push({
          id: `edge-${prevWeekId}-${weekNode.id}`,
          source: prevWeekId,
          target: weekNode.id,
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#10b981', // Green color for upward progress
            strokeWidth: 3,
            strokeDasharray: '5,5'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 24,
            height: 24,
            color: '#10b981'
          }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [roadmap, progress, expandedNodes, currentStepIndex]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Reset layout function
  const resetLayout = useCallback(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update nodes when dependencies change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Navigate to week detail page
    if (node.data?.week_number) {
      window.location.href = `/roadmap/week/${node.data.week_number}`;
    }
    onNodeClick?.(node as RoadmapNode);
  }, [onNodeClick]);

  const handleCloseModal = useCallback(() => {
    setDetailsModalOpen(false);
    setSelectedTopic(null);
  }, []);

  if (!roadmap) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No roadmap available</div>
          <div className="text-gray-500 text-sm">Generate your personalized roadmap to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gray-50 rounded-lg overflow-hidden relative ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 120,
          includeHiddenNodes: false,
          minZoom: 0.6,
          maxZoom: 1.5
        }}
        minZoom={0.3}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Controls 
          className="bg-white shadow-lg border border-gray-200 rounded-lg"
          showInteractive={false}
        />
        <Background 
          color="#e5e7eb" 
          gap={20} 
          size={1}
        />
        <FocusOnCurrentStep currentStepIndex={currentStepIndex} />
      </ReactFlow>

      {/* Reset Layout Button */}
      <button
        onClick={resetLayout}
        className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-lg px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 flex items-center space-x-2 group"
        title="Reset node positions to default layout"
      >
        <svg 
          className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        <span>Reset Layout</span>
      </button>

      {/* Topic Details Modal */}
      {detailsModalOpen && selectedTopic && (
        <TopicDetailsModal
          isOpen={detailsModalOpen}
          onClose={handleCloseModal}
          topic={selectedTopic.topic}
          context={selectedTopic.context}
          details={selectedTopic.details}
          loading={loadingDetails}
        />
      )}
    </div>
  );
};

export default InteractiveRoadmap; 