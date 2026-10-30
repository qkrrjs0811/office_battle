import { SCREEN } from '../data/office'

// 게임 안은 언제나 같은 크기로 배치하고, 창에 맞춰 통째로 줄인다. 글자와 버튼의 비율이 창마다 달라지지 않는다.
export function fitStage(stage: HTMLElement) {
  const apply = () => {
    const scale = Math.min(window.innerWidth / SCREEN.width, window.innerHeight / SCREEN.height)
    stage.style.setProperty('--stage-scale', String(scale))
  }
  window.addEventListener('resize', apply)
  apply()
}
