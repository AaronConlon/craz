import { Button } from './button'
import { Download, Heart, Plus, Settings } from 'lucide-react'

export function ButtonExamples() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Button Component Examples</h2>
        <p className="text-gray-600">
          基于 shadcn 风格的 Button 组件，支持多种变体和尺寸。
        </p>
      </div>

      {/* Variants */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* With Icons */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">With Icons</h3>
        <div className="flex flex-wrap gap-4">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button variant="secondary" className="gap-2">
            <Heart className="w-4 h-4" />
            Like
          </Button>
        </div>
      </section>

      {/* States */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div className="flex flex-wrap gap-4">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button className="loading">Loading...</Button>
        </div>
      </section>

      {/* Custom Styling */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Custom Styling</h3>
        <div className="flex flex-wrap gap-4">
          <Button className="bg-theme-primary-600 hover:bg-theme-primary-700">
            Custom Purple
          </Button>
          <Button className="bg-gradient-to-r from-pink-500 to-violet-500">
            Gradient
          </Button>
          <Button className="rounded-full">
            Rounded Full
          </Button>
        </div>
      </section>
    </div>
  )
} 