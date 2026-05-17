import { getQueryClient, caller } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ProjectView from "@/modules/projects/ui/views/project-view";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  params: Promise<{ projectId: string }>
}

const Page = async ({ params }: Props) => {
  const { projectId } = await params;

  const queryClient = await getQueryClient();
  // Only prefetch project metadata for faster initial render
  // Wrapped in try-catch: prefetch is best-effort, auth may not be available during SSR
  try {
    await queryClient.prefetchQuery({
      queryKey: ['projects.getOne', { id: projectId }],
      queryFn: () => caller.projects.getOne({ id: projectId }),
    });
  } catch (e) {
    // Silently fail — client will refetch with proper auth
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<p>Error</p>} >
        <Suspense fallback={<p>Loading...</p>}>
          <ProjectView projectId={projectId} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}

export default Page
