import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Plus, Globe, BarChart2, Settings, ExternalLink } from 'lucide-react';

// Mock data until API is fully integrated
const MOCK_WEBSITES = [
    // { id: 1, name: 'Greenwood Academy', domain: 'greenwood.lama.school', status: 'published', visitors: 1245, industry: 'Education' },
];

export default function WebsiteBuilderDashboard() {
    const router = useRouter();
    const [websites, setWebsites] = useState<any[]>(MOCK_WEBSITES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch from API
        // fetch('/api/website').then(...).catch(...)
        setLoading(false);
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <Head>
                <title>Website Builder - LAMA School ERP</title>
            </Head>

            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Website Builder
                        </h1>
                        <p className="text-slate-400 mt-2">Create and manage professional AI-powered websites</p>
                    </div>
                    <Link
                        href="/website-builder/wizard"
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-blue-500/25 transition-all"
                    >
                        <Plus size={20} />
                        Create New Website
                    </Link>
                </div>

                {websites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-800/50 rounded-3xl border border-slate-700 border-dashed">
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                            <Globe size={40} className="text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No websites yet</h2>
                        <p className="text-slate-400 mb-8 max-w-md text-center">
                            Get started by creating your first AI-powered website. It only takes a few minutes!
                        </p>
                        <Link
                            href="/website-builder/wizard"
                            className="px-6 py-3 bg-white text-slate-900 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                        >
                            Start Building
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {websites.map((site) => (
                            <div key={site.id} className="group bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all overflow-hidden shadow-xl">
                                <div className="h-48 bg-slate-700 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                    {/* Thumbnail placeholder */}
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                        <Globe size={48} opacity={0.2} />
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${site.status === 'published'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                            {site.status === 'published' ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-1">{site.name}</h3>
                                    <a href={`https://${site.domain}`} target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-blue-400 flex items-center gap-1 mb-6">
                                        {site.domain} <ExternalLink size={12} />
                                    </a>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <BarChart2 size={16} />
                                            <span>{site.visitors.toLocaleString()} visitors</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                <Settings size={18} />
                                            </button>
                                            <Link
                                                href={`/website-builder/editor/${site.id}`}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
