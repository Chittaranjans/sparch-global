// Simple state management using React Context
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  userId: string;
  resumeText: string;
  setUserId: (id: string) => void;
  setResumeText: (text: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: 'user123', // Default user ID
      resumeText: '',
      setUserId: (id) => set({ userId: id }),
      setResumeText: (text) => set({ resumeText: text }),
    }),
    {
      name: 'user-storage',
    }
  )
);
