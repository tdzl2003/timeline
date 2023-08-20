const timeUnit: { [key: string]: number } = {
  d: 24 * 3600 * 1000,
  h: 3600 * 1000,
  m: 60 * 1000,
  s: 1000,
};

export function timeDiff2Str(d: number) {
  const ret: string[] = [];
  for (const k of Object.keys(timeUnit)) {
    const val = timeUnit[k];
    if (d > val) {
      const m = Math.floor(d / val);
      d -= m * val;
      ret.push(`${m}${k}`);
    }
  }
  return ret.join('') || '已到';
}

export function str2TimeDiff(s: string) {
  let ret = 0;
  for (const item of s.matchAll(/(\d+)(d|h|m|s|ms)/g)) {
    ret += Number(item[1]) * timeUnit[item[2]];
  }
  return ret;
}
