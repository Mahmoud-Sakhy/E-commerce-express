import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: number;
  isOperational?: boolean;
  details?: any;
}

const errorHandler: ErrorRequestHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // إنشاء نسخة من الخطأ لتجنب التعديل على الأصل
  let error = { ...err };
  error.message = err.message;

  // 🔴 تسجيل الخطأ في الـ console (أو يمكن استبداله بـ Winston لاحقًا)
  console.error("🔴 Error:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // 🧩 التعامل مع أنواع محددة من الأخطاء
  if (err.name === "CastError") {
    error = {
      name: "CastError",
      message: "Resource not found",
      statusCode: 404,
      isOperational: true,
    } as HttpError;
  }

  if (err.name === "ValidationError") {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(", ");
    error = {
      name: "ValidationError",
      message,
      statusCode: 400,
      isOperational: true,
    } as HttpError;
  }

  if ((err as any).code === 11000) {
    error = {
      name: "DuplicateKeyError",
      message: "Duplicate field value entered",
      statusCode: 400,
      isOperational: true,
    } as HttpError;
  }

  if (err.name === "JsonWebTokenError") {
    error = {
      name: "JsonWebTokenError",
      message: "Invalid token",
      statusCode: 401,
      isOperational: true,
    } as HttpError;
  }

  if (err.name === "TokenExpiredError") {
    error = {
      name: "TokenExpiredError",
      message: "Token expired",
      statusCode: 401,
      isOperational: true,
    } as HttpError;
  }

  // ⚙️ تحديد الحالة النهائية
  const statusCode = error.statusCode || 500;
  const isOperational =
    error.isOperational !== undefined ? error.isOperational : statusCode < 500;

  // 🧾 إرسال الاستجابة للعميل
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || "Internal server error",
      code: statusCode,
      operational: isOperational,
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
        details: error.details,
      }),
    },
    timestamp: new Date().toISOString(),
  });
};

export default errorHandler;
