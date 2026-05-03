import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';

interface DevProfilerProps {
  id: string;
  children: ReactNode;
}

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  console.log(
    `[profiler] ${id} | ${phase} | actual=${actualDuration.toFixed(1)}ms | base=${baseDuration.toFixed(1)}ms`,
  );
};

export function DevProfiler({ id, children }: DevProfilerProps) {
  if (!__DEV__) return <>{children}</>;
  return <Profiler id={id} onRender={onRender}>{children}</Profiler>;
}
