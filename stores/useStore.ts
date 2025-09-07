import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Projet, Demande, Article, Notification, HistoryEntry } from "@/types"

interface AppState {
  // Auth
  currentUser: User | null
  isAuthenticated: boolean
  token: string | null

  // Data
  users: User[]
  projets: Projet[]
  demandes: Demande[]
  articles: Article[]
  notifications: Notification[]
  history: HistoryEntry[]

  // UI State
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loadUsers: () => Promise<void>
  loadProjets: () => Promise<void>
  loadDemandes: (filters?: any) => Promise<void>
  loadArticles: (filters?: any) => Promise<void>
  loadNotifications: () => Promise<void>
  loadHistory: (filters?: any) => Promise<void>
  createUser: (userData: Partial<User>) => Promise<boolean>
  createProjet: (projetData: Partial<Projet>) => Promise<boolean>
  createDemande: (demandeData: Partial<Demande>) => Promise<boolean>
  executeAction: (demandeId: string, action: string, data?: any) => Promise<boolean>
  markNotificationAsRead: (id: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setDemandes: (demandes: Demande[]) => void
  setArticles: (articles: Article[]) => void
  addDemande: (demande: Demande) => void
  updateDemande: (id: string, demande: Demande) => void
  addNotification: (notification: Notification) => void
  addHistoryEntry: (entry: HistoryEntry) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      token: null,
      users: [],
      projets: [],
      demandes: [],
      articles: [],
      notifications: [],
      history: [],
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          })

          const result = await response.json()

          if (result.success) {
            set({
              currentUser: result.data.user,
              token: result.data.token,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur de connexion:", error)
          set({ error: "Erreur de connexion", isLoading: false })
          return false
        }
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          token: null,
          users: [],
          projets: [],
          demandes: [],
          notifications: [],
          history: [],
        })
      },

      loadUsers: async () => {
        const { currentUser, token } = get()
        if (!currentUser || !token) {
          console.warn("Tentative de chargement des utilisateurs sans utilisateur connecté")
          return
        }

        try {
          const response = await fetch("/api/users", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            set({ users: result.data })
          } else {
            console.error("Erreur API users:", result.error)
            set({ error: result.error })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des utilisateurs:", error)
          set({ error: "Erreur lors du chargement des utilisateurs" })
        }
      },

      loadProjets: async () => {
        const { currentUser, token } = get()
        if (!currentUser || !token) {
          console.warn("Tentative de chargement des projets sans utilisateur connecté")
          return
        }

        try {
          console.log("Chargement des projets pour l'utilisateur:", currentUser.id)
          const response = await fetch("/api/projets", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            console.log("Projets chargés:", result.data.length)
            set({ projets: result.data })
          } else {
            console.error("Erreur API projets:", result.error)
            set({ error: result.error })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des projets:", error)
          set({ error: "Erreur lors du chargement des projets" })
        }
      },

      loadDemandes: async (filters = {}) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) {
          console.warn("Tentative de chargement des demandes sans utilisateur connecté")
          return
        }

        try {
          console.log("Chargement des demandes pour l'utilisateur:", currentUser.id)
          const params = new URLSearchParams()
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })

          const response = await fetch(`/api/demandes?${params}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            console.log("Demandes chargées:", result.data.length)
            set({ demandes: result.data })
          } else {
            console.error("Erreur API demandes:", result.error)
            set({ error: result.error })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des demandes:", error)
          set({ error: "Erreur lors du chargement des demandes" })
        }
      },

      loadArticles: async (filters = {}) => {
        const { currentUser } = get()
        if (!currentUser) {
          console.warn("Tentative de chargement des articles sans utilisateur connecté")
          return
        }

        try {
          const params = new URLSearchParams()
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })

          const response = await fetch(`/api/articles?${params}`, {
            headers: {
              "x-user-id": currentUser.id,
            },
          })

          const result = await response.json()
          if (result.success) {
            set({ articles: result.data })
          } else {
            console.error("Erreur API articles:", result.error)
            set({ error: result.error })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des articles:", error)
          set({ error: "Erreur lors du chargement des articles" })
        }
      },

      loadNotifications: async () => {
        const { currentUser } = get()
        if (!currentUser) return

        try {
          const response = await fetch("/api/notifications", {
            headers: {
              "x-user-id": currentUser.id,
            },
          })

          const result = await response.json()
          if (result.success) {
            set({ notifications: result.data })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des notifications:", error)
        }
      },

      loadHistory: async (filters = {}) => {
        const { currentUser } = get()
        if (!currentUser) return

        try {
          const params = new URLSearchParams()
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })

          const response = await fetch(`/api/historique?${params}`, {
            headers: {
              "x-user-id": currentUser.id,
            },
          })

          const result = await response.json()
          if (result.success) {
            set({ history: result.data })
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'historique:", error)
        }
      },

      createUser: async (userData: Partial<User>) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              users: [...state.users, result.data],
              isLoading: false,
            }))
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur création utilisateur:", error)
          set({ error: "Erreur lors de la création de l'utilisateur", isLoading: false })
          return false
        }
      },

      createProjet: async (projetData: Partial<Projet>) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/projets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(projetData),
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              projets: [...state.projets, result.data],
              isLoading: false,
            }))
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur création projet:", error)
          set({ error: "Erreur lors de la création du projet", isLoading: false })
          return false
        }
      },

      createDemande: async (demandeData: Partial<Demande>) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/demandes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(demandeData),
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              demandes: [...state.demandes, result.data],
              isLoading: false,
            }))
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur création demande:", error)
          set({ error: "Erreur lors de la création de la demande", isLoading: false })
          return false
        }
      },

      executeAction: async (demandeId: string, action: string, data = {}) => {
        const { currentUser } = get()
        if (!currentUser) return false

        try {
          const response = await fetch(`/api/demandes/${demandeId}/actions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": currentUser.id,
            },
            body: JSON.stringify({ action, ...data }),
          })

          const result = await response.json()
          if (result.success) {
            // Mettre à jour la demande dans le store
            set((state) => ({
              demandes: state.demandes.map((d) => (d.id === demandeId ? result.data.demande : d)),
              notifications: result.data.notification
                ? [result.data.notification, ...state.notifications]
                : state.notifications,
              history: result.data.historyEntry
                ? [result.data.historyEntry, ...state.history]
                : state.history,
            }))
            return true
          } else {
            set({ error: result.error })
            return false
          }
        } catch (error) {
          console.error("Erreur lors de l'exécution de l'action:", error)
          set({ error: "Erreur lors de l'exécution de l'action" })
          return false
        }
      },

      markNotificationAsRead: async (id: string) => {
        const { currentUser } = get()
        if (!currentUser) return

        try {
          const response = await fetch(`/api/notifications/${id}/read`, {
            method: "PUT",
            headers: {
              "x-user-id": currentUser.id,
            },
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              notifications: state.notifications.map((n) => (n.id === id ? { ...n, lu: true } : n)),
            }))
          }
        } catch (error) {
          console.error("Erreur lors de la mise à jour de la notification:", error)
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setDemandes: (demandes: Demande[]) => set({ demandes }),
      setArticles: (articles: Article[]) => set({ articles }),
      addDemande: (demande: Demande) => set((state) => ({ demandes: [...state.demandes, demande] })),
      updateDemande: (id: string, demande: Demande) =>
        set((state) => ({
          demandes: state.demandes.map((d) => (d.id === id ? demande : d)),
        })),
      addNotification: (notification: Notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),
      addHistoryEntry: (entry: HistoryEntry) =>
        set((state) => ({
          history: [entry, ...state.history],
        })),
    }),
    {
      name: "gestion-demandes-achat-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    },
  ),
)
