import { useState, useRef, Dispatch, SetStateAction } from 'react';
import { Sparkles, Check, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BrandSetupProps {
    formData: {
        industry: string;
        industryDetected: string;
        industryConfidence: number;
        colors: string[];
        colorsDetected: string[];
        logo: File | null;
    };
    setFormData: Dispatch<SetStateAction<any>>;
    isAnalyzing: boolean;
    setIsAnalyzing: Dispatch<SetStateAction<boolean>>;
}

export default function BrandSetupStep({ formData, setFormData, isAnalyzing, setIsAnalyzing }: BrandSetupProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setFormData((prev: any) => ({ ...prev, logo: file }));
        setIsAnalyzing(true);

        // Simulate AI Analysis
        toast.loading('Analyzing brand identity...', { id: 'analyze' });

        setTimeout(() => {
            // Mock AI detection results
            const detectedIndustry = 'Education';
            const detectedColors = ['bg-blue-600', 'bg-blue-400', 'bg-slate-900'];
            const confidence = 95;

            setFormData((prev: any) => ({
                ...prev,
                industry: detectedIndustry,
                industryDetected: detectedIndustry,
                industryConfidence: confidence,
                colors: detectedColors,
                colorsDetected: detectedColors,
            }));
            setIsAnalyzing(false);
            toast.success(`AI detected: ${detectedIndustry} (${confidence}% confidence)`, { id: 'analyze' });
        }, 2500);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
            <div className="text-center mb-8 max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    Let's build your brand identity
                </h1>
                <p className="text-base text-slate-400">
                    Upload your logo for AI-powered detection, or manually select your industry and colors.
                </p>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
            />

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Logo Upload */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Logo Upload</h3>

                    {!logoPreview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                relative overflow-hidden p-1 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl cursor-pointer group transition-all duration-300
                                ${isAnalyzing ? 'scale-[0.98] opacity-90' : 'hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary-500/10'}
                            `}
                        >
                            <div className="bg-dark-surface/90 backdrop-blur-sm rounded-[20px] p-8 flex flex-col items-center justify-center text-center border border-white/5 h-full relative z-10 min-h-[280px]">
                                <div className="w-16 h-16 bg-gradient-to-tr from-primary-500/20 to-accent-purple/20 rounded-xl flex items-center justify-center text-primary-400 mb-4 group-hover:rotate-6 transition-all duration-500 ease-out border border-white/5">
                                    {isAnalyzing ? <Loader size={28} className="animate-spin text-accent-pink" /> : <Sparkles size={28} />}
                                </div>
                                <h3 className="font-bold text-xl mb-2 text-white group-hover:text-primary-400 transition-colors">
                                    {isAnalyzing ? 'Analyzing Brand...' : 'Upload Your Logo'}
                                </h3>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed mb-3">
                                    {isAnalyzing
                                        ? 'AI is detecting industry and extracting colors...'
                                        : 'Drag & drop or click to upload. AI will auto-detect your industry and brand colors.'}
                                </p>
                                <div className="flex gap-2 text-xs text-slate-500">
                                    <span className="px-2 py-1 bg-white/5 rounded">PNG</span>
                                    <span className="px-2 py-1 bg-white/5 rounded">JPG</span>
                                    <span className="px-2 py-1 bg-white/5 rounded">SVG</span>
                                    <span className="px-2 py-1 bg-white/5 rounded">Max 5MB</span>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-accent-purple/20 to-accent-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                        </div>
                    ) : (
                        <div className="relative p-1 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl">
                            <div className="bg-dark-surface/90 backdrop-blur-sm rounded-[20px] p-6 border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white mb-1">Logo Uploaded</h4>
                                        <p className="text-sm text-slate-400 mb-3">{formData.logo?.name}</p>
                                        <button
                                            onClick={() => {
                                                setLogoPreview('');
                                                setFormData((prev: any) => ({ ...prev, logo: null }));
                                            }}
                                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            Remove Logo
                                        </button>
                                    </div>
                                </div>
                                {isAnalyzing && (
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-sm text-primary-400">
                                            <Loader size={16} className="animate-spin" />
                                            <span>Analyzing brand identity...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Detected Results */}
                <div className="space-y-6">
                    {/* Industry Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            Industry
                            {formData.industryDetected && (
                                <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/30">
                                    AI Detected
                                </span>
                            )}
                        </h3>

                        {formData.industryDetected && (
                            <div className="mb-4 p-4 bg-primary-600/10 border border-primary-500/30 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Check size={18} className="text-primary-400" />
                                        <span className="font-bold text-white">{formData.industryDetected}</span>
                                    </div>
                                    <span className="text-xs text-primary-400 font-medium">
                                        {formData.industryConfidence}% match
                                    </span>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 mb-3">Or select manually:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['Education', 'Healthcare', 'Restaurant', 'Corporate', 'E-commerce', 'Portfolio', 'Real Estate', 'Fitness'].map((industry) => (
                                <button
                                    key={industry}
                                    onClick={() => setFormData({ ...formData, industry })}
                                    className={`
                                        p-3 rounded-lg border text-left transition-all duration-300 text-sm
                                        ${formData.industry === industry
                                            ? 'bg-primary-600 border-primary-500 text-white shadow-lg'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                                        }
                                    `}
                                >
                                    <div className="font-semibold">{industry}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Palette Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            Color Palette
                            {formData.colorsDetected.length > 0 && (
                                <span className="text-xs bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded-full border border-accent-purple/30">
                                    AI Extracted
                                </span>
                            )}
                        </h3>

                        {formData.colorsDetected.length > 0 && (
                            <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-xs text-slate-400 mb-3">Extracted from logo:</p>
                                <div className="flex gap-2">
                                    {formData.colorsDetected.map((color, i) => (
                                        <div key={i} className="flex-1">
                                            <div className={`w-full h-16 rounded-lg ${color} shadow-lg ring-1 ring-white/10`} />
                                            <p className="text-xs text-slate-500 mt-1 text-center">Color {i + 1}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 mb-3">Or choose a preset:</p>
                        <div className="space-y-2">
                            {[
                                { name: 'Modern Blue', colors: ['bg-blue-600', 'bg-blue-400', 'bg-slate-900'] },
                                { name: 'Emerald Nature', colors: ['bg-emerald-600', 'bg-emerald-400', 'bg-stone-900'] },
                                { name: 'Sunset Warmth', colors: ['bg-orange-500', 'bg-red-400', 'bg-slate-900'] },
                                { name: 'Royal Purple', colors: ['bg-purple-600', 'bg-indigo-400', 'bg-gray-900'] },
                            ].map((palette, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setFormData({ ...formData, colors: palette.colors })}
                                    className={`
                                        w-full p-3 rounded-lg border transition-all duration-300 flex items-center justify-between
                                        ${formData.colors[0] === palette.colors[0]
                                            ? 'bg-white/10 border-primary-500 ring-1 ring-primary-500/50'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <span className="text-sm font-semibold text-white">{palette.name}</span>
                                    <div className="flex gap-1.5">
                                        {palette.colors.map((color, i) => (
                                            <div key={i} className={`w-6 h-6 rounded ${color} ring-1 ring-white/10`} />
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
