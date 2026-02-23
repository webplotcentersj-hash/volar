import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import {
    Upload,
    Copy,
    FileCode,
    Zap,
    RefreshCcw,
    Wand2,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Activity,
    ClipboardCheck,
    FileText,
    Palette,
    Type,
    Sparkles,
    Download,
    BarChart3
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
        hex: '#FFA500',
        rgb: { r: 255, g: 165, b: 0 },
        cmyk: { c: 0, m: 35, y: 100, k: 0 }
    });
    const [recentColors, setRecentColors] = useState<string[]>(['#C0C0C0', '#FFFFFF', '#000000', '#eb671b', '#FFA500']);
    const [predominantPalette] = useState<string[]>(['#000000', '#F0691E', '#FFFFFF', '#878787', '#C3C3C3']);

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

    const getVerdictStyle = (verdict: string) => {
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

    // Mini helper for card shadows and styles
    const cardClass = "bg-white rounded-[2rem] p-6 premium-shadow inner-border flex flex-col";
    const sectionTitle = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between";

    return (
        <div className="min-h-screen p-6 max-w-[1400px] mx-auto text-slate-900">
            {/* Nav */}
            <header className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-orange/20">
                        <span className="font-black text-xl">PC</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-800">Plot Center <span className="font-light text-slate-400">Intelligence</span></h1>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-[-2px]">COLOR STUDIO V2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        <FileCode size={14} /> EXPORTAR CSS
                    </button>
                    <div className="px-4 py-1.5 bg-orange-100/50 text-brand-orange rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-200">
                        ANÁLISIS ACTIVO
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* Lateral Izquierdo */}
                <div className="col-span-3 space-y-6">
                    {/* Laboratorio */}
                    <div className={cardClass}>
                        <h2 className={sectionTitle}>LABORATORIO</h2>
                        {!image ? (
                            <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 hover:border-brand-orange/50 transition-colors cursor-pointer text-center">
                                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                    <Upload size={24} />
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Vincular Diseño</p>
                            </label>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-cover bg-center border border-slate-200 shrink-0" style={{ backgroundImage: `url(${image})` }}></div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-black text-slate-800 truncate uppercase">{fileData?.name || 'Archivo Maestro'}</p>
                                        <p className="text-[9px] text-brand-orange font-bold uppercase tracking-widest leading-none mt-1">{fileData?.width}x{fileData?.height} PX</p>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 px-1 italic">Ancho</label>
                                            <input type="number" value={targetW} onChange={(e) => setTargetW(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-orange text-xs font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 px-1 italic">Alto</label>
                                            <input type="number" value={targetH} onChange={(e) => setTargetH(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-orange text-xs font-bold" />
                                        </div>
                                    </div>
                                    <div className="flex gap-1 p-1 bg-slate-200/50 rounded-lg">
                                        {(['cm', 'm', 'in'] as const).map(u => (
                                            <button key={u} onClick={() => setUnit(u)} className={`flex-1 py-1 text-[9px] font-black rounded-md transition-all ${unit === u ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>{u.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-2">
                                    <button onClick={runAnalysis} disabled={isAnalyzing} className="w-full py-3 bg-brand-orange text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 active:scale-95 transition-all disabled:opacity-50">
                                        {isAnalyzing ? <RefreshCcw className="animate-spin" size={12} /> : <Zap size={12} />}
                                        Lanzar Diagnóstico
                                    </button>
                                    <button onClick={generateEnhanced} disabled={isGenerating} className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                                        {isGenerating ? <RefreshCcw className="animate-spin" size={12} /> : <Wand2 size={12} />}
                                        NANO BANANA: MEJORAR
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recientes */}
                    <div className={cardClass}>
                        <h2 className={sectionTitle}>
                            RECIENTES
                            <button className="text-[9px] hover:text-slate-600" onClick={() => setRecentColors([])}>Limpiar</button>
                        </h2>
                        <div className="flex gap-2">
                            {recentColors.map((c, i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-50 shadow-inner shrink-0 cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c }} onClick={() => setSelectedColor({ hex: c, rgb: { r: 0, g: 0, b: 0 }, cmyk: { c: 0, m: 0, y: 0, k: 0 } })}></div>
                            ))}
                        </div>
                    </div>

                    {/* Vista de Marca */}
                    <div className="bg-[#1e1f2b] rounded-[2rem] p-8 premium-shadow flex flex-col items-center aspect-square">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 w-full">VISTA DE MARCA</h2>
                        <div className="w-full h-40 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden" style={{ backgroundColor: selectedColor.hex }}>
                            <div className="w-8 h-8 rounded-full border-2 border-white/20"></div>
                            <div className="flex justify-between items-end">
                                <div className="w-12 h-0.5 bg-white/20 rounded-full"></div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-white/90">PLOT CENTER</p>
                                    <p className="text-[7px] font-medium text-white/50 uppercase tracking-tighter">Estudio de Diseño</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-600 mt-6 font-medium italic">Visualización en tarjeta premium</p>
                    </div>
                </div>

                {/* Centro */}
                <div className="col-span-6 space-y-6">
                    {/* Preview Principal & Diagnóstico */}
                    <div className="bg-white rounded-[3rem] p-12 premium-shadow inner-border flex flex-col items-center min-h-[500px] justify-between relative overflow-hidden">

                        {/* MÉTRICAS TÉCNICAS (Top Floating) */}
                        {image && (
                            <div className="w-full flex justify-between gap-4 mb-10">
                                <div className="flex-1 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">DPI CALCULADO</p>
                                    <p className="text-2xl font-black text-slate-800 tabular-nums">{metrics.dpi}</p>
                                </div>
                                <div className="flex-1 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">VERSATILIDAD</p>
                                    <p className="text-2xl font-black text-brand-orange tabular-nums">+{metrics.scalability}%</p>
                                </div>
                                <div className="flex-1 p-4 bg-[#1e1f2b] rounded-[1.5rem] text-center flex flex-col justify-center">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">VISIBILIDAD</p>
                                    <p className="text-xl font-black text-white tabular-nums">{metrics.distance} <span className="text-[8px] text-slate-500">MTS</span></p>
                                </div>
                            </div>
                        )}

                        <div className="flex-grow flex items-center justify-center w-full relative py-8">
                            {image ? (
                                <div className="relative group">
                                    <img
                                        ref={imgRef}
                                        src={enhancedImage || image}
                                        alt="Preview"
                                        className="max-h-[350px] rounded-2xl shadow-2xl cursor-crosshair transition-transform active:scale-[0.98]"
                                        onClick={handleImageClick}
                                    />
                                    <canvas ref={canvasRef} className="hidden" />
                                    <div className="absolute inset-x-0 bottom-[-50px] flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-slate-900/80 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm shadow-xl">
                                            HAZ CLIC PARA CAPTURAR UN COLOR
                                        </div>
                                    </div>
                                    {enhancedImage && (
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-brand-orange text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                                            MASTER OPTIMIZADO
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-slate-300 flex flex-col items-center gap-4 py-20">
                                    <Upload size={80} strokeWidth={1} />
                                    <p className="font-bold uppercase tracking-tighter text-xl italic text-slate-200">Waiting for Input...</p>
                                </div>
                            )}
                        </div>

                        {/* RESULTADO IA (Verdict Card) */}
                        {report && (
                            <div className="w-full mt-10">
                                {(() => {
                                    const v = getVerdictStyle(report.veredicto_final);
                                    return (
                                        <div className={`w-full p-6 rounded-[2rem] ${v.bg} border ${v.border} flex items-center gap-6 shadow-sm`}>
                                            <div className={`${v.color} shrink-0`}>{v.icon}</div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Veredicto IA</p>
                                                <h3 className={`text-xl font-black ${v.color} tracking-tight leading-none`}>{report.veredicto_final}</h3>
                                                <p className="text-[10px] text-slate-600 font-medium mt-1 leading-tight">{report.motivo_veredicto}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Paleta Predominante */}
                        <div className="w-full pt-12 text-left border-t border-slate-50 mt-12">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">PALETA PREDOMINANTE</h2>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {(report?.detected_colors?.map((c: any) => c.hex) || predominantPalette).map((c: string, i: number) => (
                                    <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                                        <div className="w-16 h-20 rounded-2xl shadow-xl border-4 border-white transition-transform hover:-translate-y-2 cursor-pointer" style={{ backgroundColor: c }} onClick={() => setSelectedColor({ hex: c, rgb: { r: 0, g: 0, b: 0 }, cmyk: { c: 0, m: 0, y: 0, k: 0 } })}></div>
                                        <span className="text-[9px] font-black text-slate-400 tabular-nums">{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* INFORME TÉCNICO & BENCHMARKING (Grid Inferior) */}
                    {report && (
                        <div className="grid grid-cols-2 gap-6 pb-20">
                            <div className={cardClass + " !rounded-[2.5rem]"}>
                                <h3 className={sectionTitle}><ClipboardCheck size={14} className="text-brand-orange" /> INFORME TÉCNICO</h3>
                                <div className="text-[10px] text-slate-600 leading-relaxed font-medium space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                    {report.analisis.split('\n').map((para: string, i: number) => (
                                        <p key={i}>{para}</p>
                                    ))}
                                </div>
                            </div>
                            <div className={cardClass + " !rounded-[2.5rem]"}>
                                <h3 className={sectionTitle}><BarChart3 size={14} /> BENCHMARKING DE DPI</h3>
                                <div className="h-[200px] w-full pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#00000008" vertical={false} />
                                            <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                                            <YAxis fontSize={8} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #f1f5f9',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={24}>
                                                {chartData.map((entry, index) => (
                                                    <RechartsCell key={`cell-${index}`} fill={entry.fill} />
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
                            SELECCIÓN
                            <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">DARK TEXT PREFERRED</span>
                        </h2>
                        <div className="w-full aspect-square rounded-[2.5rem] p-4 flex items-center justify-center mb-6 relative">
                            <div className="w-40 h-40 rounded-[2rem] shadow-2xl shadow-black/20" style={{ backgroundColor: selectedColor.hex }}></div>
                            <div className="absolute inset-0 bg-white/5 pointer-events-none rounded-[2.5rem]"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">HEX CODE</p>
                                    <p className="text-xl font-black text-slate-800 tabular-nums">{selectedColor.hex}</p>
                                </div>
                                <button className="text-slate-300 hover:text-brand-orange transition-colors" onClick={() => {
                                    navigator.clipboard.writeText(selectedColor.hex);
                                    showToast("HEX COPIADO");
                                }}><Copy size={18} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => {
                                    navigator.clipboard.writeText(`${selectedColor.rgb.r}, ${selectedColor.rgb.g}, ${selectedColor.rgb.b}`);
                                    showToast("RGB COPIADO");
                                }}>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">RGB</p>
                                    <p className="text-[11px] font-black text-slate-800 tabular-nums">{selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b}</p>
                                </div>
                                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => {
                                    navigator.clipboard.writeText(`${selectedColor.cmyk.c}, ${selectedColor.cmyk.m}, ${selectedColor.cmyk.y}, ${selectedColor.cmyk.k}`);
                                    showToast("CMYK COPIADO");
                                }}>
                                    <p className="text-[8px] font-black text-brand-orange uppercase">CMYK</p>
                                    <p className="text-[11px] font-black text-brand-orange tabular-nums">{selectedColor.cmyk.c}-{selectedColor.cmyk.m}-{selectedColor.cmyk.y}-{selectedColor.cmyk.k}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ADN VISUAL & NANO BANANA PREVIEW */}
                    {report && (
                        <div className={cardClass}>
                            <h2 className={sectionTitle}><Palette size={14} /> IDENTIFICACIÓN ADN</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-2 italic">TIPOGRAFÍAS DETECTADAS</p>
                                    <div className="flex flex-wrap gap-2">
                                        {report.detected_typography.map((t: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-600 uppercase tracking-tight">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                {enhancedImage && (
                                    <div className="pt-2">
                                        <p className="text-[8px] font-black text-brand-orange uppercase mb-2 italic">MASTER GENERADO</p>
                                        <button onClick={() => {
                                            const link = document.createElement("a");
                                            link.href = enhancedImage!;
                                            link.download = "master-plot-center.png";
                                            link.click();
                                        }} className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                                            <Download size={12} className="text-slate-400" />
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Descargar Master</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Armonías */}
                    <div className={cardClass}>
                        <h2 className={sectionTitle}>ARMONÍAS CROMÁTICAS</h2>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">COMPLEMENTARIO</p>
                                <div className="flex gap-2 h-8">
                                    {harmonies.complementary.map((c, i) => (
                                        <div key={i} className="flex-1 rounded-md" style={{ backgroundColor: c }}></div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">ANÁLOGOS</p>
                                <div className="flex gap-2 h-8">
                                    {harmonies.analogous.map((c, i) => (
                                        <div key={i} className="flex-1 rounded-md" style={{ backgroundColor: c }}></div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">TRÍADA</p>
                                <div className="flex gap-2 h-8">
                                    {harmonies.triad.map((c, i) => (
                                        <div key={i} className="flex-1 rounded-md" style={{ backgroundColor: c }}></div>
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
                    <div className="bg-[#1e1f2b] text-white px-8 py-4 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-4 border border-white/5">
                        <Zap className="text-brand-orange fill-brand-orange animate-pulse" size={16} />
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
