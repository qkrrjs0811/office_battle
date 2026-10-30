// 사무실 층의 배치와 색. 게임 화면은 폰 세로 크기를 기준으로 그린다.
export const SCREEN = { width: 390, height: 844 }

export const FLOOR_LABEL = '1층 · 인턴'

export const WALL_HEIGHT = 190

export type Box = { x: number; y: number; width: number; height: number }

export const WINDOWS: Box[] = [
  { x: 24, y: 64, width: 88, height: 84 },
  { x: 128, y: 64, width: 88, height: 84 },
]

export const DOOR: Box = { x: 288, y: 66, width: 72, height: 124 }

// 책상 2열 4줄. 가운데 통로를 비워 둔다. 전투가 이 통로와 층 아래쪽에서 벌어진다.
export const DESKS: Box[] = [214, 334, 454, 574].flatMap((y) => [
  { x: 22, y, width: 112, height: 62 },
  { x: 256, y, width: 112, height: 62 },
])

export const PLANTS: Box[] = [
  { x: 228, y: 136, width: 44, height: 54 },
  { x: 24, y: 760, width: 44, height: 54 },
  { x: 322, y: 760, width: 44, height: 54 },
]

export const COLORS = {
  wall: 0xe9e2d0,
  wallTrim: 0x8f8672,
  sky: 0xa8d8f0,
  windowFrame: 0x6f7780,
  door: 0x9a6b43,
  doorKnob: 0xf2c94c,
  carpet: 0x7f8fa6,
  carpetLine: 0x74849b,
  desk: 0xc99f6b,
  deskEdge: 0x9c7648,
  monitor: 0x2f3640,
  screen: 0x74c0e3,
  paper: 0xffffff,
  coffee: 0xd35d47,
  pot: 0xb5654a,
  leaf: 0x4caf6e,
}
