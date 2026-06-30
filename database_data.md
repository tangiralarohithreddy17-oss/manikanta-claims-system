# PostgreSQL Database Data Snapshot (Live Update)

*Last Refreshed: 2026-06-30 11:19:20*

---

## ðŸ“‹ Claims Registry Table (claims)

| Return ID | Dealer Shop | Contact No. | Product Name | Qty | Invoice No. | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| MR-2026-0001 | Sai General Store, Secunderabad | 9876543210 | Basmati Rice Premium 25kg | 20 | INV-2026-0010 | **Credit Note Issued** |
| MR-2026-0002 | Pooja Supermarket, Kukatpally | 9123456789 | Sunrich Sunflower Oil 5L | 12 | INV-2026-0152 | **Replacement Dispatched** |
| MR-2026-0003 | Venkateshwara Stores, Hyderabad | 9000123456 | Toor Dal Premium 10kg | 5 | INV-2026-0099 | **Awaiting Approval** |
| MR-2026-0004 | Balaji Kirana & General Store, Gachibowli | 9888877777 | Liquid Detergent 5L | 3 | INV-2026-0241 | **Submitted** |
| MR-2026-0007 | .... | man vs,javm | ... | 5 |  | **Submitted** |
| MR-2026-0006 | ,,,,, | 111 | mm | 4 |  | **Closed** |
| MR-2026-0005 | Sri Rama Traders, Hyderabad | 9777766666 | Basmati Rice Premium 25kg | 8 | INV-2026-0056 | **Closed** |
| MR-2026-0008 | .... | 9999999999 | ,,,, | 76 |  | **Submitted** |

---

## ðŸ‘¥ Users Table (users)

| Username | Role | Full Name |
| :--- | :--- | :--- |
| admin | admin | Srinivas Rao (Admin) |
| staff | staff | Kalyan Kumar (Processing Staff) |
| manager | manager | Manikanta Reddy (Manager) |

---

## ðŸ“ Recent Audit Logs Table (udit_logs)

| Action ID | Return ID | Performed By | Action Taken | Log Details |
| :--- | :--- | :--- | :--- | :--- |
| 17 | MR-2026-0008 | Manikanta Reddy (Manager) | Claim Submitted | New return request created for 76 unit(s) of ,,,, by ..... |
| 16 | MR-2026-0005 | Manikanta Reddy (Manager) | Status Changed | Claim status manual transition: Rejected -> Closed. |
| 15 | MR-2026-0006 | Manikanta Reddy (Manager) | Status Changed | Claim status manual transition: Replacement Dispatched -> Closed. |
| 14 | MR-2026-0006 | Manikanta Reddy (Manager) | Replacement Approved | Manager decision logged: Replacement Approved. Remarks: ",,,,,". Status changed to Replacement Dispatched. |
| 13 | MR-2026-0007 | Kalyan Kumar (Processing Staff) | Claim Submitted | New return request created for 5 unit(s) of ... by .... |
| 12 | MR-2026-0006 | Kalyan Kumar (Processing Staff) | Inspection Completed | Inspected: Result [manioc], Severity [Medium], Recommendation [approve_replacement]. Status advanced to Awaiting Approval. |
| 11 | MR-2026-0006 | Kalyan Kumar (Processing Staff) | Status Changed | Claim status manual transition: Submitted -> Under Inspection. |
| 10 | MR-2026-0006 | Kalyan Kumar (Processing Staff) | Claim Submitted | New return request created for 4 unit(s) of mm by ,,,. |
| 9 | MR-2026-0004 | Srinivas Rao (Admin) | Claim Submitted | New return request created for 3 unit(s) of Liquid Detergent 5L (Wrong Item). |
| 8 | MR-2026-0003 | Kalyan Kumar (Processing Staff) | Inspection Completed | Inspected: Result [Fail (Quality Check Failed)], Severity [High], Recommendation [Approve Replacement]. Status advanced to Awaiting Approval. |
| 7 | MR-2026-0003 | Kalyan Kumar (Processing Staff) | Claim Submitted | New return request created for 5 unit(s) of Toor Dal Premium 10kg. |
| 6 | MR-2026-0002 | Manikanta Reddy (Manager) | Replacement Approved | Manager decision logged: Replacement Approved. Remarks: "Approved replacement order." Status changed to Replacement Dispatched. |
| 5 | MR-2026-0002 | Kalyan Kumar (Processing Staff) | Inspection Completed | Inspected: Result [Fail (Defective Cap Seals)], Severity [High], Recommendation [Approve Replacement]. Status advanced to Awaiting Approval. |
| 4 | MR-2026-0002 | Kalyan Kumar (Processing Staff) | Claim Submitted | New return request created for 12 unit(s) of Sunrich Sunflower Oil 5L. |
| 3 | MR-2026-0001 | Manikanta Reddy (Manager) | Credit Note Approved | Manager decision logged: Credit Note Approved. Remarks: "Approved. Credit note CN-2026-0042 processed." Status changed to Credit Note Issued. |
| 2 | MR-2026-0001 | Kalyan Kumar (Processing Staff) | Inspection Completed | Inspected: Result [Fail (Stock Unsalvageable)], Severity [Critical], Recommendation [Issue Credit Note]. Status advanced to Awaiting Approval. |
| 1 | MR-2026-0001 | Kalyan Kumar (Processing Staff) | Claim Submitted | New return request created for 20 unit(s) of Basmati Rice Premium 25kg. |
