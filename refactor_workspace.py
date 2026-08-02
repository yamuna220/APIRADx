import os
import re

def refactor_workspace_context():
    content = """import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Workspace, WorkspaceSettings, CreateWorkspaceInput, WorkspaceMember } from '../types/workspace'
import { authApi } from '../services/authApi'

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace) => void
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace>
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

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null)
  const [isWorkspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false)

  const fetchWorkspaces = async () => {
    try {
        const user = await authApi.getCurrentUser()
        const res = await fetch(`${API_BASE}/api/workspaces`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        if (res.ok) {
            const data = await res.json()
            setWorkspaces(data)
            if (user.active_workspace_id) {
                const active = data.find((w: any) => w.id === user.active_workspace_id)
                if (active) setCurrentWorkspaceState(active)
            } else if (data.length > 0) {
                setCurrentWorkspaceState(data[0])
            }
        }
    } catch(e) {}
  }

  useEffect(() => {
    if (authApi.isAuthenticated()) {
        fetchWorkspaces()
    }
  }, [])

  const setCurrentWorkspace = async (workspace: Workspace) => {
    setCurrentWorkspaceState(workspace)
    try {
        await authApi.updateUser({ active_workspace_id: workspace.id } as any)
        window.location.reload()
    } catch (e) {}
  }

  const createWorkspace = async (input: CreateWorkspaceInput): Promise<Workspace> => {
    const res = await fetch(`${API_BASE}/api/workspaces`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: JSON.stringify(input)
    })
    const newWs = await res.json()
    setWorkspaces(prev => [...prev, newWs])
    setCurrentWorkspace(newWs)
    return newWs
  }

  const updateWorkspace = (id: string, settings: Partial<WorkspaceSettings>) => {}
  const deleteWorkspace = (id: string) => {}
  const getRecentWorkspaces = (): Workspace[] => {
    return workspaces.slice(0, 5)
  }
  const getWorkspaceMembers = (id: string): WorkspaceMember[] => {
    return []
  }
  const addWorkspaceMember = (workspaceId: string, email: string, role: 'admin' | 'member' | 'viewer') => {}
  const removeWorkspaceMember = (workspaceId: string, memberId: string) => {}

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
"""
    with open('src/context/WorkspaceContext.tsx', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    refactor_workspace_context()
    print("WorkspaceContext refactored")
