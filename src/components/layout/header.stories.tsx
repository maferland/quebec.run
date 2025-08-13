import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './header'
import {
  withLoggedOutSession,
  withLoadingSession,
  withUserSession,
  withAdminSession,
  withUserSessionNoName,
} from '@/lib/storybook-utils'

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {
  decorators: [withLoggedOutSession],
}

export const Loading: Story = {
  decorators: [withLoadingSession],
}

export const LoggedInUser: Story = {
  decorators: [withUserSession],
}

export const LoggedInAdmin: Story = {
  decorators: [withAdminSession],
}

export const LoggedInUserWithoutName: Story = {
  decorators: [withUserSessionNoName],
}