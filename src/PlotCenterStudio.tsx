import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    Upload,
    Ruler,
    Cpu,
    Zap,
    FileImage,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Layout,
    Eye,
    Download,
    Image as ImageIcon,
    RefreshCcw,
    Sparkles,
    ArrowRight,
    Monitor,
    BarChart3,
    Activity,
    Maximize2,
    TrendingUp,
    Percent,
    Palette,
    Type,
    Wand2,
    FileText,
    ClipboardCheck
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

// Escenarios para el Mockup
const SCENES = [
    {
        id: 'billboard',
        name: 'Valla Publicitaria Premium',
        category: 'Exterior',
        preview: 'https://images.unsplash.com/photo-1541535650810-10d26f5c2abb?auto=format&fit=crop&q=80&w=1200',
        containerStyle: 'perspective-[1200px]',
        innerStyle: 'w-[72%] h-[42%] bg-white shadow-2xl absolute top-[20%] left-[14%] transform rotate-y-[-18deg] rotate-x-[2deg] skew-y-[-1deg]',
        lighting: 'bg-gradient-to-tr from-black/20 via-transparent to-white/10',
        blend: 'multiply'
    },
    {
        id: 'mupi-night',
        name: 'Mupi Urbano Nocturno',
        category: 'Ciudad',
        preview: 'https://images.unsplash.com/photo-1617393445313-fe76005086ec?auto=format&fit=crop&q=80&w=1200',
        containerStyle: 'perspective-[1000px]',
        innerStyle: 'w-[32.5%] h-[58%] bg-white absolute top-[18.2%] left-[33.8%] transform rotate-y-[4deg] shadow-[0_0_50px_rgba(255,255,255,0.2)]',
        lighting: 'bg-gradient-to-b from-white/20 via-transparent to-black/40',
        blend: 'screen',
        glow: true
    },
    {
        id: 'gallery',
        name: 'Galería Minimalista',
        category: 'Interior',
        preview: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1200',
        containerStyle: '',
        innerStyle: 'w-[42%] h-[56%] bg-white absolute top-[20%] left-[29%] border-[16px] border-slate-900 shadow-[0_50px_100px_rgba(0,0,0,0.5)]',
        lighting: 'bg-gradient-to-br from-white/10 to-black/20',
        blend: 'normal'
    }
];

