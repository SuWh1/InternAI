import { apiService } from './apiService';

export interface Subtopic {
  title: string;
  description: string;
  type?: string;
}

export interface Topic {
  id: string;
  name: string;
  subtopics: (Subtopic | string)[];
  completed_subtopics: number[];
  created_at: string;
  updated_at: string;
  user_id: string;
  is_public: boolean;
  user_name?: string; // For public topics to show author
}

export interface TopicCreate {
  name: string;
}

export interface TopicUpdate {
  name?: string;
  subtopics?: Subtopic[] | string[];
  completed_subtopics?: number[];
  is_public?: boolean;
}

export interface UserTopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  completed_subtopics: number[];
  created_at: string;
  updated_at?: string;
}

export interface TopicList {
  topics: Topic[];
  total: number;
}

export const topicService = {
  // Create a new topic
  async createTopic(data: TopicCreate): Promise<Topic> {
    return await apiService.post<Topic>('/topics/', data);
  },

  // Get all topics for the current user
  async getTopics(): Promise<TopicList> {
    return await apiService.get<TopicList>('/topics/');
  },

  // Get all public topics from all users
  async getPublicTopics(): Promise<TopicList> {
    return await apiService.get<TopicList>('/topics/public');
  },

  // Get a specific topic by ID
  async getTopic(topicId: string): Promise<Topic> {
    return await apiService.get<Topic>(`/topics/${topicId}`);
  },

  // Update a topic
  async updateTopic(topicId: string, data: TopicUpdate): Promise<Topic> {
    return await apiService.put<Topic>(`/topics/${topicId}`, data);
  },

  // Delete a topic
  async deleteTopic(topicId: string): Promise<void> {
    await apiService.delete(`/topics/${topicId}`);
  },

  // Toggle topic visibility (publish/unpublish)
  async toggleTopicVisibility(topicId: string, isPublic: boolean): Promise<Topic> {
    return await apiService.patch<Topic>(`/topics/${topicId}/visibility?is_public=${isPublic}`, {});
  },

  // User Topic Progress endpoints
  
  // Get user's progress for a specific topic
  async getTopicProgress(topicId: string): Promise<UserTopicProgress> {
    return await apiService.get<UserTopicProgress>(`/topics/${topicId}/progress`);
  },

  // Update user's progress for a specific topic
  async updateTopicProgress(topicId: string, completedSubtopics: number[]): Promise<UserTopicProgress> {
    return await apiService.put<UserTopicProgress>(`/topics/${topicId}/progress`, {
      completed_subtopics: completedSubtopics
    });
  },

  // Delete user's progress for a specific topic
  async deleteTopicProgress(topicId: string): Promise<void> {
    await apiService.delete(`/topics/${topicId}/progress`);
  }
};