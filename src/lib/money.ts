export const formatMoney = (cents: number) => {
  const n = Math.round(Number(cents || 0))
  return `¥${(n / 100).toFixed(2)}`
}

