import type { GetStaticPaths, GetStaticProps } from "next";
import GenrePage from "@/pages/GenrePage";
import { GENRE_PAGES } from "@/content/scenes";

interface Props { slug: string; }

export default function GenreRoute({ slug }: Props) {
  return <GenrePage slug={slug} />;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: GENRE_PAGES.map(g => ({ params: { genre: g.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => ({
  props: { slug: params!.genre as string },
});
