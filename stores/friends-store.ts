 import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface FriendsState {
  friends: User[];
  loading: boolean;
  setFriends: (friends: User[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  loading: true,
  setFriends: (friends) => set({ friends }),
  setLoading: (loading) => set({ loading })
}));