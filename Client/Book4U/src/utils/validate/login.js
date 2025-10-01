export const validateLogin = (formData) => {
    let errors = {};

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Email không hợp lệ';
    }

    if (!formData.password || formData.password.length < 6) {
        errors.password = 'Mật khẩu phải có ít nhất 6 từ!';
    }

    return errors;
};
