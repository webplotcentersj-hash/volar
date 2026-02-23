import { useState, useRef, type ChangeEvent } from 'react';
import {
    Upload,
    Copy,
    FileCode
} from 'lucide-react';

interface ColorData {
    hex: string;
    rgb: { r: number; g: number; b: number };
    cmyk: { c: number; m: number; y: number; k: number };
}

export default function PlotCenterStudio() {
    const [image, setImage] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<ColorData>({
        hex: '#FFA500',
        rgb: { r: 255, g: 165, b: 0 },
        cmyk: { c: 0, m: 35, y: 100, k: 0 }
    });
    const [recentColors, setRecentColors] = useState<string[]>(['#C0C0C0', '#FFFFFF', '#000000', '#eb671b', '#FFA500']);
    const [predominantPalette] = useState<string[]>(['#000000', '#F0691E', '#FFFFFF', '#878787', '#C3C3C3']);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
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
                        <label className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 hover:border-brand-orange/50 transition-colors cursor-pointer text-center">
                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                <Upload size={24} />
                            </div>
                            <p className="text-xs font-bold text-slate-500">Analizar Nueva Referencia</p>
                        </label>
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
                    {/* Preview Principal */}
                    <div className="bg-white rounded-[3rem] p-12 premium-shadow inner-border flex flex-col items-center min-h-[500px] justify-between">
                        <div className="flex-grow flex items-center justify-center w-full relative">
                            {image ? (
                                <div className="relative group">
                                    <img
                                        ref={imgRef}
                                        src={image}
                                        alt="Preview"
                                        className="max-h-[350px] rounded-2xl shadow-2xl cursor-crosshair transition-transform active:scale-[0.98]"
                                        onClick={handleImageClick}
                                    />
                                    <canvas ref={canvasRef} className="hidden" />
                                    <div className="absolute inset-x-0 bottom-[-50px] flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-slate-900/80 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                                            HAZ CLIC PARA CAPTURAR UN COLOR
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-300 flex flex-col items-center gap-4">
                                    <Upload size={80} strokeWidth={1} />
                                    <p className="font-bold uppercase tracking-tighter text-xl italic">Waiting for Input...</p>
                                </div>
                            )}
                        </div>

                        {/* Paleta Predominante */}
                        <div className="w-full pt-12 text-left">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">PALETA PREDOMINANTE</h2>
                            <div className="flex gap-4">
                                {predominantPalette.map((c, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3">
                                        <div className="w-20 h-24 rounded-2xl shadow-xl border-4 border-white transition-transform hover:-translate-y-2 cursor-pointer" style={{ backgroundColor: c }}></div>
                                        <span className="text-[10px] font-black text-slate-400 tabular-nums">{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
                                <button className="text-slate-300 hover:text-brand-orange transition-colors"><Copy size={18} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">RGB</p>
                                    <p className="text-[11px] font-black text-slate-800 tabular-nums">{selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b}</p>
                                </div>
                                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-brand-orange uppercase">CMYK</p>
                                    <p className="text-[11px] font-black text-brand-orange tabular-nums">{selectedColor.cmyk.c}-{selectedColor.cmyk.m}-{selectedColor.cmyk.y}-{selectedColor.cmyk.k}</p>
                                </div>
                            </div>
                        </div>
                    </div>

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
        </div>
    );
}
