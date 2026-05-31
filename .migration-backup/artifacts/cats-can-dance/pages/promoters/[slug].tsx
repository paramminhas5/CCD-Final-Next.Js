import type { GetServerSideProps } from "next";
import PromoterDetail from "@/pages/PromoterDetail";

interface Props { slug: string; }

export default function PromoterDetailRoute({ slug }: Props) {
  return <PromoterDetail slug={slug} />;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => ({
  props: { slug: params!.slug as string },
});
