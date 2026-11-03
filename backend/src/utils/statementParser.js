const fs = require('fs');
const Papa = require('papaparse');
const xlsx = require('xlsx');

const parseDate = (val) => {
  if (!val) return new Date();
  if (val instanceof Date) return val;

  // If number (Excel date serial)
  if (typeof val === 'number') {
    const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(dateObj.getTime()) ? new Date() : dateObj;
  }

  const str = String(val).trim();
  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const parseAmount = (val) => {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  // Strip currency symbols and commas
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
};

const parseStatementFile = async (filePath, mimeType) => {
  let rawRows = [];

  if (filePath.endsWith('.csv') || mimeType === 'text/csv') {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: 'greedy',
    });
    rawRows = parsed.data;
  } else {
    // Excel file (.xlsx / .xls)
    const workbook = xlsx.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
  }

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Statement file contains no readable rows.');
  }

  // Detect column mappings dynamically
  const sample = rawRows[0];
  const keys = Object.keys(sample);

  const findKey = (patterns) => {
    return keys.find((k) => {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return patterns.some((p) => lower.includes(p));
    });
  };

  const dateKey = findKey(['date', 'txndate', 'valuedate', 'postingdate']);
  const descKey = findKey(['description', 'narration', 'particulars', 'remarks', 'reason', 'details', 'name']);
  const refKey = findKey(['ref', 'reference', 'utr', 'cheque', 'chqno', 'txnid', 'transactionid']);
  const creditKey = findKey(['credit', 'deposit', 'cr']);
  const debitKey = findKey(['debit', 'withdrawal', 'dr']);
  const amountKey = findKey(['amount', 'txnamount', 'balance', 'value']);
  const typeKey = findKey(['type', 'crdr', 'drcr', 'direction']);

  const parsedTransactions = [];

  for (const row of rawRows) {
    const rawDate = dateKey ? row[dateKey] : null;
    const rawDesc = descKey ? row[descKey] : 'Bank Transaction';
    const rawRef = refKey ? String(row[refKey]) : `IMP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    let type = 'debit';
    let amount = 0;

    // Condition 1: Separate Debit and Credit columns
    if (debitKey && creditKey) {
      const debitVal = parseAmount(row[debitKey]);
      const creditVal = parseAmount(row[creditKey]);
      if (creditVal > 0) {
        type = 'credit';
        amount = creditVal;
      } else if (debitVal > 0) {
        type = 'debit';
        amount = debitVal;
      }
    }

    // Condition 2: Dedicated type column
    if (amount === 0 && amountKey) {
      amount = parseAmount(row[amountKey]);
      if (typeKey && row[typeKey]) {
        const tVal = String(row[typeKey]).toLowerCase();
        if (tVal.includes('cr') || tVal.includes('credit') || tVal.includes('deposit') || tVal.includes('income')) {
          type = 'credit';
        } else {
          type = 'debit';
        }
      } else if (typeof row[amountKey] === 'string' && (row[amountKey].includes('-') || row[amountKey].includes('Dr'))) {
        type = 'debit';
      } else if (typeof row[amountKey] === 'number' && row[amountKey] < 0) {
        type = 'debit';
      }
    }

    if (amount > 0) {
      // Auto-categorize based on description keywords
      let category = type === 'credit' ? 'Income' : 'General Expense';
      const descLower = String(rawDesc).toLowerCase();
      if (descLower.includes('salary') || descLower.includes('payroll')) category = 'Salary';
      else if (descLower.includes('emi') || descLower.includes('loan')) category = 'Loan EMI';
      else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('prime') || descLower.includes('subs')) category = 'Subscription';
      else if (descLower.includes('swiggy') || descLower.includes('zomato') || descLower.includes('restaurant') || descLower.includes('food')) category = 'Food & Dining';
      else if (descLower.includes('amazon') || descLower.includes('flipkart') || descLower.includes('myntra')) category = 'Shopping';
      else if (descLower.includes('electric') || descLower.includes('water') || descLower.includes('bill') || descLower.includes('broadband')) category = 'Utilities';
      else if (descLower.includes('fuel') || descLower.includes('petrol') || descLower.includes('uber') || descLower.includes('ola')) category = 'Travel';
      else if (descLower.includes('interest') || descLower.includes('dividend') || descLower.includes('stock')) category = 'Investment';

      parsedTransactions.push({
        date: parseDate(rawDate),
        type,
        amount,
        reason: String(rawDesc).trim(),
        referenceNumber: rawRef.trim(),
        category,
        source: 'bank_import',
      });
    }
  }

  return parsedTransactions;
};

module.exports = { parseStatementFile };

