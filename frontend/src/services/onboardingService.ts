import api from '../lib/axios';
import type {
  OnboardingData,
  OnboardingCreate,
  OnboardingUpdate,
  OnboardingStatus,
  OnboardingOptions
} from '../types/onboarding';

class OnboardingService {
  
  async createOnboarding(data: OnboardingCreate): Promise<OnboardingData> {
    const response = await api.post<OnboardingData>('/onboarding/', data);
    return response.data;
  }

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const response = await api.get<OnboardingStatus>('/onboarding/status');
    return response.data;
  }

  async getOnboarding(): Promise<OnboardingData> {
    const response = await api.get<OnboardingData>('/onboarding/');
    return response.data;
  }

  async updateOnboarding(data: OnboardingUpdate): Promise<OnboardingData> {
    const response = await api.put<OnboardingData>('/onboarding/', data);
    return response.data;
  }

  async deleteOnboarding(): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>('/onboarding/');
    return response.data;
  }

  async getOnboardingOptions(): Promise<OnboardingOptions> {
    const response = await api.get<OnboardingOptions>('/onboarding/options');
    return response.data;
  }
}

// Create and export a singleton instance
export const onboardingService = new OnboardingService(); 