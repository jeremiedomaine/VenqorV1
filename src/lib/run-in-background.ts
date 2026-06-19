/** Fire-and-forget async work so server actions return before slow I/O (emails, etc.). */
export function runInBackground(task: Promise<unknown>): void {
  void task.catch((err) => {
    console.error("[background]", err);
  });
}
