import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { COLORS, TIERS, SHOWS, STATS, WHO_SHOULD_SPONSOR, WHAT_YOU_GET } from "./sponsorData";

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: 36,
    fontFamily: "Helvetica",
  },
  pageDark: {
    backgroundColor: COLORS.ink,
    padding: 36,
    fontFamily: "Helvetica",
  },

  // Header (repeating)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ink,
  },
  headerDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.cream,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    letterSpacing: 1,
  },
  headerTitleLight: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.cream,
    letterSpacing: 1,
  },
  pageNum: {
    fontSize: 8,
    color: COLORS.ink,
    opacity: 0.5,
  },
  pageNumLight: {
    fontSize: 8,
    color: COLORS.cream,
    opacity: 0.5,
  },

  // Section headings
  sectionEyebrow: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.magenta,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  sectionEyebrowLight: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.acidYellow,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    lineHeight: 1.1,
    marginBottom: 10,
  },
  sectionTitleLight: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLORS.cream,
    lineHeight: 1.1,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.6,
    marginBottom: 16,
    opacity: 0.8,
  },
  sectionBodyLight: {
    fontSize: 10,
    color: COLORS.cream,
    lineHeight: 1.6,
    marginBottom: 16,
    opacity: 0.8,
  },

  // Hero page
  heroBg: {
    backgroundColor: COLORS.electricBlue,
    padding: 36,
    fontFamily: "Helvetica",
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: COLORS.cream,
    lineHeight: 1.05,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.85,
    lineHeight: 1.5,
    marginBottom: 20,
    maxWidth: 400,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 8,
    color: COLORS.cream,
    fontFamily: "Helvetica-Bold",
  },
  heroFooter: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroFooterText: {
    fontSize: 8,
    color: COLORS.cream,
    opacity: 0.7,
  },

  // Stats
  statsGrid: {
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.ink,
    padding: 12,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 8,
    color: COLORS.ink,
    opacity: 0.6,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  statValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },

  // Shows
  showCard: {
    backgroundColor: COLORS.ink,
    borderWidth: 2,
    borderColor: COLORS.ink,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  showNum: {
    fontSize: 8,
    color: COLORS.acidYellow,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  showName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.cream,
    marginBottom: 2,
  },
  showTagline: {
    fontSize: 7,
    color: COLORS.cream,
    opacity: 0.5,
    letterSpacing: 1,
  },
  showDate: {
    fontSize: 9,
    color: COLORS.cream,
    opacity: 0.8,
    fontFamily: "Helvetica-Bold",
  },
  showCapacity: {
    fontSize: 7,
    color: COLORS.cream,
    opacity: 0.5,
    marginTop: 2,
  },
  megaCard: {
    backgroundColor: COLORS.acidYellow,
    borderWidth: 3,
    borderColor: COLORS.ink,
    padding: 20,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  megaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.magenta,
    marginBottom: 4,
  },
  megaTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    marginBottom: 4,
  },
  megaDesc: {
    fontSize: 8,
    color: COLORS.ink,
    opacity: 0.7,
    lineHeight: 1.5,
    maxWidth: 300,
  },
  megaStat: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },
  megaStatLabel: {
    fontSize: 7,
    color: COLORS.ink,
    opacity: 0.6,
    textAlign: "right",
  },

  // Tier detail page
  tierSection: {
    marginBottom: 24,
  },
  tierCardFull: {
    borderWidth: 3,
    borderColor: COLORS.ink,
    overflow: "hidden",
    marginBottom: 20,
  },
  tierHeaderFull: {
    padding: 16,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.ink,
  },
  tierNameFull: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  tierScopeFull: {
    fontSize: 9,
    opacity: 0.8,
  },
  tierHeadlineFull: {
    fontSize: 8,
    opacity: 0.7,
    marginTop: 4,
    fontStyle: "italic",
  },
  tierBodyFull: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  tierDeliverablesFull: {
    marginBottom: 10,
  },
  tierBulletFull: {
    fontSize: 9,
    color: COLORS.ink,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  tierBestForFull: {
    fontSize: 8,
    color: COLORS.ink,
    opacity: 0.5,
    fontStyle: "italic",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.ink,
  },

  // Who should sponsor
  whoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  whoItem: {
    width: "23%",
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.ink,
    padding: 10,
    alignItems: "center",
  },
  whoText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    textAlign: "center",
    marginTop: 4,
  },

  // What you get
  benefitRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  benefitCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.ink,
    padding: 12,
  },
  benefitTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    marginBottom: 3,
  },
  benefitDesc: {
    fontSize: 8,
    color: COLORS.ink,
    opacity: 0.7,
    lineHeight: 1.4,
  },

  // CTA / closing page
  ctaPage: {
    backgroundColor: COLORS.magenta,
    padding: 36,
    fontFamily: "Helvetica",
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    color: COLORS.cream,
    textAlign: "center",
    lineHeight: 1.05,
    marginBottom: 16,
  },
  ctaBody: {
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.85,
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 24,
    maxWidth: 360,
  },
  ctaBox: {
    backgroundColor: COLORS.acidYellow,
    borderWidth: 3,
    borderColor: COLORS.ink,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  ctaBoxText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    textAlign: "center",
  },
  ctaContact: {
    marginTop: 20,
    fontSize: 9,
    color: COLORS.cream,
    opacity: 0.7,
    textAlign: "center",
  },
});

