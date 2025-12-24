export function FullPageCenterLayout({ children, }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-4">
    {children}
  </div>
}
