import { useState } from 'react';
import { uploadMedia, deleteMedia } from '../services/api';

const MediaUpload = ({ campaignId, media, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

    for (const file of files) {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} has an unsupported format. Allowed: images (jpg, png, gif, webp) and videos (mp4, webm).`);
        return;
      }
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
      e.target.value = ''; // Reset input
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await deleteMedia(mediaId);
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete file');
      console.error(err);
    }
  };

  const getMediaUrl = (filePath) => {
    // Use environment variable or fallback to your Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://edfdzytusmcjuwhjxtwn.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/campaign-media/${filePath}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Media Gallery</h3>
      
      {/* Upload Button */}
      <div className="mb-6">
        <label className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl">
          {uploading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Images/Videos
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Max 10MB per file. Supports: JPG, PNG, GIF, WebP, MP4, WebM
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Media Grid */}
      {media && media.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div key={item.id} className="relative group">
              <div 
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 cursor-pointer hover:border-purple-500 transition-all"
                onClick={() => setSelectedMedia(item)}
              >
                {item.file_type.startsWith('image/') ? (
                  <img
                    src={getMediaUrl(item.file_path)}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={getMediaUrl(item.file_path)}
                      className="w-full h-full object-cover"
                    />
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* File Info */}
              <p className="text-xs text-gray-600 mt-2 truncate" title={item.file_name}>
                {item.file_name}
              </p>
              <p className="text-xs text-gray-400">
                {(item.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">📸</div>
          <p className="text-gray-600">No media uploaded yet</p>
          <p className="text-sm text-gray-500 mt-1">Upload product images or videos to enhance AI content generation</p>
        </div>
      )}

      {/* Full-Screen Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Media Container */}
          <div className="w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.file_type.startsWith('image/') ? (
              <img
                src={getMediaUrl(selectedMedia.file_path)}
                alt={selectedMedia.file_name}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                onError={(e) => {
                  console.error('Image failed to load:', getMediaUrl(selectedMedia.file_path));
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" fill="white">Failed to load</text></svg>';
                }}
              />
            ) : (
              <video
                src={getMediaUrl(selectedMedia.file_path)}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] w-auto h-auto"
              />
            )}
            
            {/* File Info */}
            <div className="mt-6 text-center">
              <p className="text-white text-lg font-medium">{selectedMedia.file_name}</p>
              <p className="text-gray-400 text-sm mt-1">
                {(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload; 