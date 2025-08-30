import type { Preview } from '@storybook/nextjs'
import React from 'react'
import '../src/app/globals.css'
import { IntlDecorator } from '../src/lib/storybook-utils'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story, context) => (
      <IntlDecorator locale={context.globals.locale}>
        <Story />
      </IntlDecorator>
    ),
  ],
  globalTypes: {
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'fr', title: 'Français' },
        ],
        showName: true,
      },
    },
  },
}

export default preview
