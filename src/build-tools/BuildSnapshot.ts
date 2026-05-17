export interface BuildSnapshot {
  files: Record<string, string>;
  packages: string[];
  env: Record<string, string>;
  timestamp: number;
}
