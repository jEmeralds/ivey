import { useState } from 'react';
import { uploadMedia, deleteMedia } from '../services/api';

const MediaUpload = ({ campaignId, media, onUploadSuccess, onSelectForVisual, selectedMediaId }) => {
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null); // for fullscreen preview

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

    for (const file of files) {
      if (file.size > maxSize) { setError(`${file.name} is too large. Max 10MB.`); return; }
      if (!allowedTypes.includes(file.type)) { setError(`${file.name} format not supported.`); return; }
    }

    setUploading(true);
    setError('');
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('campaignId', campaignId);
        await uploadMedia(formData);
      }
      onUploadSuccess();
      e.target.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this file?')) return;
    try {
      await deleteMedia(mediaId);
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete file');
    }
  };

  const getMediaUrl = (filePath) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://edfdzytusmcjuwhjxtwn.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/campaign-media/${filePath}`;
  };

  const isImage = (type) => type?.startsWith('image/');

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">📸 Media Gallery</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {onSelectForVisual
              ? 'Upload photos · Click an image to select it as reference for AI visual generation'
              : 'Upload product images or videos to enhance AI content generation'}
          </p>
        </div>
        {selectedMediaId && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-400 font-medium">1 image selected as reference</span>
            <button
              onClick={() => onSelectForVisual(null)}
              className="text-amber-400 hover:text-amber-300 ml-1 text-xs"
            >✕</button>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="mb-5">
        <label className={`flex items-center justify-center w-full px-4 py-3 rounded-xl font-semibold cursor-pointer transition-all ${
          uploading
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-emerald-500/20'
        }`}>
          {uploading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Images / Videos
            </span>
          )}
          <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
        <p className="text-xs text-gray-400 mt-2 text-center">Max 10MB · JPG, PNG, GIF, WebP, MP4, WebM</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Media Grid */}
      {media && media.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((item) => {
            const isSelected = selectedMediaId === item.id;
            const isImg = isImage(item.file_type);
            return (
              <div key={item.id} className="relative group">
                <div
                  className={`aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer transition-all border-2 ${
                    isSelected
                      ? 'border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500'
                  }`}
                  onClick={() => {
                    if (onSelectForVisual && isImg) {
                      onSelectForVisual(isSelected ? null : item.id);
                    } else {
                      setSelectedMedia(item);
                    }
                  }}
                >
                  {isImg ? (
                    <img src={getMediaUrl(item.file_path)} alt={item.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="relative w-full h-full">
                      <video src={getMediaUrl(item.file_path)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  )}

                  {/* Selected overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Select for visual badge (images only) */}
                  {onSelectForVisual && isImg && !isSelected && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                      <span className="text-xs text-white bg-amber-500/80 px-2 py-1 rounded-lg font-medium">Use as reference</span>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 flex items-center justify-center z-10"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                {/* File info */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 truncate" title={item.file_name}>{item.file_name}</p>
                <p className="text-xs text-gray-400">{(item.file_size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-2">📸</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No media uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload product images to use as reference for AI visuals</p>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4" onClick={() => setSelectedMedia(null)}>
          <button onClick={() => setSelectedMedia(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {isImage(selectedMedia.file_type) ? (
              <img src={getMediaUrl(selectedMedia.file_path)} alt={selectedMedia.file_name} className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            ) : (
              <video src={getMediaUrl(selectedMedia.file_path)} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl" />
            )}
            <div className="mt-4 text-center">
              <p className="text-white font-medium">{selectedMedia.file_name}</p>
              <p className="text-gray-400 text-sm mt-1">{(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;