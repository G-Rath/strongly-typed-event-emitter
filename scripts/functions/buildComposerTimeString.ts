/**
 * Builds a string representing the given date that's a valid
 * value for the `time` property in a `composer.json` file.
 *
 * The returned string will have the format 'YYYY-MM-DD'.
 *
 * @param {Date} date
 *
 * @return {string}
 */
export default (date: Date): string => {
  const year = date.getFullYear();
  const day = `${date.getDate()}`;
  const month = `${(date.getMonth() + 1)}`;

  return [
    year,
    month.padStart(2, '0'),
    day.padStart(2, '0')
  ].join('-');
};
