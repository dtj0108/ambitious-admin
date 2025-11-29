import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 transition-all duration-300">
        <Header />
        <main className="p-6 max-w-[1600px]">{children}</main>
      </div>
    </div>
  )
}

