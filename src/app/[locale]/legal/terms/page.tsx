import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.terms' })

  return {
    title: t('title'),
  }
}

export default async function TermsPage() {
  const t = await getTranslations('legal.terms')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-8">{t('lastUpdated')}</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using quebec.run (&quot;the Platform&quot;), you
            accept and agree to be bound by these Terms of Service. If you do
            not agree, please do not use the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Description of Service
          </h2>
          <p>
            quebec.run is a platform for discovering running clubs and events in
            Quebec City. We provide tools for club organizers to manage their
            clubs and events, and for runners to discover and participate in
            local running activities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p>
            To access certain features, you must create an account using a valid
            email address. You are responsible for maintaining the
            confidentiality of your account and for all activities under your
            account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
          <p>
            You may submit information about running clubs and events. You
            retain ownership of content you submit, but grant us a license to
            use, display, and distribute that content on the Platform.
          </p>
          <p>
            You represent that your content does not violate any third-party
            rights or applicable laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Post false, misleading, or fraudulent information</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to the Platform</li>
            <li>Interfere with the proper functioning of the Platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Privacy</h2>
          <p>
            Your use of the Platform is subject to our Privacy Policy, which
            describes how we collect, use, and protect your personal
            information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will
            notify users of material changes. Continued use of the Platform
            after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
          <p>
            We may terminate or suspend your account at any time for violations
            of these Terms. You may request deletion of your account at any time
            through your account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
          <p>
            The Platform is provided &quot;as is&quot; without warranties of any
            kind. We do not guarantee the accuracy, completeness, or reliability
            of any content on the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            10. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, quebec.run shall not be
            liable for any indirect, incidental, special, or consequential
            damages arising from your use of the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Province of Quebec and
            the laws of Canada applicable therein. Any disputes shall be
            resolved in the courts of Quebec.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
          <p>
            For questions about these Terms, contact us at legal@quebec.run.
          </p>
        </section>
      </div>
    </div>
  )
}
