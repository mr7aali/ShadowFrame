import { redirect } from "next/navigation";
import { Suspense } from "react";

/** Moved into the "shots" module page. */
export default function Page({ params }: PageProps<"/episodes/[code]/shots">) {
  return (
    <Suspense>
      <Go params={params} />
    </Suspense>
  );
}

async function Go({ params }: { params: PageProps<"/episodes/[code]/shots">["params"] }): Promise<null> {
  const { code } = await params;
  redirect(`/episodes/${code}/m/shots`);
}
