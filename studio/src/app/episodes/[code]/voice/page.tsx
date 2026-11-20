import { redirect } from "next/navigation";
import { Suspense } from "react";

/** Moved into the "voice" module page. */
export default function Page({ params }: PageProps<"/episodes/[code]/voice">) {
  return (
    <Suspense>
      <Go params={params} />
    </Suspense>
  );
}

async function Go({ params }: { params: PageProps<"/episodes/[code]/voice">["params"] }): Promise<null> {
  const { code } = await params;
  redirect(`/episodes/${code}/m/voice`);
}
