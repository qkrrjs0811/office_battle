// 프로필에 보이는 값 중 아직 규칙이 없는 것의 임시값. 레벨 규칙이 생기면 그쪽 값으로 바꾼다.
export const PROFILE_START = { level: 1, mp: 30 }

// 프로필 얼굴. 맵과 같은 블록으로 쌓은 인턴 한 명이다. 아래에서 위로 쌓는 순서대로 적는다.
export const PORTRAIT_BLOCKS = [
  { x: 0.2, y: 0.2, z: 0, w: 1.6, d: 1.2, h: 1.2, color: 0x3c4a63 }, // 정장
  { x: 0.85, y: 1.4, z: 0.55, w: 0.3, d: 0.02, h: 0.65, color: 0xd8453e }, // 넥타이
  { x: 0.5, y: 0.35, z: 1.2, w: 1, d: 0.9, h: 0.9, color: 0xf2c9a0 }, // 얼굴
  { x: 0.62, y: 1.25, z: 1.6, w: 0.16, d: 0.02, h: 0.18, color: 0x2a2018 }, // 왼쪽 눈
  { x: 1.22, y: 1.25, z: 1.6, w: 0.16, d: 0.02, h: 0.18, color: 0x2a2018 }, // 오른쪽 눈
  { x: 0.42, y: 0.27, z: 2.1, w: 1.16, d: 1.06, h: 0.3, color: 0x33261d }, // 머리카락
]

export const PORTRAIT_TILE = { halfWidth: 13, halfHeight: 6.5, zUnit: 13 }
