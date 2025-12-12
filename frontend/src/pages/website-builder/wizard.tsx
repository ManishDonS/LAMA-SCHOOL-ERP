import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import BrandSetupStep from '@/components/website-builder/BrandSetupStep';

const STEPS = [
    { id: 1, title: 'Brand Setup' },
    { id: 2, title: 'Template' },
    { id: 3, title: 'Content' },
    { id: 4, title: 'Review' },
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
        industryDetected: '',
        industryConfidence: 0,
        name: '',
        logo: null as File | null,
        colors: [] as string[],
        colorsDetected: [] as string[],
        template: '',
    });

    const handleNext = () => {
        // Validation
        if (currentStep === 1 && (!formData.industry || formData.colors.length === 0)) {
            toast.error('Please select an industry and color palette to continue');
            return;
        }
        if (currentStep === 2 && !formData.template) {
            toast.error('Please select a template');
            return;
        }
        if (currentStep === 3 && !formData.name.trim()) {
            toast.error('Please enter a website name');
            return;
        }

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
                custom_domain: `${formData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                // logo: formData.logo, // would need multipart/form-data or separate upload
                settings: {
                    theme: {
                        colors: formData.colors,
                        template: formData.template
                    }
                }
            };

            console.log('Creating website with payload:', payload);

            const response = await fetch('http://localhost:3013/api/website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('API Error:', errorData);
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Website created:', data);

            toast.success('Website created successfully!', { id: loadingToast });
            router.push(`/website-builder/editor/${data.id}`);

        } catch (error: any) {
            console.error('Create website error:', error);
            const errorMessage = error.message || 'Something went wrong. Please try again.';
            toast.error(errorMessage, { id: loadingToast });
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
                    {/* Step 1: Combined Brand Setup */}
                    {currentStep === 1 && (
                        <BrandSetupStep
                            formData={formData}
                            setFormData={setFormData}
                            isAnalyzing={isAnalyzing}
                            setIsAnalyzing={setIsAnalyzing}
                        />
                    )}

                    {/* Step 2: Templates (Previously Step 3) */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Select a Template</h2>
                                    <p className="text-base text-slate-400">Professional, responsive layouts designed for your industry.</p>
                                </div>
                                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-slate-300 backdrop-blur-md">
                                    Filtering for: <span className="text-primary-400 font-bold ml-1">{formData.industry || 'All Industries'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { id: 'modern-saas', name: 'Modern SaaS', type: 'Corporate', desc: 'Clean, professional design', gradient: 'from-blue-600 to-cyan-500' },
                                    { id: 'creative-portfolio', name: 'Creative Portfolio', type: 'Portfolio', desc: 'Showcase your work', gradient: 'from-purple-600 to-pink-500' },
                                    { id: 'edu-pro', name: 'Education Pro', type: 'Education', desc: 'Perfect for schools', gradient: 'from-emerald-600 to-teal-500' },
                                    { id: 'health-care', name: 'Health Care', type: 'Healthcare', desc: 'Medical & wellness', gradient: 'from-rose-600 to-pink-500' },
                                    { id: 'ecom-starter', name: 'E-commerce Starter', type: 'E-commerce', desc: 'Online store ready', gradient: 'from-amber-600 to-orange-500' },
                                    { id: 'restaurant-menu', name: 'Tasty Bites', type: 'Restaurant', desc: 'Food & dining', gradient: 'from-red-600 to-rose-500' },
                                    { id: 'real-estate-pro', name: 'Real Estate Pro', type: 'Real Estate', desc: 'Property showcase', gradient: 'from-indigo-600 to-blue-500' },
                                    { id: 'fitness-hub', name: 'Fitness Hub', type: 'Fitness', desc: 'Gym & wellness', gradient: 'from-green-600 to-emerald-500' },
                                    { id: 'tech-startup', name: 'Tech Startup', type: 'Corporate', desc: 'Innovation focused', gradient: 'from-violet-600 to-purple-500' },
                                    { id: 'consulting-firm', name: 'Consulting Firm', type: 'Corporate', desc: 'Professional services', gradient: 'from-slate-700 to-slate-500' },
                                    { id: 'creative-agency', name: 'Creative Agency', type: 'Portfolio', desc: 'Bold & artistic', gradient: 'from-fuchsia-600 to-pink-500' },
                                    { id: 'nonprofit-org', name: 'Nonprofit Org', type: 'Education', desc: 'Community focused', gradient: 'from-sky-600 to-blue-500' },
                                ].map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => setFormData({ ...formData, template: template.id })}
                                        className={`group relative rounded-2xl overflow-hidden border transition-all duration-500 hover:-translate-y-1 cursor-pointer ${formData.template === template.id
                                            ? 'border-primary-500 ring-2 ring-primary-500/50 shadow-2xl shadow-primary-900/40 scale-[1.02]'
                                            : 'border-white/10 hover:border-primary-400/30 hover:shadow-xl hover:shadow-primary-900/20'
                                            }`}
                                    >
                                        <div className="aspect-[4/3] bg-dark-surface relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-60 z-10" />
                                            {/* Template Preview with Gradient */}
                                            <div className={`w-full h-full bg-gradient-to-br ${template.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-700`}>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center p-8">
                                                        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                                            <Sparkles size={32} className="text-white/60" />
                                                        </div>
                                                        <div className="text-white/40 text-sm font-medium">{template.desc}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            {formData.industry === template.type && (
                                                <div className="absolute top-3 right-3 bg-primary-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-20 border border-white/10 animate-fade-in">
                                                    Recommended
                                                </div>
                                            )}
                                            {formData.template === template.id && (
                                                <div className="absolute top-3 left-3 bg-green-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-20 border border-white/10 flex items-center gap-1.5">
                                                    <Check size={14} /> Selected
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5 bg-white/5 backdrop-blur-md relative z-20 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-base text-white group-hover:text-primary-400 transition-colors">{template.name}</h3>
                                                <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{template.type}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (template.id === 'edu-pro') {
                                                        window.open(`/templates/preview/${template.id}`, '_blank');
                                                    } else {
                                                        toast('Preview coming soon for this template! Education Pro preview is available.', {
                                                            icon: '👀',
                                                            duration: 3000
                                                        });
                                                    }
                                                }}
                                                className="ml-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/50 transition-all duration-300 group/preview"
                                                title="Preview Template"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover/preview:text-primary-400 transition-colors">
                                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Content (Previously Step 4) */}
                    {currentStep === 3 && (
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

                    {/* Step 4: Review (Previously Step 5) */}
                    {currentStep === 4 && (
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

            {/* Footer Actions - Compact Floating Buttons */}
            <footer className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                <div className="max-w-6xl mx-auto p-4 flex justify-between items-center pointer-events-auto">
                    {currentStep > 1 && (
                        <button
                            onClick={handleBack}
                            disabled={isCreating}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 bg-white/5 backdrop-blur-md border border-white/10 ${isCreating
                                ? 'opacity-30 cursor-not-allowed text-slate-500'
                                : 'hover:bg-white/10 text-white hover:scale-105 active:scale-95'
                                }`}
                        >
                            ← Back
                        </button>
                    )}

                    <button
                        onClick={currentStep === STEPS.length ? handleCreate : handleNext}
                        disabled={isCreating}
                        className={`
                            ml-auto flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 hover:scale-105 active:scale-95
                            bg-gradient-to-r from-primary-600 to-accent-purple text-white hover:shadow-primary-500/30
                            disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed
                        `}
                    >
                        {isCreating ? (
                            <><Loader size={16} className="animate-spin" /> Building...</>
                        ) : (
                            <>{currentStep === STEPS.length ? 'Generate Website' : 'Continue'} <ArrowRight size={16} /></>
                        )}
                    </button>
                </div>
            </footer>
        </div>
    );
}
