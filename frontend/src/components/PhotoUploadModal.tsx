import React, { useState, useRef, useEffect } from 'react'

interface PhotoUploadModalProps {
    isOpen: boolean
    onClose: () => void
    onUpload: (photoDataUrl: string) => void
    studentId: number
    studentName: string
}

export default function PhotoUploadModal({ isOpen, onClose, onUpload, studentId, studentName }: PhotoUploadModalProps) {
    const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'mobile'>('upload')
    const [stream, setStream] = useState<MediaStream | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Camera handling
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            alert("Could not access camera. Please allow camera permissions.")
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            const context = canvas.getContext('2d')
            if (context) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                context.drawImage(video, 0, 0, canvas.width, canvas.height)
                const dataUrl = canvas.toDataURL('image/jpeg')
                setPreviewUrl(dataUrl)
                stopCamera()
            }
        }
    }

    // File handling
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = () => {
        if (previewUrl) {
            onUpload(previewUrl)
            onClose()
        }
    }

    // Cleanup on unmount or close
    useEffect(() => {
        if (!isOpen) {
            stopCamera()
            setPreviewUrl(null)
            setActiveTab('upload')
        }
    }, [isOpen])

    // Mobile Link Logic
    const [host, setHost] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname
            // Smart Default: If on localhost, suggest the usage of the specific LAN IP detected during dev
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                setHost('192.168.20.11')
            } else {
                setHost(hostname)
            }
        }
    }, [])

    // PeerJS Logic
    const [peerId, setPeerId] = useState('')
    const [connectionStatus, setConnectionStatus] = useState('Initializing...')

    useEffect(() => {
        let peer: any

        if (activeTab === 'mobile') {
            const initPeer = async () => {
                const { Peer } = await import('peerjs')
                // Create a random ID for this session
                const id = `school-erp-${Math.random().toString(36).substr(2, 9)}`
                setPeerId(id)

                peer = new Peer(id)

                peer.on('open', (id: string) => {
                    setConnectionStatus('Ready to pair')
                })

                peer.on('connection', (conn: any) => {
                    setConnectionStatus('Device connected!')
                    conn.on('data', (data: any) => {
                        if (data && data.image) {
                            onUpload(data.image)
                            onClose()
                        }
                    })
                })

                peer.on('error', (err: any) => {
                    console.error('PeerJS Error:', err)
                    setConnectionStatus('Connection Error')
                })
            }
            initPeer()
        }

        return () => {
            if (peer) peer.destroy()
        }
    }, [activeTab])

    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
    const port = typeof window !== 'undefined' ? window.location.port : ''
    const fullPort = port ? `:${port}` : ''
    const mobileLink = `${protocol}//${host}${fullPort}/dashboard/mobile-capture?id=${studentId}&name=${encodeURIComponent(studentName)}&session=${peerId}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileLink)}`

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Update Profile Photo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => { setActiveTab('upload'); stopCamera(); setPreviewUrl(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        📁 Upload File
                    </button>
                    <button
                        onClick={() => { setActiveTab('camera'); startCamera(); setPreviewUrl(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'camera' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        📸 Take Photo
                    </button>
                    <button
                        onClick={() => { setActiveTab('mobile'); stopCamera(); setPreviewUrl(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'mobile' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        📱 From Mobile
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[320px] flex flex-col items-center justify-center bg-white">

                    {/* Preview (if image selected/captured) */}
                    {previewUrl && activeTab !== 'mobile' ? (
                        <div className="space-y-4 text-center w-full">
                            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-100 group">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setPreviewUrl(null); if (activeTab === 'camera') startCamera(); }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium"
                                >
                                    Retake
                                </button>
                            </div>
                            <div className="flex justify-center gap-3">
                                <button onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-200">
                                    Save Photo
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Upload Tab */}
                            {activeTab === 'upload' && (
                                <div className="text-center w-full">
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
                                        />
                                        <div className="text-6xl mb-4">☁️</div>
                                        <h3 className="text-lg font-medium text-gray-700 mb-2">Drag & Drop or Click to Upload</h3>
                                        <p className="text-sm text-gray-400">Supports JPG, PNG, WEBP</p>
                                    </div>
                                </div>
                            )}

                            {/* Camera Tab */}
                            {activeTab === 'camera' && (
                                <div className="text-center w-full relative">
                                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-md mx-auto shadow-inner">
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                                        <canvas ref={canvasRef} className="hidden"></canvas>
                                    </div>
                                    <button
                                        onClick={capturePhoto}
                                        className="mt-6 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold shadow-lg shadow-red-200 flex items-center gap-2 mx-auto"
                                    >
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                        Capture
                                    </button>
                                </div>
                            )}

                            {/* Mobile Tab */}
                            {activeTab === 'mobile' && (
                                <div className="text-center w-full space-y-6">
                                    <div className="bg-white p-2 inline-block rounded-xl border border-gray-200 shadow-sm">
                                        <img src={qrCodeUrl} alt="Scan QR Code" className="w-48 h-48 block" />
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">Scan to Upload</h3>
                                            <p className="text-sm rounded-full px-3 py-1 bg-gray-100 inline-block text-gray-600 mb-2">
                                                Status: <span className={connectionStatus.includes('connected') ? 'text-green-600 font-bold' : 'text-blue-600'}>{connectionStatus}</span>
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                                Use your phone's camera to scan the code.
                                                <br />
                                                <span className="text-xs text-orange-500">Note: Ensure your phone is on the same network.</span>
                                            </p>
                                        </div>

                                        {/* IP Configuration (Helper for Dev) */}
                                        <div className="flex items-center justify-center gap-2 text-sm">
                                            <span className="text-gray-500">Host IP:</span>
                                            <input
                                                type="text"
                                                value={host}
                                                onChange={(e) => setHost(e.target.value)}
                                                className="border rounded px-2 py-1 w-32 text-center text-gray-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="e.g. 192.168.1.5"
                                            />
                                        </div>

                                        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-100 inline-block text-left max-w-md break-all">
                                            <strong>Link:</strong> <a href={mobileLink} target="_blank" rel="noopener noreferrer" className="font-mono text-xs hover:underline">{mobileLink}</a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
