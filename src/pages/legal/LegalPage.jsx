import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '../../components/common/Logo'

const DOCS = {
  terms: {
    title: 'Terms & Conditions',
    updated: 'Last updated: 12 August 2026',
    intro:
      'These Terms & Conditions govern your use of BETVORA and form a binding agreement between you and BETVORA when you access the platform, create an account, or place a bet. BETVORA is a real-money sports betting service for players aged 18 and over — your balance, bets and payouts carry real value.',
    sections: [
      {
        h: '1. Eligibility and account creation',
        body: [
          'To use BETVORA you must be at least 18 years old, have legal capacity to enter into an agreement, and reside in a jurisdiction where online sports betting is lawful. In Ghana, gaming is regulated by the Gaming Commission of Ghana under the Gaming Act, 2006 (Act 721).',
          'When registering you must provide accurate and complete information — your full name as it appears on your ID, date of birth, a mobile number registered in your name, and your national identification details. You must keep this information up to date.',
        ],
      },
      {
        h: '2. Your responsibilities',
        body: [
          'By using BETVORA you agree to: keep your login details confidential; use only payment and mobile money details that belong to you; bet only for yourself and not on behalf of another person; act honestly and not attempt to exploit errors or vulnerabilities; and contact support promptly if you believe your account has been compromised.',
        ],
      },
      {
        h: '3. Account security and verification',
        body: [
          'We may carry out identity and age verification at any time to protect customers, prevent fraud and comply with regulatory requirements. In Ghana, licensed operators are required to verify customer identity against the National Identification Authority (NIA) database, and under Legislative Instrument 2111 the Ghana Card is the primary identification for online gaming.',
          'We may restrict deposits, withdrawals or betting until verification is completed. If you provide false or misleading information, we may suspend or close your account.',
        ],
      },
      {
        h: '4. Deposits and withdrawals',
        body: [
          'Deposits are made by sending funds to the BETVORA Telecel Cash merchant number shown on the deposit screen and submitting the transaction reference for verification. Every deposit is checked manually before it is credited, so please keep your confirmation message. Withdrawals are requested in the app and paid to the mobile money or bank account registered in your name, subject to verification and security checks.',
          'The name on your account must match the name registered to any mobile money wallet or payment method used. Withdrawals may be delayed for review in cases of suspected fraud, account misuse, or regulatory compliance checks.',
        ],
      },
      {
        h: '5. Bets, games, and settlement',
        body: [
          'All betting activity is subject to the betting rules and market-specific definitions displayed on the platform. A bet is valid only once accepted and recorded in your account. Settlement is performed according to official results, and in some circumstances (such as abandoned events or clear errors) bets may be voided or corrected.',
          'In multi-bets, a single losing leg voids the whole slip. Cash-out, where offered, fixes your return at the value shown when you confirm.',
        ],
      },
      {
        h: '6. Bonuses and promotions',
        body: [
          'BETVORA may offer promotional bonuses or free-bet rewards. Each offer may carry specific conditions such as wagering requirements, maximum winnings, time limits, restricted markets and anti-abuse rules. Where a promotion has separate terms, those terms apply in addition to these Terms & Conditions.',
          'We may withhold promotional benefits, adjust bonus balances, or void related bets if we reasonably believe a promotion is being abused.',
        ],
      },
      {
        h: '7. Prohibited activities',
        body: [
          'You must not use the service for unlawful purposes or in a way that undermines platform integrity. Prohibited activities include: creating or using multiple accounts to gain an unfair advantage; sharing or transferring accounts; manipulating markets or coordinating bets with others; using automated tools, scripts or bots; and abusing chargebacks or placing bets with funds obtained unlawfully.',
          'Only one account per person is permitted, and no account may be re-registered under a new name, email or phone number.',
        ],
      },
      {
        h: '8. Responsible gaming',
        body: [
          'We encourage responsible gaming and provide tools to help you manage your play. Underage gambling is illegal in Ghana and is taken seriously. We reserve the right to carry out verification checks to ensure all account holders are at least 18 years old and may suspend an account until adequate verification is received.',
          'If gambling is no longer under control, contact the Gaming Commission of Ghana for help and support at 0274 698 935 / 0540 132 100, or request self-exclusion from BETVORA via support@betvora.app.',
        ],
      },
      {
        h: '9. Suspension and closure of accounts',
        body: [
          'We may suspend, restrict, or close an account in situations including suspected fraud, breach of these Terms & Conditions, misuse of promotions, provision of false information, or where required for compliance. If your account is suspended, we may investigate and request additional information.',
        ],
      },
      {
        h: '10. Errors and technical issues',
        body: [
          'The service is provided on an "as available" basis. If an error affects odds, markets, account balances, or settlement, we may take reasonable steps to correct the error — including voiding affected bets, reversing incorrect transactions, or adjusting balances to reflect what should have happened without the error.',
        ],
      },
      {
        h: '11. Intellectual property',
        body: [
          'All platform content, software, designs, logos and trademarks are owned by or licensed to BETVORA. You may use the service for personal, non-commercial entertainment only and must not copy, modify, distribute, reverse engineer, or exploit it without permission.',
        ],
      },
      {
        h: '12. Limitation of liability',
        body: [
          'To the extent permitted by law, BETVORA is not responsible for losses arising from factors beyond reasonable control, including network interruptions, device problems, or third-party payment processing delays. Nothing in these Terms & Conditions limits rights that cannot be limited under applicable law.',
        ],
      },
      {
        h: '13. Complaints and dispute handling',
        body: [
          'If you have a complaint, contact support at support@betvora.app with details of the issue and any relevant references. We will review your concern and respond within a reasonable time. For settlement questions, please provide bet references and the market details.',
        ],
      },
      {
        h: '14. Changes to the terms',
        body: [
          'We may update these Terms & Conditions to reflect changes in the service, risk controls, or legal and compliance obligations. The latest version will apply once posted, and continued use of BETVORA after an update indicates acceptance of the revised terms, as permitted by applicable law.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: 12 August 2026',
    intro:
      'BETVORA is committed to protecting and respecting your privacy and complies with applicable data protection law, including Ghana\u2019s Data Protection Act, 2012 (Act 843). This policy explains what information we handle, why, and the choices you have. Account and wallet data is stored securely in the cloud so you can access your balance on any device.',
    sections: [
      {
        h: '1. Data we collect',
        body: [
          'During registration and when you use your account, we collect personal data including: first and last name, date of birth, mobile phone number, email address, country, national identification type and number, referral code, and details of your transactions, bets and visits to the site. We may also request proof of identity and address documents for KYC before releasing withdrawals.',
        ],
      },
      {
        h: '2. Where your data lives',
        body: [
          'Your account profile, wallet balance, bets and payment requests are stored in Google Firebase (Cloud Firestore) so they stay in sync across the devices you sign in on. Your browser keeps a local cache for fast loading and offline continuity. Clearing your browser data removes that cache but not your account — sign in again to restore it.',
        ],
      },
      {
        h: '3. Why we process it',
        body: [
          'Your details are used to run your account, keep you signed in, verify logins, confirm your age and identity, operate your wallet in the correct currency, process deposits and withdrawals, settle bets, and prevent fraud. We obtain this data for specific and lawful purposes only and do not sell your personal information.',
        ],
      },
      {
        h: '4. Sharing and disclosure',
        body: [
          'We will disclose personal data when ordered to do so by a governing authority or under applicable law. This may include the Gaming Commission of Ghana, the National Identification Authority, law enforcement, or other regulators. For fraud detection and control purposes we may transfer personal data to third-party verification providers, and we may disclose data where we have reasonable grounds to suspect irregularities involving an account.',
        ],
      },
      {
        h: '5. Retention and security',
        body: [
          'Gaming regulation requires that we keep full records of financial and wagering transactions and any identification provided. We employ industry-standard security measures — encryption, access control and secure storage — to protect your data, and we retain it only as long as necessary for our legal and operational obligations.',
        ],
      },
      {
        h: '6. Your rights',
        body: [
          'You have the right to request access to your personal data, to correct inaccurate or incomplete data, and to request erasure where gaming regulations do not require us to retain it. You can edit your profile details in the app or contact support@betvora.app, and you may complain to the Data Protection Commission of Ghana if you are concerned about how your data is handled.',
        ],
      },
      {
        h: '7. Advertising',
        body: [
          'If advertising is enabled, Google AdSense may be used on pages with real content. Ads are never shown on the bet slip, notifications, or sign-in screens, and no ads are loaded unless you have consented. Personalised advertising requires separate, explicit consent; without it, only non-personalised ads can be served. You can change these choices at any time in Settings.',
        ],
      },
      {
        h: '8. Children',
        body: ['BETVORA is intended for people aged 18 and over. We do not knowingly collect data from anyone under 18 and will suspend any account found to belong to a minor.'],
      },
      {
        h: '9. Contact',
        body: ['Questions about this policy can be sent to support@betvora.app. We aim to reply within two working days.'],
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    updated: 'Last updated: 12 August 2026',
    intro:
      'Cookies are small text files stored on your device when you visit a website. BETVORA uses browser storage (localStorage) to keep you signed in, cache your account data and remember your preferences, and cookies may be used for advertising where you have consented. Some of this is essential; some is only used with your permission.',
    sections: [
      {
        h: '1. What cookies we use',
        body: [
          'Session cookies are stored temporarily while you browse and let you move between pages without re-entering details. Persistent cookies remember you as a returning visitor. The following items are stored in your browser:',
        ],
        list: [
          'betvora_session — keeps you signed in',
          'betvora_wallets — a cache of your balance and transaction history',
          'betvora_bets — a cache of your bet history',
          'betvora_deposit_requests / betvora_withdrawal_requests — your payment requests',
          'betvora_notifications — your notification history',
          'betvora_settings — your in-app preferences',
        ],
      },
      {
        h: '2. Why we use them',
        body: [
          'The primary uses of cookies on our platform are to: save your time and facilitate future access; help you navigate the site efficiently; remember preferences you select; identify how people use the site to improve our service and communications; and detect and prevent fraudulent transactions and abuse of customer accounts.',
        ],
      },
      {
        h: '3. Consent storage',
        body: ['These items record choices you make, rather than tracking you:'],
        list: [
          'betvora_cookie_consent — your answer to the consent banner',
          'betvora_ad_consent — whether advertising is allowed and whether it may be personalised',
        ],
      },
      {
        h: '4. Advertising cookies',
        body: [
          'Only if you allow ads and personalised advertising does Google AdSense set its own cookies. They help Google serve and measure ads and can be used for personalisation. No advertising cookies are set until you have consented, and your choice can be changed at any time in Settings under "Ads & Privacy".',
        ],
      },
      {
        h: '5. Managing cookies',
        body: [
          'You can amend your browser settings to block or delete some or all cookies and storage at any time — further guidance is available at allaboutcookies.org. Blocking essential storage may prevent you from staying signed in or seeing your cached data, but your account itself is held securely in the cloud.',
        ],
      },
      {
        h: '6. Contact',
        body: ['Questions about this policy can be sent to support@betvora.app.'],
      },
    ],
  },
}

export default function LegalPage({ doc }) {
  const content = DOCS[doc]
  return (
    <div className="min-h-screen bg-navy text-white">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/welcome" aria-label="BETVORA home">
            <Logo size={30} />
          </Link>
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/45 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black tracking-tight text-white">{content.title}</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/35">
          {content.updated}
        </p>
        <p className="mt-6 rounded-xl border border-white/5 bg-royal p-4 text-sm leading-relaxed text-white/60">
          {content.intro}
        </p>

        <div className="mt-10 space-y-8">
          {content.sections.map((section) => (
            <section key={section.h}>
              <h2 className="text-lg font-black text-white">{section.h}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-white/55">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-3 space-y-1.5">
                  {section.list.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-relaxed text-white/55">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                      <span>
                        <code className="text-white/80">{item.split(' — ')[0]}</code>
                        {item.includes(' — ') && ` — ${item.split(' — ')[1]}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-14 border-t border-white/5 pt-6 text-center text-xs text-white/30">
          BETVORA — 18+. Play responsibly. © {new Date().getFullYear()} BETVORA.
        </footer>
      </main>
    </div>
  )
}
