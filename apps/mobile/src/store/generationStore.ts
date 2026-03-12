/**
 * Manages the image generation lifecycle during a journal session:
 * - Free generation counter (persisted, no account required for 5 free)
 * - Current image URL (shown as overlay behind text)
 * - Generate / save / reject actions
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_GEN_KEY = 'reverie:free_gen_count';
const MAX_FREE = 5;

interface GenerationState {
  currentImageUrl: string | null;
  currentPrompt: string | null;
  isGenerating: boolean;
  freeGenerationsUsed: number;
  savedImages: string[];  // URLs saved in current session (pre-account)
  error: string | null;

  initialize: () => Promise<void>;
  generateImage: (dreamText: string) => Promise<void>;
  saveCurrentImage: () => void;
  rejectCurrentImage: () => void;
  clearSession: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  currentImageUrl: null,
  currentPrompt: null,
  isGenerating: false,
  freeGenerationsUsed: 0,
  savedImages: [],
  error: null,

  initialize: async () => {
    const stored = await AsyncStorage.getItem(FREE_GEN_KEY);
    set({ freeGenerationsUsed: stored ? parseInt(stored, 10) : 0 });
  },

  generateImage: async (dreamText: string) => {
    const { freeGenerationsUsed } = get();
    if (freeGenerationsUsed >= MAX_FREE) return;

    set({ isGenerating: true, error: null, currentImageUrl: null });

    try {
      const { generationApi } = await import('../services/generationApi');
      const imageUrl = await generationApi.generateImage(dreamText, { isAnonymous: true });

      const newCount = freeGenerationsUsed + 1;
      await AsyncStorage.setItem(FREE_GEN_KEY, String(newCount));

      set({
        currentImageUrl: imageUrl,
        currentPrompt: dreamText,
        freeGenerationsUsed: newCount,
        isGenerating: false,
      });
    } catch (err: any) {
      set({ isGenerating: false, error: err.message ?? 'Generation failed' });
    }
  },

  saveCurrentImage: () => {
    const { currentImageUrl, savedImages } = get();
    if (!currentImageUrl) return;
    set({
      savedImages: [...savedImages, currentImageUrl],
      currentImageUrl: null,
    });
  },

  rejectCurrentImage: () => {
    set({ currentImageUrl: null, currentPrompt: null });
  },

  clearSession: () => {
    set({ currentImageUrl: null, currentPrompt: null, savedImages: [] });
  },
}));
