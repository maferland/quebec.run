import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.privacy' })

  return {
    title: t('title'),
  }
}

export default function PrivacyPage() {
  const t = useTranslations('legal.privacy')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-8">{t('lastUpdated')}</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            quebec.run (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy and is
            committed to protecting your personal information. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information in compliance with Quebec&apos;s Law 25 and applicable privacy
            laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold mb-2">2.1 Account Information</h3>
          <ul className="list-disc ml-6 space-y-2 mb-4">
            <li>Email address (required)</li>
            <li>Name (optional)</li>
            <li>Profile photo (optional)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.2 Content You Provide</h3>
          <ul className="list-disc ml-6 space-y-2 mb-4">
            <li>Club information (name, description, social media links)</li>
            <li>Event information (title, date, time, location, description)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.3 Technical Information</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>IP address (for consent audit trail)</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Usage data (pages visited, features used)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Provide and maintain the Platform</li>
            <li>Authenticate your account</li>
            <li>Display your clubs and events to other users</li>
            <li>Send you service-related communications</li>
            <li>Improve and optimize the Platform</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing</h2>
          <p>We process your personal information based on:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Your consent (by using the Platform)</li>
            <li>Contract performance (to provide services you requested)</li>
            <li>Legal obligations (compliance with applicable laws)</li>
            <li>Legitimate interests (improving and securing the Platform)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal information. We may share information
            with:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Public Display:</strong> Club and event information you
              create is publicly visible
            </li>
            <li>
              <strong>Service Providers:</strong> Third-party services that help
              us operate (hosting, email delivery)
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to
              protect rights and safety
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights (Law 25 Compliance)</h2>
          <p>Under Quebec&apos;s Law 25, you have the right to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Access:</strong> Request access to your personal information
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate data
            </li>
            <li>
              <strong>Portability:</strong> Export your data in a structured format
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your account and data
              (30-day grace period)
            </li>
            <li>
              <strong>Withdrawal of Consent:</strong> You may withdraw consent at
              any time by deleting your account
            </li>
          </ul>
          <p className="mt-4">
            To exercise these rights, visit your Privacy Settings or contact us
            at privacy@quebec.run.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <p>We retain your information:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>As long as your account is active</li>
            <li>For 30 days after deletion request (grace period)</li>
            <li>As required by law for legal, accounting, or audit purposes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your information, including:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Secure data storage with reputable providers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. International Transfers</h2>
          <p>
            Your information may be stored and processed in servers located
            outside Quebec. We ensure adequate protections are in place for any
            international data transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
          <p>
            The Platform is not intended for users under 13 years of age. We do
            not knowingly collect information from children. If we discover we
            have collected information from a child, we will delete it promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of material changes by email or prominent notice on the Platform.
            Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or to exercise your rights,
            contact:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> privacy@quebec.run
            <br />
            <strong>Privacy Officer:</strong> quebec.run Privacy Team
          </p>
        </section>
      </div>
    </div>
  )
}
