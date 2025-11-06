

import React, { useState, useRef, useEffect } from 'react';

type SignatureMode = 'draw' | 'type';

interface SignaturePadProps {
    onSignatureChange: (data: string, type: SignatureMode) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange }) => {
    const [mode, setMode] = useState<SignatureMode>('draw');
    const [typedSignature, setTypedSignature] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && mode === 'draw') {
            const ctx = canvas.getContext('2d');
            if(ctx) {
                // Change pen color to yellow to match theme
                ctx.strokeStyle = '#fbbd23'; // amber-400
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
        }
    }, [mode]);

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        
        isDrawing.current = true;
        const { offsetX, offsetY } = getCoords(event);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        
        const { offsetX, offsetY } = getCoords(event);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };
    
    const stopDrawing = () => {
        isDrawing.current = false;
        if(canvasRef.current){
            onSignatureChange(canvasRef.current.toDataURL(), 'draw');
        }
    };
    
    const getCoords = (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };
        const rect = canvas.getBoundingClientRect();

        if ('touches' in event.nativeEvent) {
            return {
                offsetX: event.nativeEvent.touches[0].clientX - rect.left,
                offsetY: event.nativeEvent.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: event.nativeEvent.offsetX,
            offsetY: event.nativeEvent.offsetY,
        };
    };

    const clearPad = () => {
        if (mode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            onSignatureChange('', 'draw');
        } else {
            setTypedSignature('');
            onSignatureChange('', 'type');
        }
    };

    const handleTypedSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTypedSignature(e.target.value);
        onSignatureChange(e.target.value, 'type');
    };

    return (
        <div className="w-full">
            <div className="flex border-b border-slate-600 mb-4">
                <button
                    onClick={() => setMode('draw')}
                    className={`px-4 py-2 text-sm font-semibold ${mode === 'draw' ? 'border-b-2 border-amber-400 text-white' : 'text-slate-400'}`}
                >
                    Draw Signature
                </button>
                <button
                    onClick={() => setMode('type')}
                    className={`px-4 py-2 text-sm font-semibold ${mode === 'type' ? 'border-b-2 border-amber-400 text-white' : 'text-slate-400'}`}
                >
                    Type Signature
                </button>
                <button onClick={clearPad} className="ml-auto px-4 py-2 text-sm text-slate-400 hover:text-white">
                    Clear
                </button>
            </div>
            
            {mode === 'draw' && (
                <canvas
                    ref={canvasRef}
                    width="600"
                    height="150"
                    // Change background to dark slate for yellow pen visibility
                    className="bg-slate-700 border border-slate-600 rounded-md cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            )}

            {mode === 'type' && (
                <div>
                    <input
                        type="text"
                        value={typedSignature}
                        onChange={handleTypedSignatureChange}
                        placeholder="Type your full name"
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <div className="mt-4 w-full h-[150px] bg-slate-700 rounded-md flex items-center justify-center">
                        <p className="font-signature text-5xl text-amber-400 px-4">{typedSignature}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignaturePad;