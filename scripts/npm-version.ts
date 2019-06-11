import packageJson from '../package.json';
import path from 'path';
import addFilesToGit from './functions/addFilesToGit';
import moveChangelogUnreleasedHeaderForVersion from './functions/moveChangelogUnreleasedHeaderForVersion';
import updateChangelogTagLinksForNewVersion from './functions/updateChangelogTagLinksForNewVersion';

if (!process.env.INIT_CWD) {
  throw new Error('you must run this script with npm');
}

const cwd = process.env.INIT_CWD;

/**
 * Script for keeping files surrounding the `package.json` up to date with version increments.
 *
 * This script updates the `CHANGELOG.md` to include the new version in place of [Unreleased].
 * This script updates the `CHANGELOG.md` to include the correct version links & urls.
 *
 * Called by `npm` when `npm version` is run, resulting in a new git commit & version tag.
 */

/**
 * Map of file paths that will be altered in this script.
 *
 * The paths are passed in a call to the {@link addFilesToGit} method
 * at the end of this script, which is required for `npm version` to include the file
 * changes in it's version-bumping commit.
 */
const filePaths = {
  CHANGELOG: path.join(cwd, 'CHANGELOG.md')
};

//#region update CHANGELOG.md [Unreleased] header
console.log(`moving [Unreleased] header in CHANGELOG.md to be ${packageJson.version}...`);
moveChangelogUnreleasedHeaderForVersion(packageJson.version, filePaths.CHANGELOG);
//#endregion
//#region update CHANGELOG.md version header links
console.log('updating tag links in CHANGELOG.md...');
updateChangelogTagLinksForNewVersion(packageJson.version, packageJson.repository.url, filePaths.CHANGELOG);
//#endregion

console.log();
// add all changed files to git, so they'll be committed by npm
addFilesToGit(Object.values(filePaths), cwd);
console.log();
console.log('all done! -- have a nice day :)');
console.log();
