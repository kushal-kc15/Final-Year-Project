import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getCurrencySymbol } from '../utils/currency';
import OCRUploadModal from './OCRUploadModal';

function AddExpenseModal({ isOpen, onClose, onSuccess }) {
  const { currency } = useAuth();
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'FOOD', label: 'Food & Dining' },
    { value: 'TRANSPORT', label: 'Transportation' },
    { value: 'OFFICE', label: 'Office Supplies' },
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'SALARY', label: 'Salary & Wages' },
    { value: 'RENT', label: 'Rent' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/expenses/', formData);
      
      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: '',
        vendor: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setErrors({});
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating expense:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOCRSuccess = (extractedData) => {
    // Pre-fill form with OCR data
    setFormData({
      ...formData,
      title: extractedData.vendor_name ? `Receipt from ${extractedData.vendor_name}` : formData.title,
      amount: extractedData.total_amount || formData.amount,
      category: extractedData.category || formData.category,
      vendor: extractedData.vendor_name || formData.vendor,
      date: new Date().toISOString().split('T')[0], // Always use today's date
      description: extractedData.description || 'Auto-filled from receipt scan'
    });
    setShowOCRModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>
      
      {/* Modal Container - Fixed max height */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-[24px] overflow-hidden flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 animate-fade-in-up">
        {/* Modal Header - Fixed */}
        <div className="px-6 pt-6 pb-3 flex justify-between items-start border-b border-slate-50 shrink-0">
          <div>
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mb-3 border border-brand-100 shadow-sm">
              <span className="material-icons text-[20px]">receipt_long</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">New Expense</h2>
            <p className="text-slate-500 font-medium text-xs mt-1">Record a new business expenditure.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 -mr-2"
          >
            <span className="material-icons text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* OCR Upload Button */}
          <div className="px-6 pt-4 pb-2">
            <button
              type="button"
              onClick={() => setShowOCRModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-violet-50 text-violet-700 py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-colors border border-violet-200"
            >
              <span className="material-icons text-[18px]">document_scanner</span>
              Scan Receipt with OCR
            </button>
          </div>

          {/* Modal Content (Form) */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 bg-slate-50/30">
          {/* Title Field */}
          <div className="space-y-1.5 group">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 block transition-colors group-focus-within:text-brand-600" htmlFor="title">
              Transaction Title
            </label>
            <input 
              className={`w-full border-2 border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium ${
                errors.title ? 'border-red-300 ring-4 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''
              }`}
              id="title"
              name="title"
              placeholder="e.g. Office Supplies"
              type="text"
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"><span className="material-icons text-[14px]">error_outline</span>{errors.title}</p>}
          </div>

          {/* Amount and Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount Field */}
            <div className="space-y-1.5 group">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 block transition-colors group-focus-within:text-brand-600" htmlFor="amount">
                Amount ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold group-focus-within:text-brand-500 transition-colors">{getCurrencySymbol(currency)}</span>
                <input 
                  className={`w-full border-2 border-slate-200 bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-bold ${
                    errors.amount ? 'border-red-300 ring-4 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                  id="amount"
                  name="amount"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                />
              </div>
              {errors.amount && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"><span className="material-icons text-[14px]">error_outline</span>{errors.amount}</p>}
            </div>

            {/* Category Field */}
            <div className="space-y-1.5 group">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 block transition-colors group-focus-within:text-brand-600" htmlFor="category">
                Category
              </label>
              <div className="relative">
                <select 
                  className={`w-full border-2 border-slate-200 bg-white rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all appearance-none outline-none font-medium ${
                    errors.category ? 'border-red-300 ring-4 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="" disabled className="text-slate-400">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-icons pointer-events-none text-slate-400 text-[20px] group-focus-within:text-brand-500 transition-colors">
                  expand_more
                </span>
              </div>
              {errors.category && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"><span className="material-icons text-[14px]">error_outline</span>{errors.category}</p>}
            </div>
          </div>

          {/* Date Field */}
          <div className="space-y-1.5 group">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 block transition-colors group-focus-within:text-brand-600" htmlFor="date">
              Date
            </label>
            <input 
               className={`w-full border-2 border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all appearance-none outline-none font-medium ${
                errors.date ? 'border-red-300 ring-4 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''
              }`}
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"><span className="material-icons text-[14px]">error_outline</span>{errors.date}</p>}
          </div>

          {/* Vendor Field (Optional) */}
          <div className="space-y-1.5 group">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 block transition-colors group-focus-within:text-brand-600" htmlFor="vendor">
              Vendor <span className="text-slate-400 font-medium normal-case tracking-normal ml-1">(Optional)</span>
            </label>
            <input 
              className="w-full border-2 border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none font-medium"
              id="vendor"
              name="vendor"
              placeholder="e.g. ABC Suppliers"
              type="text"
              value={formData.vendor}
              onChange={handleChange}
            />
          </div>

          {/* Description Field (Optional) */}
          <div className="space-y-1.5 group pb-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 block transition-colors group-focus-within:text-brand-600" htmlFor="description">
              Description <span className="text-slate-400 font-medium normal-case tracking-normal ml-1">(Optional)</span>
            </label>
            <textarea 
              className="w-full border-2 border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none resize-none font-medium"
              id="description"
              name="description"
              placeholder="Add any additional details..."
              rows="2"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
        </form>
        </div>

        {/* Modal Footer (Actions) - Fixed */}
        <div className="px-6 pb-6 pt-3 flex flex-col sm:flex-row-reverse gap-2.5 bg-white border-t border-slate-50 shrink-0">
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-brand-600 text-white py-2.5 px-5 rounded-xl text-sm font-bold tracking-tight shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 border border-brand-500 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <span className="material-icons animate-spin text-[16px]">refresh</span>
                Processing...
              </>
            ) : (
              <>
                Save Record
              </>
            )}
          </button>
          <button 
            onClick={onClose}
            type="button"
            className="flex-1 bg-white text-slate-700 py-2.5 px-5 rounded-xl text-sm font-bold tracking-tight hover:bg-slate-50 hover:text-slate-900 border-2 border-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* OCR Upload Modal */}
      <OCRUploadModal 
        isOpen={showOCRModal}
        onClose={() => setShowOCRModal(false)}
        onSuccess={handleOCRSuccess}
      />
    </div>
  );
}

export default AddExpenseModal;
