export const formatTime = (time: number): string => {
  // 格式化时间为 HH:MM:SS
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.round(time % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
export const formatTime2 = (time: number): string => {
  // 格式化时间为 H小时M分钟S秒
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.round(time % 60)
  return `${String(hours)}小时${String(minutes)}分钟${String(seconds)}秒`
}
