import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const UPDATED = "April 28, 2026";

const Terms = () => {
  return (
    <>
      <SEO
        title="Terms of Use — Cats Can Dance"
        description="The rules for using catscandance.com — RSVPs, door policy, shop orders, IP, and disclaimers."
        path="/terms"
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className="pt-32 pb-20 border-b-4 border-ink bg-cream text-ink">
          <div className="container max-w-3xl">
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Terms" }]} />
            <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-4">TERMS OF USE</h1>
            <p className="text-ink/70">Last updated: {UPDATED}</p>
          </div>
        </section>

        <article className="container max-w-3xl py-16 prose prose-lg prose-headings:font-display prose-headings:text-ink prose-a:text-magenta">
          <h2>1. Who we are</h2>
          <p>
            Cats Can Dance ("CCD") is a Bangalore-based crew running music events and a streetwear label. By using
            this site you agree to these terms.
          </p>

          <h2>2. Site use</h2>
          <p>
            Use the site for personal, non-commercial purposes. Don't scrape, attack, reverse-engineer, or use it to
            harass anyone. We may suspend access if you do.
          </p>

          <h2>3. RSVPs and door policy</h2>
          <ul>
            <li>An RSVP is a request, not a guarantee of entry. Capacity and door discretion apply.</li>
            <li>You must be 18+ to attend (ID required).</li>
            <li>We reserve the right to refuse entry for safety, conduct, or capacity reasons.</li>
            <li>Photo and video may be captured at events for editorial use; tell us at the door if you'd rather not appear.</li>
          </ul>

          <h2>4. Shop orders</h2>
          <p>
            Orders are processed by Shopify. Pricing, shipping, returns, refunds, and order disputes are governed by
            our Shopify store policies, which apply alongside these terms. Drops are limited and sold first-come,
            first-served.
          </p>

          <h2>5. Intellectual property</h2>
          <p>
            All artwork, logos, photography, copy, and designs on this site are the property of Cats Can Dance or used
            with permission. Don't reproduce, remix, or resell without written consent.
          </p>

          <h2>6. User content</h2>
          <p>
            If you submit anything (e.g. a contact message, photo, tag), you grant us a non-exclusive, worldwide,
            royalty-free license to use it for our editorial and promotional work, with credit where reasonable.
          </p>

          <h2>7. Third-party links and embeds</h2>
          <p>
            We link to and embed content from YouTube, Spotify, Instagram and others. We aren't responsible for their
            content or practices.
          </p>

          <h2>8. Disclaimers</h2>
          <p>
            The site is provided "as is". We don't warrant it'll be uninterrupted or error-free. Event details (date,
            venue, lineup) can change — we'll do our best to notify you when they do.
          </p>

          <h2>9. Liability</h2>
          <p>
            To the fullest extent permitted by law, CCD isn't liable for indirect or consequential losses arising from
            site use or event attendance. Nothing here limits liability that can't be limited under applicable law.
          </p>

          <h2>10. Governing law</h2>
          <p>
            These terms are governed by the laws of India. Disputes fall under the exclusive jurisdiction of the courts
            in Bangalore, Karnataka.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions? Write to <a href="mailto:hello@catscandance.com">hello@catscandance.com</a>.
          </p>
        </article>

        <Footer />
      </main>
    </>
  );
};

export default Terms;
