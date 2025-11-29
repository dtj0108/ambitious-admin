export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-background via-surface to-background flex justify-center pt-12 sm:pt-16 lg:pt-20 px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
