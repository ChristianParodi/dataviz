/**
 * Converts a temperature from Fahrenheit to Celsius.
 *
 * @param {number} fahrenheit - The temperature in Fahrenheit.
 * @param {number} [decimals=2] - The number of decimal places to round the result to.
 * @returns {number} The temperature in Celsius, rounded to the specified number of decimal places.
 */
function toCelsius(fahrenheit, decimals = 2) {
  if (typeof fahrenheit !== 'number' || isNaN(fahrenheit))
    throw new TypeError('Input must be a number');

  return +((fahrenheit - 32) * 5 / 9).toFixed(decimals);
}

/**
 * Converts a temperature from Celsius to Fahrenheit.
 *
 * @param {number} fahrenheit - The temperature in Fahrenheit.
 * @param {number} [decimals=2] - The number of decimal places to round the result to.
 * @returns {number} The temperature in Celsius, rounded to the specified number of decimal places.
 */
function toFahrenheit(celsius, decimals = 2) {
  if (typeof celsius !== 'number' || isNaN(celsius))
    throw new TypeError('Input must be a number');

  return +((celsius * 9 / 5) + 32).toFixed(decimals);
}

/**
 * Computes a density estimation function based on a provided kernel and domain.
 *
 * @function kernelDensityEstimator
 * @param {Function} kernel - The kernel function used to calculate density contributions. It should accept a single number and return a number.
 * @param {number[]} X - An array of domain values for which density estimates will be computed.
 * @returns {Function} A function that takes an array of data values (V) and returns an array of [x, density] pairs, where x is each domain value and density is the mean value computed by applying the kernel over V.
 */
function kernelDensityEstimator(kernel, X) {
  return function (V) {
    return X.map(function (x) {
      return [x, d3.mean(V, function (v) { return kernel(x - v); })];
    });
  };
}

/**
 * Creates an Epanechnikov kernel function.
 *
 * The Epanechnikov kernel is a popular kernel function used in kernel density estimation.
 * It is defined as 0.75 * (1 - (v/k)^2) / k for |v/k| <= 1, and 0 otherwise.
 *
 * @param {number} k - The bandwidth parameter for the kernel function.
 * @returns {function(number): number} A function that takes a value `v` and returns the kernel density estimate.
 */
function kernelEpanechnikov(k) {
  return function (v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}

export { toCelsius, toFahrenheit, kernelDensityEstimator, kernelEpanechnikov };