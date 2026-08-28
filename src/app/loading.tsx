/**
 * 全站导航加载骨架（server component，零 JS）。
 *
 * 客户端路由切换到大页面（如章节页，未压缩 HTML 可达 1MB）时，
 * RSC 载荷在慢网络下需要可感知的加载时间 —— 此前没有任何反馈，
 * 点击后页面「卡住不动」。App Router 的 loading.tsx 会成为该路由
 * Suspense 边界的 fallback：静态导出下首屏直接命中预渲染 HTML，
 * 仅在客户端导航期间显示本骨架。
 *
 * 注意：这里不能加载真实数据或引入 client 交互 —— 它会进入每个
 * 路由的 Suspense 外壳（约束 3：正文不得进入任何 client 祖先）。
 */
export default function Loading() {
  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      role="status"
      aria-label="页面加载中"
    >
      {/* 标题区 */}
      <div className="mb-10 space-y-3" aria-hidden="true">
        <div className="skeleton h-4 w-24 rounded-full" />
        <div className="skeleton h-9 w-48 rounded-lg" />
        <div className="skeleton h-3.5 w-full max-w-md rounded-full" />
        <div className="skeleton h-3.5 w-2/3 max-w-sm rounded-full" />
      </div>

      {/* 内容卡片 */}
      <div className="card p-6 sm:p-8 mb-8 space-y-3" aria-hidden="true">
        <div className="skeleton h-3.5 w-28 rounded-full" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-11/12 rounded-full" />
        <div className="skeleton h-3 w-4/5 rounded-full" />
      </div>

      {/* 段落行 */}
      <div className="space-y-8" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2.5">
            <div className="skeleton h-3 w-16 rounded-full" />
            <div className="skeleton h-4 w-full rounded-full" />
            <div className="skeleton h-4 w-11/12 rounded-full" />
            <div className="skeleton h-3 w-5/6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
