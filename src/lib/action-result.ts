export type ActionResult = {
  error?: string;
};

export function actionError(message: string): ActionResult {
  return { error: message };
}

export function actionOk(): ActionResult {
  return {};
}
