/**
 * 受限富文本渲染 —— 全站唯一允许进入 dangerouslySetInnerHTML 的内容通道。
 *
 * 数据来源是构建期的本地 JSON（陈鼓应/方勇注疏），当前可信；
 * 但注疏正文是站内**唯一**被当作 HTML 注入的内容，一旦将来数据源变化
 * （接入用户贡献、AI 生成注释、或从外部抓取），未转义的实现会立刻变成
 * 存储型 XSS 注入点。
 *
 * 因此：先整体转义，再只把 **粗体** 标记还原为 <strong>。
 * 除 <strong> 之外不产生任何标签。
 *
 * 此前 PassageView 与 WordTooltip 各自实现了一份 renderHtml，
 * 都是直接 replace 不转义；两份副本还导致「只修了一处」的隐患。
 * 现统一到这里。
 */
export function renderEmphasis(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
