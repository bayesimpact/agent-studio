export function FullPageCenterLayout({ children, }: { children: React.ReactNode }) {
  return <div className="flex flex-1 min-h-screen items-center justify-center p-4">
    {children}
  </div>
}
