import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const UPDATED = "April 28, 2026";

const Cookies = () => {
  return (
    <>
      <SEO
        title="Cookie Policy — Cats Can Dance"
        description="The cookies and local storage Cats Can Dance uses, why, and how to opt out."
        path="/cookies"
      />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className="pt-32 pb-20 border-b-4 border-ink bg-cream text-ink">
          <div className="container max-w-3xl">
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cookies" }]} />
            <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-4">COOKIE POLICY</h1>
            <p className="text-ink/70">Last updated: {UPDATED}</p>
          </div>
        </section>

        <article className="container max-w-3xl py-16 prose prose-lg prose-headings:font-display prose-headings:text-ink prose-a:text-magenta">
          <p>We try to keep cookies minimal. Here's the full list.</p>

          <h2>Essential</h2>
          <ul>
            <li><strong>Session</strong> — keeps admin users signed in. Cleared when you log out.</li>
            <li><strong>Cart</strong> — local storage only, holds your shop cart between visits.</li>
            <li><strong>Theme</strong> — local storage, remembers your selected theme.</li>
          </ul>

          <h2>Analytics (anonymous)</h2>
          <p>
            We use a privacy-friendly analytics tool (Plausible) that does not use cookies and does not collect
            personal data. If we ever switch providers we'll update this page.
          </p>

          <h2>Embeds</h2>
          <p>
            Pages that embed YouTube, Spotify, or Instagram may set cookies from those services when you load them.
            Their cookie policies apply.
          </p>

          <h2>How to opt out</h2>
          <p>
            You can clear cookies and local storage from your browser settings at any time. Disabling essential cookies
            may break the cart and admin login.
          </p>

          <h2>Contact</h2>
          <p>
            Questions? <a href="mailto:hello@catscandance.com">hello@catscandance.com</a>.
          </p>
        </article>

        <Footer />
      </main>
    </>
  );
};

export default Cookies;
