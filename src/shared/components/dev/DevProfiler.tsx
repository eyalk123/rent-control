import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';

interface DevProfilerProps {
  id: string;
  children: ReactNode;
  group?: string;
}

type BatchEntry = { actuals: number[]; bases: number[]; phase: string };
const batches = new Map<string, BatchEntry>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushBatches() {
  for (const [key, { actuals, bases, phase }] of batches) {
    const groupId = key.slice(0, key.lastIndexOf('|'));
    const total = actuals.reduce((a, b) => a + b, 0);
    const avg = total / actuals.length;
    const baseTotal = bases.reduce((a, b) => a + b, 0);
    const countStr = actuals.length > 1 ? `×${actuals.length}` : '';
    console.log(
      `[profiler] ${groupId}${countStr} | ${phase} | actual=${total.toFixed(1)}ms avg=${avg.toFixed(1)}ms | base=${baseTotal.toFixed(1)}ms`,
    );
  }
  batches.clear();
  flushTimer = null;
}

const singleRenderer: ProfilerOnRenderCallback = (id, phase, actual, base) => {
  console.log(`[profiler] ${id} | ${phase} | actual=${actual.toFixed(1)}ms | base=${base.toFixed(1)}ms`);
};

const groupRenderers = new Map<string, ProfilerOnRenderCallback>();

function getGroupRenderer(group: string): ProfilerOnRenderCallback {
  if (!groupRenderers.has(group)) {
    groupRenderers.set(group, (_id, phase, actual, base) => {
      const key = `${group}|${phase}`;
      if (!batches.has(key)) batches.set(key, { actuals: [], bases: [], phase });
      const entry = batches.get(key)!;
      entry.actuals.push(actual);
      entry.bases.push(base);
      if (!flushTimer) flushTimer = setTimeout(flushBatches, 0);
    });
  }
  return groupRenderers.get(group)!;
}

export function DevProfiler({ id, children, group }: DevProfilerProps) {
  if (!__DEV__) return <>{children}</>;
  return (
    <Profiler id={id} onRender={group ? getGroupRenderer(group) : singleRenderer}>
      {children}
    </Profiler>
  );
}
