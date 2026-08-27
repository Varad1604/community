"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Flame, Crown, Zap, Star, Play, Sparkles, Download, Heart, Share2,
  Wand2, Users, Layers, Rocket, Check, X, Menu, Search, TrendingUp,
  Trophy, Film, Quote, ArrowRight, Instagram, Twitter, Youtube,
  ShieldCheck, Clock, Infinity
} from "lucide-react";

type Meme = {
  id: number;
  title: string;
  category: string;
  likes: string;
  quote: string;
  gradient: string;
  emoji: string;
};

const memes: Meme[] = [
  { id: 1, title: "I will do it when I say it", category: "Punch", likes: "24.5K", quote: "Naan solratha thaan seiven, sonna tha seiven", gradient: "from-amber-600 via-orange-600 to-red-700", emoji: "😎" },
  { id: 2, title: "One Man Army", category: "Mass", likes: "18.2K", quote: "En vazhi thani vazhi", gradient: "from-zinc-800 via-neutral-900 to-black", emoji: "🦁" },
  { id: 3, title: "Robot 2.0 Chitti", category: "Sci-Fi", likes: "32.1K", quote: "Naan oru Robot illa, Super Robot", gradient: "from-cyan-600 via-blue-700 to-indigo-800", emoji: "🤖" },
  { id: 4, title: "Padayappa Rage", category: "Mass", likes: "15.7K", quote: "En vazhkaiyila marakka mudiyatha naal", gradient: "from-red-700 via-red-800 to-zinc-900", emoji: "🔥" },
  { id: 5, title: "Kabali Da", category: "Style", likes: "29.4K", quote: "Magizhchi", gradient: "from-yellow-600 via-amber-700 to-zinc-900", emoji: "🕶️" },
  { id: 6, title: "Sivaji Boss", category: "Punch", likes: "21.3K", quote: "Pannuven, maru padiyum pannuven", gradient: "from-emerald-700 via-teal-800 to-zinc-900", emoji: "💼" },
  { id: 7, title: "Baasha Autokaran", category: "Mass", likes: "26.8K", quote: "Naan oru thadava sonna, nooru thadava sonna madhiri", gradient: "from-stone-700 via-zinc-800 to-black", emoji: "🚕" },
  { id: 8, title: "Annamalai Challenge", category: "Comedy", likes: "12.9K", quote: "Malai da Annamalai", gradient: "from-orange-700 via-amber-800 to-yellow-900", emoji: "⛰️" },
];

const templates = [
  { id: "t1", name: "Sunglasses Flip", grad: "from-zinc-900 to-black", icon: "🕶️" },
  { id: "t2", name: "Cigarette Flip", grad: "from-amber-700 to-red-800", icon: "🚬" },
  { id: "t3", name: "White Kurta", grad: "from-stone-100 to-zinc-300", icon: "🤍" },
  { id: "t4", name: "Robot Eye", grad: "from-cyan-600 to-blue-800", icon: "👁️" },
  { id: "t5", name: "Kabali Suit", grad: "from-slate-800 to-zinc-900", icon: "👔" },
  { id: "t6", name: "Baasha Lunghi", grad: "from-red-700 to-zinc-900", icon: "🔥" },
  { id: "t7", name: "Padayappa Dhoti", grad: "from-yellow-700 to-orange-800", icon: "👑" },
  { id: "t8", name: "Jailer Shades", grad: "from-neutral-800 to-black", icon: "😎" },
];

const categories = ["All", "Punch", "Mass", "Sci-Fi", "Style", "Comedy"];

const pricing = [
  { name: "Fan", price: "₹0", period: "/mo", desc: "For casual Thalaivar fans", cta: "Start Free", popular: false, features: ["50 meme generations / mo", "Watermarked exports", "Access to 100 templates", "Community gallery", "720p exports"], color: "border-zinc-800" },
  { name: "Superstar", price: "₹299", period: "/mo", desc: "For creators & pages", cta: "Become Superstar", popular: true, features: ["Unlimited memes", "No watermark • 4K exports", "10,000+ Rajni templates", "AI Punch Dialogue writer", "Auto-caption & trending hashtags", "Schedule to Insta / X", "Priority render"], color: "border-amber-500/50" },
  { name: "Thalaiva", price: "₹999", period: "/mo", desc: "For agencies & brands", cta: "Claim Throne", popular: false, features: ["Everything in Superstar", "Team of 10 seats", "Brand kit & fonts", "API access & webhooks", "Bulk generation (CSV → 1000 memes)", "Commercial license", "Dedicated success manager"], color: "border-zinc-700" },
];

