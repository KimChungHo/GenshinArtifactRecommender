import React from "react";
import ArtifactRecommenderPage from "./pages/artifact-recommender/ArtifactRecommenderPage";
import ArtifactInfoPage from "./pages/artifact-info/ArtifactInfoPage";

type TabKey = "recommender" | "info";

export default function App(): React.JSX.Element {
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>("recommender");

  const isRecommenderActive: boolean = activeTabKey === "recommender";
  const isInfoActive: boolean = activeTabKey === "info";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[980px] px-4 pt-6">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTabKey("recommender")}
            className={
              isRecommenderActive
                ? "h-10 flex-1 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
                : "h-10 flex-1 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            }
          >
            캐릭터 추천
          </button>
          <button
            type="button"
            onClick={() => setActiveTabKey("info")}
            className={
              isInfoActive
                ? "h-10 flex-1 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
                : "h-10 flex-1 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            }
          >
            성유물 정보
          </button>
        </div>
      </div>

      {isRecommenderActive ? <ArtifactRecommenderPage /> : null}
      {isInfoActive ? <ArtifactInfoPage /> : null}
    </div>
  );
}
