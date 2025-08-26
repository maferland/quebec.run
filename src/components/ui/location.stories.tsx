import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Location,
  LocationCard,
  LocationInline,
  LocationCompact,
} from './location'

const meta = {
  title: 'UI/Location',
  component: Location,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'card', 'inline'],
    },
    showIcon: {
      control: 'boolean',
    },
    truncate: {
      control: 'boolean',
    },
    compact: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Location>

export default meta
type Story = StoryObj<typeof meta>

const sampleAddress = '250 3e Rue, Québec, QC G1L 2B3'
const longAddress = '2000 Boulevard de Montmorency, Québec, QC G1J 5E7, Canada'

export const Default: Story = {
  args: {
    address: sampleAddress,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Variant</h3>
        <Location address={sampleAddress} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Card Variant</h3>
        <Location address={sampleAddress} variant="card" />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Inline Variant</h3>
        <Location address={sampleAddress} variant="inline" />
      </div>
    </div>
  ),
}

export const WithTruncation: Story = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <div>
        <h4 className="font-semibold mb-2">Without Truncation</h4>
        <Location address={longAddress} variant="card" truncate={false} />
      </div>

      <div>
        <h4 className="font-semibold mb-2">With Truncation</h4>
        <Location address={longAddress} variant="card" truncate={true} />
      </div>
    </div>
  ),
}

export const WithoutIcon: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Location address={sampleAddress} variant="default" showIcon={false} />
      <Location address={sampleAddress} variant="card" showIcon={false} />
      <Location address={sampleAddress} variant="inline" showIcon={false} />
    </div>
  ),
}

export const Compact: Story = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <div>
        <h4 className="font-semibold mb-2">Regular</h4>
        <Location address={sampleAddress} variant="card" />
      </div>

      <div>
        <h4 className="font-semibold mb-2">Compact (no label)</h4>
        <Location address={sampleAddress} variant="card" compact={true} />
      </div>
    </div>
  ),
}

export const ConvenienceComponents: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-3">LocationCard</h3>
        <LocationCard address={longAddress} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">LocationInline</h3>
        <LocationInline address={sampleAddress} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">LocationCompact</h3>
        <LocationCompact address={sampleAddress} />
      </div>
    </div>
  ),
}

export const EventCardExample: Story = {
  render: () => (
    <div className="max-w-sm bg-white p-4 rounded-lg border shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-primary mb-1">
          6AM Club Limoilou
        </h3>
        <p className="text-xs text-accent">6AM Club</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
            5-8 km
          </span>
          <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs">
            Rythme modéré
          </span>
        </div>
      </div>

      <div className="mt-auto">
        <LocationCard address="250 3e Rue, Québec, QC G1L 2B3" />
      </div>
    </div>
  ),
}

export const ClubCardExample: Story = {
  render: () => (
    <div className="max-w-md bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary font-bold">6AM</span>
        </div>
        <div>
          <h3 className="font-bold text-primary">6AM Club Limoilou</h3>
          <LocationInline address="Québec City" />
        </div>
      </div>

      <p className="text-accent text-sm mb-4">
        Join us for morning runs through the historic Limoilou neighborhood.
      </p>

      <div className="bg-gray-50 rounded-lg p-3">
        <LocationCompact address="Various locations in Limoilou" />
      </div>
    </div>
  ),
}

export const ResponsiveExample: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Resize the viewport to see how locations adapt
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationCard address={longAddress} />
        <LocationCard address={sampleAddress} />
      </div>
    </div>
  ),
}
