"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProjectForm from "@/modules/home/ui/components/project-form";

export default function NewProjectPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.push("/projects")}
          className="mb-8 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          <p className="mt-2 text-sm text-white/60">
            Describe what you want to build and Dev X will generate the first version.
          </p>
        </div>

        <ProjectForm />
      </div>
    </main>
  );
}
