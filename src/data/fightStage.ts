// 전투 장면의 배치와 색. 인물과 가구는 맵과 같은 블록으로 쌓는다.
import type { Block, Tile } from '../core/iso'
import { FLOOR_COLORS } from './office'

export const FIGHT_TILE: Tile = { halfWidth: 30, halfHeight: 15, zUnit: 30 }

export const FIGHT_STAGE = {
  background: 0xd9dee3,
  // 바닥 격자의 맨 뒤 꼭짓점이 놓일 화면 위치
  origin: { x: 195, y: 270 },
  size: 11,
  floorColors: [FLOOR_COLORS.wood, 0xbd9263],
  sideColor: 0x6d7278,
  sideHeight: 0.5,
  // 인물이 서는 칸. x와 y가 같으면 화면 세로 가운데에 선다
  player: { x: 8.6, y: 8.6 },
  enemy: { x: 2.4, y: 2.4 },
  // 칼퇴 돌진 때 옆으로 비켜서는 거리(화면 px)
  dashOffsetX: 70,
}

// 뒤쪽 벽과 소품. 싸움터를 사무실로 읽히게 한다
export const FIGHT_PROPS: Block[] = [
  { x: 0, y: -0.4, z: 0, w: 11, d: 0.4, h: 2.4, color: 0xe8e4da }, // 오른쪽 뒤 벽
  { x: -0.4, y: -0.4, z: 0, w: 0.4, d: 11.4, h: 2.4, color: 0xdcd8ce }, // 왼쪽 뒤 벽
  { x: 0.8, y: 0, z: 1.1, w: 2.2, d: 0.02, h: 1, color: 0x9fd0e6 }, // 창문
  { x: 3.8, y: 0, z: 1.1, w: 2.2, d: 0.02, h: 1, color: 0x9fd0e6 }, // 창문
  { x: 4.6, y: 0.2, z: 0, w: 2, d: 1, h: 0.8, color: 0x4a3a2c }, // 책상
  { x: 5, y: 0.35, z: 0.8, w: 1, d: 0.2, h: 0.6, color: 0x23272d }, // 모니터
  { x: 0, y: 0.8, z: 0.9, w: 0.02, d: 2, h: 1.2, color: 0xf4f1e8 }, // 화이트보드
  { x: 0.1, y: 3.4, z: 0, w: 1, d: 1.8, h: 1.6, color: 0x7f8a94 }, // 캐비닛
  { x: 0.3, y: 5.6, z: 0, w: 0.7, d: 0.7, h: 0.5, color: 0xb5693c }, // 화분
  { x: 0.4, y: 5.7, z: 0.5, w: 0.5, d: 0.5, h: 0.8, color: 0x4f9d5d }, // 화분 잎
]

const SKIN = 0xf2c9a0
const HAIR = 0x33261d
const EYE = 0x2a2018

// 내 캐릭터는 등을 보인다. 맞은편 상대는 얼굴이 보인다.
export const PLAYER_BLOCKS: Block[] = [
  { x: -0.4, y: -0.3, z: 0, w: 0.8, d: 0.6, h: 0.9, color: 0x3c4a63 }, // 정장
  { x: -0.28, y: -0.24, z: 0.9, w: 0.56, d: 0.5, h: 0.5, color: SKIN }, // 머리
  { x: -0.31, y: -0.27, z: 1.2, w: 0.62, d: 0.56, h: 0.28, color: HAIR }, // 머리카락
  { x: -0.31, y: 0.2, z: 0.98, w: 0.62, d: 0.1, h: 0.3, color: HAIR }, // 뒤통수
]

const faceBlocks = (suit: number, tie: number, hair: number, scale: number): Block[] =>
  [
    { x: -0.4, y: -0.3, z: 0, w: 0.8, d: 0.6, h: 0.9, color: suit }, // 정장
    { x: -0.07, y: 0.3, z: 0.35, w: 0.14, d: 0.01, h: 0.5, color: tie }, // 넥타이
    { x: -0.28, y: -0.24, z: 0.9, w: 0.56, d: 0.5, h: 0.5, color: SKIN }, // 얼굴
    { x: -0.2, y: 0.26, z: 1.14, w: 0.09, d: 0.01, h: 0.1, color: EYE }, // 왼쪽 눈
    { x: 0.11, y: 0.26, z: 1.14, w: 0.09, d: 0.01, h: 0.1, color: EYE }, // 오른쪽 눈
    { x: -0.31, y: -0.27, z: 1.4, w: 0.62, d: 0.56, h: 0.18, color: hair }, // 머리카락
  ].map((block) => ({
    ...block,
    x: block.x * scale,
    y: block.y * scale,
    z: block.z * scale,
    w: block.w * scale,
    d: block.d * scale,
    h: block.h * scale,
  }))

export const ENEMY_BLOCKS: Record<'employee' | 'boss', Block[]> = {
  employee: faceBlocks(0x7f8a94, 0x4f7fb5, HAIR, 1),
  boss: faceBlocks(0x23272d, 0xd8453e, 0x8d9299, 1.4),
}

// 날아가는 물건: 결재 서류와 커피
export const PAPER_BLOCK: Block = { x: -0.25, y: -0.3, z: 0, w: 0.5, d: 0.6, h: 0.04, color: 0xffffff }
export const COFFEE_BLOCKS: Block[] = [
  { x: -0.14, y: -0.14, z: 0, w: 0.28, d: 0.28, h: 0.34, color: 0xf4f1e8 }, // 종이컵
  { x: -0.11, y: -0.11, z: 0.34, w: 0.22, d: 0.22, h: 0.02, color: 0x5a3a22 }, // 커피
]

export const FIGHT_EFFECT = {
  throwMs: 180,
  coffeeMs: 150,
  floatMs: 600,
  shakeMs: 120,
  shakeIntensity: 0.008,
  hitColor: '#d8453e',
  enemyHitColor: '#ffffff',
  dodgeColor: '#2f9d62',
  warningColor: '#d8453e',
  overtimeGlow: { color: 0xf5b83d, alpha: 0.55, radiusX: 46, radiusY: 22 },
}