export default function PlotCenterStudio() {
    const [view, setView] = useState('preflight');
    const [file, setFile] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Pre-flight State
    const [targetW, setTargetW] = useState(100);
    const [targetH, setTargetH] = useState(100);
    const [unit, setUnit] = useState('cm');
    const [metrics, setMetrics] = useState({ dpi: 0, distance: 0, ratio: 1, ratioText: 'Cuadrado', scalability: 0 });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [preflightReport, setPreflightReport] = useState(null);
    const [enhancedImage, setEnhancedImage] = useState(null);

    // Mockup State
    const [selectedScene, setSelectedScene] = useState(SCENES[0]);
    const [mockupAnalysis, setMockupAnalysis] = useState(null);
    const [mockupAdj, setMockupAdj] = useState({ zoom: 100, x: 0, y: 0 });

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const updateMetrics = useCallback(() => {
        if (!file || !targetW || !targetH) return;
        let wInches = unit === 'cm' ? targetW / 2.54 : unit === 'm' ? (targetW * 100) / 2.54 : targetW;
        const dpi = Math.round(file.width / wInches);
        const distance = (300 / (dpi || 1)) * 0.35;
        const scalability = Math.max(0, Math.round((dpi / 72) * 100) - 100);
        const ratio = targetW / targetH;
        const ratioText = ratio > 1.2 ? 'Paisaje' : ratio < 0.8 ? 'Retrato' : 'Cuadrado';
        setMetrics({ dpi, distance: distance.toFixed(2), ratio, ratioText, scalability });
    }, [file, targetW, targetH, unit]);

    useEffect(() => { updateMetrics(); }, [updateMetrics]);

    const handleFile = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setFile({
                        name: selectedFile.name,
                        width: img.width,
                        height: img.height,
                        base64: event.target.result.split(',')[1],
                        preview: event.target.result
                    });
                    setPreflightReport(null);
                    setMockupAnalysis(null);
                    setEnhancedImage(null);
                    showToast("DISEÑO CARGADO");
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const runAIAnalysis = async (type) => {
        if (!file) return;
        setIsAnalyzing(true);

        const systemPrompt = type === 'preflight'
            ? `Eres el Analista Jefe de Plot Center. Analiza el archivo para impresión de gran formato de forma exhaustiva. 
         Responde estrictamente en JSON con:
         "analisis": (string largo detallando nitidez, calidad visual, ruidos y artefactos),
         "sustrato": (string sugerencia de material),
         "acabado": (string sugerencia de terminación),
         "scores": { "nitidez": 0-100, "contraste": 0-100, "color": 0-100 },
         "veredicto_final": "APTO" | "APTO CON RESERVAS" | "NO APTO",
         "motivo_veredicto": (string corto resumido),
         "detected_colors": [{"hex": "#string", "name": "string"}],
         "detected_typography": ["string"],
         "recomienda_retoque": (boolean)`
            : `Experto en Neuromarketing. Analiza impacto en ${selectedScene.name}. Responde en JSON: "impacto": 0-100, "puntos_fuertes": [], "sugerencias": [].`;

        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Genera un diagnóstico técnico detallado, incluyendo análisis de colores y tipografía." }, { inlineData: { mimeType: "image/png", data: file.base64 } }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { responseMimeType: "application/json" }
                })
            });
            const result = await response.json();
            const data = JSON.parse(result.candidates[0].content.parts[0].text);

            if (type === 'preflight') setPreflightReport(data);
            else setMockupAnalysis(data);

            showToast("DIAGNÓSTICO COMPLETO");
        } catch (e) {
            console.error(e);
            showToast("ERROR DE RED IA");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateEnhancedVersion = async () => {
        if (!file) return;
        setIsGenerating(true);
        showToast("RE-DISEÑANDO CON NANO BANANA...");

        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;

        const prompt = "Actúa como un diseñador senior de Plot Center. Rediseña esta imagen para que sea una versión 'mejorada' de alta fidelidad, optimizada para impresión profesional de lujo. Mantén los elementos centrales pero eleva la estética.";

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: "image/png", data: file.base64 } }
                        ]
                    }],
                    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
                })
            });

            const result = await response.json();
            const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

            if (base64Data) {
                setEnhancedImage(`data:image/png;base64,${base64Data}`);
                showToast("VERSIÓN MASTER IA LISTA");
            } else {
                showToast("ERROR GENERATIVO");
            }
        } catch (error) {
            console.error(error);
            showToast("ERROR DE CONEXIÓN GENERATIVA");
        } finally {
            setIsGenerating(false);
        }
    };

    const chartData = [
        { name: 'Tu Archivo', val: metrics.dpi, fill: '#eb671b' },
        { name: 'Gran Formato', val: 72, fill: '#64748b' },
        { name: 'Comercial', val: 150, fill: '#64748b' },
        { name: 'Bellas Artes', val: 300, fill: '#64748b' },
    ];

    const getVerdictStyle = (verdict) => {
        switch (verdict) {
            case 'APTO': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]', icon: <CheckCircle2 className="text-emerald-400" size={32} /> };
            case 'APTO CON RESERVAS': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]', icon: <AlertTriangle className="text-amber-400" size={32} /> };
            case 'NO APTO': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-[0_0_40px_rgba(239,68,68,0.2)]', icon: <XCircle className="text-red-400" size={32} /> };
            default: return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', glow: '', icon: <Activity size={32} /> };
        }
    };

    return (
        <div className="min-h-screen bg-[#06080f] text-white selection:bg-orange-500/30 font-sans antialiased pb-20">
            <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(at_0%_0%,#eb671b_0,transparent_50%),radial-gradient(at_100%_100%,#6366f1_0,transparent_50%)]"></div>

            <nav className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#eb671b] to-[#ff8c42] rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
                            <ShieldCheck size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white uppercase">Plot Center <span className="text-orange-500">Studio</span></h1>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.3em]">AI Technical Lab</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        <button onClick={() => setView('preflight')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'preflight' ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white'}`}>Diagnóstico</button>
                        {file && <button onClick={() => setView('mockup')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'mockup' ? 'bg-orange-500 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}><Monitor size={14} />Simulador</button>}
                    </div>
                </div>
            </nav>

            <main className="max-w-[1600px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

                <aside className="lg:col-span-4 space-y-6">
                    <div className="bg-[#111827]/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/10">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Activity size={12} /> Unidad de Ingesta</h2>

                        {!file ? (
                            <label className="block group cursor-pointer">
                                <input type="file" className="hidden" onChange={handleFile} accept="image/*" />
                                <div className="rounded-[2.5rem] p-12 text-center bg-slate-900/40 border-2 border-dashed border-white/10 group-hover:border-orange-500/50 transition-all">
                                    <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-600 mb-4 group-hover:text-orange-500 transition-colors shadow-inner"><Upload size={32} /></div>
                                    <p className="text-sm font-bold text-slate-200 uppercase tracking-tighter">Vincular Archivo</p>
                                </div>
                            </label>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-800 bg-cover bg-center border border-white/10 shadow-xl" style={{ backgroundImage: `url(${file.preview})` }}></div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-black text-white truncate">{file.name}</p>
                                        <p className="text-[10px] text-orange-500 font-bold tracking-widest uppercase mt-1">{file.width}x{file.height} PX</p>
                                    </div>
                                </div>

                                <div className="space-y-5 bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase px-1 opacity-70">Ancho Final</label>
                                            <input type="number" value={targetW} onChange={(e) => setTargetW(e.target.value)} className="w-full px-5 py-4 bg-slate-900/80 border border-white/5 rounded-2xl outline-none focus:border-orange-500 text-white font-bold" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase px-1 opacity-70">Alto Final</label>
                                            <input type="number" value={targetH} onChange={(e) => setTargetH(e.target.value)} className="w-full px-5 py-4 bg-slate-900/80 border border-white/5 rounded-2xl outline-none focus:border-orange-500 text-white font-bold" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-1 bg-slate-950 rounded-xl">
                                        {['cm', 'm', 'in'].map(u => (
                                            <button key={u} onClick={() => setUnit(u)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${unit === u ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500'}`}>{u.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={() => runAIAnalysis('preflight')} disabled={isAnalyzing} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-indigo-900/20 active:scale-95 transition-all disabled:opacity-50">
                                        {isAnalyzing ? <RefreshCcw className="animate-spin" size={16} /> : <Zap size={16} />}
                                        Analizar ADN Visual
                                    </button>
                                    <button onClick={generateEnhancedVersion} disabled={isGenerating || !file} className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2.5rem] text-orange-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                                        {isGenerating ? <RefreshCcw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                        Nano Banana: Mejorar Arte
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                <section className="lg:col-span-8">
                    <div className="bg-[#111827]/60 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-2xl border border-white/10 min-h-[750px] flex flex-col relative overflow-hidden">

                        {view === 'preflight' ? (
                            <div className="flex-grow flex flex-col relative z-10 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between mb-12">
                                    <div>
                                        <h2 className="text-4xl font-black text-white tracking-tighter italic leading-none">Diagnostic Analytics</h2>
                                        <p className="text-sm text-slate-400 mt-3 opacity-80">Unidad neural de validación estética y técnica.</p>
                                    </div>
                                </div>

                                {!file ? (
                                    <div className="flex-grow flex flex-col items-center justify-center opacity-10 py-48"><FileImage size={100} strokeWidth={1} /><p className="mt-6 text-2xl font-black italic uppercase tracking-tighter">Waiting for Input...</p></div>
                                ) : (
                                    <div className="space-y-12">

                                        {/* VEREDICTO DE CALIDAD */}
                                        <div className="animate-in slide-in-from-top-10 duration-700">
                                            {isAnalyzing ? (
                                                <div className="w-full p-10 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/20 flex flex-col items-center gap-6 text-center">
                                                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-lg"></div>
                                                    <p className="text-xl font-black text-indigo-300 italic">Analizando píxeles y tipografía...</p>
                                                </div>
                                            ) : preflightReport ? (
                                                (() => {
                                                    const v = getVerdictStyle(preflightReport.veredicto_final);
                                                    return (
                                                        <div className={`w-full p-10 rounded-[3.5rem] ${v.bg} border-2 ${v.border} ${v.glow} flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl`}>
                                                            <div className="shrink-0 p-6 bg-black/40 rounded-[2.5rem] shadow-inner">{v.icon}</div>
                                                            <div className="text-center md:text-left flex-grow">
                                                                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-2 opacity-80">Veredicto de Impresión</p>
                                                                <h3 className={`text-5xl font-black ${v.color} tracking-tighter leading-none`}>{preflightReport.veredicto_final}</h3>
                                                                <p className="text-sm text-white font-medium mt-4 max-w-lg leading-relaxed">{preflightReport.motivo_veredicto}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : null}
                                        </div>

                                        {/* INFORME TÉCNICO ESCRITO (DIAGNÓSTICO COMPLETO) */}
                                        {preflightReport && (
                                            <div className="p-10 rounded-[3.5rem] bg-white/5 border border-white/10 animate-in fade-in duration-1000 shadow-xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><FileText size={120} /></div>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                                        <ClipboardCheck size={22} />
                                                    </div>
                                                    <h3 className="text-xl font-black text-white italic tracking-tight">Informe Técnico Detallado</h3>
                                                </div>
                                                <div className="text-sm text-white leading-relaxed font-medium space-y-4 max-w-3xl border-l-2 border-indigo-500/30 pl-8">
                                                    {preflightReport.analisis.split('\n').map((para, i) => (
                                                        <p key={i} className="opacity-90">{para}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* ADN: TIPOGRAFÍA Y COLORES */}
                                        {preflightReport && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-lg">
                                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-2"><Palette size={14} /> ADN Cromático Detectado</h4>
                                                    <div className="flex flex-wrap gap-4">
                                                        {preflightReport.detected_colors.map((c, i) => (
                                                            <div key={i} className="flex items-center gap-3 bg-black/40 p-2 pr-5 rounded-full border border-white/10 shadow-xl">
                                                                <div className="w-10 h-10 rounded-full border border-white/20 shadow-lg shrink-0" style={{ backgroundColor: c.hex }}></div>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-white">{c.hex.toUpperCase()}</p>
                                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{c.name}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-lg">
                                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-2"><Type size={14} /> Familias Tipográficas</h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {preflightReport.detected_typography.map((t, i) => (
                                                            <span key={i} className="px-5 py-3 bg-indigo-500/20 border border-indigo-500/30 rounded-[1.2rem] text-xs font-black text-white italic shadow-lg tracking-tight">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="mt-8 p-4 bg-black/20 rounded-2xl border border-white/5">
                                                        <p className="text-[9px] text-slate-400 italic">Detección basada en recognition de formas y glifos vía OCR Neural.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* IA ENHANCED: NANO BANANA */}
                                        {enhancedImage && (
                                            <div className="p-10 rounded-[3.5rem] bg-orange-500/10 border border-orange-500/20 animate-in slide-in-from-bottom-10 duration-700 shadow-2xl">
                                                <div className="flex items-center justify-between mb-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20"><Sparkles size={24} /></div>
                                                        <div>
                                                            <h3 className="text-2xl font-black text-white tracking-tight italic leading-none">AI Enhanced (Nano Banana)</h3>
                                                            <p className="text-[10px] font-black text-orange-400 uppercase mt-2 tracking-widest">Optimización de Arte para Plotter</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => {
                                                        const link = document.createElement("a");
                                                        link.href = enhancedImage;
                                                        link.download = "plot-center-enhanced.png";
                                                        link.click();
                                                    }} className="px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all">
                                                        <Download size={14} /> Exportar Master
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                                                    <div className="space-y-6 text-white pr-4">
                                                        <p className="text-sm leading-relaxed font-medium opacity-90 border-l-2 border-orange-500 pl-6">Hemos generado una versión reconstruida por IA que optimiza el contraste local, elimina ruidos de compresión y suaviza bordes tipográficos para una impresión master de lujo.</p>
                                                        <div className="flex gap-4">
                                                            <div className="flex flex-col gap-1"><span className="text-[9px] font-black uppercase text-slate-500">Nitidez</span><div className="w-20 h-1 bg-orange-500/20 rounded-full"><div className="w-[95%] h-full bg-orange-500 rounded-full"></div></div></div>
                                                            <div className="flex flex-col gap-1"><span className="text-[9px] font-black uppercase text-slate-500">Balance</span><div className="w-20 h-1 bg-orange-500/20 rounded-full"><div className="w-[88%] h-full bg-orange-500 rounded-full"></div></div></div>
                                                        </div>
                                                    </div>
                                                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group ring-4 ring-orange-500/20">
                                                        <img src={enhancedImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Enhanced" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Densidad DPI</p>
                                                <div className="flex items-baseline gap-2"><span className="text-6xl font-black text-white leading-none tabular-nums">{metrics.dpi}</span><span className="text-xs font-bold text-orange-500 uppercase tracking-tighter">DPI</span></div>
                                            </div>
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Escalabilidad</p>
                                                <div className="flex items-baseline gap-2"><span className="text-6xl font-black text-white leading-none tabular-nums">+{metrics.scalability}</span><span className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">%</span></div>
                                            </div>
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center text-center">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Ratio Proporción</p>
                                                <div className="border-2 border-white/30 rounded-xl mb-3 shadow-2xl bg-white/5" style={{ width: metrics.ratio > 1 ? '50px' : `${50 * metrics.ratio}px`, height: metrics.ratio > 1 ? `${50 / metrics.ratio}px` : '50px' }}></div>
                                                <p className="text-[11px] font-black text-white uppercase tracking-widest">{metrics.ratioText}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                            <div className="lg:col-span-8 p-10 bg-white/5 rounded-[3rem] border border-white/10 shadow-xl">
                                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-2"><BarChart3 size={14} /> Benchmarking de Resolución</h3>
                                                <div className="h-[280px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                                            <XAxis dataKey="name" stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#ffffff' }} />
                                                            <YAxis stroke="#ffffff" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#ffffff' }} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#0f172a',
                                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                                    borderRadius: '16px',
                                                                    color: '#ffffff',
                                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                                                                }}
                                                                itemStyle={{ color: '#ffffff' }}
                                                                labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}
                                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                            />
                                                            <Bar dataKey="val" radius={[10, 10, 0, 0]} barSize={45}>
                                                                {chartData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-4 p-8 bg-[#eb671b]/10 rounded-[2.5rem] border border-orange-500/20 text-center flex flex-col justify-center items-center min-h-[350px] shadow-2xl">
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-6">Visibilidad Óptima</p>
                                                <span className="text-7xl font-black text-white tabular-nums leading-none">{metrics.distance}</span>
                                                <p className="text-[11px] font-bold text-white mt-4 uppercase tracking-widest opacity-80">METROS MÍNIMOS</p>
                                                <div className="mt-10 p-5 bg-black/40 rounded-2xl border border-white/5">
                                                    <p className="text-[9px] text-slate-400 font-medium italic leading-relaxed">Distancia calculada para evitar la percepción de la retícula de píxeles.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col relative z-10 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between mb-10">
                                    <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">Impact Simulator</h2>
                                    <p className="text-sm text-slate-300 mt-1 uppercase font-black tracking-widest"><span className="text-orange-500">{selectedScene.name}</span></p>
                                </div>

                                <div className="flex-grow flex items-center justify-center bg-slate-900/80 rounded-[4rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                                    <div className={`w-full h-full bg-cover bg-center absolute transition-all duration-1000 ${selectedScene.containerStyle}`} style={{ backgroundImage: `url(${selectedScene.preview})` }}>
                                        <div className={`${selectedScene.innerStyle} overflow-hidden shadow-2xl shadow-black/50 transition-all duration-300`} style={{ transform: `${selectedScene.innerStyle.split('transform ')[1] || ''} scale(${mockupAdj.zoom / 100}) translate(${mockupAdj.x}px, ${mockupAdj.y}px)` }}>
                                            <img src={enhancedImage || file.preview} className="w-full h-full object-cover" />
                                            <div className={`absolute inset-0 ${selectedScene.lighting} pointer-events-none mix-blend-${selectedScene.blend}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="absolute -right-60 -bottom-60 w-[500px] h-[500px] bg-[#eb671b]/5 rounded-full blur-[180px]"></div>
                    </div>
                </section>
            </main>

            {toast.show && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-12 fade-in duration-500 z-[200]">
                    <div className="bg-white text-[#080b14] px-10 py-5 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] font-black text-xs uppercase tracking-widest flex items-center gap-4 border border-white/20">
                        <Zap className="text-orange-500 fill-orange-500" size={18} />
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
