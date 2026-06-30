import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Search, SlidersHorizontal, Plus, Eye, RefreshCcw } from 'lucide-react';

export default function ClaimsList({ token }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Load filter states from URL search params
  const searchVal = searchParams.get('search') || '';
  const statusVal = searchParams.get('status') || '';
  const categoryVal = searchParams.get('category') || '';
  const severityVal = searchParams.get('severity') || '';
  const sortVal = searchParams.get('sort') || 'newest';

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchVal) queryParams.append('search', searchVal);
      if (statusVal) queryParams.append('status', statusVal);
      if (categoryVal) queryParams.append('category', categoryVal);
      if (severityVal) queryParams.append('severity', severityVal);
      queryParams.append('sort', sortVal);

      const res = await fetch(`${API_BASE_URL}/api/claims?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve claims list.');
      }

      const data = await res.json();
      setClaims(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server error loading claims.');
    } finally {
      setLoading(false);
    }
  }, [token, searchVal, statusVal, categoryVal, severityVal, sortVal]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Submitted': return 'badge-submitted';
      case 'Under Inspection': return 'badge-under-inspection';
      case 'Awaiting Approval': return 'badge-awaiting-approval';
      case 'Credit Note Issued': return 'badge-credit-note-issued';
      case 'Replacement Dispatched': return 'badge-replacement-dispatched';
      case 'Closed': return 'badge-closed';
      case 'Rejected': return 'badge-rejected';
      default: return '';
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '30px', overflowY: 'auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Claims & Returns Registry</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Track, audit, and inspect goods return requests submitted by dealers and retail stores.</p>
        </div>
        
        {user.role !== 'admin' && (
          <button 
            onClick={() => navigate('/claims/new')}
            className="btn btn-primary"
          >
            <Plus size={18} />
            <span>Log Goods Return</span>
          </button>
        )}
      </div>

      {/* Filters & Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Text Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-light)'
            }} />
            <input 
              type="text" 
              className="form-control"
              style={{ paddingLeft: '40px', width: '100%' }}
              placeholder="Search by ID, customer, product, invoice..."
              value={searchVal}
              onChange={(e) => updateParam('search', e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={statusVal}
              onChange={(e) => updateParam('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Inspection">Under Inspection</option>
              <option value="Awaiting Approval">Awaiting Approval</option>
              <option value="Credit Note Issued">Credit Note Issued</option>
              <option value="Replacement Dispatched">Replacement Dispatched</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={categoryVal}
              onChange={(e) => updateParam('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Food & Grains">Food & Grains</option>
              <option value="Edible Oils">Edible Oils</option>
              <option value="Household Cleaning">Household Cleaning</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div style={{ minWidth: '140px' }}>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={sortVal}
              onChange={(e) => updateParam('sort', e.target.value)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="customer">Sort: Customer</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchVal || statusVal || categoryVal || severityVal) && (
            <button 
              onClick={clearFilters}
              className="btn btn-secondary"
              style={{ padding: '10px 14px' }}
            >
              <RefreshCcw size={16} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading return claims...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--status-rejected-text)' }}>
            {error}
          </div>
        ) : claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No claim records found matching the active criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Return Date</th>
                  <th>Customer Name / Dealer Shop</th>
                  <th>Returned Product</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr 
                    key={claim.id} 
                    onClick={() => navigate(`/claims/${claim.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {claim.id}
                      </span>
                    </td>
                    <td>
                      {new Date(claim.return_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{claim.customer_name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {claim.dealer_shop_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{claim.product_name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {claim.product_category}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{claim.quantity_returned}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusClass(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/claims/${claim.id}`);
                        }}
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
