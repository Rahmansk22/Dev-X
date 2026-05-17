import fs from 'fs';

export function verifyPackage(pkg: string) {
  if (!fs.existsSync(`node_modules/${pkg}`)) {
    throw new Error(`Package ${pkg} missing`);
  }
}
