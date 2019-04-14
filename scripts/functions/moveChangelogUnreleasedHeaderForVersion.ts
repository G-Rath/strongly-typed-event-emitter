import fs from 'fs';
import buildComposerTimeString from './buildComposerTimeString';

/**
 * Moves the `[Unreleased]` header in `CHANGELOG.md` up,
 * adding the header for the given version in it's place.
 *
 * @param {string} newVersion the version string to swap the `[Unreleased]` header with.
 * @param {string} changelogPath the path to the `CHANGELOG.md` file.
 */
export default (newVersion: string, changelogPath: string) => {
  const oldChangelogFile = fs.readFileSync(changelogPath).toString();
  const newChangelogFile = oldChangelogFile.replace(
    '## [Unreleased]', [
      '## [Unreleased]',
      null, // there should be a blank line between ## [Unreleased] & the new version header
      `## [${newVersion}] - ${buildComposerTimeString(new Date())}`
    ].join('\n')
  );

  fs.writeFileSync(changelogPath, `${newChangelogFile.trimRight()}\n\n`);
};
