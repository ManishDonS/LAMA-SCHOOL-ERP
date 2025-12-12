import { useState } from 'react';

interface CanvasProps {
    deviceMode: 'desktop' | 'tablet' | 'mobile';
    components: any[];
    onDrop: (component: any) => void;
}

export default function Canvas({ deviceMode, components, onDrop }: CanvasProps) {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const getWidth = () => {
        switch (deviceMode) {
            case 'mobile': return '375px';
            case 'tablet': return '768px';
            default: return '100%';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const type = e.dataTransfer.getData('componentType');
        if (type) {
            onDrop({ type, id: Date.now() });
        }
    };

    return (
        <div className="flex-1 bg-slate-800/50 overflow-auto p-4 flex justify-center items-start min-h-[calc(100vh-64px)]">
            <div
                className={`bg-white transition-all duration-300 shadow-2xl overflow-hidden min-h-[800px] relative ${deviceMode !== 'desktop' ? 'rounded-3xl border-8 border-slate-900' : 'rounded-none w-full'}`}
                style={{ width: getWidth() }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drop Zone overlay */}
                {isDraggingOver && (
                    <div className="absolute inset-0 bg-blue-500/10 border-4 border-blue-500 border-dashed z-50 flex items-center justify-center">
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">Drop Component Here</div>
                    </div>
                )}

                {/* Content Render */}
                {components.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-20">
                        <div className="mb-4 text-6xl">✨</div>
                        <h3 className="text-xl font-medium mb-2">Start Building</h3>
                        <p>Drag components from the left sidebar to build your page</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {components.map((comp) => (
                            <div key={comp.id} className="group relative hover:ring-2 ring-blue-500 cursor-pointer">
                                {/* Visual representation of component */}
                                {comp.type === 'Hero' && (
                                    <div className="bg-slate-100 p-20 text-center">
                                        <h1 className="text-4xl font-bold text-slate-900 mb-4">Hero Section</h1>
                                        <p className="text-lg text-slate-600">This is a placeholder for the hero section.</p>
                                    </div>
                                )}
                                {comp.type === 'Navbar' && (
                                    <div className="bg-white border-b p-4 flex justify-between items-center">
                                        <span className="font-bold text-xl text-slate-900">Logo</span>
                                        <nav className="flex gap-4 text-slate-600">
                                            <span>Home</span>
                                            <span>About</span>
                                            <span>Contact</span>
                                        </nav>
                                    </div>
                                )}
                                {/* Default placeholder */}
                                {!['Hero', 'Navbar'].includes(comp.type) && (
                                    <div className="p-8 border border-dashed border-slate-300 m-4 rounded hover:bg-slate-50">
                                        <p className="text-center text-slate-500 font-medium">{comp.type} Component</p>
                                    </div>
                                )}

                                {/* Action overlay */}
                                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                    <button className="bg-blue-600 text-white p-1 rounded text-xs">Edit</button>
                                    <button className="bg-red-500 text-white p-1 rounded text-xs">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
