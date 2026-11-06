(() => {
  const lot = (name, address, note, source, query = name, naverPlaceId) =>
    ({name, address, note, source, query, naverPlaceId});
  const attached = (id, name, note) => {
    const {address, query, naverPlaceId} = window.TRIP.venues[id];
    return {name, address, note, query, naverPlaceId};
  };
  const info = (facility, support, lots = [], sources = []) => ({facility, support, lots, sources});
  const cheongjuMarket2 = lot('육거리종합시장 제2주차장', '충북 청주시 상당구 청남로2189번길 26-1',
    '공영 유료 주차장 · 야시장 시간대 입출차는 입구 안내 확인', 'https://bluesquare.app/parking/23517/', '청주 육거리종합시장 제2주차장');
  const cheongjuMarket3 = lot('육거리종합시장 제3주차장', '충북 청주시 상당구 청남로2197번길 47',
    '공개 요금표 기준 24시간 · 30분 500원, 이후 5분당 100원 · 일 최대 8,000원',
    'https://ilsangkit.co.kr/parking/parking-609112ff8346edd3', '청주 육거리종합시장 제3주차장', '1094294068');
  const ochangLake = lot('오창호수공원 주차장', '충북 청주시 청원구 오창읍 양청리 753',
    '공공데이터 기준 24시간 무료', 'https://platformdodam.com/parking-lots/16612');
  const jungangPublic = 'https://www.donggu.go.kr/dg/kor/contents/244';
  const jungang3 = lot('중앙시장 제3공영주차장', '대전 동구 대전로797번길 27',
    '24시간 유료 · 요금은 입구 요금표 확인', jungangPublic, '대전 중앙시장 제3공영주차장', '896545763');
  const jungang2 = lot('중앙시장 제2공영주차장', '대전 동구 중앙로200번길 70',
    '24시간 유료 · 제3주차장 만차 시 대안', jungangPublic, '대전 중앙시장 제2공영주차장');
  const marketSupport = '우대권 발급 점포에서 권종에 따라 30분·1시간·2시간 주차 지원을 받을 수 있어요. 결제 시 발급 여부를 확인하세요.';
  const marketSupportSource = ['시장 주차우대권 안내', 'https://www.donggu.go.kr/dg/kor/contents/1047'];
  const sojeParking = lot('가제교~신안동 320 하상주차장', '대전 동구 소제동 299-453',
    '공공데이터 기준 무료 하상주차장 · 진입 가능 여부는 현장 확인',
    'https://car.kimgoon.kr/parking/detail/183-2-000078', '대전 동구 소제동 299-453');
  const stationEast = lot('대전역 동광장2주차장', '대전 동구 새둑길 143',
    '24시간 유료 · 하상주차장 통제 또는 만차 시 대안',
    'https://www.knpark.com/m/KRT/stationView.html?station=0010', '대전역 동광장2주차장');
  const daeheung1 = lot('대흥동 제1노외 공영주차장', '대전 중구 대종로452번길 27',
    '공영주차장 · 일반 요금과 주말 개방은 현장 안내 확인',
    'https://parking.govpped.com/parking/184-2-000021', '대전 대흥동 제1노외 공영주차장', '1154948537');
  const sunhwa2 = lot('선화동 제2노외 공영주차장', '대전 중구 대종로521번길 29',
    '유료 · 공개 요금표 기준 최초 10분 300원, 이후 10분당 200원',
    'https://114.it.kr/place/parking/13873', '대전 선화동 제2노외 공영주차장');
  const sunhwaStreet = lot('선화동 제2노상 공영주차장', '대전 중구 선화로 126-10 일대',
    '공영 유료 주차 구획 · 방문 요일의 운영 시간과 요금표 확인',
    'https://bluesquare.app/parking/10459/', '대전 선화동 제2노상 공영주차장');
  const underMall = lot('중앙로지하상가 주차장', '대전 중구 선화동 중앙로 일대',
    '공개 요금표 기준 06:00–23:00 · 최초 30분 900원, 이후 10분당 300원',
    'https://bluesquare.app/parking/56051/', '대전 중앙로지하상가 주차장');
  const ourPark = lot('우리들공원 주차장', '대전 중구 중앙로138번길 30',
    '24시간 유료 · 요금 및 할인은 주차장 안내 확인', 'https://app.modu.kr/p/223615', '대전 우리들공원 주차장', '21179683');
  const mallSupport = '상인회는 당일 구매 주차권 1매당 1시간, 최대 2시간을 안내해요. 이용 점포에서 발급 여부와 조건을 확인하세요.';
  const mallSupportSource = ['지하상가 주차권 안내', 'https://jiha-mall.kr/?market_id=&store_idx=227'];
  const arboretumParking = lot('둔산대공원 주차장', '대전 서구 둔산대로 169',
    '08:00–24:00 유료 운영 · 최초 3시간 무료, 이후 15분당 600원 · 일 최대 12,000원',
    'https://daejeon.go.kr/djac/djacContentsHtmlView.do?menuSeq=6766', '대전 둔산대공원 주차장');

  window.TRIP_PARKING = {
    home: info('서면역 인근 공영주차장 이용', '공영주차장 요금표 기준.', [
      lot('서면시장 앞 노상공영주차장', '부산 부산진구 부전동 573-1 일대',
        '서면역 인근 단시간 주차 후보 · 운영 시간과 요금은 현장 확인',
        'https://bluesquare.app/parking/18997/', '부산 서면시장앞 노상공영주차장')
    ]),
    audio: info('매장 방문 차량의 입고·대기 위치 확인 필요', '무료·할인 안내 확인 필요.', [
      lot('온천천복개도로 노상공영주차장', '부산 금정구 범어천로 62 일대',
        '범어사역 권역 대안 · 공개 안내 평일 08:00–20:00, 10분 200원',
        'https://car.kbizin.com/parking/near/beomeosayeok', '부산 금정구 온천천복개도로 노상공영주차장'),
      lot('남산동요산 공영주차장', '부산 금정구 팔송로 51',
        '남산동 권역 대안 · 공개 안내 24시간, 10분 200원',
        'https://platformdodam.com/parking-lots/11316', '부산 남산동요산 공영주차장')
    ]),
    eonyang: info('매장 전용 주차장 확인 필요', '가게 지원 확인 필요 · 언양강변 주차장은 최초 2시간 무료.', [
      lot('언양강변 주차장', '울산 울주군 언양읍 남부리 336-1',
        '유료 운영 06:00–22:00 · 최초 2시간 무료, 이후 요금은 울주군 안내 참고',
        'https://www.ulju.ulsan.kr/ulju/contents.do?mId=0505050000', '울주 언양강변공영주차장')
    ]),
    pohang: info('시장 건물 2·3층 부설주차장 이용', '시장 주차장 최초 20분 무료 · 포항할매집의 무료주차권 발급 여부는 매장 확인.', [
      lot('영천공설시장 주차장', '경북 영천시 시장4길 30',
        '20분까지 무료 · 2시간까지 500원 · 2시간 초과 시 10분당 200원 추가 · 카드 결제',
        'https://www.yc.go.kr/job/contents.do?mId=1302010000', '영천공설시장 주차장')
    ], [['영천시 주차권 안내', 'https://www.yc.go.kr/its/park/parkFee']]),
    bongyong: info('건물 1층 고객 주차장 있음', '방문 후기에 2시간 무료 안내가 있어요. 결제 시 현재 지원 시간과 등록 방법을 확인하세요.', [
      attached('bongyong', '봉용불고기 본점 1층 주차장', '주차 후 2층 식당으로 이동.')
    ], [['매장 주차 안내', 'https://www.tabling.co.kr/place/677ccac766de5f06987bf535'],
      ['지원 조건 방문 후기', 'https://www.keyzard.cc/dsds3935/nb/223462002868']]),
    yukgeori: info('11/6 야시장이 열리는 제1주차장 대신 제2·제3주차장 이용', '행사 별도 지원 확인 필요 · 공영주차장 요금표 기준.',
      [cheongjuMarket3, cheongjuMarket2], [['야시장 장소 안내', 'https://www.yna.co.kr/amp/view/AKR20260929145200064']]),
    saegadeok: info('매장 주차 불가 · 시장 공영주차장 이용', '공용주차장 주차권 안내가 있어요. 계산할 때 적용 주차장과 시간을 확인하세요.',
      [cheongjuMarket2, cheongjuMarket3], [
        ['청주시 관광 안내', 'https://skweb.cjsmarttour.kr/home/sub.do?code2=166&menukey=6003&mode=viewApi&no=621&page=21'],
        ['주차권 안내', 'https://eatpick.kr/detail.php?id=835']
      ]),
    rest: info('숙소 주차장 이용 가능', '예약처에 무료 셀프 주차로 안내돼요.', [
      attached('rest', '오창 레스트호텔 주차장', '입차 위치와 차량 등록은 체크인 때 확인.')
    ], [['충북 관광 숙소 안내', 'https://tour.chungbuk.go.kr/www/selectTourCntnts.do?key=78&searchMainSe=STAY&tourNo=2861'],
      ['예약처 주차 안내', 'https://www.expedia.co.kr/Cheongju-Hotels-Hotel-The-Rest-Ochang.h78495375.Hotel-Information']]),
    empress: info('숙소 건물 옆 주차장 안내', '예약처에 무료 주차로 안내돼요. 차량 등록 여부는 프런트 확인.', [
      attached('empress', '엠프레스 레지던스 옆 주차장', '숙소 예약처에서 건물 옆 주차장을 안내해요.')
    ], [['예약처 주차 위치', 'https://www.yeogi.com/domestic-accommodations/67366'],
      ['예약처 무료 주차 안내', 'https://kr.trip.com/hotels/cheongju-hotel-detail-106738375/cheongju-ochang-empress-residence/']]),
    jeongchi: info('관광 자료에 주차 가능으로 표시 · 고객 주차 구획은 매장 확인', '관광 자료에 무료 주차로 표시돼요. 방문 후기의 이용 가능 여부가 엇갈려 주차 위치와 조건은 매장 확인.',
      [ochangLake], [['매장 주차 안내', 'https://m.tripinfo.co.kr/info.html?content_id=2859808&content_type_id=39']]),
    kkoju: info('매장 주차 불가 · 청주시 관광 안내 기준', '매장 지원 확인 필요 · 오창호수공원 주차장 무료.',
      [ochangLake], [['청주시 관광 안내', 'https://skweb.cjsmarttour.kr/home/sub.do?menukey=6003&mode=viewApi&no=821&page=35']]),
    church: info('사랑의교회 예식용 주차 안내 확인 필요', '예식 안내에 적힌 주차 위치와 지원 조건 우선.', [
      lot('광혜원면 화랑교 하부 공영주차장', '충북 진천군 광혜원면 구암길 11',
        '공개 자료 기준 무료 · 광혜원면 내 대안이며 교회까지 이동 시간 별도',
        'https://ilsangkit.co.kr/chungbuk/jincheon/parking', '진천 광혜원면 구암길 11 화랑교 하부 주차장')
    ]),
    daemeori: info('매장 바로 앞 전용 주차장 있음 · 방문 후기 기준', '주차비나 등록 조건은 공개 안내에서 확인하기 어려워요.', [
      attached('daemeori', '대머리해장국 1호점 앞 주차장', '성화로 24 매장 앞 주차장으로 진입.')
    ], [['매장 주차 후기', 'https://www.diningcode.com/profile.php?rid=iVvbRVADqqFV']]),
    majung: info('호텔 맞은편 대흥동 제1노외 공영주차장 이용', '숙박은 프런트에서 24시간 주차 쿠폰 1회. 체크아웃 때 한 번 출차하는 조건이며 야간 입출차는 프런트에 확인하세요.',
      [daeheung1], [['호텔 주차 지원 안내', 'https://nol.yanolja.com/stay/domestic/1018852']]),
    temi: info('옛 도지사공관 옆 전용 주차장 있음', '공개 관람 안내 기준 무료 · 운영과 행사 통제는 시설 안내 확인.', [
      lot('테미오래 전용 주차장', '대전 중구 보문로205번길 13',
        '도지사공관 옆 주차장.', 'https://temiorae.com/map', '대전 테미오래 주차장')
    ]),
    soje: info('관사촌 방문 시 주변 공영주차장 이용', '하상주차장 무료 · 대전역 동광장2주차장은 유료.',
      [sojeParking, stationEast]),
    pung: info('매장 주차 불가 · 주변 공영주차장 이용', '매장 지원 확인 필요 · 하상주차장은 무료.',
      [sojeParking, stationEast], [['매장 주차 안내', 'https://local.lazyscheme.com/places/lss94p6sdpfzmgwbtn/']]),
    heredium: info('시설 주차장 있음 · 공간 협소', '무료 이용이나 주차비 지원 조건은 시설 확인.', [
      lot('헤레디움 주차장', '대전 동구 인동 74-14',
        '전시장 부설 주차장 진입 위치.', 'https://heredium.art/about/intro', '대전 동구 인동 74-14'),
      lot('인동시장 노외공영주차장', '대전 동구 인동 30-1',
        '시설 주차장 만차 시 대안 · 24시간 유료', jungangPublic, '대전 인동시장 노외공영주차장')
    ]),
    daedong: info('공원 주변 무료 공영주차장 이용', '공공데이터 기준 아래 주차장 무료.', [
      lot('대동하늘공원 공영주차장', '대전 동구 대동 1-8',
        '동구청 시설명 대동종합사회복지센터주차장 · 무료', 'https://donggu.go.kr/dg/kor/contents/241', '대전 동구 대동 1-8'),
      lot('대동공영주차장', '대전 동구 이화로37번길 29',
        '만차 시 대안 · 공개 안내 무료 27면', 'https://car.kimgoon.kr/parking/detail/183-2-000048', '대전 동구 이화로37번길 29')
    ]),
    wine: info('DCC 제2전시장 지하주차장 있음', '시설 최초 30분 무료 · 박람회 별도 지원은 행사 안내 확인.', [
      lot('대전컨벤션센터 제2전시장 주차장', '대전 유성구 엑스포로 87',
        '최초 30분 무료 · 이후 15분당 500원 · 하루 최대 10,000원 · 22:00–07:00 입출차 제한',
        'https://www.dcckorea.or.kr/content/view.do?contentKey=70&menuKey=76'),
      lot('대전컨벤션센터 제1전시장 주차장', '대전 유성구 엑스포로 107',
        '제2전시장 만차 시 대안 · 동일 기본 요금', 'https://www.dcckorea.or.kr/content/view.do?contentKey=70&menuKey=76')
    ]),
    gwangcheon: info('전용 주차장 확인 필요', '매장 주차비 지원 확인 필요.', [sunhwa2]),
    taehwa: info('매장 옆 전용 주차장 있음', '매장 안내 자료에 손님 무료 주차로 표시돼요.', [
      attached('taehwa', '태화장 전용 주차장', '중앙로203번길 78 매장 옆.')
    ], [['태화장 주차 안내', 'https://www.menupan.com/restaurant/onepage.asp?acode=C300063']]),
    hyeonam: info('매장 전용 주차장 없음 · 방문 후기 기준', '매장 지원 확인 필요 · 아래 지정 공영 주차 구획은 무료.', [
      lot('현암1·8·10·11길 노상공영주차장', '대전 동구 대전천북로 136 일대',
        '삼성동 343번지 주변의 지정 주차 구획 · 공공데이터 기준 24시간 무료',
        'https://114.it.kr/place/parking/11615', '대전 동구 대전천북로 136'),
      lot('중촌동 제4노상 공영주차장', '대전 중구 대전천서로 616 일대',
        '만차 시 건너편 권역의 지정 무료 주차 구획', 'https://82rg.com/nearby/parking/184-1-000078', '대전 중촌동 제4노상 공영주차장')
    ], [['매장 주차 방문 후기', 'https://pglog.tistory.com/m/580']]),
    ttotto: info('매장 전용 주차장 확인 필요 · 중앙시장 공영주차장 이용', marketSupport,
      [jungang3], [marketSupportSource]),
    haenyeo: info('매장 전용 주차장 확인 필요 · 중앙시장 공영주차장 이용', marketSupport,
      [jungang3], [marketSupportSource]),
    hwawol: info('행사장 인근 중앙시장 제2·제3공영주차장 이용', '행사 별도 지원 확인 필요. ' + marketSupport,
      [jungang3, jungang2], [marketSupportSource]),
    nongmin: info('매장 뒤 소규모 주차 공간 · 방문 후기 기준', '방문 후기에 무료 주차가 언급돼요. 지정 구획과 적용 조건은 매장 확인.',
      [attached('nongmin', '옥천뼈구이농민뜨끈이 본점 주차', '매장 뒤 주차 공간이 협소해요.'), daeheung1],
      [['매장 주차 후기', 'https://www.diningcode.com/profile.php?rid=7IPo7P8xlOUF']]),
    oc: info('삼성동 본점 매장 옆 전용 주차장 있음', '방문 안내 기준 손님 무료 주차.', [
      attached('oc', '오씨칼국수 본점 전용 주차장', '옛신탄진로 13 매장 옆.')
    ], [['매장 주차 안내', 'https://www.koreatriptips.com/dining/2581759.html']]),
    han: info('매장 전용 주차장 없음 · 대전 관광 안내 기준', '매장 지원 확인 필요 · 아래 공영주차장 일반 유료.', [
      lot('오류동 제1노외 공영주차장', '대전 중구 오류동 175-7',
        '운영 시간과 요금은 현장 안내 확인', 'https://newfesta.com/parking/national/184-2-000023', '대전 오류동 제1노외 공영주차장')
    ], [['대전 관광 안내', 'https://daejeontour.co.kr/food_djt/7?page=4']]),
    wata: info('매장 전용 주차장 없음 · 방문 후기 기준', '매장 주차비 지원 확인 필요.', [
      lot('둔산동 제2공한지 유료주차장', '대전 서구 둔산동 1113',
        '공개 요금표 기준 24시간 · 최초 10분 400원, 이후 10분당 300원',
        'https://114.it.kr/place/parking/881', '대전 둔산동 제2공한지 유료주차장')
    ], [['매장 주차 방문 후기', 'https://growsteady.tistory.com/entry/%EB%8C%80%EC%A0%84%EC%84%9C%EA%B5%AC%EA%B0%88%EB%A7%88%EB%8F%99-%EC%99%80%ED%83%80%EC%9A%94%EC%97%85']]),
    seonhwa: info('매장 전용 주차장 확인 필요 · 주변 공영 구획 이용', '매장 지원 및 주말 요금은 현장 확인.', [sunhwaStreet]),
    mokcheok: info('천변 산책 시작점 근처 공영주차장 이용', '공영주차장 일반 유료.', [
      lot('대전천주변 노외공영주차장', '대전 동구 중동 51-16',
        '24시간 유료 · 대전천 산책에 이용', jungangPublic, '대전 동구 중동 51-16 공영주차장'),
      jungang3
    ]),
    daecheong: info('명상정원 지정 방문객 주차장 이용', '공개 방문 안내 기준 마산동 한터 주차장 무료.', [
      lot('마산동 한터 주차장', '대전 동구 마산동 551-3',
        '주차 후 호숫가 산책로로 이동', 'https://www.donggu.go.kr/dg/tour/209/81/sights', '대전 동구 마산동 551-3'),
      lot('추동 소한터 주차장', '대전 동구 추동 224-4',
        '한터 주차장 만차 시 대안 · 요금 현장 확인', 'https://www.donggu.go.kr/dg/kor/article/newsNSEW/131316', '대전 동구 추동 224-4')
    ]),
    hanbat: info('수목원은 둔산대공원 주차장 이용', '둔산대공원 최초 3시간 무료.', [arboretumParking]),
    bridge: info('엑스포시민광장 쪽 둔산대공원 주차 후 도보', '둔산대공원 최초 3시간 무료.', [arboretumParking]),
    dongso: info('매장 주차 안내가 엇갈려 전용 구획 확인 필요', '매장 지원 확인 필요 · 부사동 제1노상 공영 구획 무료 안내.', [
      lot('부사동 제1노상 공영주차장', '대전 중구 충무로 139 일대',
        '공개 자료 기준 24시간 무료 · 지정 주차면 이용',
        'https://jucha.kr/search/place/parkinglot?code=184-1-000028', '대전 부사동 제1노상 공영주차장')
    ]),
    baro: info('지하상가 주차장 이용 · 매장 전용 주차장 확인 필요', mallSupport,
      [underMall, ourPark], [mallSupportSource]),
    kimhwa: info('매장 주차 불가 · 중앙시장 공영주차장 이용', marketSupport, [jungang3], [marketSupportSource]),
    shinsegae: info('백화점 지하주차장 있음', '최초 30분 무료. 3·5·10·20·30만 원 이상 구매 시 각각 1·2·3·4·5시간 무료. 주차권과 구매 영수증 합산 불가.', [
      lot('대전신세계 Art & Science 지하주차장', '대전 유성구 엑스포로 1',
        '무료 시간 초과 시 10분당 1,000원.', 'https://addir.shinsegae.com/store/main.do?storeCd=SC00060', '대전신세계 Art & Science 주차장')
    ]),
    perfume: info('지하상가 주차장 이용 · 공방 전용 주차장 확인 필요', mallSupport,
      [underMall, ourPark], [mallSupportSource]),
    angels: info('공방 전용 주차장 확인 필요', '공방 주차비 지원은 예약 시 확인.', [sunhwa2]),
    nuri: info('매장 주차 불가 · 행정안전부 착한가격업소 안내 기준', '매장 지원 확인 필요 · 선화동 제6노외 공영주차장 무료 안내.', [
      lot('선화동 제6노외 공영주차장', '대전 중구 선화동 114-6~7',
        '공개 자료 기준 일요일 포함 24시간 무료 · 15면',
        'https://82rg.com/nearby/parking/184-2-000063', '대전 선화동 제6노외 공영주차장'),
      ourPark
    ], [['매장 주차 안내', 'https://www.goodprice.go.kr/bssh/bsshInfo.do?bsshSn=13325']]),
    sung: info('성심당 전용주차장 또는 지정 주차장 이용', '1만 원 이상 구매 영수증 바코드 1장당 1시간, 2장까지 안내돼요. 현대주차장의 추가 1시간은 매장 주차권 확인.', [
      ourPark,
      lot('현대주차장', '대전 중구 중앙로138번길 16',
        '성심당 본점 지정 주차장 · 추가 주차권은 결제 시 문의',
        'https://wubl.net/sungsimdang-parking/', '대전 중앙로138번길 16 현대주차장'),
      lot('정오주차장', '대전 중구 대흥로157번길 40-7',
        '성심당 본점 지정 주차장 · 공개 요금표 24시간, 30분당 3,000원',
        'https://wubl.net/sungsimdang-parking/', '대전 정오주차장')
    ], [['성심당 공식 주차장 안내', 'https://sungsimdang.co.kr/theme/responsive_sungsimdang/skin/board/basic/print.skin.php?bo_table=53&wr_id=25'],
      ['영수증 적용 안내', 'https://wubl.net/sungsimdang-parking/']]),
    buffet: info('호텔인터불고 대구 본관 주차장 또는 파크빌리지 주차장', '호텔 공식 안내상 호텔 이용객은 차량 등록 없이 3시간 무료 출차.', [
      lot('호텔인터불고 대구 본관 주차장', '대구 수성구 팔현길 212',
        '무료 시간 초과 시 호텔 현장 요금표 확인 · 만차 시 파크빌리지 주차장',
        'https://hotel-interburgo-daegu.com/contents/08_customer/sub09.html', '호텔인터불고 대구 본관 주차장')
    ]),
    busan: info('전포·서면 권역 공영주차장 이용', '공영주차장 요금표 기준. 늦은 도착은 24시간 운영 후보 참고.', [
      lot('유원오피스텔 뒤 공영주차장', '부산 부산진구 서면문화로 29-16',
        '서면권 야간 대안 · 공개 안내 24시간, 10분 700원 · 하루 최대 21,000원',
        'https://app.modu.kr/p/223455', '부산 유원오피스텔 뒤 공영주차장'),
      lot('경남공고 뒤 공영주차장', '부산 부산진구 전포대로189번길 30',
        '전포권 주간 후보 · 공개 안내 08:00–20:00, 10분 300원 · 하루 최대 8,000원',
        'https://car.kimgoon.kr/parking/detail/134-1-000005', '부산 경남공고 뒤 공영주차장')
    ])
  };
})();
