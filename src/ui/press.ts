// 끌다가 손을 뗀 것과 구분하려고, 같은 버튼 안에서 눌렀다 뗐을 때만 누른 것으로 친다.
export function onPress(button: HTMLButtonElement, action: () => void) {
  let armed = false
  button.addEventListener('pointerdown', (event) => {
    armed = true
    // 터치는 손가락을 따라 버튼에 묶인다. 풀어야 밖으로 나갔을 때 pointerleave가 온다.
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId)
  })
  button.addEventListener('pointerleave', () => {
    armed = false
  })
  button.addEventListener('pointercancel', () => {
    armed = false
  })
  button.addEventListener('pointerup', () => {
    if (armed) action()
    armed = false
  })
}
