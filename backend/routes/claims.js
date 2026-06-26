const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Create auto-generated claim ID: MR-YYYY-0001
async function generateClaimId() {
  const currentYear = new Date().getFullYear();
  const yearStr = currentYear.toString();
  const searchPattern = `MR-${yearStr}-%`;
  
  try {
    const queryStr = 'SELECT id FROM claims WHERE id LIKE $1 ORDER BY id DESC LIMIT 1';
    const result = await db.query(queryStr, [searchPattern]);
    
    if (result.rows.length === 0) {
      return `MR-${yearStr}-0001`;
    }
    
    const lastId = result.rows[0].id; // e.g. MR-2026-0005
    const parts = lastId.split('-');
    const sequence = parseInt(parts[2], 10);
    const nextSequence = sequence + 1;
    const nextSequenceStr = nextSequence.toString().padStart(4, '0');
    
    return `MR-${yearStr}-${nextSequenceStr}`;
  } catch (err) {
    console.error('Error generating claim ID:', err);
    // Fallback ID with timestamp if query fails
    return `MR-${yearStr}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

// Log action helper
async function logAuditAction(claimId, user, action, details) {
  try {
    const queryStr = `
      INSERT INTO audit_logs (claim_id, user_id, user_name, user_role, action, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.query(queryStr, [
      claimId,
      user.username,
      user.name,
      user.role,
      action,
      details
    ]);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// 1. Get all claims (with search, filter, sorting)
router.get('/', authMiddleware, async (req, res) => {
  const { search, status, category, severity, sort = 'newest' } = req.query;
  
  let queryStr = 'SELECT * FROM claims WHERE 1=1';
  const params = [];
  let paramCount = 1;

  if (search) {
    queryStr += ` AND (
      id LIKE $${paramCount} OR 
      customer_name LIKE $${paramCount} OR 
      dealer_shop_name LIKE $${paramCount} OR 
      product_name LIKE $${paramCount} OR 
      invoice_number LIKE $${paramCount}
    )`;
    params.push(`%${search}%`);
    paramCount++;
  }

  if (status) {
    queryStr += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (category) {
    queryStr += ` AND product_category = $${paramCount}`;
    params.push(category);
    paramCount++;
  }

  // Sorting
  if (sort === 'oldest') {
    queryStr += ' ORDER BY created_at ASC';
  } else if (sort === 'customer') {
    queryStr += ' ORDER BY customer_name ASC';
  } else {
    queryStr += ' ORDER BY created_at DESC'; // default newest
  }

  try {
    const result = await db.query(queryStr, params);
    
    // If severity filter is active, we need to filter by matching inspections
    // (since severity is stored in inspections table, not claims directly)
    if (severity) {
      const filteredClaims = [];
      for (const claim of result.rows) {
        const inspRes = await db.query('SELECT damage_severity FROM inspections WHERE claim_id = $1 ORDER BY inspected_at DESC LIMIT 1', [claim.id]);
        if (inspRes.rows.length > 0 && inspRes.rows[0].damage_severity === severity) {
          filteredClaims.push(claim);
        }
      }
      return res.json(filteredClaims);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Get claims error:', err);
    res.status(500).json({ message: 'Server error fetching claims' });
  }
});

// 2. Submit a new claim
router.post('/', authMiddleware, async (req, res) => {
  const {
    customer_name,
    dealer_shop_name,
    contact_number,
    product_name,
    product_category,
    invoice_number,
    quantity_returned,
    reason_for_return,
    damage_description,
    image_url,
    return_date
  } = req.body;

  if (!customer_name || !product_name || !quantity_returned || !return_date) {
    return res.status(400).json({ message: 'Missing required return request fields' });
  }

  try {
    const claimId = await generateClaimId();
    const queryStr = `
      INSERT INTO claims (
        id, customer_name, dealer_shop_name, contact_number, 
        product_name, product_category, invoice_number, 
        quantity_returned, reason_for_return, damage_description, 
        image_url, return_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Submitted')
    `;

    await db.query(queryStr, [
      claimId,
      customer_name,
      dealer_shop_name || '',
      contact_number || '',
      product_name,
      product_category || 'General',
      invoice_number || '',
      parseInt(quantity_returned, 10),
      reason_for_return || '',
      damage_description || '',
      image_url || '',
      return_date
    ]);

    await logAuditAction(claimId, req.user, 'Claim Submitted', `New return request created for ${quantity_returned} unit(s) of ${product_name} by ${customer_name}.`);

    res.status(201).json({ message: 'Claim submitted successfully', id: claimId });
  } catch (err) {
    console.error('Submit claim error:', err);
    res.status(500).json({ message: 'Server error submitting claim' });
  }
});

// 3. Get single claim details (including inspections, decisions, and audit trail)
router.get('/:id', authMiddleware, async (req, res) => {
  const claimId = req.params.id;

  try {
    const claimResult = await db.query('SELECT * FROM claims WHERE id = $1', [claimId]);
    if (claimResult.rows.length === 0) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const claim = claimResult.rows[0];

    // Fetch inspections
    const inspectionsResult = await db.query(
      'SELECT * FROM inspections WHERE claim_id = $1 ORDER BY inspected_at DESC', 
      [claimId]
    );

    // Fetch decisions
    const decisionsResult = await db.query(
      'SELECT * FROM decisions WHERE claim_id = $1 ORDER BY decided_at DESC', 
      [claimId]
    );

    // Fetch audit logs
    const auditLogsResult = await db.query(
      'SELECT * FROM audit_logs WHERE claim_id = $1 ORDER BY created_at DESC', 
      [claimId]
    );

    res.json({
      claim,
      inspections: inspectionsResult.rows,
      decisions: decisionsResult.rows,
      auditLogs: auditLogsResult.rows
    });
  } catch (err) {
    console.error('Get claim details error:', err);
    res.status(500).json({ message: 'Server error fetching claim details' });
  }
});

// 4. Edit basic claim details (Only if not decided yet)
router.put('/:id', authMiddleware, async (req, res) => {
  const claimId = req.params.id;
  const { customer_name, dealer_shop_name, contact_number, product_name, product_category, invoice_number, quantity_returned, reason_for_return, damage_description, image_url, return_date } = req.body;

  try {
    const claimRes = await db.query('SELECT status FROM claims WHERE id = $1', [claimId]);
    if (claimRes.rows.length === 0) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const status = claimRes.rows[0].status;
    if (['Credit Note Issued', 'Replacement Dispatched', 'Rejected', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Cannot edit claim that has already been finalized.' });
    }

    const queryStr = `
      UPDATE claims 
      SET customer_name = $1, dealer_shop_name = $2, contact_number = $3, 
          product_name = $4, product_category = $5, invoice_number = $6, 
          quantity_returned = $7, reason_for_return = $8, damage_description = $9, 
          image_url = $10, return_date = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `;

    await db.query(queryStr, [
      customer_name, dealer_shop_name, contact_number,
      product_name, product_category, invoice_number,
      parseInt(quantity_returned, 10), reason_for_return, damage_description,
      image_url, return_date, claimId
    ]);

    await logAuditAction(claimId, req.user, 'Claim Edited', 'Claim information updated.');

    res.json({ message: 'Claim updated successfully' });
  } catch (err) {
    console.error('Edit claim error:', err);
    res.status(500).json({ message: 'Server error updating claim' });
  }
});

// 5. Submit Inspection Report (Moves status to Awaiting Approval or Under Inspection)
router.post('/:id/inspect', authMiddleware, async (req, res) => {
  const claimId = req.params.id;
  const { inspection_result, inspector_remarks, damage_severity, approval_recommendation } = req.body;

  if (!inspection_result || !damage_severity || !approval_recommendation) {
    return res.status(400).json({ message: 'Missing required inspection fields' });
  }

  // Enforce staff/admin roles
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Only processing staff can submit inspections' });
  }

  try {
    const claimRes = await db.query('SELECT status FROM claims WHERE id = $1', [claimId]);
    if (claimRes.rows.length === 0) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const currentStatus = claimRes.rows[0].status;
    if (['Credit Note Issued', 'Replacement Dispatched', 'Rejected', 'Closed'].includes(currentStatus)) {
      return res.status(400).json({ message: 'Inspection cannot be submitted for a closed or resolved claim.' });
    }

    // Insert inspection report
    const insertInspQuery = `
      INSERT INTO inspections (claim_id, inspection_result, inspector_remarks, damage_severity, approval_recommendation, inspected_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.query(insertInspQuery, [
      claimId,
      inspection_result,
      inspector_remarks || '',
      damage_severity,
      approval_recommendation,
      req.user.name
    ]);

    // Update claim status to 'Awaiting Approval'
    await db.query('UPDATE claims SET status = \'Awaiting Approval\', updated_at = CURRENT_TIMESTAMP WHERE id = $1', [claimId]);

    // Log audit
    await logAuditAction(
      claimId, 
      req.user, 
      'Inspection Completed', 
      `Inspected: Result [${inspection_result}], Severity [${damage_severity}], Recommendation [${approval_recommendation}]. Status advanced to Awaiting Approval.`
    );

    res.json({ message: 'Inspection logged successfully, awaiting manager approval' });
  } catch (err) {
    console.error('Log inspection error:', err);
    res.status(500).json({ message: 'Server error logging inspection' });
  }
});

// 6. Finalize Manager Decision (Approve/Reject/Credit Note)
router.post('/:id/decide', authMiddleware, async (req, res) => {
  const claimId = req.params.id;
  const { decision_type, decision_remarks } = req.body;

  if (!decision_type) {
    return res.status(400).json({ message: 'Missing decision type' });
  }

  // Enforce manager role ONLY
  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied: Only managers can make final decisions' });
  }

  // Determine status from decision
  let nextStatus = '';
  let actionLabel = '';
  if (decision_type === 'approve_replacement') {
    nextStatus = 'Replacement Dispatched';
    actionLabel = 'Replacement Approved';
  } else if (decision_type === 'issue_credit_note') {
    nextStatus = 'Credit Note Issued';
    actionLabel = 'Credit Note Approved';
  } else if (decision_type === 'reject_claim') {
    nextStatus = 'Rejected';
    actionLabel = 'Claim Rejected';
  } else {
    return res.status(400).json({ message: 'Invalid decision type' });
  }

  try {
    const claimRes = await db.query('SELECT status FROM claims WHERE id = $1', [claimId]);
    if (claimRes.rows.length === 0) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const currentStatus = claimRes.rows[0].status;
    if (currentStatus !== 'Awaiting Approval') {
      return res.status(400).json({ message: 'Claim is not in Awaiting Approval status.' });
    }

    // Insert manager decision
    const insertDecQuery = `
      INSERT INTO decisions (claim_id, decision_type, decision_remarks, decided_by)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(insertDecQuery, [
      claimId,
      decision_type,
      decision_remarks || '',
      req.user.name
    ]);

    // Update claim status
    await db.query('UPDATE claims SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nextStatus, claimId]);

    // Log audit
    await logAuditAction(
      claimId, 
      req.user, 
      actionLabel, 
      `Manager decision logged: ${actionLabel}. Remarks: "${decision_remarks || 'None'}". Status changed to ${nextStatus}.`
    );

    res.json({ message: `Decision logged successfully. Claim status updated to ${nextStatus}` });
  } catch (err) {
    console.error('Log decision error:', err);
    res.status(500).json({ message: 'Server error processing decision' });
  }
});

// 7. General Status Update (e.g. Acknowledge, Close Claim, Start Inspecting)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const claimId = req.params.id;
  const { status } = req.body;

  const validStatuses = [
    'Submitted',
    'Under Inspection',
    'Awaiting Approval',
    'Credit Note Issued',
    'Replacement Dispatched',
    'Closed',
    'Rejected'
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status' });
  }

  try {
    const claimRes = await db.query('SELECT status FROM claims WHERE id = $1', [claimId]);
    if (claimRes.rows.length === 0) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const oldStatus = claimRes.rows[0].status;
    
    // Update claim status
    await db.query('UPDATE claims SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, claimId]);
    
    // Log audit
    await logAuditAction(
      claimId,
      req.user,
      'Status Changed',
      `Claim status manual transition: ${oldStatus} -> ${status}.`
    );

    res.json({ message: `Status updated successfully to ${status}` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error updating status' });
  }
});

module.exports = router;
