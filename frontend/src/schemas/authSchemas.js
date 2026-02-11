import { z } from 'zod';

export const emailSchema = z.object({
    email: z.string()
        .min(1, { message: 'Please enter your email address' })
        .email({ message: 'Please enter a valid email address' })
        .refine((val) => val.endsWith('.edu.pk'), {
            message: 'Only University emails (.edu.pk) are allowed'
        })
});

export const registrationSchema = z.object({
    reg_id: z.string().optional(), // validated conditionally in refine
    name: z.string()
        .min(1, { message: 'Please fill in this field' })
        .regex(/^[a-zA-Z\s]*$/, { message: 'Name can only contain letters and spaces' }),
    password: z.string()
        .min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string()
        .min(1, { message: 'Please fill in this field' }),
    role: z.enum(['Student', 'Teacher', 'HOD', 'PM', 'Admin', 'SuperAdmin']),
    department: z.string().min(1, { message: 'Department is required' }),
    semester: z.string().optional(),
    program_year: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
}).superRefine((data, ctx) => {
    // Registration ID validation dependent on role
    if (!['Teacher', 'HOD', 'PM'].includes(data.role)) {
        if (!data.reg_id || data.reg_id.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please fill in this field",
                path: ["reg_id"]
            });
        } else if (!/^[a-zA-Z0-9]+$/.test(data.reg_id)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Registration ID must be alphanumeric",
                path: ["reg_id"]
            });
        }
    }

    // Semester validation for Student
    if (data.role === 'Student' && !data.semester) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a semester",
            path: ["semester"]
        });
    }

    // Program Year validation for PM
    if (data.role === 'PM' && !data.program_year) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a program year",
            path: ["program_year"]
        });
    }
});
