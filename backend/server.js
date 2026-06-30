const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const db = require('./db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// Routes
const authRoutes = require('./routes/auth');
const claimsRoutes = require('./routes/claims');
const reportsRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');

app.use('/api/auth', authRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: db.dbType, timestamp: new Date() });
});

// Diagnostic endpoint to inspect data tables directly in the browser
app.get('/api/view-tables', async (req, res) => {
  try {
    const claims = await db.query('SELECT * FROM claims');
    const users = await db.query('SELECT username, role, name FROM users');
    const audits = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
    res.json({
      claims: claims.rows,
      users: users.rows,
      audit_logs: audits.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Database seeding logic
async function seedData() {
  try {
    const userCountRes = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountRes.rows[0].count, 10);

    if (userCount > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    console.log('Database empty. Seeding Manikanta Enterprises default data...');

    // 1. Create Default Users
    const adminPass = await bcrypt.hash('admin123', 10);
    const staffPass = await bcrypt.hash('staff123', 10);
    const managerPass = await bcrypt.hash('manager123', 10);

    await db.query(
      'INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)',
      ['admin', adminPass, 'admin', 'Srinivas Rao (Admin)']
    );
    await db.query(
      'INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)',
      ['staff', staffPass, 'staff', 'Kalyan Kumar (Processing Staff)']
    );
    await db.query(
      'INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)',
      ['manager', managerPass, 'manager', 'Manikanta Reddy (Manager)']
    );

    console.log('Created admin, staff, and manager demo users.');

    // Helper to log audit in seeder
    const logSeederAudit = async (claimId, username, name, role, action, details, dateStr) => {
      const q = `
        INSERT INTO audit_logs (claim_id, user_id, user_name, user_role, action, details, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await db.query(q, [claimId, username, name, role, action, details, dateStr]);
    };

    // 2. Mock Claim 1 - Credit Note Issued
    await db.query(`
      INSERT INTO claims (id, customer_name, dealer_shop_name, contact_number, product_name, product_category, invoice_number, quantity_returned, reason_for_return, damage_description, image_url, return_date, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      'MR-2026-0001',
      'Sai Retail Agencies',
      'Sai General Store, Secunderabad',
      '9876543210',
      'Basmati Rice Premium 25kg',
      'Food & Grains',
      'INV-2026-0010',
      20,
      'Damaged in Transit',
      'Rainwater leaked into cargo truck during transit, dampening and spoiling the bottom 20 sacks.',
      '',
      '2026-06-02',
      'Credit Note Issued',
      '2026-06-02 10:00:00'
    ]);

    await db.query(`
      INSERT INTO inspections (claim_id, inspection_result, inspector_remarks, damage_severity, approval_recommendation, inspected_by, inspected_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'MR-2026-0001',
      'Fail (Stock Unsalvageable)',
      'Water damage confirmed. Mold has started forming, stock must be dumped.',
      'Critical',
      'issue_credit_note',
      'Kalyan Kumar (Processing Staff)',
      '2026-06-03 14:30:00'
    ]);

    await db.query(`
      INSERT INTO decisions (claim_id, decision_type, decision_remarks, decided_by, decided_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'MR-2026-0001',
      'issue_credit_note',
      'Approved. Credit note CN-2026-0042 processed and dispatched to customer billing account.',
      'Manikanta Reddy (Manager)',
      '2026-06-04 11:15:00'
    ]);

    await logSeederAudit('MR-2026-0001', 'staff', 'Kalyan Kumar (Processing Staff)', 'staff', 'Claim Submitted', 'New return request created for 20 unit(s) of Basmati Rice Premium 25kg.', '2026-06-02 10:00:00');
    await logSeederAudit('MR-2026-0001', 'staff', 'Kalyan Kumar (Processing Staff)', 'staff', 'Inspection Completed', 'Inspected: Result [Fail (Stock Unsalvageable)], Severity [Critical], Recommendation [Issue Credit Note]. Status advanced to Awaiting Approval.', '2026-06-03 14:30:00');
    await logSeederAudit('MR-2026-0001', 'manager', 'Manikanta Reddy (Manager)', 'manager', 'Credit Note Approved', 'Manager decision logged: Credit Note Approved. Remarks: "Approved. Credit note CN-2026-0042 processed." Status changed to Credit Note Issued.', '2026-06-04 11:15:00');

    // 3. Mock Claim 2 - Replacement Dispatched
    await db.query(`
      INSERT INTO claims (id, customer_name, dealer_shop_name, contact_number, product_name, product_category, invoice_number, quantity_returned, reason_for_return, damage_description, image_url, return_date, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      'MR-2026-0002',
      'Pooja Distributors',
      'Pooja Supermarket, Kukatpally',
      '9123456789',
      'Sunrich Sunflower Oil 5L',
      'Edible Oils',
      'INV-2026-0152',
      12,
      'Leaky Packaging',
      'Outer box was soggy. Found 12 bottles had defective/cracked caps, causing oil to spill out.',
      '',
      '2026-06-05',
      'Replacement Dispatched',
      '2026-06-05 11:20:00'
    ]);

    await db.query(`
      INSERT INTO inspections (claim_id, inspection_result, inspector_remarks, damage_severity, approval_recommendation, inspected_by, inspected_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'MR-2026-0002',
      'Fail (Defective Cap Seals)',
      'Verified 12 cracked caps. Remaining stock in carton is intact. Safe to replace the 12 leaky bottles.',
      'High',
      'approve_replacement',
      'Kalyan Kumar (Processing Staff)',
      '2026-06-06 09:10:00'
    ]);

    await db.query(`
      INSERT INTO decisions (claim_id, decision_type, decision_remarks, decided_by, decided_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'MR-2026-0002',
      'approve_replacement',
      'Approved replacement order. Standard replacement order RO-2026-0089 scheduled for warehouse loading.',
      'Manikanta Reddy (Manager)',
      '2026-06-07 15:45:00'
    ]);

    await logSeederAudit('MR-2026-0002', 'staff', 'Kalyan Kumar (Processing Staff)', 'staff', 'Claim Submitted', 'New return request created for 12 unit(s) of Sunrich Sunflower Oil 5L.', '2026-06-05 11:20:00');
    await logSeederAudit('MR-2026-0002', 'staff', 'Kalyan Kumar (Processing Staff)', 'staff', 'Inspection Completed', 'Inspected: Result [Fail (Defective Cap Seals)], Severity [High], Recommendation [Approve Replacement]. Status advanced to Awaiting Approval.', '2026-06-06 09:10:00');
    await logSeederAudit('MR-2026-0002', 'manager', 'Manikanta Reddy (Manager)', 'manager', 'Replacement Approved', 'Manager decision logged: Replacement Approved. Remarks: "Approved replacement order." Status changed to Replacement Dispatched.', '2026-06-07 15:45:00');

    // 4. Mock Claim 3 - Awaiting Approval
    await db.query(`
      INSERT INTO claims (id, customer_name, dealer_shop_name, contact_number, product_name, product_category, invoice_number, quantity_returned, reason_for_return, damage_description, image_url, return_date, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      'MR-2026-0003',
      'Venkateshwara Kirana Stores',
      'Venkateshwara Stores, Hyderabad',
      '9000123456',
      'Toor Dal Premium 10kg',
      'Food & Grains',
      'INV-2026-0099',
      5,
      'Quality Issue (Insect Infestation)',
      'Retailer reported finding weevils inside sealed packets immediately upon unpacking.',
      '',
      '2026-06-12',
      'Awaiting Approval',
      '2026-06-12 14:00:00'
    ]);

    await db.query(`
      INSERT INTO inspections (claim_id, inspection_result, inspector_remarks, damage_severity, approval_recommendation, inspected_by, inspected_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'MR-2026-0003',
      'Fail (Quality Check Failed)',
      'Verified presence of insects in 5 packets. Batch verification required to check other stocks in warehouse.',
      'High',
      'approve_replacement',
      'Kalyan Kumar (Processing Staff)',
      '2026-06-14 10:00:00'
    ]);

    await logSeederAudit('MR-2026-0003', 'staff', 'Kalyan Kumar (Processing Staff)', 'staff', 'Claim Submitted', 'New return request created for 5 unit(s) of Toor Dal Premium 10kg.', '2026-06-12 14:00:00');
    await logSeederAudit('MR-2026-0003', 'staff', 'Kalyan Kumar (Processing Staff)', 'staff', 'Inspection Completed', 'Inspected: Result [Fail (Quality Check Failed)], Severity [High], Recommendation [Approve Replacement]. Status advanced to Awaiting Approval.', '2026-06-14 10:00:00');

    // 5. Mock Claim 4 - Submitted
    await db.query(`
      INSERT INTO claims (id, customer_name, dealer_shop_name, contact_number, product_name, product_category, invoice_number, quantity_returned, reason_for_return, damage_description, image_url, return_date, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      'MR-2026-0004',
      'Balaji Traders',
      'Balaji Kirana & General Store, Gachibowli',
      '9888877777',
      'Liquid Detergent 5L',
      'Household Cleaning',
      'INV-2026-0241',
      3,
      'Wrong Item Delivered',
      'Ordered 5L pack, received 2L bottle. Need correct stock replacement.',
      '',
      '2026-06-15',
      'Submitted',
      '2026-06-15 16:30:00'
    ]);

    await logSeederAudit('MR-2026-0004', 'admin', 'Srinivas Rao (Admin)', 'admin', 'Claim Submitted', 'New return request created for 3 unit(s) of Liquid Detergent 5L (Wrong Item).', '2026-06-15 16:30:00');

    // 6. Mock Claim 5 - Rejected
    await db.query(`
      INSERT INTO claims (id, customer_name, dealer_shop_name, contact_number, product_name, product_category, invoice_number, quantity_returned, reason_for_return, damage_description, image_url, return_date, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      'MR-2026-0005',
      'Sri Rama Agencies',
      'Sri Rama Traders, Hyderabad',
      '9777766666',
      'Basmati Rice Premium 25kg',
      'Food & Grains',
      'INV-2026-0056',
      8,
      'Expired Stock',
      'Returned 8 bags of basmati rice stating they have exceeded expiry date.',
      '',
      '2026-06-08',
      'Rejected',
      '2026-06-08 09:30:00'
    ]);

    await db.query(`
      INSERT INTO inspections (claim_id, inspection_result, inspector_remarks, damage_severity, approval_recommendation, inspected_by, inspected_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'MR-2026-0005',
      'Pass (Stock expired due to retailer holding stock too long)',
      'Product packaging is intact. Expiry date exceeded by 3 months. No supply-side or warehouse damage found.',
      'Low',
      'reject_claim',
      'Kalyan Kumar (Processing Staff)',
      '2026-06-09 11:20:00'
    ]);

    await db.query(`
      INSERT INTO decisions (claim_id, decision_type, decision_remarks, decided_by, decided_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'MR-2026-0005',
      'reject_claim',
      'Claim Rejected. Our dealer contract states that we do not take back products that expire due to inventory aging in the retail shop.',
      'Manikanta Reddy (Manager)',
      '2026-06-10 10:00:00'
    ]);

    await logSeederAudit('MR-2026-0005', 'staff', 'Kalyan Kumar (Processing Staff)', 'staff', 'Claim Submitted', 'New return request created for 8 unit(s) of Basmati Rice Premium 25kg (Expired Stock).', '2026-06-08 09:30:00');
    await logSeederAudit('MR-2026-0005', 'staff', 'Kalyan Kumar (Processing Staff)', 'staff', 'Inspection Completed', 'Inspected: Result [Pass (Retailer inventory aging)], Severity [Low], Recommendation [Reject Claim]. Status advanced to Awaiting Approval.', '2026-06-09 11:20:00');
    await logSeederAudit('MR-2026-0005', 'manager', 'Manikanta Reddy (Manager)', 'manager', 'Claim Rejected', 'Manager decision logged: Claim Rejected. Remarks: "Claim Rejected. Expiry occurred due to retailer inventory aging." Status changed to Rejected.', '2026-06-10 10:00:00');

    console.log('Successfully completed seeding Manikanta Enterprises mock data.');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

// Start Server
function startServer() {
  app.listen(PORT, async () => {
    console.log(`========================================================`);
    console.log(`  MANIKANTA ENTERPRISES BACKEND RUNNING ON PORT ${PORT}`);
    console.log(`========================================================`);
    
    try {
      // 1. Init Database
      await db.init();
      
      // 2. Seed default data if database is empty
      await seedData();
    } catch (err) {
      console.error('Database initialization/seeding failed:', err);
    }
  });
}

startServer();
