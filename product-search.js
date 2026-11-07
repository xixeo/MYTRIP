(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const form = $('#product-search-form');
  if (!form) return;

  const results = $('#product-search-results');
  const status = $('#product-search-status');
  const googleLink = $('#product-google-search');
  const defaultCurrency = /일본|japan/i.test(window.MYTRIP_ACTIVE_TRIP?.country || '') ? 'JPY' : 'KRW';
  let searchSequence = 0;

  const normalized = value => String(value || '').trim().toLocaleLowerCase('ko-KR');
  const money = (value, currency) => new Intl.NumberFormat('ko-KR', {
    style: 'currency', currency, maximumFractionDigits: ['KRW', 'JPY'].includes(currency) ? 0 : 2
  }).format(Number(value || 0));

  function catalogMatches(query) {
    const needle = normalized(query);
    return (window.MYTRIP_HOKKAIDO_SHOPPING_V1 || [])
      .filter(item => normalized([item.name, item.localName, item.store, item.sheetCategory].join(' ')).includes(needle))
      .slice(0, 8)
      .map(item => ({...item, sourceLabel:'내 여행 상품 자료'}));
  }

  async function publicProductMatches(query) {
    const params = new URLSearchParams({
      action: 'process', json: '1', page_size: '8', search_terms: query,
      fields: 'code,product_name,product_name_ko,brands,image_front_url,categories_tags'
    });
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.products || []).filter(product => product.product_name_ko || product.product_name).map(product => ({
      id: `open-food-facts-${product.code}`,
      name: product.product_name_ko || product.product_name,
      localName: product.product_name_ko ? product.product_name : '',
      store: product.brands || '',
      category: '먹거리', currency: defaultCurrency, quantity: 1, price: 0,
      imageUrl: product.image_front_url || '',
      note: '공개 상품 데이터에서 가져옴 · 구매 전 매장 가격 확인',
      sourceUrl: product.code ? `https://world.openfoodfacts.org/product/${product.code}` : '',
      sourceLabel: '공개 상품 정보'
    }));
  }

  function fillForm(item) {
    $('#shopping-name').value = item.name || '';
    $('#shopping-store').value = item.store || '';
    $('#shopping-category').value = item.category || '기타';
    $('#shopping-currency').value = item.currency || defaultCurrency;
    $('#shopping-quantity').value = String(item.quantity || 1);
    $('#shopping-price').value = item.price ? String(item.price) : '';
    $('#shopping-image').value = /^https?:\/\//.test(item.imageUrl || '') ? item.imageUrl : '';
    $('#shopping-note').value = [item.localName, item.note].filter(Boolean).join(' · ').slice(0, 100);
    if (item.imageUrl && !/^https?:\/\//.test(item.imageUrl)) $('#shopping-image').dataset.importedImage = item.imageUrl;
    else delete $('#shopping-image').dataset.importedImage;
    status.textContent = `“${item.name}” 정보를 입력했습니다. 가격과 이미지를 확인한 뒤 목록에 추가하세요.`;
    $('#shopping-name').focus();
    $('#shopping-form').scrollIntoView({behavior:'smooth', block:'center'});
  }

  function render(items) {
    results.replaceChildren(...items.map(item => {
      const card = document.createElement('article'); card.className = 'product-result-card';
      const media = document.createElement('div'); media.className = 'product-result-image';
      if (item.imageUrl) { const image = document.createElement('img'); image.src = item.imageUrl; image.alt = ''; image.loading = 'lazy'; media.append(image); }
      else media.textContent = '🛍';
      const copy = document.createElement('div');
      const source = document.createElement('small'); source.textContent = item.sourceLabel;
      const title = document.createElement('strong'); title.textContent = item.name;
      const meta = document.createElement('span'); meta.textContent = [item.store, item.price ? money(item.price, item.currency || defaultCurrency) : '가격 직접 입력'].filter(Boolean).join(' · ');
      copy.append(source, title, meta);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'button secondary'; button.textContent = '정보 가져오기'; button.addEventListener('click', () => fillForm(item));
      card.append(media, copy, button);
      return card;
    }));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const query = $('#product-search-query').value.trim();
    if (query.length < 2) return;
    const sequence = ++searchSequence;
    googleLink.href = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
    const local = catalogMatches(query);
    render(local);
    status.textContent = local.length ? `내 여행 자료에서 ${local.length}개를 찾았습니다. 공개 상품 정보도 확인 중…` : '공개 상품 정보를 검색하는 중…';
    try {
      const remote = await publicProductMatches(query);
      if (sequence !== searchSequence) return;
      const seen = new Set(local.map(item => normalized(item.name)));
      const combined = [...local, ...remote.filter(item => !seen.has(normalized(item.name)))].slice(0, 12);
      render(combined);
      status.textContent = combined.length ? `${combined.length}개의 후보를 찾았습니다. 원하는 상품의 정보를 가져오세요.` : '검색 결과가 없어요. Google 쇼핑에서 확인하거나 아래에서 직접 입력하세요.';
    } catch (_) {
      if (sequence !== searchSequence) return;
      status.textContent = local.length ? `${local.length}개의 여행 자료를 찾았습니다. 공개 상품 검색은 연결되지 않았어요.` : '검색 결과를 불러오지 못했어요. Google 쇼핑에서 확인하거나 아래에서 직접 입력하세요.';
    }
  });

  $('#product-search-query').addEventListener('input', event => {
    const query = event.target.value.trim();
    googleLink.href = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
  });
  $('#shopping-image').addEventListener('input', event => {
    delete event.currentTarget.dataset.importedImage;
  });
})();
