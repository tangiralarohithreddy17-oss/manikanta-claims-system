import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowLeft, Save, Upload, AlertCircle, Sparkles } from 'lucide-react';

export default function ClaimForm({ token }) {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [dealerShopName, setDealerShopName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Food & Grains');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [quantityReturned, setQuantityReturned] = useState('');
  const [reasonForReturn, setReasonForReturn] = useState('Damaged in Transit');
  const [damageDescription, setDamageDescription] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  
  // Return Date defaults to today's date in local time YYYY-MM-DD
  const [returnDate, setReturnDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Image conversion to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // limit 2MB
        alert('Image is too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      setError('Contact number must be exactly 10 digits and contain only numbers.');
      setLoading(false);
      return;
    }

    if (parseInt(quantityReturned, 10) <= 0) {
      setError('Returned quantity must be greater than zero.');
      setLoading(false);
      return;
    }

    const claimPayload = {
      customer_name: customerName,
      dealer_shop_name: dealerShopName,
      contact_number: contactNumber,
      product_name: productName,
      product_category: productCategory,
      invoice_number: invoiceNumber,
      quantity_returned: parseInt(quantityReturned, 10),
      reason_for_return: reasonForReturn,
      damage_description: damageDescription,
      image_url: imageBase64,
      return_date: returnDate
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(claimPayload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      navigate(`/claims/${data.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to the server to submit claim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '30px', overflowY: 'auto' }}>
      {/* Header back button */}
      <button 
        onClick={() => navigate('/claims')}
        className="btn btn-secondary"
        style={{ marginBottom: '24px', padding: '8px 12px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Registry</span>
      </button>

      {/* Page Title */}
      <header style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Log Goods Return Request</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Fill out the details of the returned products to register the damage claim for inspection.</p>
      </header>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '30px', maxWidth: '850px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--border-main)',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginBottom: '28px',
          width: 'fit-content'
        }}>
          <Sparkles size={14} style={{ color: 'var(--accent-secondary)' }} />
          <span>Return Request ID will be <strong>Auto-Generated</strong> (e.g. MR-2026-XXXX) on submission.</span>
        </div>

        {/* Customer & Shop Details */}
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border-main)', paddingBottom: '8px' }}>
          Customer & Billing Information
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Dealer / Shop Name *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Venkateshwara Kirana Stores"
              value={dealerShopName}
              onChange={(e) => setDealerShopName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Contact Name *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Ramesh Kumar"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Contact Number (10 Digits) *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. 9876543210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Number</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. INV-2026-0042"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
        </div>

        {/* Product Details */}
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '24px', marginBottom: '16px', borderBottom: '1px solid var(--border-main)', paddingBottom: '8px' }}>
          Product Details & Return Reason
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Basmati Rice Premium 25kg"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Category</label>
            <select 
              className="form-control"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
            >
              <option value="Food & Grains">Food & Grains</option>
              <option value="Edible Oils">Edible Oils</option>
              <option value="Household Cleaning">Household Cleaning</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity Returned (Units) *</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="e.g. 5"
              value={quantityReturned}
              onChange={(e) => setQuantityReturned(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Return Date *</label>
            <input 
              type="date" 
              className="form-control" 
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Primary Reason for Return *</label>
          <select 
            className="form-control"
            value={reasonForReturn}
            onChange={(e) => setReasonForReturn(e.target.value)}
          >
            <option value="Damaged in Transit">Damaged in Transit</option>
            <option value="Leaky Packaging">Leaky Packaging</option>
            <option value="Expired Stock">Expired Stock</option>
            <option value="Wrong Item Delivered">Wrong Item Delivered</option>
            <option value="Quality Issue (Insects/Contamination)">Quality Issue (Insects/Contamination)</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Damage Description & Comments</label>
          <textarea 
            className="form-control" 
            rows="4" 
            placeholder="Describe the condition of returned goods in detail, including box leakage, packet breakage, transport issues..."
            value={damageDescription}
            onChange={(e) => setDamageDescription(e.target.value)}
          />
        </div>

        {/* Image Upload */}
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '24px', marginBottom: '16px', borderBottom: '1px solid var(--border-main)', paddingBottom: '8px' }}>
          Visual Evidence (Product Images)
        </h3>

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label className="form-label">Upload Product Images</label>
          <div style={{
            border: '2px dashed var(--border-main)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            transition: 'border-color 0.2s ease',
            position: 'relative'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-main)'}
          >
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Upload size={28} style={{ color: 'var(--text-light)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {imageBase64 ? 'Image Loaded successfully!' : 'Click or Drag & Drop product photo here'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                PNG, JPG, or WEBP up to 2MB.
              </span>
            </div>
          </div>
          
          {imageBase64 && (
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preview:</span>
              <div style={{ marginTop: '8px' }}>
                <img 
                  src={imageBase64} 
                  alt="Product Preview" 
                  style={{
                    maxHeight: '140px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)'
                  }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={() => navigate('/claims')} 
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={16} />
            <span>{loading ? 'Saving Return Request...' : 'Log Return Request'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
