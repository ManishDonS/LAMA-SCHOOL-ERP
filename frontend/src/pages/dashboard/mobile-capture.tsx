import React, { useState } from 'react'
import { useRouter } from 'next/router'

export default function MobileCapturePage() {
    const router = useRouter()
    const { id, name, session } = router.query
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploaded, setUploaded] = useState(false)
    const [status, setStatus] = useState('')

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

    const handleUpload = async () => {
        if (!session || typeof session !== 'string') {
            alert("No session ID found. Please rescan the QR code.")
            return
        }

        setStatus('Connecting to desktop...')
        const { Peer } = await import('peerjs')
        const peer = new Peer()

        peer.on('open', () => {
            const conn = peer.connect(session)

            conn.on('open', () => {
                setStatus('Sending photo...')
                conn.send({ image: previewUrl })
                setUploaded(true)
                setTimeout(() => {
                    // Optional: close peers
                    peer.destroy()
                }, 2000)
            })

            conn.on('error', (err) => {
                alert("Connection failed: " + err)
                setStatus('Failed')
            })
        })
    }

    if (uploaded) {
        return (
            <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm animate-bounce">
                    ✅
                </div>
                <h1 className="text-2xl font-bold text-green-800 mb-2">Photo Uploaded!</h1>
                <p className="text-green-700">
                    Success! The photo for {name || 'Student'} has been sent to the dashboard.
                </p>
                <p className="text-sm text-green-600 mt-8">You can close this window now.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-center">
                    <h1 className="text-xl font-bold text-white">Upload Student Photo</h1>
                    {name && <p className="text-blue-100 text-sm mt-1">For: {name}</p>}
                </div>

                <div className="p-8 flex flex-col items-center gap-6">
                    {previewUrl ? (
                        <div className="space-y-6 w-full text-center">
                            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPreviewUrl(null)}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={handleUpload}
                                    className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                                >
                                    Upload
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full">
                            <label className="block w-full cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl p-10 text-center hover:bg-blue-50 transition-colors">
                                    <div className="text-5xl mb-4">📸</div>
                                    <span className="block text-blue-800 font-semibold text-lg">Tap to Take Photo</span>
                                    <span className="block text-blue-400 text-xs mt-2">or select from gallery</span>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-8 text-xs text-gray-400 text-center">
                LAMA School ERP • Secure Upload
            </p>
        </div>
    )
}
