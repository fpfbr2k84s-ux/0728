const ZODIAC_SIGNS = [
  { name: '염소자리', start: [12, 22], end: [1, 19], element: '토', traits: '책임감과 꾸준함, 현실감각', lucky: [2, 8, 10, 17, 26, 35] },
  { name: '물병자리', start: [1, 20], end: [2, 18], element: '공기', traits: '독창성, 자유로움, 실험정신', lucky: [4, 7, 11, 22, 31, 40] },
  { name: '물고기자리', start: [2, 19], end: [3, 20], element: '물', traits: '감수성, 직관, 공감력', lucky: [3, 9, 12, 21, 30, 39] },
  { name: '양자리', start: [3, 21], end: [4, 19], element: '불', traits: '도전, 리더십, 추진력', lucky: [1, 5, 9, 18, 27, 36] },
  { name: '황소자리', start: [4, 20], end: [5, 20], element: '흙', traits: '안정, 감각, 인내', lucky: [2, 6, 14, 20, 28, 44] },
  { name: '쌍둥이자리', start: [5, 21], end: [6, 21], element: '공기', traits: '호기심, 소통, 기민함', lucky: [3, 7, 15, 23, 32, 41] },
  { name: '게자리', start: [6, 22], end: [7, 22], element: '물', traits: '보호, 직관, 정서', lucky: [4, 8, 13, 24, 33, 42] },
  { name: '사자자리', start: [7, 23], end: [8, 22], element: '불', traits: '존재감, 자신감, 표현력', lucky: [1, 10, 19, 28, 37, 45] },
  { name: '처녀자리', start: [8, 23], end: [9, 22], element: '흙', traits: '정교함, 분석력, 실용', lucky: [5, 11, 16, 25, 34, 43] },
  { name: '천칭자리', start: [9, 23], end: [10, 23], element: '공기', traits: '균형, 조화, 미감', lucky: [6, 12, 18, 29, 38, 44] },
  { name: '전갈자리', start: [10, 24], end: [11, 22], element: '물', traits: '집중, 깊이, 강한 몰입', lucky: [7, 13, 21, 30, 39, 45] },
  { name: '사수자리', start: [11, 23], end: [12, 21], element: '불', traits: '낙관, 확장, 자유', lucky: [3, 9, 17, 26, 35, 41] }
];

function parseBirthDate(input) {
  if (!input || typeof input !== 'string') return null;
  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (date > new Date()) return null;
  return date;
}

function getZodiacSign(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const sign of ZODIAC_SIGNS) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;
    const wrapsYear = startMonth > endMonth;

    const inRange = wrapsYear
      ? ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay) || month > startMonth || month < endMonth)
      : ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay));

    if (inRange) return sign;
  }

  return ZODIAC_SIGNS[0];
}

function createSeed(date) {
  return Number([
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join(''));
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeNumber(value) {
  return ((value - 1) % 45) + 1;
}

function buildRecommendation(date) {
  const sign = getZodiacSign(date);
  const seed = createSeed(date);
  const random = mulberry32(seed);
  const seen = new Set();
  const list = [];

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const yearDigits = String(date.getFullYear()).split('').map(Number);
  const digitSum = String(seed).split('').reduce((sum, digit) => sum + Number(digit), 0);
  const monthDay = month + day;
  const yearBlend = Math.abs((yearDigits[0] + yearDigits[1]) - (yearDigits[2] + yearDigits[3])) + day;
  const luckyA = sign.lucky[Math.floor(random() * sign.lucky.length)];
  const luckyB = sign.lucky[Math.floor(random() * sign.lucky.length)];

  const picks = [
    { value: normalizeNumber(luckyA), reason: `${sign.name}의 대표 행운수 ${luckyA}를 첫 번호로 썼어요.` },
    { value: normalizeNumber(digitSum), reason: `생년월일 숫자 합 ${digitSum}을 기반으로 골랐어요.` },
    { value: normalizeNumber(monthDay), reason: `월과 일을 합친 ${monthDay}를 반영했어요.` },
    { value: normalizeNumber(yearBlend), reason: `출생연도 균형값 ${yearBlend}로 조정했어요.` },
    { value: normalizeNumber(luckyB + month), reason: `${sign.element} 기운과 행운수 ${luckyB}를 섞었어요.` }
  ];

  for (const item of picks) {
    if (!seen.has(item.value)) {
      seen.add(item.value);
      list.push(item);
    }
  }

  const reasons = [
    `${sign.traits}를 반영한 보완 번호예요.`,
    `생년월일 시드 ${seed}에서 나온 값이에요.`,
    `${sign.name}의 성향을 더해 추가한 번호예요.`
  ];

  while (list.length < 6) {
    const value = Math.floor(random() * 45) + 1;
    if (!seen.has(value)) {
      seen.add(value);
      list.push({
        value,
        reason: reasons[list.length % reasons.length]
      });
    }
  }

  list.sort((a, b) => a.value - b.value);

  return {
    sign: {
      name: sign.name,
      element: sign.element,
      traits: sign.traits
    },
    numbers: list,
    seed
  };
}

function buildMessage({ sign, numbers }) {
  const values = numbers.map((item) => item.value).join(', ');
  return [
    `오늘의 별자리는 ${sign.name}입니다.`,
    `추천 번호는 ${values}예요.`,
    `${sign.element} 기운(${sign.traits})을 바탕으로 번호 사이의 균형을 맞췄습니다.`,
    `원하시면 다음엔 같은 생일 기준으로 다시 뽑아드릴게요.`
  ].join('\n\n');
}

async function saveToSupabase(payload) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다.');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/lotto_draws`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      birth_date: payload.birthDate,
      zodiac_sign: payload.sign.name,
      lucky_numbers: payload.numbers.map((item) => item.value),
      explanation: payload.message
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} ${text}`);
  }

  return response.json();
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 404, { error: 'Not Found' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
    const birthDate = parseBirthDate(body?.birthDate);

    if (!birthDate) {
      return sendJson(res, 400, { error: '유효한 생년월일을 입력해 주세요.' });
    }

    const birthDateIso = birthDate.toISOString().slice(0, 10);
    const recommendation = buildRecommendation(birthDate);
    const message = buildMessage(recommendation);
    const payload = {
      birthDate: birthDateIso,
      sign: recommendation.sign,
      numbers: recommendation.numbers,
      message
    };

    await saveToSupabase(payload);

    return sendJson(res, 200, {
      birthDate: birthDateIso,
      birthDateLabel: birthDateIso,
      sign: recommendation.sign,
      numbers: recommendation.numbers,
      message,
      saved: true
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || '서버 처리 중 오류가 발생했습니다.'
    });
  }
}

module.exports = handler;
