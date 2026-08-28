"use client";

/**
 * 根错误边界（app/error.tsx）。
 *
 * 此前唯一的 ErrorBoundary 只包裹客户端子树（LayoutClient 内部），
 * 而数据类错误发生在**服务端渲染**阶段 —— 静态导出时页面内容直接由
 * server 组件产出，客户端边界根本捕不到。Next.js 的 error.tsx 是
 * 框架级错误边界：渲染/数据错误发生时接管整页，且**不包裹 children**，
 * 不会给页面引入 client 祖先（章节页 RSC 载荷减重的前提之一）。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-xl font-semibold text-[var(--text-accent)] tracking-wide mb-3">
        抱朴守拙
      </h2>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-2">
        页面暂时出了点问题，请刷新重试。
      </p>
      {error?.digest && (
        <p className="text-[11px] text-[var(--text-muted)] mb-6">
          错误编号：{error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--text-accent)] hover:text-[var(--text-accent)] transition-colors"
      >
        重新来过
      </button>
    </div>
  );
}
