/**
 * 金额单位约定：数据库与 API 统一存「分」(Int)，UI 层展示与输入用「元」。
 */

/** 元 → 分。四舍五入到整数分。用 Math.round 消除二进制浮点误差（如 19.9*100 = 1989.9999...） */
export function yuanToFen(yuan: string | number): number {
  const n = typeof yuan === 'string' ? parseFloat(yuan) : yuan
  if (isNaN(n)) return 0
  return Math.round(n * 100)
}

/** 分 → 元展示字符串，固定两位小数 */
export function fenToYuanStr(fen: number, fractionDigits: number = 2): string {
  return (fen / 100).toFixed(fractionDigits)
}
