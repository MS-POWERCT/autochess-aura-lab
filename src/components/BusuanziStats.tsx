import { useEffect, useState } from "react";

function readCount(id: string) {
  return document.getElementById(id)?.textContent?.trim() ?? "";
}

export function BusuanziStats() {
  const [pv, setPv] = useState("");
  const [uv, setUv] = useState("");

  useEffect(() => {
    function sync() {
      const nextPv = readCount("busuanzi_value_site_pv");
      const nextUv = readCount("busuanzi_value_site_uv");
      if (nextPv) setPv(nextPv);
      if (nextUv) setUv(nextUv);
      if (nextPv && nextUv) window.clearInterval(timer);
    }

    const timer = window.setInterval(sync, 200);
    const observer = new MutationObserver(sync);
    const root = document.getElementById("busuanzi-root");
    if (root) observer.observe(root, { subtree: true, childList: true, characterData: true });
    sync();

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, []);

  if (!pv && !uv) return null;

  return (
    <footer className="site-stats">
      {pv ? <span>本站总访问量 {pv} 次</span> : null}
      {pv && uv ? <span className="site-stats-divider">·</span> : null}
      {uv ? <span>本站访客数 {uv} 人</span> : null}
    </footer>
  );
}
