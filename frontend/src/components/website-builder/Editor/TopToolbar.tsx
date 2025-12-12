import { Save, Undo, Redo, Smartphone, Tablet, Monitor, Settings, Rocket, Code, Sparkles } from 'lucide-react';
import { useRouter } from 'next/router';

interface TopToolbarProps {
    onSave: () => void;
    onPublish: () => void;
    deviceMode: 'desktop' | 'tablet' | 'mobile';
    setDeviceMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
    onToggleAI: () => void;
}

export default function TopToolbar({ onSave, onPublish, deviceMode, setDeviceMode, onToggleAI }: TopToolbarProps) {
    const router = useRouter();

    return (
        <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/website-builder')}
                    className="text-slate-400 hover:text-white font-semibold"
                >
                    ← Exit
                </button>
                <div className="h-6 w-px bg-slate-700"></div>
                <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg" title="Undo">
                        <Undo size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg" title="Redo">
                        <Redo size={18} />
                    </button>
                </div>
                <div className="h-6 w-px bg-slate-700"></div>
                <button
                    onClick={onToggleAI}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    title="AI Assistant"
                >
                    <Sparkles size={18} className="text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">AI Assistant</span>
                </button>
            </div>

            <div className="flex items-center bg-slate-800 rounded-lg p-1">
                <button
                    onClick={() => setDeviceMode('desktop')}
                    className={`p-2 rounded-md transition-colors ${deviceMode === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Desktop View"
                >
                    <Monitor size={20} />
                </button>
                <button
                    onClick={() => setDeviceMode('tablet')}
                    className={`p-2 rounded-md transition-colors ${deviceMode === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Tablet View"
                >
                    <Tablet size={20} />
                </button>
                <button
                    onClick={() => setDeviceMode('mobile')}
                    className={`p-2 rounded-md transition-colors ${deviceMode === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Mobile View"
                >
                    <Smartphone size={20} />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg" title="Settings">
                    <Settings size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg" title="View Code">
                    <Code size={20} />
                </button>

                <button
                    onClick={onSave}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700"
                >
                    <span className="flex items-center gap-2"><Save size={16} /> Save</span>
                </button>

                <button
                    onClick={onPublish}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                    <span className="flex items-center gap-2"><Rocket size={16} /> Publish</span>
                </button>
            </div>
        </div>
    );
}
