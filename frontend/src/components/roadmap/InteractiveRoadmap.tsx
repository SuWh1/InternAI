import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  useReactFlow,
  Panel,
  ReactFlowProvider,
  Position
} from 'reactflow';
import type { Node, Edge, Viewport } from 'reactflow';
import 'reactflow/dist/style.css';

import WeekNode from './WeekNode';
import TopicDetailsModal from './TopicDetailsModal';
import agentService from '../../services/agentService';
import type { 
  InteractiveRoadmapProps, 
  RoadmapNode, 
  GPTTopicResponse 
} from '../../types/roadmap';
import { isWeekUnlocked } from '../../utils/weekProgress';

// WeekNode import stays the same, nodeTypes will be memoized inside component

// Component to handle initial zoom - must be inside ReactFlow
const InitialZoomHandler: React.FC = () => {
  const { setViewport } = useReactFlow();
  const hasSetInitialZoom = useRef(false);

  useEffect(() => {
    if (!hasSetInitialZoom.current) {
      // Set initial zoom after a brief delay to ensure nodes are rendered
      const timer = setTimeout(() => {
        setViewport({ x: -50, y: -25, zoom: 1.05 }, { duration: 300 });
        hasSetInitialZoom.current = true;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [setViewport]);

  return null;
};

// Component to handle focusing on current step - must be inside ReactFlow
const FocusOnCurrentStep: React.FC<{ 
  currentStepIndex: number; 
  focusTrigger: number;
  onFocusStart?: () => void;
  onFocusEnd?: () => void;
}> = ({ currentStepIndex, focusTrigger, onFocusStart, onFocusEnd }) => {
  const { getNode, setCenter } = useReactFlow();
  const hasInitialFocus = useRef(false);
  const lastFocusedIndex = useRef(-1);
  const lastFocusTrigger = useRef(0);

  const performFocus = useCallback(() => {
    if (currentStepIndex >= 0) {
      const currentNodeId = `week-${currentStepIndex + 1}`;
      const currentNode = getNode(currentNodeId);
      
      if (currentNode) {
        onFocusStart?.();
        // Calculate center of the node (position + half width/height) with 20% offset to top-left
        const nodeWidth = 375;
        const nodeHeight = 200; // fixed node height
        const centerX = currentNode.position.x + nodeWidth / 2 - nodeWidth * 0.2;
        const centerY = currentNode.position.y + nodeHeight / 2 - nodeHeight * 0.2;
        
        setCenter(centerX, centerY, {
          zoom: 1.5,
          duration: 1000
        });
        
        // End focusing state after animation completes
        setTimeout(() => {
          onFocusEnd?.();
        }, 1000);
        
        return true;
      }
    }
    return false;
  }, [currentStepIndex, getNode, setCenter, onFocusStart, onFocusEnd]);

  useEffect(() => {
    // Focus on initial load or when current step changes
    if ((!hasInitialFocus.current || lastFocusedIndex.current !== currentStepIndex) && currentStepIndex >= 0) {
      // Add a small delay to ensure nodes are rendered
      const timer = setTimeout(() => {
        if (performFocus()) {
          hasInitialFocus.current = true;
          lastFocusedIndex.current = currentStepIndex;
        }
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, performFocus]);

  useEffect(() => {
    // Handle manual focus trigger
    if (focusTrigger > lastFocusTrigger.current && focusTrigger > 0) {
      const timer = setTimeout(() => {
        performFocus();
        lastFocusTrigger.current = focusTrigger;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [focusTrigger, performFocus]);

  return null;
};

const InteractiveRoadmap: React.FC<InteractiveRoadmapProps> = ({
  roadmap,
  progress = [],
  onNodeClick,
  onProgressUpdate,
  className = ''
}) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: string;
    context: string;
    details?: GPTTopicResponse;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [isFocusing, setIsFocusing] = useState(false);

  // Memoize nodeTypes to prevent React Flow warnings
  const nodeTypes = useMemo(() => ({
    week: WeekNode,
  }), []);

  // Callback functions (must be declared before useMemo)
  const handleTaskToggle = useCallback((weekNumber: number, taskIndex: number, isCompleted: boolean, isLocked?: boolean) => {
    // Prevent task toggling for locked nodes
    if (isLocked) {
      return;
    }
    
    // Use subtopic IDs to match the new system used in WeekDetailPage
    onProgressUpdate?.(weekNumber, `subtopic-${taskIndex}`, isCompleted);
  }, [onProgressUpdate]);

  const handleGetTopicDetails = useCallback(async (topic: string, context: string, isLocked?: boolean) => {
    // Prevent getting details for locked nodes
    if (isLocked) {
      return;
    }
    
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
          resources: [],
          subtasks: [],
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

  // Transform roadmap data to ReactFlow format with improved layout
  const { initialNodes, initialEdges, contentBounds } = useMemo(() => {
    if (!roadmap?.weeks) {
      return { initialNodes: [], initialEdges: [], contentBounds: { minX: 0, maxX: 1000, minY: 0, maxY: 600 } };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const nodeWidth = 375;
    const nodeHeight = 200;
    const totalWeeks = roadmap.weeks.length;
    
    // Track bounds for content area
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    // Create S-shaped layout from top to bottom with first and last nodes centered
    roadmap.weeks.forEach((week, index) => {
      // Clear S-shape layout with proper spacing - nodes have breathing room
      // Layout: Creates a recognizable S-pattern with generous spacing between nodes
      const sShapePositions = [
        { x: 650, y: 120 },    // Node 1: center top - start of S
        { x: 800, y: 350 },    // Node 2: curve right
        { x: 1000, y: 580 },   // Node 3: far right - top curve of S
        { x: 1100, y: 810 },   // Node 4: maximum right
        { x: 950, y: 1040 },   // Node 5: start curving back left
        { x: 650, y: 1270 },   // Node 6: center - middle of S
        { x: 350, y: 1500 },   // Node 7: curve left
        { x: 200, y: 1730 },   // Node 8: far left - bottom curve of S  
        { x: 150, y: 1960 },   // Node 9: maximum left
        { x: 300, y: 2190 },   // Node 10: start curving back right
        { x: 550, y: 2420 },   // Node 11: curve back toward center
        { x: 650, y: 2650 }    // Node 12: center bottom - end of S
      ];
      
      // Get position for current node, fallback to center if index exceeds array
      const position = sShapePositions[index] || { x: 600, y: 100 + (index * 250) };
      const baseX = position.x;
      const y = position.y;
      
      // Update bounds tracking
      const nodeLeft = baseX - nodeWidth / 2;
      const nodeRight = baseX + nodeWidth / 2;
      const nodeTop = y - nodeHeight / 2;
      const nodeBottom = y + nodeHeight / 2;
      
      minX = Math.min(minX, nodeLeft);
      maxX = Math.max(maxX, nodeRight);
      minY = Math.min(minY, nodeTop);
      maxY = Math.max(maxY, nodeBottom);
      
      const isLastStep = index === totalWeeks - 1;
      const isCurrentStep = index === currentStepIndex;
      
      // Find progress for this week
      const weekProgress = progress.find(p => p.week_number === week.week_number);
      
      // Determine if this week is locked using the utility function
      const isLocked = !isWeekUnlocked(week.week_number, progress);
      
      const weekNode: Node = {
        id: `week-${week.week_number}`,
        type: 'week',
        position: { x: baseX, y },
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
          is_last_step: isLastStep,
          is_current_step: isCurrentStep,
          is_locked: isLocked,
          step_index: index,
          completed_tasks: weekProgress?.completed_tasks || [],
          onTaskToggle: handleTaskToggle,
          onGetDetails: handleGetTopicDetails
        },
        style: {
          width: nodeWidth,
          height: nodeHeight
        },
        draggable: true
      };
      
      nodes.push(weekNode);
      
      // Connect to previous step with flowing animated edges from sides
      if (index > 0) {
        const prevWeekId = `week-${roadmap.weeks[index - 1].week_number}`;
        const isCompleted = weekProgress?.completion_percentage === 100;
        
        // Get positions to determine connection sides
        const prevPosition = sShapePositions[index - 1] || { x: 600, y: 100 };
        const currentPosition = position;
        
        // Determine source and target positions based on node positions
        let sourcePosition, targetPosition;
        
        if (currentPosition.x > prevPosition.x) {
          // Current node is to the right, connect from right side of prev to left side of current
          sourcePosition = Position.Right;
          targetPosition = Position.Left;
        } else {
          // Current node is to the left, connect from left side of prev to right side of current  
          sourcePosition = Position.Left;
          targetPosition = Position.Right;
        }
        
        edges.push({
          id: `edge-${prevWeekId}-${weekNode.id}`,
          source: prevWeekId,
          target: weekNode.id,
          sourcePosition,
          targetPosition,
          type: 'smoothstep',
          animated: !isLocked,
          style: { 
            stroke: isLocked ? '#9ca3af' : isCompleted ? '#10b981' : isCurrentStep ? '#3b82f6' : '#e5e7eb',
            strokeWidth: isCurrentStep ? 4 : 3,
            opacity: isLocked ? 0.3 : isCompleted ? 1 : isCurrentStep ? 0.9 : 0.6,
            strokeDasharray: isLocked ? '5,5' : undefined
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: isLocked ? '#9ca3af' : isCompleted ? '#10b981' : isCurrentStep ? '#3b82f6' : '#e5e7eb'
          }
        } as Edge);
      }
    });

    // Calculate content bounds with generous padding for comfortable navigation
    const padding = 400; // Extra space around content
    const bounds = {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding
    };

    return { initialNodes: nodes, initialEdges: edges, contentBounds: bounds };
  }, [roadmap, progress, currentStepIndex]);

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
    // Prevent interaction with locked nodes
    if (node.data?.is_locked) {
      // Show helpful message for locked nodes
      console.log(`Week ${node.data.week_number} is locked. Complete the previous week to unlock it.`);
      return;
    }
    
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

  // Enhanced touch and gesture support for omnidirectional movement
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const target = event.currentTarget as HTMLElement;
    
    if (event.touches.length === 1) {
      // Single finger - enable smooth omnidirectional panning
      target.style.touchAction = 'pan-x pan-y';
      target.style.overscrollBehavior = 'contain';
    } else if (event.touches.length === 2) {
      // Two fingers - allow pinch zoom while maintaining pan capability
      target.style.touchAction = 'pan-x pan-y pinch-zoom';
      target.style.overscrollBehavior = 'contain';
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    // Prevent default scrolling behavior to ensure smooth panning
    if (event.touches.length >= 1) {
      event.preventDefault();
    }
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    // Enhanced trackpad/wheel support for omnidirectional movement
    if (event.ctrlKey || event.metaKey) {
      // Zoom with Ctrl/Cmd + scroll - let ReactFlow handle this
      return;
    }
    
    // For trackpad users, enable smooth diagonal movement
    // ReactFlow will handle the actual panning via panOnScroll
    event.stopPropagation();
  }, []);

  // Calculate progress stats for the info panel
  const progressStats = useMemo(() => {
    const completedWeeks = progress.filter(w => w.completion_percentage === 100).length;
    const overallProgress = progress.length > 0 
      ? Math.round(progress.reduce((sum, week) => sum + week.completion_percentage, 0) / progress.length)
      : 0;
    
    return {
      completedWeeks,
      totalWeeks: roadmap?.weeks.length || 0,
      overallProgress
    };
  }, [progress, roadmap]);

  if (!roadmap) {
    return (
      <div className={`flex items-center justify-center h-96 bg-theme-secondary rounded-xl transition-colors duration-300 ${className}`}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-theme-accent/20 to-theme-accent/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-theme-primary mb-2 transition-colors duration-300">No roadmap available</h3>
          <p className="text-theme-secondary transition-colors duration-300">Generate your personalized roadmap to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full bg-theme-secondary rounded-xl overflow-hidden shadow-sm border border-theme transition-colors duration-300 ${className}`} 
      style={{ 
        height: 'calc(100vh - 200px)', 
        minHeight: '600px',
        touchAction: 'pan-x pan-y pinch-zoom',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        position: 'relative'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onWheel={handleWheel}
    >
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
          padding: 80,
          includeHiddenNodes: false,
          minZoom: 0.5,
          maxZoom: 1.5
        }}
        minZoom={0.375}
        maxZoom={2.5}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
        // Content bounds - restrict panning to content area with padding
        translateExtent={[
          [contentBounds.minX, contentBounds.minY],
          [contentBounds.maxX, contentBounds.maxY]
        ]}
        nodeExtent={[
          [contentBounds.minX + 200, contentBounds.minY + 200],
          [contentBounds.maxX - 200, contentBounds.maxY - 200]
        ]}
        // Enhanced panning and interaction
        panOnScroll={true}
        panOnScrollSpeed={1.0}
        panOnDrag={true}
        selectionOnDrag={false}
        preventScrolling={false}
        zoomOnScroll={true}
        zoomActivationKeyCode="Control"
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        // Touch and gesture support - enable omnidirectional movement
        panActivationKeyCode={null}
        selectNodesOnDrag={false}
        deleteKeyCode={null}
      >
        <Controls 
          className="bg-theme-secondary/90 backdrop-blur-sm shadow-lg border border-theme rounded-xl transition-colors duration-300"
          showInteractive={false}
        />
        <Background 
          color="var(--border)" 
          gap={40} 
          size={0.8}
        />
        
        {/* Progress Panel */}
        <Panel position="top-left" className="bg-theme-secondary/95 backdrop-blur-sm rounded-xl shadow-lg border border-theme p-4 m-4 transition-colors duration-300">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-theme-primary transition-colors duration-300">{progressStats.overallProgress}% Complete</div>
                <div className="text-xs text-theme-secondary transition-colors duration-300">{progressStats.completedWeeks}/{progressStats.totalWeeks} weeks</div>
              </div>
            </div>
            <div className="w-20 bg-theme-hover rounded-full h-2.5 transition-colors duration-300">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 shadow-sm" 
                style={{ width: `${progressStats.overallProgress}%` }}
              />
            </div>
          </div>
        </Panel>

        {/* Control Panel */}
        <Panel position="top-right" className="bg-theme-secondary/95 backdrop-blur-sm rounded-xl shadow-lg border border-theme p-3 m-4 transition-colors duration-300">
          <div className="flex items-center space-x-2">
            <button
              onClick={resetLayout}
              className="flex items-center space-x-2 px-3 py-2 bg-theme-hover hover:bg-theme-primary/10 rounded-lg transition-all duration-200 text-sm font-medium text-theme-secondary hover:text-theme-primary border border-theme"
              title="Reset node positions to default layout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset</span>
            </button>
            
            <button
              onClick={() => {
                // Trigger focus by incrementing the focus trigger
                setFocusTrigger(prev => prev + 1);
              }}
              disabled={isFocusing}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isFocusing 
                  ? 'bg-green-500 text-white cursor-not-allowed opacity-80' 
                  : 'bg-theme-accent hover:opacity-90 text-white hover:shadow-lg'
              }`}
              title={isFocusing ? "Focusing on current step..." : "Focus on current step"}
            >
              {isFocusing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18l8.5-5L5 8v10z" />
                </svg>
              )}
              <span>{isFocusing ? 'Focusing...' : 'Focus'}</span>
            </button>
          </div>
        </Panel>

        <InitialZoomHandler />
        <FocusOnCurrentStep 
          currentStepIndex={currentStepIndex} 
          focusTrigger={focusTrigger}
          onFocusStart={() => setIsFocusing(true)}
          onFocusEnd={() => setIsFocusing(false)}
        />
      </ReactFlow>

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