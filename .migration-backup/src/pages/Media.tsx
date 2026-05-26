import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Breadcrumbs from "@/components/Breadcrumbs";
import Media from "@/components/Media";
import SEO from "@/components/SEO";

const MediaPage = () => (
  <>
    <SEO
      title="Press & Media Kit | Cats Can Dance"
      description="Press features, journal entries and stories from Cats Can Dance — Bangalore's underground crew, apparel drops and culture."
      path="/media"
    />
    <main className="bg-background text-foreground min-h-screen">
      <Nav />
      <PageHero
        eyebrow="MEDIA & PRESS"
        title={<>SEEN.<br/>HEARD.<br/>WORN.</>}
        bg="bg-orange"
        textColor="text-ink"
        eyebrowColor="text-magenta"
        shadow={false}
      />
      <div className="container pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Media" }]} />
      </div>
      <Media />
      <Footer />
    </main>
  </>
);

export default MediaPage;
