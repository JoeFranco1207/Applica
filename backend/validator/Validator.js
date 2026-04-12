import Joi from 'joi';

export const signupValidation = Joi.object({
    email: Joi.string().max(60).email({ tlds: { allow: ['com', 'net'] } }).
    messages({ 'string.email': 'Email must be a valid email address with .com or .net TLD' }).
    required().
    pattern(new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')),
    password: Joi.string().min(6).required().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/),

})

export const LoginValidation = Joi.object({
    email: Joi.string().max(60).email({ tlds: { allow: ['com', 'net'] } }).
    required().messages({ 'string.email': 'Email must be a valid email address with .com or .net TLD' }).
    pattern(new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')),

    password: Joi.string().min(6).required()
});