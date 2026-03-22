import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle, XCircle, Loader2, Upload } from 'lucide-react';

const FaceDemo = () => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc(reader.result);
        verifyFace(file); // Pass the File object directly
      };
      reader.readAsDataURL(file);
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    verifyFace(imageSrc);
  }, [webcamRef]);

  const verifyFace = async (imageSource) => {
    setLoading(true);
    setResult(null);
    
    try {
      let blob;
      if (typeof imageSource === 'string') {
        // It's a Base64 string from the camera
        const base64Response = await fetch(imageSource);
        blob = await base64Response.blob();
      } else {
        // It's a File object from the upload input
        blob = imageSource;
      }

      const formData = new FormData();
      formData.append('photo', blob, 'verify.jpg');

      const response = await fetch('http://localhost:5000/api/ml/verify', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.status === 'success' && data.data && data.data.length > 0) {
        setResult({
          success: true,
          count: data.faces_count,
          allMatches: data.data, // Array of face objects
          image_size: data.image_size // Store original processed size
        });
      } else {
        setResult({
          success: false,
          count: 0,
          allMatches: []
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        success: false,
        name: 'Server Error',
        confidence: '0.00'
      });
    } finally {
      setLoading(false);
    }
  };

  const canvasRef = useRef(null);

  const drawBoxes = useCallback(() => {
    if (!canvasRef.current || !result || !result.allMatches) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get the image element to calculate scaling
    const img = document.getElementById('captured-image');
    if (!img || !img.naturalWidth) return;

    // Set canvas dimensions to match the displayed image size
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scaling factors: ML coordinates are relative to the image processed by the engine
    // The engine now returns 'image_size' [width, height]
    const engineWidth = result.image_size ? result.image_size[0] : img.naturalWidth;
    const engineHeight = result.image_size ? result.image_size[1] : img.naturalHeight;

    const scaleX = canvas.width / engineWidth;
    const scaleY = canvas.height / engineHeight;

    // Filter for "Present" students (e.g. above 35% similarity)
    const presentStudents = result.allMatches.filter(m => m.match_score > 0.35);

    presentStudents.forEach(match => {
      const [x1, y1, x2, y2] = match.bbox; 
      
      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledWidth = (x2 - x1) * scaleX;
      const scaledHeight = (y2 - y1) * scaleY;

      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX1, scaledY1, scaledWidth, scaledHeight);

      // Label
      ctx.fillStyle = '#3b82f6';
      const label = match.match_name.split(',')[0]; // Just the name, not roll no
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(scaledX1 - 1, scaledY1 - 25, textWidth + 10, 25);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(label, scaledX1 + 4, scaledY1 - 8);
    });
  }, [result]);

  // Redraw when result changes
  React.useEffect(() => {
    if (result) drawBoxes();
  }, [result, drawBoxes]);

  const reset = () => {
    setImgSrc(null);
    setResult(null);
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-dark flex flex-col items-center selection:bg-primary-dark/30">
      {/* HEADER */}
      <header className="w-full bg-card-dark/50 backdrop-blur-xl border-b border-white/5 py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary-dark/20">
             <div className="w-5 h-5 border-2 border-white rounded-sm rotate-45" />
          </div>
          <div>
            <h1 className="text-xl font-poppins font-black tracking-tight">Attendify</h1>
            <p className="text-[10px] text-text-dark-secondary font-bold uppercase tracking-widest">AI Vision Portal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
             {imgSrc && (
              <button 
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-bold border border-white/10"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                New Session
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-dark to-purple-500 shadow-inner" />
        </div>
      </header>

      <main className="w-full max-w-7xl flex-1 flex flex-col p-6 md:p-10">
        {!imgSrc ? (
          /* CAPTURE VIEW */
          <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center max-w-2xl">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary-dark/10 text-primary-dark text-xs font-black uppercase tracking-widest border border-primary-dark/20 mb-6">
                    Classroom Intelligence
                </span>
                <h2 className="text-5xl md:text-6xl font-poppins font-black mb-6 leading-tight">
                    Mark Attendance with <span className="text-primary-dark">zero friction.</span>
                </h2>
                <p className="text-text-dark-secondary text-lg font-medium">
                    Our AI-powered vision system detects every student in the frame and updates your dashboard instantly.
                </p>
            </div>

            <div className="relative w-full max-w-3xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-8 border-card-dark group">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: "user",
                  width: 1280,
                  height: 720,
                }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Overlay Decor */}
              <div className="absolute top-8 left-8 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Rec System v2.1</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl">
              <button
                onClick={capture}
                className="flex-[1.5] bg-primary-dark text-white font-black py-6 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary-dark/40 active:scale-95 shadow-xl shadow-primary-dark/20"
              >
                <Camera size={24} />
                TAKE CLASS PHOTO
              </button>
              
              <button
                onClick={() => document.getElementById('file-upload').click()}
                className="flex-1 bg-white/5 text-white font-bold py-6 px-10 rounded-2xl border-2 border-white/10 flex items-center justify-center gap-3 transition-all hover:bg-white/10 active:scale-95"
              >
                <Upload size={24} />
                UPLOAD IMAGE
              </button>
              
              <input 
                id="file-upload"
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        ) : (
          /* RESULTS VIEW */
          <div className="flex-1 flex flex-col lg:flex-row gap-12 animate-in fade-in slide-in-from-right-12 duration-700">
            {/* Left Column: Image with Boxes */}
            <div className="flex-[3] space-y-6">
               <div className="relative bg-black rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-8 border-card-dark group p-1">
                <img 
                  id="captured-image"
                  src={imgSrc} 
                  alt="Captured" 
                  className="w-full block rounded-[2rem]" 
                  onLoad={drawBoxes}
                />
                <canvas 
                    ref={canvasRef}
                    className="absolute top-1 left-1 w-full h-full pointer-events-none"
                    style={{ width: 'calc(100% - 8px)', height: 'calc(100% - 8px)' }}
                />
                
                {loading && (
                    <div className="absolute inset-0 bg-bg-dark/80 flex flex-col items-center justify-center backdrop-blur-md">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 text-primary-dark animate-spin mb-4" />
                            <div className="absolute inset-0 blur-xl bg-primary-dark/30 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-poppins font-black">Analyzing Signal...</h3>
                        <p className="text-text-dark-secondary text-sm font-medium">Running facial signatures against database</p>
                    </div>
                )}
               </div>
               
               <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3 text-text-dark-secondary text-[10px] uppercase tracking-widest font-black">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-dark animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      Live Neural Overlay · Multi-Instance Recognition
                  </div>
                  <span className="bg-primary-dark/10 text-primary-dark px-3 py-1 rounded-lg text-xs font-black border border-primary-dark/20">
                     {result?.count || 0} Detections
                  </span>
               </div>
            </div>

            {/* Right Column: List & Stats */}
            <div className="flex-[2] flex flex-col space-y-8">
                {result && (
                  <>
                    <div className="bg-card-dark rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-dark/5 blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                        
                        <div className="flex justify-between items-start mb-10 relative">
                             <div>
                                <h2 className="text-3xl font-poppins font-black tracking-tight mb-2 uppercase">Analysis</h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-1 bg-primary-dark rounded-full" />
                                    <p className="text-text-dark-secondary font-bold text-xs uppercase tracking-widest">{result.count} Identities Confirmed</p>
                                </div>
                             </div>
                             <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center border border-green-500/20">
                                <CheckCircle size={24} />
                             </div>
                        </div>

                        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar">
                           {result.allMatches.map((match, idx) => (
                             <div key={idx} className="group/item relative">
                               <div className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl transition-all hover:bg-white/[0.08] hover:border-primary-dark/40 active:scale-[0.98]">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-2xl bg-primary-dark/10 flex items-center justify-center border border-primary-dark/20 font-poppins font-black text-primary-dark group-hover/item:bg-primary-dark group-hover/item:text-white transition-all duration-300">
                                         {idx + 1}
                                     </div>
                                     <div>
                                        <p className="font-poppins font-black text-[15px] leading-none mb-1 text-white group-hover/item:text-primary-dark transition-colors">{match.match_name.split(',')[0]}</p>
                                        <p className="text-[10px] text-text-dark-secondary font-bold uppercase tracking-widest">{match.match_name.split(',')[1] || 'Student_ID'}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-poppins font-black text-emerald-400">{(match.match_score * 100).toFixed(1)}%</span>
                                     </div>
                                     <p className="text-[8px] text-text-dark-secondary font-black uppercase tracking-tighter">Confidence</p>
                                  </div>
                               </div>
                             </div>
                           ))}
                        </div>
                    </div>

                    <button 
                        onClick={reset}
                        className="w-full bg-white text-black font-poppins font-black py-6 px-8 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/5 border-t border-white/10"
                    >
                        <RefreshCw size={24} />
                        START NEW SCAN
                    </button>
                  </>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FaceDemo;
