import type { Meta, StoryObj } from '@storybook/nextjs'
import { Card } from './card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'accent', 'interactive'],
    },
    as: {
      control: 'select',
      options: ['div', 'section', 'article'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Default Card</h3>
        <p className="text-gray-600">
          This is a basic card with default styling.
        </p>
      </div>
    ),
  },
}

export const Accent: Story = {
  args: {
    variant: 'accent',
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Accent Card</h3>
        <p className="text-gray-600">
          This card has a colored left border accent.
        </p>
      </div>
    ),
  },
}

export const Interactive: Story = {
  args: {
    variant: 'interactive',
    children: (
      <div>
        <h3 className="text-lg font-bold mb-2">Interactive Card</h3>
        <p className="text-gray-600">
          This card is clickable with hover effects.
        </p>
      </div>
    ),
  },
}
