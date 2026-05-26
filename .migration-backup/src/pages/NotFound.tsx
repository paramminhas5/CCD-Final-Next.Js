import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO title="404 — Cats Can Dance" description="This page wandered off. Head back home." path="/404" noindex />
      <main className="bg-background text-foreground min-h-screen">
        <Nav />
        <section className="container pt-40 pb-32 text-center">
          <p className="font-display text-magenta text-2xl md:text-3xl mb-4">/ 404</p>
          <h1 className="font-display text-ink text-7xl md:text-9xl leading-[0.85] mb-6">
            LOST<br/>IN THE<br/><span className="text-magenta">MIX.</span>
          </h1>
          <p className="text-ink/80 font-medium text-lg max-w-md mx-auto mb-10">
            This page doesn't exist — or it left the party early. Either way, the floor's still open.
          </p>
          <Link
            to="/"
            className="inline-block bg-acid-yellow text-ink font-display text-2xl px-8 py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
          >
            BACK HOME →
          </Link>
        </section>
        <Footer />
      </main>
    </>
  );
};

export default NotFound;
