export function validateSteps(log: string) {
  for (let i = 1; i <= 12; i++) {
    if (!log.includes(`STEP ${i}`)) {
      throw new Error(`Missing STEP ${i}`);
    }
  }
}
