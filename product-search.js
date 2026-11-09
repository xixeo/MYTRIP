(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const form = $('#product-search-form');
  if (!form) return;

  const apiKeyStorage = 'mytrip-serpapi-key-v1';
  const searchEndpoint = 'https://efwgdroqjgfhuvkjkger.supabase.co/functions/v1/google-shopping-search';
  const results = $('#product-search-results');
  const status = $('#product-search-status');
  const googleLink = $('#product-google-search');
  const marketSelect = $('#product-search-market');
  const markets = {
    jp: {currency:'JPY', google:'jp'},
    kr: {currency:'KRW', google:'kr'},
    us: {currency:'USD', google:'us'}
  };
  let searchSequence = 0;

  marketSelect.value = /일본|japan/i.test(window.MYTRIP_ACTIVE_TRIP?.country || '') ? 'jp'
    : /한국|korea/i.test(window.MYTRIP_ACTIVE_TRIP?.country || '') ? 'kr' : 'us';

  const money = (value, currency) => new Intl.NumberFormat('ko-KR', {
    style:'currency', currency, maximumFractionDigits:['KRW', 'JPY'].includes(currency) ? 0 : 2
  }).format(Number(value || 0));

  const currentApiKey = () => localStorage.getItem(apiKeyStorage) || '';
  const updateGoogleLink = () => {
    const query = $('#product-search-query').value.trim();
    const market = markets[marketSelect.value] || markets.kr;
    googleLink.href = `https://www.google.com/search?tbm=shop&gl=${market.google}&q=${encodeURIComponent(query)}`;
  };
  const inferredCategory = item => {
    const text = `${item.name} ${item.store}`.toLowerCase();
    if (/식품|과자|초콜릿|캔디|커피|차|빵|버터|spread|food|chocolate|coffee|tea/.test(text)) return '먹거리';
    if (/화장품|크림|로션|샴푸|치약|의약|cosmetic|cream|lotion|shampoo/.test(text)) return '생활용품';
    return '기타';
  };

  function addResult(item, button) {
    window.dispatchEvent(new CustomEvent('mytrip:add-shopping', {detail:{
      name:item.name,
      store:item.store || '',
      category:inferredCategory(item),
      currency:item.currency,
      quantity:1,
      price:Number(item.price) || 0,
      imageUrl:item.imageUrl || '',
      note:'Google 쇼핑 검색 결과 · 실제 구매 가격은 변동될 수 있음',
      sourceUrl:item.sourceUrl || '',
      done:false
    }}));
    button.disabled = true;
    button.textContent = '등록됨 ✓';
    status.textContent = `“${item.name}”을 쇼핑리스트에 바로 등록했습니다.`;
  }

  function render(items) {
    results.replaceChildren(...items.map(item => {
      const card = document.createElement('article'); card.className = 'product-result-card';
      const media = document.createElement('div'); media.className = 'product-result-image';
      if (item.imageUrl) {
        const image = document.createElement('img'); image.src = item.imageUrl; image.alt = ''; image.loading = 'lazy'; media.append(image);
      } else media.textContent = '🛍';
      const copy = document.createElement('div');
      const source = document.createElement('small'); source.textContent = item.store || '판매처 미확인';
      const title = document.createElement('strong'); title.textContent = item.name;
      const meta = document.createElement('span'); meta.textContent = item.price ? money(item.price, item.currency) : item.priceText || '가격 미확인';
      copy.append(source, title, meta);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'button primary'; button.textContent = '쇼핑리스트에 바로 등록'; button.addEventListener('click', () => addResult(item, button));
      card.append(media, copy, button);
      return card;
    }));
  }

  async function searchGoogleShopping(query, marketId, apiKey) {
    const response = await fetch(searchEndpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({query, market:marketId, apiKey})
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `검색 요청 실패 (${response.status})`);
    return Array.isArray(body.results) ? body.results : [];
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const query = $('#product-search-query').value.trim();
    const apiKey = currentApiKey();
    if (query.length < 2) return;
    if (!apiKey) {
      $('#product-search-setup').open = true;
      status.textContent = 'Google 결과를 앱으로 가져오려면 SerpAPI 키를 먼저 저장하세요.';
      $('#product-search-api-key').focus();
      return;
    }
    const sequence = ++searchSequence;
    results.replaceChildren();
    status.textContent = 'Google 쇼핑 결과를 불러오는 중…';
    try {
      const items = await searchGoogleShopping(query, marketSelect.value, apiKey);
      if (sequence !== searchSequence) return;
      render(items);
      status.textContent = items.length ? `Google 쇼핑 결과 ${items.length}개를 찾았습니다. 원하는 상품을 바로 등록하세요.` : 'Google 쇼핑 결과가 없습니다. 검색 국가나 검색어를 바꿔보세요.';
    } catch (error) {
      if (sequence !== searchSequence) return;
      status.textContent = `Google 검색 실패: ${error.message}`;
    }
  });

  $('#product-search-save-key').addEventListener('click', () => {
    const key = $('#product-search-api-key').value.trim();
    if (!key) { status.textContent = 'SerpAPI 키를 입력하세요.'; return; }
    localStorage.setItem(apiKeyStorage, key);
    $('#product-search-api-key').value = '';
    $('#product-search-setup').open = false;
    status.textContent = 'Google 검색 API 키를 이 브라우저에 저장했습니다.';
  });
  $('#product-search-remove-key').addEventListener('click', () => {
    localStorage.removeItem(apiKeyStorage);
    $('#product-search-api-key').value = '';
    status.textContent = '저장된 Google 검색 API 키를 삭제했습니다.';
  });
  $('#product-search-query').addEventListener('input', () => { searchSequence += 1; results.replaceChildren(); updateGoogleLink(); });
  marketSelect.addEventListener('change', () => { searchSequence += 1; results.replaceChildren(); updateGoogleLink(); });
  updateGoogleLink();
  if (currentApiKey()) status.textContent = 'Google 검색 API가 연결되어 있습니다. 상품을 검색해 바로 등록하세요.';
})();
