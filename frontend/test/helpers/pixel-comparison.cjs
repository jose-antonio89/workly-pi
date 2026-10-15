function result(changedPixels, totalPixels, errors = [], maximumPercent = 0.5) {
  if (
    !Number.isFinite(changedPixels) ||
    !Number.isFinite(totalPixels) ||
    totalPixels <= 0 ||
    changedPixels < 0 ||
    changedPixels > totalPixels
  )
    throw new RangeError('Invalid pixel comparison counts');
  const changedPercent = (changedPixels / totalPixels) * 100;
  return { changedPercent, pass: changedPercent <= maximumPercent && errors.length === 0 };
}
module.exports = { result };
