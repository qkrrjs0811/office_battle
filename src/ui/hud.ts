import { FLOOR_LABEL } from '../data/office'

export function mountHud(parent: HTMLElement) {
  const label = document.createElement('div')
  label.className = 'floor-label'
  label.dataset.testid = 'floor-label'
  label.textContent = FLOOR_LABEL
  parent.append(label)
}
