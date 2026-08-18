/**
 * Indian GST State Codes & Tax Calculation Utilities
 * Supplier / Amazoprint Origin: Tamil Nadu (State Code: 33, GSTIN: 33BNLPK5597H1ZJ)
 */

export interface GstState {
  code: string;
  name: string;
  aliases: string[];
}

export const INDIAN_GST_STATES: GstState[] = [
  { code: '01', name: 'Jammu and Kashmir', aliases: ['jammu', 'kashmir', 'j&k', 'jk'] },
  { code: '02', name: 'Himachal Pradesh', aliases: ['himachal', 'hp'] },
  { code: '03', name: 'Punjab', aliases: ['pb'] },
  { code: '04', name: 'Chandigarh', aliases: ['ch'] },
  { code: '05', name: 'Uttarakhand', aliases: ['uttaranchal', 'uk'] },
  { code: '06', name: 'Haryana', aliases: ['hr'] },
  { code: '07', name: 'Delhi', aliases: ['new delhi', 'dl', 'ncr'] },
  { code: '08', name: 'Rajasthan', aliases: ['rj'] },
  { code: '09', name: 'Uttar Pradesh', aliases: ['up'] },
  { code: '10', name: 'Bihar', aliases: ['br'] },
  { code: '11', name: 'Sikkim', aliases: ['sk'] },
  { code: '12', name: 'Arunachal Pradesh', aliases: ['arunachal', 'ar'] },
  { code: '13', name: 'Nagaland', aliases: ['nl'] },
  { code: '14', name: 'Manipur', aliases: ['mn'] },
  { code: '15', name: 'Mizoram', aliases: ['mz'] },
  { code: '16', name: 'Tripura', aliases: ['tr'] },
  { code: '17', name: 'Meghalaya', aliases: ['ml'] },
  { code: '18', name: 'Assam', aliases: ['as'] },
  { code: '19', name: 'West Bengal', aliases: ['wb', 'bengal'] },
  { code: '20', name: 'Jharkhand', aliases: ['jh'] },
  { code: '21', name: 'Odisha', aliases: ['orissa', 'or', 'od'] },
  { code: '22', name: 'Chhattisgarh', aliases: ['cg', 'chattisgarh'] },
  { code: '23', name: 'Madhya Pradesh', aliases: ['mp'] },
  { code: '24', name: 'Gujarat', aliases: ['gj'] },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu', aliases: ['daman', 'diu', 'dadra', 'dn'] },
  { code: '27', name: 'Maharashtra', aliases: ['mh', 'bombay'] },
  { code: '29', name: 'Karnataka', aliases: ['ka', 'bangalore', 'bengaluru'] },
  { code: '30', name: 'Goa', aliases: ['ga'] },
  { code: '31', name: 'Lakshadweep', aliases: ['ld'] },
  { code: '32', name: 'Kerala', aliases: ['kl'] },
  { code: '33', name: 'Tamil Nadu', aliases: ['tamilnadu', 'tamil nadu', 'tn', 'madras', 'chennai'] },
  { code: '34', name: 'Puducherry', aliases: ['pondicherry', 'py'] },
  { code: '35', name: 'Andaman and Nicobar Islands', aliases: ['andaman', 'nicobar', 'an'] },
  { code: '36', name: 'Telangana', aliases: ['ts', 'tg', 'hyderabad'] },
  { code: '37', name: 'Andhra Pradesh', aliases: ['ap', 'andhra'] },
  { code: '38', name: 'Ladakh', aliases: ['la'] },
  { code: '97', name: 'Other Territory', aliases: ['ot'] },
];

export const SUPPLIER_GSTIN = '33BNLPK5597H1ZJ';
export const SUPPLIER_STATE_CODE = '33';
export const SUPPLIER_STATE_NAME = 'Tamil Nadu';

/**
 * Resolve state info from state string or GSTIN prefix
 */
export function getGstStateInfo(stateInput?: string | null, gstin?: string | null): {
  stateName: string;
  stateCode: string;
  isIntrastate: boolean;
} {
  // If GSTIN provided (first 2 digits are state code)
  if (gstin && gstin.trim().length >= 2) {
    const code = gstin.trim().substring(0, 2);
    const matched = INDIAN_GST_STATES.find(s => s.code === code);
    if (matched) {
      return {
        stateName: matched.name,
        stateCode: matched.code,
        isIntrastate: matched.code === SUPPLIER_STATE_CODE,
      };
    }
  }

  // If state name provided
  if (stateInput && stateInput.trim()) {
    const cleaned = stateInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check direct code or name
    const matched = INDIAN_GST_STATES.find(s => {
      const sClean = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sClean === cleaned || s.code === stateInput.trim()) return true;
      return s.aliases.some(a => a.toLowerCase().replace(/[^a-z0-9]/g, '') === cleaned);
    });

    if (matched) {
      return {
        stateName: matched.name,
        stateCode: matched.code,
        isIntrastate: matched.code === SUPPLIER_STATE_CODE,
      };
    }
  }

  // Default fallback to Tamil Nadu if not specified
  return {
    stateName: SUPPLIER_STATE_NAME,
    stateCode: SUPPLIER_STATE_CODE,
    isIntrastate: true,
  };
}

export interface GstCalculationResult {
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  gstRate: number;
  isIntrastate: boolean;
  stateName: string;
  stateCode: string;
  placeOfSupply: string;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
}

/**
 * Calculate Split GST (CGST+SGST vs IGST) based on customer state
 */
export function calculateGstBreakdown({
  totalAmount,
  stateInput,
  gstin,
  gstRate = 0.18,
}: {
  totalAmount: number;
  stateInput?: string | null;
  gstin?: string | null;
  gstRate?: number;
}): GstCalculationResult {
  const { stateName, stateCode, isIntrastate } = getGstStateInfo(stateInput, gstin);
  
  const taxableAmount = totalAmount / (1 + gstRate);
  const gstAmount = totalAmount - taxableAmount;

  if (isIntrastate) {
    const halfRate = gstRate / 2;
    const halfAmount = gstAmount / 2;
    return {
      taxableAmount,
      gstAmount,
      totalAmount,
      gstRate,
      isIntrastate: true,
      stateName,
      stateCode,
      placeOfSupply: `${stateCode} - ${stateName}`,
      cgstRate: halfRate,
      cgstAmount: halfAmount,
      sgstRate: halfRate,
      sgstAmount: halfAmount,
      igstRate: 0,
      igstAmount: 0,
    };
  } else {
    return {
      taxableAmount,
      gstAmount,
      totalAmount,
      gstRate,
      isIntrastate: false,
      stateName,
      stateCode,
      placeOfSupply: `${stateCode} - ${stateName}`,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRate,
      igstAmount: gstAmount,
    };
  }
}
