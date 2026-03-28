import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Terminal, Cpu, Zap, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (user) return <Navigate to="/dashboard" replace />;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Navigation */}
            <nav className="fixed top-0 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-6 h-6 text-primary" />
                        <span className="font-bold text-xl tracking-tight uppercase">WebIDE</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Login
                        </Link>
                        <Link to="/signup" className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <span className="text-xs font-semibold tracking-widest uppercase text-primary">Now in Beta</span>
                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                        </div>
                        
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                            Forge the <span className="text-muted-foreground">Future</span> of Code.
                        </h1>
                        
                        <p className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            A high-performance, minimalist IDE built for the modern engineer. 
                            Architectural precision with visual silence.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity group">
                                Get Started Free
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 font-semibold transition-colors flex items-center justify-center">
                                Login to Workspace
                            </Link>
                        </div>
                    </div>

                    {/* Visual Placeholder / Mockup Area */}
                    <div className="mt-24 relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 blur-3xl opacity-20 -z-10" />
                        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-3xl aspect-[16/9] overflow-hidden group">
                           <div className="p-4 border-b border-white/5 flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full bg-red-500/50" />
                               <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                               <div className="w-3 h-3 rounded-full bg-green-500/50" />
                           </div>
                           <div className="p-8 font-mono text-sm space-y-2 opacity-50">
                               <p className="text-blue-400">import <span className="text-white">WebIDE</span> from <span className="text-green-400">"@web-ide/core"</span>;</p>
                               <p className="text-gray-500">// Initialize high-performance workspace</p>
                               <p className="text-blue-400">const <span className="text-white">vanguard</span> = <span className="text-yellow-400">await</span> <span className="text-white">WebIDE.<span className="text-yellow-400">initialize</span></span>({"{"}</p>
                               <p className="pl-4 text-white">architecture: <span className="text-green-400">"zero-overhead"</span>,</p>
                               <p className="pl-4 text-white">visuals: <span className="text-green-400">"minimalist"</span></p>
                               <p className="text-white">{"}"});</p>
                           </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="py-32 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        <FeatureCard 
                            icon={<Cpu className="w-6 h-6 text-primary" />}
                            title="Latent Logic"
                            description="Built with a zero-overhead architecture. Every microsecond is accounted for."
                        />
                        <FeatureCard 
                            icon={<Shield className="w-6 h-6 text-primary" />}
                            title="Visual Silence"
                            description="UI that stays out of your way until you need it. No distractions, just code."
                        />
                        <FeatureCard 
                            icon={<Zap className="w-6 h-6 text-primary" />}
                            title="Performance"
                            description="Sub-5ms response time on all keystrokes. Native speed on every platform."
                        />
                        <FeatureCard 
                            icon={<Zap className="w-6 h-6 text-primary" />}
                            title="Synchronicity"
                            description="Real-time collaboration with peer-to-peer end-to-end encryption."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 opacity-50" />
                        <span className="text-sm font-medium opacity-50 uppercase tracking-widest">© 2024 WEBIDE. ARCHITECTURAL PRECISION.</span>
                    </div>
                    <div className="flex gap-8 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
                        <a href="#" className="hover:text-foreground transition-colors">Changelog</a>
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Github</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="group space-y-4">
        <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-primary transition-colors">
            {icon}
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
        </p>
    </div>
);

export default Landing;
