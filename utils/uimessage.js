// ============================================
// D1 消息 ↔ UIMessage 转换工具（前端侧）
// AI SDK useChat 使用 UIMessage（parts 结构），
// 平台历史数据为 D1 行（content + metadata JSON），
// 此处负责双向转换，保证：
// - 历史对话加载后可被 useChat 渲染
// - metadata.attachments（图片/文档/生成图）信息保留，渲染层无感
// ============================================

// D1 消息行
export function dbMessageToUIMessage(row) {
  let metadata = {};
  if (row.metadata) {
    try {
      metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    } catch {
      metadata = {};
    }
  }
  return {
    id: row.id,
    role: row.role,
    createdAt: row.created_at,
    metadata,
    parts: [{ type: 'text', text: row.content || '' }],
  };
}

// UIMessage → 纯文本（用于继续生成/编辑等旧协议端点）
export function uiMessageText(msg) {
  if (!msg.parts) return '';
  return msg.parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

// UIMessage 中的生成图片（data part data-image 在 parts 中，历史图片在 metadata.attachments）
export function getGeneratedImages(msg) {
  const fromMetadata = (msg.metadata?.attachments || [])
    .filter((a) => a.type === 'generated_image' && a.url);
  const fromParts = (msg.parts || [])
    .filter((p) => p.type === 'data-image' && p.data?.url)
    .map((p) => ({ type: 'generated_image', url: p.data.url, model: p.data.model }));
  return [...fromMetadata, ...fromParts];
}
