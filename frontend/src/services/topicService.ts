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
}

export interface TopicCreate {
  name: string;
}

export interface TopicUpdate {
  name?: string;
  subtopics?: (Subtopic | string)[];
  completed_subtopics?: number[];
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
}; 