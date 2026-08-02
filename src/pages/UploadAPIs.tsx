import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, XCircle, Clock, Trash2, RefreshCw, AlertCircle, X, Shield, AlertTriangle, MoreVertical, Download, Copy, Edit2, Eye } from 'lucide-react'
import { uploadService } from '../services/uploadService'
import { uploadApi } from '../services/uploadApi'
import { simulateUpload, toLegacySpec, formatFileSize } from '../utils/openapiParser'
import { analyzeSecurityWithRisk } from '../utils/securityAnalyzer'
import { generateDependencyGraph } from '../utils/dependencyGraphGenerator'
import { useUploads } from '../context/UploadContext'
import { useNotifications } from '../context/NotificationContext'
import type { Page } from '../App'

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18 }

export default function UploadAPIs({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const history = uploadService.getAllUploads()
  const [historyFiles, setHistoryFiles] = useState(history)
  const { uploadedSpecs, addUploadedSpec, removeUploadedSpec, setSecurityResult, setDependencyGraph } = useUploads()
  const { addNotification } = useNotifications()
  const [drag, setDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploaded, setUploaded] = useState(false)
  const [currentFile, setCurrentFile] = useState<string>('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [parsedResult, setParsedResult] = useState<any>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setCurrentFile(file.name)
    setUploadError(null)
    setValidationErrors([])
    setParsedResult(null)
    setUploading(true)
    setProgress(0)
    setUploaded(false)

    // Validate file extension
    const validExtensions = ['.yaml', '.yml', '.json']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validExtensions.includes(fileExt)) {
      setUploading(false)
      setUploadError('Invalid file format. Only .yaml, .yml, and .json files are allowed.')
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'Invalid File Format',
        message: 'Only OpenAPI (YAML/JSON) and Swagger files are supported'
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploading(false)
      setUploadError('File too large. Maximum size is 10MB.')
      addNotification({
        category: 'general',
        priority: 'high',
        title: 'File Too Large',
        message: 'Maximum file size is 10MB'
      })
      return
    }

    try {
      // Try to upload to backend
      const uploadData = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        file: file
      }
      
      const result = await uploadApi.uploadSpec(uploadData)
      
      setUploading(false)
      setUploaded(true)
      
      // Create a minimal compatible spec object
      const fileSize = formatFileSize(file.size)
      const legacySpec = {
        id: result.id.toString(),
        name: result.name,
        size: result.size,
        uploadedAt: result.uploadedAt,
        status: (result.status === 'analyzed' ? 'success' : 'error') as 'success' | 'error',
        endpoints: result.endpoints_count,
        risks: result.risks,
        version: '1.0.0',
        methods: ['GET', 'POST'],
        schemas: [],
        authentication: [],
        servers: 1,
        tags: [],
        parsed: { openapi: '3.0.0', info: { title: result.name, version: '1.0.0' }, paths: {} },
        fileSize: fileSize
      }
      
      setParsedResult(legacySpec)
      addUploadedSpec(legacySpec)
      
      addNotification({
        category: 'upload_complete',
        priority: 'normal',
        title: 'API Specification Uploaded',
        message: `${legacySpec.name} has been successfully analyzed with ${legacySpec.endpoints} endpoints`,
        actionUrl: 'security-analysis',
        actionLabel: 'View Analysis'
      })
      
    } catch (error) {
      // Upload to real backend
      setUploading(false)
      simulateUpload(
        file,
        (prog) => setProgress(prog),
        (result) => {
          setUploading(false)
          setUploaded(true)
          
          const fileSize = formatFileSize(file.size)
          const legacySpec = toLegacySpec(result, file.name, fileSize)
          setParsedResult(legacySpec)
          
          if (!result.success) {
            setValidationErrors(result.errors.map(e => e.message))
          } else {
            addUploadedSpec(legacySpec)
            
            if (result.spec && result.spec.raw) {
              const securityResult = analyzeSecurityWithRisk(result.spec.raw, legacySpec.id)
              setSecurityResult(legacySpec.id, securityResult)
              
              const dependencyGraph = generateDependencyGraph(result.spec.raw)
              setDependencyGraph(legacySpec.id, dependencyGraph)
            }
            
            addNotification({
              category: 'upload_complete',
              priority: 'normal',
              title: 'API Specification Uploaded',
              message: `${legacySpec.name} has been successfully analyzed with ${legacySpec.endpoints} endpoints`,
              actionUrl: 'security-analysis',
              actionLabel: 'View Analysis'
            })
          }
        },
        (error) => {
          setUploading(false)
          setUploadError(error)
        }
      )
    }
  }

  const handleOpen = (fileId: string) => {
    onNavigate('security-analysis')
  }

  const handleRename = (fileId: string, currentName: string) => {
    setRenameValue(currentName)
    setShowRenameDialog(true)
  }

  const confirmRename = () => {
    if (renameValue.trim() && deleteTarget) {
      // Update the spec name in context
      const spec = uploadedSpecs.find(s => s.id === deleteTarget)
      if (spec) {
        // In a real app, this would call an API
        addNotification({
          category: 'general',
          priority: 'normal',
          title: 'Specification Renamed',
          message: `Renamed to ${renameValue}`
        })
      }
      setShowRenameDialog(false)
      setRenameValue('')
      setDeleteTarget(null)
    }
  }

  const handleDownload = (fileId: string, fileName: string) => {
    // In a real app, this would download the actual file
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'Download Started',
      message: `Downloading ${fileName}`
    })
  }

  const handleReanalyze = (fileId: string) => {
    const spec = uploadedSpecs.find(s => s.id === fileId)
    if (spec) {
      // Re-run security analysis
      const securityResult = analyzeSecurityWithRisk(spec, spec.id)
      setSecurityResult(spec.id, securityResult)
      
      // Re-generate dependency graph
      const dependencyGraph = generateDependencyGraph(spec)
      setDependencyGraph(spec.id, dependencyGraph)
      
      addNotification({
        category: 'scan_finished',
        priority: 'normal',
        title: 'Re-analysis Complete',
        message: `${spec.name} has been re-analyzed`,
        actionUrl: 'security-analysis',
        actionLabel: 'View Results'
      })
    }
  }

  const handleDuplicate = (fileId: string) => {
    const spec = uploadedSpecs.find(s => s.id === fileId)
    if (spec) {
      const duplicate = {
        ...spec,
        id: `${spec.id}-copy-${Date.now()}`,
        name: `${spec.name} (Copy)`
      }
      addUploadedSpec(duplicate)
      
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Specification Duplicated',
        message: `Created copy of ${spec.name}`
      })
    }
  }

  const handleGenerateReport = (fileId: string, fileName: string) => {
    // Navigate to Reports page to generate report
    onNavigate('reports')
    addNotification({
      category: 'general',
      priority: 'normal',
      title: 'Report Generation',
      message: `Navigate to Reports to generate report for ${fileName}`
    })
  }

  const handleDelete = (fileId: string) => {
    setDeleteTarget(fileId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        // Try to delete from backend if it's a numeric ID (from backend)
        const specId = parseInt(deleteTarget)
        if (!isNaN(specId)) {
          await uploadApi.deleteSpec(specId)
        }
      } catch (error) {
        // Ignore backend errors and proceed with local deletion
        console.error('Backend delete failed:', error)
      }
      
      removeUploadedSpec(deleteTarget)
      setHistoryFiles(historyFiles.filter(f => f.id !== deleteTarget))
      
      addNotification({
        category: 'general',
        priority: 'normal',
        title: 'Specification Deleted',
        message: 'API specification has been removed'
      })
      
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const resetUpload = () => {
    setUploaded(false)
    setProgress(0)
    setCurrentFile('')
    setUploadError(null)
    setValidationErrors([])
    setParsedResult(null)
  }

  const allFiles = [...uploadedSpecs, ...history] as Array<{
    id: string
    name: string
    size: string
    uploadedAt: string
    status: 'success' | 'error'
    endpoints: number
    risks?: number
  }>

  return (
    <div className="p-6 space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-[22px] font-700 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Upload Specification</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Import OpenAPI or Swagger specifications for analysis.</p>
      </div>

      <div style={card} className="p-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={handleBrowse}
          className="flex flex-col items-center py-16 rounded-[14px] border-2 border-dashed cursor-pointer transition-all"
          style={{ borderColor: drag ? 'var(--brand)' : 'var(--border)', background: drag ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'var(--bg-secondary)' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-[12px] flex items-center justify-center mb-4" style={{ background: drag ? 'var(--brand)' : 'color-mix(in srgb, var(--brand) 14%, transparent)' }}>
            <Upload size={24} style={{ color: drag ? 'var(--brand-text)' : 'var(--brand)' }} />
          </div>
          <p className="text-[15px] font-600" style={{ color: 'var(--text-primary)' }}>{drag ? 'Drop to upload' : 'Drag & drop your API spec'}</p>
          <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
            or <span style={{ color: 'var(--brand)' }} className="font-500 cursor-pointer">browse files</span>
          </p>
          <div className="flex items-center gap-2 mt-5">
            {['OpenAPI 3.x YAML', 'OpenAPI 3.x JSON', 'Swagger 2.0 JSON'].map((t) => (
              <div key={t} className="text-[11px] px-2.5 py-1.5 rounded-[6px] border flex items-center gap-1.5" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <FileText size={10} />{t}
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>Max file size: 10 MB</p>
        </div>

        {uploading && (
          <div className="mt-5 p-4 rounded-[12px] border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--brand)' }} />
                <span className="text-[13px] font-500" style={{ color: 'var(--text-primary)' }}>Uploading {currentFile || 'api-spec.yaml'}</span>
              </div>
              <span className="text-[12px] font-600" style={{ color: 'var(--brand)' }}>{progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-100" style={{ width: `${progress}%`, background: 'var(--brand)' }} />
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mt-5 p-4 rounded-[12px] border flex items-start gap-3" style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--error) 30%, transparent)' }}>
            <XCircle size={15} className="mt-0.5" style={{ color: 'var(--error)' }} />
            <div className="flex-1">
              <p className="text-[13px] font-600" style={{ color: 'var(--error)' }}>Upload failed</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--error)', opacity: 0.8 }}>{uploadError}</p>
            </div>
            <button onClick={resetUpload} className="p-1 rounded-[6px] transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {uploaded && !uploading && parsedResult && (
          <>
            {parsedResult.status === 'success' ? (
              <div className="mt-5 p-4 rounded-[12px] border flex items-start gap-3" style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)' }}>
                <CheckCircle2 size={15} className="mt-0.5" style={{ color: 'var(--success)' }} />
                <div className="flex-1">
                  <p className="text-[13px] font-600" style={{ color: 'var(--success)' }}>Upload successful</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--success)', opacity: 0.8 }}>
                    {parsedResult.name} v{parsedResult.version} analyzed — {parsedResult.endpoints} endpoints, {Math.ceil(parsedResult.endpoints / 10)} risks detected.
                  </p>
                </div>
                <button onClick={resetUpload} className="p-1 rounded-[6px] transition-colors" style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="mt-5 p-4 rounded-[12px] border flex items-start gap-3" style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--error) 30%, transparent)' }}>
                <XCircle size={15} className="mt-0.5" style={{ color: 'var(--error)' }} />
                <div className="flex-1">
                  <p className="text-[13px] font-600" style={{ color: 'var(--error)' }}>Validation failed</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--error)', opacity: 0.8 }}>{parsedResult.errors?.length} error(s) found</p>
                </div>
                <button onClick={resetUpload} className="p-1 rounded-[6px] transition-colors" style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="mt-3 p-4 rounded-[12px] border" style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)' }}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={13} className="mt-0.5" style={{ color: 'var(--warning)' }} />
                  <div className="flex-1">
                    <p className="text-[11px] font-600 mb-1.5" style={{ color: 'var(--warning)' }}>Validation errors ({validationErrors.length})</p>
                    {validationErrors.map((error, i) => (
                      <p key={i} className="text-[11px] font-mono" style={{ color: 'var(--warning)', opacity: 0.8 }}>{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {parsedResult.status === 'success' && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="p-3 rounded-[10px] border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Endpoints</p>
                  <p className="text-[16px] font-700 mt-0.5" style={{ color: 'var(--text-primary)' }}>{parsedResult.endpoints}</p>
                </div>
                <div className="p-3 rounded-[10px] border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Methods</p>
                  <p className="text-[16px] font-700 mt-0.5" style={{ color: 'var(--text-primary)' }}>{parsedResult.methods.length}</p>
                </div>
                <div className="p-3 rounded-[10px] border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Schemas</p>
                  <p className="text-[16px] font-700 mt-0.5" style={{ color: 'var(--text-primary)' }}>{parsedResult.schemas.length}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[14px] font-600" style={{ color: 'var(--text-primary)', fontFamily: 'Alegreya, serif' }}>Upload History</h2>
        </div>
        <div>
          {allFiles.map((f) => (
            <div key={f.id} className="flex items-center gap-4 px-5 py-4 border-b transition-colors relative"
              style={{ borderColor: 'var(--border-subtle)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0 cursor-pointer"
                style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)' }}
                onClick={() => handleOpen(f.id)}
              >
                <FileText size={15} style={{ color: 'var(--brand)' }} />
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpen(f.id)}>
                <div className="text-[13px] font-500 truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{f.size}</span>
                  <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Clock size={9} />{f.uploadedAt}</span>
                  {f.status === 'success' && <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{f.endpoints} endpoints</span>}
                  {f.risks && f.risks > 0 && (
                    <span className="text-[10px] font-500 px-1.5 py-0.5 rounded-[4px]" style={{ color: 'var(--error)', background: 'color-mix(in srgb, var(--error) 14%, transparent)' }}>{f.risks} risks</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {f.status === 'success' && <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />}
                {f.status === 'error' && <XCircle size={14} style={{ color: 'var(--error)' }} />}
                <span className="text-[11px] font-500" style={{ color: f.status === 'success' ? 'var(--success)' : 'var(--error)' }}>
                  {f.status === 'success' ? 'Analyzed' : 'Failed'}
                </span>
                
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === f.id ? null : f.id)}
                    className="ml-2 p-1.5 rounded-[6px] transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                  >
                    <MoreVertical size={13} />
                  </button>
                  
                  {activeMenu === f.id && (
                    <div className="absolute top-full right-0 mt-1 w-48 rounded-[10px] border shadow-lg z-10" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      <button
                        onClick={() => { handleOpen(f.id); setActiveMenu(null) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <Eye size={14} />
                        <span className="text-[12px] font-500">Open</span>
                      </button>
                      
                      <button
                        onClick={() => { handleRename(f.id, f.name); setActiveMenu(null) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <Edit2 size={14} />
                        <span className="text-[12px] font-500">Rename</span>
                      </button>
                      
                      <button
                        onClick={() => { handleDownload(f.id, f.name); setActiveMenu(null) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <Download size={14} />
                        <span className="text-[12px] font-500">Download</span>
                      </button>
                      
                      {f.status === 'success' && (
                        <button
                          onClick={() => { handleGenerateReport(f.id, f.name); setActiveMenu(null) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <Download size={14} />
                          <span className="text-[12px] font-500">Generate Report</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => { handleReanalyze(f.id); setActiveMenu(null) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <RefreshCw size={14} />
                        <span className="text-[12px] font-500">Re-analyze</span>
                      </button>
                      
                      <button
                        onClick={() => { handleDuplicate(f.id); setActiveMenu(null) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--brand) 8%, transparent)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <Copy size={14} />
                        <span className="text-[12px] font-500">Duplicate</span>
                      </button>
                      
                      <div className="border-t my-1" style={{ borderColor: 'var(--border-subtle)' }} />
                      
                      <button
                        onClick={() => { handleDelete(f.id); setActiveMenu(null) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                        style={{ color: 'var(--error)' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--error) 8%, transparent)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <Trash2 size={14} />
                        <span className="text-[12px] font-500">Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-[12px] border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-600 mb-4" style={{ color: 'var(--text-primary)' }}>Rename Specification</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] text-[12px] border mb-4"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmRename}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-600 transition-colors"
                style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
              >
                Rename
              </button>
              <button
                onClick={() => { setShowRenameDialog(false); setRenameValue('') }}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-[12px] border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-600 mb-2" style={{ color: 'var(--text-primary)' }}>Delete Specification</h3>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this API specification? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-600 transition-colors"
                style={{ background: 'var(--error)', color: 'white' }}
              >
                Delete
              </button>
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteTarget(null) }}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-500 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
