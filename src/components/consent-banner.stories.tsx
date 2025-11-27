import type { Meta, StoryObj } from '@storybook/nextjs'
import { ConsentBanner } from './consent-banner'

const meta: Meta<typeof ConsentBanner> = {
  title: 'Components/ConsentBanner',
  component: ConsentBanner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onAccept: () => console.log('Consent accepted'),
  },
}
