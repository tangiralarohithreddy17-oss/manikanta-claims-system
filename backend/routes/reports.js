const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Get reports data
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const claimsRes = await db.query('SELECT * FROM claims');
    const claims = claimsRes.rows;

    // 1. KPI Stats
    const totalRequests = claims.length;
    const pendingInspections = claims.filter(c => c.status === 'Submitted' || c.status === 'Under Inspection').length;
    const approvedClaims = claims.filter(c => ['Credit Note Issued', 'Replacement Dispatched', 'Closed'].includes(c.status)).length;
    const rejectedClaims = claims.filter(c => c.status === 'Rejected').length;
    
    const creditNotesIssued = claims.filter(c => c.status === 'Credit Note Issued').length;
    const replacementsProcessed = claims.filter(c => c.status === 'Replacement Dispatched').length;

    // 2. Return Trends (Group by Month)
    const monthlyTrendsMap = {};
    claims.forEach(c => {
      // return_date is usually YYYY-MM-DD
      const date = new Date(c.return_date);
      if (isNaN(date.getTime())) return;
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g. "Jun 2026"
      const sortKey = date.getFullYear() * 100 + date.getMonth(); // for chronological sorting
      
      if (!monthlyTrendsMap[monthLabel]) {
        monthlyTrendsMap[monthLabel] = { month: monthLabel, count: 0, units: 0, sortKey };
      }
      monthlyTrendsMap[monthLabel].count += 1;
      monthlyTrendsMap[monthLabel].units += c.quantity_returned;
    });
    const returnTrends = Object.values(monthlyTrendsMap).sort((a, b) => a.sortKey - b.sortKey);

    // 3. Most Returned Products
    const productMap = {};
    claims.forEach(c => {
      const pName = c.product_name || 'Unknown';
      if (!productMap[pName]) {
        productMap[pName] = { name: pName, value: 0, units: 0 };
      }
      productMap[pName].value += 1;
      productMap[pName].units += c.quantity_returned;
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5); // top 5

    // 4. Damage Category Analysis
    const categoryMap = {};
    claims.forEach(c => {
      const cat = c.product_category || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, value: 0 };
      }
      categoryMap[cat].value += 1;
    });
    const categories = Object.values(categoryMap);

    // 5. Severity distribution (requires inspections query or map severity to claims)
    // We will do a fast look up in inspections table
    const severityMap = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    const inspectionsRes = await db.query('SELECT damage_severity FROM inspections');
    inspectionsRes.rows.forEach(i => {
      if (severityMap[i.damage_severity] !== undefined) {
        severityMap[i.damage_severity] += 1;
      }
    });
    const severityData = Object.keys(severityMap).map(key => ({
      name: key,
      value: severityMap[key]
    }));

    // 6. Approval vs Rejection stats
    const approvalStats = [
      { name: 'Approved', value: approvedClaims },
      { name: 'Rejected', value: rejectedClaims },
      { name: 'Pending Decision', value: totalRequests - approvedClaims - rejectedClaims }
    ];

    // 7. Recent activities (fetch latest 5 audit logs)
    const recentLogsRes = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5');
    const recentActivities = recentLogsRes.rows;

    res.json({
      kpis: {
        totalRequests,
        pendingInspections,
        approvedClaims,
        rejectedClaims,
        creditNotesIssued,
        replacementsProcessed
      },
      returnTrends,
      topProducts,
      categories,
      severityData,
      approvalStats,
      recentActivities
    });
  } catch (err) {
    console.error('Error compiling dashboard stats:', err);
    res.status(500).json({ message: 'Server error aggregating reports' });
  }
});

// Detailed Reports Summary Table data
router.get('/summary-report', authMiddleware, async (req, res) => {
  try {
    const claimsRes = await db.query('SELECT * FROM claims ORDER BY return_date DESC');
    const claims = claimsRes.rows;

    // Compile an aggregated list by month
    const reportsMap = {};
    claims.forEach(c => {
      const date = new Date(c.return_date);
      if (isNaN(date.getTime())) return;
      const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' }); // "June 2026"
      const sortKey = date.getFullYear() * 100 + date.getMonth();

      if (!reportsMap[monthStr]) {
        reportsMap[monthStr] = {
          month: monthStr,
          totalClaims: 0,
          totalQty: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          sortKey
        };
      }
      reportsMap[monthStr].totalClaims += 1;
      reportsMap[monthStr].totalQty += c.quantity_returned;

      if (['Credit Note Issued', 'Replacement Dispatched', 'Closed'].includes(c.status)) {
        reportsMap[monthStr].approved += 1;
      } else if (c.status === 'Rejected') {
        reportsMap[monthStr].rejected += 1;
      } else {
        reportsMap[monthStr].pending += 1;
      }
    });

    const report = Object.values(reportsMap).sort((a, b) => b.sortKey - a.sortKey); // newest month first
    res.json(report);
  } catch (err) {
    console.error('Error compiling summary report:', err);
    res.status(500).json({ message: 'Server error generating report data' });
  }
});

module.exports = router;
