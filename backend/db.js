const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgres'
let pgPool = null;
let sqliteDb = null;

// Initialize connection
if (DB_TYPE === 'postgres') {
  console.log('Using PostgreSQL database...');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('Using SQLite database...');
  const dbPath = path.join(__dirname, 'database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database', err);
    } else {
      console.log('SQLite database file opened at:', dbPath);
    }
  });
}

// Unified query wrapper
function query(text, params = []) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgres') {
      pgPool.query(text, params, (err, res) => {
        if (err) {
          console.error('PostgreSQL query error:', err);
          return reject(err);
        }
        resolve(res);
      });
    } else {
      // Translate PostgreSQL style $1, $2 to SQLite ? placeholders
      let sqliteText = text.replace(/\$\d+/g, '?');
      
      // sqlite3 doesn't have a single query function for all operations.
      // We check if it is a SELECT or modifying query.
      const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelect) {
        sqliteDb.all(sqliteText, params, (err, rows) => {
          if (err) {
            console.error('SQLite query error (all):', err);
            return reject(err);
          }
          resolve({ rows });
        });
      } else {
        sqliteDb.run(sqliteText, params, function (err) {
          if (err) {
            console.error('SQLite query error (run):', err);
            return reject(err);
          }
          // Mock the result format to match pg's result (rows and insertId/rowCount if needed)
          resolve({ 
            rows: [], 
            rowCount: this.changes,
            lastID: this.lastID 
          });
        });
      }
    }
  });
}

// Initialize tables
async function init() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      username VARCHAR(50) PRIMARY KEY,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const claimsTable = `
    CREATE TABLE IF NOT EXISTS claims (
      id VARCHAR(20) PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      dealer_shop_name VARCHAR(100) NOT NULL,
      contact_number VARCHAR(15) NOT NULL,
      product_name VARCHAR(100) NOT NULL,
      product_category VARCHAR(50) NOT NULL,
      invoice_number VARCHAR(50) NOT NULL,
      quantity_returned INTEGER NOT NULL,
      reason_for_return TEXT NOT NULL,
      damage_description TEXT NOT NULL,
      image_url TEXT,
      return_date DATE NOT NULL,
      status VARCHAR(30) DEFAULT 'Submitted',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const inspectionsTable = `
    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id VARCHAR(20) NOT NULL,
      inspection_result VARCHAR(50) NOT NULL,
      inspector_remarks TEXT NOT NULL,
      damage_severity VARCHAR(20) NOT NULL,
      approval_recommendation VARCHAR(50) NOT NULL,
      inspected_by VARCHAR(50) NOT NULL,
      inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const decisionsTable = `
    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id VARCHAR(20) NOT NULL,
      decision_type VARCHAR(50) NOT NULL,
      decision_remarks TEXT NOT NULL,
      decided_by VARCHAR(50) NOT NULL,
      decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const auditLogsTable = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id VARCHAR(20) NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      user_role VARCHAR(20) NOT NULL,
      action VARCHAR(100) NOT NULL,
      details TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const executeTableCreation = async (queryText) => {
    let sql = queryText;
    if (DB_TYPE === 'postgres') {
      sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
    }
    await query(sql);
  };

  try {
    await executeTableCreation(usersTable);
    await executeTableCreation(claimsTable);
    await executeTableCreation(inspectionsTable);
    await executeTableCreation(decisionsTable);
    await executeTableCreation(auditLogsTable);
    console.log('All database tables initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
  }
}

module.exports = {
  query,
  init,
  dbType: DB_TYPE
};
