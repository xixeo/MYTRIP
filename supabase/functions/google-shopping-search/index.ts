const allowedOrigins = new Set([
  'https://xixeo.github.io',
  'http://127.0.0.1:4173',
  'http://localhost:4173'
]);

const markets = {
  jp: {gl:'jp', hl:'ja', currency:'JPY'},
  kr: {gl:'kr', hl:'ko', currency:'KRW'},
  us: {gl:'us', hl:'en', currency:'USD'}
} as const;

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'https://xixeo.github.io',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
});

Deno.serve(async request => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:cors(origin)});
  if (request.method !== 'POST') return Response.json({error:'POST 요청만 지원합니다.'}, {status:405, headers:cors(origin)});
  if (origin && !allowedOrigins.has(origin)) return Response.json({error:'허용되지 않은 사이트입니다.'}, {status:403, headers:cors(origin)});

  try {
    const {query, market:marketId, apiKey} = await request.json();
    const cleanQuery = String(query || '').trim().slice(0, 80);
    const cleanKey = String(apiKey || '').trim();
    const market = markets[marketId as keyof typeof markets] || markets.kr;
    if (cleanQuery.length < 2) return Response.json({error:'검색어는 두 글자 이상 입력하세요.'}, {status:400, headers:cors(origin)});
    if (!cleanKey) return Response.json({error:'SerpAPI 키가 필요합니다.'}, {status:400, headers:cors(origin)});

    const params = new URLSearchParams({engine:'google_shopping', q:cleanQuery, gl:market.gl, hl:market.hl, api_key:cleanKey});
    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await response.json();
    if (!response.ok || data.error) return Response.json({error:data.error || `SerpAPI 오류 (${response.status})`}, {status:response.status || 502, headers:cors(origin)});

    const results = (data.shopping_results || []).slice(0, 20).map((item: Record<string, unknown>) => ({
      id:String(item.product_id || item.position || crypto.randomUUID()),
      name:String(item.title || '상품명 미확인'),
      store:String(item.source || ''),
      price:Number(item.extracted_price) || 0,
      priceText:String(item.price || ''),
      currency:market.currency,
      imageUrl:String(item.thumbnail || ''),
      sourceUrl:String(item.product_link || item.link || '')
    }));
    return Response.json({results}, {headers:{...cors(origin), 'Cache-Control':'no-store'}});
  } catch (error) {
    return Response.json({error:error instanceof Error ? error.message : '검색 처리 중 오류가 발생했습니다.'}, {status:500, headers:cors(origin)});
  }
});
