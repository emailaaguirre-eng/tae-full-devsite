import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic (uses searchParams)
export const dynamic = 'force-dynamic';

// Gelato API configuration
const GELATO_PRODUCT_API_URL = process.env.GELATO_PRODUCT_API_URL || 'https://product.gelatoapis.com/v3';
const GELATO_API_KEY = process.env.GELATO_API_KEY || '';

/**
 * Maps Gelato product types to their base product UIDs
 */
const PRODUCT_TYPE_MAP: Record<string, string> = {
  print: 'prints_pt_cl',
  card: 'cards_cl_dtc_prt_pt',
  postcard: 'postcards_cl_dtc_prt_pt',
  invitation: 'invitations_cl_dtc_prt_pt',
  announcement: 'announcements_cl_dtc_prt_pt',
};

/**
 * Attempts to fetch product details by productUid
 */
async function fetchProductByUid(productUid: string): Promise<any> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY not configured');
  }

  try {
    const response = await fetch(`${GELATO_PRODUCT_API_URL}/products/${productUid}`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Attempts to fetch variant details by variantUid
 */
async function fetchVariantByUid(variantUid: string): Promise<any> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY not configured');
  }

  try {
    // Try variant endpoint (may not exist)
    const response = await fetch(`${GELATO_PRODUCT_API_URL}/variants/${variantUid}`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Attempts to fetch product variants (may contain print spec info)
 */
async function fetchProductVariants(productUid: string): Promise<any> {
  if (!GELATO_API_KEY) {
    throw new Error('GELATO_API_KEY not configured');
  }

  try {
    const response = await fetch(`${GELATO_PRODUCT_API_URL}/products/${productUid}/variants`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Extracts print spec candidate fields from Gelato API response
 */
function extractSpecCandidate(rawData: any, source: string): any {
  const candidate: any = {
    source,
    extractedFields: {},
    rawFields: {},
  };

  // Common dimension fields
  const dimensionFields = [
    'dimensions', 'size', 'width', 'height', 'format',
    'printArea', 'print_area', 'printableArea', 'printable_area',
    'pageSize', 'page_size', 'formatSize', 'format_size',
  ];

  // Common bleed/trim/safe fields
  const bleedFields = ['bleed', 'bleedRequirements', 'bleed_requirements', 'bleedSize', 'bleed_size'];
  const trimFields = ['trim', 'trimSize', 'trim_size', 'trimmedSize', 'trimmed_size'];
  const safeFields = ['safeZone', 'safe_zone', 'safeArea', 'safe_area', 'contentArea', 'content_area'];
  const foldFields = ['fold', 'foldLines', 'fold_lines', 'foldLine', 'fold_line', 'folding', 'folds'];

  // Extract dimensions
  for (const field of dimensionFields) {
    if (rawData[field] !== undefined) {
      candidate.extractedFields[field] = rawData[field];
      candidate.rawFields[field] = rawData[field];
    }
  }

  // Extract bleed
  for (const field of bleedFields) {
    if (rawData[field] !== undefined) {
      candidate.extractedFields.bleed = rawData[field];
      candidate.rawFields[field] = rawData[field];
    }
  }

  // Extract trim
  for (const field of trimFields) {
    if (rawData[field] !== undefined) {
      candidate.extractedFields.trim = rawData[field];
      candidate.rawFields[field] = rawData[field];
    }
  }

  // Extract safe zone
  for (const field of safeFields) {
    if (rawData[field] !== undefined) {
      candidate.extractedFields.safeZone = rawData[field];
      candidate.rawFields[field] = rawData[field];
    }
  }

  // Extract fold
  for (const field of foldFields) {
    if (rawData[field] !== undefined) {
      candidate.extractedFields.fold = rawData[field];
      candidate.rawFields[field] = rawData[field];
    }
  }

  // Check for nested structures
  if (rawData.specifications) {
    candidate.rawFields.specifications = rawData.specifications;
    // Recursively check specifications
    const nested = extractSpecCandidate(rawData.specifications, `${source}.specifications`);
    if (Object.keys(nested.extractedFields).length > 0) {
      Object.assign(candidate.extractedFields, nested.extractedFields);
    }
  }

  if (rawData.printSpecs || rawData.print_specs) {
    candidate.rawFields.printSpecs = rawData.printSpecs || rawData.print_specs;
    const nested = extractSpecCandidate(rawData.printSpecs || rawData.print_specs, `${source}.printSpecs`);
    if (Object.keys(nested.extractedFields).length > 0) {
      Object.assign(candidate.extractedFields, nested.extractedFields);
    }
  }

  // Check attributes (common in variants)
  if (rawData.attributes) {
    candidate.rawFields.attributes = rawData.attributes;
    const nested = extractSpecCandidate(rawData.attributes, `${source}.attributes`);
    if (Object.keys(nested.extractedFields).length > 0) {
      Object.assign(candidate.extractedFields, nested.extractedFields);
    }
  }

  return candidate;
}

/**
 * Redacts sensitive information from raw response for logging
 */
function redactResponse(data: any, maxDepth: number = 3, currentDepth: number = 0): any {
  if (currentDepth >= maxDepth) {
    return '[Max depth reached]';
  }

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.slice(0, 10).map((item, idx) => {
      if (idx >= 10) return '[Array truncated]';
      return redactResponse(item, maxDepth, currentDepth + 1);
    });
  }

  const redacted: any = {};
  const sensitiveKeys = ['apiKey', 'api_key', 'token', 'secret', 'password', 'authorization'];
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactResponse(value, maxDepth, currentDepth + 1);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');
    const productType = searchParams.get('productType');
    const variantUid = searchParams.get('variantUid');

    if (!uid && !productType && !variantUid) {
      return NextResponse.json(
        { 
          error: 'One of uid, productType, or variantUid parameter is required',
          usage: {
            productType: '/api/gelato/print-spec?productType=card',
            productUid: '/api/gelato/print-spec?uid=cards_cl_dtc_prt_pt',
            variantUid: '/api/gelato/print-spec?variantUid=<variant-uid>',
          }
        },
        { status: 400 }
      );
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        productUidTested: false,
        variantUidTested: false,
        variantsTested: false,
        specFieldsFound: false,
      },
    };

    // Determine productUid
    let productUid: string | null = null;
    if (uid) {
      productUid = uid;
    } else if (productType) {
      productUid = PRODUCT_TYPE_MAP[productType] || null;
      if (!productUid) {
        return NextResponse.json(
          { error: `Unknown product type: ${productType}. Valid types: ${Object.keys(PRODUCT_TYPE_MAP).join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Test 1: Fetch product by productUid
    if (productUid) {
      results.summary.productUidTested = true;
      const productResult = await fetchProductByUid(productUid);
      
      const testResult: any = {
        test: 'GET /products/{productUid}',
        productUid,
        success: productResult.success,
      };

      if (productResult.success) {
        testResult.status = 200;
        testResult.specCandidate = extractSpecCandidate(productResult.data, 'product');
        testResult.rawResponse = redactResponse(productResult.data);
        results.summary.specFieldsFound = results.summary.specFieldsFound || 
          Object.keys(testResult.specCandidate.extractedFields).length > 0;
      } else {
        testResult.status = productResult.status || 'N/A';
        testResult.error = productResult.error;
      }

      results.tests.push(testResult);
    }

    // Test 2: Fetch variants for product
    if (productUid) {
      results.summary.variantsTested = true;
      const variantsResult = await fetchProductVariants(productUid);
      
      const testResult: any = {
        test: 'GET /products/{productUid}/variants',
        productUid,
        success: variantsResult.success,
      };

      if (variantsResult.success) {
        testResult.status = 200;
        
        // Check if variants array contains spec info
        if (variantsResult.data.variants && Array.isArray(variantsResult.data.variants)) {
          // Sample first variant for spec extraction
          const firstVariant = variantsResult.data.variants[0];
          if (firstVariant) {
            testResult.specCandidate = extractSpecCandidate(firstVariant, 'variant');
            testResult.variantCount = variantsResult.data.variants.length;
            testResult.sampleVariantUid = firstVariant.uid;
            results.summary.specFieldsFound = results.summary.specFieldsFound || 
              Object.keys(testResult.specCandidate.extractedFields).length > 0;
          }
        }
        
        testResult.rawResponse = redactResponse(variantsResult.data);
      } else {
        testResult.status = variantsResult.status || 'N/A';
        testResult.error = variantsResult.error;
      }

      results.tests.push(testResult);
    }

    // Test 3: Fetch variant by variantUid (if provided)
    if (variantUid) {
      results.summary.variantUidTested = true;
      const variantResult = await fetchVariantByUid(variantUid);
      
      const testResult: any = {
        test: 'GET /variants/{variantUid}',
        variantUid,
        success: variantResult.success,
      };

      if (variantResult.success) {
        testResult.status = 200;
        testResult.specCandidate = extractSpecCandidate(variantResult.data, 'variant-direct');
        testResult.rawResponse = redactResponse(variantResult.data);
        results.summary.specFieldsFound = results.summary.specFieldsFound || 
          Object.keys(testResult.specCandidate.extractedFields).length > 0;
      } else {
        testResult.status = variantResult.status || 'N/A';
        testResult.error = variantResult.error;
      }

      results.tests.push(testResult);
    }

    // Generate conclusion
    const hasSpecFields = results.summary.specFieldsFound;
    const allTestsFailed = results.tests.every((t: any) => !t.success);
    
    results.conclusion = {
      apiSpecAvailable: hasSpecFields,
      recommendation: hasSpecFields 
        ? 'Gelato API appears to return print spec fields. Proceed with parser implementation.'
        : allTestsFailed
          ? 'All API tests failed. Check API key and endpoint configuration.'
          : 'Gelato API does not appear to return bleed/trim/safe/fold fields. Consider template-driven approach.',
      nextSteps: hasSpecFields
        ? [
            'Implement unit conversion parser (mm -> inches -> pixels @ 300 DPI)',
            'Map Gelato fields to PrintSpec interface',
            'Add fallback to hardcoded specs if API unavailable',
          ]
        : [
            'Verify Gelato API documentation for print spec endpoints',
            'Consider template-driven specs approach',
            'Keep hardcoded specs as active system',
          ],
    };

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('Gelato print spec discovery error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to test Gelato print spec endpoints',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

