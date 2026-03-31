import { useContext } from 'react';
import { ReputationContext } from './ReputationContext';

export const useReputation = () => {
  const context = useContext(ReputationContext);
  if (!context) {
    throw new Error('useReputation must be used within a ReputationProvider');
  }
  return context;
};
