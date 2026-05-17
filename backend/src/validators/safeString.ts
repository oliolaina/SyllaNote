import { z } from 'zod';

/** Строка без NUL и прочих управляющих символов (кроме перевода строки/табуляции). */
export function safeString(min: number, max: number) {
  return z
    .string()
    .min(min)
    .max(max)
    .refine((value) => !value.includes('\0'), { message: 'Invalid characters' })
    .refine((value) => !/[\x01-\x08\x0b\x0c\x0e-\x1f]/.test(value), {
      message: 'Invalid characters',
    });
}
