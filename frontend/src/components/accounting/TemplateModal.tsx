import { useState, useEffect } from 'react'

interface Template {
    id: number
    name: string
    description: string
    type: string
}

interface TemplateModalProps {
    onClose: (refresh?: boolean) => void
}

export default function TemplateModal({ onClose }: TemplateModalProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            const response = await fetch('http://localhost:8009/api/v1/templates')
            if (response.ok) {
                const data = await response.json()
                setTemplates(data || [])
            }
        } catch (error) {
            console.error('Error fetching templates:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApply = async () => {
        if (!selectedTemplate) return

        if (!confirm(`Are you sure you want to apply the "${selectedTemplate.name}" template? This will create multiple accounts.`)) {
            return
        }

        setApplying(true)
        try {
            const response = await fetch(`http://localhost:8009/api/v1/templates/${selectedTemplate.id}/apply?school_id=1`, {
                method: 'POST'
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Template applied successfully! Created ${result.accounts_created} accounts.`)
                onClose(true)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to apply template')
            }
        } catch (error) {
            console.error('Error applying template:', error)
            alert('Failed to apply template')
        } finally {
            setApplying(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Select Account Template</h3>
                    <button onClick={() => onClose()} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading templates...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 mb-6 max-h-[60vh] overflow-y-auto">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => setSelectedTemplate(template)}
                                className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedTemplate?.id === template.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{template.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mt-2">
                                            {template.type}
                                        </span>
                                    </div>
                                    {selectedTemplate?.id === template.id && (
                                        <span className="text-blue-600 text-xl">✓</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {templates.length === 0 && (
                            <div className="text-center py-8 text-gray-500">No templates available</div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => onClose()}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedTemplate || applying}
                        className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium
                            ${(!selectedTemplate || applying) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {applying ? 'Applying...' : 'Apply Template'}
                    </button>
                </div>
            </div>
        </div>
    )
}
