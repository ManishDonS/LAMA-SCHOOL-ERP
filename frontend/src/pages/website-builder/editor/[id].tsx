import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import TopToolbar from '@/components/website-builder/Editor/TopToolbar';
import Canvas from '@/components/website-builder/Editor/Canvas';
import ComponentLibrary from '@/components/website-builder/Editor/ComponentLibrary';
import { Toaster, toast } from 'react-hot-toast';

import AIAssistant from '@/components/website-builder/Editor/AIAssistant';

export default function WebsiteEditor() {
    const router = useRouter();
    const { id } = router.query;
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [components, setComponents] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showAI, setShowAI] = useState(false);

    const handleDrop = (component: any) => {
        setComponents([...components, component]);
        toast.success(`Added ${component.type}`);
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            toast.success('Website saved successfully!');
        }, 1000);
    };

    const handlePublish = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Publishing website...',
                success: 'Website published successfully! 🚀',
                error: 'Failed to publish',
            }
        );
    };

    return (
        <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
            <Head>
                <title>Editor - Website Builder</title>
            </Head>

            <TopToolbar
                onSave={handleSave}
                onPublish={handlePublish}
                deviceMode={deviceMode}
                setDeviceMode={setDeviceMode}
                onToggleAI={() => setShowAI(!showAI)}
            />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar */}
                <ComponentLibrary />

                {/* Main Canvas Area */}
                <Canvas
                    deviceMode={deviceMode}
                    components={components}
                    onDrop={handleDrop}
                />

                {/* Right Sidebar - Properties (Placeholder) */}
                <div className="w-72 bg-slate-900 border-l border-slate-700 p-4 hidden lg:block">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Properties</h3>
                    <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-center text-slate-500 text-sm">
                        Select a component to edit properties
                    </div>
                </div>

                {/* AI Assistant Panel Overlay */}
                {showAI && (
                    <div className="absolute top-4 right-4 bottom-4 z-50 animate-in slide-in-from-right duration-300">
                        <AIAssistant onClose={() => setShowAI(false)} />
                    </div>
                )}
            </div>

            <Toaster position="bottom-right" />
        </div>
    );
}
