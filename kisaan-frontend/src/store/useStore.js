import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import localforage from 'localforage'

// Create a custom storage object using localforage for IndexedDB caching
const idbStorage = {
    getItem: async (name) => {
        return (await localforage.getItem(name)) || null
    },
    setItem: async (name, value) => {
        await localforage.setItem(name, value)
    },
    removeItem: async (name) => {
        await localforage.removeItem(name)
    },
}

export const useStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            clearUser: () => set({ user: null, token: null, chats: [], scans: [], points: 0 }),

            weather: null,
            setWeather: (weather) => set({ weather }),

            marketPrices: [],
            setMarketPrices: (prices) => set({ marketPrices: prices }),

            chats: [],
            addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),

            scans: [],
            addScan: (scan) => set((state) => ({ scans: [...state.scans, scan] })),

            points: 0,
            addPoints: (pts) => set((state) => ({ points: state.points + pts })),

            advisoryResult:      null,
            setAdvisoryResult:   (res) => set({ advisoryResult: res }),
            clearAdvisoryResult: () => set({ advisoryResult: null }),
        }),
        {
            name: 'kisaan-storage', // unique name
            storage: createJSONStorage(() => idbStorage), // use localforage
        }
    )
)
