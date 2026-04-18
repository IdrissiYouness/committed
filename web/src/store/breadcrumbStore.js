import { create } from 'zustand';

const useBreadcrumbStore = create((set) => ({
  labels: {},

  setLabel: (segment, label) => 
    set((state) => ({
      labels: {
        ...state.labels,
        [segment]: label
      }
    })),

  clearLabels: () => set({ labels: {} })
}));

export default useBreadcrumbStore;