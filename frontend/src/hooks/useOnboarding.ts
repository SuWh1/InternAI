import { useState, useCallback } from 'react';
import { onboardingService } from '../services/onboardingService';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import type {
  OnboardingData,
  OnboardingCreate,
  OnboardingUpdate,
  OnboardingStatus,
  OnboardingOptions
} from '../types/onboarding';

export const useOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [options, setOptions] = useState<OnboardingOptions | null>(null);

  const { setUser } = useAuthStore();

  const clearError = useCallback(() => setError(null), []);

  const createOnboarding = useCallback(async (data: OnboardingCreate): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await onboardingService.createOnboarding(data);
      setOnboardingData(result);
      
      // Update status after creation
      setStatus({
        has_completed_onboarding: true,
        onboarding_data: result
      });
      
      // IMPORTANT: Refresh user data to update has_completed_onboarding flag
      try {
        const updatedUser = await authService.getCurrentUser();
        setUser(updatedUser);
      } catch (userError) {
        console.error('Failed to refresh user data after onboarding:', userError);
        // Don't fail the whole operation if user refresh fails
      }
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create onboarding data');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const getOnboardingStatus = useCallback(async (): Promise<OnboardingStatus | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await onboardingService.getOnboardingStatus();
      setStatus(result);
      
      if (result.onboarding_data) {
        setOnboardingData(result.onboarding_data);
      }
      
      return result;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to get onboarding status');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOnboarding = useCallback(async (): Promise<OnboardingData | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await onboardingService.getOnboarding();
      setOnboardingData(result);
      
      return result;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to get onboarding data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOnboarding = useCallback(async (data: OnboardingUpdate): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await onboardingService.updateOnboarding(data);
      setOnboardingData(result);
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update onboarding data');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOnboardingOptions = useCallback(async (): Promise<OnboardingOptions | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await onboardingService.getOnboardingOptions();
      setOptions(result);
      
      return result;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to get onboarding options');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    onboardingData,
    status,
    options,
    
    // Actions
    createOnboarding,
    getOnboardingStatus,
    getOnboarding,
    updateOnboarding,
    getOnboardingOptions,
    clearError
  };
}; 