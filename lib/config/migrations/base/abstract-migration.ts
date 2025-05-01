import is from '@sindresorhus/is';
import type { RenovateConfig } from '../../types';
import type { Migration } from '../types';

export abstract class AbstractMigration implements Migration {
  readonly deprecated: boolean = false;
  abstract readonly propertyName: string | RegExp;
  private readonly originalConfig: RenovateConfig;
  private readonly migratedConfig: RenovateConfig;

  constructor(originalConfig: RenovateConfig, migratedConfig: RenovateConfig) {
    this.originalConfig = originalConfig;
    this.migratedConfig = migratedConfig;
  }

  abstract run(value: unknown, key: string): void;

  protected get<Key extends keyof RenovateConfig>(
    key: Key,
  ): RenovateConfig[Key] {
    return this.migratedConfig[key] ?? this.originalConfig[key];
  }

  protected has<Key extends keyof RenovateConfig>(key: Key): boolean {
    return key in this.originalConfig;
  }

  protected setSafely<Key extends keyof RenovateConfig>(
    key: Key,
    value: RenovateConfig[Key],
  ): void {
    if (!is.string(key)) {
      return;
    }
    let writeLocation = this.migratedConfig;
    const keySplits = key.split('.');
    if (keySplits.length === 2) {
      // Create the parent
      const parentObject = keySplits.shift();
      this.migratedConfig[parentObject!] ??= {};
      writeLocation = this.migratedConfig[parentObject!] as RenovateConfig;
    }
    const keyToWrite = keySplits.pop() as string;
    if (
      is.nullOrUndefined(this.originalConfig[key]) &&
      is.nullOrUndefined(writeLocation[keyToWrite])
    ) {
      writeLocation[keyToWrite] = value;
    }
  }

  protected setHard<Key extends keyof RenovateConfig>(
    key: Key,
    value: RenovateConfig[Key],
  ): void {
    this.migratedConfig[key] = value;
  }

  protected rewrite(value: unknown): void {
    if (!is.string(this.propertyName)) {
      throw new Error();
    }

    this.setHard(this.propertyName, value);
  }

  protected delete(property = this.propertyName): void {
    if (!is.string(property)) {
      throw new Error();
    }

    delete this.migratedConfig[property];
  }
}
