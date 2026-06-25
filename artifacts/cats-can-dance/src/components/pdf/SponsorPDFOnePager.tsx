import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { COLORS, TIERS, SHOWS, STATS } from "./sponsorData";

const s = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: 32,
    fontFamily: "Helvetica",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.ink,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 8,
    color: COLORS.ink,
    opacity: 0.6,
    marginTop: 2,
  },
  dateBadge: {
    backgroundColor: COLORS.electricBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Hero
  hero: {
    backgroundColor: COLORS.electricBlue,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: COLORS.ink,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.cream,
    lineHeight: 1.1,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 9,
    color: COLORS.cream,
    opacity: 0.85,
    lineHeight: 1.4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 10,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 7,
    color: COLORS.cream,
    fontFamily: "Helvetica-Bold",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.ink,
    padding: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 6,
    color: COLORS.ink,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 2,
    textTransform: "uppercase",
  },

  // Shows
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.magenta,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  showsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  showBox: {
    flex: 1,
    backgroundColor: COLORS.ink,
    padding: 10,
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  showNum: {
    fontSize: 7,
    color: COLORS.acidYellow,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  showName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.cream,
    marginBottom: 2,
  },
  showDate: {
    fontSize: 7,
    color: COLORS.cream,
    opacity: 0.7,
  },
  megaBox: {
    backgroundColor: COLORS.acidYellow,
    borderWidth: 2,
    borderColor: COLORS.ink,
    padding: 10,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  megaTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },
  megaSub: {
    fontSize: 7,
    color: COLORS.ink,
    opacity: 0.7,
    marginTop: 2,
  },
  megaStat: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },
  megaStatLabel: {
    fontSize: 6,
    color: COLORS.ink,
    opacity: 0.6,
    textAlign: "right",
  },

  // Tiers
  tiersRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  tierCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.ink,
    overflow: "hidden",
  },
  tierHeader: {
    padding: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ink,
  },
  tierName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  tierScope: {
    fontSize: 6,
    opacity: 0.8,
  },
  tierBody: {
    padding: 8,
    backgroundColor: COLORS.white,
  },
  tierBullet: {
    fontSize: 6.5,
    color: COLORS.ink,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  tierBestFor: {
    fontSize: 6,
    color: COLORS.ink,
    opacity: 0.5,
    marginTop: 4,
    fontStyle: "italic",
  },

  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.ink,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: COLORS.ink,
    fontFamily: "Helvetica-Bold",
  },
  footerContact: {
    fontSize: 7,
    color: COLORS.ink,
    opacity: 0.7,
  },
});

const SponsorPDFOnePager = () => (
  <Document>
    <Page size="A4" style={s.page}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <Image src="/ccd-logo.png" style={s.logo} />
          <View>
            <Text style={s.headerTitle}>CCDxSOCIAL</Text>
            <Text style={s.headerSub}>SPONSOR THE SERIES</Text>
          </View>
        </View>
        <View style={s.dateBadge}>
          <Text style={s.dateBadgeText}>JUN \u2013 OCT 2026</Text>
        </View>
      </View>

      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.heroTitle}>BE PART OF SOMETHING DIFFERENT.</Text>
        <Text style={s.heroSub}>
          3 shows + 1 grand format show. Animal lovers and electronic music fans {"\u2014"} together.
          Own a show, own the series, or show up everywhere.
        </Text>
        <View style={s.chipRow}>
          {["200 pax per show", "2,000+ at finale", "Outdoor pet zone", "Jun\u2013Oct 2026"].map((f) => (
            <View key={f} style={s.chip}>
              <Text style={s.chipText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {STATS.slice(0, 4).map((stat) => (
          <View key={stat.label} style={s.statBox}>
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Shows */}
      <Text style={s.sectionLabel}>/ The Series</Text>
      <View style={s.showsRow}>
        {SHOWS.map((show) => (
          <View key={show.num} style={s.showBox}>
            <Text style={s.showNum}>SHOW {show.num}</Text>
            <Text style={s.showName}>{show.name}</Text>
            <Text style={s.showDate}>{show.date}</Text>
          </View>
        ))}
      </View>

      {/* Mega */}
      <View style={s.megaBox}>
        <View>
          <Text style={s.megaTitle}>MEGA {"\u2014"} GRAND FORMAT SHOW</Text>
          <Text style={s.megaSub}>Full outdoor stage. Pet runway. Agility finals. Complete DJ lineup TBA.</Text>
        </View>
        <View>
          <Text style={s.megaStat}>2,000+</Text>
          <Text style={s.megaStatLabel}>Expected</Text>
        </View>
      </View>

      {/* Tiers */}
      <Text style={s.sectionLabel}>/ Sponsor Tiers</Text>
      <View style={s.tiersRow}>
        {TIERS.map((tier) => (
          <View key={tier.name} style={s.tierCard}>
            <View style={[s.tierHeader, { backgroundColor: tier.color }]}>
              <Text style={[s.tierName, { color: tier.textColor }]}>{tier.name}</Text>
              <Text style={[s.tierScope, { color: tier.textColor }]}>{tier.scope}</Text>
            </View>
            <View style={s.tierBody}>
              {tier.deliverables.slice(0, 5).map((d, i) => (
                <Text key={i} style={s.tierBullet}>{"\u2605"} {d}</Text>
              ))}
              {tier.deliverables.length > 5 && (
                <Text style={s.tierBullet}>+ {tier.deliverables.length - 5} more...</Text>
              )}
              <Text style={s.tierBestFor}>Best for: {tier.bestFor}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View>
          <Text style={s.footerText}>READY TO SPONSOR?</Text>
          <Text style={s.footerContact}>hello@catscandance.com {"\u00B7"} @catscan.dance</Text>
        </View>
        <View>
          <Text style={s.footerContact}>catscandance.com/ccdxsocial/sponsor</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default SponsorPDFOnePager;
