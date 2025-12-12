import { Layout, Type, Image as ImageIcon, FormInput, Phone, Search } from 'lucide-react';

export default function ComponentLibrary() {
    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('componentType', type);
    };

    const categories = [
        {
            title: 'Layout',
            icon: <Layout size={16} />,
            items: ['Container', 'Grid 2-Col', 'Grid 3-Col', 'Divider', 'Spacer']
        },
        {
            title: 'Navigation',
            icon: <Layout size={16} />,
            items: ['Navbar', 'Footer', 'Menu', 'Breadcrumbs']
        },
        {
            title: 'Content',
            icon: <Type size={16} />,
            items: ['Heading', 'Text Block', 'Hero', 'Button', 'Features']
        },
        {
            title: 'Media',
            icon: <ImageIcon size={16} />,
            items: ['Image', 'Video', 'Gallery', 'Slider']
        },
        {
            title: 'Forms',
            icon: <FormInput size={16} />,
            items: ['Contact Form', 'Newsletter', 'Input Field', 'Checkbox']
        }
    ];

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-[calc(100vh-64px)]">
            <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Components</h3>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-slate-800 border-none rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {categories.map((cat) => (
                    <div key={cat.title}>
                        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                            {cat.icon}
                            {cat.title}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {cat.items.map((item) => (
                                <div
                                    key={item}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors flex flex-col items-center gap-2 group"
                                >
                                    <div className="w-8 h-8 rounded bg-slate-700/50 group-hover:bg-slate-600 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                                        {/* Placeholder icon */}
                                        <div className="w-4 h-4 border-2 border-current rounded-sm opacity-50"></div>
                                    </div>
                                    <span className="text-xs text-slate-400 text-center">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