const PageHeader = ({ light = false, pageNum }: { light?: boolean; pageNum: number }) => (
  <View style={light ? s.headerDark : s.header}>
    <View style={s.logoRow}>
      <Image src="/ccd-logo.png" style={s.logo} />
      <Text style={light ? s.headerTitleLight : s.headerTitle}>CCDxSOCIAL</Text>
    </View>
    <Text style={light ? s.pageNumLight : s.pageNum}>{String(pageNum).padStart(2, "0")}</Text>
  </View>
);

const SponsorPDFFull = () => (
  <Document>
    {/* PAGE 1: Cover / Hero */}
    <Page size="A4" style={s.heroBg}>
      <View style={s.logoRow}>
        <Image src="/ccd-logo.png" style={{ width: 40, height: 40 }} />
        <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: COLORS.cream, letterSpacing: 1 }}>
          CCDxSOCIAL
        </Text>
      </View>

      <View style={{ marginTop: 60 }}>
        <Text style={s.heroTitle}>
          BE PART OF{"\n"}SOMETHING{"\n"}DIFFERENT.
        </Text>
        <Text style={s.heroSub}>
          3 shows + 1 grand format show. End of June 2026. Animal lovers and electronic music fans
          {" \u2014 "}together. Own a show, own the series, or show up everywhere.
        </Text>
        <View style={s.chipRow}>
          {["200 pax per show", "2,000+ at finale", "Outdoor pet zone", "Startdawg \u00B7 Merman + more", "Jun\u2013Oct 2026"].map((f) => (
            <View key={f} style={s.chip}>
              <Text style={s.chipText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.heroFooter}>
        <Text style={s.heroFooterText}>SPONSOR DECK \u00B7 CCDxSOCIAL SERIES 2026</Text>
        <Text style={s.heroFooterText}>catscandance.com</Text>
      </View>
    </Page>

    {/* PAGE 2: The Opportunity */}
    <Page size="A4" style={s.page}>
      <PageHeader pageNum={2} />

      <Text style={s.sectionEyebrow}>/ The Opportunity</Text>
      <Text style={s.sectionTitle}>A CROWD THAT{"\n"}ACTUALLY CARES.</Text>
      <Text style={s.sectionBody}>
        The CCDxSocial series brings together two of the most passionate communities in Bangalore:
        animal lovers and electronic music fans. These aren't passive attendees {"\u2014"} they're here for
        something specific, and they spend money on the things they love.
      </Text>
      <Text style={s.sectionBody}>
        Outdoor pet zone from 4PM with activities, vendor market, and a full DJ lineup.
        Approximately 200 people per show, 2,000+ at the grand finale.
        Your brand is not a banner {"\u2014"} it's part of the experience.
      </Text>

      <View style={s.statsGrid}>
        {STATS.map((stat) => (
          <View key={stat.label} style={s.statBox}>
            <Text style={s.statLabel}>{stat.label}</Text>
            <Text style={s.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </Page>

    {/* PAGE 3: The Series */}
    <Page size="A4" style={s.pageDark}>
      <PageHeader light pageNum={3} />

      <Text style={s.sectionEyebrowLight}>/ The Series</Text>
      <Text style={s.sectionTitleLight}>THREE SHOWS.{"\n"}ONE GRAND FINALE.</Text>

      {SHOWS.map((show) => (
        <View key={show.num} style={s.showCard}>
          <View>
            <Text style={s.showNum}>SHOW {show.num}</Text>
            <Text style={s.showName}>{show.name}</Text>
            <Text style={s.showTagline}>{show.tagline}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.showDate}>{show.date}</Text>
            <Text style={s.showCapacity}>~200 pax {"\u00B7"} 4PM{"\u2013"}close</Text>
          </View>
        </View>
      ))}

      <View style={s.megaCard}>
        <View>
          <Text style={s.megaLabel}>SEASON FINALE {"\u00B7"} DATE TBA</Text>
          <Text style={s.megaTitle}>MEGA {"\u2014"} GRAND FORMAT</Text>
          <Text style={s.megaDesc}>
            Full outdoor stage. 2,000+ people. Pet runway. Agility finals. Complete DJ lineup TBA.
            The biggest thing we've ever done.
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.megaStat}>2,000+</Text>
          <Text style={s.megaStatLabel}>Expected</Text>
        </View>
      </View>
    </Page>

    {/* PAGE 4: Sponsor Tiers */}
    <Page size="A4" style={s.page}>
      <PageHeader pageNum={4} />

      <Text style={s.sectionEyebrow}>/ Sponsor Tiers</Text>
      <Text style={s.sectionTitle}>SUPPORT A SHOW.{"\n"}OR THE WHOLE THING.</Text>
      <Text style={s.sectionBody}>
        Pick a single show or back the whole series. Every tier includes real presence {"\u2014"}
        not a logo in a corner. We build the activation with you.
      </Text>

      {TIERS.map((tier) => (
        <View key={tier.name} style={s.tierCardFull} wrap={false}>
          <View style={[s.tierHeaderFull, { backgroundColor: tier.color }]}>
            <Text style={[s.tierNameFull, { color: tier.textColor }]}>{tier.name}</Text>
            <Text style={[s.tierScopeFull, { color: tier.textColor }]}>{tier.scope}</Text>
            <Text style={[s.tierHeadlineFull, { color: tier.textColor }]}>{tier.headline}</Text>
          </View>
          <View style={s.tierBodyFull}>
            <View style={s.tierDeliverablesFull}>
              {tier.deliverables.map((d, i) => (
                <Text key={i} style={s.tierBulletFull}>{"\u2605"} {d}</Text>
              ))}
            </View>
            <Text style={s.tierBestForFull}>Best fit for: {tier.bestFor}</Text>
          </View>
        </View>
      ))}
    </Page>

    {/* PAGE 5: Who Should Sponsor + What You Get */}
    <Page size="A4" style={s.page}>
      <PageHeader pageNum={5} />

      <Text style={s.sectionEyebrow}>/ Who Should Sponsor</Text>
      <Text style={s.sectionTitle}>YOUR BRAND{"\n"}BELONGS HERE.</Text>

      <View style={s.whoGrid}>
        {WHO_SHOULD_SPONSOR.map((item) => (
          <View key={item} style={s.whoItem}>
            <Text style={s.whoText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={[s.sectionEyebrow, { marginTop: 16 }]}>/ What You Get</Text>
      <Text style={[s.sectionTitle, { fontSize: 22 }]}>MORE THAN A LOGO.</Text>
      <Text style={s.sectionBody}>
        Every sponsor is integrated into the experience {"\u2014"} not pasted on top of it.
        We build the activation with you so it actually makes sense in the room.
      </Text>

      {/* Benefits in rows of 2 */}
      {Array.from({ length: Math.ceil(WHAT_YOU_GET.length / 2) }, (_, i) => (
        <View key={i} style={s.benefitRow}>
          {WHAT_YOU_GET.slice(i * 2, i * 2 + 2).map((b) => (
            <View key={b.title} style={s.benefitCard}>
              <Text style={s.benefitTitle}>{b.title}</Text>
              <Text style={s.benefitDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>
      ))}
    </Page>

    {/* PAGE 6: CTA */}
    <Page size="A4" style={s.ctaPage}>
      <Image src="/ccd-logo.png" style={{ width: 48, height: 48, marginBottom: 24 }} />
      <Text style={s.ctaTitle}>READY TO{"\n"}SPONSOR?</Text>
      <Text style={s.ctaBody}>
        Fill in the form and we'll get back to you within 24 hours with the full sponsorship pack.
        All tiers are negotiable {"\u2014"} we'd rather build something that works for both sides.
      </Text>
      <View style={s.ctaBox}>
        <Text style={s.ctaBoxText}>GET THE SPONSOR PACK {"\u2192"}</Text>
      </View>
      <Text style={s.ctaContact}>
        hello@catscandance.com {"\u00B7"} @catscan.dance{"\n"}
        catscandance.com/ccdxsocial/sponsor
      </Text>
    </Page>
  </Document>
);

export default SponsorPDFFull;
