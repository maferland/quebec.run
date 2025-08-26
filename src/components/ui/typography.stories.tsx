import type { Meta, StoryObj } from '@storybook/nextjs'
import { Typography, Heading, Text, Caption, Overline } from './typography'

const meta = {
  title: 'UI/Typography',
  component: Typography,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'heading1',
        'heading2',
        'heading3',
        'heading4',
        'heading5',
        'heading6',
        'body',
        'bodyLarge',
        'bodySmall',
        'caption',
        'overline',
      ],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'muted', 'inherit'],
    },
    weight: {
      control: 'select',
      options: ['light', 'normal', 'medium', 'semibold', 'bold'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
    },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'],
    },
  },
} satisfies Meta<typeof Typography>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'This is default typography text',
  },
}

export const AllHeadings: Story = {
  args: { children: 'Typography' },
  render: () => (
    <div className="space-y-4">
      <Typography variant="heading1" color="primary">
        Heading 1 - Discover Running in Quebec City
      </Typography>
      <Typography variant="heading2" color="primary">
        Heading 2 - Featured Run Clubs
      </Typography>
      <Typography variant="heading3" color="primary">
        Heading 3 - Upcoming Events
      </Typography>
      <Typography variant="heading4" color="primary">
        Heading 4 - Event Details
      </Typography>
      <Typography variant="heading5" color="primary">
        Heading 5 - Section Title
      </Typography>
      <Typography variant="heading6" color="primary">
        Heading 6 - Subsection
      </Typography>
    </div>
  ),
}

export const BodyText: Story = {
  args: { children: 'Typography' },
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <Typography variant="bodyLarge" color="accent">
        Large body text: Connect with local running clubs, find upcoming events,
        and explore scenic routes through Quebec City&apos;s historic
        neighborhoods.
      </Typography>
      <Typography variant="body" color="accent">
        Regular body text: This is the standard text size used for most content
        throughout the application. It provides good readability while
        maintaining visual hierarchy.
      </Typography>
      <Typography variant="bodySmall" color="accent">
        Small body text: Used for secondary information, metadata, and
        supporting details that don&apos;t need as much visual weight.
      </Typography>
    </div>
  ),
}

export const Colors: Story = {
  args: { children: 'Typography' },
  render: () => (
    <div className="space-y-2">
      <Typography variant="body" color="primary">
        Primary color text
      </Typography>
      <Typography variant="body" color="secondary">
        Secondary color text
      </Typography>
      <Typography variant="body" color="accent">
        Accent color text
      </Typography>
      <Typography variant="body" color="muted">
        Muted color text
      </Typography>
      <div className="bg-primary p-4 rounded-lg">
        <Typography variant="body" color="inherit" className="text-white">
          Inherit color text (white on primary background)
        </Typography>
      </div>
    </div>
  ),
}

export const Weights: Story = {
  args: { children: 'Typography' },
  render: () => (
    <div className="space-y-2">
      <Typography variant="body" weight="light">
        Light weight text
      </Typography>
      <Typography variant="body" weight="normal">
        Normal weight text
      </Typography>
      <Typography variant="body" weight="medium">
        Medium weight text
      </Typography>
      <Typography variant="body" weight="semibold">
        Semibold weight text
      </Typography>
      <Typography variant="body" weight="bold">
        Bold weight text
      </Typography>
    </div>
  ),
}

export const Alignment: Story = {
  args: { children: 'Typography' },
  render: () => (
    <div className="space-y-4 max-w-md">
      <Typography variant="body" align="left">
        Left aligned text - this is the default alignment for most content.
      </Typography>
      <Typography variant="body" align="center">
        Center aligned text - useful for headings and call-to-action sections.
      </Typography>
      <Typography variant="body" align="right">
        Right aligned text - sometimes used for metadata or secondary
        information.
      </Typography>
      <Typography variant="body" align="justify">
        Justified text - distributes text evenly across the line width, creating
        clean edges on both sides. This is useful for longer paragraphs where
        you want a more formal, book-like appearance.
      </Typography>
    </div>
  ),
}

export const ConvenienceComponents: Story = {
  args: { children: 'Typography' },
  render: () => (
    <div className="space-y-4">
      <Heading level={1} color="primary">
        Heading Component (Level 1)
      </Heading>
      <Heading level={3} color="secondary">
        Heading Component (Level 3)
      </Heading>
      <Text color="accent">Text Component - shorthand for body text</Text>
      <Caption color="muted">
        Caption Component - for small text and metadata
      </Caption>
      <Overline color="accent">Overline Component</Overline>
    </div>
  ),
}

export const RealWorldExample: Story = {
  args: { children: 'Typography' },
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div>
        <Heading level={1} color="primary" className="mb-2">
          6AM Club Limoilou
        </Heading>
        <Caption color="muted" className="mb-4">
          6AM Club • Wed, Sep 4 • 06:00
        </Caption>
        <Text color="accent" className="mb-4">
          Course matinale dans le quartier Limoilou. Rejoignez-nous pour un
          parcours de 5-8 km à un rythme modéré à travers les rues pittoresques
          de ce quartier historique.
        </Text>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Heading level={6} color="primary">
              Location
            </Heading>
          </div>
          <Text color="accent">250 3e Rue, Québec, QC G1L 2B3</Text>
        </div>
      </div>
    </div>
  ),
}

export const CustomElement: Story = {
  args: {
    variant: 'heading2',
    as: 'div',
    color: 'primary',
    children: 'Heading 2 styled text rendered as a div element',
  },
}

export const ResponsiveHeadings: Story = {
  args: { children: 'Typography' },
  render: () => (
    <div className="space-y-4">
      <Typography variant="heading1" color="primary">
        Responsive H1 - scales from 4xl to 5xl
      </Typography>
      <Typography variant="heading2" color="primary">
        Responsive H2 - scales from 3xl to 4xl
      </Typography>
      <Typography variant="heading3" color="primary">
        Responsive H3 - scales from 2xl to 3xl
      </Typography>
      <p className="text-sm text-muted">
        Resize the viewport to see how headings scale responsively
      </p>
    </div>
  ),
}
