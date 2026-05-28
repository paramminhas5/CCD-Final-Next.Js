import dynamic from "next/dynamic";

const TalentDirectory = dynamic(
  () => import("@/pages/TalentDirectory"),
  { ssr: false, loading: () => null }
);

export default function TalentPage() {
  return <TalentDirectory />;
}
