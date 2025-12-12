import { useState } from 'react';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

export default function SEOManager() {
    const [meta, setMeta] = useState({
        title: 'My Awesome Website',
        description: 'Welcome to the best website on the internet.',
        keywords: 'website, builder, ai'
    });

    return (
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-700 max-w-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Search size={24} className="text-blue-400" />
                SEO Manager
            </h3>

            <div className="space-y-6">
                {/* Google Preview */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">www.example.com › ...</div>
                    <div className="text-xl text-blue-800 font-medium hover:underline cursor-pointer mb-1 line-clamp-1">
                        {meta.title || 'Page Title'}
                    </div>
                    <div className="text-sm text-slate-600 line-clamp-2">
                        {meta.description || 'Page description will appear here...'}
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Meta Title
                            <span className={`ml-2 text-xs ${meta.title.length > 60 ? 'text-red-400' : 'text-slate-500'}`}>
                                {meta.title.length}/60
                            </span>
                        </label>
                        <input
                            type="text"
                            value={meta.title}
                            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Enter page title"
                        />
                        <div className="h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${meta.title.length > 60 ? 'bg-red-500' : meta.title.length > 40 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min((meta.title.length / 60) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Meta Description
                            <span className={`ml-2 text-xs ${meta.description.length > 160 ? 'text-red-400' : 'text-slate-500'}`}>
                                {meta.description.length}/160
                            </span>
                        </label>
                        <textarea
                            value={meta.description}
                            onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                            placeholder="Enter page description"
                        />
                        <div className="h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${meta.description.length > 160 ? 'bg-red-500' : meta.description.length > 120 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min((meta.description.length / 160) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Keywords</label>
                        <input
                            type="text"
                            value={meta.keywords}
                            onChange={(e) => setMeta({ ...meta, keywords: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Comma separated keywords"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
