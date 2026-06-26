import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Store, 
  Phone, 
  FileSpreadsheet, 
  ClipboardCheck, 
  Gavel, 
  History,
  AlertTriangle,
  Play,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

export default function ClaimDetail({ token, user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [claimData, setClaimData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Inspection form states
  const [inspectionResult, setInspectionResult] = useState('');
  const [inspectorRemarks, setInspectorRemarks] = useState('');
  const [damageSeverity, setDamageSeverity] = useState('Medium');
  const [approvalRecommendation, setApprovalRecommendation] = useState('approve_replacement');
  
  // Decision form states
  const [decisionType, setDecisionType] = useState('approve_replacement');
  const [decisionRemarks, setDecisionRemarks] = useState('');

  // Editing form states
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editDealerShopName, setEditDealerShopName] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('');
  const [editQuantityReturned, setEditQuantityReturned] = useState('');
  const [editReturnDate, setEditReturnDate] = useState('');
  const [editReasonForReturn, setEditReasonForReturn] = useState('');
  const [editDamageDescription, setEditDamageDescription] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const startEditing = () => {
    const c = claimData.claim;
    setEditCustomerName(c.customer_name || '');
    setEditDealerShopName(c.dealer_shop_name || '');
    setEditContactNumber(c.contact_number || '');
    setEditInvoiceNumber(c.invoice_number || '');
    setEditProductName(c.product_name || '');
    setEditProductCategory(c.product_category || 'Food & Grains');
    setEditQuantityReturned(c.quantity_returned || '');
    setEditReturnDate(c.return_date || '');
    setEditReasonForReturn(c.reason_for_return || 'Damaged in Transit');
    setEditDamageDescription(c.damage_description || '');
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/claims/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: editCustomerName,
          dealer_shop_name: editDealerShopName,
          contact_number: editContactNumber,
          invoice_number: editInvoiceNumber,
          product_name: editProductName,
          product_category: editProductCategory,
          quantity_returned: parseInt(editQuantityReturned, 10),
          reason_for_return: editReasonForReturn,
          damage_description: editDamageDescription,
          return_date: editReturnDate,
          image_url: claimData.claim.image_url
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save claim edits');
      }

      setIsEditing(false);
      await fetchClaimDetails();
    } catch (err) {
      alert(err.message || 'Error updating claim');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchClaimDetails = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/claims/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to retrieve claim details.');
      }
      
      const data = await res.json();
      setClaimData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server error loading claim details.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchClaimDetails();
  }, [fetchClaimDetails]);

  // Transition status manually (e.g. Submitted -> Under Inspection)
  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/claims/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status.');
      await fetchClaimDetails();
    } catch (err) {
      alert(err.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit inspection report
  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    if (!inspectionResult) {
      alert('Please fill out the inspection result field');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/claims/${id}/inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inspection_result: inspectionResult,
          inspector_remarks: inspectorRemarks,
          damage_severity: damageSeverity,
          approval_recommendation: approvalRecommendation
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit inspection');
      }
      // Reset form
      setInspectionResult('');
      setInspectorRemarks('');
      await fetchClaimDetails();
    } catch (err) {
      alert(err.message || 'Error submitting inspection');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit manager decision
  const handleDecideSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/claims/${id}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          decision_type: decisionType,
          decision_remarks: decisionRemarks
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit decision');
      }
      setDecisionRemarks('');
      await fetchClaimDetails();
    } catch (err) {
      alert(err.message || 'Error submitting decision');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading claim files...</p>
      </div>
    );
  }

  if (error || !claimData) {
    return (
      <div style={{ padding: '30px', color: 'var(--status-rejected-text)' }}>
        <h3>Error retrieving files</h3>
        <p>{error || 'File not found.'}</p>
        <button onClick={() => navigate('/claims')} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Registry
        </button>
      </div>
    );
  }

  const { claim, inspections, decisions, auditLogs } = claimData;

  // Roles verification
  const isStaff = user && (user.role === 'staff' || user.role === 'admin');
  const isManager = user && user.role === 'manager';

  // Status mapping to highlight tracking workflow bar
  const workflowNodes = [
    { key: 'Submitted', label: 'Submitted' },
    { key: 'Under Inspection', label: 'Inspecting' },
    { key: 'Awaiting Approval', label: 'Awaiting Mgr' },
    { key: 'Finalized', label: 'Resolved' },
    { key: 'Closed', label: 'Closed' }
  ];

  const getWorkflowIndex = (status) => {
    if (status === 'Submitted') return 0;
    if (status === 'Under Inspection') return 1;
    if (status === 'Awaiting Approval') return 2;
    if (['Credit Note Issued', 'Replacement Dispatched', 'Rejected'].includes(status)) return 3;
    if (status === 'Closed') return 4;
    return 0;
  };

  const currentWorkflowIdx = getWorkflowIndex(claim.status);

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'Low': return 'badge-severity-low';
      case 'Medium': return 'badge-severity-medium';
      case 'High': return 'badge-severity-high';
      case 'Critical': return 'badge-severity-critical';
      default: return '';
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

      {/* Claim Title */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>Claim Details</h2>
            <span style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-muted)' }}>{claim.id}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Created on {new Date(claim.created_at).toLocaleString('en-IN')}
          </p>
        </div>
        
        {/* Status manual triggers */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {claim.status === 'Submitted' && isStaff && (
            <button 
              onClick={() => handleStatusChange('Under Inspection')}
              className="btn btn-primary animate-fade-in"
              disabled={actionLoading}
              style={{ backgroundColor: '#d97706' }}
            >
              <Play size={16} />
              <span>Begin Inspection</span>
            </button>
          )}

          {['Credit Note Issued', 'Replacement Dispatched', 'Rejected'].includes(claim.status) && (
            <button 
              onClick={() => handleStatusChange('Closed')}
              className="btn btn-primary"
              disabled={actionLoading}
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <CheckCircle2 size={16} />
              <span>Close Claim File</span>
            </button>
          )}
        </div>
      </div>

      {/* Tracker Timeline Bar */}
      <div className="glass-panel" style={{ padding: '24px 30px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', alignItems: 'center' }}>
          {/* Connector Line */}
          <div style={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: '20px',
            height: '4px',
            backgroundColor: 'var(--border-main)',
            zIndex: 1
          }} />
          {/* Active Connector Line */}
          <div style={{
            position: 'absolute',
            left: '5%',
            width: `${(currentWorkflowIdx / (workflowNodes.length - 1)) * 90}%`,
            top: '20px',
            height: '4px',
            backgroundColor: 'var(--accent-primary)',
            zIndex: 2,
            transition: 'width 0.4s ease'
          }} />

          {/* Nodes */}
          {workflowNodes.map((node, index) => {
            const isCompleted = index <= currentWorkflowIdx;
            const isActive = index === currentWorkflowIdx;
            return (
              <div 
                key={node.key} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  zIndex: 3,
                  width: '18%'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? 'var(--accent-primary)' : 'var(--bg-input)',
                  border: `3px solid ${isActive ? 'var(--accent-secondary)' : 'var(--border-main)'}`,
                  color: isCompleted ? '#ffffff' : 'var(--text-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: 'var(--shadow-glass)',
                  transition: 'all 0.3s ease'
                }}>
                  {index + 1}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: isCompleted ? 600 : 500,
                  color: isCompleted ? 'var(--text-main)' : 'var(--text-light)',
                  marginTop: '10px',
                  textAlign: 'center'
                }}>
                  {node.label}
                  {index === 3 && currentWorkflowIdx >= 3 && ` (${claim.status.split(' ')[0]})`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Side: Claim Details Info card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-main)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Return Request Particulars
              </h3>
              {!isEditing && !['Credit Note Issued', 'Replacement Dispatched', 'Rejected', 'Closed'].includes(claim.status) && user && ['admin', 'staff', 'manager'].includes(user.role) && (
                <button 
                  onClick={startEditing} 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--accent-secondary)' }}
                >
                  Edit Request
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleEditSubmit}>
                <div className="form-row" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Dealer / Shop Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editDealerShopName} 
                      onChange={(e) => setEditDealerShopName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Contact Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editCustomerName} 
                      onChange={(e) => setEditCustomerName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editContactNumber} 
                      onChange={(e) => setEditContactNumber(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invoice Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editInvoiceNumber} 
                      onChange={(e) => setEditInvoiceNumber(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editProductName} 
                      onChange={(e) => setEditProductName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Product Category</label>
                    <select 
                      className="form-control" 
                      value={editProductCategory} 
                      onChange={(e) => setEditProductCategory(e.target.value)}
                    >
                      <option value="Food & Grains">Food & Grains</option>
                      <option value="Edible Oils">Edible Oils</option>
                      <option value="Household Cleaning">Household Cleaning</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Quantity Returned</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editQuantityReturned} 
                      onChange={(e) => setEditQuantityReturned(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Return Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={editReturnDate} 
                      onChange={(e) => setEditReturnDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Reason for Return</label>
                  <select 
                    className="form-control" 
                    value={editReasonForReturn} 
                    onChange={(e) => setEditReasonForReturn(e.target.value)}
                  >
                    <option value="Damaged in Transit">Damaged in Transit</option>
                    <option value="Leaky Packaging">Leaky Packaging</option>
                    <option value="Expired Stock">Expired Stock</option>
                    <option value="Wrong Item Delivered">Wrong Item Delivered</option>
                    <option value="Quality Issue (Insects/Contamination)">Quality Issue (Insects/Contamination)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Damage Description</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={editDamageDescription} 
                    onChange={(e) => setEditDamageDescription(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsEditing(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={actionLoading}
                    style={{ backgroundColor: 'var(--accent-primary)', color: '#131921', fontWeight: 600 }}
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="form-label">Dealer / Shop</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 500 }}>
                      <Store size={16} style={{ color: 'var(--text-muted)' }} />
                      {claim.dealer_shop_name || 'Not Available'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="form-label">Customer Contact</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 500 }}>
                      <User size={16} style={{ color: 'var(--text-muted)' }} />
                      {claim.customer_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="form-label">Contact Number</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                      <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                      {claim.contact_number || 'No contact number'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="form-label">Invoice Reference</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                      <FileSpreadsheet size={15} style={{ color: 'var(--text-muted)' }} />
                      {claim.invoice_number || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-main)', marginTop: '20px', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="form-label">Product Name</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{claim.product_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{claim.product_category}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="form-label">Quantity Returned</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{claim.quantity_returned} unit(s)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="form-label">Return Date</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
                      {new Date(claim.return_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="form-label">Reason for Return</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--status-rejected-text)', fontWeight: 600 }}>
                      {claim.reason_for_return}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-main)', marginTop: '20px', paddingTop: '20px' }}>
                  <span className="form-label">Damage Description</span>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.5', marginTop: '6px', color: 'var(--text-muted)' }}>
                    {claim.damage_description || 'No detailed damage description provided.'}
                  </p>
                </div>

                {claim.image_url && (
                  <div style={{ borderTop: '1px solid var(--border-main)', marginTop: '20px', paddingTop: '20px' }}>
                    <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={15} /> Uploaded Product Evidence
                    </span>
                    <div style={{ marginTop: '10px' }}>
                      <img 
                        src={claim.image_url} 
                        alt="Claim Evidence" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '280px', 
                          borderRadius: '8px',
                          border: '1px solid var(--border-main)'
                        }} 
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Side: Inspections, Approvals and Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action Form: Log Inspection */}
          {claim.status === 'Under Inspection' && isStaff && (
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid #d9770640' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <ClipboardCheck size={20} style={{ color: '#d97706' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Log Inspection Report</h3>
              </div>

              <form onSubmit={handleInspectSubmit}>
                <div className="form-group">
                  <label className="form-label">Inspection Verdict</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Fail (Torn and unsalvageable sacks)"
                    value={inspectionResult}
                    onChange={(e) => setInspectionResult(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Damage Severity</label>
                    <select 
                      className="form-control"
                      value={damageSeverity}
                      onChange={(e) => setDamageSeverity(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Recommended Decision</label>
                    <select 
                      className="form-control"
                      value={approvalRecommendation}
                      onChange={(e) => setApprovalRecommendation(e.target.value)}
                    >
                      <option value="approve_replacement">Approve Replacement</option>
                      <option value="issue_credit_note">Issue Credit Note</option>
                      <option value="reject_claim">Reject Claim</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Inspector Remarks</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Provide details on physical goods audit and damage root-cause..."
                    value={inspectorRemarks}
                    onChange={(e) => setInspectorRemarks(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={actionLoading}
                  style={{ width: '100%', backgroundColor: '#d97706' }}
                >
                  {actionLoading ? 'Saving...' : 'Submit Inspection Report'}
                </button>
              </form>
            </div>
          )}

          {/* Action Form: Manager Decisions */}
          {claim.status === 'Awaiting Approval' && isManager && (
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid #7e22ce40' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Gavel size={20} style={{ color: '#7e22ce' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Finalize Claim Resolution</h3>
              </div>

              <form onSubmit={handleDecideSubmit}>
                <div className="form-group">
                  <label className="form-label">Resolution Path</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="radio" 
                        name="decision" 
                        value="approve_replacement" 
                        checked={decisionType === 'approve_replacement'}
                        onChange={(e) => setDecisionType(e.target.value)}
                      />
                      <span>Approve Stock Replacement</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="radio" 
                        name="decision" 
                        value="issue_credit_note" 
                        checked={decisionType === 'issue_credit_note'}
                        onChange={(e) => setDecisionType(e.target.value)}
                      />
                      <span>Issue Account Credit Note</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="radio" 
                        name="decision" 
                        value="reject_claim" 
                        checked={decisionType === 'reject_claim'}
                        onChange={(e) => setDecisionType(e.target.value)}
                      />
                      <span>Reject Return Claim</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Manager Verdict Remarks</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Enter final approval comments or reason for rejection..."
                    value={decisionRemarks}
                    onChange={(e) => setDecisionRemarks(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={actionLoading}
                  style={{ width: '100%', backgroundColor: '#7e22ce' }}
                >
                  {actionLoading ? 'Logging Decision...' : 'Commit Claim Resolution'}
                </button>
              </form>
            </div>
          )}

          {/* Historic Data: Completed Inspections */}
          {inspections.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>
                Logged Inspections ({inspections.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {inspections.map((insp) => (
                  <div key={insp.id} style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${getSeverityBadgeClass(insp.damage_severity)}`}>
                        Severity: {insp.damage_severity}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        {new Date(insp.inspected_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Verdict: </strong>
                      <span>{insp.inspection_result}</span>
                    </div>

                    <div style={{ fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Recommended: </strong>
                      <span style={{ textTransform: 'capitalize' }}>
                        {insp.approval_recommendation.replace('_', ' ')}
                      </span>
                    </div>

                    {insp.inspector_remarks && (
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-muted)', 
                        padding: '10px', 
                        backgroundColor: 'var(--bg-app)', 
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--text-light)'
                      }}>
                        "{insp.inspector_remarks}"
                      </div>
                    )}

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', alignSelf: 'flex-end' }}>
                      Inspected by {insp.inspected_by}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historic Data: Manager Decisions */}
          {decisions.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>
                Resolution Actions
              </h3>
              {decisions.map((dec) => (
                <div key={dec.id} style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 700, 
                      color: dec.decision_type === 'reject_claim' ? 'var(--status-rejected-text)' : 'var(--status-credit-text)'
                    }}>
                      {dec.decision_type === 'approve_replacement' && 'Stock Replacement Dispatched'}
                      {dec.decision_type === 'issue_credit_note' && 'Credit Note Processed'}
                      {dec.decision_type === 'reject_claim' && 'Claim Rejected'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {new Date(dec.decided_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-muted)', 
                    padding: '10px', 
                    backgroundColor: 'var(--bg-app)', 
                    borderRadius: '6px'
                  }}>
                    "{dec.decision_remarks}"
                  </p>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', alignSelf: 'flex-end' }}>
                    Signed by {dec.decided_by}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* System Audit Logs for the claim */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <History size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>Claim Workflow Trail</h3>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              paddingLeft: '10px',
              position: 'relative'
            }}>
              {/* Timeline center line */}
              <div style={{
                position: 'absolute',
                left: '4px',
                top: '5px',
                bottom: '5px',
                width: '2px',
                backgroundColor: 'var(--border-main)'
              }} />

              {auditLogs.map((log) => (
                <div key={log.id} style={{
                  position: 'relative',
                  paddingLeft: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {/* Circle Indicator */}
                  <div style={{
                    position: 'absolute',
                    left: '0px',
                    top: '5px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    border: '2px solid var(--bg-card)'
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{log.action}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{log.details}</p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                    User: {log.user_name} ({log.user_role})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
