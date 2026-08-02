import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Workspace, WorkspaceSettings, CreateWorkspaceInput, WorkspaceMember } from '../types/workspace'

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace) => void
  createWorkspace: (input: CreateWorkspaceInput) => Workspace
  updateWorkspace: (id: string, settings: Partial<WorkspaceSettings>) => void
  deleteWorkspace: (id: string) => void
  getRecentWorkspaces: () => Workspace[]
  getWorkspaceMembers: (id: string) => WorkspaceMember[]
  addWorkspaceMember: (workspaceId: string, email: string, role: 'admin' | 'member' | 'viewer') => void
  removeWorkspaceMember: (workspaceId: string, memberId: string) => void
  isWorkspaceDropdownOpen: boolean
  setWorkspaceDropdownOpen: (open: boolean) => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

// Mock initial workspaces
const initialWorkspaces: Workspace[] = [
  {
    id: '1',
    name: 'Acme Corp',
    color: '#3B82F6',
    memberCount: 12,
    apiCount: 45,
    isOwner: true,
    role: 'owner',
    createdAt: '2024-01-15T10:00:00Z',
    lastAccessed: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Tech Startup Inc',
    color: '#10B981',
    memberCount: 5,
    apiCount: 18,
    isOwner: true,
    role: 'owner',
    createdAt: '2024-02-20T14:30:00Z',
    lastAccessed: '2024-06-15T09:00:00Z'
  },
  {
    id: '3',
    name: 'Enterprise Solutions',
    color: '#8B5CF6',
    memberCount: 28,
    apiCount: 120,
    isOwner: false,
    role: 'admin',
    createdAt: '2024-03-10T11:00:00Z',
    lastAccessed: '2024-06-10T16:45:00Z'
  }
]

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const stored = localStorage.getItem('apiradx-workspaces')
    return stored ? JSON.parse(stored) : initialWorkspaces
  })
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(() => {
    const stored = localStorage.getItem('apiradx-current-workspace')
    return stored ? JSON.parse(stored) : initialWorkspaces[0]
  })
  const [isWorkspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('apiradx-workspaces', JSON.stringify(workspaces))
  }, [workspaces])

  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('apiradx-current-workspace', JSON.stringify(currentWorkspace))
    }
  }, [currentWorkspace])

  const createWorkspace = (input: CreateWorkspaceInput): Workspace => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: input.name,
      color: input.color,
      memberCount: 1,
      apiCount: 0,
      isOwner: true,
      role: 'owner',
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }
    
    setWorkspaces(prev => [newWorkspace, ...prev])
    setCurrentWorkspace(newWorkspace)
    return newWorkspace
  }

  const updateWorkspace = (id: string, settings: Partial<WorkspaceSettings>) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === id 
        ? { ...ws, name: settings.name || ws.name, lastAccessed: new Date().toISOString() }
        : ws
    ))
    
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(prev => prev ? { ...prev, name: settings.name || prev.name } : null)
    }
  }

  const deleteWorkspace = (id: string) => {
    setWorkspaces(prev => prev.filter(ws => ws.id !== id))
    
    if (currentWorkspace?.id === id) {
      const remaining = workspaces.filter(ws => ws.id !== id)
      setCurrentWorkspace(remaining.length > 0 ? remaining[0] : null)
    }
  }

  const getRecentWorkspaces = (): Workspace[] => {
    return [...workspaces]
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 5)
  }

  const getWorkspaceMembers = (id: string): WorkspaceMember[] => {
    // Mock members - in real app this would come from API
    return [
      {
        id: '1',
        name: 'Jordan Davis',
        email: 'jordan@acme.com',
        role: 'owner',
        joinedAt: '2024-01-15T10:00:00Z',
        lastActive: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Sarah Chen',
        email: 'sarah@acme.com',
        role: 'admin',
        joinedAt: '2024-02-01T09:00:00Z',
        lastActive: '2024-06-18T14:30:00Z'
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@acme.com',
        role: 'member',
        joinedAt: '2024-03-15T11:00:00Z',
        lastActive: '2024-06-17T16:00:00Z'
      }
    ]
  }

  const addWorkspaceMember = (workspaceId: string, email: string, role: 'admin' | 'member' | 'viewer') => {
    // In real app, this would call API
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId 
        ? { ...ws, memberCount: ws.memberCount + 1 }
        : ws
    ))
  }

  const removeWorkspaceMember = (workspaceId: string, memberId: string) => {
    // In real app, this would call API
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId 
        ? { ...ws, memberCount: Math.max(0, ws.memberCount - 1) }
        : ws
    ))
  }

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      getRecentWorkspaces,
      getWorkspaceMembers,
      addWorkspaceMember,
      removeWorkspaceMember,
      isWorkspaceDropdownOpen,
      setWorkspaceDropdownOpen
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider')
  }
  return context
}
