import { UploadHistory } from '../types'
import uploadsData from '../data/uploads.json'

// Mock service for upload history
export const uploadService = {
  getUploadHistory: (): UploadHistory[] => {
    return uploadsData as UploadHistory[]
  },

  getAllUploads: (): UploadHistory[] => {
    return uploadsData as UploadHistory[]
  },

  getUploadById: (id: string): UploadHistory | undefined => {
    const uploads = uploadsData as UploadHistory[]
    return uploads.find(u => u.id === id)
  },

  getSuccessfulUploads: (): UploadHistory[] => {
    const uploads = uploadsData as UploadHistory[]
    return uploads.filter(u => u.status === 'success')
  },

  getFailedUploads: (): UploadHistory[] => {
    const uploads = uploadsData as UploadHistory[]
    return uploads.filter(u => u.status === 'error')
  },

  getStats: () => {
    const uploads = uploadsData as UploadHistory[]
    return {
      total: uploads.length,
      successful: uploads.filter(u => u.status === 'success').length,
      failed: uploads.filter(u => u.status === 'error').length,
      totalEndpoints: uploads.reduce((sum, u) => sum + u.endpoints, 0),
      totalRisks: uploads.reduce((sum, u) => sum + u.risks, 0)
    }
  },

  // Simulate adding a new upload
  addUpload: (upload: Omit<UploadHistory, 'id'>): UploadHistory => {
    const uploads = uploadsData as UploadHistory[]
    const newId = (parseInt(uploads[uploads.length - 1]?.id || '0') + 1).toString()
    const newUpload: UploadHistory = {
      id: newId,
      ...upload
    }
    uploads.push(newUpload)
    return newUpload
  },

  // Simulate deleting an upload
  deleteUpload: (id: string): boolean => {
    const uploads = uploadsData as UploadHistory[]
    const index = uploads.findIndex(u => u.id === id)
    if (index !== -1) {
      uploads.splice(index, 1)
      return true
    }
    return false
  }
}
