import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const UPDATED = "April 28, 2026";

const Privacy = () => {
  return (
    <>
      <SEO
        title="Privacy Policy — Cats Can Dance"
        description="How Cats Can Dance collects, uses, and protects your data — RSVPs, signups, shop orders, cookies, and your rights."
        path="/privacy"
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className="pt-32 pb-20 border-b-4 border-ink bg-cream text-ink">
          <div className="container max-w-3xl">
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Privacy" }]} />
            <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-4">PRIVACY POLICY</h1>
            <p className="text-ink/70">Last updated: {UPDATED}</p>
          </div>
        </section>

        <article className="container max-w-3xl py-16 prose prose-lg prose-headings:font-display prose-headings:text-ink prose-a:text-magenta">
          <p>
            Cats Can Dance ("CCD", "we", "us") runs underground music nights, a streetwear label, and this website
            at <a href="https://catscandance.com">catscandance.com</a>. This policy explains what we collect, why,
            and what you can do about it. We try to keep it short and human.
          </p>

          <h2>1. What we collect</h2>
          <ul>
            <li><strong>RSVPs &amp; signups</strong> — your name, email, phone (if you provide it), and the event you RSVP'd to.</li>
            <li><strong>Contact form</strong> — your name, email, and message.</li>
            <li><strong>Shop orders</strong> — handled by Shopify. We don't store card details. See Shopify's privacy policy.</li>
            <li><strong>Cart state</strong> — kept in your browser's local storage so your cart survives a refresh.</li>
            <li><strong>Analytics</strong> — anonymous, aggregated traffic data (page views, country, referrer). No personal profiles, no cross-site tracking.</li>
            <li><strong>Cookies</strong> — only what's needed to keep you logged into admin tools and to remember your theme. See <a href="/cookies">Cookies</a>.</li>
          </ul>

          <h2>2. Why we collect it</h2>
          <ul>
            <li>To confirm your RSVP and tell you about the event you signed up for.</li>
            <li>To fulfill orders from the shop.</li>
            <li>To reply to messages you send us.</li>
            <li>To understand which pages/events resonate so we can build better ones.</li>
          </ul>

          <h2>3. Where it's stored</h2>
          <p>
            Site data lives in our managed backend (Supabase, EU/US regions). Shop data lives in Shopify. Email is sent
            via standard transactional providers. Embedded content (YouTube, Spotify, Instagram) loads from those
            services and is governed by their own privacy policies.
          </p>

          <h2>4. Who we share with</h2>
          <p>
            We don't sell your data. We share only with vendors required to operate the site (hosting, email, payments,
            analytics) and only what they need. We may disclose data if compelled by law.
          </p>

          <h2>5. Your rights</h2>
          <p>
            You can ask us to access, correct, or delete your data at any time. Email
            {" "}<a href="mailto:hello@catscandance.com">hello@catscandance.com</a> and we'll handle it within 30 days.
            You can unsubscribe from any marketing email via the link at the bottom of that email.
          </p>

          <h2>6. Retention</h2>
          <p>
            RSVPs and signups are kept for up to 24 months after the relevant event so we can run our community.
            Order data is retained per Indian tax law. Anonymous analytics is kept indefinitely in aggregate.
          </p>

          <h2>7. Children</h2>
          <p>
            The site and our events are intended for people 18+. We don't knowingly collect data from children.
          </p>

          <h2>8. Changes</h2>
          <p>
            If we materially change this policy we'll update the "Last updated" date at the top and, where appropriate,
            notify you by email.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions? Write to <a href="mailto:hello@catscandance.com">hello@catscandance.com</a>. We're based in
            Bangalore, Karnataka, India.
          </p>
        </article>

        <Footer />
      </main>
    </>
  );
};

export default Privacy;
