import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Camera, Image as ImageIcon, Loader2, ArrowLeft, CheckCircle2, XCircle, Save } from 'lucide-react';

const TakeAttendance = () => {
  const { id: classId } = useParams();
  const navigate = useNavigate();

  const [cls, setCls] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Pipeline State: 'capture' -> 'processing' -> 'verify'
  const [step, setStep] = useState('capture');
  
  // Image State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Verification State
  const [students, setStudents] = useState([]); // { _id, name, rollNumber, status: 'present'|'absent' }
  const [mlBoxes, setMlBoxes] = useState([]); // Visual bounding boxes

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/classes/${classId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setCls(data.data.class);
        // Initialize verification roster (default all to absent)
        const initialRoster = data.data.class.students.map(s => ({
          ...s,
          status: 'absent'
        }));
        setStudents(initialRoster);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const processML = async () => {
    if (!selectedFile) return;
    setStep('processing');

    const formData = new FormData();
    formData.append('photo', selectedFile);

    try {
      const res = await fetch('http://localhost:5000/api/ml/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();

      if (data.status === 'success') {
        // match_name format: "First Last,23BCS123"
        const detectedRolls = data.data.map(d => {
            if (d.match_name && d.match_name !== 'Unknown' && d.match_name.includes(',')) {
                return d.match_name.split(',')[1].trim();
            }
            return null;
        }).filter(Boolean);
        
        setMlBoxes(data.data);
        
        // Auto-mark present based on ML predictions
        setStudents(prev => prev.map(student => ({
          ...student,
          status: detectedRolls.includes(student.rollNumber) ? 'present' : 'absent'
        })));
        
        setStep('verify');
      } else {
        alert(data.message || 'Error processing image');
        setStep('capture');
      }
    } catch (error) {
      console.error("ML Error:", error);
      alert('Error connecting to ML Server');
      setStep('capture');
    }
  };

  const toggleStatus = (studentId) => {
    setStudents(prev => prev.map(s => {
      if (s._id === studentId) {
        return { ...s, status: s.status === 'present' ? 'absent' : 'present' };
      }
      return s;
    }));
  };

  const submitFinalAttendance = async () => {
    try {
      // Format payload for backend
      const records = students.map(s => ({
        studentId: s._id,
        status: s.status
      }));

      const res = await fetch(`http://localhost:5000/api/classes/${classId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ records, method: 'face_detection' })
      });
      const data = await res.json();

      if (data.status === 'success') {
        navigate(`/faculty/class/${classId}`); // Return to dashboard, graphs will be updated
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save attendance');
    }
  };

  if (loadingInitial) return <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-dark" /></div>;
  if (!cls) return <div className="p-8 text-white">Class not found</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <Link to={`/faculty/class/${classId}`} className="inline-flex items-center gap-2 text-text-dark-secondary hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
        <ArrowLeft size={16} /> Cancel Session
      </Link>

      <div className="mb-4">
         <h1 className="text-4xl font-black text-white font-poppins mb-2">Take Attendance</h1>
         <p className="text-text-dark-secondary font-medium">Class: <span className="text-white">{cls.name}</span></p>
      </div>

      {step === 'capture' && (
        <div className="bg-card-dark border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-dark/5 blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="max-w-xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="text-2xl font-black text-white">Capture Classroom Photo</h2>
            <p className="text-text-dark-secondary">Upload a clear photo of the classroom. Our ML models will scan the faces and pre-fill the attendance ledger for you.</p>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-3xl p-12 hover:bg-white/5 transition-all cursor-pointer group flex flex-col items-center justify-center gap-4"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-64 object-contain rounded-xl shadow-2xl group-hover:scale-[1.02] transition-transform" />
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-primary-dark/20 flex items-center justify-center text-primary-dark group-hover:scale-110 transition-transform">
                    <Camera size={40} />
                  </div>
                  <span className="text-text-dark-secondary font-bold group-hover:text-white transition-colors">Click to Browse or Take Photo</span>
                </>
              )}
            </div>
            
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

            <button 
              onClick={processML} 
              disabled={!selectedFile}
              className="w-full bg-primary-dark hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-primary-dark text-white font-black py-4 rounded-full transition-all shadow-lg shadow-primary-dark/20 flex justify-center items-center gap-2"
            >
              <ImageIcon size={20} /> Run Facial Recognition
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="bg-card-dark border border-primary-dark/20 rounded-[2.5rem] p-24 shadow-2xl text-center space-y-6 flex flex-col items-center">
          <div className="relative">
             <div className="w-24 h-24 rounded-full border-4 border-primary-dark/20 border-t-primary-dark animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Camera className="w-8 h-8 text-primary-dark animate-pulse" />
             </div>
          </div>
          <h2 className="text-2xl font-black text-white">Analyzing Geometry...</h2>
          <p className="text-text-dark-secondary max-w-md mx-auto">Extracting 512-D facial embeddings and running bipartite vector matchmaking globally.</p>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl flex items-center justify-between">
             <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><CheckCircle2 size={20}/> AI Processing Complete</h3>
                <p className="text-sm">Please verify the list below. The ML model pre-checked detected students. You can manually adjust entries as needed.</p>
             </div>
             <div className="text-right ml-4 border-l border-emerald-500/20 pl-6 shrink-0">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Detected</p>
                <p className="text-3xl font-black">{students.filter(s => s.status === 'present').length} / {students.length}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* The Image Viewer for reference */}
             <div className="bg-card-dark border border-white/5 rounded-3xl p-4 shadow-xl">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-text-dark-secondary mb-4 px-2">Reference Image</h4>
                 <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-video flex justify-center">
                    <img id="capture-image" src={imagePreview} className="max-h-[50vh] object-contain" alt="Classroom" onLoad={(e) => {
                       // Very basic box drawing logic. Ideally we scale this appropriately.
                       const img = e.target;
                       const container = img.parentElement;
                       const scaleX = img.width / img.naturalWidth;
                       const scaleY = img.height / img.naturalHeight;
                       
                       mlBoxes.forEach((box, i) => {
                          const div = document.createElement('div');
                          div.style.position = 'absolute';
                          div.style.border = '2px solid #3B82F6';
                          div.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                          div.style.left = `${(img.offsetLeft) + (box.bbox[0] * scaleX)}px`;
                          div.style.top = `${(img.offsetTop) + (box.bbox[1] * scaleY)}px`;
                          div.style.width = `${(box.bbox[2] - box.bbox[0]) * scaleX}px`;
                          div.style.height = `${(box.bbox[3] - box.bbox[1]) * scaleY}px`;
                          
                          const label = document.createElement('span');
                          
                          let labelText = "Unknown";
                          if (box.match_name && box.match_name.includes(',')) {
                             labelText = box.match_name.split(',')[0]; 
                          }

                          label.textContent = labelText;
                          label.className = 'absolute -top-6 left-0 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10';
                          
                          div.appendChild(label);
                          container.appendChild(div);
                       });
                    }}/>
                 </div>
             </div>

             {/* The Roster Checklist */}
             <div className="bg-card-dark border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col h-[60vh]">
                <h4 className="text-sm font-bold uppercase tracking-widest text-text-dark-secondary mb-4 flex justify-between items-end">
                   <span>Verification Roster</span>
                   <button onClick={() => setStudents(prev => prev.map(s => ({...s, status: 'present'})))} className="text-blue-400 hover:text-white capitalize text-xs bg-blue-500/10 px-2 py-1 rounded">Mark All Present</button>
                </h4>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                   {students.map(student => (
                     <div 
                       key={student._id} 
                       onClick={() => toggleStatus(student._id)}
                       className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                         student.status === 'present' 
                           ? 'bg-emerald-500/10 border-emerald-500/30' 
                           : 'bg-white/5 border-white/5 hover:bg-white/10'
                       }`}
                     >
                        <div className="flex flex-col">
                           <span className={`font-bold ${student.status === 'present' ? 'text-emerald-400' : 'text-white'}`}>{student.name}</span>
                           <span className="text-xs text-text-dark-secondary">{student.rollNumber}</span>
                        </div>
                        <div>
                           {student.status === 'present' 
                             ? <CheckCircle2 className="text-emerald-500" size={24} />
                             : <XCircle className="text-text-dark-secondary opacity-50" size={24} />
                           }
                        </div>
                     </div>
                   ))}
                </div>

                <div className="pt-6 mt-4 border-t border-white/10">
                   <button 
                     onClick={submitFinalAttendance}
                     className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2"
                   >
                     <Save size={20} /> Submit Final Attendance
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeAttendance;
