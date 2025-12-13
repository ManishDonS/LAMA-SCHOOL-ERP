import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STEPS = [
    { id: 1, title: 'Industry' },
    { id: 2, title: 'Branding' },
    { id: 3, title: 'Template' },
    { id: 4, title: 'Content' },
    { id: 5, title: 'Review' },
];

import { useRouter } from 'next/router';

// ... (imports remain)

export default function WebsiteWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        industry: '',
        name: '',
        logo: null as File | null,
        colors: [],
        template: '',
    });

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(curr => curr + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const handleCreate = async () => {
        setIsCreating(true);
        const loadingToast = toast.loading('Creating your AI website...');

        try {
            // In a real app, we would upload the logo first if present
            // and then send the URL. For this MVP, we'll send a POST request.

            const payload = {
                name: formData.name,
                industry: formData.industry,
                school_id: 'school-123', // TODO: Get from auth context
                // logo: formData.logo, // would need multipart/form-data or separate upload
                settings: {
                    theme: {
                        colors: formData.colors,
                        template: formData.template
                    }
                }
            };

            const response = await fetch('http://localhost:3013/api/website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to create website');
            }

            const data = await response.json();

            toast.success('Website created successfully!', { id: loadingToast });
            router.push(`/website-builder/editor/${data.id}`);

        } catch (error) {
            console.error(error);
            toast.error('Something went wrong. Please try again.', { id: loadingToast });
            setIsCreating(false);
        }
    };

    // ... (rest of handler functions remain)

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFormData(prev => ({ ...prev, logo: file }));
        setIsAnalyzing(true);

        // Simulate AI Analysis
        toast.loading('Analyzing logo...', { id: 'analyze' });

        setTimeout(() => {
            const detectedIndustry = 'Education'; // Mock result
            setIsAnalyzing(false);
            setFormData(prev => ({ ...prev, industry: detectedIndustry }));
            toast.success(`AI detected industry: ${detectedIndustry}`, { id: 'analyze' });
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-dark-bg text-white flex flex-col relative overflow-hidden font-sans selection:bg-primary-500/30">
            <Head>
                <title>Create New Website - LAMA School ERP</title>
            </Head>

            {/* Ambient Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-purple/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Header */}
            <header className="border-b border-white/5 bg-dark-bg/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/website-builder" className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="font-medium">Exit Builder</span>
                    </Link>
                    <div className="font-heading font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Create New Website
                    </div>
                    <div className="w-24"></div> {/* Spacer */}
                </div>
            </header>

            {/* Progress Bar */}
            <div className="w-full bg-white/5 h-1">
                <div
                    className="h-full bg-gradient-to-r from-primary-500 via-accent-purple to-accent-pink transition-all duration-700 ease-out relative"
                    style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto w-full p-6 pb-32 z-10 relative">
                {/* Step Indicator */}
                <div className="flex justify-between mb-16 relative px-10">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -z-10 -translate-y-1/2" />
                    {STEPS.map((step) => (
                        <div key={step.id} className="flex flex-col items-center gap-3 relative group cursor-pointer" onClick={() => step.id < currentStep && setCurrentStep(step.id)}>
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${currentStep >= step.id
                                    ? 'bg-primary-600 border-primary-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                    : 'bg-dark-surface border-slate-700 text-slate-500 group-hover:border-slate-600'
                                    }`}
                            >
                                {currentStep > step.id ? <Check size={18} className="text-white" /> : step.id}
                            </div>
                            <span className={`text-xs font-semibold tracking-wide uppercase transition-colors ${currentStep >= step.id ? 'text-primary-400' : 'text-slate-600'}`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[500px] flex flex-col">
                    {currentStep === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="text-center mb-10 max-w-2xl mx-auto">
                                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                    What's your industry?
                                </h1>
                                <p className="text-lg text-slate-400">
                                    We'll tailor your website's structure, content, and design to match your field perfectly.
                                </p>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    relative overflow-hidden p-1 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl mb-12 cursor-pointer group transition-all duration-300
                                    ${isAnalyzing ? 'scale-[0.98] opacity-90' : 'hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary-500/10'}
                                `}
                            >
                                <div className="bg-dark-surface/90 backdrop-blur-sm rounded-[22px] p-10 flex flex-col items-center justify-center text-center borderBorder border-white/5 h-full relative z-10">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-primary-500/20 to-accent-purple/20 rounded-2xl flex items-center justify-center text-primary-400 mb-6 group-hover:rotate-6 transition-all duration-500 ease-out border border-white/5">
                                        {isAnalyzing ? <Loader size={32} className="animate-spin text-accent-pink" /> : <Sparkles size={32} />}
                                    </div>
                                    <h3 className="font-bold text-2xl mb-2 text-white group-hover:text-primary-400 transition-colors">
                                        {isAnalyzing ? 'Analyzing Brand Identity...' : 'Auto-Detect from Logo'}
                                    </h3>
                                    <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                                        {isAnalyzing
                                            ? 'Our AI is extracting colors and identifying your industry...'
                                            : 'Upload your logo and let our AI instantly configure your industry and color palette.'}
                                    </p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-accent-purple/20 to-accent-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['Education', 'Healthcare', 'Restaurant', 'Corporate', 'E-commerce', 'Portfolio', 'Real Estate', 'Fitness'].map((industry) => (
                                    <button
                                        key={industry}
                                        onClick={() => {
                                            setFormData({ ...formData, industry });
                                        }}
                                        className={`
                                            p-6 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
                                            ${formData.industry === industry
                                                ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/50'
                                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                                            }
                                        `}
                                    >
                                        <div className="relative z-10">
                                            <div className="font-semibold text-lg tracking-wide">{industry}</div>
                                            <div className="text-xs opacity-60 mt-1 font-medium transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">Select Industry →</div>
                                        </div>
                                        {formData.industry === industry && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Check size={20} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Branding */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="text-center mb-10 max-w-2xl mx-auto">
                                <h2 className="text-4xl font-heading font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Choose your aesthetic</h2>
                                <p className="text-lg text-slate-400">Select a color palette that perfectly embodies your brand's personality.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { name: 'Modern Blue', colors: ['bg-blue-600', 'bg-blue-400', 'bg-slate-900'] },
                                    { name: 'Emerald Nature', colors: ['bg-emerald-600', 'bg-emerald-400', 'bg-stone-900'] },
                                    { name: 'Sunset Warmth', colors: ['bg-orange-500', 'bg-red-400', 'bg-slate-900'] },
                                    { name: 'Royal Purple', colors: ['bg-purple-600', 'bg-indigo-400', 'bg-gray-900'] },
                                    { name: 'Classic Dark', colors: ['bg-slate-900', 'bg-slate-700', 'bg-white'] },
                                    { name: 'Vibrant Pink', colors: ['bg-pink-500', 'bg-rose-400', 'bg-purple-900'] },
                                ].map((palette, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setFormData({ ...formData, colors: palette.colors as any })}
                                        className={`
                                            p-6 rounded-3xl border text-left transition-all duration-300 group relative overflow-hidden
                                            ${formData.colors[0] === palette.colors[0]
                                                ? 'bg-white/10 border-primary-500 ring-1 ring-primary-500/50'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-xl text-white group-hover:text-primary-300 transition-colors">{palette.name}</h3>
                                            {formData.colors[0] === palette.colors[0] && <div className="bg-primary-500 rounded-full p-1"><Check size={14} className="text-white" /></div>}
                                        </div>
                                        <div className="flex gap-3">
                                            {palette.colors.map((color, i) => (
                                                <div key={i} className={`w-14 h-14 rounded-2xl ${color} shadow-lg ring-1 ring-white/10 transform transition-transform group-hover:scale-110 group-hover:rotate-3`} style={{ transitionDelay: `${i * 50}ms` }} />
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Templates */}
                    {currentStep === 3 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                                <div>
                                    <h2 className="text-4xl font-heading font-bold mb-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Select a Template</h2>
                                    <p className="text-lg text-slate-400">Professional, responsive layouts designed for your industry.</p>
                                </div>
                                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-slate-300 backdrop-blur-md">
                                    Filtering for: <span className="text-primary-400 font-bold ml-1">{formData.industry || 'All Industries'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { id: 'modern-saas', name: 'Modern SaaS', type: 'Technology', image: 'https://via.placeholder.com/400x300/1e293b/60a5fa?text=Modern+SaaS' },
                                    { id: 'creative-portfolio', name: 'Creative Portfolio', type: 'Portfolio', image: 'https://via.placeholder.com/400x300/1e293b/c084fc?text=Portfolio' },
                                    { id: 'edu-pro', name: 'Education Pro', type: 'Education', image: 'https://via.placeholder.com/400x300/1e293b/34d399?text=Education' },
                                    { id: 'health-care', name: 'Health Care', type: 'Healthcare', image: 'https://via.placeholder.com/400x300/1e293b/f472b6?text=Healthcare' },
                                    { id: 'ecom-starter', name: 'E-commerce Starter', type: 'E-commerce', image: 'https://via.placeholder.com/400x300/1e293b/fbbf24?text=Store' },
                                    { id: 'restaurant-menu', name: 'Tasty Bites', type: 'Restaurant', image: 'https://via.placeholder.com/400x300/1e293b/f87171?text=Restaurant' },
                                ].map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setFormData({ ...formData, template: template.id })}
                                        className={`group relative rounded-3xl overflow-hidden border transition-all duration-500 hover:-translate-y-2 ${formData.template === template.id
                                            ? 'border-primary-500 ring-2 ring-primary-500/50 shadow-2xl shadow-primary-900/40'
                                            : 'border-white/10 hover:border-primary-400/30 hover:shadow-xl hover:shadow-primary-900/20'
                                            }`}
                                    >
                                        <div className="aspect-[4/3] bg-dark-surface relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-60 z-10" />
                                            <img src={template.image} alt={template.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                            {formData.industry === template.type && (
                                                <div className="absolute top-4 right-4 bg-primary-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-20 border border-white/10 animate-fade-in">
                                                    Recommended
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 bg-white/5 backdrop-blur-md relative z-20 border-t border-white/5">
                                            <h3 className="font-bold text-lg text-white group-hover:text-primary-400 transition-colors">{template.name}</h3>
                                            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{template.type}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Content */}
                    {currentStep === 4 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-2xl mx-auto w-full">
                            <div className="text-center mb-10">
                                <h2 className="text-4xl font-heading font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Identity & Details</h2>
                                <p className="text-lg text-slate-400">Tell us a bit about your organization so AI can generate relevant content.</p>
                            </div>

                            <div className="space-y-8 p-10 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px] -z-10" />
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Website Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-dark-bg/50 border border-white/10 rounded-2xl p-5 text-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-inner"
                                        placeholder="e.g. Acme Academy"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Short Description</label>
                                    <textarea
                                        rows={4}
                                        className="w-full bg-dark-bg/50 border border-white/10 rounded-2xl p-5 text-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none shadow-inner"
                                        placeholder="Summarize your mission, values, or services..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 5 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-2xl mx-auto w-full">
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-gradient-to-tr from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto mb-6 shadow-glow animate-pulse-slow">
                                    <Sparkles size={40} />
                                </div>
                                <h2 className="text-4xl font-heading font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Ready for Magic?</h2>
                                <p className="text-lg text-slate-400">Our AI agents are ready to construct your site pixel by pixel.</p>
                            </div>

                            <div className="bg-white/5 rounded-[30px] border border-white/10 overflow-hidden divide-y divide-white/5 backdrop-blur-md">
                                <div className="p-6 flex justify-between items-center hover:bg-white/5 transition-colors">
                                    <span className="text-slate-400 font-medium">Industry</span>
                                    <span className="font-bold text-white text-lg">{formData.industry || 'Not selected'}</span>
                                </div>
                                <div className="p-6 flex justify-between items-center hover:bg-white/5 transition-colors">
                                    <span className="text-slate-400 font-medium">Template Detail</span>
                                    <span className="font-bold text-white text-lg">{formData.template || 'Not selected'}</span>
                                </div>
                                <div className="p-6 flex justify-between items-center hover:bg-white/5 transition-colors">
                                    <span className="text-slate-400 font-medium">Project Name</span>
                                    <span className="font-bold text-white text-lg">{formData.name || 'Untitled'}</span>
                                </div>
                                <div className="p-6 flex justify-between items-center hover:bg-white/5 transition-colors">
                                    <span className="text-slate-400 font-medium">Brand Palette</span>
                                    <div className="flex gap-2 bg-dark-bg/50 p-2 rounded-xl border border-white/5">
                                        {formData.colors.map((c, i) => (
                                            <div key={i} className={`w-6 h-6 rounded-lg ${c} shadow-sm ring-1 ring-white/10`} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-gradient-to-r from-primary-600/10 to-accent-purple/10 border border-primary-500/20 rounded-2xl flex items-start gap-4 backdrop-blur-sm">
                                <div className="mt-1 bg-primary-500/20 p-2 rounded-lg"><Sparkles size={20} className="text-primary-400" /></div>
                                <p className="text-primary-200 leading-relaxed font-medium">Wait for the magic! Our AI will generate unique content, optimize SEO-friendly meta tags, and structure your layout based on these inputs.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer Actions */}
            <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-dark-bg/80 backdrop-blur-xl p-8 z-50">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1 || isCreating}
                        className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${currentStep === 1 || isCreating
                            ? 'opacity-30 cursor-not-allowed text-slate-500'
                            : 'hover:bg-white/10 text-white hover:scale-105 active:scale-95'
                            }`}
                    >
                        Back
                    </button>

                    <button
                        onClick={currentStep === STEPS.length ? handleCreate : handleNext}
                        disabled={isCreating}
                        className={`
                            flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95
                            bg-gradient-to-r from-primary-600 to-accent-purple text-white hover:shadow-primary-500/30
                            disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed
                        `}
                    >
                        {isCreating ? (
                            <><Loader size={20} className="animate-spin" /> Building Magic...</>
                        ) : (
                            <>{currentStep === STEPS.length ? 'Generate Website' : 'Continue'} <ArrowRight size={20} /></>
                        )}
                    </button>
                </div>
            </footer>
        </div>
    );
}
