import { Loader2 } from "lucide-react"

export function SuspenseLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-screen glass rounded-2xl">
      <div className="glass-card rounded-xl p-1 flex flex-col items-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        {/* <span className="text-sm text-gray-600 font-medium">Loading...</span> */}
      </div>
    </div>
  )
}