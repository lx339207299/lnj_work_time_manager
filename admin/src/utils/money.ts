/**
 * 金额单位约定：数据库与 API 统一存「分」(Int)，UI 层展示用「元」。
 */

/** 分 → 元展示字符串，固定两位小数 */
export function fenToYuanStr(fen: number, fractionDigits: number = 2): string {
  return (fen / 100).toFixed(fractionDigits)
}
