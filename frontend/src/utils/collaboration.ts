/** Считает уникальных участников по имени в awareness (не число вкладок/соединений). */
export function countAwarenessUsers(
  states: Array<{ clientId: number; user?: { name?: string } }>,
): number {
  const names = new Set<string>();
  for (const state of states) {
    const name = state.user?.name;
    if (typeof name === 'string' && name.trim()) {
      names.add(name.trim());
    }
  }
  return Math.max(names.size, 1);
}
