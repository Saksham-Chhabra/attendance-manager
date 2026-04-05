import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Check, AlertCircle, Loader2, Camera } from 'lucide-react';
import api from '../../lib/axios';

const FaceRegistration = () => {
  const [photos, setPhotos] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState('');

  useEffect(() => {
    fetchEnrollmentStatus();
  }, []);

  const fetchEnrollmentStatus = async () => {
    try {
      const res = await api.get('/enrollment/status');
      if (res.data.status === 'success') {
        setEnrollmentStatus(res.data.data.enrollment);
      }
    } catch (err) {
      console.error('Failed to fetch enrollment status', err);
    }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));

    // Check total limit
    const totalPhotos = (uploadedPhotos.length || 0) + photos.length + newPhotos.length;
    if (totalPhotos > 10) {
      setError(`Maximum 10 photos allowed. You've selected ${totalPhotos}. Please remove some.`);
      return;
    }

    setPhotos([...photos, ...newPhotos]);
    setError('');
  };

  const removePhoto = (id, isUploaded = false) => {
    if (isUploaded) {
      const photoIndex = uploadedPhotos.findIndex(p => p === id);
      if (photoIndex !== -1) {
        deleteUploadedPhoto(photoIndex);
      }
    } else {
      const filtered = photos.filter(p => p.id !== id);
      setPhotos(filtered);
      URL.revokeObjectURL(photos.find(p => p.id === id)?.preview);
    }
  };

  const deleteUploadedPhoto = async (photoIndex) => {
    try {
      setLoading(true);
      const res = await api.delete(`/enrollment/photo/${photoIndex}`);
      if (res.data.status === 'success') {
        setSuccess('Photo removed successfully');
        fetchEnrollmentStatus();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (photos.length === 0) {
      setError('Please select at least one photo to upload');
      return;
    }

    const totalPhotos = (uploadedPhotos?.length || 0) + photos.length;
    if (totalPhotos > 10) {
      setError(`Total photos cannot exceed 10. You have ${totalPhotos} selected.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      photos.forEach(photo => {
        formData.append('photos', photo.file);
      });

      const res = await api.post('/enrollment/upload-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status === 'success') {
        setSuccess(res.data.message);
        setPhotos([]);
        fetchEnrollmentStatus();
        
        // Clear success message after 4 seconds
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photos');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    if (!enrollmentStatus?.referencePhotos || enrollmentStatus.referencePhotos.length < 3) {
      setError('Minimum 3 photos required before training. Please upload more photos.');
      return;
    }

    try {
      setTraining(true);
      setError('');
      setTrainingProgress('Training started...');

      const res = await api.post('/enrollment/train');

      if (res.data.status === 'success') {
        setTrainingProgress('Face recognition model training in progress. This may take 1-2 minutes...');
        
        // Poll for training status
        let attempts = 0;
        const maxAttempts = 60; // 60 attempts * 2 seconds = 120 seconds max

        const pollTrainingStatus = setInterval(async () => {
          attempts++;
          
          try {
            const statusRes = await api.get('/enrollment/status');
            const status = statusRes.data.data.enrollment;

            if (status.trainingStatus === 'completed') {
              clearInterval(pollTrainingStatus);
              setTrainingProgress('');
              setSuccess('✓ Face training completed successfully! You are now enrolled.');
              setTraining(false);
              fetchEnrollmentStatus();
              setTimeout(() => setSuccess(''), 5000);
            } else if (status.trainingStatus === 'failed') {
              clearInterval(pollTrainingStatus);
              setTrainingProgress('');
              setError(`Training failed: ${status.trainingError}`);
              setTraining(false);
              fetchEnrollmentStatus();
            } else if (attempts >= maxAttempts) {
              clearInterval(pollTrainingStatus);
              setTrainingProgress('');
              setError('Training took too long. Please check back in a moment.');
              setTraining(false);
            }
          } catch (err) {
            console.error('Error polling training status:', err);
          }
        }, 2000); // Check every 2 seconds

      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start training');
      setTraining(false);
      setTrainingProgress('');
    }
  };

  const canTrain = enrollmentStatus?.photoCount >= 3;
  const isEnrolled = enrollmentStatus?.isEnrolled;
  const trainingStatus = enrollmentStatus?.trainingStatus;

  return (
    <div className="min-h-screen bg-bg-dark p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Camera size={32} className="text-primary-dark" />
            <h1 className="text-3xl sm:text-4xl font-poppins font-black text-white">
              Face Enrollment
            </h1>
          </div>
          <p className="text-text-dark-secondary text-lg">
            Register your face for automated attendance marking. Upload 3-10 clear photos of yourself.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
            <div className="text-sm text-text-dark-secondary mb-2">Photos Uploaded</div>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-black text-primary-dark">
                {enrollmentStatus?.photoCount || 0}
              </div>
              <div className="text-text-dark-secondary">/10</div>
            </div>
            <div className="mt-2 bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-dark h-full transition-all"
                style={{ width: `${((enrollmentStatus?.photoCount || 0) / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
            <div className="text-sm text-text-dark-secondary mb-2">Training Status</div>
            <div className="flex items-center gap-2">
              <div className={`text-lg font-bold ${
                trainingStatus === 'completed' ? 'text-emerald-400' :
                trainingStatus === 'failed' ? 'text-red-400' :
                trainingStatus === 'training' ? 'text-yellow-400' :
                'text-text-dark-secondary'
              }`}>
                {trainingStatus === 'completed' && '✓ Completed'}
                {trainingStatus === 'failed' && '✗ Failed'}
                {trainingStatus === 'training' && '⏳ Training...'}
                {trainingStatus === 'pending' && '○ Pending'}
              </div>
            </div>
          </div>

          <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
            <div className="text-sm text-text-dark-secondary mb-2">Enrollment</div>
            <div className="flex items-center gap-2">
              {isEnrolled ? (
                <>
                  <Check size={24} className="text-emerald-400" />
                  <span className="font-bold text-emerald-400">Enrolled</span>
                </>
              ) : (
                <>
                  <AlertCircle size={24} className="text-yellow-400" />
                  <span className="font-bold text-yellow-400">Not Enrolled</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 mb-6 flex gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-1" />
            <div className="text-red-400">{error}</div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-2xl p-4 mb-6 flex gap-3">
            <Check size={20} className="text-emerald-400 flex-shrink-0 mt-1" />
            <div className="text-emerald-400">{success}</div>
          </div>
        )}

        {/* Training Progress */}
        {trainingProgress && (
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-2xl p-4 mb-6 flex gap-3">
            <Loader2 size={20} className="text-blue-400 flex-shrink-0 mt-1 animate-spin" />
            <div className="text-blue-400">{trainingProgress}</div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-card-dark border border-white/5 rounded-3xl p-8">
              <h2 className="text-2xl font-poppins font-black mb-6">Upload Photos</h2>

              {/* File Upload Area */}
              <form onSubmit={handleUpload}>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary-dark/50 rounded-2xl p-12 cursor-pointer hover:border-primary-dark hover:bg-primary-dark/5 transition-all">
                  <Upload size={32} className="text-primary-dark mb-3" />
                  <p className="text-white font-bold mb-2">Click to upload photos</p>
                  <p className="text-text-dark-secondary text-sm">
                    PNG, JPG up to 10MB • {10 - (photos.length + (enrollmentStatus?.photoCount || 0))} slots remaining
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoSelect}
                    disabled={loading || training}
                    className="hidden"
                  />
                </label>

                {/* Selected Photos Preview */}
                {photos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-bold mb-4">Selected Photos ({photos.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {photos.map(photo => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.preview}
                            alt="preview"
                            className="w-full h-24 object-cover rounded-xl"
                          />
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Buttons */}
                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    disabled={photos.length === 0 || loading || training}
                    className="flex-1 bg-primary-dark text-white font-bold py-3 rounded-xl hover:bg-primary-dark/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Uploaded Photos Section */}
          <div>
            <div className="bg-card-dark border border-white/5 rounded-3xl p-8 sticky top-8">
              <h2 className="text-xl font-poppins font-black mb-4">Uploaded Photos</h2>

              {enrollmentStatus?.referencePhotos && enrollmentStatus.referencePhotos.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {enrollmentStatus.referencePhotos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={photo}
                          alt={`uploaded-${idx}`}
                          className="w-full h-24 object-cover rounded-lg bg-white/5"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                        <button
                          onClick={() => removePhoto(idx, true)}
                          disabled={loading || training}
                          className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleTrainModel}
                    disabled={!canTrain || training || isEnrolled}
                    className={`w-full font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      isEnrolled
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : canTrain
                          ? 'bg-primary-dark text-white hover:bg-primary-dark/90'
                          : 'bg-white/10 text-text-dark-secondary cursor-not-allowed'
                    }`}
                  >
                    {training ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Training...
                      </>
                    ) : isEnrolled ? (
                      <>
                        <Check size={18} />
                        Enrollment Complete
                      </>
                    ) : (
                      <>
                        <Camera size={18} />
                        Start Training
                      </>
                    )}
                  </button>

                  {!canTrain && (
                    <p className="text-text-dark-secondary text-xs mt-3 text-center">
                      Upload {3 - (enrollmentStatus?.photoCount || 0)} more photo{3 - (enrollmentStatus?.photoCount || 0) > 1 ? 's' : ''} to enable training
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-text-dark-secondary">
                  <Camera size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No photos uploaded yet</p>
                  <p className="text-xs mt-2">Upload at least 3 photos to start</p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-white/5 rounded-xl p-4 mt-6 text-xs text-text-dark-secondary space-y-2">
                <p><strong>Requirements:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Minimum 3 photos</li>
                  <li>Maximum 10 photos</li>
                  <li>Clear face photos</li>
                  <li>Good lighting</li>
                  <li>JPG or PNG format</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="font-bold text-blue-400 mb-3">How it works</h3>
          <ol className="text-text-dark-secondary text-sm space-y-2 list-decimal list-inside">
            <li>Upload 3-10 clear photos of your face from different angles</li>
            <li>Click "Start Training" to process your photos</li>
            <li>The AI creates a unique facial profile from your photos</li>
            <li>During attendance taking, you'll be automatically recognized</li>
            <li>Teachers can verify results manually if needed</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
