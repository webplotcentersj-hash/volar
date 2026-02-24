import React, { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import {
    Upload,
    Copy,
    FileCode,
    Zap,
    RefreshCcw,
    Wand2,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Activity,
    Palette,
    Download
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell as RechartsCell
} from 'recharts';

interface ColorData {
    hex: string;
    rgb: { r: number; g: number; b: number };
    cmyk: { c: number; m: number; y: number; k: number };
}

interface VerdictStyle {
    color: string;
    bg: string;
    border: string;
    icon: React.ReactElement;
}

export default function PlotCenterStudio() {
    const [image, setImage] = useState<string | null>(null);
    const [fileData, setFileData] = useState<{
        name: string;
        width: number;
        height: number;
        base64: string;
        preview: string;
    } | null>(null);

    const [selectedColor, setSelectedColor] = useState<ColorData>({
        hex: '#F8FAFC',
        rgb: { r: 248, g: 250, b: 252 },
        cmyk: { c: 0, m: 0, y: 0, k: 0 }
    });
    const [recentColors, setRecentColors] = useState<string[]>([]);

    // Estados de configuración técnica
    const [targetW, setTargetW] = useState<number>(100);
    const [targetH, setTargetH] = useState<number>(100);
    const [unit, setUnit] = useState<'cm' | 'm' | 'in'>('cm');
    const [metrics, setMetrics] = useState({ dpi: 0, distance: '0.00', ratio: 1, ratioText: 'Cuadrado', scalability: 0 });

    // Estados de IA
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    const showToast = (message: string) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // Persistence Layer
    useEffect(() => {
        const saved = localStorage.getItem('pc_studio_session');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.fileData) {
                    setFileData(data.fileData);
                    setImage(data.preview);
                }
                if (data.targetW) setTargetW(data.targetW);
                if (data.targetH) setTargetH(data.targetH);
                if (data.unit) setUnit(data.unit);
                if (data.report) setReport(data.report);
            } catch (e) { console.error("Error loading session", e); }
        }
    }, []);

    useEffect(() => {
        const session = { fileData, preview: image, targetW, targetH, unit, report };
        localStorage.setItem('pc_studio_session', JSON.stringify(session));
    }, [fileData, image, targetW, targetH, unit, report]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const base64 = (event.target?.result as string).split(',')[1];
                    setFileData({
                        name: file.name,
                        width: img.width,
                        height: img.height,
                        base64,
                        preview: event.target?.result as string
                    });
                    setImage(event.target?.result as string);
                    setReport(null);
                    setEnhancedImage(null);
                    showToast("DISEÑO VINCULADO");
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    // Cálculo de métricas en tiempo real
    const updateMetrics = useCallback(() => {
        if (!fileData || !targetW || !targetH) return;

        let wInches = unit === 'cm' ? targetW / 2.54 : unit === 'm' ? (targetW * 100) / 2.54 : targetW;
        const dpi = Math.round(fileData.width / wInches);
        const distance = (300 / (dpi || 1)) * 0.35;
        const scalability = Math.max(0, Math.round((dpi / 72) * 100) - 100);
        const ratio = targetW / targetH;
        const ratioText = ratio > 1.2 ? 'Paisaje' : ratio < 0.8 ? 'Retrato' : 'Cuadrado';

        setMetrics({ dpi, distance: distance.toFixed(2), ratio, ratioText, scalability });
    }, [fileData, targetW, targetH, unit]);

    useEffect(() => { updateMetrics(); }, [updateMetrics]);

    // Análisis Técnico con Gemini
    const runAnalysis = async () => {
        if (!fileData) return;
        setIsAnalyzing(true);

        const systemPrompt = `Eres el Analista Jefe de Plot Center. Analiza el archivo para impresión profesional. 
        Responde estrictamente en JSON con:
        "analisis": (string largo detallado),
        "sustrato": (string),
        "acabado": (string),
        "scores": { "nitidez": 0-100, "contraste": 0-100, "color": 0-100 },
        "veredicto_final": "APTO" | "APTO CON RESERVAS" | "NO APTO",
        "motivo_veredicto": (string corto resumido),
        "detected_colors": [{"hex": "#string", "name": "string"}],
        "detected_typography": ["string"],
        "recomienda_retoque": (boolean)`;

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Analiza exhaustivamente la calidad de este diseño." }, { inlineData: { mimeType: "image/png", data: fileData.base64 } }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { responseMimeType: "application/json" }
                })
            });
            const result = await response.json();
            const data = JSON.parse(result.candidates[0].content.parts[0].text);
            setReport(data);
            showToast("ANÁLISIS NEURAL COMPLETADO");
        } catch (e) {
            showToast("ERROR EN LA CONEXIÓN IA");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Generación de versión mejorada con Nano Banana
    const generateEnhanced = async () => {
        if (!fileData) return;
        setIsGenerating(true);
        showToast("RECONSTRUYENDO ARTE...");

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const prompt = "Actúa como diseñador senior. Rediseña esta imagen en una versión 'master' optimizada para impresión de gran formato. Mejora nitidez, luces y balance cromático.";

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: fileData.base64 } }] }],
                    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
                })
            });
            const result = await response.json();
            const base64Data = result?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

            if (base64Data) {
                setEnhancedImage(`data:image/png;base64,${base64Data}`);
                showToast("VERSIÓN MEJORADA LISTA");
            }
        } catch (error) {
            showToast("ERROR GENERATIVO");
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

    const getVerdictStyle = (verdict: string): VerdictStyle => {
        switch (verdict) {
            case 'APTO': return { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={32} /> };
            case 'APTO CON RESERVAS': return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle size={32} /> };
            case 'NO APTO': return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle size={32} /> };
            default: return { color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', icon: <Activity size={32} /> };
        }
    };

    const rgbToCmyk = (r: number, g: number, b: number) => {
        let c = 1 - r / 255;
        let m = 1 - g / 255;
        let y = 1 - b / 255;
        let k = Math.min(c, Math.min(m, y));

        if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
        c = Math.round(((c - k) / (1 - k)) * 100);
        m = Math.round(((m - k) / (1 - k)) * 100);
        y = Math.round(((y - k) / (1 - k)) * 100);
        k = Math.round(k * 100);

        return { c, m, y, k };
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!imgRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imgRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const rect = img.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * img.naturalWidth;
        const y = ((e.clientY - rect.top) / rect.height) * img.naturalHeight;

        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

        const cmyk = rgbToCmyk(r, g, b);

        const newColor = { hex, rgb: { r, g, b }, cmyk };
        setSelectedColor(newColor);

        if (!recentColors.includes(hex)) {
            setRecentColors(prev => [hex, ...prev.slice(0, 4)]);
        }
    };

    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    };

    const hslToHex = (h: number, s: number, l: number) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    };

    const getHarmonies = () => {
        const { h, s, l } = rgbToHsl(selectedColor.rgb.r, selectedColor.rgb.g, selectedColor.rgb.b);
        return {
            complementary: [selectedColor.hex, hslToHex((h + 180) % 360, s, l)],
            analogous: [hslToHex((h - 30 + 360) % 360, s, l), selectedColor.hex, hslToHex((h + 30) % 360, s, l)],
            triad: [selectedColor.hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)]
        };
    };

    const harmonies = getHarmonies();

    const exportData = () => {
        if (!report && !metrics) return;
        const data = {
            file: fileData?.name,
            metrics,
            report,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plot-analysis-${fileData?.name || 'report'}.json`;
        link.click();
        showToast("DATOS EXPORTADOS");
    };

    // Mini helper for card shadows and styles
    const cardClass = "glass-card rounded-[2.5rem] p-8 hover-lift relative overflow-hidden";
    const sectionTitle = "text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center justify-between opacity-70";

    return (
        <div className="min-h-screen p-6 max-w-[1400px] mx-auto text-slate-900">
            {/* Nav */}
            <header className="flex items-center justify-between mb-12 px-4">
                <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 ${image ? 'bg-gradient-to-br from-brand-orange to-[#ff9d63] shadow-brand-orange/30 neon-border' : 'bg-brand-orange/10 border border-brand-orange/20'} rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-700`}>
                        <span className="font-black text-3xl tracking-tighter">PC</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase italic leading-none">
                            Plot Center <span className="text-brand-orange neon-text">Analytic</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${image ? 'bg-brand-orange animate-pulse shadow-[0_0_8px_rgba(242,109,33,0.8)]' : 'bg-emerald-500/50'}`}></span>
                            <p className="text-[9px] uppercase font-black text-slate-500 tracking-[0.3em]">ADVANCED PRE-FLIGHT STUDIO v2.0</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={exportData}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-brand-orange transition-all tracking-[0.2em] group">
                        <FileCode size={14} className="group-hover:scale-110 transition-transform" /> EXPORT REPORT
                    </button>
                    <div className={`nav-tag ${image ? 'text-brand-orange border-brand-orange/30 neon-border' : ''}`}>
                        {image ? 'ENGINE ACTIVE' : 'ENGINE STANDBY'}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* Lateral Izquierdo */}
                <div className="col-span-3 space-y-6">
                    {/* Laboratorio / Unidad de Ingesta */}
                    <div className={cardClass}>
                        <h2 className={sectionTitle}>{!image ? 'UNIDAD DE INGESTA' : 'LABORATORIO'}</h2>
                        {!image ? (
                            <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-10 hover:border-brand-orange/30 transition-all cursor-pointer text-center group bg-black/20">
                                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 mb-6 group-hover:scale-110 transition-transform group-hover:text-brand-orange/50">
                                    <Upload size={32} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Sincronizar<br />Arte Maestro</p>
                            </label>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 group">
                                    <div className="w-14 h-14 rounded-xl bg-cover bg-center border border-white/10 shrink-0 shadow-lg group-hover:scale-105 transition-transform" style={{ backgroundImage: `url(${image})` }}></div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-black text-white truncate uppercase tracking-tight">{fileData?.name || 'Archivo Maestro'}</p>
                                        <p className="text-[10px] text-brand-orange font-bold uppercase tracking-widest leading-none mt-1.5">{fileData?.width}x{fileData?.height} PX</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">ESCALA DE SALIDA</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-slate-500 px-1 tracking-widest opacity-50">Ancho</label>
                                                <input type="number" value={targetW} onChange={(e) => setTargetW(Number(e.target.value))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl outline-none focus:border-brand-orange/30 text-xs font-bold text-white transition-all" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-slate-500 px-1 tracking-widest opacity-50">Alto</label>
                                                <input type="number" value={targetH} onChange={(e) => setTargetH(Number(e.target.value))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl outline-none focus:border-brand-orange/30 text-xs font-bold text-white transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 opacity-50">PRESETS DE IMPRESIÓN</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { l: 'A4', w: 21, h: 29.7 },
                                                { l: 'A3', w: 29.7, h: 42 },
                                                { l: '50x70', w: 50, h: 70 },
                                                { l: '70x100', w: 70, h: 100 }
                                            ].map(p => (
                                                <button
                                                    key={p.l}
                                                    onClick={() => { setTargetW(p.w); setTargetH(p.h); setUnit('cm'); }}
                                                    className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-black text-slate-400 hover:text-white transition-all">
                                                    {p.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                                        {(['cm', 'm', 'in'] as const).map(u => (
                                            <button key={u} onClick={() => setUnit(u)} className={`flex-1 py-2 text-[9px] font-black rounded-lg transition-all ${unit === u ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}>{u.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <button onClick={runAnalysis} disabled={isAnalyzing} className="premium-btn-primary w-full py-4 flex items-center justify-center gap-3">
                                        {isAnalyzing ? <RefreshCcw className="animate-spin" size={12} /> : <Zap size={14} fill="currentColor" />}
                                        Lanzar Diagnóstico
                                    </button>
                                    <button onClick={generateEnhanced} disabled={isGenerating} className="premium-btn-secondary w-full py-4 flex items-center justify-center gap-3">
                                        {isGenerating ? <RefreshCcw className="animate-spin" size={12} /> : <Wand2 size={14} />}
                                        NANO BANANA
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recientes */}
                    <div className={cardClass}>
                        <h2 className={sectionTitle}>
                            COLORES RECIENTES
                            {recentColors.length > 0 && (
                                <button className="text-[8px] hover:text-white transition-colors uppercase tracking-widest font-black" onClick={() => setRecentColors([])}>LIMPIAR</button>
                            )}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {recentColors.map((c, i) => (
                                <div key={i} className="w-9 h-9 rounded-full border border-white/10 shadow-lg shrink-0 cursor-pointer hover:scale-110 hover:border-white/30 transition-all duration-300" style={{ backgroundColor: c }} onClick={() => setSelectedColor({ hex: c, rgb: { r: 0, g: 0, b: 0 }, cmyk: { c: 0, m: 0, y: 0, k: 0 } })}></div>
                            ))}
                            {recentColors.length === 0 && (
                                <div className="w-full py-4 flex items-center justify-center border border-dashed border-white/5 rounded-2xl">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Sin Selección</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vista de Marca */}
                    <div className="glass-card rounded-[2.5rem] p-8 hover-lift flex flex-col items-center group">
                        <h2 className={sectionTitle}>BRANDING ECOSYSTEM</h2>
                        <div className="w-full h-48 rounded-[2rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                            {/* Dynamic Mesh Background */}
                            <div className="absolute inset-0 opacity-100 transition-colors duration-1000" style={{ backgroundColor: selectedColor.hex }}></div>
                            <div className="absolute inset-x-[-50%] top-[-50%] h-[200%] w-[200%] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_60%)] animate-pulse"></div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10"></div>

                            <div className="relative flex justify-between items-start">
                                <div className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg">
                                    <div className="w-5 h-5 bg-white/90 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.5em] italic">PREMIUM QUALITY</p>
                                </div>
                            </div>

                            <div className="relative flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-black text-white tracking-widest leading-none">PLOT CENTER</p>
                                    <p className="text-[8px] font-medium text-white/60 uppercase tracking-[0.2em] mt-1.5 opacity-80">INTELLIGENT STUDIO</p>
                                </div>
                                <div className="w-14 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white/50 w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-6 font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            REPRESENTACIÓN CROMÁTICA <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse"></span>
                        </p>
                    </div>
                </div>

                {/* Centro */}
                <div className="col-span-6 space-y-6">
                    {/* Preview Principal & Diagnóstico */}
                    <div
                        className="glass-card rounded-[3.5rem] p-12 flex flex-col items-center min-h-[660px] justify-between relative overflow-hidden"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                                const event = { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>;
                                handleFileUpload(event);
                            }
                        }}
                    >
                        {!image ? (
                            <div className="flex-grow flex flex-col items-center justify-start w-full transition-all duration-1000">
                                <div className="w-full text-left mb-20 animate-in fade-in slide-in-from-left-4 duration-1000 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-5xl font-black text-white italic tracking-tighter mb-3">Diagnostic Console</h2>
                                        <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.5em] opacity-80 neon-text">AI-POWERED PRE-PRINT VERIFICATION ENGINE</p>
                                    </div>
                                    <div className="w-40 h-1.5 bg-gradient-to-r from-brand-orange to-transparent rounded-full mt-8 opacity-40"></div>
                                </div>

                                <div className="flex-grow flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-1000">
                                    <div className="w-32 h-32 bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] flex items-center justify-center text-slate-700 mb-10 relative group">
                                        <div className="absolute inset-x-[-20%] inset-y-[-20%] bg-brand-orange/5 blur-3xl rounded-full group-hover:bg-brand-orange/10 transition-colors"></div>
                                        <Palette size={56} strokeWidth={1} className="animate-pulse text-slate-500 group-hover:text-brand-orange transition-colors" />
                                    </div>
                                    <p className="text-slate-500 font-black uppercase tracking-[0.6em] text-xs italic animate-pulse">Sincroniza un diseño para iniciar...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-start w-full">
                                {/* MÉTRICAS TÉCNICAS (Top Floating) */}
                                <div className="w-full grid grid-cols-3 gap-6 mb-12 animate-in slide-in-from-top-6 duration-700">
                                    <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-lg group hover:bg-white/[0.07] transition-all">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">PRECISIÓN</p>
                                            <Activity size={10} className="text-slate-600" />
                                        </div>
                                        <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{metrics.dpi}<span className="text-xs text-slate-500 font-medium ml-1">DPI</span></p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-lg group hover:bg-white/[0.07] transition-all">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">ESCALABILIDAD</p>
                                            <Zap size={10} className="text-brand-orange" />
                                        </div>
                                        <p className="text-4xl font-black text-brand-orange tabular-nums tracking-tighter neon-text">+{metrics.scalability}%</p>
                                    </div>
                                    <div className="p-6 bg-brand-orange/10 border border-brand-orange/20 rounded-[2.5rem] text-center flex flex-col justify-center shadow-2xl shadow-brand-orange/5 hover:scale-[1.03] transition-transform">
                                        <p className="text-[8px] font-black text-brand-orange uppercase tracking-[0.2em] mb-3 opacity-60">PROYECCIÓN ÓPTIMA</p>
                                        <p className="text-3xl font-black text-brand-orange tabular-nums tracking-tighter neon-text">{metrics.distance}<span className="text-xs text-slate-500 ml-1 italic font-light">MTS</span></p>
                                    </div>
                                </div>

                                <div className="flex-grow flex items-center justify-center w-full relative py-4">
                                    <div className="relative group">
                                        <img
                                            ref={imgRef}
                                            src={enhancedImage || image}
                                            alt="Preview"
                                            className="max-h-[380px] rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] cursor-crosshair transition-all duration-500 group-hover:scale-[1.02] border border-white/10"
                                            onClick={handleImageClick}
                                        />
                                        <canvas ref={canvasRef} className="hidden" />
                                        <div className="absolute inset-x-0 bottom-[-40px] flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                                            <div className="bg-white/10 text-white px-8 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] backdrop-blur-xl border border-white/20 shadow-2xl">
                                                HAZ CLIC PARA CAPTURAR ADN CROMÁTICO
                                            </div>
                                        </div>
                                        {enhancedImage && (
                                            <div className="absolute top-6 right-6 px-4 py-1.5 bg-brand-orange text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl animate-in zoom-in-50 duration-500">
                                                MASTER OPTIMIZADO
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RESULTADO IA (Verdict Card) */}
                                {report && (
                                    <div className="w-full mt-10 animate-in slide-in-from-bottom-8 duration-700">
                                        {(() => {
                                            const v = getVerdictStyle(report.veredicto_final);
                                            return (
                                                <div className="w-full p-10 rounded-[3rem] bg-white/[0.03] border border-white/5 flex items-center gap-12 shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                                    <div className={`${v.color} shrink-0 drop-shadow-[0_0_15px_rgba(currentColor,0.4)] scale-125 transition-transform group-hover:scale-[1.35]`}>{v.icon}</div>
                                                    <div className="flex-grow relative">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] opacity-60">NEURAL INTELLIGENCE VERDICT</p>
                                                            <span className="w-24 h-[1px] bg-white/10"></span>
                                                        </div>
                                                        <h3 className={`text-5xl font-black ${v.color} tracking-tighter leading-none mb-4 uppercase italic drop-shadow-sm`}>{report.veredicto_final}</h3>
                                                        <p className="text-sm text-slate-400 font-medium leading-relaxed opacity-90 max-w-3xl italic">"{report.motivo_veredicto}"</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* INFORME TÉCNICO & BENCHMARKING (Grid Inferior) */}
                    {report && (
                        <div className="grid grid-cols-5 gap-6 pb-20">
                            <div className={cardClass + " col-span-2"}>
                                <h3 className={sectionTitle}>NEURAL ANALYTIC FEED</h3>
                                <div className="text-[10px] text-slate-400 leading-relaxed font-semibold space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                                    {report.analisis.split('\n').filter((p: string) => p.trim()).map((para: string, i: number) => (
                                        <div key={i} className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                                            <p className="opacity-80">{para}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={cardClass + " col-span-3"}>
                                <h3 className={sectionTitle}>SYSTEM BENCHMARKING</h3>
                                <div className="h-[280px] w-full pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="10 10" stroke="#ffffff05" vertical={false} />
                                            <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} />
                                            <YAxis fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(16, 18, 27, 0.95)',
                                                    backdropFilter: 'blur(20px)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '20px',
                                                    fontSize: '9px',
                                                    fontWeight: 900,
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                                    color: '#fff'
                                                }}
                                            />
                                            <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={40}>
                                                {chartData.map((entry, index) => (
                                                    <RechartsCell key={`cell-${index}`} fill={entry.fill} fillOpacity={entry.name === 'Tu Archivo' ? 1 : 0.25} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Lateral Derecho */}
                <div className="col-span-3 space-y-6">
                    {/* Selección */}
                    <div className={cardClass}>
                        <h2 className={sectionTitle}>
                            ADN CROMÁTICO
                            <span className="text-[8px] bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full font-black uppercase tracking-widest border border-brand-orange/20">PRO PICKER</span>
                        </h2>
                        <div className="w-full aspect-square rounded-[2.5rem] p-6 flex items-center justify-center mb-8 relative group">
                            <div className="w-full h-full rounded-[2rem] shadow-2xl transition-transform group-hover:scale-[1.03] duration-500" style={{ backgroundColor: selectedColor.hex }}></div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10 pointer-events-none rounded-[2.5rem]"></div>
                            <div className="absolute inset-0 border border-white/10 rounded-[2.5rem] pointer-events-none group-hover:border-white/20 transition-colors"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">HEX CODE</p>
                                    <p className="text-2xl font-black text-white tabular-nums tracking-tighter">{selectedColor.hex}</p>
                                </div>
                                <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all" onClick={() => {
                                    navigator.clipboard.writeText(selectedColor.hex);
                                    showToast("HEX COPIADO");
                                }}><Copy size={16} /></button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.08] transition-all group" onClick={() => {
                                    navigator.clipboard.writeText(`${selectedColor.rgb.r}, ${selectedColor.rgb.g}, ${selectedColor.rgb.b}`);
                                    showToast("RGB COPIADO");
                                }}>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 group-hover:text-brand-orange transition-colors opacity-60">RGB SYSTEM</p>
                                    <p className="text-xs font-black text-white tabular-nums opacity-80">{selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/[0.08] transition-all group" onClick={() => {
                                    navigator.clipboard.writeText(`${selectedColor.cmyk.c}, ${selectedColor.cmyk.m}, ${selectedColor.cmyk.y}, ${selectedColor.cmyk.k}`);
                                    showToast("CMYK COPIADO");
                                }}>
                                    <p className="text-[8px] font-black text-brand-orange uppercase tracking-widest mb-1.5 opacity-60">CMYK PROCESS</p>
                                    <p className="text-xs font-black text-brand-orange tabular-nums">{selectedColor.cmyk.c}-{selectedColor.cmyk.m}-{selectedColor.cmyk.y}-{selectedColor.cmyk.k}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ADN VISUAL & NANO BANANA PREVIEW */}
                    {report && (
                        <div className={cardClass}>
                            <h2 className={sectionTitle}><Palette size={14} className="opacity-50" /> IDENTIFICACIÓN ADN</h2>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase mb-3 italic tracking-widest opacity-60">TIPOGRAFÍAS DETECTADAS</p>
                                    <div className="flex flex-wrap gap-2">
                                        {report.detected_typography.map((t: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-slate-300 uppercase tracking-tight hover:bg-white/10 transition-colors">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                {enhancedImage && (
                                    <div className="pt-2 border-t border-white/5 space-y-4">
                                        <p className="text-[8px] font-black text-brand-orange uppercase italic tracking-widest opacity-80">MASTER GENERADO</p>
                                        <button onClick={() => {
                                            const link = document.createElement("a");
                                            link.href = enhancedImage!;
                                            link.download = "master-plot-center.png";
                                            link.click();
                                        }} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 transition-all group">
                                            <Download size={14} className="text-brand-orange group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Descargar Master</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Armonías */}
                    <div className={cardClass}>
                        <h2 className={sectionTitle}>CHROMATIC HARMONY</h2>
                        <div className="space-y-8">
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4 italic opacity-60">COMPLEMENTARY</p>
                                <div className="flex gap-3 h-12">
                                    {harmonies.complementary.map((c, i) => (
                                        <div key={i} className="flex-1 rounded-xl shadow-lg border border-white/10 transition-all hover:scale-110 cursor-pointer" style={{ backgroundColor: c }}></div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4 italic opacity-60">ANALOGOUS TRIO</p>
                                <div className="flex gap-3 h-12">
                                    {harmonies.analogous.map((c, i) => (
                                        <div key={i} className="flex-1 rounded-xl shadow-lg border border-white/10 transition-all hover:scale-110 cursor-pointer" style={{ backgroundColor: c }}></div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4 italic opacity-60">TRIADIC BALANCE</p>
                                <div className="flex gap-3 h-12">
                                    {harmonies.triad.map((c, i) => (
                                        <div key={i} className="flex-1 rounded-xl shadow-lg border border-white/10 transition-all hover:scale-110 cursor-pointer" style={{ backgroundColor: c }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Animado */}
            {toast.show && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-12 fade-in duration-500 z-[200]">
                    <div className="glass-card text-slate-800 px-10 py-5 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-5 border border-white/50">
                        <div className="w-8 h-8 bg-brand-orange/10 rounded-full flex items-center justify-center">
                            <Zap className="text-brand-orange fill-brand-orange animate-pulse" size={16} />
                        </div>
                        <span className="text-gradient">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
