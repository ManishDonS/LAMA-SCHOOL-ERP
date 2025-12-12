import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, BookOpen, Users, Award, Calendar } from 'lucide-react';

export default function EducationProPreview() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Head>
                <title>Education Pro Template - Preview</title>
            </Head>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/website-builder/wizard" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span>Back to Templates</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">Education Pro Template</span>
                        <Link
                            href="/website-builder/wizard?template=edu-pro"
                            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                        >
                            Use This Template
                        </Link>
                    </div>
                </div>
            </header>

            {/* Preview Content */}
            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Template Info */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold mb-4">
                            <Sparkles size={16} />
                            Education Template
                        </div>
                        <h1 className="text-5xl font-bold text-white mb-4">Education Pro</h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            A modern, professional template perfect for schools, universities, and educational institutions.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                        {[
                            { icon: BookOpen, title: 'Course Catalog', desc: 'Showcase your programs' },
                            { icon: Users, title: 'Faculty Profiles', desc: 'Highlight your team' },
                            { icon: Award, title: 'Achievements', desc: 'Display success stories' },
                            { icon: Calendar, title: 'Events Calendar', desc: 'Keep everyone informed' },
                        ].map((feature, idx) => (
                            <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                                <feature.icon className="w-10 h-10 text-emerald-400 mb-3" />
                                <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                                <p className="text-slate-400 text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Template Preview Mockup */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                        {/* Hero Section Preview */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-16 text-center">
                            <h2 className="text-4xl font-bold text-white mb-4">Welcome to Your School</h2>
                            <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                                Empowering students to achieve their dreams through quality education and innovative learning.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button className="px-8 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:shadow-lg transition-all">
                                    Explore Programs
                                </button>
                                <button className="px-8 py-3 bg-white/20 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/30 transition-all">
                                    Contact Us
                                </button>
                            </div>
                        </div>

                        {/* Features Section Preview */}
                        <div className="p-16 bg-slate-800/50">
                            <div className="text-center mb-12">
                                <h3 className="text-3xl font-bold text-white mb-4">Why Choose Us</h3>
                                <p className="text-slate-400">Excellence in education, innovation in learning</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { title: 'Expert Faculty', desc: 'Learn from industry professionals' },
                                    { title: 'Modern Facilities', desc: 'State-of-the-art learning environment' },
                                    { title: 'Career Support', desc: 'Guidance for your future success' },
                                ].map((item, idx) => (
                                    <div key={idx} className="text-center">
                                        <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check className="text-emerald-400" size={32} />
                                        </div>
                                        <h4 className="text-white font-bold mb-2">{item.title}</h4>
                                        <p className="text-slate-400 text-sm">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section Preview */}
                        <div className="p-16 bg-gradient-to-r from-emerald-600/20 to-teal-500/20 border-t border-white/10 text-center">
                            <h3 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h3>
                            <p className="text-slate-300 mb-8">Join thousands of students achieving their goals</p>
                            <button className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all">
                                Apply Now
                            </button>
                        </div>
                    </div>

                    {/* Template Details */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">What's Included</h3>
                            <ul className="space-y-3">
                                {[
                                    'Responsive design for all devices',
                                    'Hero section with call-to-action',
                                    'Course/program showcase',
                                    'Faculty profiles section',
                                    'Events calendar integration',
                                    'Contact form',
                                    'SEO optimized',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-slate-300">
                                        <Check size={18} className="text-emerald-400 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">Perfect For</h3>
                            <ul className="space-y-3">
                                {[
                                    'Schools & Universities',
                                    'Online Learning Platforms',
                                    'Training Centers',
                                    'Educational Institutions',
                                    'Tutoring Services',
                                    'Academic Programs',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-slate-300">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-16 text-center">
                        <Link
                            href="/website-builder/wizard?template=edu-pro"
                            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all"
                        >
                            <Check size={24} />
                            Select Education Pro Template
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
