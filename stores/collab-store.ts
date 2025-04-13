// stores/collab-store.ts
import { create } from 'zustand';

interface CollabState {
  realTimeRequests: any[];
  sentRequests: Set<string>;
  rejectedReceivers: Set<string>;
  setRealTimeRequests: (requests: any[]) => void;
  addSentRequest: (id: string) => void;
  removeSentRequest: (id: string) => void;
  addRejectedReceiver: (id: string) => void;
}

export const useCollabStore = create<CollabState>((set) => ({
  realTimeRequests: [],
  sentRequests: new Set(),
  rejectedReceivers: new Set(),
  
  setRealTimeRequests: (requests) => set({ realTimeRequests: requests }),
  addSentRequest: (id) => set((state) => ({
    sentRequests: new Set([...state.sentRequests, id])
  })),
  removeSentRequest: (id) => set((state) => {
    const newSet = new Set(state.sentRequests);
    newSet.delete(id);
    return { sentRequests: newSet };
  }),
  addRejectedReceiver: (id) => set((state) => ({
    rejectedReceivers: new Set([...state.rejectedReceivers, id])
  })),
}));