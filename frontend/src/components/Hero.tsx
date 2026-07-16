import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShoppingBag, RotateCcw } from 'lucide-react';
import { getIcon } from '../utils/iconMap';

export const Hero = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'refill' | 'new'>('refill');

  return (
    <section className="min-h-screen bg-slate-50 flex items-center pt-12 pb-20 relative overflow-hidden font-sans selection:bg-blue-500/20">
      
      {/* Soft background shapes */}
      <div className="absolute top-0 right-0 w-[45%] h-full bg-blue-900/10 rounded-l-[100px] transform translate-x-20 pointer-events-none hidden lg:block" />
      <div className="absolute top-[20%] right-[35%] w-12 h-12 bg-orange-200/40 rounded-full blur-xl pointer-events-none" />
      
      <div className="container mx-auto max-w-7xl px-6 w-full grid lg:grid-cols-12 gap-12 xl:gap-16 items-center relative z-10">
        
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-8 text-left">
          
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full text-blue-800 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Reliable Energy Logistics
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            A new way to manage <br />
            <span className="text-blue-900">& clean cooking gas</span>
          </h1>

          <p className="text-slate-600 text-lg max-w-xl leading-relaxed font-normal">
            AGREGAS brings transparency and human convenience back to your home. Connect with verified neighborhood supply depots with instant multi-brand verification, weight guarantees, and prompt deliveries.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={isAuthenticated ? '/orders' : '/register-type'}
              className="bg-blue-900 text-white px-8 py-4 rounded-full font-bold text-sm shadow-md shadow-blue-900/10 hover:bg-blue-950 transition-all duration-200 hover:-translate-y-0.5"
            >
              {isAuthenticated ? 'Place Order Now' : 'Join the Platform'}
            </Link>
            
            {!isAuthenticated && (
              <Link
                to="/login"
                className="border border-slate-300 text-slate-700 px-8 py-4 rounded-full font-bold text-sm hover:bg-slate-100 transition-all duration-200"
              >
                Learn more
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="pt-8 border-t border-slate-200 flex items-center gap-10">
            <div>
              <div className="font-extrabold text-3xl text-slate-900">10,2K</div>
              <div className="text-slate-500 text-xs mt-1">Active Kitchens</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <div className="font-extrabold text-3xl text-slate-900">2-4h</div>
              <div className="text-slate-500 text-xs mt-1">Delivery Window</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <div className="font-extrabold text-3xl text-slate-900">50+</div>
              <div className="text-slate-500 text-xs mt-1">Verified Hubs</div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 w-full relative flex items-center justify-center">
          
          <div className="relative w-full max-w-[480px] h-[520px] md:h-[560px]">
            
            {/* Blue Card - Refill/Setup Selector */}
            <div className="absolute top-0 left-0 w-[65%] h-[60%] bg-blue-900 rounded-[32px] p-5 flex flex-col justify-between shadow-xl shadow-blue-900/10 transition-all duration-300">
              
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('refill')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                    activeTab === 'refill' ? 'bg-white text-blue-950 shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Refill
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                    activeTab === 'new' ? 'bg-white text-blue-950 shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Setup
                </button>
              </div>

              <div className="my-auto py-2">
                <h3 className="text-lg font-bold text-white mb-1">
                  {activeTab === 'refill' ? 'Exchange Empty Tank' : 'Complete Starter Pack'}
                </h3>
                <p className="text-xs text-blue-100/80 leading-relaxed line-clamp-2">
                  {activeTab === 'refill' 
                    ? 'Seamless weight-verified cylinder exchanges right at your home.' 
                    : 'Get a clean, certified premium cylinder along with safety hoses.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs font-semibold text-orange-400">Select Mode</span>
                <div className="p-1.5 rounded-lg bg-white/10 text-white">
                  {activeTab === 'refill' ? <RotateCcw size={16} /> : <ShoppingBag size={16} />}
                </div>
              </div>
            </div>

            {/* White Card - Video Placeholder */}
            <div className="absolute top-12 right-0 w-[55%] h-[65%] bg-white border border-slate-200/60 rounded-[32px] p-3 shadow-xl overflow-hidden flex flex-col justify-between">
              <div className="w-full h-full bg-slate-50 rounded-[24px] overflow-hidden relative flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <div className="text-6xl mb-4">🔥</div>
                  <p className="text-sm font-semibold">Video Content</p>
                </div>
              </div>
            </div>

            {/* Orange Accent Card */}
            <div className="absolute bottom-4 left-6 w-[50%] h-[24%] bg-orange-500 rounded-[32px] p-5 flex flex-col justify-center text-white shadow-lg shadow-orange-500/20">
              <div className="font-black text-2xl tracking-tight">100%</div>
              <div className="text-xs font-medium text-orange-50 opacity-90 mt-0.5">Safety & Weight Checks Passed</div>
            </div>

            {/* Decorative Accents */}
            <div className="absolute bottom-[15%] right-[20%] text-slate-300 pointer-events-none scale-150">
              ✦
            </div>
            <div className="absolute top-[5%] left-[-8%] text-blue-200 pointer-events-none scale-[2]">
              ✦
            </div>
            
            {/* Floating Ring */}
            <svg className="absolute -bottom-6 -right-6 text-slate-200 w-24 h-24 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="50" cy="50" r="40" strokeDasharray="4 4"/>
            </svg>

          </div>
        </div>

      </div>
    </section>
  );
};