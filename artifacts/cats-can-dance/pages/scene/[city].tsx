import type { GetStaticPaths, GetStaticProps } from "next";
import SceneCityPage from "@/pages/SceneCityPage";
import { CITY_SCENES } from "@/content/scenes";

interface Props { slug: string; }

export default function CitySceneRoute({ slug }: Props) {
  return <SceneCityPage slug={slug} />;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: CITY_SCENES.map(c => ({ params: { city: c.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => ({
  props: { slug: params!.city as string },
});
