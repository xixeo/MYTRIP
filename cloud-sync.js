(() => {
  'use strict';
  const supabaseUrl = 'https://efwgdroqjgfhuvkjkger.supabase.co';
  const publishableKey = 'sb_publishable_wlcErS00bB8Bm9638KSYQw_As9W6Jjv';
  const sessionKey = 'mytrip-supabase-session-v1';
  const registryKey = 'mytrip-trip-registry-v1';
  const bases = ['mytrip-user-planner-v1', 'weekend-trip-shopping-v2', 'mytrip-exchange-rates-v1', 'mytrip-travel-info-v1'];
  const $ = selector => document.querySelector(selector);
  if (!$('#cloud-login-form')) return;
  let session = null;
  let busy = false;
  try { session = JSON.parse(localStorage.getItem(sessionKey) || 'null'); } catch (_) { session = null; }

  const status = message => { $('#cloud-status').textContent = message; };
  const authHeaders = () => ({apikey:publishableKey, Authorization:`Bearer ${session.access_token}`, 'Content-Type':'application/json'});
  const getRegistry = () => {
    try { return JSON.parse(localStorage.getItem(registryKey) || 'null'); } catch (_) { return null; }
  };
  const setSession = next => { session = next; if (next) localStorage.setItem(sessionKey, JSON.stringify(next)); else localStorage.removeItem(sessionKey); renderAuth(); };
  const tokenUserId = token => { try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub || ''; } catch (_) { return ''; } };
  async function api(path, options = {}) {
    const response = await fetch(`${supabaseUrl}${path}`, options);
    const text = await response.text(); let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
    if (!response.ok) throw new Error(body?.msg || body?.message || body?.error_description || `요청 실패 (${response.status})`);
    return body;
  }
  async function refreshSession() {
    if (!session?.refresh_token) return false;
    try {
      const next = await api('/auth/v1/token?grant_type=refresh_token', {method:'POST', headers:{apikey:publishableKey, 'Content-Type':'application/json'}, body:JSON.stringify({refresh_token:session.refresh_token})});
      setSession(next); return true;
    } catch (_) { setSession(null); return false; }
  }
  async function ensureSession() {
    if (!session?.access_token) return false;
    const expiresAt = Number(session.expires_at || 0) * 1000;
    return !expiresAt || expiresAt > Date.now() + 60000 ? true : refreshSession();
  }
  function consumeLoginCallback() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.get('access_token')) return;
    const accessToken = params.get('access_token');
    setSession({access_token:accessToken, refresh_token:params.get('refresh_token'), expires_at:Math.floor(Date.now() / 1000) + Number(params.get('expires_in') || 3600), user:{id:tokenUserId(accessToken)}});
    history.replaceState(null, '', `${location.pathname}${location.search}`); status('로그인했습니다. 클라우드 여행을 불러오는 중…');
  }
  function renderAuth() {
    const signedIn = Boolean(session?.access_token);
    $('#cloud-login-form').hidden = signedIn; $('#cloud-actions').hidden = !signedIn; $('#cloud-sign-out').hidden = !signedIn;
    if (!signedIn) $('#cloud-trip-list').replaceChildren();
  }
  function currentSnapshot() {
    const registry = getRegistry(); const trip = registry?.trips?.find(item => item.id === registry.activeId);
    if (!trip) throw new Error('현재 여행을 찾을 수 없습니다.');
    const data = Object.fromEntries(bases.map(base => { let value = null; try { value = JSON.parse(localStorage.getItem(`${base}:${trip.id}`) || 'null'); } catch (_) {} return [base, value]; }));
    return {trip:{...trip, template:false}, data};
  }
  async function uploadCurrent() {
    if (busy || !await ensureSession()) return; busy = true; status('현재 여행을 클라우드에 저장하는 중…');
    try {
      const snapshot = currentSnapshot();
      const userId = session.user?.id || tokenUserId(session.access_token); if (!userId) throw new Error('로그인 사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
      await api('/rest/v1/mytrip_snapshots?on_conflict=user_id,trip_id', {method:'POST', headers:{...authHeaders(), Prefer:'resolution=merge-duplicates,return=minimal'}, body:JSON.stringify({user_id:userId, trip_id:snapshot.trip.id, title:snapshot.trip.title, payload:snapshot, client_updated_at:new Date().toISOString()})});
      status('클라우드 저장이 완료됐습니다.');
    } catch (error) { status(`저장 실패: ${error.message}`); return; } finally { busy = false; }
    await loadCloudTrips();
  }
  function importSnapshot(snapshot) {
    if (!snapshot?.trip || !snapshot?.data) throw new Error('클라우드 여행 데이터가 올바르지 않습니다.');
    const registry = getRegistry() || {activeId:'', trips:[]}; const remoteTrip = {...snapshot.trip, template:false}; const existing = registry.trips.find(item => item.id === remoteTrip.id);
    if (existing) Object.assign(existing, remoteTrip); else registry.trips.push(remoteTrip);
    for (const base of bases) if (snapshot.data[base] !== null && snapshot.data[base] !== undefined) localStorage.setItem(`${base}:${remoteTrip.id}`, JSON.stringify(snapshot.data[base]));
    registry.activeId = remoteTrip.id; localStorage.setItem(registryKey, JSON.stringify(registry)); location.reload();
  }
  async function loadCloudTrips() {
    if (busy || !await ensureSession()) return; status('클라우드 여행 목록을 불러오는 중…');
    try {
      const rows = await api('/rest/v1/mytrip_snapshots?select=trip_id,title,payload,updated_at&order=updated_at.desc', {headers:authHeaders()});
      $('#cloud-trip-list').replaceChildren(...rows.map(row => {
        const card = document.createElement('article'); card.className = 'cloud-trip-card';
        const copy = document.createElement('div'); const title = document.createElement('strong'); title.textContent = row.title; const time = document.createElement('small'); time.textContent = `${new Date(row.updated_at).toLocaleString('ko-KR')} 저장`; copy.append(title, time);
        const button = document.createElement('button'); button.type = 'button'; button.className = 'button secondary'; button.textContent = '이 기기로 불러오기'; button.addEventListener('click', () => { if (confirm(`“${row.title}”의 클라우드 저장본을 이 기기로 불러올까요? 같은 여행의 로컬 변경은 덮어씁니다.`)) importSnapshot(row.payload); });
        card.append(copy, button); return card;
      }));
      status(rows.length ? `${rows.length}개의 클라우드 여행을 찾았습니다.` : '클라우드에 저장된 여행이 없습니다.');
    } catch (error) { status(`목록 불러오기 실패: ${error.message}`); }
  }
  $('#cloud-login-form').addEventListener('submit', async event => {
    event.preventDefault(); const email = $('#cloud-email').value.trim(); status('로그인 이메일을 보내는 중…');
    try {
      const redirectTo = encodeURIComponent(`${location.origin}${location.pathname}`);
      await api(`/auth/v1/otp?redirect_to=${redirectTo}`, {method:'POST', headers:{apikey:publishableKey, 'Content-Type':'application/json'}, body:JSON.stringify({email, create_user:true})});
      status(`${email}로 로그인 링크를 보냈습니다. 같은 브라우저에서 링크를 열어주세요.`);
    } catch (error) { status(`로그인 링크 전송 실패: ${error.message}`); }
  });
  $('#cloud-upload').addEventListener('click', uploadCurrent);
  $('#cloud-refresh').addEventListener('click', loadCloudTrips);
  $('#cloud-sign-out').addEventListener('click', async () => { try { if (session) await api('/auth/v1/logout', {method:'POST', headers:authHeaders()}); } catch (_) {} setSession(null); status('로그아웃했습니다.'); });
  consumeLoginCallback(); renderAuth(); if (session) loadCloudTrips();
})();
