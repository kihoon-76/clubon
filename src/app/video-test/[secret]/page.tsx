import { notFound } from "next/navigation";

import { VideoTestClient } from "./video-test-client";

export const dynamic = "force-dynamic";

export default async function VideoTestPage({
  params,
}: {
  params: Promise<{ secret: string }>;
}) {
  const { secret } = await params;
  if (!process.env.VIDEO_TEST_SECRET || secret !== process.env.VIDEO_TEST_SECRET) {
    notFound();
  }
  return <VideoTestClient secret={secret} />;
}
