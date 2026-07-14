import {
  publicMessageFor,
  toApplicationError,
  type ApplicationErrorCode,
} from "@/lib/actions/errors";

export type ActionSuccess<T> = Readonly<{
  ok: true;
  data: T;
}>;

export type ActionFailure = Readonly<{
  ok: false;
  error: {
    code: ApplicationErrorCode;
    message: string;
  };
}>;

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return { ok: true, data };
}

export function actionFailure(error: unknown): ActionFailure {
  const applicationError = toApplicationError(error);

  return {
    ok: false,
    error: {
      code: applicationError.code,
      message: publicMessageFor(applicationError.code),
    },
  };
}
