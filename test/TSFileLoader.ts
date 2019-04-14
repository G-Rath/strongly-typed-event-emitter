import fs from 'fs';
import path from 'path';

/**
 * A loader for `TypeScript` files. This includes both `.ts` & `.d.ts` files.
 *
 * Files are lazy-loaded, with their contents being read into cache on first request.
 */
export default class TSFileLoader {
  private _definitionContents = new Map<string, string | undefined>();
  private _definitionFiles = new Map<string, string | undefined>();

  /**
   *
   * @param {string[]} paths
   * @param {Record<string, string>} files
   */
  public constructor({ paths, files }: { paths: string[], files: Record<string, string> }) {
    this._definitionFiles = new Map(
      paths.map(
        folder => fs.readdirSync(folder, { withFileTypes: true })
                    .filter(file => file.isFile() && file.name.endsWith('.d.ts'))
                    .map<[string, string]>(file => [file.name, folder])
      ).reduce((acc, array) => acc.concat(array), [])
    );

    Object.keys(files).forEach(file => this.manuallyAddFile(file, files[file]));
  }

  /**
   * Checks if it's possible to load the contents of a file matching the given `fileName`.
   *
   * @param {string} fileName
   *
   * @return {boolean}
   */
  public isLoadableFile(fileName: string): boolean {
    return this._definitionFiles.has(fileName);
  }

  /**
   * Loads the contents of the file with the given `fileName`.
   *
   * If the file has been loaded before, the contents are returned straight from the cache.
   * Otherwise, the file contents will be read from disk, saved to the cache, and then returned.
   *
   * @param {string} fileName
   *
   * @return {string}
   */
  public loadFile(fileName: string): string {
    const possibleContents = this._definitionContents.get(fileName);

    return possibleContents ? possibleContents : this._cacheFileContents(fileName);
  }

  /**
   * Adds a file with the given `name` & `contents` to the cache manually.
   *
   * This is useful for when you want to add extra files that are not typically covered by a folder path,
   * or want to serve content that is generated manually.
   *
   * @param {string} name
   * @param {string} contents
   */
  public manuallyAddFile(name: string, contents: string) {
    this._definitionFiles.set(name, name);
    this._definitionContents.set(name, contents);
  }

  /**
   * Loads the contents of the given file, saving it to the cache before returning it.
   *
   * @param {string} fileName
   *
   * @return {string}
   * @private
   */
  private _cacheFileContents(fileName: string): string {
    const filePath = this._definitionFiles.get(fileName);

    if (!filePath) {
      throw new Error(`no path to load ${fileName} contents from`);
    }

    const fileContents = fs.readFileSync(path.join(filePath, fileName)).toString();

    this._definitionContents.set(fileName, fileContents);

    return fileContents;
  }
}
