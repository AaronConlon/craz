import { Suspense } from "react"
import { Toaster } from "sonner"

import { ErrorBoundary } from "~source/components/error-boundary"
import { ReactQueryProvider } from "~source/components/query-provider"
import { SuspenseLoader } from "~source/components/suspense-loader"
import { ThemeProvider } from "~source/shared/components"
import { TabSwitcher } from "~source/features/tab-switcher"
import "./style.css"
import "./sonner.css"

function IndexPopup() {
  return (
    <ErrorBoundary>
      <ReactQueryProvider>
        <ThemeProvider>
          <div className="w-[400px] h-[600px] bg-white">
            <Suspense fallback={<SuspenseLoader />}>
              <TabSwitcher />
            </Suspense>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  fontSize: '14px',
                  padding: '12px 16px',
                }
              }}
            />
          </div>
        </ThemeProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  )
}

export default IndexPopup
