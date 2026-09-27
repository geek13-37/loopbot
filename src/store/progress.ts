import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressState {
  done: Record<string, boolean>
  markDone: (lessonId: string) => void
  reset: () => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      done: {},
      markDone: (id) => set((s) => ({ done: { ...s.done, [id]: true } })),
      reset: () => set({ done: {} }),
    }),
    { name: 'loopbot-progress' },
  ),
)
