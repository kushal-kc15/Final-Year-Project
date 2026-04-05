import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getCurrencySymbol } from '../utils/currency';

function OCRUploadModal({ isOpen, onClose, onSuccess }) {
  const { currency } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/receipts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setExtractedData(response.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to process receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = () => {
    if (extractedData) {
      // Pass extracted data to parent for expense creation
      onSuccess(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-[24px] overflow-hidden flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start border-b border-slate-50">
          <div>
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-4 border border-violet-100 shadow-sm">
              <span className="material-icons">receipt_long</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Upload Receipt</h2>
            <p className="text-slate-500 font-medium text-sm mt-1 mb-2">Scan receipt and extract expense data automatically</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 -mr-2"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-8 py-6 space-y-5 bg-slate-50/30 overflow-y-auto flex-1">
          
          {!extractedData ? (
            <>
              {/* File Upload */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-600 block">
                  Receipt Image
                </label>
                
                {!preview ? (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-icons text-5xl text-slate-300 mb-3">cloud_upload</span>
                      <p className="mb-2 text-sm text-slate-600 font-semibold">
                        <span className="text-brand-700">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">PNG, JPG, JPEG (MAX. 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Receipt preview" 
                      className="w-full h-64 object-contain bg-white rounded-xl border-2 border-slate-200"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="material-icons text-red-600 text-xl">error</span>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                    {error.includes('Tesseract') && (
                      <p className="text-xs text-red-600 mt-2">
                        📝 Tesseract OCR is not installed. See INSTALL_TESSERACT.md for instructions.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Extracted Data Display */}
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="material-icons text-emerald-600 text-xl">check_circle</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Receipt Processed Successfully!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Review the extracted data below</p>
                  </div>
                </div>

                {/* Low confidence warning */}
                {(extractedData.vendor_confidence < 50 || extractedData.amount_confidence < 50) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-icons text-amber-600 text-xl">warning</span>
                    <div>
                      <p className="text-sm font-bold text-amber-900">Low Confidence Detection</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        OCR confidence is low. Please verify the extracted data manually.
                        {extractedData.raw_text?.includes('Tesseract') && ' (Using fallback processor - install Tesseract for better results)'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Preview Image */}
                {preview && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Receipt Image</p>
                    <img 
                      src={preview} 
                      alt="Receipt" 
                      className="w-full h-48 object-contain bg-white rounded-xl border border-slate-200"
                    />
                  </div>
                )}

                {/* Extracted Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Vendor</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        extractedData.vendor_confidence > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {extractedData.vendor_confidence}% confident
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{extractedData.vendor_name || 'Not detected'}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        extractedData.amount_confidence > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {extractedData.amount_confidence}% confident
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {getCurrencySymbol(currency)} {extractedData.total_amount || '0.00'}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        extractedData.date_confidence > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {extractedData.date_confidence}% confident
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {extractedData.receipt_date ? new Date(extractedData.receipt_date).toLocaleDateString() : 'Not detected'}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Line Items</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {extractedData.line_items?.length || 0} items detected
                    </p>
                  </div>
                </div>

                {/* Raw Text (Collapsible) */}
                {extractedData.raw_text && (
                  <details className="bg-white rounded-xl border border-slate-200">
                    <summary className="px-4 py-3 cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors">
                      View Raw OCR Text
                    </summary>
                    <div className="px-4 pb-4">
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                        {extractedData.raw_text}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 pb-8 pt-4 flex flex-col sm:flex-row-reverse gap-3 bg-white border-t border-slate-50">
          {!extractedData ? (
            <>
              <button 
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex-1 bg-brand-600 text-white py-3.5 px-6 rounded-xl font-bold tracking-tight shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 border border-brand-500 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-spin text-[18px]">refresh</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-icons text-[18px]">document_scanner</span>
                    Scan Receipt
                  </>
                )}
              </button>
              <button 
                onClick={handleClose}
                type="button"
                className="flex-1 bg-white text-slate-700 py-3.5 px-6 rounded-xl font-bold tracking-tight hover:bg-slate-50 hover:text-slate-900 border-2 border-slate-200 transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleCreateExpense}
                className="flex-1 bg-emerald-600 text-white py-3.5 px-6 rounded-xl font-bold tracking-tight shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-icons text-[18px]">add_circle</span>
                Create Expense
              </button>
              <button 
                onClick={handleClose}
                type="button"
                className="flex-1 bg-white text-slate-700 py-3.5 px-6 rounded-xl font-bold tracking-tight hover:bg-slate-50 hover:text-slate-900 border-2 border-slate-200 transition-all"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OCRUploadModal;
