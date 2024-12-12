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

  return +((fahrenheit - 32) * 5 / 9).toFixed(decimals) || undefined;
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

  return +((celsius * 9 / 5) + 32).toFixed(decimals) || undefined;
}