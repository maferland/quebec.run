<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents** _generated with [DocToc](https://github.com/thlorenz/doctoc)_

- [Quebec.run Development Roadmap](#quebecrun-development-roadmap)
  - [Project Vision](#project-vision)
  - [Current Sprint: Foundation (v0.1)](#current-sprint-foundation-v01)
  - [Core Features (v1.0)](#core-features-v10)
    - [Club Management](#club-management)
    - [Event Types (All Supported)](#event-types-all-supported)
    - [Content Strategy](#content-strategy)
    - [Technical Features](#technical-features)
  - [Future Backlog (v2.0+)](#future-backlog-v20)
    - [Smart Features](#smart-features)
    - [Integrations](#integrations)
    - [Community Features](#community-features)
    - [Business Development](#business-development)
  - [Technical Architecture](#technical-architecture)
    - [Core Stack](#core-stack)
    - [External APIs](#external-apis)
    - [Deployment](#deployment)
  - [Success Metrics](#success-metrics)
  - [Notes](#notes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Quebec.run Development Roadmap

## Project Vision

A bilingual (French/English) platform aggregating running clubs, events, and community in Quebec City metro area. Focus on local depth and community engagement over global coverage.

## Current Sprint: Foundation (v0.1)

- [x] Project setup and database schema
- [ ] Admin user seed (me@maferland.com)
- [ ] Basic club directory with admin tools
- [ ] Bilingual UI framework
- [ ] Map interface with club markers
- [ ] Calendar view for events
- [ ] Strava API integration planning

## Core Features (v1.0)

### Club Management

- **Manual clubs**: Hand-curated with full details
- **Strava-synced clubs**: Auto-sync club info and planned runs via cron
- **Mixed approach**: Some clubs both manual + Strava enhanced
- **User ownership**: Clubs "owned" by registered users (admin can transfer)
- **Admin oversight**: Admin can edit any content

### Event Types (All Supported)

- Group runs and races
- Training runs (intervals, tempo, track)
- Social events (post-run brunches, meetups)
- Volunteer opportunities (race marshaling, trail maintenance)

### Content Strategy

- **Geographic scope**: Quebec City metro area
- **Bilingual**: French/English UI, clubs submit in preferred language
- **Manual vetting**: Simple admin dashboard for approval
- **Authentication required**: All submissions require login

### Technical Features

- **Recurrence system**: Calendar-style scheduling for regular runs
- **Missing locations**: Hide map pins when location unavailable
- **Responsive design**: Mobile-first for on-the-go runners
- **Privacy-focused**: Use Plausible/Matomo over Google Analytics

## Future Backlog (v2.0+)

### Smart Features

- **Pattern detection**: Auto-detect recurring runs from Strava activity history
- **Automatic translation**: French/English content translation
- **Advanced notifications**: Email/SMS reminders for saved events
- **Social features**: User profiles, run tracking, group messaging

### Integrations

- **Calendar export**: iCal/Google Calendar sync
- **Strava integration**: Deep linking to club groups
- **Weather integration**: Show conditions for planned runs
- **Route mapping**: Popular routes and segments

### Community Features

- **User reviews**: Rate and review clubs/events
- **Photo sharing**: Club run galleries
- **Achievement system**: Badges for participation
- **Mentorship**: Connect beginners with experienced runners

### Business Development

- **Sponsorship system**: Local business partnerships
- **Affiliate integration**: Training apps, gear discounts
- **Premium features**: Enhanced listings, priority support
- **Merchandise**: Quebec.run branded gear

## Technical Architecture

### Core Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **Maps**: Leaflet (OpenStreetMap)
- **Calendar**: FullCalendar
- **Internationalization**: next-intl

### External APIs

- **Strava API**: Club data synchronization
- **OpenStreetMap**: Mapping and geocoding
- **Weather API**: Conditions for events (future)

### Deployment

- **Hosting**: Vercel
- **Database**: Vercel Postgres
- **Domain**: quebec.run
- **CDN**: Vercel Edge Network

## Success Metrics

- **Content**: Number of clubs/events listed
- **Engagement**: Monthly active users
- **Community**: Submission rate, newsletter subscribers
- **Local impact**: Partnerships with local businesses

## Notes

- Start small, focus on quality over quantity
- Community engagement is more important than revenue initially
- Build relationships with local running community
- Maintain data accuracy through combination of automation and curation
