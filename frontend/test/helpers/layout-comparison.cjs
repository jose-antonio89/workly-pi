function differences(a, b, limit = 2) {
  return Object.keys(a)
    .filter((key) => key !== 'boxShadow')
    .map((key) => {
      const first = a[key],
        second = b[key];
      if (key === 'borderRadius') {
        const radius = (v, box) =>
          Math.min(
            v.includes('%')
              ? (parseFloat(v) * Math.min(box.width, box.height)) / 100
              : parseFloat(v),
            Math.min(box.width, box.height) / 2
          );
        const delta = radius(second, b) - radius(first, a);
        return {
          property: key,
          legacy: first,
          react: second,
          delta,
          divergent: Math.abs(delta) > limit
        };
      }
      if (typeof first === 'number')
        return {
          property: key,
          legacy: first,
          react: second,
          delta: second - first,
          divergent: Math.abs(second - first) > limit
        };
      if (/^-?[\d.]+px$/.test(first) && /^-?[\d.]+px$/.test(second)) {
        if (key === 'borderRadius') return null;
        const delta = parseFloat(second) - parseFloat(first);
        return {
          property: key,
          legacy: first,
          react: second,
          delta,
          divergent: Math.abs(delta) > limit
        };
      }
      const normalize = (v) =>
        key === 'backgroundImage'
          ? v.replaceAll('at 10% 0px,', 'at 10% 0%,')
          : key === 'textAlign' && v === 'start'
            ? 'left'
            : key === 'alignItems' && v === 'normal'
              ? 'stretch'
              : ['gap', 'rowGap', 'columnGap'].includes(key) && v === 'normal'
                ? '0px'
                : v;
      const equal = normalize(first) === normalize(second);
      return {
        property: key,
        legacy: first,
        react: second,
        delta: equal ? '=' : 'different',
        divergent: !equal
      };
    })
    .filter(Boolean);
}
module.exports = { differences };
