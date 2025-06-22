import React from 'react';
import { X, BookOpen, ExternalLink, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import type { GPTTopicResponse } from '../../types/roadmap';

interface TopicDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  context: string;
  details?: GPTTopicResponse;
  loading: boolean;
}

const TopicDetailsModal: React.FC<TopicDetailsModalProps> = ({
  isOpen,
  onClose,
  topic,
  context,
  details,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{topic}</h2>
                <p className="text-sm text-gray-500 mt-1">{context}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-gray-600">Generating detailed explanation...</span>
                </div>
              </div>
            ) : details ? (
              <div className="space-y-6">
                {/* Success/Error indicator */}
                <div className="flex items-center space-x-2">
                  {details.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        {details.cached ? 'Retrieved from cache' : 'Fresh explanation generated'}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Failed to generate explanation</span>
                    </>
                  )}
                </div>

                {/* Explanation */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Detailed Explanation</h3>
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {details.explanation}
                    </div>
                  </div>
                </div>

                {/* Resources */}
                {details.resources && details.resources.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Recommended Resources</h3>
                    <div className="space-y-2">
                      {details.resources.map((resource, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <ExternalLink className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{resource}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtasks */}
                {details.subtasks && details.subtasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Suggested Subtasks</h3>
                    <div className="space-y-2">
                      {details.subtasks.map((subtask, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{subtask}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600">No details available</div>
                  <div className="text-sm text-gray-500 mt-2">Please try again later</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {details?.cached ? 'Cached response' : 'AI-generated explanation'}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicDetailsModal; 