export default function Home() {
  const [filter, setFilter] = useState("All");
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [mobileMenu, setMobileMenu] = useState(false);
  const [topText, setTopText] = useState("NAN ORU THADAVA SONNA");
  const [bottomText, setBottomText] = useState("NOORU THADAVA SONNA MADHIRI");
  const [selectedTpl, setSelectedTpl] = useState(templates[0]);
  const [fontSize, setFontSize] = useState([38]);
  const [search, setSearch] = useState("");
  const generatorRef = useRef<HTMLDivElement>(null);

  const filtered = memes.filter(m =>
    (filter === "All" || m.category === filter) &&
    (search === "" || m.title.toLowerCase().includes(search.toLowerCase()) || m.quote.toLowerCase().includes(search.toLowerCase()))
  );

  const scrollToGen = () => generatorRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-500 selection:text-black">
      <Toaster richColors position="top-center" />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.9))]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-black text-black text-lg">R</div>
            <span className="text-xl font-black tracking-tighter">RAJNI<span className="text-amber-500">MEMES</span></span>
            <Badge className="hidden sm:flex bg-amber-500 text-black font-bold text-[10px]">SAAS • THALAIVA EDITION</Badge>
          </div>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#gallery" className="hover:text-white transition">Gallery</a>
            <a href="#generator" className="hover:text-white transition">Studio</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <span className="flex items-center gap-1 text-amber-400"><Flame className="h-3 w-3" /> 2.4M memes shipped</span>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:flex text-zinc-300" onClick={() => toast.info("Sign in — Thalaivar will be back soon!")}>Sign in</Button>
            <Button onClick={scrollToGen} className="bg-amber-500 text-black hover:bg-amber-400 font-black rounded-full px-5">Try Free <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X /> : <Menu />}</Button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden border-t border-white/10 bg-zinc-950 px-4 py-4 space-y-3 overflow-hidden">
              <a href="#gallery" className="block text-zinc-300">Gallery</a>
              <a href="#generator" className="block text-zinc-300">Studio</a>
              <a href="#pricing" className="block text-zinc-300">Pricing</a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-8 grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE: 12,403 memes generated today
              <Badge className="bg-white text-black font-bold ml-1">NEW 2.0</Badge>
            </div>
            <h1 className="font-black leading-[0.85] tracking-tighter">
              <span className="block text-5xl sm:text-7xl lg:text-[84px]" style={{ fontFamily: "Bebas Neue" }}>EN VAZHI</span>
              <span className="block text-5xl sm:text-7xl lg:text-[84px] bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: "Bebas Neue" }}>THANI VAZHI.</span>
              <span className="block text-lg sm:text-xl font-medium tracking-normal text-zinc-400 mt-2">The Superstar Meme Operating System — generate mass, punch & style in 2 seconds.</span>
            </h1>
            <p className="text-zinc-400 max-w-xl">The only SaaS blessed by Thalaivar. AI punch-dialogue, 10K Rajni templates, auto-viral captions & one-click deploy to Instagram, X & WhatsApp. <span className="text-white font-semibold">Naan oru thadava sonna, meme viral than.</span></p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={scrollToGen} className="bg-amber-500 text-black hover:bg-amber-400 font-black rounded-full px-8 h-12 text-base">Generate Meme Free <Wand2 className="ml-2 h-4 w-4" /></Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/15 text-white hover:bg-white hover:text-black h-12" onClick={() => toast.success("Demo video — style samasya illa!")}><Play className="mr-2 h-4 w-4" /> Watch Showreel</Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-amber-500" /> 847K creators</span>
              <span className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500 fill-amber-500" /> 4.9/5 (12K reviews)</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> No watermark on Pro</span>
            </div>
            <div className="flex items-center gap-3 pt-4">
              {["Netflix", "Sony Music", "Sun TV", "Lyca"].map(b => (
                <div key={b} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] tracking-widest font-bold text-zinc-400">{b}</div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 via-orange-600/20 to-red-600/20 blur-2xl rounded-3xl" />
            <Card className="relative overflow-hidden rounded-[28px] border-white/10 bg-zinc-900 p-2">
              <div className="rounded-[20px] overflow-hidden bg-black border border-white/10">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="flex items-center gap-2 text-xs font-bold tracking-widest"><span className="h-2 w-2 rounded-full bg-emerald-500" /> STUDIO PREVIEW</span>
                  <span className="text-xs text-zinc-500">rajinimemes.ai/studio</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className={`relative h-[320px] rounded-2xl bg-gradient-to-br ${selectedTpl.grad} flex flex-col items-center justify-between p-6 text-center overflow-hidden border border-white/10`}>
                    <p className="font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-none" style={{ fontSize: `${fontSize[0] * 0.42}px`, fontFamily: "Bebas Neue", textShadow: "2px 2px 0 #000" }}>{topText || "TOP TEXT"}</p>
                    <div className="text-7xl drop-shadow-xl">{selectedTpl.icon}</div>
                    <p className="font-black text-amber-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-none" style={{ fontSize: `${fontSize[0] * 0.42}px`, fontFamily: "Bebas Neue", textShadow: "2px 2px 0 #000" }}>{bottomText || "BOTTOM TEXT"}</p>
                    <div className="absolute bottom-2 right-2 text-[8px] bg-black/60 px-2 py-1 rounded-full">RAJNIMEMES • WATERMARK</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center"><TrendingUp className="h-4 w-4 mx-auto text-amber-500" /><div className="font-bold mt-1">98% Viral</div><div className="text-zinc-500">score</div></div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center"><Clock className="h-4 w-4 mx-auto text-cyan-400" /><div className="font-bold mt-1">1.2s</div><div className="text-zinc-500">render</div></div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center"><Infinity className="h-4 w-4 mx-auto text-emerald-400" /><div className="font-bold mt-1">4K</div><div className="text-zinc-500">export</div></div>
                  </div>
                </div>
              </div>
            </Card>
            <div className="absolute -bottom-6 -right-2 sm:right-4 bg-amber-500 text-black rounded-2xl px-4 py-3 font-black text-sm shadow-xl rotate-2">
              <div className="flex items-center gap-2"><Crown className="h-4 w-4" /> SUPERSTAR PLAN • ₹299/mo</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3 text-sm"><Layers className="h-4 w-4 text-amber-500" /> Trusted by meme pages with 100M+ followers</div>
          <div className="flex gap-2 text-xs font-bold">
            <span className="bg-white text-black rounded-full px-3 py-1">Troll Cinema 2.4M</span>
            <span className="bg-white/10 rounded-full px-3 py-1">Chennai Memes 1.8M</span>
            <span className="bg-white/10 rounded-full px-3 py-1 hidden sm:inline">Rajni Fans Kerala 900K</span>
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-7xl px-4 sm:px-6 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs tracking-widest"><Film className="h-4 w-4" /> BLOCKBUSTER GALLERY</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mt-1">THALAIVAR TEMPLATES</h2>
            <p className="text-zinc-500 text-sm">Hand-curated • Updated daily • One click remix</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Search punch dialogue..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900 border-white/10 rounded-full w-56" />
            </div>
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mt-6">
          <TabsList className="bg-zinc-900 border border-white/10 rounded-full p-1 h-auto flex-wrap">
            {categories.map(c => (
              <TabsTrigger key={c} value={c} className="rounded-full data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold text-xs px-4 py-1.5">{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {filtered.map(m => (
            <motion.div key={m.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group">
              <Card className="overflow-hidden rounded-2xl border-white/10 bg-zinc-900 hover:border-amber-500/30 transition">
                <div className={`h-56 bg-gradient-to-br ${m.gradient} relative p-4 flex flex-col justify-between`}>
                  <div className="flex justify-between items-start">
                    <Badge className="bg-black/60 backdrop-blur text-white border-white/20 text-[10px]">{m.category}</Badge>
                    <span className="text-4xl">{m.emoji}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-white leading-tight text-lg" style={{ fontFamily: "Bebas Neue", textShadow: "1px 1px 0 #000" }}>{m.title.toUpperCase()}</p>
                    <p className="text-xs text-white/80 flex items-center gap-1"><Quote className="h-3 w-3" /> {m.quote}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                </div>
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 flex items-center gap-1"><Heart className={`h-3 w-3 ${liked.has(m.id) ? "fill-red-500 text-red-500" : ""}`} /> {m.likes}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => {
                      const n = new Set(liked);
                      if (n.has(m.id)) n.delete(m.id); else n.add(m.id);
                      setLiked(n);
                      toast.success(n.has(m.id) ? "Liked! Thalaivar approves 🙏" : "Unliked");
                    }}><Heart className={`h-3.5 w-3.5 ${liked.has(m.id) ? "fill-red-500 text-red-500" : ""}`} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => { setTopText(m.title.toUpperCase()); setSelectedTpl(templates[m.id % templates.length]); scrollToGen(); toast.success("Loaded in Studio!"); }}><Wand2 className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => toast.success("Link copied — share pannu!")}><Share2 className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" className="h-7 w-7 rounded-full bg-amber-500 text-black hover:bg-amber-400" onClick={() => toast.success("Downloaded 4K • No watermark on Pro")}><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center py-16 text-zinc-500">No memes found for &quot;{search}&quot; — try &quot;Baasha&quot; or &quot;Kabali&quot;</div>}
      </section>

      <section ref={generatorRef} id="generator" className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="rounded-[32px] border border-amber-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-4 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 space-y-5 w-full">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-500 text-black font-black text-xs px-3 py-1 rounded-full"><Sparkles className="h-3 w-3" /> STUDIO 2.0 — AI PUNCH WRITER</div>
                <h2 className="text-3xl font-black tracking-tighter mt-3">GENERATE MASS IN 2 SECONDS</h2>
                <p className="text-zinc-500 text-sm">Pick a Thalaivar avatar, add punch, export 4K. Free plan watermarked.</p>
              </div>

              <div>
                <div className="text-xs font-bold tracking-widest text-zinc-400 mb-2">1. CHOOSE AVATAR</div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {templates.map(t => (
                    <button key={t.id} onClick={() => setSelectedTpl(t)} className={`rounded-2xl h-16 sm:h-20 bg-gradient-to-br ${t.grad} border-2 flex flex-col items-center justify-center gap-1 text-lg transition ${selectedTpl.id === t.id ? "border-amber-500 scale-105" : "border-white/10 hover:border-white/20"}`}>
                      <span className="text-xl sm:text-2xl">{t.icon}</span>
                      <span className="text-[8px] font-bold tracking-widest text-white/80 hidden sm:block">{t.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-widest text-zinc-400">TOP TEXT (TAMIL-ENGLISH)</label>
                  <Input value={topText} onChange={e => setTopText(e.target.value.toUpperCase())} className="bg-black border-white/10 rounded-xl font-black tracking-wide" placeholder="NAN ORU THADAVA SONNA" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-widest text-zinc-400">BOTTOM TEXT</label>
                  <Input value={bottomText} onChange={e => setBottomText(e.target.value.toUpperCase())} className="bg-black border-white/10 rounded-xl font-black tracking-wide text-amber-400" placeholder="NOORU THADAVA SONNA MADHIRI" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold tracking-widest text-zinc-400"><span>FONT SIZE</span><span className="text-amber-500">{fontSize[0]}px</span></div>
                <Slider value={fontSize} onValueChange={setFontSize} min={24} max={56} step={1} className="[&>span:first-child]:bg-amber-500" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => { const q = ["KABALI DA", "MAGIZHCHI", "LUNGI DANCE", "SUPERSTAR DA"][Math.floor(Math.random() * 4)]; setTopText(q); toast.success(`AI punch: "${q}" ✨`); }} variant="secondary" className="rounded-full bg-white text-black hover:bg-zinc-200 font-bold"><Wand2 className="h-4 w-4 mr-2" /> AI Punch Suggest</Button>
                <Button onClick={() => toast.success("Downloaded • Upgrade to remove watermark")} className="rounded-full bg-amber-500 text-black hover:bg-amber-400 font-black flex-1 sm:flex-none"><Download className="h-4 w-4 mr-2" /> Download 4K</Button>
                <Button onClick={() => toast.success("Shared to X — trending in 3...2...1")} variant="outline" className="rounded-full border-white/15 text-white"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
              </div>

              <div className="flex flex-wrap gap-2 text-[10px]">
                <Badge variant="outline" className="border-white/10 text-zinc-400">✓ No signup needed</Badge>
                <Badge variant="outline" className="border-white/10 text-zinc-400">✓ Tamil • Telugu • Hindi • English</Badge>
                <Badge variant="outline" className="border-white/10 text-zinc-400">✓ Remove BG</Badge>
              </div>
            </div>

            <div className="w-full lg:w-[420px] shrink-0">
              <div className="sticky top-24 space-y-3">
                <div className={`rounded-[24px] overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br ${selectedTpl.grad} p-6 min-h-[380px] flex flex-col justify-between text-center relative`}>
                  <p className="font-black text-white leading-none tracking-tight break-words" style={{ fontSize: `${fontSize[0] * 0.55}px`, fontFamily: "Bebas Neue", textShadow: "3px 3px 0 #000, -1px -1px 0 #000", lineHeight: 0.9 }}>{topText || " "}</p>
                  <div className="py-6 text-8xl drop-shadow-2xl animate-pulse">{selectedTpl.icon}</div>
                  <p className="font-black text-amber-400 leading-none tracking-tight break-words" style={{ fontSize: `${fontSize[0] * 0.55}px`, fontFamily: "Bebas Neue", textShadow: "3px 3px 0 #000, -1px -1px 0 #000", lineHeight: 0.9 }}>{bottomText || " "}</p>
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold">{selectedTpl.name}</div>
                  <div className="absolute bottom-3 right-3 bg-amber-500 text-black px-2 py-1 rounded-full text-[9px] font-black">RAJNIMEMES.COM</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" className="rounded-full bg-white text-black font-bold" onClick={() => toast.success("Copied meme link")}>Copy Link</Button>
                  <Button size="sm" variant="outline" className="rounded-full border-white/15 text-white" onClick={() => toast.success("Added to collection")}>Save</Button>
                  <Button size="sm" className="rounded-full bg-zinc-800 text-white" onClick={() => { setTopText("NAN ORU THADAVA SONNA"); setBottomText("NOORU THADAVA SONNA MADHIRI"); }}>Reset</Button>
                </div>
                <p className="text-center text-[11px] text-zinc-500">Free exports have watermark • <a className="text-amber-500 underline" href="#pricing">Go Pro to remove</a></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-amber-500 text-black font-black">PRICING • SUPERSTAR PLANS</Badge>
          <h2 className="text-4xl font-black tracking-tighter mt-3">PAY LIKE A FAN. <span className="text-amber-500">CREATE LIKE THALAIVAR.</span></h2>
          <p className="text-zinc-500 text-sm mt-2">No questions asked. Upgrade, downgrade, cancel anytime. GST included. UPI / Card / Netbanking.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {pricing.map(p => (
            <Card key={p.name} className={`rounded-[24px] border-2 ${p.color} bg-zinc-900 relative overflow-hidden flex flex-col ${p.popular ? "scale-[1.02] shadow-[0_0_40px_rgba(245,158,11,0.25)]" : ""}`}>
              {p.popular && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />}
              {p.popular && <Badge className="absolute top-4 right-4 bg-amber-500 text-black font-black">MOST POPULAR</Badge>}
              <CardContent className="p-6 sm:p-7 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-amber-500"><Crown className="h-4 w-4" /> <span className="font-black tracking-widest text-xs">{p.name.toUpperCase()}</span></div>
                <div className="flex items-baseline gap-1 mt-2"><span className="text-4xl font-black">{p.price}</span><span className="text-zinc-500 text-sm">{p.period}</span></div>
                <p className="text-zinc-500 text-sm mt-1">{p.desc}</p>
                <Button className={`mt-5 rounded-full font-black h-11 ${p.popular ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-white text-black hover:bg-zinc-200"}`} onClick={() => toast.success(`${p.name} activated — style-ku maranam illa! 🎉`)}>{p.cta} <Rocket className="h-4 w-4 ml-2" /></Button>
                <div className="mt-6 space-y-2.5">
                  {p.features.map(f => (
                    <div key={f} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> <span className="text-zinc-300">{f}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> 7-day refund</span>
          <span>•</span><span>Cancel anytime</span><span>•</span><span>255-bit SSL</span><span>•</span><span>Made in Chennai ❤️</span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16 grid lg:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: "AI Punch Writer", desc: "Type mood → get 5 Rajni-style punch dialogues in Tamil/English. Trained on 500 films." },
          { icon: Layers, title: "10K+ Templates", desc: "Every mass look from 1975-2025. Baasha to Jailer. Auto background remover." },
          { icon: Trophy, title: "Viral Engine", desc: "Auto hashtags, best time to post, trending audio sync. 3x more reach." },
        ].map(f => (
          <Card key={f.title} className="rounded-2xl bg-zinc-900 border-white/10 p-6">
            <f.icon className="h-6 w-6 text-amber-500" />
            <h3 className="font-black mt-3">{f.title}</h3>
            <p className="text-sm text-zinc-500 mt-1">{f.desc}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-12">
        <Card className="rounded-[24px] bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 border-0 overflow-hidden">
          <CardContent className="p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-3xl font-black text-black leading-none" style={{ fontFamily: "Bebas Neue" }}>READY TO GO MASS?</h3>
              <p className="text-black/80 font-medium">Join 847K creators. First 3 memes free — no card needed.</p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <Input placeholder="your@email.com" className="bg-white border-0 rounded-full h-12 lg:w-72 placeholder:text-zinc-500 text-black" />
              <Button onClick={() => toast.success("Welcome to the RajniVerse — check your email! 📧")} className="bg-black text-white hover:bg-zinc-900 rounded-full h-12 px-8 font-black shrink-0">Start Free</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="mt-16 border-t border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid sm:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 font-black text-lg tracking-tighter"><span className="h-8 w-8 rounded-lg bg-amber-500 text-black flex items-center justify-center">R</span> RAJNI<span className="text-amber-500">MEMES</span></div>
            <p className="text-zinc-500 mt-2 text-xs leading-relaxed">Not affiliated with Superstar Rajnikanth. Fan-made, mass-made. En vazhi thani vazhi since 2024.</p>
            <div className="flex gap-2 mt-3">
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition"><Youtube className="h-4 w-4" /></a>
            </div>
          </div>
          <div><div className="font-bold text-white">Product</div><div className="mt-3 space-y-1.5 text-zinc-500"><div>Gallery</div><div>Studio</div><div>API</div><div>Brand Kit</div></div></div>
          <div><div className="font-bold text-white">Legal</div><div className="mt-3 space-y-1.5 text-zinc-500"><div>Terms</div><div>Privacy</div><div>License</div><div>Refund</div></div></div>
          <div><div className="font-bold text-white">Thalaivar Says</div><p className="mt-3 text-zinc-400 italic text-xs leading-relaxed">&quot;Kaila kasu illa naalum, style-a vida koodathu. Meme panrathu kooda oru mass thaan.&quot;</p><p className="text-amber-500 font-bold text-xs mt-2">— Superstar, probably</p></div>
        </div>
        <div className="border-t border-white/5 py-4 text-center text-xs text-zinc-600">© 2026 RajniMemes SaaS • Built with mass & magizhchi • Chennai • All rights reserved to fans</div>
      </footer>
    </div>
  );
}
