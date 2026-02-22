import ClassyLoader from "@/components/ClassyLoader";

export default function GlobalLoading() {
  return (
    // This wrapper centers the loader on the full screen
    <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
      <ClassyLoader size={80} color="#3b82f6" />
    </div>
  );
}
