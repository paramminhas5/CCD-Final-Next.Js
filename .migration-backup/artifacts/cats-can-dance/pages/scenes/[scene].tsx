import type { GetStaticPaths, GetStaticProps } from "next";
import GlobalScenePage from "@/pages/GlobalScenePage";
import { GLOBAL_SCENES } from "@/content/scenes";

interface Props { slug: string; }

export default function GlobalSceneRoute({ slug }: Props) {
  return <GlobalScenePage slug={slug} />;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: GLOBAL_SCENES.map(s => ({ params: { scene: s.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => ({
  props: { slug: params!.scene as string },
});
